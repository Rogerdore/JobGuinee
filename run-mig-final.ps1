$code = @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class CM4 {
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
            // Read raw bytes and decode as UTF-8
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

$token = [CM4]::GetPassword("Supabase CLI:supabase")
$out = "C:\Users\Lenovo\Downloads\JobGuinee\mig4.log"
"Token prefix: $($token.Substring(0,10))... length: $($token.Length)" | Out-File $out

# Run actual migration
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$sqlFile = "C:\Users\Lenovo\Downloads\JobGuinee\supabase\migrations\20260307120000_add_account_confirmation_for_oauth.sql"
$sql = [System.IO.File]::ReadAllText($sqlFile, [System.Text.Encoding]::UTF8)
"SQL length: $($sql.Length)" | Out-File $out -Append

$body = @{ query = $sql } | ConvertTo-Json -Depth 10
$bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)

try {
    $headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
    $r = Invoke-WebRequest -Uri "https://api.supabase.com/v1/projects/hhhjzgeidjqctuveopso/database/query" -Method POST -Headers $headers -Body $bodyBytes -UseBasicParsing
    "STATUS: $($r.StatusCode)" | Out-File $out -Append
    $content = $r.Content
    if ($content.Length -gt 3000) { $content = $content.Substring(0,3000) + "...(truncated)" }
    "RESPONSE: $content" | Out-File $out -Append
    "SQL_SUCCESS" | Out-File $out -Append
} catch {
    "ERROR: $($_.Exception.Message)" | Out-File $out -Append
    try {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errBody = $reader.ReadToEnd()
        "ERROR_BODY: $errBody" | Out-File $out -Append
    } catch {
        "No error body" | Out-File $out -Append
    }
}
