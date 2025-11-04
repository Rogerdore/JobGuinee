/*
  # Enhance Recruiter Profiles System

  ## Overview
  This migration enhances the recruiter profile system by adding more detailed fields
  to both the profiles and companies tables. Recruiters need complete profile information
  similar to candidates.

  ## Changes

  ### profiles table enhancements
  - Add `job_title` - Recruiter's position in company
  - Add `bio` - Professional biography
  - Add `linkedin_url` - LinkedIn profile link
  - Add `profile_completed` - Flag to track if profile is filled

  ### companies table enhancements
  - Add `address` - Full company address
  - Add `phone` - Company contact phone
  - Add `email` - Company contact email
  - Add `employee_count` - Number of employees
  - Add `founded_year` - Year company was founded
  - Add `benefits` - Array of employee benefits
  - Add `culture_description` - Company culture description
  - Add `social_media` - JSONB for social media links

  ## Security
  - Maintain existing RLS policies
  - No policy changes needed
*/

-- Add new columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'job_title'
  ) THEN
    ALTER TABLE profiles ADD COLUMN job_title text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bio text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'linkedin_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN linkedin_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_completed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add new columns to companies table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'address'
  ) THEN
    ALTER TABLE companies ADD COLUMN address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'phone'
  ) THEN
    ALTER TABLE companies ADD COLUMN phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'email'
  ) THEN
    ALTER TABLE companies ADD COLUMN email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'employee_count'
  ) THEN
    ALTER TABLE companies ADD COLUMN employee_count text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'founded_year'
  ) THEN
    ALTER TABLE companies ADD COLUMN founded_year integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'benefits'
  ) THEN
    ALTER TABLE companies ADD COLUMN benefits text[] DEFAULT ARRAY[]::text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'culture_description'
  ) THEN
    ALTER TABLE companies ADD COLUMN culture_description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'social_media'
  ) THEN
    ALTER TABLE companies ADD COLUMN social_media jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create index on company_id in profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_profiles_company_id'
  ) THEN
    CREATE INDEX idx_profiles_company_id ON profiles(company_id);
  END IF;
END $$;