/*
  # Solution finale - Policy système pour création de profil
  
  ## Racine du problème
  - Le trigger handle_new_user() s'exécute en tant que postgres (SECURITY DEFINER)
  - Mais la policy vérifie auth.uid() qui est NULL pendant le trigger
  - Résultat: L'insertion est bloquée malgré SECURITY DEFINER
  
  ## Solution définitive
  - Créer une policy qui permet les insertions faites par le système (postgres)
  - Conserver la policy pour les insertions utilisateur normales
  - Séparer clairement les deux cas d'usage
  
  ## Sécurité
  - Les utilisateurs ne peuvent créer que leur propre profil (id = auth.uid())
  - Le système peut créer n'importe quel profil (pour le trigger)
  - Toutes les autres opérations restent strictement contrôlées
*/

-- Supprimer l'ancienne policy
DROP POLICY IF EXISTS "Allow profile self-insertion" ON profiles;

-- Policy 1: Permettre au système (postgres) d'insérer des profils via le trigger
CREATE POLICY "System can insert profiles"
  ON profiles FOR INSERT
  TO postgres
  WITH CHECK (true);

-- Policy 2: Permettre aux utilisateurs authentifiés de créer leur propre profil
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Améliorer la fonction handle_new_user pour utiliser ses privilèges système
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type text;
  v_full_name text;
BEGIN
  -- Log de démarrage
  RAISE LOG 'handle_new_user: Starting for user %', NEW.id;
  
  -- Extraire et valider les métadonnées
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'candidate');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  
  -- Validation stricte du user_type
  IF v_user_type NOT IN ('candidate', 'recruiter', 'trainer', 'admin') THEN
    RAISE WARNING 'Invalid user_type "%" for user %, defaulting to candidate', v_user_type, NEW.id;
    v_user_type := 'candidate';
  END IF;
  
  -- Insérer le profil (cette fonction s'exécute avec les privilèges postgres)
  -- La policy "System can insert profiles" autorise cette insertion
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
  )
  ON CONFLICT (id) DO NOTHING; -- Si le profil existe déjà, ignorer
  
  RAISE LOG 'handle_new_user: Profile created successfully for user %', NEW.id;
  
  RETURN NEW;
EXCEPTION 
  WHEN unique_violation THEN
    RAISE LOG 'handle_new_user: Profile already exists for user %', NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Logger l'erreur complète
    RAISE WARNING 'handle_new_user: ERROR for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    -- Ne pas bloquer l'inscription même en cas d'erreur
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Même chose pour notification_preferences
DROP POLICY IF EXISTS "Allow notification preferences self-insertion" ON notification_preferences;

CREATE POLICY "System can insert notification preferences"
  ON notification_preferences FOR INSERT
  TO postgres
  WITH CHECK (true);

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Améliorer la fonction create_notification_preferences
CREATE OR REPLACE FUNCTION create_notification_preferences()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE LOG 'create_notification_preferences: Starting for user %', NEW.id;
  
  INSERT INTO public.notification_preferences (
    user_id,
    email_applications,
    email_messages,
    email_job_alerts,
    email_marketing,
    push_enabled
  ) VALUES (
    NEW.id,
    true,
    true,
    true,
    false,
    false
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RAISE LOG 'create_notification_preferences: Preferences created successfully for user %', NEW.id;
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    RAISE WARNING 'create_notification_preferences: ERROR for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Test: Vérifier que les policies sont correctement configurées
DO $$
DECLARE
  policy_count int;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'profiles' AND cmd = 'INSERT';
  
  IF policy_count != 2 THEN
    RAISE WARNING 'Expected 2 INSERT policies on profiles, found %', policy_count;
  ELSE
    RAISE NOTICE 'Profile policies configured correctly (% INSERT policies)', policy_count;
  END IF;
END $$;
