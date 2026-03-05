import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.8";

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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: inviterProfile, error: profileErr } = await serviceClient
      .from("profiles")
      .select("user_type, full_name, email")
      .eq("id", user.id)
      .maybeSingle();

    if (profileErr || !inviterProfile || inviterProfile.user_type !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { invitee_email, invitee_name } = await req.json();

    if (!invitee_email || !invitee_name) {
      return new Response(JSON.stringify({ error: "invitee_email and invitee_name are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailLower = invitee_email.trim().toLowerCase();

    const { data: existingProfile } = await serviceClient
      .from("profiles")
      .select("id")
      .eq("email", emailLower)
      .maybeSingle();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: "Un compte avec cet email existe déjà. Vous pouvez changer son rôle dans le tableau." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: existingPending } = await serviceClient
      .from("admin_invitations")
      .select("id, expires_at")
      .eq("invitee_email", emailLower)
      .eq("status", "pending")
      .maybeSingle();

    if (existingPending && new Date(existingPending.expires_at) > new Date()) {
      return new Response(
        JSON.stringify({ error: "Une invitation en attente existe déjà pour cet email." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: invitation, error: insertErr } = await serviceClient
      .from("admin_invitations")
      .insert({
        inviter_id: user.id,
        invitee_email: emailLower,
        invitee_name: invitee_name.trim(),
        status: "pending",
        expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      })
      .select("invitation_token")
      .single();

    if (insertErr || !invitation) {
      throw new Error("Failed to create invitation: " + insertErr?.message);
    }

    const token = invitation.invitation_token;
    const inviterName = inviterProfile.full_name || inviterProfile.email || "L'administrateur principal";

    const siteUrl = supabaseUrl.includes("supabase.co")
      ? "https://jobguinee.com"
      : "http://localhost:5173";
    const acceptUrl = `${siteUrl}/admin-invite/${token}`;

    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    const expiresFormatted = expiresAt.toLocaleDateString("fr-FR", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    const htmlBody = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>Invitation Administrateur - JobGuinée</title></head>
<body style="font-family: Arial, sans-serif; background: #f8fafc; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 40px 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">JobGuinée</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Plateforme d'emploi en Guinée</p>
    </div>
    <div style="padding: 40px 32px;">
      <h2 style="color: #1e293b; margin: 0 0 16px; font-size: 22px;">Invitation à rejoindre l'équipe d'administration</h2>
      <p style="color: #475569; line-height: 1.6; margin: 0 0 24px;">
        Bonjour <strong>${invitee_name}</strong>,
      </p>
      <p style="color: #475569; line-height: 1.6; margin: 0 0 24px;">
        <strong>${inviterName}</strong> vous invite à rejoindre l'équipe d'administration de <strong>JobGuinée</strong>.
        En tant qu'administrateur, vous aurez accès à toutes les fonctionnalités de gestion de la plateforme.
      </p>
      <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 0 0 32px;">
        <p style="color: #64748b; font-size: 13px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Détails de l'invitation</p>
        <p style="color: #1e293b; margin: 4px 0;"><strong>Email :</strong> ${emailLower}</p>
        <p style="color: #1e293b; margin: 4px 0;"><strong>Invité par :</strong> ${inviterName}</p>
        <p style="color: #1e293b; margin: 4px 0;"><strong>Expire le :</strong> ${expiresFormatted}</p>
      </div>
      <div style="text-align: center; margin: 0 0 32px;">
        <a href="${acceptUrl}"
           style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #1e3a5f, #2563eb); color: white; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; letter-spacing: 0.02em;">
          Accepter l'invitation
        </a>
      </div>
      <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0 0 16px;">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
      </p>
      <p style="word-break: break-all; color: #2563eb; font-size: 12px; background: #f8fafc; padding: 12px; border-radius: 6px; margin: 0 0 24px;">
        ${acceptUrl}
      </p>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 24px;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          Si vous n'attendiez pas cette invitation, ignorez cet email. Ce lien expire dans 72 heures.
        </p>
      </div>
    </div>
    <div style="background: #f8fafc; padding: 20px 32px; text-align: center;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} JobGuinée - Tous droits réservés</p>
    </div>
  </div>
</body>
</html>`;

    const { data: smtpConfig, error: smtpErr } = await serviceClient
      .from("email_provider_config")
      .select("smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password, from_email, from_name")
      .eq("provider_type", "smtp")
      .eq("is_active", true)
      .maybeSingle();

    if (smtpErr || !smtpConfig) {
      throw new Error("SMTP configuration not found: " + smtpErr?.message);
    }

    const transporter = nodemailer.createTransport({
      host: smtpConfig.smtp_host,
      port: smtpConfig.smtp_port,
      secure: smtpConfig.smtp_secure,
      auth: {
        user: smtpConfig.smtp_user,
        pass: smtpConfig.smtp_password,
      },
    });

    const info = await transporter.sendMail({
      from: `${smtpConfig.from_name} <${smtpConfig.from_email}>`,
      to: `${invitee_name} <${emailLower}>`,
      subject: `Invitation administrateur JobGuinée - ${inviterName} vous invite`,
      html: htmlBody,
      text: `Bonjour ${invitee_name},\n\n${inviterName} vous invite à rejoindre l'équipe d'administration de JobGuinée.\n\nCliquez sur ce lien pour accepter : ${acceptUrl}\n\nCe lien expire dans 72 heures.`,
    });

    await serviceClient.from("email_logs").insert({
      recipient_email: emailLower,
      email_type: "admin_invitation",
      template_code: "admin_invitation",
      subject: `Invitation administrateur JobGuinée`,
      body_html: htmlBody,
      body_text: `Invitation admin pour ${emailLower}`,
      provider: "hostinger",
      status: "delivered",
      sent_at: new Date().toISOString(),
      provider_message_id: info.messageId,
      metadata: { invitee_name, inviter: inviterName, token },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Invitation envoyée à ${emailLower}`,
        token,
        email_sent: true,
        messageId: info.messageId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("send-admin-invite error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
