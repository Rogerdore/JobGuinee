/*
  # Add Missing Columns to Jobs Table

  1. Columns Added
    - experience_level (text) - Required experience for the job
    - diploma_required (text) - Required diploma/degree
  
  2. Security
    - No RLS changes needed, inherits from parent table
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'experience_level'
  ) THEN
    ALTER TABLE jobs ADD COLUMN experience_level text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'diploma_required'
  ) THEN
    ALTER TABLE jobs ADD COLUMN diploma_required text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'sector'
  ) THEN
    ALTER TABLE jobs ADD COLUMN sector text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'education_level'
  ) THEN
    ALTER TABLE jobs ADD COLUMN education_level text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'views_count'
  ) THEN
    ALTER TABLE jobs ADD COLUMN views_count integer DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'applications_count'
  ) THEN
    ALTER TABLE jobs ADD COLUMN applications_count integer DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE jobs ADD COLUMN is_featured boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'is_urgent'
  ) THEN
    ALTER TABLE jobs ADD COLUMN is_urgent boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'requirements'
  ) THEN
    ALTER TABLE jobs ADD COLUMN requirements text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'responsibilities'
  ) THEN
    ALTER TABLE jobs ADD COLUMN responsibilities text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'benefits'
  ) THEN
    ALTER TABLE jobs ADD COLUMN benefits text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'deadline'
  ) THEN
    ALTER TABLE jobs ADD COLUMN deadline date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'nationality_required'
  ) THEN
    ALTER TABLE jobs ADD COLUMN nationality_required text DEFAULT 'Tous';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'languages'
  ) THEN
    ALTER TABLE jobs ADD COLUMN languages text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'keywords'
  ) THEN
    ALTER TABLE jobs ADD COLUMN keywords text[] DEFAULT '{}';
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_jobs_sector ON jobs(sector);
CREATE INDEX IF NOT EXISTS idx_jobs_experience_level ON jobs(experience_level);
CREATE INDEX IF NOT EXISTS idx_jobs_education_level ON jobs(education_level);
CREATE INDEX IF NOT EXISTS idx_jobs_views_count ON jobs(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_is_featured ON jobs(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_jobs_deadline ON jobs(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_keywords ON jobs USING gin(keywords);
