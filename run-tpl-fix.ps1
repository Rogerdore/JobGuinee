$code = @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class CTPL2 {
    [DllImport("advapi32.dll", SetLastError=true, CharSet=CharSet.Unicode)]
    private static extern bool CredRead(string target, int type, int flags, out IntPtr credential);
    [DllImport("advapi32.dll")]
    private static extern void CredFree(IntPtr buffer);
    [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
    private struct CREDENTIAL {
        public int Flags; public int Type; public string TargetName; public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public int CredentialBlobSize; public IntPtr CredentialBlob;
        public int Persist; public int AttributeCount; public IntPtr Attributes;
        public string TargetAlias; public string UserName;
    }
    public static string GetPassword(string target) {
        IntPtr credPtr;
        if (CredRead(target, 1, 0, out credPtr)) {
            var cred = (CREDENTIAL)Marshal.PtrToStructure(credPtr, typeof(CREDENTIAL));
            byte[] rawBytes = new byte[cred.CredentialBlobSize];
            Marshal.Copy(cred.CredentialBlob, rawBytes, 0, cred.CredentialBlobSize);
            CredFree(credPtr);
            return Encoding.UTF8.GetString(rawBytes);
        }
        return null;
    }
}
"@
try { Add-Type -TypeDefinition $code } catch {}

$token = [CTPL2]::GetPassword("Supabase CLI:supabase")
$ref = "hhhjzgeidjqctuveopso"
$baseUrl = "https://api.supabase.com/v1/projects/$ref/database/query"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

function RunSQL($sql, $label) {
    $body = [System.Text.Encoding]::UTF8.GetBytes((@{ query = $sql } | ConvertTo-Json -Depth 5))
    try {
        $r = Invoke-WebRequest -Uri $baseUrl -Method POST -Headers $headers -Body $body -UseBasicParsing
        Write-Host "$label : OK ($($r.StatusCode))"
        $content = $r.Content
        if ($content.Length -gt 300) { $content = $content.Substring(0, 300) + "..." }
        Write-Host $content
        return $true
    } catch {
        Write-Host "$label : ERROR - $($_.Exception.Message)"
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            Write-Host "$label BODY: $($reader.ReadToEnd())"
        } catch { Write-Host "$label BODY_ERR: $($_.Exception.Message)" }
        return $false
    }
}

Write-Host "=== INSERTING EMAIL TEMPLATES (with category) ==="
Write-Host ""

# Template 1: Confirmation OAuth (Google)
$sql1 = @'
INSERT INTO email_templates (template_key, name, category, subject, html_body, description, is_active, is_system)
VALUES (
  'account_confirmation_oauth',
  'Confirmation de compte (Google)',
  'auth',
  E'Confirmez votre inscription sur JobGuin\u00e9e',
  E'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #1e3a5f; margin: 0;">JobGuin\u00e9e</h1><p style="color: #666; font-size: 14px;">La plateforme emploi de la Guin\u00e9e</p></div><h2 style="color: #333;">Bienvenue {{user_name}} !</h2><p style="color: #555; font-size: 16px; line-height: 1.6;">Vous vous \u00eates inscrit(e) sur <strong>JobGuin\u00e9e</strong> avec votre compte Google. Pour activer votre compte, veuillez confirmer votre inscription en cliquant sur le bouton ci-dessous :</p><div style="text-align: center; margin: 30px 0;"><a href="{{confirmation_url}}" style="display: inline-block; padding: 14px 32px; background-color: #1e3a5f; color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">Confirmer mon inscription</a></div><p style="color: #888; font-size: 13px;">Si le bouton ne fonctionne pas, copiez ce lien : {{confirmation_url}}</p><hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" /><p style="color: #999; font-size: 12px; text-align: center;">Si vous n''avez pas cr\u00e9\u00e9 de compte sur JobGuin\u00e9e, ignorez cet email.</p></div>',
  'Email de confirmation pour les inscriptions via Google OAuth',
  true,
  true
)
ON CONFLICT (template_key) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  category = EXCLUDED.category,
  is_active = true,
  updated_at = now()
RETURNING template_key
'@
RunSQL $sql1 "OAuthConfirm"

# Template 2: Welcome email
$sql2 = @'
INSERT INTO email_templates (template_key, name, category, subject, html_body, description, is_active, is_system)
VALUES (
  'welcome_email',
  'Email de bienvenue',
  'auth',
  E'Bienvenue sur JobGuin\u00e9e !',
  E'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #1e3a5f; margin: 0;">JobGuin\u00e9e</h1><p style="color: #666; font-size: 14px;">La plateforme emploi de la Guin\u00e9e</p></div><h2 style="color: #333;">Bienvenue {{user_name}} !</h2><p style="color: #555; font-size: 16px; line-height: 1.6;">Votre compte sur <strong>JobGuin\u00e9e</strong> est maintenant actif. Voici ce que vous pouvez faire :</p><ul style="color: #555; font-size: 15px; line-height: 2;"><li>Parcourir les offres d''emploi</li><li>Cr\u00e9er et publier votre CV</li><li>Configurer des alertes emploi personnalis\u00e9es</li><li>Postuler directement en ligne</li></ul><div style="text-align: center; margin: 30px 0;"><a href="{{site_url}}/offres" style="display: inline-block; padding: 14px 32px; background-color: #1e3a5f; color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">D\u00e9couvrir les offres</a></div><hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" /><p style="color: #999; font-size: 12px; text-align: center;">\u00c9quipe JobGuin\u00e9e</p></div>',
  'Email de bienvenue envoy&eacute; apr&egrave;s confirmation du compte',
  true,
  true
)
ON CONFLICT (template_key) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  category = EXCLUDED.category,
  is_active = true,
  updated_at = now()
