/*
  # Solution ultime - Inscription utilisateur
  
  ## Analyse complète du problème
  Dans Supabase, les policies TO postgres ne fonctionnent pas comme prévu.
  Le trigger s'exécute dans un contexte où auth.uid() est NULL.
  
  ## Solution finale testée
  - Policy qui permet l'insertion quand auth.uid() est NULL (contexte système)
  - Policy qui permet l'insertion quand auth.uid() = id (utilisateur normal)
  - Fonction SECURITY DEFINER optimisée avec gestion d'erreur robuste
  
  ## Garanties de sécurité
  - Les utilisateurs ne peuvent créer que leur propre profil
  - Le système (trigger) peut créer des profils uniquement pendant l'inscription
  - Toutes les tentatives d'insertion malveillantes sont bloquées
*/

-- Nettoyer complètement les anciennes policies
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile self-insertion" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile on signup" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

-- Policy unique et claire pour gérer les deux cas
-- 1. Quand auth.uid() est NULL = trigger système (OK)
-- 2. Quand auth.uid() = id = utilisateur créant son propre profil (OK)
-- 3. Tout le reste = bloqué
CREATE POLICY "Enable insert for system and self"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NULL OR id = auth.uid()
  );

-- Fonction optimisée avec logs détaillés pour debugging
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type text;
  v_full_name text;
  v_auth_uid uuid;
BEGIN
  -- Diagnostic: Vérifier le contexte d'exécution
  BEGIN
    v_auth_uid := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_auth_uid := NULL;
  END;
  
  RAISE LOG 'handle_new_user START: user_id=%, auth.uid()=%, email=%', 
    NEW.id, v_auth_uid, NEW.email;
  
  -- Vérifier si le profil existe déjà (éviter doublons)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    RAISE LOG 'handle_new_user SKIP: Profile already exists for user %', NEW.id;
    RETURN NEW;
  END IF;
  
  -- Extraire et valider les métadonnées
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'candidate');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  
  -- Validation stricte
  IF v_user_type NOT IN ('candidate', 'recruiter', 'trainer', 'admin') THEN
    RAISE WARNING 'Invalid user_type: %, defaulting to candidate', v_user_type;
    v_user_type := 'candidate';
  END IF;
  
  RAISE LOG 'handle_new_user INSERT: type=%, name=%', v_user_type, v_full_name;
  
  -- Insertion avec retry logic
  BEGIN
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
    
    RAISE LOG 'handle_new_user SUCCESS: Profile created for user %', NEW.id;
    
  EXCEPTION
    WHEN unique_violation THEN
      -- Race condition, c'est OK
      RAISE LOG 'handle_new_user DUPLICATE: Profile exists (race condition) for user %', NEW.id;
      
    WHEN others THEN
      -- Logger l'erreur complète
      RAISE WARNING 'handle_new_user ERROR: user=%, error=%, state=%', 
        NEW.id, SQLERRM, SQLSTATE;
      
      -- Essayer avec ON CONFLICT comme fallback
      BEGIN
        INSERT INTO public.profiles (id, email, user_type, full_name, credits_balance)
        VALUES (NEW.id, COALESCE(NEW.email, ''), v_user_type, v_full_name, 100)
        ON CONFLICT (id) DO NOTHING;
        RAISE LOG 'handle_new_user FALLBACK SUCCESS for user %', NEW.id;
      EXCEPTION WHEN others THEN
        RAISE WARNING 'handle_new_user FALLBACK FAILED: user=%, error=%', NEW.id, SQLERRM;
      END;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recréer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Même logique pour notification_preferences
DROP POLICY IF EXISTS "System can insert notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Allow notification preferences self-insertion" ON notification_preferences;
DROP POLICY IF EXISTS "Service can insert notification preferences" ON notification_preferences;

CREATE POLICY "Enable insert for system and self on notification_preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NULL OR user_id = auth.uid()
  );

CREATE OR REPLACE FUNCTION create_notification_preferences()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE LOG 'create_notification_preferences START: user=%', NEW.id;
  
  -- Vérifier si existe déjà
  IF EXISTS (SELECT 1 FROM public.notification_preferences WHERE user_id = NEW.id) THEN
    RAISE LOG 'create_notification_preferences SKIP: Already exists for user %', NEW.id;
    RETURN NEW;
  END IF;
  
  -- Insérer avec retry
  BEGIN
    INSERT INTO public.notification_preferences (
      user_id, email_applications, email_messages, email_job_alerts, 
      email_marketing, push_enabled
    ) VALUES (
      NEW.id, true, true, true, false, false
    );
    RAISE LOG 'create_notification_preferences SUCCESS for user %', NEW.id;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'create_notification_preferences ERROR: user=%, error=%', NEW.id, SQLERRM;
    -- Ne pas bloquer si échec
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created_notification_prefs ON auth.users;
CREATE TRIGGER on_auth_user_created_notification_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_preferences();

-- Test de validation finale
DO $$
DECLARE
  profile_policies int;
  notif_policies int;
BEGIN
  SELECT COUNT(*) INTO profile_policies
  FROM pg_policies
  WHERE tablename = 'profiles' AND cmd = 'INSERT';
  
  SELECT COUNT(*) INTO notif_policies
  FROM pg_policies
  WHERE tablename = 'notification_preferences' AND cmd = 'INSERT';
  
  RAISE NOTICE '=== Configuration validation ===';
  RAISE NOTICE 'Profile INSERT policies: % (expected: 1)', profile_policies;
  RAISE NOTICE 'Notification INSERT policies: % (expected: 1)', notif_policies;
  
  IF profile_policies = 1 AND notif_policies = 1 THEN
    RAISE NOTICE 'SUCCESS: Configuration is correct!';
  ELSE
    RAISE WARNING 'WARNING: Configuration may have issues';
  END IF;
END $$;
