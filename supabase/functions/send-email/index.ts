import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import nodemailer from "npm:nodemailer@6.9.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailRequest {
  to: string;
  to_email?: string; // Alias pour compatibilité frontend
  toName?: string;
  to_name?: string; // Alias pour compatibilité frontend
  subject: string;
  htmlBody?: string;
  html_body?: string; // Alias pour compatibilité frontend
  textBody?: string;
  text_body?: string; // Alias pour compatibilité frontend
  template_key?: string;
  variables?: Record<string, string>;
}

// ============================================================
// SENDGRID API - Envoi via l'API REST SendGrid (v3)
// ============================================================
async function sendViaSendGrid(
  config: any,
  to: string,
  toName: string | undefined,
  subject: string,
  htmlBody: string,
  textBody: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = config.api_key;
  if (!apiKey) {
    throw new Error("SendGrid API key not configured");
  }

  const payload: any = {
    personalizations: [
      {
        to: [{ email: to, name: toName || undefined }],
      },
    ],
    from: {
      email: config.from_email,
      name: config.from_name || "JobGuinée",
    },
    subject,
    content: [
      { type: "text/plain", value: textBody },
      { type: "text/html", value: htmlBody },
    ],
  };

  if (config.reply_to_email) {
    payload.reply_to = { email: config.reply_to_email };
  }

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 202 || response.status === 200) {
    const messageId = response.headers.get("X-Message-Id") || `sg-${Date.now()}`;
    console.log(`✅ SendGrid: Email envoyé à ${to} (ID: ${messageId})`);
    return { success: true, messageId };
  }

  const errorBody = await response.text();
  console.error(`❌ SendGrid error (${response.status}):`, errorBody);
  throw new Error(`SendGrid API error: ${response.status} - ${errorBody}`);
}

// ============================================================
// RESEND API - Envoi via l'API Resend
// ============================================================
async function sendViaResend(
  config: any,
  to: string,
  toName: string | undefined,
  subject: string,
  htmlBody: string,
  textBody: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = config.api_key;
  if (!apiKey) {
    throw new Error("Resend API key not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${config.from_name || "JobGuinée"} <${config.from_email}>`,
      to: toName ? [`${toName} <${to}>`] : [to],
      subject,
      html: htmlBody,
      text: textBody,
      reply_to: config.reply_to_email || undefined,
    }),
  });

  const result = await response.json();

  if (response.ok && result.id) {
    console.log(`✅ Resend: Email envoyé à ${to} (ID: ${result.id})`);
    return { success: true, messageId: result.id };
  }

  console.error(`❌ Resend error:`, result);
  throw new Error(`Resend API error: ${result.message || JSON.stringify(result)}`);
}

