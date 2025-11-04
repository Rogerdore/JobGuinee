/*
  # Add Trainer User Type and Trainer Profiles System

  ## Overview
  This migration adds support for trainer/coach/training organization user type to the platform.

  ## 1. Changes
  
  ### Update `user_type` constraint
  - Add 'trainer' to the allowed user_type values in profiles table
  
  ### New Table: `trainer_profiles`
  - `id` (uuid, primary key)
  - `profile_id` (uuid, references profiles, unique)
  - `user_id` (uuid, references auth.users)
  - `organization_name` (text) - Name of training organization if applicable
  - `organization_type` (text) - 'individual', 'company', 'institute'
  - `bio` (text) - Trainer/coach biography
  - `specializations` (text[]) - Areas of expertise
  - `certifications` (jsonb) - Professional certifications
  - `experience_years` (integer) - Years of training experience
  - `website` (text) - Personal or organization website
  - `linkedin_url` (text) - LinkedIn profile
  - `hourly_rate` (numeric) - Coaching hourly rate
  - `is_verified` (boolean) - Verification status
  - `rating` (numeric) - Average rating from students
  - `total_students` (integer) - Total number of students trained
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## 2. Security
  - Enable RLS on `trainer_profiles` table
  - Add policies for authenticated users to read verified trainer profiles
  - Add policies for trainers to manage their own profiles
  - Add policies for admins to manage all trainer profiles

  ## 3. Important Notes
  - Trainers can create and manage their own training courses/formations
  - Trainers can be verified by admins before being visible publicly
  - Support for both individual coaches and training organizations
*/

-- Drop the existing constraint on user_type
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;

-- Add new constraint with 'trainer' included
ALTER TABLE profiles ADD CONSTRAINT profiles_user_type_check 
  CHECK (user_type IN ('candidate', 'recruiter', 'admin', 'trainer'));

-- Create trainer_profiles table
CREATE TABLE IF NOT EXISTS trainer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid UNIQUE REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_name text,
  organization_type text DEFAULT 'individual' CHECK (organization_type IN ('individual', 'company', 'institute')),
  bio text,
  specializations text[] DEFAULT '{}',
  certifications jsonb DEFAULT '[]',
  experience_years integer DEFAULT 0,
  website text,
  linkedin_url text,
  hourly_rate numeric DEFAULT 0,
  is_verified boolean DEFAULT false,
  rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_students integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on profile_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_profile_id ON trainer_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_user_id ON trainer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_is_verified ON trainer_profiles(is_verified);

-- Enable RLS
ALTER TABLE trainer_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view verified trainer profiles
CREATE POLICY "Anyone can view verified trainer profiles"
  ON trainer_profiles FOR SELECT
  USING (is_verified = true);

-- Policy: Trainers can view their own profile (even if not verified)
CREATE POLICY "Trainers can view own profile"
  ON trainer_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Trainers can create their own profile
CREATE POLICY "Trainers can create own profile"
  ON trainer_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Trainers can update their own profile
CREATE POLICY "Trainers can update own profile"
  ON trainer_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can manage all trainer profiles
CREATE POLICY "Admins can manage all trainer profiles"
  ON trainer_profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_trainer_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_trainer_profiles_updated_at_trigger ON trainer_profiles;
CREATE TRIGGER update_trainer_profiles_updated_at_trigger
  BEFORE UPDATE ON trainer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_trainer_profiles_updated_at();

-- Update formations table to link with trainer_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'formations' AND column_name = 'trainer_id'
  ) THEN
    ALTER TABLE formations ADD COLUMN trainer_id uuid REFERENCES trainer_profiles(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_formations_trainer_id ON formations(trainer_id);
  END IF;
END $$;