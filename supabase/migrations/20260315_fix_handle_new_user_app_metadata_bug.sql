-- =============================================================
-- MIGRATION: Fix handle_new_user trigger — app_metadata column bug
-- =============================================================
-- Bug: Previous migration (20260319) used NEW.app_metadata which
-- does NOT exist in auth.users. The correct column is NEW.raw_app_meta_data.
-- This caused "record 'new' has no field 'app_metadata'" error,
-- which was silently caught by the EXCEPTION handler, rolling back
-- ALL profile-related inserts (profiles, candidate_profiles,
-- credit_transactions) while still allowing auth.users INSERT.
-- Result: users could sign up but had no profile → infinite loading.
--
-- Also: Isolated queue_welcome_email call in its own BEGIN/EXCEPTION
-- block so email failures can never break profile creation.
--
-- Also: Disabled the duplicate send_welcome_email_trigger on profiles
-- table which was sending a second welcome email redundantly.
-- =============================================================

-- 1. Fix the trigger function: raw_app_meta_data + isolated email call
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name  text;
  v_user_type  text;
  v_phone      text;
  v_provider   text;
  v_company_id uuid;
BEGIN
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'candidate');
  v_phone     := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'phone', '')), '');
  v_provider  := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');

  -- Create company for recruiters
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

  -- Create profile for ALL users (email + OAuth)
  INSERT INTO public.profiles (
    id, email, full_name, user_type, phone, company_id, credits_balance,
    is_account_confirmed,
    created_at, updated_at
  )
  VALUES (
    NEW.id, NEW.email, v_full_name, v_user_type, v_phone, v_company_id, 100,
    CASE WHEN v_provider = 'email' THEN false ELSE true END,
    now(), now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Log welcome credit bonus
  INSERT INTO public.credit_transactions (
    user_id, transaction_type, credits_amount,
    description, balance_before, balance_after,
    service_code, metadata
  ) VALUES (
    NEW.id, 'bonus', 100,
    'Crédits IA de bienvenue — cadeau d''inscription',
    0, 100,
    'welcome_bonus',
    jsonb_build_object('reason', 'signup_welcome', 'provider', v_provider)
  );

  IF v_user_type = 'recruiter' AND v_company_id IS NOT NULL THEN
    INSERT INTO public.recruiter_profiles (profile_id, user_id, company_id, created_at, updated_at)
    VALUES (NEW.id, NEW.id, v_company_id, now(), now())
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_user_type = 'candidate' THEN
    INSERT INTO public.candidate_profiles (profile_id, user_id, visibility, is_verified, created_at)
    VALUES (NEW.id, NEW.id, 'private', false, now())
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_user_type = 'trainer' THEN
    INSERT INTO public.trainer_profiles (profile_id, user_id, organization_type, experience_years, is_verified, total_students, created_at, updated_at)
    VALUES (NEW.id, NEW.id, 'individual', 0, false, 0, now(), now())
    ON CONFLICT DO NOTHING;
  END IF;

  -- Queue welcome email — isolated so email failure never breaks profile creation
  BEGIN
    PERFORM queue_welcome_email(NEW.id, NEW.email, v_full_name, v_user_type);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: welcome email queue failed: %', SQLERRM;
  END;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user error: % (SQLSTATE=%)', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- 2. Disable the duplicate welcome email trigger on profiles
-- (handle_new_user already queues the welcome email via queue_welcome_email)
ALTER TABLE profiles DISABLE TRIGGER send_welcome_email_trigger;

-- 3. Backfill: create candidate_profiles for candidates missing them
INSERT INTO candidate_profiles (profile_id, user_id, visibility, is_verified, created_at)
SELECT p.id, p.id, 'private', false, now()
FROM profiles p
LEFT JOIN candidate_profiles cp ON cp.user_id = p.id
WHERE p.user_type = 'candidate' AND cp.id IS NULL
ON CONFLICT DO NOTHING;

-- 4. Backfill: create credit_transactions (welcome bonus) for users missing them
INSERT INTO credit_transactions (
  user_id, transaction_type, credits_amount,
  description, balance_before, balance_after,
  service_code, metadata
)
SELECT
  p.id, 'bonus', 100,
  'Crédits IA de bienvenue — cadeau d''inscription (backfill)',
  0, 100,
  'welcome_bonus',
  '{"reason":"signup_welcome","backfill":true}'::jsonb
FROM profiles p
LEFT JOIN credit_transactions ct ON ct.user_id = p.id AND ct.service_code = 'welcome_bonus'
WHERE ct.id IS NULL;
