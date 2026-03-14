-- Migration: Fix handle_new_user trigger to always create profile row
-- + Backfill missing profiles for existing auth.users
-- Problem: email signup users had no profile row because trigger returned early for email provider

-- 1. Fix the trigger: create profile for ALL providers including email
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
  v_provider  := COALESCE(NEW.app_metadata->>'provider', 'email');

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

  -- Queue welcome email
  PERFORM queue_welcome_email(NEW.id, NEW.email, v_full_name, v_user_type);

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 2. Backfill: create profiles for existing auth.users who don't have one
INSERT INTO public.profiles (id, email, full_name, user_type, credits_balance, is_account_confirmed, profile_completion_percentage, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'user_type', 'candidate'),
  100,
  CASE WHEN u.email_confirmed_at IS NOT NULL THEN true ELSE false END,
  0,
  u.created_at,
  now()
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 3. Backfill candidate_profiles for new candidate profiles
INSERT INTO public.candidate_profiles (profile_id, user_id, visibility, is_verified, created_at)
SELECT p.id, p.id, 'private', false, p.created_at
FROM public.profiles p
LEFT JOIN public.candidate_profiles cp ON cp.profile_id = p.id
WHERE p.user_type = 'candidate' AND cp.profile_id IS NULL
ON CONFLICT DO NOTHING;

-- 4. Backfill credit_transactions for the welcome bonus
INSERT INTO public.credit_transactions (user_id, transaction_type, credits_amount, description, balance_before, balance_after, service_code, metadata)
SELECT 
  p.id, 'bonus', 100,
  'Crédits IA de bienvenue — cadeau d''inscription (backfill)',
  0, 100,
  'welcome_bonus',
  jsonb_build_object('reason', 'signup_welcome_backfill', 'backfilled_at', now()::text)
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.credit_transactions ct 
  WHERE ct.user_id = p.id AND ct.service_code = 'welcome_bonus'
)
ON CONFLICT DO NOTHING;
