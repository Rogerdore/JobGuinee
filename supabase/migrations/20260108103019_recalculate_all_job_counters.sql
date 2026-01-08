/*
  # Recalcul de tous les compteurs des offres d'emploi

  1. Problème identifié
    - Les compteurs dans la table jobs ne correspondent pas aux valeurs réelles
    - Certaines données ont été créées avant les triggers
    - Il faut tout recalculer

  2. Solution
    - Recalcul de views_count depuis job_views
    - Recalcul de applications_count depuis applications
    - Recalcul de saves_count depuis saved_jobs
    - Recalcul de comments_count depuis job_comments

  3. Note
    - Cette opération met à jour tous les compteurs pour refléter les vraies valeurs
    - Les triggers maintiendront automatiquement les compteurs à jour après cette migration
*/

-- Recalculer le compteur de vues
UPDATE jobs
SET views_count = COALESCE((
  SELECT COUNT(*)
  FROM job_views
  WHERE job_views.job_id = jobs.id
), 0);

-- Recalculer le compteur de candidatures
UPDATE jobs
SET applications_count = COALESCE((
  SELECT COUNT(*)
  FROM applications
  WHERE applications.job_id = jobs.id
), 0);

-- Recalculer le compteur de favoris
UPDATE jobs
SET saves_count = COALESCE((
  SELECT COUNT(*)
  FROM saved_jobs
  WHERE saved_jobs.job_id = jobs.id
), 0);

-- Recalculer le compteur de commentaires (uniquement les commentaires parents)
UPDATE jobs
SET comments_count = COALESCE((
  SELECT COUNT(*)
  FROM job_comments
  WHERE job_comments.job_id = jobs.id
  AND job_comments.parent_id IS NULL
), 0);
