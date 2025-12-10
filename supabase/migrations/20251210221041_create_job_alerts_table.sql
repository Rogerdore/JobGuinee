/*
  # Create Job Alerts Tables

  1. New Tables
    - `job_alerts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `title` (text) - Alert name
      - `keywords` (array) - Keywords to match
      - `sectors` (array) - Job sectors
      - `locations` (array) - Locations
      - `experience_level` (array) - Experience levels
      - `contract_types` (array) - Contract types
      - `salary_min` (numeric) - Minimum salary
      - `salary_max` (numeric) - Maximum salary
      - `is_active` (boolean)
      - `notify_email` (boolean)
      - `matched_jobs_count` (integer)
      - `last_check_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for user access
*/

CREATE TABLE IF NOT EXISTS job_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  keywords text[] DEFAULT '{}'::text[],
  sectors text[] DEFAULT '{}'::text[],
  locations text[] DEFAULT '{}'::text[],
  experience_level text[] DEFAULT '{}'::text[],
  contract_types text[] DEFAULT '{}'::text[],
  salary_min numeric,
  salary_max numeric,
  is_active boolean NOT NULL DEFAULT true,
  notify_email boolean NOT NULL DEFAULT true,
  matched_jobs_count integer NOT NULL DEFAULT 0,
  last_check_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE job_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
  ON job_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create alerts"
  ON job_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON job_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
  ON job_alerts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_job_alerts_user_id ON job_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_job_alerts_is_active ON job_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_job_alerts_created_at ON job_alerts(created_at DESC);