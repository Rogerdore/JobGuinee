/*
  # Add Full Admin Access to Jobs Table

  1. Changes
    - Update UPDATE policy to allow admins to modify all jobs
    - Update DELETE policy to allow admins to delete all jobs
    - This enables admins to approve, reject, close, and reopen any job
  
  2. Security
    - Policies check that user_type = 'admin' in profiles table
    - Admins have full CRUD access to all jobs
    - Recruiters still only have access to their own jobs
*/

-- Drop and recreate UPDATE policy with admin access
DROP POLICY IF EXISTS "Recruiters can update own jobs" ON jobs;

CREATE POLICY "Jobs can be updated by owners and admins"
  ON jobs
  FOR UPDATE
  TO authenticated
  USING (
    -- Recruiters can update their own jobs (via recruiter_id)
    recruiter_id = auth.uid()
    OR
    -- Company owners can update their company's jobs
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = jobs.company_id
      AND companies.profile_id = auth.uid()
    )
    OR
    -- Admins can update ALL jobs
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  )
  WITH CHECK (
    -- Same conditions for the updated data
    recruiter_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = jobs.company_id
      AND companies.profile_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Drop and recreate DELETE policy with admin access
DROP POLICY IF EXISTS "Recruiters can delete own jobs" ON jobs;

CREATE POLICY "Jobs can be deleted by owners and admins"
  ON jobs
  FOR DELETE
  TO authenticated
  USING (
    -- Recruiters can delete their own jobs (via recruiter_id)
    recruiter_id = auth.uid()
    OR
    -- Company owners can delete their company's jobs
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = jobs.company_id
      AND companies.profile_id = auth.uid()
    )
    OR
    -- Admins can delete ALL jobs
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );