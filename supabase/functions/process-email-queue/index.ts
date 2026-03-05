import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
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

    console.log("Fetching pending emails...");

    const { data: pendingEmails, error: fetchError } = await supabase
      .from("email_queue")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(10);

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

    const results = [];

    for (const email of pendingEmails) {
      try {
        console.log(`Processing email ${email.id} to ${email.to_email}`);

        await supabase
          .from("email_queue")
          .update({ status: "processing" })
          .eq("id", email.id);

        const { data: template } = await supabase
          .from("email_templates")
          .select("*")
          .eq("id", email.template_id)
          .single();

        if (!template) {
          throw new Error("Template not found");
        }

        let htmlBody = template.html_body;
        let textBody = template.text_body;
        let subject = template.subject;

        if (email.template_variables) {
          Object.entries(email.template_variables).forEach(([key, value]) => {
            const placeholder = `{{${key}}}`;
            htmlBody = htmlBody.replace(new RegExp(placeholder, "g"), String(value));
            textBody = textBody.replace(new RegExp(placeholder, "g"), String(value));
            subject = subject.replace(new RegExp(placeholder, "g"), String(value));
          });
        }

        console.log(`Calling send-email for ${email.to_email}`);

        const sendResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
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
        });

        const sendResult = await sendResponse.json();
        console.log(`Send result for ${email.to_email}:`, sendResult);

        if (!sendResponse.ok) {
          throw new Error(sendResult.error || "Failed to send email");
        }

        await supabase
          .from("email_queue")
          .update({
            status: "sent",
            processed_at: new Date().toISOString(),
          })
          .eq("id", email.id);

        await supabase.from("email_logs").insert({
          recipient_email: email.to_email,
          recipient_id: email.user_id,
          email_type: "welcome",
          template_code: template.template_key,
          subject,
          body_text: textBody,
          body_html: htmlBody,
          provider: "hostinger",
          status: "delivered",
          sent_at: new Date().toISOString(),
          provider_message_id: sendResult.messageId,
          metadata: { queueId: email.id },
        });

        console.log(`Successfully sent email to ${email.to_email}`);
        results.push({ id: email.id, status: "sent", email: email.to_email });
      } catch (error) {
        console.error(`Error processing email ${email.id}:`, error);

        await supabase
          .from("email_queue")
          .update({
            status: "failed",
            retry_count: (email.retry_count || 0) + 1,
            error_message: error.message,
            processed_at: new Date().toISOString(),
          })
          .eq("id", email.id);

        await supabase.from("email_logs").insert({
          recipient_email: email.to_email,
          recipient_id: email.user_id,
          email_type: "welcome",
          template_code: "unknown",
          subject: "Error",
          body_text: "",
          body_html: "",
          provider: "hostinger",
          status: "failed",
          error_message: error.message,
          sent_at: new Date().toISOString(),
          metadata: { queueId: email.id },
        });

        results.push({ id: email.id, status: "failed", email: email.to_email, error: error.message });
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
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
