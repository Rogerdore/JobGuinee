$code = @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class CDBG6 {
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
$token = [CDBG6]::GetPassword("Supabase CLI:supabase")
$ref = "hhhjzgeidjqctuveopso"
$baseUrl = "https://api.supabase.com/v1/projects/$ref/database/query"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
$out = "C:\Users\Lenovo\Downloads\JobGuinee\debug-role2.log"
"Starting at $(Get-Date)" | Out-File $out

function RunSQL($sql, $label) {
    $body = [System.Text.Encoding]::UTF8.GetBytes((@{ query = $sql } | ConvertTo-Json -Depth 5))
    try {
        $r = Invoke-WebRequest -Uri $baseUrl -Method POST -Headers $headers -Body $body -UseBasicParsing
        "$label : $($r.Content)" | Out-File $out -Append
    } catch {
        "$label : ERROR - $($_.Exception.Message)" | Out-File $out -Append
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            "$label BODY: $($reader.ReadToEnd())" | Out-File $out -Append
        } catch {}
    }
}

# Check candidate_profiles structure
RunSQL "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'candidate_profiles' ORDER BY ordinal_position" "CandCols"

# Check if welcome_candidate template exists
RunSQL "SELECT template_key, is_active FROM email_templates WHERE template_key IN ('welcome_candidate', 'welcome_recruiter', 'welcome_confirmed')" "WelcomeTemplates"

# Simulate what handle_user_email_confirmed does - test without actually modifying
RunSQL "SELECT COALESCE(raw_user_meta_data->>'user_type', 'candidate') as user_type, COALESCE(app_metadata->>'provider', 'email') as provider FROM auth.users WHERE id = 'afd8168d-0745-47ef-a2c9-973c2663bd7f'" "TriggerInput"

# Check the trigger's type/event more precisely
RunSQL "SELECT t.tgname, t.tgtype, pg_get_triggerdef(t.oid) FROM pg_trigger t WHERE t.tgrelid = 'auth.users'::regclass" "AllTriggers"

# Check if ALL users have profiles (find orphans)
RunSQL "SELECT au.id, au.email, au.email_confirmed_at IS NOT NULL as confirmed, p.id IS NOT NULL as has_profile, p.user_type FROM auth.users au LEFT JOIN profiles p ON p.id = au.id ORDER BY au.created_at DESC LIMIT 10" "OrphansCheck"

"Done at $(Get-Date)" | Out-File $out -Append
