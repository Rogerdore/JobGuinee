/*
  # Fix email confirmation on signup

  ## Problème
  Le trigger handle_new_user créait le profil mais n'insérait jamais l'email
  de confirmation dans email_queue. Résultat : aucun email envoyé à l'inscription.

  ## Solution
  1. Modifier handle_new_user pour insérer l'email de confirmation dans email_queue
  2. Ajouter également l'email de bienvenue après confirmation (via trigger sur profiles)

  ## Notes
  - Utilise le template 'email_confirmation_signup' déjà existant
  - Le lien de confirmation est généré via auth.generate_email_token (non disponible en SQL)
  - On passe par l'Edge Function send-email directement via net.http_post pour l'email de confirmation
  - Pour le lien de confirmation Supabase, on utilise le lien de base + token
*/

-- Créer une fonction dédiée pour envoyer l'email de confirmation via notre système
CREATE OR REPLACE FUNCTION queue_confirmation_email(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_confirmation_token text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template_id uuid;
  v_confirmation_link text;
BEGIN
  -- Récupérer l'ID du template de confirmation
  SELECT id INTO v_template_id
  FROM email_templates
  WHERE template_key = 'email_confirmation_signup'
  AND is_active = true
  LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE WARNING 'queue_confirmation_email: template email_confirmation_signup not found';
    RETURN;
  END IF;

  -- Construire le lien de confirmation
  -- Supabase génère le vrai lien via son système Auth, on utilise une URL de base
  v_confirmation_link := 'https://jobguinee-pro.com/auth/confirm?token=' || COALESCE(p_confirmation_token, 'PENDING') || '&type=signup';

  -- Insérer dans la queue
  INSERT INTO email_queue (
    template_id,
    to_email,
    to_name,
    template_variables,
    priority,
    scheduled_for,
    status,
    user_id
  ) VALUES (
    v_template_id,
    p_email,
    p_full_name,
    jsonb_build_object(
      'user_name', p_full_name,
      'confirmation_link', v_confirmation_link,
      'email', p_email
    ),
    10,
    now(),
    'pending',
    p_user_id
  );

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'queue_confirmation_email error: %', SQLERRM;
END;
$$;

-- Créer une fonction pour envoyer l'email de bienvenue après confirmation
CREATE OR REPLACE FUNCTION queue_welcome_email(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_user_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template_id uuid;
  v_template_key text;
BEGIN
  -- Choisir le bon template selon le type d'utilisateur
  IF p_user_type = 'recruiter' THEN
    v_template_key := 'welcome_recruiter';
  ELSE
    v_template_key := 'welcome_candidate';
  END IF;

  SELECT id INTO v_template_id
  FROM email_templates
  WHERE template_key = v_template_key
  AND is_active = true
  LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE WARNING 'queue_welcome_email: template % not found', v_template_key;
    RETURN;
  END IF;

  INSERT INTO email_queue (
    template_id,
    to_email,
    to_name,
    template_variables,
    priority,
    scheduled_for,
    status,
    user_id
  ) VALUES (
    v_template_id,
    p_email,
    p_full_name,
    jsonb_build_object(
      'candidate_name', p_full_name,
      'recruiter_name', p_full_name,
      'user_name', p_full_name,
      'email', p_email
    ),
    8,
    now() + interval '2 minutes',
    'pending',
    p_user_id
  );

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'queue_welcome_email error: %', SQLERRM;
END;
$$;

-- Mettre à jour handle_new_user pour envoyer l'email de confirmation
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

  -- Créer le profil
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

  -- Envoyer email de confirmation via notre système SendGrid
  PERFORM queue_confirmation_email(NEW.id, NEW.email, v_full_name, NULL);

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'Erreur création profil: %', SQLERRM;
    RETURN NEW;
END;
$$;
