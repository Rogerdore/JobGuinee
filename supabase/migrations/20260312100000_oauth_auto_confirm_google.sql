/*
  # Google OAuth: auto-confirm accounts

  Google already verifies the user's email, so OAuth users
  should be immediately confirmed on JobGuinée (is_account_confirmed = true).

  Changes:
  1. Update handle_new_user: set is_account_confirmed = true for OAuth users
  2. Backfill: confirm all existing OAuth users that were created with false
*/

-- ============================================================
-- 1. Backfill: confirm existing OAuth users
-- ============================================================
UPDATE profiles p
SET is_account_confirmed = true,
    confirmation_token = NULL,
    updated_at = now()
FROM auth.users u
WHERE p.id = u.id
  AND COALESCE(u.raw_app_meta_data->>'provider', 'email') != 'email'
  AND p.is_account_confirmed = false;

-- ============================================================
-- 2. Update handle_new_user: OAuth = auto-confirmed
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

  -- For OAuth (Google, etc.): create profile immediately confirmed.
  -- Google already verifies the user's email, no extra confirmation needed.

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
    NEW.id, NEW.email, v_full_name, v_user_type, v_company_id, 10,
    true,
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

  IF v_user_type = 'trainer' THEN
    INSERT INTO public.trainer_profiles (profile_id, user_id, organization_type, experience_years, is_verified, rating, total_students, created_at, updated_at)
    VALUES (NEW.id, NEW.id, 'individual', 0, false, 0, 0, now(), now())
    ON CONFLICT DO NOTHING;
  END IF;

  -- Queue welcome email for OAuth users (already confirmed)
  PERFORM queue_welcome_email(NEW.id, NEW.email, v_full_name, v_user_type);

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- ============================================================
-- 3. Update handle_user_email_confirmed: also handle trainers
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

  -- Do nothing for OAuth users (their profile is created by handle_new_user)
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
    NEW.id, NEW.email, v_full_name, v_user_type, v_company_id, 10,
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

  -- Create trainer sub-profile
  IF v_user_type = 'trainer' THEN
    INSERT INTO public.trainer_profiles (profile_id, user_id, organization_type, experience_years, is_verified, rating, total_students, created_at, updated_at)
    VALUES (NEW.id, NEW.id, 'individual', 0, false, 0, 0, now(), now())
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
