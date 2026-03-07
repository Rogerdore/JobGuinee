# fix-db-email-templates.ps1 — Fix custom email_templates in DB for mobile
$ErrorActionPreference = "Stop"

$code = @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class CDBFIX {
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
$token = [CDBFIX]::GetPassword("Supabase CLI:supabase")
if (-not $token) { Write-Error "No supabase_token"; exit 1 }

$ref = "hhhjzgeidjqctuveopso"
$baseUrl = "https://api.supabase.com/v1/projects/$ref/database/query"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function RunSQL($sql, $label) {
    Write-Host "  [$label] " -NoNewline
    try {
        $body = @{ query = $sql } | ConvertTo-Json -Depth 3
        $r = Invoke-RestMethod -Uri $baseUrl -Method POST -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type"  = "application/json"
        } -Body $body
        if ($r -is [array] -and $r.Count -gt 0) {
            Write-Host "OK ($($r.Count) rows)" -ForegroundColor Green
            $r | Format-Table -AutoSize | Out-String | Write-Host
        } else {
            Write-Host "OK" -ForegroundColor Green
        }
        return $true
    } catch {
        Write-Host "FAIL: $_" -ForegroundColor Red
        return $false
    }
}

Write-Host "=== Listing current email_templates ===" -ForegroundColor Cyan
RunSQL "SELECT template_key, name, category, is_active, LEFT(html_body, 80) as html_preview FROM email_templates ORDER BY template_key" "ListAll"

Write-Host "`n=== Updating ALL custom templates with mobile-friendly bulletproof buttons ===" -ForegroundColor Cyan

# Helper: bulletproof button snippet for use in email HTML bodies
# We use table-based buttons with target="_blank" for ALL templates

# 1. account_confirmation_oauth
$sql1 = @'
UPDATE email_templates SET html_body = E'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F6F8FB;"><tr><td align="center" style="padding:20px 10px;"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;"><tr><td style="padding:24px 20px;text-align:center;border-bottom:1px solid #eee;"><img src="https://jobguinee-pro.com/logo_jobguinee.png" alt="JobGuin\u00e9e" width="180" style="max-height:60px;width:auto;border:0;"></td></tr><tr><td style="padding:32px 28px;color:#243B6B;font-family:Arial,Helvetica,sans-serif;"><h2 style="margin:0 0 16px;color:#1F3C88;font-size:22px;">Bienvenue {{user_name}} !</h2><p style="font-size:16px;line-height:1.6;margin:0 0 24px;">Vous vous \u00eates inscrit(e) sur <strong>JobGuin\u00e9e</strong> avec votre compte Google. Pour activer votre compte, cliquez sur le bouton ci-dessous :</p><table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%"><tr><td align="center" style="padding:8px 0 24px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="border-radius:6px;background-color:#1F3C88;"><a href="{{confirmation_url}}" target="_blank" rel="noopener" style="background-color:#1F3C88;border:1px solid #1F3C88;border-radius:6px;color:#ffffff;display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;line-height:1.2;padding:14px 36px;text-decoration:none;text-align:center;">Confirmer mon inscription</a></td></tr></table></td></tr></table><p style="font-size:13px;color:#666;line-height:1.5;margin:0 0 16px;">Si le bouton ne fonctionne pas, copiez ce lien :<br><a href="{{confirmation_url}}" target="_blank" style="color:#1F3C88;word-break:break-all;text-decoration:underline;">{{confirmation_url}}</a></p><p style="font-size:14px;color:#999;margin:16px 0 0;padding-top:16px;border-top:1px solid #eee;">Si vous n\u2019avez pas cr\u00e9\u00e9 de compte, ignorez cet email.</p></td></tr><tr><td style="background-color:#F0F2F5;padding:16px 20px;text-align:center;font-size:12px;color:#777;font-family:Arial,sans-serif;">\u00a9 2026 JobGuin\u00e9e \u2013 Tous droits r\u00e9serv\u00e9s</td></tr></table></td></tr></table>',
updated_at = now()
WHERE template_key = 'account_confirmation_oauth'
'@
RunSQL $sql1 "OAuthConfirm"

