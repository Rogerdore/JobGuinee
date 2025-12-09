/*
  ============================================================================
  JOBGUINÉE - CONSOLIDATED DATABASE MIGRATION
  ============================================================================

  This consolidated migration file applies all necessary schema changes
  to the JobGuinée database.

  IMPORTANT: The initial schema (profiles, companies, jobs, candidate_profiles,
  applications, blog_posts, formations) has already been applied.

  This migration adds:
  - Extended columns to existing tables
  - New tables for features (notifications, ATS, CVthèque, premium services, etc.)
  - RLS policies for all tables
  - Indexes for performance
  - Functions and triggers
  - Default data

  All operations use IF NOT EXISTS / IF EXISTS to make this migration idempotent.

  Date: 2025-12-09
  ============================================================================
*/

-- ============================================================================
-- SECTION 1: EXTEND EXISTING TABLES
-- ============================================================================

-- ============================================================================
-- 1.1 Extend profiles table
-- ============================================================================
DO $$
BEGIN
  -- Add admin user type to constraint
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;
  ALTER TABLE profiles ADD CONSTRAINT profiles_user_type_check
    CHECK (user_type IN ('candidate', 'recruiter', 'admin', 'trainer'));

  -- Add credits balance column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'credits_balance'
  ) THEN
    ALTER TABLE profiles ADD COLUMN credits_balance INTEGER DEFAULT 100;
  END IF;

  -- Add profile completion percentage
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_completion_percentage'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_completion_percentage INTEGER DEFAULT 0 CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_credits_balance ON profiles(credits_balance);

-- ============================================================================
-- 1.2 Extend companies table
-- ============================================================================
DO $$
BEGIN
  -- Add subscription fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE companies ADD COLUMN subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'enterprise'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'subscription_start_date'
  ) THEN
    ALTER TABLE companies ADD COLUMN subscription_start_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'subscription_end_date'
  ) THEN
    ALTER TABLE companies ADD COLUMN subscription_end_date timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_companies_subscription_tier ON companies(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_companies_profile_id ON companies(profile_id);

-- ============================================================================
-- 1.3 Extend jobs table
-- ============================================================================
DO $$
BEGIN
  -- Add department and AI fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'department') THEN
    ALTER TABLE jobs ADD COLUMN department text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'experience_level') THEN
    ALTER TABLE jobs ADD COLUMN experience_level text DEFAULT 'Intermediaire';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'missions') THEN
    ALTER TABLE jobs ADD COLUMN missions text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'required_profile') THEN
    ALTER TABLE jobs ADD COLUMN required_profile text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'required_skills') THEN
    ALTER TABLE jobs ADD COLUMN required_skills text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'ai_generated') THEN
    ALTER TABLE jobs ADD COLUMN ai_generated boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'hiring_manager_id') THEN
    ALTER TABLE jobs ADD COLUMN hiring_manager_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- Add advanced features fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'sector') THEN
    ALTER TABLE jobs ADD COLUMN sector text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'education_level') THEN
    ALTER TABLE jobs ADD COLUMN education_level text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'views_count') THEN
    ALTER TABLE jobs ADD COLUMN views_count integer DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'applications_count') THEN
    ALTER TABLE jobs ADD COLUMN applications_count integer DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'is_featured') THEN
    ALTER TABLE jobs ADD COLUMN is_featured boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'is_urgent') THEN
    ALTER TABLE jobs ADD COLUMN is_urgent boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'requirements') THEN
    ALTER TABLE jobs ADD COLUMN requirements text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'responsibilities') THEN
    ALTER TABLE jobs ADD COLUMN responsibilities text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'benefits') THEN
    ALTER TABLE jobs ADD COLUMN benefits text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'deadline') THEN
    ALTER TABLE jobs ADD COLUMN deadline timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'nationality_required') THEN
    ALTER TABLE jobs ADD COLUMN nationality_required text DEFAULT 'Any';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'languages') THEN
    ALTER TABLE jobs ADD COLUMN languages text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'keywords') THEN
    ALTER TABLE jobs ADD COLUMN keywords text[] DEFAULT '{}';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON jobs(status, created_at DESC) WHERE status = 'published';

-- ============================================================================
-- 1.4 Extend applications table
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'ai_category') THEN
    ALTER TABLE applications ADD COLUMN ai_category text DEFAULT 'medium';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'ai_analysis') THEN
    ALTER TABLE applications ADD COLUMN ai_analysis jsonb DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'workflow_stage') THEN
    ALTER TABLE applications ADD COLUMN workflow_stage text DEFAULT 'received';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'notes') THEN
    ALTER TABLE applications ADD COLUMN notes text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'cv_url') THEN
    ALTER TABLE applications ADD COLUMN cv_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'ai_score') THEN
    ALTER TABLE applications ADD COLUMN ai_score integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'recruiter_notes') THEN
    ALTER TABLE applications ADD COLUMN recruiter_notes text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'ai_match_explanation') THEN
    ALTER TABLE applications ADD COLUMN ai_match_explanation text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_applications_candidate_status ON applications(candidate_id, status);
CREATE INDEX IF NOT EXISTS idx_applications_job_status ON applications(job_id, status);

