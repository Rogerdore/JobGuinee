/*
  # Add Admin Access to Jobs Table

  1. Changes
    - Add new RLS policy allowing admins to view all jobs (including drafts)
    - This enables the admin jobs management page to display pending jobs
  
  2. Security
    - Policy checks that user_type = 'admin' in profiles table
    - Only affects SELECT operations
    - Admins can now see jobs in all statuses (draft, published, closed)
*/

-- Drop the existing SELECT policy and recreate it with admin access
DROP POLICY IF EXISTS "Published jobs are viewable by everyone" ON jobs;

-- Create new comprehensive SELECT policy with admin access
CREATE POLICY "Jobs are viewable based on role and status"
  ON jobs
  FOR SELECT
  TO authenticated
  USING (
    -- Published jobs are visible to everyone
    status = 'published'
    OR
    -- Recruiters can see their own jobs (via recruiter_id)
    recruiter_id = auth.uid()
    OR
    -- Company owners can see their company's jobs
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = jobs.company_id
      AND companies.profile_id = auth.uid()
    )
    OR
    -- Admins can see ALL jobs (including drafts)
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Also add policy for anonymous users to see published jobs
CREATE POLICY "Published jobs viewable by anonymous"
  ON jobs
  FOR SELECT
  TO anon
  USING (status = 'published');