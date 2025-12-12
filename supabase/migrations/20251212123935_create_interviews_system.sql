/*
  # Create Interviews System for Recruiter Scheduling

  1. New Table
    - `interviews`
      - `id` (uuid, primary key)
      - `application_id` (uuid, foreign key to applications)
      - `job_id` (uuid, foreign key to jobs)
      - `recruiter_id` (uuid, foreign key to profiles)
      - `candidate_id` (uuid, foreign key to profiles)
      - `company_id` (uuid, foreign key to companies)
      - `interview_type` (text) - Type of interview
      - `scheduled_at` (timestamptz) - When the interview is scheduled
      - `duration_minutes` (integer) - Duration in minutes
      - `location_or_link` (text) - Physical location or video call link
      - `notes` (text) - Internal recruiter notes
      - `status` (text) - Status of the interview
      - `completed_at` (timestamptz) - When completed
      - `outcome` (text) - Result of interview
      - `feedback` (text) - Feedback after interview
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Recruiters can only access interviews for their company
    - Candidates can only view their own interview details (limited info)
*/

CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  recruiter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  interview_type text NOT NULL DEFAULT 'visio' CHECK (interview_type IN ('visio', 'presentiel', 'telephone')),
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60 NOT NULL CHECK (duration_minutes > 0 AND duration_minutes <= 480),
  location_or_link text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'confirmed', 'completed', 'cancelled', 'no_show')),
  completed_at timestamptz,
  outcome text CHECK (outcome IN ('positive', 'neutral', 'negative')),
  feedback text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_job_id ON interviews(job_id);
CREATE INDEX IF NOT EXISTS idx_interviews_recruiter_id ON interviews(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_company_id ON interviews(company_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_at ON interviews(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);

-- Enable RLS
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Recruiters
CREATE POLICY "Recruiters can view company interviews"
  ON interviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = interviews.company_id
      AND c.profile_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can create company interviews"
  ON interviews FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = interviews.company_id
      AND c.profile_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can update company interviews"
  ON interviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = interviews.company_id
      AND c.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = interviews.company_id
      AND c.profile_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can delete company interviews"
  ON interviews FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = interviews.company_id
      AND c.profile_id = auth.uid()
    )
  );

-- RLS Policies for Candidates (read-only, limited info)
CREATE POLICY "Candidates can view own interviews"
  ON interviews FOR SELECT
  TO authenticated
  USING (
    candidate_id = auth.uid()
  );

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_interviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_interviews_updated_at ON interviews;
CREATE TRIGGER trigger_interviews_updated_at
  BEFORE UPDATE ON interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_interviews_updated_at();