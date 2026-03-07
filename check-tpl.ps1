$code = @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class CTPL {
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

$token = [CTPL]::GetPassword("Supabase CLI:supabase")
$ref = "hhhjzgeidjqctuveopso"
$baseUrl = "https://api.supabase.com/v1/projects/$ref/database/query"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

function RunSQL($sql, $label) {
    $body = [System.Text.Encoding]::UTF8.GetBytes((@{ query = $sql } | ConvertTo-Json -Depth 5))
    try {
        $r = Invoke-WebRequest -Uri $baseUrl -Method POST -Headers $headers -Body $body -UseBasicParsing
        Write-Host "$label : OK ($($r.StatusCode))"
        Write-Host $r.Content
        return $r.Content
    } catch {
        Write-Host "$label : ERROR - $($_.Exception.Message)"
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $body = $reader.ReadToEnd()
            Write-Host "$label BODY: $body"
        } catch { Write-Host "$label BODY_ERR: $($_.Exception.Message)" }
        return $null
    }
}

# 1. Full column list
Write-Host "=== COLUMNS ==="
RunSQL "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'email_templates' ORDER BY ordinal_position" "Columns"

# 2. Check constraints
Write-Host "`n=== CONSTRAINTS ==="
RunSQL "SELECT conname, contype, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'email_templates'::regclass" "Constraints"

# 3. Existing data count
Write-Host "`n=== COUNT ==="
RunSQL "SELECT count(*) as cnt FROM email_templates" "Count"

# 4. Try a minimal insert to isolate the issue
Write-Host "`n=== MINIMAL INSERT TEST ==="
RunSQL "INSERT INTO email_templates (template_key, name, subject, html_body, is_active) VALUES ('_test_debug', 'Test', 'Test Subject', '<p>Hello</p>', true) ON CONFLICT (template_key) DO UPDATE SET name = EXCLUDED.name RETURNING template_key" "MinInsert"

# 5. Delete the test row
Write-Host "`n=== CLEANUP ==="
RunSQL "DELETE FROM email_templates WHERE template_key = '_test_debug'" "Cleanup"
