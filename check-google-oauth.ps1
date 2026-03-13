$ErrorActionPreference = "Stop"

$code = @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class GOAUTH {
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
$token = [GOAUTH]::GetPassword("Supabase CLI:supabase")
if (-not $token) { Write-Error "No supabase token found"; exit 1 }

$ref = "hhhjzgeidjqctuveopso"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$resp = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ref/config/auth" -Method GET -Headers $headers

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SUPABASE AUTH CONFIG - VERIFICATION"
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n--- SITE URL ---" -ForegroundColor Yellow
Write-Host "SITE_URL: $($resp.SITE_URL)"

Write-Host "`n--- REDIRECT URLs (URI_ALLOW_LIST) ---" -ForegroundColor Yellow
Write-Host "URI_ALLOW_LIST: $($resp.URI_ALLOW_LIST)"

Write-Host "`n--- GOOGLE OAUTH PROVIDER ---" -ForegroundColor Yellow
$resp.PSObject.Properties | Where-Object { $_.Name -like "EXTERNAL_GOOGLE*" } | ForEach-Object {
    if ($_.Name -like "*SECRET*") {
        $masked = if ($_.Value) { "$($_.Value.Substring(0,6))****" } else { "(empty)" }
        Write-Host "$($_.Name): $masked"
    } else {
        Write-Host "$($_.Name): $($_.Value)"
    }
}

Write-Host "`n--- EMAIL / CONFIRMATION ---" -ForegroundColor Yellow
Write-Host "MAILER_AUTOCONFIRM: $($resp.MAILER_AUTOCONFIRM)"
Write-Host "MAILER_OTP_EXP: $($resp.MAILER_OTP_EXP)"
Write-Host "EXTERNAL_EMAIL_ENABLED: $($resp.EXTERNAL_EMAIL_ENABLED)"

Write-Host "`n--- SECURITY ---" -ForegroundColor Yellow
Write-Host "SECURITY_CAPTCHA_ENABLED: $($resp.SECURITY_CAPTCHA_ENABLED)"
Write-Host "SECURITY_REFRESH_TOKEN_ROTATION_ENABLED: $($resp.SECURITY_REFRESH_TOKEN_ROTATION_ENABLED)"

Write-Host "`n--- PKCE / FLOW TYPE ---" -ForegroundColor Yellow
$resp.PSObject.Properties | Where-Object { $_.Name -like "*PKCE*" -or $_.Name -like "*FLOW*" } | ForEach-Object {
    Write-Host "$($_.Name): $($_.Value)"
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  VERIFICATION DONE"
Write-Host "========================================" -ForegroundColor Cyan
