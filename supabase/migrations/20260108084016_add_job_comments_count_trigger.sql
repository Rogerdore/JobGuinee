/*
  # Trigger automatique pour mettre à jour le compteur de commentaires

  1. Fonction
    - Met à jour automatiquement jobs.comments_count quand un commentaire est ajouté/supprimé
    - Ne compte que les commentaires parents (pas les réponses)
  
  2. Trigger
    - AFTER INSERT : Incrémente le compteur
    - AFTER DELETE : Décrémente le compteur
*/

-- Fonction pour mettre à jour le compteur de commentaires
CREATE OR REPLACE FUNCTION update_job_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Ne mettre à jour que pour les commentaires parents (parent_id IS NULL)
  IF (TG_OP = 'INSERT' AND NEW.parent_id IS NULL) THEN
    UPDATE jobs
    SET comments_count = COALESCE(comments_count, 0) + 1
    WHERE id = NEW.job_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE' AND OLD.parent_id IS NULL) THEN
    UPDATE jobs
    SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0)
    WHERE id = OLD.job_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trigger_update_job_comments_count ON job_comments;

-- Créer le trigger
CREATE TRIGGER trigger_update_job_comments_count
  AFTER INSERT OR DELETE ON job_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_job_comments_count();

-- Initialiser les compteurs existants
UPDATE jobs j
SET comments_count = (
  SELECT COUNT(*)
  FROM job_comments jc
  WHERE jc.job_id = j.id AND jc.parent_id IS NULL
)
WHERE j.comments_count IS NULL OR j.comments_count != (
  SELECT COUNT(*)
  FROM job_comments jc
  WHERE jc.job_id = j.id AND jc.parent_id IS NULL
);
