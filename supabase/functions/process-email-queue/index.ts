import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🔄 Processing email queue...");

    // Récupérer les emails en attente
    const { data: queuedEmails, error: fetchError } = await supabase
      .from("email_queue")
      .select(`
        *,
        email_templates (
          template_key,
          subject,
          html_body,
          text_body
        )
      `)
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .order("priority", { ascending: false })
      .order("scheduled_for", { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error("Error fetching queue:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch queue", details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!queuedEmails || queuedEmails.length === 0) {
      console.log("✅ No emails in queue");
      return new Response(
        JSON.stringify({ success: true, message: "No emails to process", processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📧 Found ${queuedEmails.length} emails to process`);

    let successCount = 0;
    let failCount = 0;

    // Traiter chaque email
    for (const email of queuedEmails) {
      try {
        // Marquer comme en traitement
        await supabase
          .from("email_queue")
          .update({ status: "processing" })
          .eq("id", email.id);

        // Préparer les variables pour le template
        const variables = email.template_variables || {};

        // Appeler la fonction send-email
        const sendResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            template_key: email.email_templates?.template_key,
            to_email: email.to_email,
            to_name: email.to_name,
            variables: variables,
            user_id: email.user_id,
            job_id: email.job_id,
          }),
        });

        const sendResult = await sendResponse.json();

        if (sendResponse.ok && sendResult.success) {
          // Marquer comme envoyé
          await supabase
            .from("email_queue")
            .update({
              status: "sent",
              processed_at: new Date().toISOString(),
            })
            .eq("id", email.id);

          successCount++;
          console.log(`✅ Email sent to ${email.to_email}`);
        } else {
          // Incrémenter retry_count et marquer comme échec si max_retries atteint
          const newRetryCount = (email.retry_count || 0) + 1;
          const maxRetries = email.max_retries || 3;

          if (newRetryCount >= maxRetries) {
            await supabase
              .from("email_queue")
              .update({
                status: "failed",
                retry_count: newRetryCount,
                error_message: sendResult.error || "Unknown error",
                processed_at: new Date().toISOString(),
              })
              .eq("id", email.id);
            failCount++;
            console.error(`❌ Email failed permanently for ${email.to_email}: ${sendResult.error}`);
          } else {
            // Réessayer plus tard
            const nextRetry = new Date();
            nextRetry.setMinutes(nextRetry.getMinutes() + (newRetryCount * 5));

            await supabase
              .from("email_queue")
              .update({
                status: "pending",
                retry_count: newRetryCount,
                error_message: sendResult.error || "Unknown error",
                scheduled_for: nextRetry.toISOString(),
              })
              .eq("id", email.id);
            console.warn(`⚠️ Email failed, will retry for ${email.to_email} (attempt ${newRetryCount}/${maxRetries})`);
          }
        }
      } catch (emailError) {
        console.error(`Error processing email ${email.id}:`, emailError);

        // Marquer comme échec
        await supabase
          .from("email_queue")
          .update({
            status: "failed",
            error_message: emailError.message,
            processed_at: new Date().toISOString(),
          })
          .eq("id", email.id);

        failCount++;
      }
    }

    console.log(`✅ Processed ${successCount + failCount} emails (${successCount} success, ${failCount} failed)`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email queue processed",
        processed: successCount + failCount,
        successful: successCount,
        failed: failCount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