# 2. welcome_email
$sql2 = @'
UPDATE email_templates SET html_body = E'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F6F8FB;"><tr><td align="center" style="padding:20px 10px;"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;"><tr><td style="padding:24px 20px;text-align:center;border-bottom:1px solid #eee;"><img src="https://jobguinee-pro.com/logo_jobguinee.png" alt="JobGuin\u00e9e" width="180" style="max-height:60px;width:auto;border:0;"></td></tr><tr><td style="padding:32px 28px;color:#243B6B;font-family:Arial,Helvetica,sans-serif;"><h2 style="margin:0 0 16px;color:#1F3C88;font-size:22px;">Bienvenue {{user_name}} !</h2><p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Votre compte sur <strong>JobGuin\u00e9e</strong> est maintenant actif. Voici ce que vous pouvez faire :</p><ul style="color:#555;font-size:15px;line-height:2;padding-left:20px;margin:0 0 24px;"><li>Parcourir les offres d\u2019emploi</li><li>Cr\u00e9er et publier votre CV</li><li>Configurer des alertes emploi</li><li>Postuler directement en ligne</li></ul><table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%"><tr><td align="center" style="padding:8px 0 24px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="border-radius:6px;background-color:#1F3C88;"><a href="{{site_url}}/offres" target="_blank" rel="noopener" style="background-color:#1F3C88;border:1px solid #1F3C88;border-radius:6px;color:#ffffff;display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;line-height:1.2;padding:14px 36px;text-decoration:none;text-align:center;">D\u00e9couvrir les offres</a></td></tr></table></td></tr></table><p style="font-size:14px;color:#666;margin:16px 0 0;padding-top:16px;border-top:1px solid #eee;">Cordialement,<br><strong>L\u2019\u00e9quipe JobGuin\u00e9e</strong></p></td></tr><tr><td style="background-color:#F0F2F5;padding:16px 20px;text-align:center;font-size:12px;color:#777;font-family:Arial,sans-serif;">\u00a9 2026 JobGuin\u00e9e \u2013 Tous droits r\u00e9serv\u00e9s</td></tr></table></td></tr></table>',
updated_at = now()
WHERE template_key = 'welcome_email'
'@
RunSQL $sql2 "WelcomeEmail"

# 3. password_reset
$sql3 = @'
UPDATE email_templates SET html_body = E'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F6F8FB;"><tr><td align="center" style="padding:20px 10px;"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;"><tr><td style="padding:24px 20px;text-align:center;border-bottom:1px solid #eee;"><img src="https://jobguinee-pro.com/logo_jobguinee.png" alt="JobGuin\u00e9e" width="180" style="max-height:60px;width:auto;border:0;"></td></tr><tr><td style="padding:32px 28px;color:#243B6B;font-family:Arial,Helvetica,sans-serif;"><h2 style="margin:0 0 16px;color:#1F3C88;font-size:22px;">R\u00e9initialisation de mot de passe</h2><p style="font-size:16px;line-height:1.6;margin:0 0 24px;">Vous avez demand\u00e9 la r\u00e9initialisation de votre mot de passe. Cliquez sur le bouton pour en choisir un nouveau :</p><table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%"><tr><td align="center" style="padding:8px 0 24px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="border-radius:6px;background-color:#1F3C88;"><a href="{{reset_url}}" target="_blank" rel="noopener" style="background-color:#1F3C88;border:1px solid #1F3C88;border-radius:6px;color:#ffffff;display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;line-height:1.2;padding:14px 36px;text-decoration:none;text-align:center;">R\u00e9initialiser mon mot de passe</a></td></tr></table></td></tr></table><p style="font-size:13px;color:#666;line-height:1.5;margin:0 0 16px;">Si le bouton ne fonctionne pas :<br><a href="{{reset_url}}" target="_blank" style="color:#1F3C88;word-break:break-all;text-decoration:underline;">{{reset_url}}</a></p><p style="font-size:15px;line-height:1.6;margin:0 0 0;">Si vous n\u2019avez pas demand\u00e9 cette r\u00e9initialisation, ignorez cet email.</p></td></tr><tr><td style="background-color:#F0F2F5;padding:16px 20px;text-align:center;font-size:12px;color:#777;font-family:Arial,sans-serif;">\u00a9 2026 JobGuin\u00e9e \u2013 Tous droits r\u00e9serv\u00e9s</td></tr></table></td></tr></table>',
updated_at = now()
WHERE template_key = 'password_reset'
'@
RunSQL $sql3 "PasswordReset"

