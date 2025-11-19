/*
  # Simplify Jobs UPDATE Policy for Debugging

  1. Problem
    - Complex UPDATE policy causes "op ANY/ALL (array) requires operator to yield boolean" error
    - Need to simplify to identify the exact clause causing issues
  
  2. Solution
    - Create a much simpler policy that prioritizes admins
    - Remove complex nested conditions temporarily
    - Test if basic admin access works
  
  3. Note
    - This is a diagnostic migration
    - Will refine once we identify the issue
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Jobs can be updated by owners and admins" ON jobs;

-- Create simplified policy with admin first
CREATE POLICY "Jobs can be updated by owners and admins"
  ON jobs
  FOR UPDATE
  TO authenticated
  USING (
    -- Admins can update ALL jobs
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
    OR
    -- Recruiters can update their own jobs
    recruiter_id = auth.uid()
    OR
    -- Company owners can update their company's jobs
    EXISTS (
      SELECT 1 FROM companies
      WHERE id = company_id
      AND profile_id = auth.uid()
    )
  )
  WITH CHECK (
    -- For admins: allow any update
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
    OR
    -- For others: must still own the job
    (
      recruiter_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM companies
        WHERE id = company_id
        AND profile_id = auth.uid()
      )
    )
  );