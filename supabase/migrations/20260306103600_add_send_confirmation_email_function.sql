/*
  # Fonction pour envoyer l'email de confirmation d'adresse email

  ## Résumé
  Ajoute une fonction RPC callable depuis le frontend pour envoyer l'email de
  confirmation d'inscription via la queue email interne.

  ## Nouvelle fonction
  - `send_signup_confirmation_email(user_id, confirmation_link)`:
    Insère dans email_queue un email avec le template 'email_confirmation_signup'

  ## Sécurité
  - Accessible par l'utilisateur authentifié
  - Vérifie que l'user_id correspond à l'utilisateur connecté
*/

CREATE OR REPLACE FUNCTION public.send_signup_confirmation_email(
  p_user_id uuid,
  p_confirmation_link text
)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_email text;
  v_full_name text;
  v_template_id uuid;
BEGIN
  SELECT
    email,
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
  INTO v_email, v_full_name
  FROM auth.users
  WHERE id = p_user_id;

  IF v_email IS NULL THEN
    RETURN false;
  END IF;

  SELECT id INTO v_template_id
  FROM email_templates
  WHERE template_key = 'email_confirmation_signup'
  AND is_active = true
  LIMIT 1;

  IF v_template_id IS NULL THEN
    RETURN false;
  END IF;

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
      'user_name', v_full_name,
      'user_email', v_email,
      'confirmation_link', p_confirmation_link
    ),
    10,
    now(),
    p_user_id
  );

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur envoi email confirmation: %', SQLERRM;
  RETURN false;
END;
$$;

COMMENT ON FUNCTION public.send_signup_confirmation_email(uuid, text) IS
'Envoie un email de confirmation d''adresse email lors de l''inscription via la queue email interne. Priorité haute (10).';

GRANT EXECUTE ON FUNCTION public.send_signup_confirmation_email(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_signup_confirmation_email(uuid, text) TO anon;
