/*
  # Ajout de la colonne deadline à la table jobs

  1. Modification
    - Ajout de la colonne `deadline` (date) pour afficher la date limite de candidature
    - Cette colonne est optionnelle (nullable)

  2. Index
    - Index sur deadline pour optimiser les requêtes filtrant par date limite

  3. Sécurité
    - Pas de modification RLS nécessaire
    - La colonne hérite des policies existantes
*/

-- Ajouter la colonne deadline si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'deadline'
  ) THEN
    ALTER TABLE jobs ADD COLUMN deadline date;
  END IF;
END $$;

-- Créer un index pour optimiser les requêtes sur deadline
CREATE INDEX IF NOT EXISTS idx_jobs_deadline ON jobs(deadline) WHERE deadline IS NOT NULL;
