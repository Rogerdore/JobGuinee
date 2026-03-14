import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SITE_URL = "https://jobguinee-pro.com";
const CONCURRENCY = 10; // parallel sends per batch
const FETCH_TIMEOUT_MS = 15_000;

// Fetch with timeout
async function fetchWithTimeout(url: string, opts: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

interface ProcessRequest {
  communication_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { communication_id }: ProcessRequest = await req.json();
    if (!communication_id) {
      return new Response(
        JSON.stringify({ error: "communication_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[process-admin-comm] Starting communication ${communication_id}`);

    // 1. Fetch the communication
    const { data: comm, error: commError } = await supabase
      .from("admin_communications")
      .select("*")
      .eq("id", communication_id)
      .single();

    if (commError || !comm) {
      throw new Error(`Communication not found: ${commError?.message || "unknown"}`);
    }

    if (comm.status !== "sending") {
      return new Response(
        JSON.stringify({ error: `Communication status is '${comm.status}', expected 'sending'` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const channels = comm.channels_json as Record<string, any>;
    const filters = comm.filters_json as Record<string, any>;

    // 2. Get matching users based on filters
    const users = await fetchAudienceUsers(supabase, filters);
    console.log(`[process-admin-comm] Found ${users.length} matching users`);

    if (users.length === 0) {
      await supabase
        .from("admin_communications")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          total_recipients: 0,
          total_sent: 0,
        })
        .eq("id", communication_id);

      return new Response(
        JSON.stringify({ message: "No recipients found", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Respond immediately, process emails in background
    // @ts-ignore EdgeRuntime.waitUntil is available in Supabase Edge Runtime
    EdgeRuntime.waitUntil(processEmails(supabase, supabaseUrl, supabaseServiceKey, communication_id, comm, channels, users));

    return new Response(
      JSON.stringify({
        message: "Communication accepted, processing in background",
        total_recipients: users.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[process-admin-comm] Fatal error:", error.message);

    // Try to mark communication as failed
    try {
      const { communication_id } = await req.clone().json();
      if (communication_id) {
        await supabase
          .from("admin_communications")
          .update({ status: "failed" })
          .eq("id", communication_id);
      }
    } catch (_) {
      // ignore
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ============================================================
// Background email processing
// ============================================================
async function processEmails(
  supabase: any,
  supabaseUrl: string,
  supabaseServiceKey: string,
  communication_id: string,
  comm: any,
  channels: Record<string, any>,
  users: any[]
) {
  let totalSent = 0;
  let totalFailed = 0;
  let totalExcluded = 0;

  try {
    for (const [channelName, channelConfig] of Object.entries(channels)) {
      if (!channelConfig?.enabled) continue;

      console.log(`[process-admin-comm] Processing channel: ${channelName}, ${users.length} users`);

      // Process users in parallel batches of CONCURRENCY
      for (let i = 0; i < users.length; i += CONCURRENCY) {
        const batch = users.slice(i, i + CONCURRENCY);
        const batchResults = await Promise.allSettled(
          batch.map(async (user: any) => {
            let status = "pending";
            let exclusionReason: string | null = null;

            if (channelName === "email") {
              if (!user.email) {
                return { status: "excluded", reason: "no_email", user };
              }

              const emailHtml = buildEmailHtml(channelConfig.content, user, comm.title);
              const sendResponse = await fetchWithTimeout(
                `${supabaseUrl}/functions/v1/send-email`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${supabaseServiceKey}`,
                  },
                  body: JSON.stringify({
                    to: user.email,
                    toName: user.full_name || undefined,
                    subject: channelConfig.subject || comm.title,
                    htmlBody: emailHtml,
                  }),
                },
                FETCH_TIMEOUT_MS
              );

              if (!sendResponse.ok) {
                const err = await sendResponse.text();
                throw new Error(`send-email failed: ${err}`);
              }

              return { status: "sent", user };
            } else if (channelName === "notification") {
              return { status: "notification", user };
            } else if (channelName === "sms") {
              if (!user.phone) return { status: "excluded", reason: "no_phone", user };
              const renderedSms = renderContent(channelConfig.content, user);
              const smsApiUrl = Deno.env.get("SMS_API_URL");
              const smsApiKey = Deno.env.get("SMS_API_KEY");
              const smsSenderName = Deno.env.get("SMS_SENDER_NAME") || "JobGuinee";
              if (!smsApiUrl || !smsApiKey) return { status: "excluded", reason: "sms_provider_not_configured", user };
              const smsResponse = await fetchWithTimeout(smsApiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${smsApiKey}` },
                body: JSON.stringify({ to: user.phone, from: smsSenderName, message: renderedSms }),
              }, FETCH_TIMEOUT_MS);
              if (!smsResponse.ok) throw new Error(`SMS send failed: ${await smsResponse.text()}`);
              return { status: "sent", user };
            } else if (channelName === "whatsapp") {
              if (!user.phone) return { status: "excluded", reason: "no_phone", user };
              const renderedWa = renderContent(channelConfig.content, user);
              const waApiUrl = Deno.env.get("WHATSAPP_API_URL");
              const waApiToken = Deno.env.get("WHATSAPP_API_TOKEN");
              const waPhoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
              if (!waApiUrl || !waApiToken) return { status: "excluded", reason: "whatsapp_provider_not_configured", user };
              const waResponse = await fetchWithTimeout(
                waApiUrl.replace("{phone_number_id}", waPhoneNumberId || ""),
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${waApiToken}` },
                  body: JSON.stringify({ messaging_product: "whatsapp", to: user.phone.replace(/[^\d]/g, ""), type: "text", text: { body: renderedWa } }),
                },
                FETCH_TIMEOUT_MS
              );
              if (!waResponse.ok) throw new Error(`WhatsApp send failed: ${await waResponse.text()}`);
              return { status: "sent", user };
            }
            return { status: "excluded", reason: "unknown_channel", user };
          })
        );

        // Process batch results: record messages and tally
        const messagesInserts: any[] = [];
        const notificationInserts: any[] = [];

        for (let j = 0; j < batchResults.length; j++) {
          const r = batchResults[j];
          const user = batch[j];

          if (r.status === "fulfilled") {
            const val = r.value;
            if (val.status === "sent") {
              totalSent++;
              messagesInserts.push({
                communication_id, user_id: user.id, channel: channelName,
                content_rendered: channelConfig.content || "", subject: channelConfig.subject || null,
                status: "sent",
              });
            } else if (val.status === "excluded") {
              totalExcluded++;
              messagesInserts.push({
                communication_id, user_id: user.id, channel: channelName,
                content_rendered: channelConfig.content || "", subject: channelConfig.subject || null,
                status: "excluded", exclusion_reason: val.reason,
              });
            } else if (val.status === "notification") {
              // Batch notification inserts instead of one-by-one
              notificationInserts.push({
                user_id: user.id,
                type: "info",
                title: comm.title,
                message: (channelConfig.content || "").replace(/<[^>]*>/g, "").slice(0, 500),
                link: channelConfig.link || null,
              });
              totalSent++;
              messagesInserts.push({
                communication_id, user_id: user.id, channel: channelName,
                content_rendered: channelConfig.content || "", subject: channelConfig.subject || null,
                status: "sent",
              });
            }
          } else {
            totalFailed++;
            messagesInserts.push({
              communication_id, user_id: user.id, channel: channelName,
              content_rendered: channelConfig.content || "", subject: channelConfig.subject || null,
              status: "failed", error_message: r.reason?.message || "Unknown error",
            });
          }
        }

        // Batch insert messages and notifications
        if (messagesInserts.length > 0) {
          await supabase.from("admin_communication_messages").insert(messagesInserts);
        }
        if (notificationInserts.length > 0) {
          await supabase.from("notifications").insert(notificationInserts);
        }
      }
    }

    // Update communication status
    await supabase
      .from("admin_communications")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        total_recipients: users.length,
        total_sent: totalSent,
        total_failed: totalFailed,
        total_excluded: totalExcluded,
      })
      .eq("id", communication_id);

    console.log(
      `[process-admin-comm] Completed: sent=${totalSent}, failed=${totalFailed}, excluded=${totalExcluded}`
    );
  } catch (fatalErr: any) {
    console.error("[process-admin-comm] Background processing fatal error:", fatalErr.message);
    await supabase
      .from("admin_communications")
      .update({ status: "failed" })
      .eq("id", communication_id);
  }
}

// ============================================================
// HELPER: Fetch audience users matching filters
// ============================================================
async function fetchAudienceUsers(
  supabase: any,
  filters: Record<string, any>
): Promise<any[]> {
  const PAGE_SIZE = 500;
  const allUsers: any[] = [];
  let offset = 0;

  // Paginated fetch to avoid Supabase default 1000-row limit
  while (true) {
    let query = supabase
      .from("profiles")
      .select("id, email, full_name, user_type, profile_completion_percentage, phone, region, city")
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (filters.user_types && filters.user_types.length > 0) {
      query = query.in("user_type", filters.user_types);
    }
    if (filters.min_completion != null && filters.min_completion > 0) {
      query = query.gte("profile_completion_percentage", filters.min_completion);
    }
    if (filters.max_completion != null && filters.max_completion < 100) {
      query = query.lte("profile_completion_percentage", filters.max_completion);
    }
    if (filters.region) {
      query = query.eq("region", filters.region);
    }
    if (filters.city) {
      query = query.eq("city", filters.city);
    }
    if (filters.date_from) {
      query = query.gte("created_at", filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte("created_at", filters.date_to);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[process-admin-comm] Error fetching audience:", error);
      throw error;
    }
    if (!data || data.length === 0) break;

    allUsers.push(...data);
    if (data.length < PAGE_SIZE) break; // last page
    offset += PAGE_SIZE;
  }

  // Backfill emails from auth.users for profiles missing email (paginated)
  const usersWithoutEmail = allUsers.filter((u: any) => !u.email);
  if (usersWithoutEmail.length > 0) {
    const missingIds = new Set(usersWithoutEmail.map((u: any) => u.id));
    const emailMap = new Map<string, string>();
    let page = 1;
    while (true) {
      const { data: authPage } = await supabase.auth.admin.listUsers({ page, perPage: 500 });
      if (!authPage?.users || authPage.users.length === 0) break;
      for (const au of authPage.users) {
        if (missingIds.has(au.id) && au.email) {
          emailMap.set(au.id, au.email);
        }
      }
      if (authPage.users.length < 500) break;
      page++;
    }
    for (const user of allUsers) {
      if (!user.email) {
        user.email = emailMap.get(user.id) || null;
      }
    }
  }

  return allUsers;
}

// ============================================================
// HELPER: Replace template variables in content
// ============================================================
function renderContent(content: string, user: any): string {
  let rendered = content;
  rendered = rendered.replace(/\{\{\s*prenom\s*\}\}/g, user.full_name?.split(" ")[0] || "");
  rendered = rendered.replace(/\{\{\s*nom\s*\}\}/g, user.full_name || "");
  rendered = rendered.replace(/\{\{\s*email\s*\}\}/g, user.email || "");
  rendered = rendered.replace(/\{\{\s*telephone\s*\}\}/g, user.phone || "");
  rendered = rendered.replace(/\{\{\s*role\s*\}\}/g, user.user_type || "");
  rendered = rendered.replace(
    /\{\{\s*lien_profil\s*\}\}/g,
    `${SITE_URL}/profile`
  );
  rendered = rendered.replace(
    /\{\{\s*lien_site\s*\}\}/g,
    SITE_URL
  );
  return rendered;
}

// ============================================================
// HELPER: Build email HTML with JobGuinée logo header
// ============================================================
function buildEmailHtml(
  content: string,
  user: any,
  title: string
): string {
  const rendered = renderContent(content, user);

  // Detect full HTML templates (rich emails with logo, CTA, etc.) — send as-is
  const trimmed = rendered.trimStart();
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
    return rendered;
  }

  // Plain text content: wrap in a basic table
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
  <tr>
    <td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#334155;">
      ${rendered}
    </td>
  </tr>
</table>`;
}
