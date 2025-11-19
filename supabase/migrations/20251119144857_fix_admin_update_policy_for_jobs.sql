/*
  # Fix Admin Update Policy for Jobs

  1. Problem
    - Admins cannot update jobs because WITH CHECK clause requires recruiter_id = auth.uid()
    - This prevents admins from approving/rejecting jobs created by recruiters
  
  2. Solution
    - Modify WITH CHECK to allow admins to update without recruiter_id restriction
    - Keep USING clause as is (controls which rows can be selected for update)
    - WITH CHECK should only validate data integrity, not ownership for admins
  
  3. Security
    - Admins verified via profiles.user_type = 'admin'
    - Recruiters still restricted to their own jobs
    - Data integrity maintained
*/

-- Drop and recreate UPDATE policy with proper admin support
DROP POLICY IF EXISTS "Jobs can be updated by owners and admins" ON jobs;

CREATE POLICY "Jobs can be updated by owners and admins"
  ON jobs
  FOR UPDATE
  TO authenticated
  USING (
    -- Who can select a row for update?
    -- Recruiters can select their own jobs (via recruiter_id)
    recruiter_id = auth.uid()
    OR
    -- Company owners can select their company's jobs
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = jobs.company_id
      AND companies.profile_id = auth.uid()
    )
    OR
    -- Admins can select ALL jobs
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  )
  WITH CHECK (
    -- What data is valid after update?
    -- For admins: any update is allowed (no ownership check)
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
    OR
    -- For recruiters: must still own the job after update
    (
      recruiter_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM companies
        WHERE companies.id = jobs.company_id
        AND companies.profile_id = auth.uid()
      )
    )
  );