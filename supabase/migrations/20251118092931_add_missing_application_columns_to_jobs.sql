/*
  # Ajouter les colonnes manquantes pour les candidatures

  1. Modifications
    - Ajouter application_email à la table jobs
    - Ajouter receive_applications_in_platform
    - Ajouter required_documents
    - Ajouter application_instructions
    - Ajouter visibility
    - Ajouter is_premium
    - Ajouter language
    - Ajouter auto_share_social
    - Ajouter publication_duration
    - Ajouter auto_renewal
*/

-- Add missing columns to jobs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'application_email'
  ) THEN
    ALTER TABLE jobs ADD COLUMN application_email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'receive_applications_in_platform'
  ) THEN
    ALTER TABLE jobs ADD COLUMN receive_applications_in_platform boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'required_documents'
  ) THEN
    ALTER TABLE jobs ADD COLUMN required_documents text[] DEFAULT ARRAY['CV', 'Lettre de motivation'];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'application_instructions'
  ) THEN
    ALTER TABLE jobs ADD COLUMN application_instructions text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'visibility'
  ) THEN
    ALTER TABLE jobs ADD COLUMN visibility text DEFAULT 'Publique';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'is_premium'
  ) THEN
    ALTER TABLE jobs ADD COLUMN is_premium boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'language'
  ) THEN
    ALTER TABLE jobs ADD COLUMN language text DEFAULT 'Français';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'auto_share_social'
  ) THEN
    ALTER TABLE jobs ADD COLUMN auto_share_social boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'publication_duration'
  ) THEN
    ALTER TABLE jobs ADD COLUMN publication_duration text DEFAULT '30 jours';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'auto_renewal'
  ) THEN
    ALTER TABLE jobs ADD COLUMN auto_renewal boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'required_skills'
  ) THEN
    ALTER TABLE jobs ADD COLUMN required_skills text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'category'
  ) THEN
    ALTER TABLE jobs ADD COLUMN category text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'positions_available'
  ) THEN
    ALTER TABLE jobs ADD COLUMN positions_available integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'experience_required'
  ) THEN
    ALTER TABLE jobs ADD COLUMN experience_required text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'recruiter_id'
  ) THEN
    ALTER TABLE jobs ADD COLUMN recruiter_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_jobs_visibility ON jobs(visibility);
CREATE INDEX IF NOT EXISTS idx_jobs_is_premium ON jobs(is_premium) WHERE is_premium = true;
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter ON jobs(recruiter_id);
