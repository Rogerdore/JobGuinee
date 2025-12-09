/*
  # Extend ATS System for Recruiter Dashboard

  ## Overview
  Add missing fields and tables to support full ATS functionality for recruiters.

  ## 1. Extensions to existing tables
    
    ### Extend `jobs` table
    - Add `department` field
    - Add `experience_level` field
    - Add `missions` field
    - Add `required_profile` field
    - Add `required_skills` array field
    - Add `ai_generated` boolean field

    ### Extend `applications` table  
    - Add `ai_category` field
    - Add `ai_analysis` jsonb field
    - Add `workflow_stage` field
    - Add `notes` field
    - Add `cv_url` field

  ## 2. New Tables
    
    ### `workflow_stages`
    - Custom workflow stages per job posting
    - Recruiter can define custom recruitment pipeline

    ### `recruiter_messages`
    - Direct messaging between recruiters and candidates
    - Linked to specific applications

    ### `premium_subscriptions`
    - Premium plans for recruiters
    - Feature access control

  ## 3. Security
    - All new tables have RLS enabled
    - Appropriate policies for recruiter and candidate access
*/

-- Extend jobs table with new fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'department'
  ) THEN
    ALTER TABLE jobs ADD COLUMN department text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'experience_level'
  ) THEN
    ALTER TABLE jobs ADD COLUMN experience_level text DEFAULT 'Intermediaire';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'missions'
  ) THEN
    ALTER TABLE jobs ADD COLUMN missions text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'required_profile'
  ) THEN
    ALTER TABLE jobs ADD COLUMN required_profile text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'required_skills'
  ) THEN
    ALTER TABLE jobs ADD COLUMN required_skills text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'ai_generated'
  ) THEN
    ALTER TABLE jobs ADD COLUMN ai_generated boolean DEFAULT false;
  END IF;
END $$;

-- Extend applications table with new fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'ai_category'
  ) THEN
    ALTER TABLE applications ADD COLUMN ai_category text DEFAULT 'medium';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'ai_analysis'
  ) THEN
    ALTER TABLE applications ADD COLUMN ai_analysis jsonb DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'workflow_stage'
  ) THEN
    ALTER TABLE applications ADD COLUMN workflow_stage text DEFAULT 'received';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'notes'
  ) THEN
    ALTER TABLE applications ADD COLUMN notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'cv_url'
  ) THEN
    ALTER TABLE applications ADD COLUMN cv_url text;
  END IF;
END $$;

-- Create workflow_stages table
CREATE TABLE IF NOT EXISTS workflow_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  order_index integer NOT NULL,
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now()
);

-- Create recruiter_messages table
CREATE TABLE IF NOT EXISTS recruiter_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create premium_subscriptions table
CREATE TABLE IF NOT EXISTS premium_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_type text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL,
  price bigint NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflow_stages_job ON workflow_stages(job_id);
CREATE INDEX IF NOT EXISTS idx_messages_application ON recruiter_messages(application_id, created_at);
CREATE INDEX IF NOT EXISTS idx_premium_sub_recruiter ON premium_subscriptions(recruiter_id, status);

-- Enable RLS
ALTER TABLE workflow_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflow_stages
CREATE POLICY "Recruiters can manage workflow stages for their jobs"
  ON workflow_stages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      JOIN companies ON jobs.company_id = companies.id
      WHERE jobs.id = workflow_stages.job_id
      AND companies.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs
      JOIN companies ON jobs.company_id = companies.id
      WHERE jobs.id = workflow_stages.job_id
      AND companies.profile_id = auth.uid()
    )
  );

-- RLS Policies for recruiter_messages
CREATE POLICY "Users can view messages they sent or received"
  ON recruiter_messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can insert messages"
  ON recruiter_messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update messages they received"
  ON recruiter_messages FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

-- RLS Policies for premium_subscriptions
CREATE POLICY "Recruiters can view own subscriptions"
  ON premium_subscriptions FOR SELECT
  TO authenticated
  USING (recruiter_id = auth.uid());

CREATE POLICY "Recruiters can insert own subscriptions"
  ON premium_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (recruiter_id = auth.uid());