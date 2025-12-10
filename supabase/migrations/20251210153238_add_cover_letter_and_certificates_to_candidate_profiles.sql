/*
  # Add Cover Letter and Certificates to Candidate Profiles

  1. Changes
    - Add `cover_letter_url` column to `candidate_profiles` table for storing cover letter file URLs
    - Add `certificates_url` column to `candidate_profiles` table for storing certificates/attestations file URLs
  
  2. Notes
    - Both fields are optional (nullable)
    - Will store file URLs from Supabase Storage or direct file paths
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'cover_letter_url'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN cover_letter_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'certificates_url'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN certificates_url text;
  END IF;
END $$;