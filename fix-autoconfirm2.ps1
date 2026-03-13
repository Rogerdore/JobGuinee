$ErrorActionPreference = "Stop"

$code = @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class FIXAC2 {
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
$token = [FIXAC2]::GetPassword("Supabase CLI:supabase")
if (-not $token) { Write-Error "No supabase token found"; exit 1 }

$ref = "hhhjzgeidjqctuveopso"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Try multiple key formats to see which one the API accepts
$bodies = @(
    '{"MAILER_AUTOCONFIRM": false}',
    '{"mailer_autoconfirm": false}',
    '{"GOTRUE_MAILER_AUTOCONFIRM": false}'
)

foreach ($body in $bodies) {
    Write-Host "`nTrying: $body" -ForegroundColor Yellow
    try {
        $uri = "https://api.supabase.com/v1/projects/$ref/config/auth"
        $webReq = [System.Net.HttpWebRequest]::Create($uri)
        $webReq.Method = "PATCH"
        $webReq.ContentType = "application/json"
        $webReq.Headers.Add("Authorization", "Bearer $token")
        $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)
        $webReq.ContentLength = $bodyBytes.Length
        $stream = $webReq.GetRequestStream()
        $stream.Write($bodyBytes, 0, $bodyBytes.Length)
        $stream.Close()
        
        $webResp = $webReq.GetResponse()
        $reader = New-Object System.IO.StreamReader($webResp.GetResponseStream())
        $respText = $reader.ReadToEnd()
        $reader.Close()
        
        Write-Host "Status: $($webResp.StatusCode)" -ForegroundColor Green
        # Parse and show relevant field
        $parsed = $respText | ConvertFrom-Json
        Write-Host "Response MAILER_AUTOCONFIRM: $($parsed.MAILER_AUTOCONFIRM)"
    } catch {
        $errResp = $_.Exception.InnerException
        if ($errResp -and $errResp.Response) {
            $errReader = New-Object System.IO.StreamReader($errResp.Response.GetResponseStream())
            $errText = $errReader.ReadToEnd()
            Write-Host "Error: $errText" -ForegroundColor Red
        } else {
            Write-Host "Error: $_" -ForegroundColor Red
        }
    }
}

# Final check
Write-Host "`n=== FINAL STATE ===" -ForegroundColor Cyan
$final = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ref/config/auth" -Method GET -Headers $headers
Write-Host "MAILER_AUTOCONFIRM: $($final.MAILER_AUTOCONFIRM)"
