/*
  # Fix handle_new_user trigger - correct candidate_profiles columns

  ## Problème
  Le trigger utilisait is_public et is_verified qui n'existent pas dans candidate_profiles.
  Cela causait un échec silencieux lors de l'inscription, sans profil créé et sans email envoyé.

  ## Correction
  Utiliser uniquement les colonnes existantes dans candidate_profiles.
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name text;
  v_user_type text;
  v_company_id uuid;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'candidate');

  IF v_user_type = 'recruiter' THEN
    INSERT INTO public.companies (name, industry, size, description, created_at, updated_at)
    VALUES (
      v_full_name || '''s Company',
      'Technology',
      '1-10',
      'Welcome to ' || v_full_name || '''s Company',
      now(),
      now()
    )
    RETURNING id INTO v_company_id;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, user_type, company_id, credits_balance, created_at, updated_at)
  VALUES (NEW.id, NEW.email, v_full_name, v_user_type, v_company_id, 0, now(), now());

  IF v_user_type = 'recruiter' AND v_company_id IS NOT NULL THEN
    INSERT INTO public.recruiter_profiles (profile_id, user_id, company_id, is_verified, created_at, updated_at)
    VALUES (NEW.id, NEW.id, v_company_id, false, now(), now())
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_user_type = 'candidate' THEN
    INSERT INTO public.candidate_profiles (profile_id, user_id, created_at)
    VALUES (NEW.id, NEW.id, now())
    ON CONFLICT DO NOTHING;
  END IF;

  PERFORM queue_confirmation_email(NEW.id, NEW.email, v_full_name, NULL);

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$;
