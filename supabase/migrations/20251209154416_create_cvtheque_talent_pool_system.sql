/*
  # Create CVThèque Talent Pool System

  ## Overview
  Complete talent database with AI-powered search, filtering, and recruiter interaction features.

  ## 1. New Tables
    
    ### `talent_searches`
    - Track recruiter search history
    - Store search queries and filters

    ### `favorite_candidates`
    - Allow recruiters to save favorite candidates
    - Add notes and tags

    ### `candidate_contacts`
    - Track recruiter-candidate communications
    - Message status tracking

    ### `profile_verifications`
    - Verify candidate credentials
    - Track verification history

    ### `cv_downloads`
    - Track CV download history

  ## 2. Extend candidate_profiles table
    - Add additional profile fields
    - Enhanced search capabilities

  ## 3. Security
    - Enable RLS on all new tables
    - Appropriate access policies
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