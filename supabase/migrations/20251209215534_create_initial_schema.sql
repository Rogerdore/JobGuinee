/*
  # Create Initial Schema for JobGuinée Platform

  ## Overview
  This migration creates the foundational database schema for the recruitment platform,
  including user profiles, jobs, applications, companies, and related tables.

  ## 1. New Tables
  
  ### `profiles`
  - `id` (uuid, primary key, references auth.users)
  - `email` (text, unique, not null)
  - `full_name` (text)
  - `user_type` (text) - 'candidate' or 'recruiter'
  - `avatar_url` (text)
  - `phone` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `companies`
  - `id` (uuid, primary key)
  - `profile_id` (uuid, references profiles)
  - `name` (text, not null)
  - `description` (text)
  - `logo_url` (text)
  - `website` (text)
  - `industry` (text)
  - `size` (text)
  - `location` (text)
  - `created_at` (timestamptz)

  ### `jobs`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `company_id` (uuid, references companies)
  - `title` (text, not null)
  - `description` (text)
  - `location` (text)
  - `contract_type` (text)
  - `salary_min` (numeric)
  - `salary_max` (numeric)
  - `status` (text) - 'draft', 'published', 'closed'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `candidate_profiles`
  - `id` (uuid, primary key)
  - `profile_id` (uuid, references profiles)
  - `user_id` (uuid, references auth.users)
  - `title` (text)
  - `bio` (text)
  - `experience_years` (integer)
  - `skills` (text[])
  - `education` (jsonb)
  - `work_experience` (jsonb)
  - `cv_url` (text)
  - `visibility` (text) - 'public', 'private', 'premium'
  - `profile_price` (numeric)
  - `last_active_at` (timestamptz)
  - `created_at` (timestamptz)

  ### `applications`
  - `id` (uuid, primary key)
  - `job_id` (uuid, references jobs)
  - `candidate_id` (uuid, references auth.users)
  - `status` (text) - 'pending', 'reviewed', 'shortlisted', 'interview', 'rejected', 'accepted'
  - `cover_letter` (text)
  - `applied_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `blog_posts`
  - `id` (uuid, primary key)
  - `title` (text, not null)
  - `slug` (text, unique, not null)
  - `excerpt` (text)
  - `content` (text)
  - `author_id` (uuid, references profiles)
  - `category` (text)
  - `image_url` (text)
  - `published` (boolean)
  - `published_at` (timestamptz)
  - `created_at` (timestamptz)

  ### `formations`
  - `id` (uuid, primary key)
  - `title` (text, not null)
  - `description` (text)
  - `provider` (text)
  - `duration` (text)
  - `level` (text)
  - `category` (text)
  - `price` (numeric)
  - `image_url` (text)
  - `status` (text) - 'active', 'archived'
  - `created_at` (timestamptz)

  ## 2. Security
  - Enable RLS on all tables
  - Add policies for authenticated users
  - Protect sensitive data

  ## 3. Indexes
  - Performance indexes on foreign keys and frequently queried columns
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  user_type text NOT NULL CHECK (user_type IN ('candidate', 'recruiter')),
  avatar_url text,
  phone text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  logo_url text,
  website text,
  industry text,
  size text,
  location text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  location text,
  contract_type text,
  salary_min numeric,
  salary_max numeric,
  status text DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'published', 'closed')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create candidate_profiles table
CREATE TABLE IF NOT EXISTS candidate_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text,
  bio text,
  experience_years integer DEFAULT 0,
  skills text[] DEFAULT '{}',
  education jsonb DEFAULT '[]'::jsonb,
  work_experience jsonb DEFAULT '[]'::jsonb,
  cv_url text,
  visibility text DEFAULT 'private' NOT NULL CHECK (visibility IN ('public', 'private', 'premium')),
  profile_price numeric DEFAULT 0,
  last_active_at timestamptz DEFAULT now(),
  location text,
  full_name text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  candidate_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'interview', 'rejected', 'accepted')),
  cover_letter text,
  applied_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text,
  content text,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  category text,
  image_url text,
  published boolean DEFAULT false NOT NULL,
  published_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create formations table
CREATE TABLE IF NOT EXISTS formations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  provider text,
  duration text,
  level text,
  category text,
  price numeric DEFAULT 0,
  image_url text,
  status text DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'archived')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_companies_profile ON companies(profile_id);
CREATE INDEX IF NOT EXISTS idx_jobs_user ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_user ON candidate_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_visibility ON candidate_profiles(visibility);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_formations_status ON formations(status);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE formations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for companies
CREATE POLICY "Companies are viewable by everyone"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Recruiters can insert own companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Recruiters can update own companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- RLS Policies for jobs
CREATE POLICY "Published jobs are viewable by everyone"
  ON jobs FOR SELECT
  TO authenticated
  USING (status = 'published' OR auth.uid() = user_id);

CREATE POLICY "Recruiters can insert jobs"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Recruiters can update own jobs"
  ON jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Recruiters can delete own jobs"
  ON jobs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for candidate_profiles
CREATE POLICY "Public candidate profiles are viewable by everyone"
  ON candidate_profiles FOR SELECT
  TO authenticated
  USING (visibility = 'public' OR auth.uid() = user_id);

CREATE POLICY "Candidates can insert own profile"
  ON candidate_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Candidates can update own profile"
  ON candidate_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for applications
CREATE POLICY "Users can view applications they are involved in"
  ON applications FOR SELECT
  TO authenticated
  USING (
    auth.uid() = candidate_id OR
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
      AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Candidates can insert own applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Recruiters can update applications for their jobs"
  ON applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
      AND jobs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
      AND jobs.user_id = auth.uid()
    )
  );

-- RLS Policies for blog_posts
CREATE POLICY "Published blog posts are viewable by everyone"
  ON blog_posts FOR SELECT
  TO authenticated
  USING (published = true);

CREATE POLICY "Authors can manage own blog posts"
  ON blog_posts FOR ALL
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- RLS Policies for formations
CREATE POLICY "Active formations are viewable by everyone"
  ON formations FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'candidate')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION create_profile_on_signup();
  END IF;
END $$;