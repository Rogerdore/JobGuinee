/*
  # Correctif du compteur de vues des offres d'emploi

  1. Problème identifié
    - Le compteur `views_count` existe dans la table jobs
    - Mais le trigger pour l'incrémenter automatiquement est manquant
    - Les vues ne sont donc pas comptabilisées

  2. Solution
    - Création de la fonction `increment_job_view_count()`
    - Création du trigger sur la table `job_views`
    - Initialisation des compteurs existants

  3. Sécurité
    - Fonction en SECURITY DEFINER pour permettre les mises à jour
    - Le trigger s'exécute automatiquement lors d'un INSERT dans job_views
*/

-- Fonction pour incrémenter le compteur de vues
CREATE OR REPLACE FUNCTION increment_job_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE jobs
  SET views_count = views_count + 1
  WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trigger_increment_job_view_count ON job_views;

-- Créer le trigger
CREATE TRIGGER trigger_increment_job_view_count
  AFTER INSERT ON job_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_job_view_count();

-- Initialiser les compteurs existants
UPDATE jobs
SET views_count = (
  SELECT COUNT(*)
  FROM job_views
  WHERE job_views.job_id = jobs.id
)
WHERE views_count = 0 OR views_count IS NULL;
