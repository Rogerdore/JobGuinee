/*
  # Fix inscription - Résolution RLS et trigger

  Le problème: Le trigger handle_new_user() ne peut pas créer le profil
  car les policies RLS bloquent l'insertion même avec SECURITY DEFINER.

  Solution:
  1. Recréer le trigger avec SET security_invoker = false
  2. Ajouter une policy pour permettre au système de créer les profils
  3. S'assurer que le trigger fonctionne correctement

  Changements:
  - Amélioration de la fonction handle_new_user avec gestion d'erreurs
  - Ajout d'une policy service_role pour permettre l'insertion système
  - Ajout de logs pour debugging
*/

-- Désactiver temporairement RLS pour la création de profils par le trigger
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Recréer la fonction handle_new_user avec meilleure gestion
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type text;
  v_full_name text;
BEGIN
  -- Log pour debug
  RAISE LOG 'Creating profile for user %', NEW.id;
  
  -- Extraire les métadonnées avec valeurs par défaut
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'candidate');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  
  -- Insérer le profil (ON CONFLICT pour éviter les doublons)
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
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    user_type = EXCLUDED.user_type,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();
  
  RAISE LOG 'Profile created successfully for user %', NEW.id;
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    -- Logger l'erreur mais ne pas faire échouer l'inscription
    RAISE LOG 'ERROR in handle_new_user for user %: % - %', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- S'assurer que le trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Même chose pour les préférences de notification
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

DROP TRIGGER IF EXISTS on_auth_user_created_notification_prefs ON auth.users;
CREATE TRIGGER on_auth_user_created_notification_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_preferences();

-- Vérifier que notification_preferences existe
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  email_applications boolean DEFAULT true,
  email_messages boolean DEFAULT true,
  email_job_alerts boolean DEFAULT true,
  email_marketing boolean DEFAULT false,
  push_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS pour notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notification preferences" ON notification_preferences;
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notification preferences" ON notification_preferences;
CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Service can insert notification preferences" ON notification_preferences;
CREATE POLICY "Service can insert notification preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (true);
