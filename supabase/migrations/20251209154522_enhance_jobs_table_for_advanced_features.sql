/*
  # Enhance Jobs Table for Advanced Features

  ## Overview
  Add advanced job board features including sector filtering, experience levels, view tracking, and analytics.

  ## Changes
  - Add sector, experience_level, education_level fields
  - Add view and application tracking
  - Add featured and urgent job flags
  - Add detailed job information fields
  - Create saved_jobs and job_views tables

  ## Security
  - RLS enabled on all new tables
*/

-- Add new columns to jobs table
DO $$ 
BEGIN
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
    ALTER TABLE jobs ADD COLUMN deadline timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'nationality_required'
  ) THEN
    ALTER TABLE jobs ADD COLUMN nationality_required text DEFAULT 'Any';
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_jobs_sector ON jobs(sector);
CREATE INDEX IF NOT EXISTS idx_jobs_experience_level ON jobs(experience_level);
CREATE INDEX IF NOT EXISTS idx_jobs_views_count ON jobs(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_is_featured ON jobs(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_jobs_deadline ON jobs(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_keywords ON jobs USING gin(keywords);

-- Create saved_jobs table
CREATE TABLE IF NOT EXISTS saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  saved_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(candidate_id, job_id)
);

-- Create job_views table
CREATE TABLE IF NOT EXISTS job_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at timestamptz DEFAULT now() NOT NULL,
  ip_address text,
  user_agent text
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_saved_jobs_candidate ON saved_jobs(candidate_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job ON saved_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_job_views_job ON job_views(job_id);
CREATE INDEX IF NOT EXISTS idx_job_views_date ON job_views(viewed_at DESC);

-- Enable RLS
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_jobs
CREATE POLICY "Users can view own saved jobs"
  ON saved_jobs FOR SELECT
  TO authenticated
  USING (candidate_id = auth.uid());

CREATE POLICY "Users can save jobs"
  ON saved_jobs FOR INSERT
  TO authenticated
  WITH CHECK (candidate_id = auth.uid());

CREATE POLICY "Users can unsave jobs"
  ON saved_jobs FOR DELETE
  TO authenticated
  USING (candidate_id = auth.uid());

-- RLS Policies for job_views
CREATE POLICY "Job owners can view their job analytics"
  ON job_views FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_views.job_id
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can record job views"
  ON job_views FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_job_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE jobs
  SET views_count = views_count + 1
  WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-increment views
DROP TRIGGER IF EXISTS on_job_view_created ON job_views;
CREATE TRIGGER on_job_view_created
  AFTER INSERT ON job_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_job_view_count();

-- Function to update applications count
CREATE OR REPLACE FUNCTION update_job_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE jobs
    SET applications_count = applications_count + 1
    WHERE id = NEW.job_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE jobs
    SET applications_count = applications_count - 1
    WHERE id = OLD.job_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update applications count
DROP TRIGGER IF EXISTS on_application_change ON applications;
CREATE TRIGGER on_application_change
  AFTER INSERT OR DELETE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_job_applications_count();