# 4. application_status_update
$sql4 = @'
UPDATE email_templates SET html_body = E'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F6F8FB;"><tr><td align="center" style="padding:20px 10px;"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;"><tr><td style="padding:24px 20px;text-align:center;border-bottom:1px solid #eee;"><img src="https://jobguinee-pro.com/logo_jobguinee.png" alt="JobGuin\u00e9e" width="180" style="max-height:60px;width:auto;border:0;"></td></tr><tr><td style="padding:32px 28px;color:#243B6B;font-family:Arial,Helvetica,sans-serif;"><h2 style="margin:0 0 16px;color:#1F3C88;font-size:22px;">Mise \u00e0 jour de candidature</h2><p style="font-size:16px;line-height:1.6;margin:0 0 12px;">Bonjour {{candidate_name}},</p><p style="font-size:16px;line-height:1.6;margin:0 0 24px;">Le statut de votre candidature pour le poste <strong>{{job_title}}</strong> chez <strong>{{company_name}}</strong> a \u00e9t\u00e9 mis \u00e0 jour : <strong>{{status}}</strong></p><table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%"><tr><td align="center" style="padding:8px 0 24px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="border-radius:6px;background-color:#1F3C88;"><a href="{{dashboard_url}}" target="_blank" rel="noopener" style="background-color:#1F3C88;border:1px solid #1F3C88;border-radius:6px;color:#ffffff;display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;line-height:1.2;padding:14px 36px;text-decoration:none;text-align:center;">Voir ma candidature</a></td></tr></table></td></tr></table><p style="font-size:14px;color:#666;margin:16px 0 0;padding-top:16px;border-top:1px solid #eee;"><strong>L\u2019\u00e9quipe JobGuin\u00e9e</strong></p></td></tr><tr><td style="background-color:#F0F2F5;padding:16px 20px;text-align:center;font-size:12px;color:#777;font-family:Arial,sans-serif;">\u00a9 2026 JobGuin\u00e9e \u2013 Tous droits r\u00e9serv\u00e9s</td></tr></table></td></tr></table>',
updated_at = now()
WHERE template_key = 'application_status_update'
'@
RunSQL $sql4 "AppStatusUpdate"

# 5. job_alert_notification
$sql5 = @'
UPDATE email_templates SET html_body = E'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F6F8FB;"><tr><td align="center" style="padding:20px 10px;"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;"><tr><td style="padding:24px 20px;text-align:center;border-bottom:1px solid #eee;"><img src="https://jobguinee-pro.com/logo_jobguinee.png" alt="JobGuin\u00e9e" width="180" style="max-height:60px;width:auto;border:0;"></td></tr><tr><td style="padding:32px 28px;color:#243B6B;font-family:Arial,Helvetica,sans-serif;"><h2 style="margin:0 0 16px;color:#1F3C88;font-size:22px;">Nouvelles offres pour vous !</h2><p style="font-size:16px;line-height:1.6;margin:0 0 12px;">Bonjour {{user_name}},</p><p style="font-size:16px;line-height:1.6;margin:0 0 24px;">De nouvelles offres correspondant \u00e0 vos crit\u00e8res sont disponibles sur JobGuin\u00e9e :</p><div style="margin:0 0 24px;">{{job_list}}</div><table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%"><tr><td align="center" style="padding:8px 0 24px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="border-radius:6px;background-color:#1F3C88;"><a href="{{jobs_url}}" target="_blank" rel="noopener" style="background-color:#1F3C88;border:1px solid #1F3C88;border-radius:6px;color:#ffffff;display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;line-height:1.2;padding:14px 36px;text-decoration:none;text-align:center;">Voir toutes les offres</a></td></tr></table></td></tr></table><p style="font-size:13px;color:#666;margin:0;">Si le bouton ne fonctionne pas :<br><a href="{{jobs_url}}" target="_blank" style="color:#1F3C88;word-break:break-all;text-decoration:underline;">{{jobs_url}}</a></p></td></tr><tr><td style="background-color:#F0F2F5;padding:16px 20px;text-align:center;font-size:12px;color:#777;font-family:Arial,sans-serif;">\u00a9 2026 JobGuin\u00e9e \u2013 Tous droits r\u00e9serv\u00e9s</td></tr></table></td></tr></table>',
updated_at = now()
WHERE template_key = 'job_alert_notification'
'@
RunSQL $sql5 "JobAlert"

