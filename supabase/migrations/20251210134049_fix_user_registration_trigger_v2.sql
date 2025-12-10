/*
  # Fix user registration trigger

  1. Modifications
    - Recréer la fonction handle_new_user avec une meilleure gestion des erreurs
    - S'assurer que la fonction ne bloque pas la création d'utilisateur en cas d'erreur

  2. Sécurité
    - La fonction utilise SECURITY DEFINER pour avoir les permissions nécessaires
    - Gestion des exceptions pour ne pas bloquer l'inscription
*/

-- Supprimer et recréer la fonction handle_new_user
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_type_val text;
  full_name_val text;
BEGIN
  -- Extraire les métadonnées de l'utilisateur de manière sécurisée
  BEGIN
    user_type_val := COALESCE(NEW.raw_user_meta_data->>'user_type', 'candidate');
    full_name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  EXCEPTION WHEN OTHERS THEN
    user_type_val := 'candidate';
    full_name_val := '';
  END;

  -- Créer le profil automatiquement
  BEGIN
    INSERT INTO public.profiles (id, email, user_type, full_name, credits_balance, created_at, updated_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.email, ''),
      user_type_val,
      full_name_val,
      100, -- Crédits de départ
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = NOW();
  EXCEPTION WHEN OTHERS THEN
    -- Log l'erreur mais ne bloque pas l'inscription
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Recréer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Recréer la fonction create_notification_preferences
DROP FUNCTION IF EXISTS create_notification_preferences() CASCADE;

CREATE OR REPLACE FUNCTION create_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Log l'erreur mais ne bloque pas
    RAISE WARNING 'Error creating notification preferences for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Recréer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created_notification_prefs ON auth.users;
CREATE TRIGGER on_auth_user_created_notification_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_preferences();
