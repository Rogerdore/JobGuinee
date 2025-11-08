/*
  # Ajout de triggers pour maintenir les compteurs des projets/offres
  
  1. Fonctionnalités
    - Trigger pour incrémenter applications_count lors d'une nouvelle candidature
    - Trigger pour décrémenter applications_count lors de la suppression d'une candidature
    - Fonction pour recalculer les compteurs existants
  
  2. Sécurité
    - Les triggers s'exécutent automatiquement
    - Mise à jour uniquement du compteur, pas d'autres champs
*/

-- Fonction pour mettre à jour le compteur de candidatures lors de l'ajout
CREATE OR REPLACE FUNCTION increment_job_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE jobs 
  SET applications_count = applications_count + 1
  WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour le compteur de candidatures lors de la suppression
CREATE OR REPLACE FUNCTION decrement_job_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE jobs 
  SET applications_count = GREATEST(0, applications_count - 1)
  WHERE id = OLD.job_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour incrémenter le compteur lors de l'ajout d'une candidature
DROP TRIGGER IF EXISTS trigger_increment_applications_count ON applications;
CREATE TRIGGER trigger_increment_applications_count
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION increment_job_applications_count();

-- Trigger pour décrémenter le compteur lors de la suppression d'une candidature
DROP TRIGGER IF EXISTS trigger_decrement_applications_count ON applications;
CREATE TRIGGER trigger_decrement_applications_count
  AFTER DELETE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION decrement_job_applications_count();

-- Fonction pour recalculer tous les compteurs existants
CREATE OR REPLACE FUNCTION recalculate_all_job_counters()
RETURNS void AS $$
BEGIN
  UPDATE jobs j
  SET applications_count = (
    SELECT COUNT(*)
    FROM applications a
    WHERE a.job_id = j.id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recalculer les compteurs pour toutes les offres existantes
SELECT recalculate_all_job_counters();
