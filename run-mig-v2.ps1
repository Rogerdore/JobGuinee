$code = @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class CM6 {
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

$token = [CM6]::GetPassword("Supabase CLI:supabase")
$out = "C:\Users\Lenovo\Downloads\JobGuinee\mig6.log"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
$ref = "hhhjzgeidjqctuveopso"
$baseUrl = "https://api.supabase.com/v1/projects/$ref/database/query"

function RunSQL($sql, $label) {
    $body = [System.Text.Encoding]::UTF8.GetBytes((@{ query = $sql } | ConvertTo-Json -Depth 5))
    try {
        $r = Invoke-WebRequest -Uri $baseUrl -Method POST -Headers $headers -Body $body -UseBasicParsing
        "$label : OK ($($r.StatusCode))" | Out-File $out -Append
        return $true
    } catch {
        "$label : ERROR - $($_.Exception.Message)" | Out-File $out -Append
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            "$label BODY: $($reader.ReadToEnd())" | Out-File $out -Append
        } catch { "$label BODY_ERR: $($_.Exception.Message)" | Out-File $out -Append }
        return $false
    }
}

"Starting migration at $(Get-Date)" | Out-File $out

# Step 4: handle_new_user function (single-quoted heredoc preserves $$ literally)
$fnHandleNewUser = @'
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name  text;
  v_user_type  text;
  v_provider   text;
  v_company_id uuid;
  v_token      uuid;
BEGIN
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'candidate');
  v_provider  := COALESCE(NEW.app_metadata->>'provider', 'email');

  IF v_provider = 'email' THEN
    RETURN NEW;
  END IF;

  v_token := gen_random_uuid();

  IF v_user_type = 'recruiter' THEN
    INSERT INTO public.companies (name, industry, size, description, created_at, updated_at)
    VALUES (
      v_full_name || '''s Company',
      'Technology', '1-10',
      'Welcome to ' || v_full_name || '''s Company',
      now(), now()
    )
    RETURNING id INTO v_company_id;
  END IF;

  INSERT INTO public.profiles (
    id, email, full_name, user_type, company_id, credits_balance,
    is_account_confirmed, confirmation_token,
    created_at, updated_at
  )
  VALUES (
    NEW.id, NEW.email, v_full_name, v_user_type, v_company_id, 0,
    false, v_token,
    now(), now()
  )
  ON CONFLICT (id) DO NOTHING;

  IF v_user_type = 'recruiter' AND v_company_id IS NOT NULL THEN
    INSERT INTO public.recruiter_profiles (profile_id, user_id, company_id, is_verified, created_at, updated_at)
    VALUES (NEW.id, NEW.id, v_company_id, false, now(), now())
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_user_type = 'candidate' THEN
    INSERT INTO public.candidate_profiles (profile_id, user_id, is_public, is_verified, created_at, updated_at)
    VALUES (NEW.id, NEW.id, false, false, now(), now())
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$
'@
RunSQL $fnHandleNewUser "FnHandleNewUser"

# Step 5: handle_user_email_confirmed function
$fnEmailConfirmed = @'
CREATE OR REPLACE FUNCTION handle_user_email_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name  text;
  v_user_type  text;
  v_company_id uuid;
