/*
  # Désactiver confirmation email et utiliser SMTP custom

  1. Modifications
    - Désactive la vérification de confirmation email dans le trigger de création de profil
    - Ajoute un trigger pour envoyer emails de bienvenue via le service SMTP custom
    - Les utilisateurs peuvent se connecter immédiatement après inscription

  2. Emails de bienvenue
    - Envoyés via le service SMTP Hostinger configuré
    - Ajoutés à la queue d'emails existante
    - Utilisent les templates email_templates existants
*/

-- Fonction pour envoyer un email de bienvenue via le service custom
CREATE OR REPLACE FUNCTION send_welcome_email_on_signup()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_email text;
  v_full_name text;
  v_user_type text;
  v_template_id uuid;
BEGIN
  -- Récupérer les infos utilisateur depuis auth.users
  SELECT
    email,
    COALESCE(raw_user_meta_data->>'full_name', email),
    COALESCE(raw_user_meta_data->>'user_type', 'candidate')
  INTO v_email, v_full_name, v_user_type
  FROM auth.users
  WHERE id = NEW.id;

  -- Trouver le template approprié
  IF v_user_type = 'recruiter' THEN
    SELECT id INTO v_template_id
    FROM email_templates
    WHERE template_key = 'welcome_recruiter'
    AND is_active = true
    LIMIT 1;

    IF v_template_id IS NOT NULL THEN
      INSERT INTO email_queue (
        template_id,
        to_email,
        to_name,
        template_variables,
        priority,
        scheduled_for,
        user_id
      ) VALUES (
        v_template_id,
        v_email,
        v_full_name,
        jsonb_build_object(
          'recruiter_name', v_full_name,
          'recruiter_email', v_email,
          'company_name', COALESCE(NEW.company_name, 'Votre entreprise'),
          'app_url', 'https://jobguinee-pro.com'
        ),
        5,
        now(),
        NEW.id
      );
    END IF;
  ELSE
    SELECT id INTO v_template_id
    FROM email_templates
    WHERE template_key = 'welcome_candidate'
    AND is_active = true
    LIMIT 1;

    IF v_template_id IS NOT NULL THEN
      INSERT INTO email_queue (
        template_id,
        to_email,
        to_name,
        template_variables,
        priority,
        scheduled_for,
        user_id
      ) VALUES (
        v_template_id,
        v_email,
        v_full_name,
        jsonb_build_object(
          'candidate_name', v_full_name,
          'candidate_email', v_email,
          'app_url', 'https://jobguinee-pro.com'
        ),
        5,
        now(),
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur envoi email bienvenue: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Créer le trigger pour envoyer l'email de bienvenue
DROP TRIGGER IF EXISTS send_welcome_email_trigger ON profiles;
CREATE TRIGGER send_welcome_email_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION send_welcome_email_on_signup();

-- Modifier le trigger de création de profil pour NE PAS exiger la confirmation email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_full_name text;
  v_user_type text;
  v_company_id uuid;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'candidate');

  -- Créer compagnie pour recruteur
  IF v_user_type = 'recruiter' THEN
    INSERT INTO public.companies (
      name,
      industry,
      size,
      website,
      description,
      created_at,
      updated_at
    ) VALUES (
      v_full_name || '''s Company',
      'Technology',
      '1-10',
      NULL,
      'Welcome to ' || v_full_name || '''s Company',
      now(),
      now()
    )
    RETURNING id INTO v_company_id;
  END IF;

  -- Créer le profil SANS vérifier confirmed_at
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    user_type,
    company_id,
    credits_balance,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_user_type,
    v_company_id,
    0,
    now(),
    now()
  );

  -- Créer profil recruteur
  IF v_user_type = 'recruiter' AND v_company_id IS NOT NULL THEN
    INSERT INTO public.recruiter_profiles (
      profile_id,
      user_id,
      company_id,
      is_verified,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.id,
      v_company_id,
      false,
      now(),
      now()
    );
  END IF;

  -- Créer profil candidat
  IF v_user_type = 'candidate' THEN
    INSERT INTO public.candidate_profiles (
      profile_id,
      user_id,
      is_public,
      is_verified,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.id,
      false,
      false,
      now(),
      now()
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'Erreur création profil: %', SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
'Crée automatiquement un profil pour chaque nouvel utilisateur. La confirmation email Supabase Auth est désactivée pour permettre connexion immédiate.';

COMMENT ON FUNCTION send_welcome_email_on_signup() IS
'Envoie un email de bienvenue via le service SMTP custom (Hostinger) lors de la création d''un nouveau profil.';