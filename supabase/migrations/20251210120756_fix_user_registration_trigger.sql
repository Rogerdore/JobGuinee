/*
  # Fix User Registration - Auto Profile Creation
  
  1. Problème
    - Les utilisateurs ne peuvent pas s'inscrire car le profil n'est pas créé automatiquement
    - Aucun trigger n'existe sur auth.users pour créer le profil
  
  2. Solution
    - Créer fonction handle_new_user() qui crée automatiquement le profil
    - Créer trigger on_auth_user_created sur auth.users
    - Extraire user_type et full_name depuis raw_user_meta_data
  
  3. Sécurité
    - Fonction SECURITY DEFINER pour accès auth schema
    - Gère les erreurs silencieusement
    - Crédits initiaux : 100 (défaut)
*/

-- Fonction pour créer automatiquement le profil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_type_val text;
  full_name_val text;
BEGIN
  -- Extraire les métadonnées de l'utilisateur
  user_type_val := COALESCE(NEW.raw_user_meta_data->>'user_type', 'candidate');
  full_name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', '');

  -- Créer le profil automatiquement
  INSERT INTO public.profiles (id, email, user_type, full_name, credits_balance, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    user_type_val,
    full_name_val,
    100, -- Crédits de départ
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log l'erreur mais ne bloque pas l'inscription
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Supprimer ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger sur auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Commentaire
COMMENT ON FUNCTION public.handle_new_user() IS 'Crée automatiquement un profil dans public.profiles quand un utilisateur s''inscrit via auth.users';
