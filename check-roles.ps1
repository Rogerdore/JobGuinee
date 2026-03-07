$code = @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class CDBG {
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

$token = [CDBG]::GetPassword("Supabase CLI:supabase")
$ref = "hhhjzgeidjqctuveopso"
$baseUrl = "https://api.supabase.com/v1/projects/$ref/database/query"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

function RunSQL($sql, $label) {
    $body = [System.Text.Encoding]::UTF8.GetBytes((@{ query = $sql } | ConvertTo-Json -Depth 5))
    try {
        $r = Invoke-WebRequest -Uri $baseUrl -Method POST -Headers $headers -Body $body -UseBasicParsing
        Write-Host "$label :"
        Write-Host $r.Content
        return $r.Content
    } catch {
        Write-Host "$label : ERROR - $($_.Exception.Message)"
        return $null
    }
}

# Check recent signups
Write-Host "=== RECENT PROFILES (last 5) ==="
RunSQL "SELECT id, email, full_name, user_type, is_account_confirmed, created_at FROM profiles ORDER BY created_at DESC LIMIT 5" "RecentProfiles"

Write-Host ""
Write-Host "=== RECENT AUTH USERS (last 5) ==="
RunSQL "SELECT id, email, raw_user_meta_data->>'user_type' as meta_user_type, raw_user_meta_data->>'full_name' as meta_name, raw_app_meta_data->>'provider' as provider, email_confirmed_at, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5" "RecentAuthUsers"

Write-Host ""
Write-Host "=== CHECK handle_new_user FUNCTION ==="
RunSQL "SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user'" "FnSrc"
