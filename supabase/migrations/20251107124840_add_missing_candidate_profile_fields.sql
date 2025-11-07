/*
  # Add Missing Fields to Candidate Profiles Table

  ## Overview
  This migration adds all missing fields from the candidate profile form to the 
  `candidate_profiles` table to ensure complete data collection and storage.

  ## New Columns Added

  ### Personal Information
  - `birth_date` (date) - Date of birth
  - `gender` (text) - Gender (Homme/Femme/Autre)
  - `nationality` (text) - Nationality/Region

  ### Professional Information
  - `professional_status` (text) - Current professional status
  - `current_company` (text) - Current employer
  - `availability` (text) - Availability for new opportunities
  - `english_level` (text) - English proficiency level

  ### Profile Data
  - `languages` (text[]) - Languages spoken
  - `professional_goal` (text) - Career objectives
  - `cv_url` - Already exists, no change needed
  - `profile_photo_url` (text) - Profile photo URL
  - `certificates_url` (text) - Certificates document URL

  ### Preferences
  - `receive_alerts` (boolean) - Opt-in for job alerts
  
  ## Notes
  - All new fields are nullable to support existing profiles
  - Default values provided where appropriate
  - Indexes added for commonly queried fields
*/

-- Personal Information Fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN birth_date date;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'gender'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN gender text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'nationality'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN nationality text DEFAULT 'Guinéenne';
  END IF;
END $$;

-- Professional Information Fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'professional_status'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN professional_status text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'current_company'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN current_company text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'availability'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN availability text DEFAULT 'Immédiate';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'english_level'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN english_level text;
  END IF;
END $$;

-- Languages and Goals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'languages'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN languages text[] DEFAULT '{}';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'professional_goal'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN professional_goal text;
  END IF;
END $$;

-- Profile Media
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'profile_photo_url'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN profile_photo_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'certificates_url'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN certificates_url text;
  END IF;
END $$;

-- Preferences
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'receive_alerts'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN receive_alerts boolean DEFAULT false;
  END IF;
END $$;

-- Create indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_availability 
  ON candidate_profiles(availability) 
  WHERE availability IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_nationality 
  ON candidate_profiles(nationality) 
  WHERE nationality IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_languages 
  ON candidate_profiles USING gin(languages) 
  WHERE languages IS NOT NULL AND array_length(languages, 1) > 0;

-- Add comment to table
COMMENT ON TABLE candidate_profiles IS 
  'Complete candidate profile data including personal info, professional experience, skills, and preferences';
