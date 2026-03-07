$code = @"
using System;
using System.Runtime.InteropServices;
public class CM3 {
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
            var pwd = Marshal.PtrToStringUni(cred.CredentialBlob, cred.CredentialBlobSize / 2);
            CredFree(credPtr);
            return pwd;
        }
        return null;
    }
}
"@
try { Add-Type -TypeDefinition $code } catch {}

$token = [CM3]::GetPassword("Supabase CLI:supabase")
$out = "C:\Users\Lenovo\Downloads\JobGuinee\mig3.log"
"Token prefix: $($token.Substring(0,6))... length: $($token.Length)" | Out-File $out

# Test with simple query first 
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
    $body = '{"query":"SELECT count(*) as cnt FROM profiles"}'
    $r = Invoke-WebRequest -Uri "https://api.supabase.com/v1/projects/hhhjzgeidjqctuveopso/database/query" -Method POST -Headers $headers -Body $body -UseBasicParsing
    "Test query status: $($r.StatusCode)" | Out-File $out -Append
    "Test query result: $($r.Content)" | Out-File $out -Append
} catch {
    "Test query error: $($_.Exception.Message)" | Out-File $out -Append
    try {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        "Error body: $($reader.ReadToEnd())" | Out-File $out -Append
    } catch {
        "No error body available" | Out-File $out -Append
    }
}
