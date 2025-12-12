/*
  # Ajouter la foreign key manquante pour applications.candidate_id

  1. Modifications
    - Ajouter une foreign key entre `applications.candidate_id` et `profiles.id`
    - Cette relation permettra à Supabase de faire la jointure automatiquement
  
  2. Sécurité
    - Aucun changement RLS nécessaire
*/

-- Ajouter la foreign key si elle n'existe pas déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'applications_candidate_id_fkey'
  ) THEN
    ALTER TABLE applications
    ADD CONSTRAINT applications_candidate_id_fkey
    FOREIGN KEY (candidate_id) 
    REFERENCES profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;