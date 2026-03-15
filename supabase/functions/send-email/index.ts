import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SITE_URL = "https://jobguinee-pro.com";
const UNSUBSCRIBE_URL = `${SITE_URL}/unsubscribe`;
const FROM_DOMAIN = "jobguinee-pro.com";
const CONTACT_EMAIL = `contact@${FROM_DOMAIN}`;

// ============================================================
// TYPES
// ============================================================
interface EmailRequest {
  to: string;
  to_email?: string;
  toName?: string;
  to_name?: string;
  subject: string;
  htmlBody?: string;
  html_body?: string;
  textBody?: string;
  text_body?: string;
  template_key?: string;
  variables?: Record<string, string>;
  category?: string;
}

// ============================================================
// HTML HELPERS
// ============================================================
function buildUnsubscribeFooter(recipientEmail: string): string {
  const encodedEmail = encodeURIComponent(recipientEmail);
  return `
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:32px;border-top:1px solid #e2e8f0;">
  <tr>
    <td style="padding:20px 0;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;color:#94a3b8;line-height:1.6;">
      <p style="margin:0 0 8px 0;">Vous recevez cet email car vous avez un compte sur JobGuin&eacute;e.</p>
      <p style="margin:0 0 4px 0;">JobGuin&eacute;e &mdash; Conakry, Guin&eacute;e</p>
      <p style="margin:0;">
        <a href="${UNSUBSCRIBE_URL}?email=${encodedEmail}" target="_blank" rel="noopener" style="color:#64748b;text-decoration:underline;">Se d&eacute;sabonner</a>
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <a href="${SITE_URL}/privacy" target="_blank" rel="noopener" style="color:#64748b;text-decoration:underline;">Politique de confidentialit&eacute;</a>
      </p>
    </td>
  </tr>
</table>`;
}

function addTargetBlankToLinks(html: string): string {
  // Add target="_blank" to all <a> tags that don't already have it
  return html.replace(/<a\s+(?![^>]*target=)/gi, '<a target="_blank" rel="noopener" ');
}

function wrapInFullHtml(content: string, recipientEmail: string): string {
  const footer = buildUnsubscribeFooter(recipientEmail);
  const isFullHtml =
    content.trimStart().toLowerCase().startsWith("<!doctype") ||
    content.trimStart().toLowerCase().startsWith("<html");

  if (isFullHtml) {
    let html = content;
    // Ensure viewport meta exists for mobile
    if (!html.includes('name="viewport"') && !html.includes("name='viewport'")) {
      html = html.replace(
        /<head>/i,
        '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">'
      );
    }
    // Ensure apple disable message reformatting
    if (!html.includes("x-apple-disable-message-reformatting")) {
      html = html.replace(
        /<head>/i,
        '<head>\n  <meta name="x-apple-disable-message-reformatting">'
      );
    }
    // Add target="_blank" to all links
    html = addTargetBlankToLinks(html);
    const bodyCloseIndex = html.lastIndexOf("</body>");
    if (bodyCloseIndex !== -1) {
      return html.slice(0, bodyCloseIndex) + footer + html.slice(bodyCloseIndex);
    }
    return html + footer;
  }

  // Add target="_blank" to all links in content fragment
  const safeContent = addTargetBlankToLinks(content);

  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>JobGuin&eacute;e</title>
</head>
<body style="margin:0;padding:0;word-spacing:normal;background:#f8fafc;">
  <div role="article" aria-roledescription="email" lang="fr" style="text-size-adjust:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8fafc;">
      <tr>
        <td align="center" style="padding:24px 10px;">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td align="center" style="padding:20px 28px 16px 28px;border-bottom:1px solid #f1f5f9;">
                <a href="${SITE_URL}" target="_blank" rel="noopener" style="text-decoration:none;display:inline-block;">
                  <img src="${SITE_URL}/logo_jobguinee.png" alt="JobGuin&eacute;e" width="180" height="auto" style="display:block;max-width:180px;height:auto;border:0;" />
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px;font-family:Arial,Helvetica,sans-serif;">
                ${safeContent}
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 24px 28px;">
                ${footer}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
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
    .replace(/&eacute;/g, "\u00e9")
    .replace(/&mdash;/g, "\u2014")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ============================================================
// SENDGRID
// ============================================================
async function sendViaSendGrid(
  config: any,
  to: string,
  toName: string | undefined,
  subject: string,
  htmlBody: string,
  textBody: string,
  category?: string
): Promise<{ messageId: string }> {
  const apiKey = config.api_key;
  if (!apiKey) throw new Error("SendGrid API key not configured");

  const wrappedHtml = wrapInFullHtml(htmlBody, to);
  const finalText = textBody || htmlToText(htmlBody);
  const unsubscribeLink = `${UNSUBSCRIBE_URL}?email=${encodeURIComponent(to)}`;
  const messageId = `jobguinee-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const payload: any = {
    personalizations: [
      {
        to: toName ? [{ email: to, name: toName }] : [{ email: to }],
        subject,
      },
    ],
    from: {
      email: config.from_email,
      name: config.from_name || "JobGuinee",
    },
    reply_to: {
      email: config.reply_to_email || CONTACT_EMAIL,
      name: config.from_name || "JobGuinee",
    },
    content: [
      { type: "text/plain", value: finalText },
      { type: "text/html", value: wrappedHtml },
    ],
    headers: {
      "List-Unsubscribe": `<${unsubscribeLink}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      "X-Mailer": "JobGuinee-Mailer/2.0",
      "Message-ID": `<${messageId}@${FROM_DOMAIN}>`,
      "X-Entity-Ref-ID": messageId,
    },
    mail_settings: { sandbox_mode: { enable: false } },
    tracking_settings: {
      click_tracking: { enable: false, enable_text: false },
      open_tracking: { enable: false },
      subscription_tracking: { enable: false },
    },
  };

  if (category) {
    payload.categories = [category, "jobguinee"];
  }

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok && response.status !== 202) {
    const errorText = await response.text();
    throw new Error(`SendGrid error ${response.status}: ${errorText}`);
  }

  const sgMessageId = response.headers.get("X-Message-Id") || messageId;
  console.log(`[send-email] SendGrid OK to=${to} msgId=${sgMessageId}`);
  return { messageId: sgMessageId };
}

