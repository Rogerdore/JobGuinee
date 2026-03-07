$code = @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class CDBG5B {
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
$token = [CDBG5B]::GetPassword("Supabase CLI:supabase")
$ref = "hhhjzgeidjqctuveopso"
$baseUrl = "https://api.supabase.com/v1/projects/$ref/database/query"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
$out = "C:\Users\Lenovo\Downloads\JobGuinee\debug-role.log"
"Starting at $(Get-Date)" | Out-File $out

function RunSQL($sql, $label) {
    $body = [System.Text.Encoding]::UTF8.GetBytes((@{ query = $sql } | ConvertTo-Json -Depth 5))
    try {
        $r = Invoke-WebRequest -Uri $baseUrl -Method POST -Headers $headers -Body $body -UseBasicParsing
        "$label : $($r.Content)" | Out-File $out -Append
    } catch {
        "$label : ERROR - $($_.Exception.Message)" | Out-File $out -Append
    }
}

RunSQL "SELECT prosrc FROM pg_proc WHERE proname = 'queue_welcome_email'" "QueueFnBody"
RunSQL "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'email_queue' ORDER BY ordinal_position" "EmailQueueCols"

# Manually create the missing profile
RunSQL "INSERT INTO public.profiles (id, email, full_name, user_type, credits_balance, is_account_confirmed, created_at, updated_at) VALUES ('afd8168d-0745-47ef-a2c9-973c2663bd7f', 'entreprisedore@gmail.com', 'df', 'candidate', 10, true, now(), now()) ON CONFLICT (id) DO UPDATE SET user_type = 'candidate', is_account_confirmed = true RETURNING id, email, user_type" "FixProfile"

# Create candidate sub-profile
RunSQL "INSERT INTO public.candidate_profiles (profile_id, user_id, is_public, is_verified, created_at, updated_at) VALUES ('afd8168d-0745-47ef-a2c9-973c2663bd7f', 'afd8168d-0745-47ef-a2c9-973c2663bd7f', false, false, now(), now()) ON CONFLICT DO NOTHING RETURNING profile_id" "FixCandidateProfile"

"Done at $(Get-Date)" | Out-File $out -Append
