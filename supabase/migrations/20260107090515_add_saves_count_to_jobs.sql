/*
  # Ajout du compteur de favoris aux offres d'emploi

  1. Modifications
    - Ajout de la colonne `saves_count` à la table `jobs`
    - Création d'une fonction pour compter les favoris
    - Mise à jour du trigger pour maintenir le compteur à jour

  2. Sécurité
    - Le compteur est géré automatiquement par des triggers
    - Lecture publique du compteur pour tous les utilisateurs
*/

-- Ajouter la colonne saves_count à la table jobs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'saves_count'
  ) THEN
    ALTER TABLE jobs ADD COLUMN saves_count integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Fonction pour mettre à jour le compteur de favoris
CREATE OR REPLACE FUNCTION update_job_saves_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE jobs
    SET saves_count = saves_count + 1
    WHERE id = NEW.job_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE jobs
    SET saves_count = GREATEST(saves_count - 1, 0)
    WHERE id = OLD.job_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger si il n'existe pas
DROP TRIGGER IF EXISTS trigger_update_saves_count ON saved_jobs;
CREATE TRIGGER trigger_update_saves_count
  AFTER INSERT OR DELETE ON saved_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_job_saves_count();

-- Initialiser les compteurs existants
UPDATE jobs
SET saves_count = (
  SELECT COUNT(*)
  FROM saved_jobs
  WHERE saved_jobs.job_id = jobs.id
)
WHERE saves_count = 0;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_jobs_saves_count ON jobs(saves_count DESC);
