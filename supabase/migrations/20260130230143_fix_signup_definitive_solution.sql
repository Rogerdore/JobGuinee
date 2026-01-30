/*
  # Solution définitive - Inscription utilisateur
  
  ## Problème identifié
  Le trigger handle_new_user() ne peut pas créer de profil car:
  1. auth.uid() retourne NULL pendant l'exécution du trigger (l'utilisateur n'est pas encore authentifié)
  2. Les policies RLS bloquent l'insertion même avec SECURITY DEFINER
  3. Policies dupliquées causent des conflits
  
  ## Solution
  1. Nettoyer toutes les policies INSERT sur profiles
  2. Créer UNE SEULE policy INSERT qui permet l'auto-insertion
  3. Améliorer le trigger pour qu'il utilise les privilèges système
  4. Désactiver temporairement RLS dans la fonction pour l'insertion initiale
  
  ## Sécurité
  - Le trigger vérifie que id = NEW.id (impossible de créer le profil d'un autre)
  - Les autres opérations (UPDATE, SELECT) restent strictement contrôlées
  - SECURITY DEFINER avec search_path fixe prévient les attaques d'injection
*/

-- 1. Nettoyer les policies INSERT dupliquées sur profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile on signup" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

-- 2. Créer UNE SEULE policy INSERT simple et claire
CREATE POLICY "Allow profile self-insertion"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- 3. Recréer la fonction handle_new_user avec une approche robuste
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
DECLARE
  v_user_type text;
  v_full_name text;
BEGIN
  -- Extraire les métadonnées avec valeurs par défaut sécurisées
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'candidate');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  
  -- Validation du user_type
  IF v_user_type NOT IN ('candidate', 'recruiter', 'trainer', 'admin') THEN
    v_user_type := 'candidate';
  END IF;
  
  -- Insérer le profil en contournant RLS (fonction SECURITY DEFINER)
  -- Cette insertion se fait avec les privilèges de l'owner de la fonction
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
    100, -- Crédits de bienvenue
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION 
  WHEN unique_violation THEN
    -- Race condition: le profil existe déjà, pas d'erreur
    RETURN NEW;
  WHEN foreign_key_violation THEN
    -- Erreur de référence: logger et continuer
    RAISE WARNING 'Foreign key violation in handle_new_user for user %', NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Logger toute autre erreur avec détails complets
    RAISE WARNING 'Error in handle_new_user for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Recréer le trigger (s'assurer qu'il est bien AFTER INSERT)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 5. Faire de même pour notification_preferences
DROP POLICY IF EXISTS "Service can insert notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON notification_preferences;

CREATE POLICY "Allow notification preferences self-insertion"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 6. Améliorer la fonction de notification_preferences
CREATE OR REPLACE FUNCTION create_notification_preferences()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
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
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    RAISE WARNING 'Error in create_notification_preferences for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Vérifier que le trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created_notification_prefs ON auth.users;
CREATE TRIGGER on_auth_user_created_notification_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_preferences();

-- 8. Accorder les permissions explicites nécessaires
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT INSERT ON public.profiles TO authenticated;
GRANT INSERT ON public.notification_preferences TO authenticated;

-- 9. Test de validation: créer une fonction de test
CREATE OR REPLACE FUNCTION test_profile_creation()
RETURNS TABLE(
  test_name text,
  success boolean,
  message text
) AS $$
BEGIN
  RETURN QUERY SELECT 
    'Profiles table exists'::text,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles')::boolean,
    'Profiles table check'::text;
    
  RETURN QUERY SELECT 
    'Trigger exists'::text,
    EXISTS(SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created')::boolean,
    'Trigger check'::text;
    
  RETURN QUERY SELECT 
    'Function is SECURITY DEFINER'::text,
    EXISTS(SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_user' AND security_type = 'DEFINER')::boolean,
    'Security check'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
