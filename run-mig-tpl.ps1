$code = @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class CM7 {
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

$token = [CM7]::GetPassword("Supabase CLI:supabase")
$out = "C:\Users\Lenovo\Downloads\JobGuinee\mig7.log"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
$ref = "hhhjzgeidjqctuveopso"
$baseUrl = "https://api.supabase.com/v1/projects/$ref/database/query"

function RunSQL($sql, $label) {
    $body = [System.Text.Encoding]::UTF8.GetBytes((@{ query = $sql } | ConvertTo-Json -Depth 5))
    try {
        $r = Invoke-WebRequest -Uri $baseUrl -Method POST -Headers $headers -Body $body -UseBasicParsing
        "$label : OK ($($r.StatusCode)) - $($r.Content.Substring(0, [Math]::Min(200, $r.Content.Length)))" | Out-File $out -Append
        return $true
    } catch {
        "$label : ERROR - $($_.Exception.Message)" | Out-File $out -Append
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            "$label BODY: $($reader.ReadToEnd())" | Out-File $out -Append
        } catch { "$label BODY_ERR: $($_.Exception.Message)" | Out-File $out -Append }
        return $false
    }
}

"Starting at $(Get-Date)" | Out-File $out

# First check if email_templates table exists and its structure
RunSQL "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'email_templates' ORDER BY ordinal_position" "CheckTable"

# Try simple insert first
RunSQL "SELECT template_key FROM email_templates LIMIT 5" "CheckData"

# Try inserting with dollar-quoting for the HTML body to avoid quote escaping issues
$tplSQL = @'
INSERT INTO email_templates (template_key, name, subject, html_body, is_active, created_at, updated_at)
VALUES (
  'account_confirmation_oauth',
  'Confirmation de compte (Google)',
  'Confirmez votre inscription sur JobGuinée',
  $HTML$<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="text-align: center; margin-bottom: 30px;"><h1 style="color: #1e3a5f; margin: 0;">JobGuinée</h1><p style="color: #666; font-size: 14px;">La plateforme emploi de la Guinée</p></div><h2 style="color: #333;">Bienvenue {{user_name}} !</h2><p style="color: #555; font-size: 16px; line-height: 1.6;">Vous vous êtes inscrit(e) sur <strong>JobGuinée</strong> avec votre compte Google. Pour activer votre compte, veuillez confirmer votre inscription en cliquant sur le bouton ci-dessous :</p><div style="text-align: center; margin: 30px 0;"><a href="{{confirmation_url}}" style="display: inline-block; padding: 14px 32px; background-color: #1e3a5f; color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">Confirmer mon inscription</a></div><p style="color: #888; font-size: 13px; line-height: 1.5;">Si le bouton ne fonctionne pas, copiez et collez ce lien :<br/><a href="{{confirmation_url}}" style="color: #1e3a5f; word-break: break-all;">{{confirmation_url}}</a></p><hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" /><p style="color: #999; font-size: 12px; text-align: center;">Si vous n'avez pas créé de compte sur JobGuinée, ignorez cet email.</p></div>$HTML$,
  true,
  now(),
  now()
)
ON CONFLICT (template_key) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  is_active = true,
  updated_at = now()
'@
RunSQL $tplSQL "EmailTemplate"

"DONE at $(Get-Date)" | Out-File $out -Append
