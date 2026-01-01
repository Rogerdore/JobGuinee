/*
  # Fix deadline trigger with CASCADE

  ## Résumé
  Supprime le trigger et la fonction problématiques qui font référence à une colonne deadline inexistante

  ## Modifications
  - Suppression CASCADE du trigger et de la fonction
*/

-- Supprimer la fonction avec CASCADE pour supprimer aussi le trigger
DROP FUNCTION IF EXISTS sync_job_deadline_fields() CASCADE;
