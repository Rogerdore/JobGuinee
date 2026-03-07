$code = @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class CFIX {
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
$token = [CFIX]::GetPassword("Supabase CLI:supabase")
$ref = "hhhjzgeidjqctuveopso"
$baseUrl = "https://api.supabase.com/v1/projects/$ref/database/query"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
$out = "C:\Users\Lenovo\Downloads\JobGuinee\fix-triggers.log"
"Starting at $(Get-Date)" | Out-File $out

function RunSQL($sql, $label) {
    $body = [System.Text.Encoding]::UTF8.GetBytes((@{ query = $sql } | ConvertTo-Json -Depth 5))
    try {
        $r = Invoke-WebRequest -Uri $baseUrl -Method POST -Headers $headers -Body $body -UseBasicParsing
        "$label : OK ($($r.StatusCode)) - $($r.Content.Substring(0, [Math]::Min(500, $r.Content.Length)))" | Out-File $out -Append
        return $true
    } catch {
        "$label : ERROR - $($_.Exception.Message)" | Out-File $out -Append
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            "$label BODY: $($reader.ReadToEnd())" | Out-File $out -Append
        } catch {}
        return $false
    }
}

# =====================================================
# STEP 1: Fix handle_user_email_confirmed trigger
# Replace is_public with visibility='private'
# Add nested BEGIN/EXCEPTION to isolate welcome email errors
# =====================================================
$fixTrigger1 = @'
CREATE OR REPLACE FUNCTION handle_user_email_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_full_name  text;
  v_user_type  text;
  v_company_id uuid;
BEGIN
  -- Only act when email_confirmed_at transitions NULL -> non-null
  IF OLD.email_confirmed_at IS NOT NULL OR NEW.email_confirmed_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Do nothing for OAuth users (handled by custom token flow)
  IF COALESCE(NEW.app_metadata->>'provider', 'email') <> 'email' THEN
    RETURN NEW;
  END IF;

  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'candidate');

  -- If profile already exists, just mark confirmed
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    UPDATE public.profiles
    SET is_account_confirmed = true, confirmation_token = NULL, updated_at = now()
    WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  -- Create company for recruiter
  IF v_user_type = 'recruiter' THEN
    INSERT INTO public.companies (name, industry, size, description, created_at, updated_at)
    VALUES (
      v_full_name || '''s Company',
      'Technology', '1-10',
      'Bienvenue chez ' || v_full_name,
      now(), now()
    )
    RETURNING id INTO v_company_id;
  END IF;

  -- Create profile (confirmed for email/password users)
  INSERT INTO public.profiles (
    id, email, full_name, user_type, company_id, credits_balance,
    is_account_confirmed,
    created_at, updated_at
  )
  VALUES (
    NEW.id, NEW.email, v_full_name, v_user_type, v_company_id, 10,
    true,
    now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    is_account_confirmed = true,
    confirmation_token = NULL,
    updated_at = now();

  -- Create recruiter sub-profile
  IF v_user_type = 'recruiter' AND v_company_id IS NOT NULL THEN
    BEGIN
      INSERT INTO public.recruiter_profiles (profile_id, user_id, company_id, is_verified, created_at, updated_at)
      VALUES (NEW.id, NEW.id, v_company_id, false, now(), now())
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'recruiter_profiles insert error: %', SQLERRM;
    END;
  END IF;

  -- Create candidate sub-profile (FIXED: use visibility instead of is_public)
  IF v_user_type = 'candidate' THEN
    BEGIN
      INSERT INTO public.candidate_profiles (profile_id, user_id, visibility, is_verified, created_at, updated_at)
      VALUES (NEW.id, NEW.id, 'private', false, now(), now())
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'candidate_profiles insert error: %', SQLERRM;
    END;
  END IF;

  -- Queue welcome email (isolated so it never rolls back profile creation)
  BEGIN
    PERFORM queue_welcome_email(NEW.id, NEW.email, v_full_name, v_user_type);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'queue_welcome_email error (non-blocking): %', SQLERRM;
  END;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'handle_user_email_confirmed FATAL error: %', SQLERRM;
    RETURN NEW;
END;
$fn$
'@
RunSQL $fixTrigger1 "FixEmailConfirmedTrigger"

# =====================================================
# STEP 2: Fix handle_new_user trigger (for OAuth)
# Same issue: is_public -> visibility
# =====================================================
$fixTrigger2 = @'
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
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

  -- For email/password signup: do nothing here.
  -- Profile created by handle_user_email_confirmed once user confirms.
  IF v_provider = 'email' THEN
    RETURN NEW;
  END IF;

  -- For OAuth (Google, etc.): create profile
  v_token := gen_random_uuid();

  IF v_user_type = 'recruiter' THEN
    INSERT INTO public.companies (name, industry, size, description, created_at, updated_at)
    VALUES (
      v_full_name || '''s Company',
      'Technology', '1-10',
      'Bienvenue chez ' || v_full_name,
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
    NEW.id, NEW.email, v_full_name, v_user_type, v_company_id, 10,
    false, v_token,
    now(), now()
  )
  ON CONFLICT (id) DO NOTHING;

  IF v_user_type = 'recruiter' AND v_company_id IS NOT NULL THEN
    BEGIN
      INSERT INTO public.recruiter_profiles (profile_id, user_id, company_id, is_verified, created_at, updated_at)
      VALUES (NEW.id, NEW.id, v_company_id, false, now(), now())
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'handle_new_user recruiter_profiles error: %', SQLERRM;
    END;
  END IF;

  IF v_user_type = 'candidate' THEN
    BEGIN
      INSERT INTO public.candidate_profiles (profile_id, user_id, visibility, is_verified, created_at, updated_at)
      VALUES (NEW.id, NEW.id, 'private', false, now(), now())
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'handle_new_user candidate_profiles error: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user FATAL error: %', SQLERRM;
    RETURN NEW;
END;
$fn$
'@
RunSQL $fixTrigger2 "FixNewUserTrigger"

# =====================================================
# STEP 3: Fix orphan users — create missing profiles
# =====================================================
$fixOrphans = @'
INSERT INTO public.profiles (id, email, full_name, user_type, credits_balance, is_account_confirmed, created_at, updated_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'user_type', 'candidate'),
  10,
  CASE WHEN au.email_confirmed_at IS NOT NULL THEN true ELSE false END,
  au.created_at,
  now()
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
  AND au.email_confirmed_at IS NOT NULL
ON CONFLICT (id) DO NOTHING
RETURNING id, email, user_type
'@
RunSQL $fixOrphans "FixOrphanProfiles"

# STEP 4: Verify all confirmed auth users now have profiles
$verify = @'
SELECT au.id, au.email,
  au.email_confirmed_at IS NOT NULL as confirmed,
  p.id IS NOT NULL as has_profile,
  p.user_type
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE au.email_confirmed_at IS NOT NULL
ORDER BY au.created_at DESC LIMIT 10
'@
RunSQL $verify "VerifyAll"

"Done at $(Get-Date)" | Out-File $out -Append
