/*
  # Fix Jobs RLS Policy for Recruiter Access

  ## Changes
    - Updates the SELECT policy on jobs table to allow recruiters to view their own jobs
    - Adds check for recruiter_id in addition to company ownership
    - Maintains existing security for published jobs being publicly viewable

  ## Security
    - Recruiters can view:
      1. All published jobs (public)
      2. Jobs they created (via recruiter_id)
      3. Jobs from companies they manage (via company_id)
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Published jobs are viewable by everyone" ON public.jobs;

-- Create updated policy with recruiter_id check
CREATE POLICY "Published jobs are viewable by everyone"
  ON public.jobs FOR SELECT
  USING (
    status = 'published' OR
    recruiter_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = jobs.company_id 
      AND companies.profile_id = (select auth.uid())
    )
  );

-- Update the UPDATE policy to also check recruiter_id
DROP POLICY IF EXISTS "Recruiters can update own jobs" ON public.jobs;
CREATE POLICY "Recruiters can update own jobs"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (
    recruiter_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = company_id 
      AND companies.profile_id = (select auth.uid())
    )
  )
  WITH CHECK (
    recruiter_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = company_id 
      AND companies.profile_id = (select auth.uid())
    )
  );

-- Update the DELETE policy to also check recruiter_id
DROP POLICY IF EXISTS "Recruiters can delete own jobs" ON public.jobs;
CREATE POLICY "Recruiters can delete own jobs"
  ON public.jobs FOR DELETE
  TO authenticated
  USING (
    recruiter_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = company_id 
      AND companies.profile_id = (select auth.uid())
    )
  );