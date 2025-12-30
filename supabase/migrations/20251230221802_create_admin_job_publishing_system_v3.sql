/*
  # Admin Job Publishing System

  ## New Tables
  
  1. `partners` - Partner management for admin job publishing
    - `id` (uuid, primary key)
    - `name` (text, required) - Partner company name
    - `email` (text, required, unique) - Partner contact email
    - `logo_url` (text, nullable) - Partner logo
    - `type` (text, required) - Partner type (cabinet, institution, etc.)
    - `invited_by` (uuid, references profiles) - Admin who invited
    - `invited_at` (timestamptz) - Invitation date
    - `status` (text) - active, inactive, pending
    - `notes` (text) - Admin notes
    
  2. `document_download_logs` - Track document downloads
    - `id` (uuid, primary key)
    - `candidate_profile_id` (uuid, references candidate_profiles.id)
    - `downloaded_by` (uuid, references profiles)
    - `document_type` (text) - cv, cover_letter, certificates, etc.
    - `download_method` (text) - direct, watermarked, zip
    - `ip_address` (text)
    - `downloaded_at` (timestamptz)

  ## Modified Tables
  
  1. `jobs` - Add admin publishing fields
    - `published_by_admin` (boolean) - True if published by admin
    - `admin_publisher_id` (uuid) - Admin who published
    - `publication_source` (text) - jobguinee or partenaire
    - `partner_id` (uuid) - Link to partner if applicable
    - `partner_type` (text) - Type of partner
    - `partner_name` (text) - Partner display name
    - `partner_email` (text) - Partner contact email
    - `partner_logo_url` (text) - Partner logo
    - `application_mode` (text) - How applications are handled
    - `external_apply_url` (text) - External application URL
    - `admin_notes` (text) - Internal notes

  2. `public_profile_tokens` - Add missing fields
    - `created_by` (uuid) - Admin who created the token
    - `access_count` (integer) - Alternative to view_count

  ## Security
  - Enable RLS on all new tables
  - Add policies for admin access only
*/

-- Create partners table
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  logo_url text,
  type text NOT NULL DEFAULT 'cabinet',
  invited_by uuid REFERENCES profiles(id),
  invited_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create document_download_logs table
CREATE TABLE IF NOT EXISTS document_download_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_profile_id uuid REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  downloaded_by uuid REFERENCES profiles(id),
  document_type text NOT NULL,
  download_method text NOT NULL DEFAULT 'direct',
  ip_address text,
  downloaded_at timestamptz DEFAULT now()
);

-- Add fields to public_profile_tokens if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'public_profile_tokens' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public_profile_tokens ADD COLUMN created_by uuid REFERENCES profiles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'public_profile_tokens' AND column_name = 'access_count'
  ) THEN
    ALTER TABLE public_profile_tokens ADD COLUMN access_count integer DEFAULT 0;
  END IF;
END $$;

-- Add admin publishing fields to jobs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'published_by_admin'
  ) THEN
    ALTER TABLE jobs ADD COLUMN published_by_admin boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'admin_publisher_id'
  ) THEN
    ALTER TABLE jobs ADD COLUMN admin_publisher_id uuid REFERENCES profiles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'publication_source'
  ) THEN
    ALTER TABLE jobs ADD COLUMN publication_source text DEFAULT 'jobguinee';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'partner_id'
  ) THEN
    ALTER TABLE jobs ADD COLUMN partner_id uuid REFERENCES partners(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'partner_type'
  ) THEN
    ALTER TABLE jobs ADD COLUMN partner_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'partner_name'
  ) THEN
    ALTER TABLE jobs ADD COLUMN partner_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'partner_email'
  ) THEN
    ALTER TABLE jobs ADD COLUMN partner_email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'partner_logo_url'
  ) THEN
    ALTER TABLE jobs ADD COLUMN partner_logo_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'application_mode'
  ) THEN
    ALTER TABLE jobs ADD COLUMN application_mode text DEFAULT 'company_account';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'external_apply_url'
  ) THEN
    ALTER TABLE jobs ADD COLUMN external_apply_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE jobs ADD COLUMN admin_notes text;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_download_logs ENABLE ROW LEVEL SECURITY;

-- Partners policies (admin only)
CREATE POLICY "Admins can view all partners"
  ON partners FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can insert partners"
  ON partners FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update partners"
  ON partners FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Document download logs policies (admin only)
CREATE POLICY "Admins can view download logs"
  ON document_download_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can insert download logs"
  ON document_download_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_partners_email ON partners(email);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_document_download_logs_candidate_profile_id ON document_download_logs(candidate_profile_id);
CREATE INDEX IF NOT EXISTS idx_document_download_logs_downloaded_by ON document_download_logs(downloaded_by);
CREATE INDEX IF NOT EXISTS idx_jobs_published_by_admin ON jobs(published_by_admin);
CREATE INDEX IF NOT EXISTS idx_jobs_admin_publisher_id ON jobs(admin_publisher_id);
CREATE INDEX IF NOT EXISTS idx_jobs_partner_id ON jobs(partner_id);
CREATE INDEX IF NOT EXISTS idx_jobs_application_mode ON jobs(application_mode);