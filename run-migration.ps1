$code = @"
using System;
using System.Runtime.InteropServices;

public class CredManager {
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

Add-Type -TypeDefinition $code -Language CSharp
$token = [CredManager]::GetPassword("Supabase CLI:supabase")
if ($token) {
    Write-Host "TOKEN_FOUND"
    $env:SB_TOKEN = $token
    # Use Management API to run SQL
    $ref = "hhhjzgeidjqctuveopso"
    $sql = Get-Content "C:\Users\Lenovo\Downloads\JobGuinee\supabase\migrations\20260307120000_add_account_confirmation_for_oauth.sql" -Raw
    $body = @{ query = $sql } | ConvertTo-Json -Depth 10
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    try {
        $response = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ref/database/query" -Method POST -Headers $headers -Body $body
        Write-Host "SQL_SUCCESS"
        $response | ConvertTo-Json -Depth 5
    } catch {
        Write-Host "SQL_ERROR: $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            Write-Host "Response: $($reader.ReadToEnd())"
        }
    }
} else {
    Write-Host "TOKEN_NOT_FOUND"
}
