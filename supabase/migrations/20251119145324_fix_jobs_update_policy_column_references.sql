/*
  # Fix Jobs UPDATE Policy Column References

  1. Problem
    - Column references in WITH CHECK were ambiguous
    - Using `company_id` instead of `jobs.company_id`
    - This causes PostgreSQL evaluation errors
  
  2. Solution
    - Fully qualify all column references with table names
    - Use `jobs.company_id` and `jobs.recruiter_id` explicitly
    - This eliminates any ambiguity in policy evaluation
  
  3. Security
    - Same logic, just corrected column references
    - Admins can update any job
    - Recruiters/company owners can only update their own jobs
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Jobs can be updated by owners and admins" ON jobs;

-- Create policy with properly qualified column names
CREATE POLICY "Jobs can be updated by owners and admins"
  ON jobs
  FOR UPDATE
  TO authenticated
  USING (
    -- Admins can select any job for update
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
    OR
    -- Recruiters can select their own jobs
    jobs.recruiter_id = auth.uid()
    OR
    -- Company owners can select their company's jobs  
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = jobs.company_id
      AND companies.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Admins: any update allowed (no ownership check after update)
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
    OR
    -- Recruiters: must still own the job after update
    jobs.recruiter_id = auth.uid()
    OR
    -- Company owners: job must still belong to their company after update
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = jobs.company_id
      AND companies.profile_id = auth.uid()
    )
  );