# 6. Update welcome_candidate and welcome_recruiter if they exist
$sql6 = @'
UPDATE email_templates SET html_body = E'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F6F8FB;"><tr><td align="center" style="padding:20px 10px;"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;"><tr><td style="padding:24px 20px;text-align:center;border-bottom:1px solid #eee;"><img src="https://jobguinee-pro.com/logo_jobguinee.png" alt="JobGuin\u00e9e" width="180" style="max-height:60px;width:auto;border:0;"></td></tr><tr><td style="padding:32px 28px;color:#243B6B;font-family:Arial,Helvetica,sans-serif;"><h2 style="margin:0 0 16px;color:#1F3C88;font-size:22px;">Bienvenue {{candidate_name}} !</h2><p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Votre compte candidat sur <strong>JobGuin\u00e9e</strong> est maintenant actif.</p><p style="font-size:16px;line-height:1.6;margin:0 0 24px;">Commencez d\u00e8s maintenant \u00e0 parcourir les offres d\u2019emploi et \u00e0 postuler :</p><table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%"><tr><td align="center" style="padding:8px 0 24px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="border-radius:6px;background-color:#1F3C88;"><a href="https://jobguinee-pro.com/offres" target="_blank" rel="noopener" style="background-color:#1F3C88;border:1px solid #1F3C88;border-radius:6px;color:#ffffff;display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;line-height:1.2;padding:14px 36px;text-decoration:none;text-align:center;">D\u00e9couvrir les offres</a></td></tr></table></td></tr></table><p style="font-size:14px;color:#666;margin:16px 0 0;padding-top:16px;border-top:1px solid #eee;"><strong>L\u2019\u00e9quipe JobGuin\u00e9e</strong><br><span style="color:#1F3C88;">Trouvez. Embauchez. R\u00e9ussissez.</span></p></td></tr><tr><td style="background-color:#F0F2F5;padding:16px 20px;text-align:center;font-size:12px;color:#777;font-family:Arial,sans-serif;">\u00a9 2026 JobGuin\u00e9e \u2013 Tous droits r\u00e9serv\u00e9s</td></tr></table></td></tr></table>',
updated_at = now()
WHERE template_key = 'welcome_candidate'
'@
RunSQL $sql6 "WelcomeCandidate"

$sql7 = @'
UPDATE email_templates SET html_body = E'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F6F8FB;"><tr><td align="center" style="padding:20px 10px;"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;"><tr><td style="padding:24px 20px;text-align:center;border-bottom:1px solid #eee;"><img src="https://jobguinee-pro.com/logo_jobguinee.png" alt="JobGuin\u00e9e" width="180" style="max-height:60px;width:auto;border:0;"></td></tr><tr><td style="padding:32px 28px;color:#243B6B;font-family:Arial,Helvetica,sans-serif;"><h2 style="margin:0 0 16px;color:#1F3C88;font-size:22px;">Bienvenue {{recruiter_name}} !</h2><p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Votre compte recruteur sur <strong>JobGuin\u00e9e</strong> est activ\u00e9.</p><p style="font-size:16px;line-height:1.6;margin:0 0 24px;">Publiez vos offres d\u2019emploi et trouvez les meilleurs talents en Guin\u00e9e :</p><table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%"><tr><td align="center" style="padding:8px 0 24px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="border-radius:6px;background-color:#1F3C88;"><a href="https://jobguinee-pro.com/recruiter/dashboard" target="_blank" rel="noopener" style="background-color:#1F3C88;border:1px solid #1F3C88;border-radius:6px;color:#ffffff;display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;line-height:1.2;padding:14px 36px;text-decoration:none;text-align:center;">Acc\u00e9der \u00e0 mon espace</a></td></tr></table></td></tr></table><p style="font-size:14px;color:#666;margin:16px 0 0;padding-top:16px;border-top:1px solid #eee;"><strong>L\u2019\u00e9quipe JobGuin\u00e9e</strong><br><span style="color:#1F3C88;">Trouvez. Embauchez. R\u00e9ussissez.</span></p></td></tr><tr><td style="background-color:#F0F2F5;padding:16px 20px;text-align:center;font-size:12px;color:#777;font-family:Arial,sans-serif;">\u00a9 2026 JobGuin\u00e9e \u2013 Tous droits r\u00e9serv\u00e9s</td></tr></table></td></tr></table>',
updated_at = now()
WHERE template_key = 'welcome_recruiter'
'@
RunSQL $sql7 "WelcomeRecruiter"

