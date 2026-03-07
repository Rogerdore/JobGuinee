/*
  # Require account confirmation for Google OAuth users too

  ## Problem
  Google OAuth users are immediately logged in without confirming their
  registration on JobGuinée. The user wants ALL signup methods (email/password
  AND Google) to require an email confirmation step.

  ## Solution
  1. Add `is_account_confirmed` boolean + `confirmation_token` to profiles.
  2. Existing users are grandfathered (is_account_confirmed = true).
  3. `handle_new_user` (INSERT trigger for OAuth): create profile with
     is_account_confirmed = false and a confirmation_token.
  4. `handle_user_email_confirmed` (UPDATE trigger): set is_account_confirmed = true.
  5. New RPC `confirm_account_by_token(uuid)` for verifying the token from
     the confirmation email link.
  6. New email template `account_confirmation_oauth` for sending confirmation.
*/

-- ============================================================
-- 1. Add columns to profiles
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_account_confirmed boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS confirmation_token uuid;

-- All EXISTING users are already confirmed
UPDATE profiles SET is_account_confirmed = true WHERE is_account_confirmed IS NULL;

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_profiles_confirmation_token ON profiles(confirmation_token) WHERE confirmation_token IS NOT NULL;

-- ============================================================
-- 2. Update handle_new_user: OAuth creates profile with is_account_confirmed = false
-- ============================================================
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

  -- For email/password signup: do nothing here.
  -- Supabase Auth sends the native confirmation email.
  -- Profile created by handle_user_email_confirmed once confirmed.
  IF v_provider = 'email' THEN
    RETURN NEW;
  END IF;

  -- For OAuth (Google, etc.): create profile but NOT confirmed on our platform.
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
$$;

-- ============================================================
-- 3. Update handle_user_email_confirmed: also set is_account_confirmed
-- ============================================================
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
  -- Only act when email_confirmed_at transitions NULL -> non-null
  IF OLD.email_confirmed_at IS NOT NULL OR NEW.email_confirmed_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Do nothing for OAuth users (their confirmation is handled by the custom token)
  IF COALESCE(NEW.app_metadata->>'provider', 'email') <> 'email' THEN
    RETURN NEW;
  END IF;

  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'candidate');

  -- If profile already exists (shouldn't happen for email), just mark confirmed
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    UPDATE public.profiles
    SET is_account_confirmed = true, confirmation_token = NULL
    WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  -- Create company for recruiter
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

  -- Create profile (confirmed for email/password users since they just confirmed)
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

  -- Create recruiter sub-profile
  IF v_user_type = 'recruiter' AND v_company_id IS NOT NULL THEN
    INSERT INTO public.recruiter_profiles (profile_id, user_id, company_id, is_verified, created_at, updated_at)
    VALUES (NEW.id, NEW.id, v_company_id, false, now(), now())
    ON CONFLICT DO NOTHING;
  END IF;

  -- Create candidate sub-profile
  IF v_user_type = 'candidate' THEN
    INSERT INTO public.candidate_profiles (profile_id, user_id, is_public, is_verified, created_at, updated_at)
    VALUES (NEW.id, NEW.id, false, false, now(), now())
    ON CONFLICT DO NOTHING;
  END IF;

  -- Queue welcome email
  PERFORM queue_welcome_email(NEW.id, NEW.email, v_full_name, v_user_type);

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'handle_user_email_confirmed error: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- ============================================================
-- 4. RPC: confirm account by token (callable by anon + authenticated)
-- ============================================================
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
    RETURN json_build_object('success', false, 'error', 'Token invalide ou compte déjà confirmé');
  END IF;

  -- Queue welcome email now that account is confirmed
  PERFORM queue_welcome_email(v_user_id, v_email, v_full_name, v_user_type);

  RETURN json_build_object('success', true, 'email', v_email);
END;
$$;

-- Allow both anon and authenticated to call this RPC
GRANT EXECUTE ON FUNCTION confirm_account_by_token(uuid) TO anon;
GRANT EXECUTE ON FUNCTION confirm_account_by_token(uuid) TO authenticated;

-- ============================================================
-- 5. Email template for OAuth confirmation
-- ============================================================
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
      Pour activer votre compte et accéder à tous nos services, veuillez confirmer votre inscription
      en cliquant sur le bouton ci-dessous :
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
  updated_at = now();
