# fix-email-templates.ps1 — Fix all email templates for mobile compatibility
# Uses bulletproof table-based buttons instead of styled <a> tags
$ErrorActionPreference = "Stop"

$code = @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class CFIXEML {
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
$token = [CFIXEML]::GetPassword("Supabase CLI:supabase")
if (-not $token) { Write-Error "No supabase_token credential"; exit 1 }

$ref = "hhhjzgeidjqctuveopso"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

# ================================================================
# Bulletproof button helper (table-based, works on ALL mobile clients)
# ================================================================
# Using table-based CTA that Gmail, Outlook, Yahoo, Apple Mail all support

# ================================================================
# TEMPLATE 1: Confirmation (signup)
# ================================================================
$confirmationHtml = @'
<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Confirmez votre inscription - JobGuin&#233;e</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;word-spacing:normal;background-color:#F6F8FB;">
  <div role="article" aria-roledescription="email" lang="fr" style="text-size-adjust:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F6F8FB;">
      <tr>
        <td align="center" style="padding:20px 10px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <!-- Header -->
            <tr>
              <td style="background-color:#ffffff;padding:24px 20px;text-align:center;border-bottom:1px solid #eee;">
                <img src="https://jobguinee-pro.com/logo_jobguinee.png" alt="JobGuin&#233;e" width="180" style="max-height:60px;width:auto;border:0;display:inline-block;">
              </td>
            </tr>
            <!-- Content -->
            <tr>
              <td style="padding:32px 28px;color:#243B6B;font-family:Arial,Helvetica,sans-serif;">
                <h2 style="margin:0 0 16px 0;color:#1F3C88;font-size:22px;">Bienvenue sur JobGuin&#233;e !</h2>
                <p style="font-size:16px;line-height:1.6;margin:0 0 12px 0;">Bonjour,</p>
                <p style="font-size:16px;line-height:1.6;margin:0 0 24px 0;">
                  Merci de vous &#234;tre inscrit sur <strong>JobGuin&#233;e</strong>.
                  Pour activer votre compte et acc&#233;der &#224; votre espace, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :
                </p>
                <!-- BULLETPROOF BUTTON (table-based) -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%">
                  <tr>
                    <td align="center" style="padding:8px 0 24px 0;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="border-radius:6px;background-color:#1F3C88;">
                            <a href="{{ .ConfirmationURL }}" target="_blank" rel="noopener" style="background-color:#1F3C88;border:1px solid #1F3C88;border-radius:6px;color:#ffffff;display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;line-height:1.2;padding:14px 36px;text-decoration:none;text-align:center;mso-padding-alt:0;">
                              <!--[if mso]><i style="mso-font-width:150%;mso-text-raise:18px;" hidden>&emsp;</i><![endif]-->
                              <span style="mso-text-raise:9px;">Confirmer mon compte</span>
                              <!--[if mso]><i style="mso-font-width:150%;" hidden>&emsp;&#8203;</i><![endif]-->
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                <!-- Fallback plain URL -->
                <p style="font-size:13px;color:#666;line-height:1.5;margin:0 0 16px 0;">
                  Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
                  <a href="{{ .ConfirmationURL }}" target="_blank" rel="noopener" style="color:#1F3C88;word-break:break-all;text-decoration:underline;">{{ .ConfirmationURL }}</a>
                </p>
                <p style="font-size:15px;line-height:1.6;margin:0 0 16px 0;">
                  Si vous n&#8217;&#234;tes pas &#224; l&#8217;origine de cette inscription, vous pouvez simplement ignorer cet email.
                </p>
                <p style="font-size:14px;color:#666;margin:24px 0 0 0;padding-top:16px;border-top:1px solid #eee;">
                  Cordialement,<br>
                  <strong>L&#8217;&#233;quipe JobGuin&#233;e</strong><br>
                  <span style="color:#1F3C88;">Trouvez. Embauchez. R&#233;ussissez.</span>
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background-color:#F0F2F5;padding:16px 20px;text-align:center;font-size:12px;color:#777;font-family:Arial,Helvetica,sans-serif;">
                &#169; 2026 JobGuin&#233;e &#8211; Tous droits r&#233;serv&#233;s<br>
                Ceci est un email automatique, merci de ne pas r&#233;pondre.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
'@

# ================================================================
# TEMPLATE 2: Password Recovery
# ================================================================
$recoveryHtml = @'
<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>R&#233;initialisation de mot de passe - JobGuin&#233;e</title>
</head>
<body style="margin:0;padding:0;word-spacing:normal;background-color:#F6F8FB;">
  <div role="article" aria-roledescription="email" lang="fr" style="text-size-adjust:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F6F8FB;">
      <tr>
        <td align="center" style="padding:20px 10px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <!-- Header -->
            <tr>
              <td style="background-color:#ffffff;padding:24px 20px;text-align:center;border-bottom:1px solid #eee;">
                <img src="https://jobguinee-pro.com/logo_jobguinee.png" alt="JobGuin&#233;e" width="180" style="max-height:60px;width:auto;border:0;display:inline-block;">
              </td>
            </tr>
            <!-- Content -->
            <tr>
              <td style="padding:32px 28px;color:#243B6B;font-family:Arial,Helvetica,sans-serif;">
                <h2 style="margin:0 0 16px 0;color:#1F3C88;font-size:22px;">R&#233;initialisation de mot de passe</h2>
                <p style="font-size:16px;line-height:1.6;margin:0 0 12px 0;">Bonjour,</p>
                <p style="font-size:16px;line-height:1.6;margin:0 0 24px 0;">
                  Vous avez demand&#233; la r&#233;initialisation de votre mot de passe sur <strong>JobGuin&#233;e</strong>.
                  Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :
                </p>
                <!-- BULLETPROOF BUTTON -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%">
                  <tr>
                    <td align="center" style="padding:8px 0 24px 0;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="border-radius:6px;background-color:#1F3C88;">
                            <a href="{{ .ConfirmationURL }}" target="_blank" rel="noopener" style="background-color:#1F3C88;border:1px solid #1F3C88;border-radius:6px;color:#ffffff;display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;line-height:1.2;padding:14px 36px;text-decoration:none;text-align:center;mso-padding-alt:0;">
                              <!--[if mso]><i style="mso-font-width:150%;mso-text-raise:18px;" hidden>&emsp;</i><![endif]-->
                              <span style="mso-text-raise:9px;">R&#233;initialiser mon mot de passe</span>
                              <!--[if mso]><i style="mso-font-width:150%;" hidden>&emsp;&#8203;</i><![endif]-->
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                <!-- Fallback -->
                <p style="font-size:13px;color:#666;line-height:1.5;margin:0 0 16px 0;">
                  Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
                  <a href="{{ .ConfirmationURL }}" target="_blank" rel="noopener" style="color:#1F3C88;word-break:break-all;text-decoration:underline;">{{ .ConfirmationURL }}</a>
                </p>
                <p style="font-size:15px;line-height:1.6;margin:0 0 16px 0;">
                  Si vous n&#8217;avez pas demand&#233; cette r&#233;initialisation, ignorez simplement cet email. Votre mot de passe ne sera pas modifi&#233;.
                </p>
                <p style="font-size:14px;color:#666;margin:24px 0 0 0;padding-top:16px;border-top:1px solid #eee;">
                  Cordialement,<br>
                  <strong>L&#8217;&#233;quipe JobGuin&#233;e</strong>
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background-color:#F0F2F5;padding:16px 20px;text-align:center;font-size:12px;color:#777;font-family:Arial,Helvetica,sans-serif;">
                &#169; 2026 JobGuin&#233;e &#8211; Tous droits r&#233;serv&#233;s<br>
                Ceci est un email automatique, merci de ne pas r&#233;pondre.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
'@

# ================================================================
# TEMPLATE 3: Email Change Confirmation
# ================================================================
$emailChangeHtml = @'
<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Changement d&#8217;email - JobGuin&#233;e</title>
</head>
<body style="margin:0;padding:0;word-spacing:normal;background-color:#F6F8FB;">
  <div role="article" aria-roledescription="email" lang="fr" style="text-size-adjust:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F6F8FB;">
      <tr>
        <td align="center" style="padding:20px 10px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <!-- Header -->
            <tr>
              <td style="background-color:#ffffff;padding:24px 20px;text-align:center;border-bottom:1px solid #eee;">
                <img src="https://jobguinee-pro.com/logo_jobguinee.png" alt="JobGuin&#233;e" width="180" style="max-height:60px;width:auto;border:0;display:inline-block;">
              </td>
            </tr>
            <!-- Content -->
            <tr>
              <td style="padding:32px 28px;color:#243B6B;font-family:Arial,Helvetica,sans-serif;">
                <h2 style="margin:0 0 16px 0;color:#1F3C88;font-size:22px;">Changement d&#8217;adresse email</h2>
                <p style="font-size:16px;line-height:1.6;margin:0 0 12px 0;">Bonjour,</p>
                <p style="font-size:16px;line-height:1.6;margin:0 0 24px 0;">
                  Vous avez demand&#233; le changement de votre adresse email de <strong>{{ .Email }}</strong> vers <strong>{{ .NewEmail }}</strong>.
                  Cliquez sur le bouton ci-dessous pour confirmer ce changement :
                </p>
                <!-- BULLETPROOF BUTTON -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%">
                  <tr>
                    <td align="center" style="padding:8px 0 24px 0;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="border-radius:6px;background-color:#1F3C88;">
                            <a href="{{ .ConfirmationURL }}" target="_blank" rel="noopener" style="background-color:#1F3C88;border:1px solid #1F3C88;border-radius:6px;color:#ffffff;display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;line-height:1.2;padding:14px 36px;text-decoration:none;text-align:center;mso-padding-alt:0;">
                              <!--[if mso]><i style="mso-font-width:150%;mso-text-raise:18px;" hidden>&emsp;</i><![endif]-->
                              <span style="mso-text-raise:9px;">Confirmer le changement</span>
                              <!--[if mso]><i style="mso-font-width:150%;" hidden>&emsp;&#8203;</i><![endif]-->
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                <!-- Fallback -->
                <p style="font-size:13px;color:#666;line-height:1.5;margin:0 0 16px 0;">
                  Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
                  <a href="{{ .ConfirmationURL }}" target="_blank" rel="noopener" style="color:#1F3C88;word-break:break-all;text-decoration:underline;">{{ .ConfirmationURL }}</a>
                </p>
                <p style="font-size:15px;line-height:1.6;margin:0 0 16px 0;">
                  Si vous n&#8217;avez pas demand&#233; ce changement, ignorez cet email.
                </p>
                <p style="font-size:14px;color:#666;margin:24px 0 0 0;padding-top:16px;border-top:1px solid #eee;">
                  Cordialement,<br>
                  <strong>L&#8217;&#233;quipe JobGuin&#233;e</strong>
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background-color:#F0F2F5;padding:16px 20px;text-align:center;font-size:12px;color:#777;font-family:Arial,Helvetica,sans-serif;">
                &#169; 2026 JobGuin&#233;e &#8211; Tous droits r&#233;serv&#233;s<br>
                Ceci est un email automatique, merci de ne pas r&#233;pondre.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
'@

# ================================================================
# TEMPLATE 4: Magic Link
# ================================================================
$magicLinkHtml = @'
<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Connexion - JobGuin&#233;e</title>
</head>
<body style="margin:0;padding:0;word-spacing:normal;background-color:#F6F8FB;">
  <div role="article" aria-roledescription="email" lang="fr" style="text-size-adjust:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F6F8FB;">
      <tr>
        <td align="center" style="padding:20px 10px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <tr>
              <td style="background-color:#ffffff;padding:24px 20px;text-align:center;border-bottom:1px solid #eee;">
                <img src="https://jobguinee-pro.com/logo_jobguinee.png" alt="JobGuin&#233;e" width="180" style="max-height:60px;width:auto;border:0;display:inline-block;">
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px;color:#243B6B;font-family:Arial,Helvetica,sans-serif;">
                <h2 style="margin:0 0 16px 0;color:#1F3C88;font-size:22px;">Votre lien de connexion</h2>
                <p style="font-size:16px;line-height:1.6;margin:0 0 24px 0;">
                  Cliquez sur le bouton ci-dessous pour vous connecter &#224; votre compte JobGuin&#233;e :
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%">
                  <tr>
                    <td align="center" style="padding:8px 0 24px 0;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="border-radius:6px;background-color:#1F3C88;">
                            <a href="{{ .ConfirmationURL }}" target="_blank" rel="noopener" style="background-color:#1F3C88;border:1px solid #1F3C88;border-radius:6px;color:#ffffff;display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;line-height:1.2;padding:14px 36px;text-decoration:none;text-align:center;mso-padding-alt:0;">
                              <span style="mso-text-raise:9px;">Me connecter</span>
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                <p style="font-size:13px;color:#666;line-height:1.5;margin:0 0 16px 0;">
                  Si le bouton ne fonctionne pas :<br>
                  <a href="{{ .ConfirmationURL }}" target="_blank" rel="noopener" style="color:#1F3C88;word-break:break-all;text-decoration:underline;">{{ .ConfirmationURL }}</a>
                </p>
                <p style="font-size:14px;color:#666;margin:24px 0 0 0;padding-top:16px;border-top:1px solid #eee;">
                  <strong>L&#8217;&#233;quipe JobGuin&#233;e</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#F0F2F5;padding:16px 20px;text-align:center;font-size:12px;color:#777;font-family:Arial,Helvetica,sans-serif;">
                &#169; 2026 JobGuin&#233;e &#8211; Tous droits r&#233;serv&#233;s
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
'@

# ================================================================
# TEMPLATE 5: Invite
# ================================================================
$inviteHtml = @'
<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Invitation - JobGuin&#233;e</title>
</head>
<body style="margin:0;padding:0;word-spacing:normal;background-color:#F6F8FB;">
  <div role="article" aria-roledescription="email" lang="fr" style="text-size-adjust:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F6F8FB;">
      <tr>
        <td align="center" style="padding:20px 10px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <tr>
              <td style="background-color:#ffffff;padding:24px 20px;text-align:center;border-bottom:1px solid #eee;">
                <img src="https://jobguinee-pro.com/logo_jobguinee.png" alt="JobGuin&#233;e" width="180" style="max-height:60px;width:auto;border:0;display:inline-block;">
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px;color:#243B6B;font-family:Arial,Helvetica,sans-serif;">
                <h2 style="margin:0 0 16px 0;color:#1F3C88;font-size:22px;">Vous &#234;tes invit&#233;(e) !</h2>
                <p style="font-size:16px;line-height:1.6;margin:0 0 24px 0;">
                  Vous avez &#233;t&#233; invit&#233;(e) &#224; rejoindre <strong>JobGuin&#233;e</strong>, la plateforme emploi #1 en Guin&#233;e.
                  Cliquez ci-dessous pour accepter l&#8217;invitation :
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%">
                  <tr>
                    <td align="center" style="padding:8px 0 24px 0;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="border-radius:6px;background-color:#1F3C88;">
                            <a href="{{ .ConfirmationURL }}" target="_blank" rel="noopener" style="background-color:#1F3C88;border:1px solid #1F3C88;border-radius:6px;color:#ffffff;display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;line-height:1.2;padding:14px 36px;text-decoration:none;text-align:center;mso-padding-alt:0;">
                              <span style="mso-text-raise:9px;">Accepter l&#8217;invitation</span>
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                <p style="font-size:13px;color:#666;line-height:1.5;margin:0 0 16px 0;">
                  Si le bouton ne fonctionne pas :<br>
                  <a href="{{ .ConfirmationURL }}" target="_blank" rel="noopener" style="color:#1F3C88;word-break:break-all;text-decoration:underline;">{{ .ConfirmationURL }}</a>
                </p>
                <p style="font-size:14px;color:#666;margin:24px 0 0 0;padding-top:16px;border-top:1px solid #eee;">
                  <strong>L&#8217;&#233;quipe JobGuin&#233;e</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#F0F2F5;padding:16px 20px;text-align:center;font-size:12px;color:#777;font-family:Arial,Helvetica,sans-serif;">
                &#169; 2026 JobGuin&#233;e &#8211; Tous droits r&#233;serv&#233;s
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
'@

# ================================================================
# PUSH TO SUPABASE
# ================================================================
Write-Host "=== Updating Supabase Auth Email Templates (mobile-friendly) ===" -ForegroundColor Cyan

$payload = @{
    mailer_templates_confirmation_content = $confirmationHtml
    mailer_templates_recovery_content = $recoveryHtml
    mailer_templates_email_change_content = $emailChangeHtml
    mailer_templates_magic_link_content = $magicLinkHtml
    mailer_templates_invite_content = $inviteHtml
    mailer_subjects_confirmation = "Confirmez votre inscription sur JobGuin\u00e9e"
    mailer_subjects_recovery = "R\u00e9initialisez votre mot de passe - JobGuin\u00e9e"
    mailer_subjects_email_change = "Confirmez le changement d\u0027email - JobGuin\u00e9e"
    mailer_subjects_magic_link = "Votre lien de connexion - JobGuin\u00e9e"
    mailer_subjects_invite = "Vous \u00eates invit\u00e9(e) sur JobGuin\u00e9e"
} | ConvertTo-Json -Depth 3

try {
    $result = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ref/config/auth" `
        -Method PATCH -Headers $headers -Body $payload
    
    Write-Host "`nSUCCESS: All 5 auth email templates updated!" -ForegroundColor Green
    Write-Host "  - Confirmation (signup)" -ForegroundColor White
    Write-Host "  - Password recovery" -ForegroundColor White
    Write-Host "  - Email change" -ForegroundColor White
    Write-Host "  - Magic link" -ForegroundColor White
    Write-Host "  - Invitation" -ForegroundColor White
    Write-Host "`nAll templates now use:" -ForegroundColor Yellow
    Write-Host "  - Bulletproof table-based buttons (mobile-compatible)" -ForegroundColor White
    Write-Host "  - target=_blank on all links" -ForegroundColor White
    Write-Host "  - Fallback plain-text URL below each button" -ForegroundColor White
    Write-Host "  - Proper viewport meta for mobile" -ForegroundColor White
    Write-Host "  - HTML entities instead of raw unicode" -ForegroundColor White
    Write-Host "  - French language" -ForegroundColor White
} catch {
    Write-Error "FAILED to update auth config: $_"
    if ($_.Exception.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errBody = $reader.ReadToEnd()
            Write-Host "Response: $errBody" -ForegroundColor Red
        } catch {}
    }
}
