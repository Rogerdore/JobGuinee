/*
  # Create Advanced ATS Workflow System

  ## Overview
  This migration creates a complete ATS (Applicant Tracking System) for recruiters
  including workflow stages, AI scoring, messaging, and analytics.

  ## New Tables Created:
  
  1. **workflow_stages** - Custom recruitment workflow stages per company
  2. **application_notes** - Recruiter notes on applications
  3. **application_timeline** - Complete history of application status changes
  4. **recruiter_messages** - Direct messaging between recruiters and candidates
  5. **recruitment_analytics** - Daily analytics snapshots

  ## Updates to Existing Tables:
  
  - Add AI scoring and categorization fields to applications
  - Add workflow and collaboration fields to jobs

  ## Security
  - All tables have Row Level Security enabled
  - Appropriate policies for recruiters, candidates, and admins
*/

-- Add new fields to applications table for ATS workflow
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'applications' AND column_name = 'ai_score'
  ) THEN
    ALTER TABLE applications ADD COLUMN ai_score integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'applications' AND column_name = 'ai_category'
  ) THEN
    ALTER TABLE applications ADD COLUMN ai_category text DEFAULT 'medium';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'applications' AND column_name = 'workflow_stage'
  ) THEN
    ALTER TABLE applications ADD COLUMN workflow_stage text DEFAULT 'received';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'applications' AND column_name = 'cv_url'
  ) THEN
    ALTER TABLE applications ADD COLUMN cv_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'applications' AND column_name = 'recruiter_notes'
  ) THEN
    ALTER TABLE applications ADD COLUMN recruiter_notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'applications' AND column_name = 'ai_match_explanation'
  ) THEN
    ALTER TABLE applications ADD COLUMN ai_match_explanation text;
  END IF;
END $$;

-- Add department and workflow fields to jobs
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
    WHERE table_name = 'jobs' AND column_name = 'ai_generated'
  ) THEN
    ALTER TABLE jobs ADD COLUMN ai_generated boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'hiring_manager_id'
  ) THEN
    ALTER TABLE jobs ADD COLUMN hiring_manager_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create workflow_stages table for custom recruitment workflows
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

-- Create application_notes table for recruiter notes
CREATE TABLE IF NOT EXISTS application_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  recruiter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  note_text text NOT NULL,
  is_private boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create application_timeline for tracking all changes
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

-- Create recruiter_messages table for direct communication
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

-- Create recruitment_analytics table for daily metrics
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_stages_company ON workflow_stages(company_id);
CREATE INDEX IF NOT EXISTS idx_application_notes_application ON application_notes(application_id);
CREATE INDEX IF NOT EXISTS idx_application_timeline_application ON application_timeline(application_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_messages_application ON recruiter_messages(application_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_messages_unread ON recruiter_messages(recipient_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_recruitment_analytics_company ON recruitment_analytics(company_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_applications_ai_category ON applications(ai_category);
CREATE INDEX IF NOT EXISTS idx_applications_workflow_stage ON applications(workflow_stage);

-- Enable RLS on all new tables
ALTER TABLE workflow_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflow_stages
CREATE POLICY "Companies can manage their workflow stages"
  ON workflow_stages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      JOIN profiles ON profiles.id = companies.profile_id
      WHERE companies.id = workflow_stages.company_id
      AND profiles.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      JOIN profiles ON profiles.id = companies.profile_id
      WHERE companies.id = workflow_stages.company_id
      AND profiles.id = auth.uid()
    )
  );

-- RLS Policies for application_notes
CREATE POLICY "Recruiters can view notes for their company applications"
  ON application_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      JOIN jobs ON jobs.id = applications.job_id
      JOIN companies ON companies.id = jobs.company_id
      JOIN profiles ON profiles.id = companies.profile_id
      WHERE applications.id = application_notes.application_id
      AND profiles.id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can create notes"
  ON application_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      JOIN jobs ON jobs.id = applications.job_id
      JOIN companies ON companies.id = jobs.company_id
      JOIN profiles ON profiles.id = companies.profile_id
      WHERE applications.id = application_notes.application_id
      AND profiles.id = auth.uid()
    )
    AND auth.uid() = recruiter_id
  );

-- RLS Policies for application_timeline
CREATE POLICY "Recruiters and candidates can view timeline"
  ON application_timeline FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_timeline.application_id
      AND (
        applications.candidate_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM jobs
          JOIN companies ON companies.id = jobs.company_id
          JOIN profiles ON profiles.id = companies.profile_id
          WHERE jobs.id = applications.job_id
          AND profiles.id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "System can insert timeline events"
  ON application_timeline FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for recruiter_messages
CREATE POLICY "Users can view their messages"
  ON recruiter_messages FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid() OR recipient_id = auth.uid()
  );

CREATE POLICY "Users can send messages"
  ON recruiter_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = recruiter_messages.application_id
      AND (
        applications.candidate_id = auth.uid()
        OR applications.candidate_id = recipient_id
        OR EXISTS (
          SELECT 1 FROM jobs
          JOIN companies ON companies.id = jobs.company_id
          JOIN profiles ON profiles.id = companies.profile_id
          WHERE jobs.id = applications.job_id
          AND profiles.id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update their received messages"
  ON recruiter_messages FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- RLS Policies for recruitment_analytics
CREATE POLICY "Companies can view their analytics"
  ON recruitment_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      JOIN profiles ON profiles.id = companies.profile_id
      WHERE companies.id = recruitment_analytics.company_id
      AND profiles.id = auth.uid()
    )
  );

CREATE POLICY "System can insert analytics"
  ON recruitment_analytics FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      JOIN profiles ON profiles.id = companies.profile_id
      WHERE companies.id = recruitment_analytics.company_id
      AND profiles.id = auth.uid()
    )
  );

-- Function to automatically create default workflow stages for new companies
CREATE OR REPLACE FUNCTION create_default_workflow_stages()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO workflow_stages (company_id, stage_name, stage_order, stage_color, is_default) VALUES
    (NEW.id, 'Candidature reçue', 1, '#3B82F6', true),
    (NEW.id, 'En évaluation', 2, '#F59E0B', true),
    (NEW.id, 'Entretien planifié', 3, '#8B5CF6', true),
    (NEW.id, 'Offre envoyée', 4, '#10B981', true),
    (NEW.id, 'Acceptée', 5, '#059669', true),
    (NEW.id, 'Refusée', 6, '#EF4444', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default workflow stages
DROP TRIGGER IF EXISTS on_company_created ON companies;
CREATE TRIGGER on_company_created
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION create_default_workflow_stages();

-- Function to log application status changes
CREATE OR REPLACE FUNCTION log_application_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO application_timeline (application_id, event_type, event_description, old_value, new_value, user_id)
      VALUES (
        NEW.id,
        'status_change',
        'Statut de candidature modifié',
        OLD.status,
        NEW.status,
        auth.uid()
      );
    END IF;

    IF OLD.workflow_stage IS DISTINCT FROM NEW.workflow_stage THEN
      INSERT INTO application_timeline (application_id, event_type, event_description, old_value, new_value, user_id)
      VALUES (
        NEW.id,
        'stage_change',
        'Étape de recrutement modifiée',
        OLD.workflow_stage,
        NEW.workflow_stage,
        auth.uid()
      );
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO application_timeline (application_id, event_type, event_description, user_id)
    VALUES (
      NEW.id,
      'application_created',
      'Nouvelle candidature reçue',
      NEW.candidate_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for application timeline
DROP TRIGGER IF EXISTS on_application_change ON applications;
CREATE TRIGGER on_application_change
  AFTER INSERT OR UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION log_application_change();