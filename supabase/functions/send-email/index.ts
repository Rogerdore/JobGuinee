import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailRequest {
  template_key?: string;
  to_email: string;
  to_name?: string;
  subject?: string;
  html_body?: string;
  text_body?: string;
  variables?: Record<string, string>;
  user_id?: string;
  job_id?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const emailRequest: EmailRequest = await req.json();

    if (!emailRequest.to_email) {
      return new Response(
        JSON.stringify({ error: "to_email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: configData, error: configError } = await supabase.rpc("get_active_email_config");

    if (configError || !configData?.success) {
      return new Response(
        JSON.stringify({ error: "No active email configuration", details: configError?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = configData.config;
    let subject = emailRequest.subject || "";
    let htmlBody = emailRequest.html_body || "";
    let textBody = emailRequest.text_body || "";

    if (emailRequest.template_key) {
      const { data: template, error: templateError } = await supabase
        .from("email_templates")
        .select("*")
        .eq("template_key", emailRequest.template_key)
        .eq("is_active", true)
        .maybeSingle();

      if (templateError || !template) {
        return new Response(
          JSON.stringify({ error: `Template not found: ${emailRequest.template_key}` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      subject = replaceVariables(template.subject, emailRequest.variables || {});
      htmlBody = replaceVariables(template.html_body, emailRequest.variables || {});
      textBody = replaceVariables(template.text_body || "", emailRequest.variables || {});
    }

    let result;
    switch (config.provider_type) {
      case "sendgrid":
        result = await sendViaSendGrid(config, emailRequest.to_email, emailRequest.to_name, subject, htmlBody, textBody);
        break;
      case "resend":
        result = await sendViaResend(config, emailRequest.to_email, emailRequest.to_name, subject, htmlBody);
        break;
      case "mailgun":
        result = await sendViaMailgun(config, emailRequest.to_email, emailRequest.to_name, subject, htmlBody, textBody);
        break;
      case "smtp":
        result = await sendViaSMTP(config, emailRequest.to_email, emailRequest.to_name, subject, htmlBody, textBody);
        break;
      default:
        result = { success: false, error: `Provider ${config.provider_type} not supported` };
    }

    await supabase.from("email_logs").insert({
      recipient_email: emailRequest.to_email,
      email_type: emailRequest.template_key || "custom",
      subject,
      body_html: htmlBody,
      body_text: textBody,
      status: result.success ? "sent" : "failed",
      error_message: result.error,
      provider: config.provider_type,
      provider_message_id: result.messageId,
      sent_at: result.success ? new Date().toISOString() : null,
      job_id: emailRequest.job_id,
      recipient_id: emailRequest.user_id,
    });

    if (!result.success) {
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully", messageId: result.messageId }),
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

function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    result = result.replace(regex, value || "");
  }
  return result;
}

async function sendViaSendGrid(config: any, toEmail: string, toName: string | undefined, subject: string, htmlBody: string, textBody: string) {
  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: toEmail, name: toName }] }],
        from: { email: config.from_email, name: config.from_name },
        reply_to: config.reply_to_email ? { email: config.reply_to_email } : undefined,
        subject,
        content: [
          { type: "text/html", value: htmlBody },
          ...(textBody ? [{ type: "text/plain", value: textBody }] : []),
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `SendGrid: ${response.status} - ${errorText}` };
    }

    return { success: true, messageId: response.headers.get("x-message-id") || undefined };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function sendViaResend(config: any, toEmail: string, toName: string | undefined, subject: string, htmlBody: string) {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${config.from_name} <${config.from_email}>`,
        to: toName ? `${toName} <${toEmail}>` : toEmail,
        reply_to: config.reply_to_email,
        subject,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: `Resend: ${errorData.message || response.statusText}` };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function sendViaMailgun(config: any, toEmail: string, toName: string | undefined, subject: string, htmlBody: string, textBody: string) {
  try {
    const domain = config.api_domain;
    if (!domain) {
      return { success: false, error: "Mailgun domain not configured" };
    }

    const formData = new FormData();
    formData.append("from", `${config.from_name} <${config.from_email}>`);
    formData.append("to", toName ? `${toName} <${toEmail}>` : toEmail);
    formData.append("subject", subject);
    formData.append("html", htmlBody);
    if (textBody) formData.append("text", textBody);
    if (config.reply_to_email) formData.append("h:Reply-To", config.reply_to_email);

    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: "POST",
      headers: { Authorization: `Basic ${btoa(`api:${config.api_key}`)}` },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: `Mailgun: ${errorData.message || response.statusText}` };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function sendViaSMTP(config: any, toEmail: string, toName: string | undefined, subject: string, htmlBody: string, textBody: string) {
  try {
    if (!config.smtp_host || !config.smtp_user || !config.smtp_password) {
      return { success: false, error: "Configuration SMTP incomplete" };
    }

    const port = config.smtp_port || 587;
    const secure = config.smtp_secure !== false;

    const boundary = `----boundary_${Date.now()}`;
    const from = toName ? `${config.from_name} <${config.from_email}>` : config.from_email;
    const to = toName ? `${toName} <${toEmail}>` : toEmail;

    const emailContent = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      textBody || htmlBody.replace(/<[^>]*>/g, ''),
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      htmlBody,
      ``,
      `--${boundary}--`,
    ].join('\r\n');

    const smtpUrl = `smtp://${config.smtp_user}:${encodeURIComponent(config.smtp_password)}@${config.smtp_host}:${port}`;

    const smtpConfig = {
      hostname: config.smtp_host,
      port: port,
      username: config.smtp_user,
      password: config.smtp_password,
      from: config.from_email,
      to: toEmail,
      subject: subject,
      content: emailContent,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      let conn;
      if (port === 465) {
        conn = await Deno.connectTls({
          hostname: config.smtp_host,
          port: 465,
          signal: controller.signal,
        });
      } else {
        conn = await Deno.connect({
          hostname: config.smtp_host,
          port: port,
          signal: controller.signal,
        });
      }

      clearTimeout(timeoutId);

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      async function readLine(conn: Deno.Conn): Promise<string> {
        const buffer = new Uint8Array(1024);
        const n = await conn.read(buffer);
        if (n === null) return "";
        return decoder.decode(buffer.subarray(0, n));
      }

      async function writeLine(conn: Deno.Conn, line: string) {
        await conn.write(encoder.encode(line + "\r\n"));
      }

      await readLine(conn);

      await writeLine(conn, `EHLO ${config.smtp_host}`);
      await readLine(conn);

      if (port !== 465 && !secure) {
        await writeLine(conn, "STARTTLS");
        await readLine(conn);
        const tlsConn = await Deno.startTls(conn, { hostname: config.smtp_host });
        conn = tlsConn;
        await writeLine(conn, `EHLO ${config.smtp_host}`);
        await readLine(conn);
      }

      await writeLine(conn, "AUTH LOGIN");
      await readLine(conn);

      await writeLine(conn, btoa(config.smtp_user));
      await readLine(conn);

      await writeLine(conn, btoa(config.smtp_password));
      const authResponse = await readLine(conn);

      if (!authResponse.startsWith("235")) {
        conn.close();
        return { success: false, error: "Authentification SMTP échouée" };
      }

      await writeLine(conn, `MAIL FROM:<${config.from_email}>`);
      await readLine(conn);

      await writeLine(conn, `RCPT TO:<${toEmail}>`);
      await readLine(conn);

      await writeLine(conn, "DATA");
      await readLine(conn);

      await writeLine(conn, emailContent);
      await writeLine(conn, ".");
      const sendResponse = await readLine(conn);

      await writeLine(conn, "QUIT");
      conn.close();

      if (sendResponse.startsWith("250")) {
        const messageId = `${Date.now()}@${config.smtp_host}`;
        return { success: true, messageId };
      } else {
        return { success: false, error: "Échec envoi SMTP" };
      }
    } catch (smtpError) {
      clearTimeout(timeoutId);
      console.error("SMTP error:", smtpError);
      return {
        success: false,
        error: `Erreur SMTP: ${smtpError.message || "Connexion impossible"}`
      };
    }
  } catch (error) {
    console.error("SMTP setup error:", error);
    return { success: false, error: `Configuration SMTP: ${error.message}` };
  }
}
