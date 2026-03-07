/*
  # Profile creation only after email confirmation

  ## Summary
  Previously the `handle_new_user` trigger created the profile row immediately
  when a user row was inserted into `auth.users` — BEFORE the user confirmed
  their email. This meant unconfirmed accounts cluttered the profiles table.

  ## Changes
  1. `handle_new_user` (INSERT trigger on auth.users):
     - For email/password signup (no provider): only queue the confirmation email,
       do NOT create a profile yet.
     - For OAuth signups (provider is set, e.g. Google): create the profile
       immediately because the email is already verified by the provider.

  2. New function `handle_user_email_confirmed` (UPDATE trigger on auth.users):
     - Fires when `email_confirmed_at` transitions from NULL to a non-null value.
     - Creates the profile, candidate/recruiter sub-profiles, and queues the
       welcome email.

  3. New trigger `on_auth_user_email_confirmed` on auth.users (AFTER UPDATE).

  ## Security
  Both functions use SECURITY DEFINER with explicit search_path = public.
*/

-- ============================================================
-- 1. Replace handle_new_user: only create profile for OAuth
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name text;
  v_user_type text;
  v_provider  text;
  v_company_id uuid;
BEGIN
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'candidate');
  v_provider  := COALESCE(NEW.app_metadata->>'provider', 'email');

  -- For email/password signup: just queue a confirmation email, profile
  -- will be created when the user clicks the confirmation link.
  IF v_provider = 'email' THEN
    PERFORM queue_confirmation_email(NEW.id, NEW.email, v_full_name, NULL);
    RETURN NEW;
  END IF;

  -- For OAuth (Google, etc.): email already verified — create profile now.
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

  INSERT INTO public.profiles (id, email, full_name, user_type, company_id, credits_balance, created_at, updated_at)
  VALUES (NEW.id, NEW.email, v_full_name, v_user_type, v_company_id, 0, now(), now())
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
-- 2. New function: create profile after email is confirmed
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

  -- Do nothing for OAuth users (profile already created by handle_new_user)
  IF COALESCE(NEW.app_metadata->>'provider', 'email') <> 'email' THEN
    RETURN NEW;
  END IF;

  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'candidate');

  -- Skip if profile already exists (safety guard)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
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

  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, user_type, company_id, credits_balance, created_at, updated_at)
  VALUES (NEW.id, NEW.email, v_full_name, v_user_type, v_company_id, 0, now(), now())
  ON CONFLICT (id) DO NOTHING;

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
-- 3. Create the UPDATE trigger on auth.users
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;

CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_email_confirmed();