// ============================================================
// RESEND
// ============================================================
async function sendViaResend(
  config: any,
  to: string,
  toName: string | undefined,
  subject: string,
  htmlBody: string,
  textBody: string
): Promise<{ messageId: string }> {
  const apiKey = config.api_key;
  if (!apiKey) throw new Error("Resend API key not configured");

  const wrappedHtml = wrapInFullHtml(htmlBody, to);
  const finalText = textBody || htmlToText(htmlBody);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${config.from_name || "JobGuinee"} <${config.from_email}>`,
      to: toName ? [`${toName} <${to}>`] : [to],
      subject,
      html: wrappedHtml,
      text: finalText,
      reply_to: config.reply_to_email || CONTACT_EMAIL,
    }),
  });

  const result = await response.json();
  if (response.ok && result.id) {
    console.log(`[send-email] Resend OK to=${to} msgId=${result.id}`);
    return { messageId: result.id };
  }

  throw new Error(`Resend error: ${result.message || JSON.stringify(result)}`);
}

// ============================================================
// MAILGUN
// ============================================================
async function sendViaMailgun(
  config: any,
  to: string,
  toName: string | undefined,
  subject: string,
  htmlBody: string,
  textBody: string
): Promise<{ messageId: string }> {
  const apiKey = config.api_key;
  const domain = config.api_domain;
  if (!apiKey || !domain) throw new Error("Mailgun API key or domain not configured");

  const wrappedHtml = wrapInFullHtml(htmlBody, to);
  const finalText = textBody || htmlToText(htmlBody);

  const formData = new FormData();
  formData.append("from", `${config.from_name || "JobGuinee"} <${config.from_email}>`);
  formData.append("to", toName ? `${toName} <${to}>` : to);
  formData.append("subject", subject);
  formData.append("text", finalText);
  formData.append("html", wrappedHtml);
  if (config.reply_to_email) formData.append("h:Reply-To", config.reply_to_email);

  const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`api:${apiKey}`)}` },
    body: formData,
  });

  const result = await response.json();
  if (response.ok && result.id) {
    console.log(`[send-email] Mailgun OK to=${to} msgId=${result.id}`);
    return { messageId: result.id };
  }

  throw new Error(`Mailgun error: ${result.message || JSON.stringify(result)}`);
}

// ============================================================
// BREVO (Sendinblue)
// ============================================================
async function sendViaBrevo(
  config: any,
  to: string,
  toName: string | undefined,
  subject: string,
  htmlBody: string,
  textBody: string
): Promise<{ messageId: string }> {
  const apiKey = config.api_key;
  if (!apiKey) throw new Error("Brevo API key not configured");

  const wrappedHtml = wrapInFullHtml(htmlBody, to);
  const finalText = textBody || htmlToText(htmlBody);

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { name: config.from_name || "JobGuinee", email: config.from_email },
      to: [{ email: to, name: toName || undefined }],
      subject,
      htmlContent: wrappedHtml,
      textContent: finalText,
      replyTo: config.reply_to_email ? { email: config.reply_to_email } : undefined,
    }),
  });

  const result = await response.json();
  if (response.ok && result.messageId) {
    console.log(`[send-email] Brevo OK to=${to} msgId=${result.messageId}`);
    return { messageId: result.messageId };
  }

  throw new Error(`Brevo error: ${result.message || JSON.stringify(result)}`);
}

