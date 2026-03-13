-- =====================================================
-- MIGRATION: Store phone from user_metadata into profiles
-- Updates handle_new_user + handle_user_email_confirmed
-- to extract phone from raw_user_meta_data at signup
-- =====================================================

-- 1. Update handle_new_user (OAuth signup) to store phone
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

  -- For email/password signup: do nothing here.
  IF v_provider = 'email' THEN
    RETURN NEW;
  END IF;

  -- For OAuth (Google, etc.): create profile immediately confirmed.
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
    id, email, full_name, user_type, phone, company_id, credits_balance,
    is_account_confirmed,
    created_at, updated_at
  )
  VALUES (
    NEW.id, NEW.email, v_full_name, v_user_type, v_phone, v_company_id, 100,
    true,
    now(), now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Log welcome credit bonus in credit_transactions
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


-- 2. Update handle_user_email_confirmed to store phone
CREATE OR REPLACE FUNCTION handle_user_email_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name  text;
  v_user_type  text;
  v_phone      text;
  v_company_id uuid;
  v_current_balance integer;
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
  v_phone     := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'phone', '')), '');

  -- If profile already exists, mark confirmed and update phone if set
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    SELECT credits_balance INTO v_current_balance
    FROM public.profiles WHERE id = NEW.id;

    UPDATE public.profiles
    SET is_account_confirmed = true,
        confirmation_token = NULL,
        phone = COALESCE(v_phone, profiles.phone),
        credits_balance = GREATEST(COALESCE(v_current_balance, 0), 100)
    WHERE id = NEW.id;

    -- Log welcome credits if not already logged
    IF NOT EXISTS (
      SELECT 1 FROM public.credit_transactions
      WHERE user_id = NEW.id AND service_code = 'welcome_bonus'
    ) THEN
      INSERT INTO public.credit_transactions (
        user_id, transaction_type, credits_amount,
        description, balance_before, balance_after,
        service_code, metadata
      ) VALUES (
        NEW.id, 'bonus', 100,
        'Crédits IA de bienvenue — cadeau d''inscription',
        COALESCE(v_current_balance, 0),
        GREATEST(COALESCE(v_current_balance, 0), 100),
        'welcome_bonus',
        jsonb_build_object('reason', 'email_confirmed')
      );
    END IF;

    -- Queue welcome email
    PERFORM queue_welcome_email(NEW.id, NEW.email, v_full_name, v_user_type);

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

  -- Create profile with 100 welcome credits and phone
  INSERT INTO public.profiles (
    id, email, full_name, user_type, phone, company_id, credits_balance,
    is_account_confirmed,
    created_at, updated_at
  )
  VALUES (
    NEW.id, NEW.email, v_full_name, v_user_type, v_phone, v_company_id, 100,
    true,
    now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    is_account_confirmed = true,
    confirmation_token = NULL,
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    credits_balance = GREATEST(profiles.credits_balance, 100);

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
    jsonb_build_object('reason', 'email_confirmed')
  );

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
    RAISE WARNING 'handle_user_email_confirmed error for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;