BEGIN
  IF OLD.email_confirmed_at IS NOT NULL OR NEW.email_confirmed_at IS NULL THEN
    RETURN NEW;
  END IF;

  IF COALESCE(NEW.app_metadata->>'provider', 'email') <> 'email' THEN
    RETURN NEW;
  END IF;

  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'candidate');

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    UPDATE public.profiles
    SET is_account_confirmed = true, confirmation_token = NULL
    WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  IF v_user_type = 'recruiter' THEN
    INSERT INTO public.companies (name, industry, size, description, created_at, updated_at)
    VALUES (
      v_full_name || '''s Company',
      'Technology', '1-10',
      'Welcome to ' || v_full_name || '''s Company',
      now(), now()
    )
    RETURNING id INTO v_company_id;
  END IF;

  INSERT INTO public.profiles (
    id, email, full_name, user_type, company_id, credits_balance,
    is_account_confirmed,
    created_at, updated_at
  )
  VALUES (
    NEW.id, NEW.email, v_full_name, v_user_type, v_company_id, 0,
    true,
    now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    is_account_confirmed = true,
    confirmation_token = NULL;

  IF v_user_type = 'recruiter' AND v_company_id IS NOT NULL THEN
    INSERT INTO public.recruiter_profiles (profile_id, user_id, company_id, is_verified, created_at, updated_at)
    VALUES (NEW.id, NEW.id, v_company_id, false, now(), now())
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_user_type = 'candidate' THEN
    INSERT INTO public.candidate_profiles (profile_id, user_id, is_public, is_verified, created_at, updated_at)
    VALUES (NEW.id, NEW.id, false, false, now(), now())
    ON CONFLICT DO NOTHING;
  END IF;

  PERFORM queue_welcome_email(NEW.id, NEW.email, v_full_name, v_user_type);

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'handle_user_email_confirmed error: %', SQLERRM;
    RETURN NEW;
END;
$$
'@
RunSQL $fnEmailConfirmed "FnEmailConfirmed"

# Step 6: confirm_account_by_token RPC
$fnConfirm = @'
CREATE OR REPLACE FUNCTION confirm_account_by_token(p_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   uuid;
  v_email     text;
  v_full_name text;
  v_user_type text;
BEGIN
  UPDATE public.profiles
  SET is_account_confirmed = true,
      confirmation_token = NULL,
      updated_at = now()
  WHERE confirmation_token = p_token
    AND is_account_confirmed = false
  RETURNING id, email, full_name, user_type
  INTO v_user_id, v_email, v_full_name, v_user_type;

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Token invalide ou compte deja confirme');
  END IF;

  PERFORM queue_welcome_email(v_user_id, v_email, v_full_name, v_user_type);

  RETURN json_build_object('success', true, 'email', v_email);
END;
$$
'@
RunSQL $fnConfirm "FnConfirmToken"

# Step 7: Grant permissions
RunSQL "GRANT EXECUTE ON FUNCTION confirm_account_by_token(uuid) TO anon" "GrantAnon"
RunSQL "GRANT EXECUTE ON FUNCTION confirm_account_by_token(uuid) TO authenticated" "GrantAuth"

# Step 8: Email template (single-quoted heredoc)
$templateSQL = @'
INSERT INTO email_templates (template_key, name, subject, html_body, is_active, created_at, updated_at)
VALUES (
  'account_confirmation_oauth',
  'Confirmation de compte (Google)',
  'Confirmez votre inscription sur JobGuinée',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #1e3a5f; margin: 0;">JobGuinée</h1>
      <p style="color: #666; font-size: 14px;">La plateforme emploi de la Guinée</p>
    </div>
    <h2 style="color: #333;">Bienvenue {{user_name}} !</h2>
    <p style="color: #555; font-size: 16px; line-height: 1.6;">
      Vous vous êtes inscrit(e) sur <strong>JobGuinée</strong> avec votre compte Google.
      Pour activer votre compte, veuillez confirmer votre inscription en cliquant sur le bouton ci-dessous :
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{confirmation_url}}"
         style="display: inline-block; padding: 14px 32px; background-color: #1e3a5f;
                color: white; text-decoration: none; border-radius: 8px; font-size: 16px;
                font-weight: bold;">
        Confirmer mon inscription
      </a>
    </div>
    <p style="color: #888; font-size: 13px; line-height: 1.5;">
      Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br/>
      <a href="{{confirmation_url}}" style="color: #1e3a5f; word-break: break-all;">{{confirmation_url}}</a>
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
    <p style="color: #999; font-size: 12px; text-align: center;">
      Si vous n''avez pas créé de compte sur JobGuinée, ignorez cet email.
    </p>
  </div>',
  true,
  now(),
  now()
)
ON CONFLICT (template_key) DO UPDATE SET
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  is_active = true,
  updated_at = now()
'@
RunSQL $templateSQL "EmailTemplate"

"MIGRATION COMPLETE at $(Get-Date)" | Out-File $out -Append