// ============================================================
// SMTP (nodemailer)
// ============================================================
async function sendViaSMTP(
  config: any,
  to: string,
  toName: string | undefined,
  subject: string,
  htmlBody: string,
  textBody: string
): Promise<{ messageId: string }> {
  const nodemailer = await import("npm:nodemailer@6.9.8");

  const transporter = nodemailer.default.createTransport({
    host: config.smtp_host,
    port: config.smtp_port,
    secure: config.smtp_secure,
    auth: { user: config.smtp_user, pass: config.smtp_password },
    pool: false,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
  });

  const wrappedHtml = wrapInFullHtml(htmlBody, to);
  const finalText = textBody || htmlToText(htmlBody);
  const unsubscribeLink = `${UNSUBSCRIBE_URL}?email=${encodeURIComponent(to)}`;
  const messageId = `${Date.now()}.${Math.random().toString(36).slice(2)}@${FROM_DOMAIN}`;

  const info = await transporter.sendMail({
    messageId: `<${messageId}>`,
    from: `"${config.from_name || "JobGuinee"}" <${config.from_email}>`,
    replyTo: `"Support JobGuinee" <${config.reply_to_email || CONTACT_EMAIL}>`,
    to: toName ? `"${toName}" <${to}>` : to,
    subject,
    text: finalText,
    html: wrappedHtml,
    headers: {
      "List-Unsubscribe": `<${unsubscribeLink}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      "X-Mailer": "JobGuinee-Mailer/2.0",
      Precedence: "bulk",
    },
  });

  console.log(`[send-email] SMTP OK to=${to} msgId=${info.messageId}`);
  return { messageId: info.messageId };
}

// ============================================================
// TEMPLATE ENGINE
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
    console.warn(`[send-email] Template "${templateKey}" not found`);
    return null;
  }

  let subject = template.subject || "";
  let htmlBody = template.html_body || template.body_html || "";
  let textBody = template.text_body || template.body_text || "";

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

    const raw: EmailRequest = await req.json();

    // Normalize field names (support both camelCase and snake_case)
    const to = raw.to || raw.to_email || "";
    const toName = raw.toName || raw.to_name;
    let subject = raw.subject || "";
    let htmlBody = raw.htmlBody || raw.html_body || "";
    let textBody = raw.textBody || raw.text_body || "";
    const category = raw.category;

    // Resolve template if template_key provided
    if (raw.template_key) {
      const tpl = await resolveTemplate(supabase, raw.template_key, raw.variables || {});
      if (tpl) {
        subject = tpl.subject || subject;
        htmlBody = tpl.htmlBody || htmlBody;
        textBody = tpl.textBody || textBody;
      }
    }

    if (!to || !subject || !htmlBody) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: to, subject, htmlBody (or valid template_key)",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return new Response(
        JSON.stringify({ error: "Invalid recipient email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate textBody if missing
    if (!textBody) {
      textBody = htmlToText(htmlBody);
    }

    // Get active email provider config
    const { data: config, error: configError } = await supabase
      .from("email_provider_config")
      .select("*")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (configError || !config) {
      console.error("[send-email] No active email provider config:", configError);
      throw new Error("No active email provider configuration found");
    }

    const providerType = config.provider_type as string;
    console.log(`[send-email] provider=${providerType} to=${to} subject="${subject}"`);

    // Route to the correct provider
    let result: { messageId: string };

    switch (providerType) {
      case "sendgrid":
        result = await sendViaSendGrid(config, to, toName, subject, htmlBody, textBody, category);
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
        throw new Error(`Unsupported email provider: ${providerType}`);
    }

    // Log send (best effort)
    try {
      await supabase.from("email_logs").insert({
        recipient_email: to,
        subject,
        provider: providerType,
        status: "sent",
        email_type: "custom",
        template_code: raw.template_key || null,
        sent_at: new Date().toISOString(),
      });
    } catch (logErr) {
      console.warn("[send-email] Failed to log email:", logErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        messageId: result.messageId,
        provider: providerType,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[send-email] Error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
