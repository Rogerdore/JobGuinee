/*
  # Remove duplicate confirmation email from handle_new_user trigger

  ## Problem
  The handle_new_user trigger was calling queue_confirmation_email() which
  inserts an email into email_queue with a static, tokenless confirmation link.
  Supabase Auth already sends its own confirmation email with the real token
  via the emailRedirectTo parameter. The duplicate email was confusing and
  the link inside it was invalid.

  ## Fix
  Remove the PERFORM queue_confirmation_email() call from handle_new_user.
  Supabase's built-in confirmation email is the only one that should be sent.
  The welcome email is sent by handle_user_email_confirmed after confirmation.
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

  -- For email/password signup: do nothing here.
  -- Supabase Auth sends the confirmation email automatically.
  -- Profile will be created by handle_user_email_confirmed when the user
  -- clicks the confirmation link and email_confirmed_at is set.
  IF v_provider = 'email' THEN
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
