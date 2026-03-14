import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Escape HTML special characters to prevent XSS in email content
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Escape regex special characters for safe placeholder matching
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const MAX_RETRIES = 3;
const CONCURRENCY = 10; // parallel emails per batch
const MAX_RUNTIME_MS = 120_000; // stop 30s before Edge Function 150s timeout
const FETCH_TIMEOUT_MS = 15_000; // per-email send timeout

// Helper: fetch with timeout via AbortController
async function fetchWithTimeout(url: string, opts: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (req: Request) => {
  const functionStart = Date.now();
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Recover orphaned "processing" emails stuck for > 5 minutes (from crashed invocations)
    await supabase
      .from("email_queue")
      .update({ status: "pending" })
      .eq("status", "processing")
      .lt("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());

    // Also auto-retry previously failed/retrying emails (up to MAX_RETRIES)
    console.log("Retrying failed emails...");
    await supabase
      .from("email_queue")
      .update({ status: "pending" })
      .in("status", ["failed", "retrying"])
      .lt("retry_count", MAX_RETRIES)
      .lte("scheduled_for", new Date().toISOString());

    // Atomically claim pending emails to prevent duplicate processing
    // Uses RPC to do UPDATE ... WHERE status='pending' ... RETURNING *
    console.log("Claiming pending emails...");

    const { data: claimedEmails, error: claimError } = await supabase
      .rpc("claim_pending_emails", { p_limit: 100 });

    // Fallback: if the RPC doesn't exist, use the old select + update approach
    let pendingEmails = claimedEmails;
    let fetchError = claimError;

    if (claimError) {
      console.warn("claim_pending_emails RPC not available, using fallback:", claimError.message);
      const { data, error } = await supabase
        .from("email_queue")
        .select("*")
        .eq("status", "pending")
        .lte("scheduled_for", new Date().toISOString())
        .order("priority", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(100);
      pendingEmails = data;
      fetchError = error;
    }

    console.log("Fetch result:", { count: pendingEmails?.length, error: fetchError });

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      throw fetchError;
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending emails to process", count: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: Array<{ id: string; status: string; email: string; error?: string }> = [];

    // Process emails in parallel batches with deadline awareness
    async function processOneEmail(email: any): Promise<{ id: string; status: string; email: string; error?: string }> {
      const emailStartTime = Date.now();
      try {
        // Mark as processing (idempotent if already claimed by RPC)
        const { data: claimed, error: claimErr } = await supabase
          .from("email_queue")
          .update({ status: "processing" })
          .eq("id", email.id)
          .in("status", ["pending", "processing"])
          .select("id")
          .maybeSingle();

        if (claimErr || !claimed) {
          return { id: email.id, status: "skipped", email: email.to_email };
        }

        let htmlBody: string;
        let textBody: string;
        let subject: string;
        let templateKey: string | null = null;

        // Support raw emails (no template_id) — used by notification/communication services
        const vars = email.template_variables || {};
        if (!email.template_id && vars._raw_subject) {
          subject = String(vars._raw_subject);
          htmlBody = String(vars._raw_html_body || '');
          textBody = String(vars._raw_text_body || '');
          templateKey = String(vars._template_key || 'raw_email');
        } else {
          const { data: template } = await supabase
            .from("email_templates")
            .select("*")
            .eq("id", email.template_id)
            .single();

          if (!template) {
            throw new Error("Template not found");
          }

          htmlBody = template.html_body;
          textBody = template.text_body;
          subject = template.subject;
          templateKey = template.template_key;

          if (email.template_variables) {
            Object.entries(email.template_variables).forEach(([key, value]) => {
              if (key.startsWith('_')) return;
              const safeKey = escapeRegex(`{{${key}}}`);
              const regex = new RegExp(safeKey, "g");
              const safeValue = escapeHtml(String(value));
              const rawValue = String(value);
              htmlBody = htmlBody.replace(regex, safeValue);
              textBody = textBody.replace(regex, rawValue);
              subject = subject.replace(regex, rawValue);
            });
          }
        }

        const sendResponse = await fetchWithTimeout(`${supabaseUrl}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            to: email.to_email,
            toName: email.to_name,
            subject,
            htmlBody,
            textBody,
          }),
        }, FETCH_TIMEOUT_MS);

        const sendResult = await sendResponse.json();

        if (!sendResponse.ok) {
          throw new Error(sendResult.error || "Failed to send email");
        }

        const latencyMs = Date.now() - emailStartTime;

        await supabase
          .from("email_queue")
          .update({ status: "sent", processed_at: new Date().toISOString() })
          .eq("id", email.id);

        // Observability — fire-and-forget
        supabase.from("email_events").insert({
          email_queue_id: email.id,
          event_type: "sent",
          recipient_email: email.to_email,
          template_key: templateKey,
          provider: sendResult.provider || "default",
          status: "sent",
          latency_ms: latencyMs,
          metadata: { messageId: sendResult.messageId },
        }).then(() => {}).catch(() => {});

        supabase.from("email_logs").insert({
          recipient_email: email.to_email,
          recipient_id: email.user_id,
          email_type: templateKey || "transactional",
          template_code: templateKey,
          subject,
          body_text: textBody,
          body_html: htmlBody,
          provider: sendResult.provider || "default",
          status: "delivered",
          sent_at: new Date().toISOString(),
          provider_message_id: sendResult.messageId,
          metadata: { queueId: email.id },
        }).then(() => {}).catch(() => {});

        return { id: email.id, status: "sent", email: email.to_email };
      } catch (error: any) {
        const failLatencyMs = Date.now() - emailStartTime;
        const newRetryCount = (email.retry_count || 0) + 1;
        const failStatus = newRetryCount < MAX_RETRIES ? "retrying" : "failed";

        await supabase
          .from("email_queue")
          .update({
            status: failStatus,
            retry_count: newRetryCount,
            error_message: error.message,
            processed_at: new Date().toISOString(),
          })
          .eq("id", email.id);

        supabase.from("email_events").insert({
          email_queue_id: email.id,
          event_type: failStatus,
          recipient_email: email.to_email,
          template_key: email.template_key || null,
          status: failStatus,
          error_message: error.message,
          latency_ms: failLatencyMs,
          metadata: { retry_count: newRetryCount },
        }).then(() => {}).catch(() => {});

        supabase.from("email_logs").insert({
          recipient_email: email.to_email,
          recipient_id: email.user_id,
          email_type: email.template_key || "transactional",
          template_code: email.template_key || "unknown",
          subject: email.subject || "Error",
          body_text: "",
          body_html: "",
          provider: "default",
          status: "failed",
          error_message: error.message,
          sent_at: new Date().toISOString(),
          metadata: { queueId: email.id, retry_count: newRetryCount },
        }).then(() => {}).catch(() => {});

        return { id: email.id, status: "failed", email: email.to_email, error: error.message };
      }
    }

    // Process in parallel batches of CONCURRENCY, with deadline check
    for (let i = 0; i < pendingEmails.length; i += CONCURRENCY) {
      // Deadline check — stop if we're running out of time
      if (Date.now() - functionStart > MAX_RUNTIME_MS) {
        console.warn(`Deadline reached after ${results.length} emails, stopping. ${pendingEmails.length - i} remaining.`);
        // Release unclaimed emails back to pending
        const remainingIds = pendingEmails.slice(i).map((e: any) => e.id);
        if (remainingIds.length > 0) {
          await supabase
            .from("email_queue")
            .update({ status: "pending" })
            .in("id", remainingIds)
            .eq("status", "processing");
        }
        break;
      }

      const batch = pendingEmails.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.allSettled(batch.map(processOneEmail));

      for (const r of batchResults) {
        if (r.status === "fulfilled") {
          results.push(r.value);
        } else {
          results.push({ id: "unknown", status: "failed", email: "unknown", error: r.reason?.message });
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: "Email processing completed",
        processed: results.length,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing email queue:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
