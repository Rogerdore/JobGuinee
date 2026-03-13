/*
  # Fix welcome credits: 10 → 100 + credit transaction logging

  ## Problème
  - L'email de bienvenue (welcome_confirmed) annonce "100 Crédits IA offerts"
  - Mais les triggers handle_new_user et handle_user_email_confirmed ne donnent que 10 crédits
  - Aucune transaction de crédit (credit_transactions) n'est enregistrée pour le bonus de bienvenue

  ## Correctifs
  1. handle_new_user (OAuth): credits_balance = 100 + insert credit_transactions
  2. handle_user_email_confirmed (email): credits_balance = 100 + insert credit_transactions
  3. Rattrapage: mettre à jour les utilisateurs récents qui n'ont reçu que 10 crédits
*/

-- ============================================================
-- 1. Corriger handle_new_user (OAuth signup)
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
    NEW.id, NEW.email, v_full_name, v_user_type, v_company_id, 100,
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
-- 2. Corriger handle_user_email_confirmed (email signup)
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

  -- If profile already exists, mark confirmed and grant welcome credits if not yet given
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    SELECT credits_balance INTO v_current_balance
    FROM public.profiles WHERE id = NEW.id;

    UPDATE public.profiles
    SET is_account_confirmed = true,
        confirmation_token = NULL,
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

  -- Create profile with 100 welcome credits
  INSERT INTO public.profiles (
    id, email, full_name, user_type, company_id, credits_balance,
    is_account_confirmed,
    created_at, updated_at
  )
  VALUES (
    NEW.id, NEW.email, v_full_name, v_user_type, v_company_id, 100,
    true,
    now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    is_account_confirmed = true,
    confirmation_token = NULL,
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
    RAISE WARNING 'handle_user_email_confirmed error: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- ============================================================
-- 3. Rattrapage: utilisateurs récents avec seulement 10 crédits
--    (ceux qui se sont inscrits après le bug 10 au lieu de 100)
-- ============================================================
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.id, p.credits_balance, p.full_name
    FROM profiles p
    WHERE p.credits_balance = 10
      AND p.is_account_confirmed = true
      AND NOT EXISTS (
        SELECT 1 FROM credit_transactions ct
        WHERE ct.user_id = p.id AND ct.service_code = 'welcome_bonus'
      )
      -- Only for users who haven't used any credits yet (balance still at 10)
      AND NOT EXISTS (
        SELECT 1 FROM credit_transactions ct
        WHERE ct.user_id = p.id AND ct.transaction_type = 'usage'
      )
  LOOP
    -- Update balance to 100
    UPDATE profiles SET credits_balance = 100 WHERE id = r.id;

    -- Log the correction
    INSERT INTO credit_transactions (
      user_id, transaction_type, credits_amount,
      description, balance_before, balance_after,
      service_code, metadata
    ) VALUES (
      r.id, 'bonus', 90,
      'Rattrapage crédits IA de bienvenue (10 → 100)',
      10, 100,
      'welcome_bonus',
      jsonb_build_object('reason', 'retroactive_fix', 'original_balance', 10)
    );
  END LOOP;
END;
$$;
