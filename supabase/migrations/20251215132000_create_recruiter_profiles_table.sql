/*
  # Create recruiter_profiles table

  1. New Table
    - `recruiter_profiles`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, foreign key to profiles)
      - `user_id` (uuid, foreign key to auth.users)
      - `job_title` (text) - Poste/Fonction du recruteur
      - `bio` (text) - Biographie/Description du recruteur
      - `linkedin_url` (text) - Profil LinkedIn personnel
      - `company_id` (uuid, foreign key to companies)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Policies for recruiters to manage their own profiles
    - Policies for admins to view all profiles
*/

-- Create recruiter_profiles table
CREATE TABLE IF NOT EXISTS recruiter_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_title text,
  bio text,
  linkedin_url text,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(profile_id),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE recruiter_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Recruiters can view their own profile
CREATE POLICY "Recruiters can view own profile"
  ON recruiter_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Recruiters can update their own profile
CREATE POLICY "Recruiters can update own profile"
  ON recruiter_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Recruiters can insert their own profile
CREATE POLICY "Recruiters can insert own profile"
  ON recruiter_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all recruiter profiles
CREATE POLICY "Admins can view all recruiter profiles"
  ON recruiter_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_recruiter_profiles_user_id ON recruiter_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_profiles_profile_id ON recruiter_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_profiles_company_id ON recruiter_profiles(company_id);

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_recruiter_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recruiter_profiles_updated_at
  BEFORE UPDATE ON recruiter_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_recruiter_profiles_updated_at();