RETURNING template_key
'@
RunSQL $sql2 "Welcome"

# Template 3: Password reset
$sql3 = @'
INSERT INTO email_templates (template_key, name, category, subject, html_body, description, is_active, is_system)
VALUES (
  'password_reset',
  'R&eacute;initialisation du mot de passe',
  'auth',
  E'R\u00e9initialisez votre mot de passe JobGuin\u00e9e',
  E'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #1e3a5f; margin: 0;">JobGuin\u00e9e</h1></div><h2 style="color: #333;">R\u00e9initialisation du mot de passe</h2><p style="color: #555; font-size: 16px; line-height: 1.6;">Vous avez demand\u00e9 la r\u00e9initialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p><div style="text-align: center; margin: 30px 0;"><a href="{{reset_url}}" style="display: inline-block; padding: 14px 32px; background-color: #e74c3c; color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">R\u00e9initialiser mon mot de passe</a></div><p style="color: #888; font-size: 13px;">Ce lien expire dans 1 heure. Si vous n''avez pas demand\u00e9 cette r\u00e9initialisation, ignorez cet email.</p><hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" /><p style="color: #999; font-size: 12px; text-align: center;">\u00c9quipe JobGuin\u00e9e</p></div>',
  'Email de reinitialisation du mot de passe',
  true,
  true
)
ON CONFLICT (template_key) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  category = EXCLUDED.category,
  is_active = true,
  updated_at = now()
RETURNING template_key
'@
RunSQL $sql3 "PasswordReset"

# Template 4: Application status update
$sql4 = @'
INSERT INTO email_templates (template_key, name, category, subject, html_body, description, is_active, is_system)
VALUES (
  'application_status_update',
  'Mise a jour de candidature',
  'application',
  E'Mise \u00e0 jour de votre candidature - {{job_title}}',
  E'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #1e3a5f; margin: 0;">JobGuin\u00e9e</h1></div><h2 style="color: #333;">Mise \u00e0 jour de votre candidature</h2><p style="color: #555; font-size: 16px; line-height: 1.6;">Bonjour {{user_name}},</p><p style="color: #555; font-size: 16px; line-height: 1.6;">Le statut de votre candidature pour le poste <strong>{{job_title}}</strong> chez <strong>{{company_name}}</strong> a \u00e9t\u00e9 mis \u00e0 jour :</p><div style="text-align: center; margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 8px;"><p style="font-size: 18px; font-weight: bold; color: #1e3a5f;">{{status}}</p></div><div style="text-align: center; margin: 30px 0;"><a href="{{application_url}}" style="display: inline-block; padding: 14px 32px; background-color: #1e3a5f; color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">Voir ma candidature</a></div><hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" /><p style="color: #999; font-size: 12px; text-align: center;">\u00c9quipe JobGuin\u00e9e</p></div>',
  'Notification de changement de statut de candidature',
  true,
  true
)
ON CONFLICT (template_key) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  category = EXCLUDED.category,
  is_active = true,
  updated_at = now()
RETURNING template_key
'@
RunSQL $sql4 "AppStatus"

# Template 5: Job alert match
$sql5 = @'
INSERT INTO email_templates (template_key, name, category, subject, html_body, description, is_active, is_system)
VALUES (
  'job_alert_notification',
  'Alerte emploi',
  'notification',
  E'Nouvelles offres correspondant \u00e0 vos crit\u00e8res',
  E'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #1e3a5f; margin: 0;">JobGuin\u00e9e</h1></div><h2 style="color: #333;">Nouvelles offres pour vous !</h2><p style="color: #555; font-size: 16px; line-height: 1.6;">Bonjour {{user_name}},</p><p style="color: #555; font-size: 16px; line-height: 1.6;">{{job_count}} nouvelle(s) offre(s) correspondent \u00e0 vos crit\u00e8res de recherche :</p><div style="margin: 20px 0;">{{job_list_html}}</div><div style="text-align: center; margin: 30px 0;"><a href="{{site_url}}/offres" style="display: inline-block; padding: 14px 32px; background-color: #1e3a5f; color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">Voir toutes les offres</a></div><hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" /><p style="color: #999; font-size: 12px; text-align: center;">Pour g\u00e9rer vos alertes : <a href="{{site_url}}/alertes" style="color: #1e3a5f;">Param\u00e8tres d''alertes</a></p></div>',
  'Notification d''alerte emploi avec liste des offres correspondantes',
  true,
  true
)
ON CONFLICT (template_key) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  category = EXCLUDED.category,
  is_active = true,
  updated_at = now()
RETURNING template_key
'@
RunSQL $sql5 "JobAlert"

Write-Host ""
Write-Host "=== VERIFICATION ==="
RunSQL "SELECT template_key, name, category, is_active FROM email_templates ORDER BY template_key" "AllTemplates"
