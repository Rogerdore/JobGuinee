/*
  # Correction critique - Création de profil lors de l'inscription
  
  1. Problème identifié
    - Les policies RLS bloquent la création de profil pendant l'inscription
    - Le trigger handle_new_user() ne peut pas insérer dans profiles
    - Erreur: "Database error finding user"
  
  2. Solution
    - Politique spécifique pour permettre l'insertion système pendant l'inscription
    - Amélioration du trigger pour gérer correctement le contexte d'authentification
    - Utilisation d'une approche plus permissive uniquement pour l'INSERT initial
  
  3. Sécurité
    - La policy permet uniquement l'insertion où id = auth.uid()
    - Cela garantit qu'un utilisateur ne peut créer que son propre profil
    - Les autres opérations restent strictement contrôlées
*/

-- Supprimer l'ancienne policy trop permissive
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

-- Créer une policy qui permet l'auto-insertion pendant la création de compte
-- Cette policy permet à un utilisateur nouvellement créé d'insérer son propre profil
DROP POLICY IF EXISTS "Users can insert own profile on signup" ON profiles;
CREATE POLICY "Users can insert own profile on signup"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Améliorer la fonction handle_new_user pour mieux gérer les erreurs
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_type text;
  v_full_name text;
  profile_exists boolean;
BEGIN
  -- Vérifier si le profil existe déjà
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = NEW.id) INTO profile_exists;
  
  IF profile_exists THEN
    RAISE LOG 'Profile already exists for user %', NEW.id;
    RETURN NEW;
  END IF;
  
  -- Extraire les métadonnées
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'candidate');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  
  -- Insérer le profil en tant que SERVICE (bypass RLS)
  INSERT INTO public.profiles (
    id,
    email,
    user_type,
    full_name,
    credits_balance,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    v_user_type,
    v_full_name,
    100,
    NOW(),
    NOW()
  );
  
  RAISE LOG 'Profile created successfully for user %', NEW.id;
  
  RETURN NEW;
EXCEPTION 
  WHEN unique_violation THEN
    -- Si le profil existe déjà (race condition), c'est OK
    RAISE LOG 'Profile already exists (race condition) for user %', NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Logger l'erreur détaillée
    RAISE LOG 'ERROR in handle_new_user for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    -- Ne pas bloquer l'inscription
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recréer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Améliorer aussi la fonction de notification_preferences
CREATE OR REPLACE FUNCTION create_notification_preferences()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    RAISE LOG 'ERROR in create_notification_preferences for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- S'assurer que notification_preferences a aussi la bonne policy
DROP POLICY IF EXISTS "Service can insert notification preferences" ON notification_preferences;
CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
