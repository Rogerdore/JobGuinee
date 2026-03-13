import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SITE_URL = "https://jobguinee-pro.com";

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

    let totalSent = 0;
    let totalFailed = 0;
    let totalExcluded = 0;

    // 3. Process each channel
    for (const [channelName, channelConfig] of Object.entries(channels)) {
      if (!channelConfig?.enabled) continue;

      console.log(`[process-admin-comm] Processing channel: ${channelName}`);

      for (const user of users) {
        try {
          let status = "pending";
          let exclusionReason: string | null = null;

          if (channelName === "email") {
            if (!user.email) {
              status = "excluded";
              exclusionReason = "no_email";
              totalExcluded++;
            } else {
              // Build email HTML with logo
              const emailHtml = buildEmailHtml(
                channelConfig.content,
                user,
                comm.title
              );

              // Call send-email directly for reliability
              const sendResponse = await fetch(
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
                }
              );

              if (sendResponse.ok) {
                status = "sent";
                totalSent++;
              } else {
                const err = await sendResponse.text();
                throw new Error(`send-email failed: ${err}`);
              }
            }
          } else if (channelName === "notification") {
            // Insert in-app notification
            const { error: notifError } = await supabase
              .from("notifications")
              .insert({
                user_id: user.id,
                type: "info",
                title: comm.title,
                message: (channelConfig.content || "").slice(0, 500),
                link: channelConfig.link || null,
              });

            if (notifError) {
              throw new Error(`Notification insert failed: ${notifError.message}`);
            }
            status = "sent";
            totalSent++;
          } else if (channelName === "sms" || channelName === "whatsapp") {
            // SMS and WhatsApp not yet connected to a provider
            status = "excluded";
            exclusionReason = `${channelName}_provider_not_configured`;
            totalExcluded++;
          }

          // Record individual message
          await supabase.from("admin_communication_messages").insert({
            communication_id,
            user_id: user.id,
            channel: channelName,
            content_rendered: channelConfig.content || "",
            subject: channelConfig.subject || null,
            status,
            exclusion_reason: exclusionReason,
          });
        } catch (err: any) {
          console.error(
            `[process-admin-comm] Error for user ${user.id} on ${channelName}:`,
            err.message
          );
          totalFailed++;

          await supabase.from("admin_communication_messages").insert({
            communication_id,
            user_id: user.id,
            channel: channelName,
            content_rendered: channelConfig.content || "",
            subject: channelConfig.subject || null,
            status: "failed",
            error_message: err.message,
          });
        }
      }
    }

    // 4. Update communication status
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

    return new Response(
      JSON.stringify({
        message: "Communication processed",
        total_recipients: users.length,
        total_sent: totalSent,
        total_failed: totalFailed,
        total_excluded: totalExcluded,
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
// HELPER: Fetch audience users matching filters
// ============================================================
async function fetchAudienceUsers(
  supabase: any,
  filters: Record<string, any>
): Promise<any[]> {
  let query = supabase
    .from("profiles")
    .select("id, email, full_name, user_type, profile_completion_percentage, phone, region, city");

  // Filter by user types
  if (filters.user_types && filters.user_types.length > 0) {
    query = query.in("user_type", filters.user_types);
  }

  // Filter by minimum profile completion
  if (filters.min_completion && filters.min_completion > 0) {
    query = query.gte("profile_completion_percentage", filters.min_completion);
  }

  // Filter by region
  if (filters.region) {
    query = query.eq("region", filters.region);
  }

  // Filter by city
  if (filters.city) {
    query = query.eq("city", filters.city);
  }

  // Date range filter on account creation
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

  // Get emails from auth.users for users whose profile doesn't have email
  if (data && data.length > 0) {
    const usersWithoutEmail = data.filter((u: any) => !u.email);
    if (usersWithoutEmail.length > 0) {
      const { data: authUsers } = await supabase.auth.admin.listUsers({
        perPage: 1000,
      });

      if (authUsers?.users) {
        const emailMap = new Map(
          authUsers.users.map((u: any) => [u.id, u.email])
        );
        for (const user of data) {
          if (!user.email) {
            user.email = emailMap.get(user.id) || null;
          }
        }
      }
    }
  }

  return data || [];
}

// ============================================================
// HELPER: Build email HTML with JobGuinée logo header
// ============================================================
function buildEmailHtml(
  content: string,
  user: any,
  title: string
): string {
  // Replace template variables in content
  let rendered = content;
  rendered = rendered.replace(/\{\{\s*prenom\s*\}\}/g, user.full_name?.split(" ")[0] || "");
  rendered = rendered.replace(/\{\{\s*nom\s*\}\}/g, user.full_name || "");
  rendered = rendered.replace(/\{\{\s*email\s*\}\}/g, user.email || "");
  rendered = rendered.replace(/\{\{\s*role\s*\}\}/g, user.user_type || "");
  rendered = rendered.replace(
    /\{\{\s*lien_profil\s*\}\}/g,
    `${SITE_URL}/profile`
  );
  rendered = rendered.replace(
    /\{\{\s*lien_site\s*\}\}/g,
    SITE_URL
  );

  // Return rendered content (logo is added by send-email wrapInFullHtml)
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
  <tr>
    <td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#334155;">
      ${rendered}
    </td>
  </tr>
</table>`;
}