// ============================================================
// MAILGUN API - Envoi via l'API Mailgun
// ============================================================
async function sendViaMailgun(
  config: any,
  to: string,
  toName: string | undefined,
  subject: string,
  htmlBody: string,
  textBody: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = config.api_key;
  const domain = config.api_domain;
  if (!apiKey || !domain) {
    throw new Error("Mailgun API key or domain not configured");
  }

  const formData = new FormData();
  formData.append("from", `${config.from_name || "JobGuinée"} <${config.from_email}>`);
  formData.append("to", toName ? `${toName} <${to}>` : to);
  formData.append("subject", subject);
  formData.append("text", textBody);
  formData.append("html", htmlBody);
  if (config.reply_to_email) {
    formData.append("h:Reply-To", config.reply_to_email);
  }

  const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`api:${apiKey}`)}`,
    },
    body: formData,
  });

  const result = await response.json();

  if (response.ok && result.id) {
    console.log(`✅ Mailgun: Email envoyé à ${to} (ID: ${result.id})`);
    return { success: true, messageId: result.id };
  }

  console.error(`❌ Mailgun error:`, result);
  throw new Error(`Mailgun API error: ${result.message || JSON.stringify(result)}`);
}

// ============================================================
// BREVO (Sendinblue) API - Envoi via l'API Brevo
// ============================================================
async function sendViaBrevo(
  config: any,
  to: string,
  toName: string | undefined,
  subject: string,
  htmlBody: string,
  textBody: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = config.api_key;
  if (!apiKey) {
    throw new Error("Brevo API key not configured");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: config.from_name || "JobGuinée", email: config.from_email },
      to: [{ email: to, name: toName || undefined }],
      subject,
      htmlContent: htmlBody,
      textContent: textBody,
      replyTo: config.reply_to_email ? { email: config.reply_to_email } : undefined,
    }),
  });

  const result = await response.json();

  if (response.ok && result.messageId) {
    console.log(`✅ Brevo: Email envoyé à ${to} (ID: ${result.messageId})`);
    return { success: true, messageId: result.messageId };
  }

  console.error(`❌ Brevo error:`, result);
  throw new Error(`Brevo API error: ${result.message || JSON.stringify(result)}`);
}

// ============================================================
// SMTP - Envoi via nodemailer (Hostinger, Gmail, etc.)
// ============================================================
async function sendViaSMTP(
  config: any,
  to: string,
  toName: string | undefined,
  subject: string,
  htmlBody: string,
  textBody: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const transporter = nodemailer.createTransport({
    host: config.smtp_host,
    port: config.smtp_port,
    secure: config.smtp_secure,
    auth: {
      user: config.smtp_user,
      pass: config.smtp_password,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
  });

  const info = await transporter.sendMail({
    from: `${config.from_name || "JobGuinée"} <${config.from_email}>`,
    to: toName ? `${toName} <${to}>` : to,
    subject,
    text: textBody,
    html: htmlBody,
  });

  console.log(`✅ SMTP: Email envoyé à ${to} (ID: ${info.messageId})`);
  return { success: true, messageId: info.messageId };
}

// ============================================================
// TEMPLATE ENGINE - Résolution des templates depuis la DB
// ============================================================
async function resolveTemplate(
  supabase: any,
  templateKey: string,
  variables: Record<string, string>
): Promise<{ subject: string; htmlBody: string; textBody: string } | null> {
  const { data: template, error } = await supabase
    .from("email_templates")
    .select("*")
    .eq("template_key", templateKey)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !template) {
    console.warn(`⚠️ Template "${templateKey}" non trouvé`);
    return null;
  }

  let subject = template.subject || "";
  let htmlBody = template.html_body || template.body_html || "";
  let textBody = template.text_body || template.body_text || "";

  // Remplacer les variables {{ variable_name }}
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
    subject = subject.replace(regex, value);
    htmlBody = htmlBody.replace(regex, value);
    textBody = textBody.replace(regex, value);
  }

  return { subject, htmlBody, textBody };
}

// ============================================================
// MAIN HANDLER
// ============================================================
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const emailRequest: EmailRequest = await req.json();

    // Normaliser les noms de champs (supporte snake_case et camelCase)
    const to = emailRequest.to || emailRequest.to_email || "";
    const toName = emailRequest.toName || emailRequest.to_name;
    let subject = emailRequest.subject || "";
    let htmlBody = emailRequest.htmlBody || emailRequest.html_body || "";
    let textBody = emailRequest.textBody || emailRequest.text_body || "";

    // Si un template_key est fourni, résoudre le template
    if (emailRequest.template_key) {
      const templateResult = await resolveTemplate(
        supabase,
        emailRequest.template_key,
        emailRequest.variables || {}
      );
      if (templateResult) {
        subject = templateResult.subject || subject;
        htmlBody = templateResult.htmlBody || htmlBody;
        textBody = templateResult.textBody || textBody;
      }
    }

    if (!to || !subject || !htmlBody) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: to/to_email, subject, htmlBody/html_body (or valid template_key)",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Générer le textBody si absent
    if (!textBody) {
      textBody = htmlBody.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    }

    // Récupérer la configuration du fournisseur email actif (n'importe quel type)
    const { data: config, error: configError } = await supabase
      .from("email_provider_config")
      .select("*")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (configError || !config) {
      console.error("❌ Aucune configuration email active trouvée:", configError);
      throw new Error(
        "Aucune configuration email active. Configurez un fournisseur dans Admin → Email."
      );
    }

    console.log(`📧 Envoi email via ${config.provider_type} à ${to}`);

    // Router vers le bon fournisseur
    let result: { success: boolean; messageId?: string; error?: string };

    switch (config.provider_type) {
      case "sendgrid":
        result = await sendViaSendGrid(config, to, toName, subject, htmlBody, textBody);
        break;
      case "resend":
        result = await sendViaResend(config, to, toName, subject, htmlBody, textBody);
        break;
      case "mailgun":
        result = await sendViaMailgun(config, to, toName, subject, htmlBody, textBody);
        break;
      case "brevo":
        result = await sendViaBrevo(config, to, toName, subject, htmlBody, textBody);
        break;
      case "smtp":
        result = await sendViaSMTP(config, to, toName, subject, htmlBody, textBody);
        break;
      default:
        throw new Error(`Fournisseur email non supporté: ${config.provider_type}`);
    }

    // Loguer l'envoi dans email_logs (best effort)
    try {
      await supabase.from("email_logs").insert({
        to_email: to,
        to_name: toName,
        subject,
        provider: config.provider_type,
        status: "sent",
        message_id: result.messageId,
        template_key: emailRequest.template_key || null,
      });
    } catch (logError) {
      console.warn("⚠️ Impossible de loguer l'email:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        messageId: result.messageId,
        provider: config.provider_type,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error sending email:", error);

    // Loguer l'échec (best effort)
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase.from("email_logs").insert({
        status: "failed",
        error_message: error.message,
      });
    } catch (_) {
      // Silent fail
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
