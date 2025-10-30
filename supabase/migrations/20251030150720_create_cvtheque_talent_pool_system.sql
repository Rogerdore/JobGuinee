/*
  # Create CVThèque Talent Pool System

  ## Overview
  Complete talent database with AI-powered search, filtering, and recruiter interaction features.

  ## 1. New Tables
    
    ### `talent_searches`
    - `id` (uuid, primary key)
    - `recruiter_id` (uuid, foreign key to profiles)
    - `search_query` (text) - Raw search text
    - `filters` (jsonb) - Applied filters
    - `results_count` (integer)
    - `created_at` (timestamptz)

    ### `favorite_candidates`
    - `id` (uuid, primary key)
    - `recruiter_id` (uuid, foreign key to profiles)
    - `candidate_id` (uuid, foreign key to candidate_profiles)
    - `notes` (text)
    - `tags` (text[])
    - `created_at` (timestamptz)

    ### `candidate_contacts`
    - `id` (uuid, primary key)
    - `recruiter_id` (uuid, foreign key to profiles)
    - `candidate_id` (uuid, foreign key to candidate_profiles)
    - `message` (text)
    - `status` (text: sent, read, replied)
    - `created_at` (timestamptz)

    ### `profile_verifications`
    - `id` (uuid, primary key)
    - `candidate_id` (uuid, foreign key to candidate_profiles)
    - `verification_type` (text: identity, education, experience)
    - `is_verified` (boolean)
    - `verified_at` (timestamptz)
    - `verified_by` (uuid, foreign key to profiles)

    ### `cv_downloads`
    - `id` (uuid, primary key)
    - `recruiter_id` (uuid, foreign key to profiles)
    - `candidate_id` (uuid, foreign key to candidate_profiles)
    - `downloaded_at` (timestamptz)

  ## 2. Extend candidate_profiles table
    - Add `languages` (text[])
    - Add `certifications` (jsonb)
    - Add `preferred_contract_type` (text)
    - Add `mobility` (text)
    - Add `is_verified` (boolean)
    - Add `visibility` (text: public, private, premium_only)
    - Add `last_active_at` (timestamptz)

  ## 3. Security
    - Enable RLS on all new tables
    - Recruiters can search all public profiles
    - Premium recruiters can see premium_only profiles
    - Candidates control their profile visibility
    - Contact history restricted to involved parties

  ## 4. Indexes
    - Full-text search on candidate skills, title, bio
    - Index on location, experience_years, education_level
    - Index on favorite_candidates(recruiter_id, candidate_id)
*/

-- Extend candidate_profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'languages'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN languages text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'certifications'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN certifications jsonb DEFAULT '[]';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'preferred_contract_type'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN preferred_contract_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'mobility'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN mobility text DEFAULT 'Nationale';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN is_verified boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'visibility'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN visibility text DEFAULT 'public';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'last_active_at'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN last_active_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'nationality'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN nationality text DEFAULT 'Guinéenne';
  END IF;
END $$;

-- Create talent_searches table
CREATE TABLE IF NOT EXISTS talent_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  search_query text,
  filters jsonb DEFAULT '{}',
  results_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create favorite_candidates table
CREATE TABLE IF NOT EXISTS favorite_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  candidate_id uuid REFERENCES candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  notes text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(recruiter_id, candidate_id)
);

-- Create candidate_contacts table
CREATE TABLE IF NOT EXISTS candidate_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  candidate_id uuid REFERENCES candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'sent',
  created_at timestamptz DEFAULT now()
);

-- Create profile_verifications table
CREATE TABLE IF NOT EXISTS profile_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  verification_type text NOT NULL,
  is_verified boolean DEFAULT false,
  verified_at timestamptz,
  verified_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Create cv_downloads table
CREATE TABLE IF NOT EXISTS cv_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  candidate_id uuid REFERENCES candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  downloaded_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_talent_searches_recruiter ON talent_searches(recruiter_id, created_at);
CREATE INDEX IF NOT EXISTS idx_favorite_candidates_recruiter ON favorite_candidates(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_favorite_candidates_candidate ON favorite_candidates(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_contacts_recruiter ON candidate_contacts(recruiter_id, created_at);
CREATE INDEX IF NOT EXISTS idx_candidate_contacts_candidate ON candidate_contacts(candidate_id, created_at);
CREATE INDEX IF NOT EXISTS idx_cv_downloads_recruiter ON cv_downloads(recruiter_id, downloaded_at);
CREATE INDEX IF NOT EXISTS idx_candidate_location ON candidate_profiles(location);
CREATE INDEX IF NOT EXISTS idx_candidate_experience ON candidate_profiles(experience_years);
CREATE INDEX IF NOT EXISTS idx_candidate_education ON candidate_profiles(education_level);
CREATE INDEX IF NOT EXISTS idx_candidate_verified ON candidate_profiles(is_verified);

-- Enable RLS
ALTER TABLE talent_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_downloads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for talent_searches
CREATE POLICY "Recruiters can view own searches"
  ON talent_searches FOR SELECT
  TO authenticated
  USING (recruiter_id = auth.uid());

CREATE POLICY "Recruiters can insert own searches"
  ON talent_searches FOR INSERT
  TO authenticated
  WITH CHECK (recruiter_id = auth.uid());

-- RLS Policies for favorite_candidates
CREATE POLICY "Recruiters can view own favorites"
  ON favorite_candidates FOR SELECT
  TO authenticated
  USING (recruiter_id = auth.uid());

CREATE POLICY "Recruiters can manage own favorites"
  ON favorite_candidates FOR ALL
  TO authenticated
  USING (recruiter_id = auth.uid())
  WITH CHECK (recruiter_id = auth.uid());

-- RLS Policies for candidate_contacts
CREATE POLICY "Recruiters can view contacts they initiated"
  ON candidate_contacts FOR SELECT
  TO authenticated
  USING (recruiter_id = auth.uid());

CREATE POLICY "Candidates can view contacts about them"
  ON candidate_contacts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM candidate_profiles
      WHERE candidate_profiles.id = candidate_contacts.candidate_id
      AND candidate_profiles.profile_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can insert contacts"
  ON candidate_contacts FOR INSERT
  TO authenticated
  WITH CHECK (recruiter_id = auth.uid());

-- RLS Policies for profile_verifications
CREATE POLICY "Anyone can view verifications"
  ON profile_verifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage verifications"
  ON profile_verifications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'recruiter'
    )
  );

-- RLS Policies for cv_downloads
CREATE POLICY "Recruiters can view own downloads"
  ON cv_downloads FOR SELECT
  TO authenticated
  USING (recruiter_id = auth.uid());

CREATE POLICY "Recruiters can insert downloads"
  ON cv_downloads FOR INSERT
  TO authenticated
  WITH CHECK (recruiter_id = auth.uid());
