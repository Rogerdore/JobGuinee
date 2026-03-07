import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SITE_URL = "https://www.jobguinee.com";
const UNSUBSCRIBE_URL = `${SITE_URL}/unsubscribe`;
const FROM_DOMAIN = "jobguinee-pro.com";
const CONTACT_EMAIL = `contact@${FROM_DOMAIN}`;

interface EmailRequest {
  to: string;
  to_email?: string; // Alias pour compatibilité frontend
  toName?: string;
  to_name?: string; // Alias pour compatibilité frontend
  subject: string;
  htmlBody?: string;
  html_body?: string; // Alias pour compatibilité frontend
  textBody?: string;
<<<<<<< HEAD
  text_body?: string; // Alias pour compatibilité frontend
  template_key?: string;
  variables?: Record<string, string>;
=======
  category?: string;
}

function buildUnsubscribeFooter(recipientEmail: string): string {
  const encodedEmail = encodeURIComponent(recipientEmail);
  return `
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:32px;border-top:1px solid #e2e8f0;">
  <tr>
    <td style="padding:20px 0;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;color:#94a3b8;line-height:1.6;">
      <p style="margin:0 0 8px 0;">Vous recevez cet email car vous avez un compte sur JobGuinée.</p>
      <p style="margin:0 0 4px 0;">JobGuinée &mdash; Conakry, Guinée</p>
      <p style="margin:0;">
        <a href="${UNSUBSCRIBE_URL}?email=${encodedEmail}" style="color:#64748b;text-decoration:underline;">Se désabonner</a>
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <a href="${SITE_URL}/privacy" style="color:#64748b;text-decoration:underline;">Politique de confidentialité</a>
      </p>
    </td>
  </tr>
</table>`;
}

function wrapInFullHtml(content: string, recipientEmail: string): string {
  const footer = buildUnsubscribeFooter(recipientEmail);
  const isFullHtml = content.trimStart().toLowerCase().startsWith("<!doctype") ||
    content.trimStart().toLowerCase().startsWith("<html");

  if (isFullHtml) {
    const bodyCloseIndex = content.lastIndexOf("</body>");
    if (bodyCloseIndex !== -1) {
      return content.slice(0, bodyCloseIndex) + footer + content.slice(bodyCloseIndex);
    }
    return content + footer;
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>JobGuinée</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8fafc;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding:32px 40px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 24px 40px;">
              ${footer}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/td>/gi, " ")
    .replace(/<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi, "$2 ($1)")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function sendViaSendGrid(
  config: Record<string, unknown>,
  emailRequest: EmailRequest
): Promise<{ messageId: string }> {
  const apiKey = config.api_key as string;
  if (!apiKey) throw new Error("SendGrid API key not configured");

  const htmlBody = wrapInFullHtml(emailRequest.htmlBody, emailRequest.to);
  const textBody = emailRequest.textBody || htmlToText(emailRequest.htmlBody);
  const unsubscribeLink = `${UNSUBSCRIBE_URL}?email=${encodeURIComponent(emailRequest.to)}`;
  const messageId = `jobguinee-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const payload = {
    personalizations: [
      {
        to: emailRequest.toName
          ? [{ email: emailRequest.to, name: emailRequest.toName }]
          : [{ email: emailRequest.to }],
        subject: emailRequest.subject,
      },
    ],
    from: {
      email: config.from_email as string,
      name: config.from_name as string,
    },
    reply_to: {
      email: CONTACT_EMAIL,
      name: config.from_name as string,
    },
    content: [
      { type: "text/plain", value: textBody },
      { type: "text/html", value: htmlBody },
    ],
    headers: {
      "List-Unsubscribe": `<${unsubscribeLink}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      "X-Mailer": "JobGuinee-Mailer/2.0",
      "Message-ID": `<${messageId}@${FROM_DOMAIN}>`,
      "X-Entity-Ref-ID": messageId,
    },
    mail_settings: {
      sandbox_mode: { enable: false },
    },
    tracking_settings: {
      click_tracking: { enable: false, enable_text: false },
      open_tracking: { enable: false },
      subscription_tracking: { enable: false },
    },
    ...(emailRequest.category
      ? { categories: [emailRequest.category, "jobguinee"] }
      : {}),
  };

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SendGrid error ${response.status}: ${errorText}`);
  }

  const sgMessageId = response.headers.get("X-Message-Id") || messageId;
  return { messageId: sgMessageId };
}

async function sendViaSmtp(
  config: Record<string, unknown>,
  emailRequest: EmailRequest
): Promise<{ messageId: string }> {
  const nodemailer = await import("npm:nodemailer@6.9.8");

  const transporter = nodemailer.default.createTransport({
    host: config.smtp_host as string,
    port: config.smtp_port as number,
    secure: config.smtp_secure as boolean,
    auth: {
      user: config.smtp_user as string,
      pass: config.smtp_password as string,
    },
    pool: false,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });

  const htmlBody = wrapInFullHtml(emailRequest.htmlBody, emailRequest.to);
  const textBody = emailRequest.textBody || htmlToText(emailRequest.htmlBody);
  const unsubscribeLink = `${UNSUBSCRIBE_URL}?email=${encodeURIComponent(emailRequest.to)}`;
  const messageId = `${Date.now()}.${Math.random().toString(36).slice(2)}@${FROM_DOMAIN}`;

  const info = await transporter.sendMail({
    messageId: `<${messageId}>`,
    from: `"${config.from_name}" <${config.from_email}>`,
    replyTo: `"Support JobGuinée" <${CONTACT_EMAIL}>`,
    to: emailRequest.toName
      ? `"${emailRequest.toName}" <${emailRequest.to}>`
      : emailRequest.to,
    subject: emailRequest.subject,
    text: textBody,
    html: htmlBody,
    headers: {
      "List-Unsubscribe": `<${unsubscribeLink}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      "X-Mailer": "JobGuinee-Mailer/2.0",
      "Precedence": "bulk",
    },
  });

  return { messageId: info.messageId };
