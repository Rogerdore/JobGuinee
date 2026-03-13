$ErrorActionPreference = "Stop"

$code = @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class CFMAIL {
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
$token = [CFMAIL]::GetPassword("Supabase CLI:supabase")
if (-not $token) { Write-Error "No supabase token found"; exit 1 }

$ref = "hhhjzgeidjqctuveopso"
$mgmtHeaders = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Step 1: List unconfirmed users
Write-Host "=== UNCONFIRMED USERS ===" -ForegroundColor Yellow
$sql1 = "SELECT id, email, email_confirmed_at, created_at FROM auth.users WHERE email_confirmed_at IS NULL ORDER BY created_at DESC;"
$body1 = @{ query = $sql1 } | ConvertTo-Json
$result1 = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ref/database/query" -Method POST -Headers $mgmtHeaders -Body $body1
$result1 | Format-Table -AutoSize | Out-String | Write-Host

$count = ($result1 | Measure-Object).Count
Write-Host "`nFound $count unconfirmed user(s).`n" -ForegroundColor Cyan

if ($count -eq 0) {
    Write-Host "No unconfirmed users. Nothing to do." -ForegroundColor Green
    exit 0
}

# Step 2: Confirm all unconfirmed users
Write-Host "Confirming all unconfirmed emails..." -ForegroundColor Cyan
$sql2 = "UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL RETURNING id, email, email_confirmed_at;"
$body2 = @{ query = $sql2 } | ConvertTo-Json
$result2 = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ref/database/query" -Method POST -Headers $mgmtHeaders -Body $body2
$result2 | Format-Table -AutoSize | Out-String | Write-Host

# Step 3: Also update profiles.is_account_confirmed
Write-Host "Updating profiles.is_account_confirmed..." -ForegroundColor Cyan
$sql3 = "UPDATE profiles SET is_account_confirmed = true WHERE is_account_confirmed = false OR is_account_confirmed IS NULL RETURNING id, email, is_account_confirmed;"
$body3 = @{ query = $sql3 } | ConvertTo-Json
$result3 = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ref/database/query" -Method POST -Headers $mgmtHeaders -Body $body3
$result3 | Format-Table -AutoSize | Out-String | Write-Host

# Step 4: Final verification
Write-Host "=== VERIFICATION ===" -ForegroundColor Green
$sql4 = "SELECT COUNT(*) as unconfirmed_count FROM auth.users WHERE email_confirmed_at IS NULL;"
$body4 = @{ query = $sql4 } | ConvertTo-Json
$result4 = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ref/database/query" -Method POST -Headers $mgmtHeaders -Body $body4
Write-Host "Remaining unconfirmed: $($result4[0].unconfirmed_count)"

Write-Host "`nDONE - All existing accounts are now confirmed." -ForegroundColor Green
