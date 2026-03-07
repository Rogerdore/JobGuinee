# check-email-config.ps1 — Retrieve current Supabase auth email templates
$ErrorActionPreference = "Stop"

$code = @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class CEMAIL {
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
$token = [CEMAIL]::GetPassword("Supabase CLI:supabase")
if (-not $token) { Write-Error "No supabase_token credential"; exit 1 }
$ref = "hhhjzgeidjqctuveopso"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

Write-Host "=== Fetching Supabase Auth Config ===" -ForegroundColor Cyan

try {
    $resp = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ref/config/auth" `
        -Method GET -Headers $headers
    
    Write-Host "`n--- SITE URL ---" -ForegroundColor Yellow
    Write-Host "SITE_URL: $($resp.SITE_URL)"
    
    Write-Host "`n--- URI ALLOW LIST ---" -ForegroundColor Yellow
    Write-Host "URI_ALLOW_LIST: $($resp.URI_ALLOW_LIST)"
    
    Write-Host "`n--- MAILER SETTINGS ---" -ForegroundColor Yellow
    $resp.PSObject.Properties | Where-Object { $_.Name -like "MAILER_*" } | ForEach-Object {
        if ($_.Name -like "*CONTENT*" -or $_.Name -like "*BODY*") {
            $val = if ($_.Value) { "$($_.Value.ToString().Substring(0, [Math]::Min(300, $_.Value.ToString().Length)))..." } else { "(empty)" }
            Write-Host "$($_.Name): $val"
        } else {
            Write-Host "$($_.Name): $($_.Value)"
        }
    }

    Write-Host "`n--- SMTP SETTINGS ---" -ForegroundColor Yellow
    $resp.PSObject.Properties | Where-Object { $_.Name -like "SMTP_*" } | ForEach-Object {
        if ($_.Name -like "*PASS*") {
            Write-Host "$($_.Name): ****"
        } else {
            Write-Host "$($_.Name): $($_.Value)"
        }
    }
    
    Write-Host "`n--- EXTERNAL EMAIL ---" -ForegroundColor Yellow
    Write-Host "EXTERNAL_EMAIL_ENABLED: $($resp.EXTERNAL_EMAIL_ENABLED)"

    $resp | ConvertTo-Json -Depth 5 | Set-Content "email-config-dump.json"
    Write-Host "`nFull config saved to email-config-dump.json" -ForegroundColor Green
    
} catch {
    Write-Error "Failed: $_"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host $reader.ReadToEnd()
    }
}
