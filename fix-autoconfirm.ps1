$ErrorActionPreference = "Stop"

$code = @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class FIXAC {
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
$token = [FIXAC]::GetPassword("Supabase CLI:supabase")
if (-not $token) { Write-Error "No supabase token found"; exit 1 }

$ref = "hhhjzgeidjqctuveopso"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Step 1: Show current value
Write-Host "=== BEFORE ===" -ForegroundColor Yellow
$before = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ref/config/auth" -Method GET -Headers $headers
Write-Host "MAILER_AUTOCONFIRM: $($before.MAILER_AUTOCONFIRM)"

# Step 2: PATCH to disable autoconfirm
Write-Host "`nApplying fix: MAILER_AUTOCONFIRM = false ..." -ForegroundColor Cyan
$body = '{"MAILER_AUTOCONFIRM": false}'
$patchResp = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ref/config/auth" -Method PATCH -Headers $headers -Body $body

# Step 3: Verify
Write-Host "`n=== AFTER ===" -ForegroundColor Green
$after = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ref/config/auth" -Method GET -Headers $headers
Write-Host "MAILER_AUTOCONFIRM: $($after.MAILER_AUTOCONFIRM)"

if ($after.MAILER_AUTOCONFIRM -eq $false) {
    Write-Host "`nSUCCESS: Email confirmation is now REQUIRED for new signups." -ForegroundColor Green
} else {
    Write-Host "`nWARNING: Value did not change!" -ForegroundColor Red
}
