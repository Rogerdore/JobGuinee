$ErrorActionPreference = "Stop"
$outFile = "C:\Users\Lenovo\Downloads\JobGuinee\migration-output.log"

$code = @"
using System;
using System.Runtime.InteropServices;

public class CredManager2 {
    [DllImport("advapi32.dll", SetLastError=true, CharSet=CharSet.Unicode)]
    private static extern bool CredRead(string target, int type, int flags, out IntPtr credential);

    [DllImport("advapi32.dll")]
    private static extern void CredFree(IntPtr buffer);

    [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
    private struct CREDENTIAL {
        public int Flags;
        public int Type;
        public string TargetName;
        public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public int CredentialBlobSize;
        public IntPtr CredentialBlob;
        public int Persist;
        public int AttributeCount;
        public IntPtr Attributes;
        public string TargetAlias;
        public string UserName;
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

try {
    Add-Type -TypeDefinition $code -Language CSharp
} catch {
    # Type may already be loaded
}

$token = [CredManager2]::GetPassword("Supabase CLI:supabase")
if (-not $token) {
    "ERROR: Token not found" | Out-File $outFile
    exit 1
}

"Token found, length: $($token.Length)" | Out-File $outFile

$ref = "hhhjzgeidjqctuveopso"
$sqlFile = "C:\Users\Lenovo\Downloads\JobGuinee\supabase\migrations\20260307120000_add_account_confirmation_for_oauth.sql"
$sql = Get-Content $sqlFile -Raw -Encoding UTF8

"SQL length: $($sql.Length) chars" | Out-File $outFile -Append

$body = @{ query = $sql } | ConvertTo-Json -Depth 10 -Compress
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
    "Accept" = "application/json"
}

try {
    $response = Invoke-WebRequest -Uri "https://api.supabase.com/v1/projects/$ref/database/query" -Method POST -Headers $headers -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) -UseBasicParsing
    "STATUS: $($response.StatusCode)" | Out-File $outFile -Append
    "RESPONSE: $($response.Content.Substring(0, [Math]::Min(2000, $response.Content.Length)))" | Out-File $outFile -Append
    "SQL_SUCCESS" | Out-File $outFile -Append
} catch {
    "SQL_ERROR: $($_.Exception.Message)" | Out-File $outFile -Append
    if ($_.Exception.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errBody = $reader.ReadToEnd()
            "ERROR_BODY: $errBody" | Out-File $outFile -Append
        } catch {
            "Could not read error body" | Out-File $outFile -Append
        }
    }
}
