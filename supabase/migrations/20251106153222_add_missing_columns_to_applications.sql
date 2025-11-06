/*
  # Add Missing Columns to Applications Table

  1. Changes
    - Add `first_name` column for candidate's first name
    - Add `last_name` column for candidate's last name
    - Add `email` column for candidate's email
    - Add `phone` column for candidate's phone number
    - Add `cover_letter_url` column for cover letter file URL
    - Add `message` column for application message
    
  2. Notes
    - These columns are needed for the application form
    - All columns are optional except when submitting a new application
    - Existing applications will have NULL values for these fields
*/

-- Add first_name column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE applications ADD COLUMN first_name text;
  END IF;
END $$;

-- Add last_name column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE applications ADD COLUMN last_name text;
  END IF;
END $$;

-- Add email column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'email'
  ) THEN
    ALTER TABLE applications ADD COLUMN email text;
  END IF;
END $$;

-- Add phone column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'phone'
  ) THEN
    ALTER TABLE applications ADD COLUMN phone text;
  END IF;
END $$;

-- Add cover_letter_url column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'cover_letter_url'
  ) THEN
    ALTER TABLE applications ADD COLUMN cover_letter_url text;
  END IF;
END $$;

-- Add message column (for application message/motivation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'message'
  ) THEN
    ALTER TABLE applications ADD COLUMN message text;
  END IF;
END $$;