>>>>>>> ddf5518560d0e6e4159ed7f2c0ee6e684b9e257a
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
<<<<<<< HEAD

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
=======
    const { to, subject, htmlBody } = emailRequest;
>>>>>>> ddf5518560d0e6e4159ed7f2c0ee6e684b9e257a

    if (!to || !subject || !htmlBody) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: to/to_email, subject, htmlBody/html_body (or valid template_key)",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

<<<<<<< HEAD
    // Générer le textBody si absent
    if (!textBody) {
      textBody = htmlBody.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    }

    // Récupérer la configuration du fournisseur email actif (n'importe quel type)
=======
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return new Response(
        JSON.stringify({ error: "Invalid recipient email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

>>>>>>> ddf5518560d0e6e4159ed7f2c0ee6e684b9e257a
    const { data: config, error: configError } = await supabase
      .from("email_provider_config")
      .select("*")
      .eq("is_active", true)
<<<<<<< HEAD
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
=======
      .maybeSingle();

    if (configError || !config) {
      console.error("No active email provider config found:", configError);
      throw new Error("No active email provider configuration found");
    }

    let result: { messageId: string };
    const providerType = config.provider_type as string;

    console.log(`[send-email] provider=${providerType} to=${to} subject="${subject}"`);

    if (providerType === "sendgrid") {
      result = await sendViaSendGrid(config, emailRequest);
    } else if (providerType === "smtp") {
      result = await sendViaSmtp(config, emailRequest);
    } else {
      throw new Error(`Unsupported email provider type: ${providerType}`);
    }

    console.log(`[send-email] sent successfully messageId=${result.messageId}`);
>>>>>>> ddf5518560d0e6e4159ed7f2c0ee6e684b9e257a

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        messageId: result.messageId,
<<<<<<< HEAD
        provider: config.provider_type,
=======
        provider: providerType,
>>>>>>> ddf5518560d0e6e4159ed7f2c0ee6e684b9e257a
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
<<<<<<< HEAD
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
=======
    console.error("[send-email] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
>>>>>>> ddf5518560d0e6e4159ed7f2c0ee6e684b9e257a
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