-- ============================================================================
-- 1.5 Extend candidate_profiles table
-- ============================================================================
DO $$
BEGIN
  -- Add salary fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidate_profiles' AND column_name = 'desired_salary_min') THEN
    ALTER TABLE candidate_profiles ADD COLUMN desired_salary_min numeric;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidate_profiles' AND column_name = 'desired_salary_max') THEN
    ALTER TABLE candidate_profiles ADD COLUMN desired_salary_max numeric;
  END IF;

  -- Add CVthèque fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidate_profiles' AND column_name = 'languages') THEN
    ALTER TABLE candidate_profiles ADD COLUMN languages text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidate_profiles' AND column_name = 'certifications') THEN
    ALTER TABLE candidate_profiles ADD COLUMN certifications jsonb DEFAULT '[]';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidate_profiles' AND column_name = 'preferred_contract_type') THEN
    ALTER TABLE candidate_profiles ADD COLUMN preferred_contract_type text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidate_profiles' AND column_name = 'mobility') THEN
    ALTER TABLE candidate_profiles ADD COLUMN mobility text DEFAULT 'Nationale';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidate_profiles' AND column_name = 'is_verified') THEN
    ALTER TABLE candidate_profiles ADD COLUMN is_verified boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidate_profiles' AND column_name = 'visibility') THEN
    ALTER TABLE candidate_profiles ADD COLUMN visibility text DEFAULT 'public';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidate_profiles' AND column_name = 'last_active_at') THEN
    ALTER TABLE candidate_profiles ADD COLUMN last_active_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidate_profiles' AND column_name = 'nationality') THEN
    ALTER TABLE candidate_profiles ADD COLUMN nationality text DEFAULT 'Guinéenne';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidate_profiles' AND column_name = 'profile_price') THEN
    ALTER TABLE candidate_profiles ADD COLUMN profile_price bigint DEFAULT 50000;
  END IF;

  -- Add Gold Profile fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidate_profiles' AND column_name = 'is_gold_member') THEN
    ALTER TABLE candidate_profiles
      ADD COLUMN is_gold_member boolean DEFAULT false,
      ADD COLUMN gold_member_since timestamptz,
      ADD COLUMN gold_member_expires_at timestamptz,
      ADD COLUMN visibility_boost integer DEFAULT 0,
      ADD COLUMN priority_ranking integer DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_is_gold ON candidate_profiles(is_gold_member);

-- ============================================================================
-- 1.6 Extend formations table
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'formations' AND column_name = 'organization_type') THEN
    ALTER TABLE formations ADD COLUMN organization_type text DEFAULT 'individual' CHECK (organization_type IN ('individual', 'company', 'institute'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'formations' AND column_name = 'trainer_id') THEN
    ALTER TABLE formations ADD COLUMN trainer_id uuid;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'formations' AND column_name = 'is_online') THEN
    ALTER TABLE formations ADD COLUMN is_online boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'formations' AND column_name = 'is_hybrid') THEN
    ALTER TABLE formations ADD COLUMN is_hybrid boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'formations' AND column_name = 'max_participants') THEN
    ALTER TABLE formations ADD COLUMN max_participants integer;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'formations' AND column_name = 'enrolled_count') THEN
    ALTER TABLE formations ADD COLUMN enrolled_count integer DEFAULT 0;
  END IF;
END $$;

-- ============================================================================
-- SECTION 2: CREATE NEW TABLES
-- ============================================================================

-- ============================================================================
-- 2.1 Notifications System
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read boolean DEFAULT false NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email_notifications boolean DEFAULT true NOT NULL,
  push_notifications boolean DEFAULT true NOT NULL,
  application_notifications boolean DEFAULT true NOT NULL,
  message_notifications boolean DEFAULT true NOT NULL,
  profile_view_notifications boolean DEFAULT true NOT NULL,
  job_alert_notifications boolean DEFAULT true NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================================
-- 2.2 ATS System Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  stage_name text NOT NULL,
  stage_order integer NOT NULL,
  stage_color text DEFAULT '#3B82F6',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(company_id, stage_name)
);

CREATE TABLE IF NOT EXISTS application_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  recruiter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  note_text text NOT NULL,
  is_private boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS application_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  event_description text NOT NULL,
  old_value text,
  new_value text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS recruiter_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message_text text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS recruitment_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  date date NOT NULL,
  total_views integer DEFAULT 0,
  total_applications integer DEFAULT 0,
  avg_ai_score numeric(5,2),
  avg_time_to_hire_days numeric(5,1),
  strong_profiles_count integer DEFAULT 0,
  medium_profiles_count integer DEFAULT 0,
  weak_profiles_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(company_id, job_id, date)
);

-- ============================================================================
-- 2.3 CVthèque / Talent Pool System
-- ============================================================================

CREATE TABLE IF NOT EXISTS talent_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  search_query text,
  filters jsonb DEFAULT '{}',
  results_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS favorite_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  candidate_id uuid REFERENCES candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  notes text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(recruiter_id, candidate_id)
);

CREATE TABLE IF NOT EXISTS candidate_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  candidate_id uuid REFERENCES candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'sent',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profile_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  verification_type text NOT NULL,
  is_verified boolean DEFAULT false,
  verified_at timestamptz,
  verified_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cv_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  candidate_id uuid REFERENCES candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  downloaded_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 2.4 Profile Cart and Purchases
-- ============================================================================

CREATE TABLE IF NOT EXISTS profile_cart (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  candidate_id uuid REFERENCES candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT profile_cart_user_or_session CHECK (
    (user_id IS NOT NULL AND session_id IS NULL) OR
    (user_id IS NULL AND session_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS profile_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  candidate_id uuid REFERENCES candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending',
  payment_method text,
  transaction_id text,
  purchased_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT profile_purchases_payment_status_check CHECK (
    payment_status IN ('pending', 'completed', 'failed', 'refunded')
  ),
  CONSTRAINT profile_purchases_unique_purchase UNIQUE (buyer_id, candidate_id)
);

-- ============================================================================
-- 2.5 Job Features
-- ============================================================================

CREATE TABLE IF NOT EXISTS saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  saved_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(candidate_id, job_id)
