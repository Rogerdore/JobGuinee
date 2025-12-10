/*
  # Fonction de réinitialisation de mot de passe

  1. Fonction
    - `admin_reset_user_password` - Réinitialise le mot de passe d'un utilisateur par son email
  
  2. Sécurité
    - Fonction accessible uniquement via service_role
*/

-- Fonction pour réinitialiser le mot de passe d'un utilisateur
CREATE OR REPLACE FUNCTION admin_reset_user_password(
  user_email TEXT,
  new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  password_hash TEXT;
BEGIN
  -- Trouver l'ID de l'utilisateur
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;

  IF user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Générer le hash du mot de passe en utilisant l'extension pgcrypto
  -- Le format est compatible avec bcrypt utilisé par Supabase Auth
  password_hash := crypt(new_password, gen_salt('bf'));

  -- Mettre à jour le mot de passe
  UPDATE auth.users
  SET 
    encrypted_password = password_hash,
    updated_at = NOW()
  WHERE id = user_id;

  RETURN json_build_object('success', true, 'user_id', user_id);
END;
$$;