# 7. email_confirmation_signup (if exists - used by queue_confirmation_email)
$sql8 = @'
UPDATE email_templates SET html_body = E'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F6F8FB;"><tr><td align="center" style="padding:20px 10px;"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;"><tr><td style="padding:24px 20px;text-align:center;border-bottom:1px solid #eee;"><img src="https://jobguinee-pro.com/logo_jobguinee.png" alt="JobGuin\u00e9e" width="180" style="max-height:60px;width:auto;border:0;"></td></tr><tr><td style="padding:32px 28px;color:#243B6B;font-family:Arial,Helvetica,sans-serif;"><h2 style="margin:0 0 16px;color:#1F3C88;font-size:22px;">Confirmez votre inscription</h2><p style="font-size:16px;line-height:1.6;margin:0 0 12px;">Bonjour {{user_name}},</p><p style="font-size:16px;line-height:1.6;margin:0 0 24px;">Merci de vous \u00eatre inscrit sur <strong>JobGuin\u00e9e</strong>. Cliquez sur le bouton ci-dessous pour confirmer votre adresse email :</p><table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%"><tr><td align="center" style="padding:8px 0 24px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="border-radius:6px;background-color:#1F3C88;"><a href="{{confirmation_link}}" target="_blank" rel="noopener" style="background-color:#1F3C88;border:1px solid #1F3C88;border-radius:6px;color:#ffffff;display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;line-height:1.2;padding:14px 36px;text-decoration:none;text-align:center;">Confirmer mon email</a></td></tr></table></td></tr></table><p style="font-size:13px;color:#666;line-height:1.5;margin:0 0 16px;">Si le bouton ne fonctionne pas :<br><a href="{{confirmation_link}}" target="_blank" style="color:#1F3C88;word-break:break-all;text-decoration:underline;">{{confirmation_link}}</a></p><p style="font-size:14px;color:#999;margin:16px 0 0;padding-top:16px;border-top:1px solid #eee;">Si vous n\u2019avez pas cr\u00e9\u00e9 de compte, ignorez cet email.</p></td></tr><tr><td style="background-color:#F0F2F5;padding:16px 20px;text-align:center;font-size:12px;color:#777;font-family:Arial,sans-serif;">\u00a9 2026 JobGuin\u00e9e \u2013 Tous droits r\u00e9serv\u00e9s</td></tr></table></td></tr></table>',
updated_at = now()
WHERE template_key = 'email_confirmation_signup'
'@
RunSQL $sql8 "ConfirmSignup"

# 8. welcome_confirmed (if exists)
$sql9 = @'
UPDATE email_templates SET html_body = E'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F6F8FB;"><tr><td align="center" style="padding:20px 10px;"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;"><tr><td style="padding:24px 20px;text-align:center;border-bottom:1px solid #eee;"><img src="https://jobguinee-pro.com/logo_jobguinee.png" alt="JobGuin\u00e9e" width="180" style="max-height:60px;width:auto;border:0;"></td></tr><tr><td style="padding:32px 28px;color:#243B6B;font-family:Arial,Helvetica,sans-serif;"><h2 style="margin:0 0 16px;color:#1F3C88;font-size:22px;">Votre compte est activ\u00e9 !</h2><p style="font-size:16px;line-height:1.6;margin:0 0 12px;">Bonjour {{user_name}},</p><p style="font-size:16px;line-height:1.6;margin:0 0 24px;">Votre adresse email a \u00e9t\u00e9 confirm\u00e9e et votre compte <strong>JobGuin\u00e9e</strong> est d\u00e9sormais actif. Commencez \u00e0 explorer :</p><table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%"><tr><td align="center" style="padding:8px 0 24px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="border-radius:6px;background-color:#1F3C88;"><a href="{{dashboard_url}}" target="_blank" rel="noopener" style="background-color:#1F3C88;border:1px solid #1F3C88;border-radius:6px;color:#ffffff;display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;line-height:1.2;padding:14px 36px;text-decoration:none;text-align:center;">Acc\u00e9der \u00e0 mon espace</a></td></tr></table></td></tr></table><p style="font-size:14px;color:#666;margin:16px 0 0;padding-top:16px;border-top:1px solid #eee;"><strong>L\u2019\u00e9quipe JobGuin\u00e9e</strong><br><span style="color:#1F3C88;">Trouvez. Embauchez. R\u00e9ussissez.</span></p></td></tr><tr><td style="background-color:#F0F2F5;padding:16px 20px;text-align:center;font-size:12px;color:#777;font-family:Arial,sans-serif;">\u00a9 2026 JobGuin\u00e9e \u2013 Tous droits r\u00e9serv\u00e9s</td></tr></table></td></tr></table>',
updated_at = now()
WHERE template_key = 'welcome_confirmed'
'@
RunSQL $sql9 "WelcomeConfirmed"

Write-Host "`n=== Verify results ===" -ForegroundColor Cyan
RunSQL "SELECT template_key, is_active, LENGTH(html_body) as html_len, CASE WHEN html_body LIKE '%role=%presentation%' THEN 'table-based (mobile OK)' ELSE 'old style' END as button_style FROM email_templates ORDER BY template_key" "Verify"

Write-Host "`nDone!" -ForegroundColor Green
