import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import nodemailer from "npm:nodemailer@6.9.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SITE_URL = "https://www.jobguinee.com";
const UNSUBSCRIBE_URL = `${SITE_URL}/unsubscribe`;
const FROM_DOMAIN = "jobguinee-pro.com";

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
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;border-top:1px solid #e2e8f0;">
  <tr>
    <td style="padding:20px 0;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;color:#94a3b8;line-height:1.6;">
      <p style="margin:0 0 8px 0;">Vous recevez cet email car vous avez un compte sur JobGuinée.</p>
      <p style="margin:0;">
        JobGuinée — Conakry, Guinée &nbsp;|&nbsp;
        <a href="${UNSUBSCRIBE_URL}?email=${encodedEmail}" style="color:#64748b;text-decoration:underline;">Se désabonner</a>
        &nbsp;|&nbsp;
        <a href="${SITE_URL}/privacy" style="color:#64748b;text-decoration:underline;">Politique de confidentialité</a>
      </p>
    </td>
  </tr>
</table>`;
}

function injectFooterIntoHtml(html: string, recipientEmail: string): string {
  const footer = buildUnsubscribeFooter(recipientEmail);
  const bodyCloseIndex = html.lastIndexOf("</body>");
  if (bodyCloseIndex !== -1) {
    return html.slice(0, bodyCloseIndex) + footer + html.slice(bodyCloseIndex);
  }
  return html + footer;
}

async function sendViaSendGrid(
  config: Record<string, unknown>,
  emailRequest: EmailRequest
): Promise<{ messageId: string }> {
  const apiKey = config.api_key as string;
  if (!apiKey) throw new Error("SendGrid API key not configured");

  const htmlWithFooter = injectFooterIntoHtml(emailRequest.htmlBody, emailRequest.to);
  const textBody = emailRequest.textBody ||
    emailRequest.htmlBody.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  const payload: Record<string, unknown> = {
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
      email: `contact@${FROM_DOMAIN}`,
      name: config.from_name as string,
    },
    content: [
      { type: "text/plain", value: textBody },
      { type: "text/html", value: htmlWithFooter },
    ],
    headers: {
      "List-Unsubscribe": `<${UNSUBSCRIBE_URL}?email=${encodeURIComponent(emailRequest.to)}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      "X-Entity-Ref-ID": `jobguinee-${Date.now()}`,
    },
    tracking_settings: {
      click_tracking: { enable: false },
      open_tracking: { enable: false },
    },
  };

  if (emailRequest.category) {
    (payload as Record<string, unknown>).categories = [emailRequest.category, "jobguinee"];
  }

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

  const messageId = response.headers.get("X-Message-Id") || `sg-${Date.now()}`;
  return { messageId };
}

async function sendViaSmtp(
  config: Record<string, unknown>,
  emailRequest: EmailRequest
): Promise<{ messageId: string }> {
  const transporter = nodemailer.createTransport({
    host: config.smtp_host as string,
    port: config.smtp_port as number,
    secure: config.smtp_secure as boolean,
    auth: {
      user: config.smtp_user as string,
      pass: config.smtp_password as string,
    },
  });

  const htmlWithFooter = injectFooterIntoHtml(emailRequest.htmlBody, emailRequest.to);
  const textBody = emailRequest.textBody ||
    emailRequest.htmlBody.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  const info = await transporter.sendMail({
    from: `${config.from_name} <${config.from_email}>`,
    replyTo: `contact@${FROM_DOMAIN}`,
    to: emailRequest.toName
      ? `${emailRequest.toName} <${emailRequest.to}>`
      : emailRequest.to,
    subject: emailRequest.subject,
    text: textBody,
    html: htmlWithFooter,
    headers: {
      "List-Unsubscribe": `<${UNSUBSCRIBE_URL}?email=${encodeURIComponent(emailRequest.to)}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });

  return { messageId: info.messageId };
}

async function sendViaMailgun(
  config: Record<string, unknown>,
  emailRequest: EmailRequest
): Promise<{ messageId: string }> {
  const apiKey = config.api_key as string;
  const domain = config.mailgun_domain as string;
  if (!apiKey || !domain) throw new Error("Mailgun API key or domain not configured");

  const htmlWithFooter = injectFooterIntoHtml(emailRequest.htmlBody, emailRequest.to);
  const textBody = emailRequest.textBody ||
    emailRequest.htmlBody.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  const formData = new FormData();
  formData.append("from", `${config.from_name} <${config.from_email}>`);
  formData.append("h:Reply-To", `contact@${FROM_DOMAIN}`);
  formData.append(
    "to",
    emailRequest.toName
      ? `${emailRequest.toName} <${emailRequest.to}>`
      : emailRequest.to
  );
  formData.append("subject", emailRequest.subject);
  formData.append("html", htmlWithFooter);
  formData.append("text", textBody);
  formData.append("h:List-Unsubscribe", `<${UNSUBSCRIBE_URL}?email=${encodeURIComponent(emailRequest.to)}>`);
  formData.append("h:List-Unsubscribe-Post", "List-Unsubscribe=One-Click");

  const response = await fetch(
    `https://api.mailgun.net/v3/${domain}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`api:${apiKey}`)}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mailgun error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return { messageId: data.id || `mg-${Date.now()}` };
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

    console.log(`Sending email via provider: ${providerType} to: ${to}`);

    if (providerType === "sendgrid") {
      result = await sendViaSendGrid(config, emailRequest);
    } else if (providerType === "smtp") {
      result = await sendViaSmtp(config, emailRequest);
    } else if (providerType === "mailgun") {
      result = await sendViaMailgun(config, emailRequest);
    } else {
      throw new Error(`Unsupported email provider type: ${providerType}`);
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
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
