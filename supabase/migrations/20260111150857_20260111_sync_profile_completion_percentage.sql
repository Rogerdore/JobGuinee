/*
  # Synchronisation du pourcentage de complétion du profil

  1. Trigger
    - Synchronise automatiquement `candidate_profiles.profile_completion_percentage`
      vers `profiles.profile_completion_percentage`
    - Se déclenche à chaque INSERT ou UPDATE sur `candidate_profiles`

  2. Fonction de synchronisation manuelle
    - Permet de resynchroniser tous les profils existants

  3. Note
    - Ce trigger assure une SOURCE DE VÉRITÉ UNIQUE
    - Le pourcentage est calculé dans le formulaire candidat
    - Il est sauvegardé dans `candidate_profiles`
    - Puis automatiquement copié dans `profiles` pour l'accès rapide
*/

-- Fonction pour synchroniser le pourcentage de complétion vers profiles
CREATE OR REPLACE FUNCTION sync_candidate_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le pourcentage dans la table profiles
  UPDATE profiles
  SET profile_completion_percentage = COALESCE(NEW.profile_completion_percentage, 0)
  WHERE id = NEW.profile_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trigger_sync_candidate_profile_completion ON candidate_profiles;

-- Créer le trigger
CREATE TRIGGER trigger_sync_candidate_profile_completion
  AFTER INSERT OR UPDATE OF profile_completion_percentage
  ON candidate_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_candidate_profile_completion();

-- Fonction pour resynchroniser tous les profils existants
CREATE OR REPLACE FUNCTION resync_all_profile_completions()
RETURNS void AS $$
BEGIN
  UPDATE profiles p
  SET profile_completion_percentage = COALESCE(cp.profile_completion_percentage, 0)
  FROM candidate_profiles cp
  WHERE p.id = cp.profile_id
    AND p.user_type = 'candidate'
    AND p.profile_completion_percentage != COALESCE(cp.profile_completion_percentage, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Exécuter la resynchronisation pour tous les profils existants
SELECT resync_all_profile_completions();

-- Commentaire
COMMENT ON FUNCTION sync_candidate_profile_completion() IS 'Synchronise automatiquement le pourcentage de complétion de candidate_profiles vers profiles';
COMMENT ON FUNCTION resync_all_profile_completions() IS 'Resynchronise manuellement tous les pourcentages de complétion existants';
