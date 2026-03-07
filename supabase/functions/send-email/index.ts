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
  toName?: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
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
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const emailRequest: EmailRequest = await req.json();
    const { to, subject, htmlBody } = emailRequest;

    if (!to || !subject || !htmlBody) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, htmlBody" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return new Response(
        JSON.stringify({ error: "Invalid recipient email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: config, error: configError } = await supabase
      .from("email_provider_config")
      .select("*")
      .eq("is_active", true)
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
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
