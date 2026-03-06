/*
  # Add missing columns to jobs table

  ## Changes
  - Add `company_name` (text) - Company name for the job posting
  - Add `primary_qualification` (text) - Main qualification required
  - Add `is_visible` (boolean) - Whether the job is visible to users

  These columns are referenced in the admin job creation form but were missing from the schema.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE jobs ADD COLUMN company_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'primary_qualification'
  ) THEN
    ALTER TABLE jobs ADD COLUMN primary_qualification text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'is_visible'
  ) THEN
    ALTER TABLE jobs ADD COLUMN is_visible boolean NOT NULL DEFAULT true;
  END IF;
END $$;
