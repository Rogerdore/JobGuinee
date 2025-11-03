/*
  # Fix Database Security and Performance Issues

  ## 1. Add Missing Indexes on Foreign Keys
    - Adds indexes for all unindexed foreign keys
    - Improves join performance and foreign key constraint checking

  ## 2. Optimize RLS Policies  
    - Replace auth.uid() with (select auth.uid()) to prevent re-evaluation
    - Improves query performance at scale

  ## 3. Fix Function Security
    - Add explicit search_path to all functions
    - Prevents search path manipulation attacks

  ## 4. Remove Duplicate Policies
    - Consolidate duplicate SELECT policies

  ## Security Impact
    - All changes maintain existing security controls
    - Performance improvements do not reduce security
    - RLS policies remain properly restrictive
*/

-- ============================================
-- 1. ADD MISSING INDEXES ON FOREIGN KEYS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_application_notes_recruiter 
  ON public.application_notes(recruiter_id);

CREATE INDEX IF NOT EXISTS idx_application_timeline_user 
  ON public.application_timeline(user_id);

CREATE INDEX IF NOT EXISTS idx_blog_posts_author 
  ON public.blog_posts(author_id);

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_profile 
  ON public.candidate_profiles(profile_id);

CREATE INDEX IF NOT EXISTS idx_job_views_user 
  ON public.job_views(user_id);

CREATE INDEX IF NOT EXISTS idx_jobs_hiring_manager 
  ON public.jobs(hiring_manager_id);

CREATE INDEX IF NOT EXISTS idx_recruiter_messages_sender 
  ON public.recruiter_messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_recruitment_analytics_job 
  ON public.recruitment_analytics(job_id);

-- ============================================
-- 2. OPTIMIZE RLS POLICIES - NOTIFICATIONS
-- ============================================

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================
-- 3. OPTIMIZE RLS POLICIES - NOTIFICATION PREFERENCES
-- ============================================

DROP POLICY IF EXISTS "Users can view own preferences" ON public.notification_preferences;
CREATE POLICY "Users can view own preferences"
  ON public.notification_preferences FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.notification_preferences;
CREATE POLICY "Users can insert own preferences"
  ON public.notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own preferences" ON public.notification_preferences;
CREATE POLICY "Users can update own preferences"
  ON public.notification_preferences FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================
-- 4. OPTIMIZE RLS POLICIES - PROFILES
-- ============================================

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- ============================================
-- 5. OPTIMIZE RLS POLICIES - COMPANIES
-- ============================================

DROP POLICY IF EXISTS "Recruiters can insert own companies" ON public.companies;
CREATE POLICY "Recruiters can insert own companies"
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND user_type = 'recruiter'
    )
  );

DROP POLICY IF EXISTS "Recruiters can update own companies" ON public.companies;
CREATE POLICY "Recruiters can update own companies"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (profile_id = (select auth.uid()))
  WITH CHECK (profile_id = (select auth.uid()));

-- ============================================
-- 6. OPTIMIZE RLS POLICIES - CANDIDATE PROFILES
-- ============================================

DROP POLICY IF EXISTS "Candidates can insert own profile" ON public.candidate_profiles;
CREATE POLICY "Candidates can insert own profile"
  ON public.candidate_profiles FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = (select auth.uid()));

DROP POLICY IF EXISTS "Candidates can update own profile" ON public.candidate_profiles;
CREATE POLICY "Candidates can update own profile"
  ON public.candidate_profiles FOR UPDATE
  TO authenticated
  USING (profile_id = (select auth.uid()))
  WITH CHECK (profile_id = (select auth.uid()));

DROP POLICY IF EXISTS "Public candidate profiles are viewable by everyone" ON public.candidate_profiles;
CREATE POLICY "Public candidate profiles are viewable by everyone"
  ON public.candidate_profiles FOR SELECT
  TO authenticated
  USING (
    visibility = 'public' OR
    profile_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND user_type = 'recruiter'
    )
  );

-- ============================================
-- 7. OPTIMIZE RLS POLICIES - BLOG POSTS
-- ============================================

DROP POLICY IF EXISTS "Authors can manage own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Published blog posts are viewable by everyone" ON public.blog_posts;

CREATE POLICY "Authors can manage own blog posts"
  ON public.blog_posts
  TO authenticated
  USING (author_id = (select auth.uid()));

CREATE POLICY "Published blog posts viewable"
  ON public.blog_posts FOR SELECT
  TO authenticated
  USING (published = true OR author_id = (select auth.uid()));

-- ============================================
-- 8. OPTIMIZE RLS POLICIES - JOBS
-- ============================================

DROP POLICY IF EXISTS "Published jobs are viewable by everyone" ON public.jobs;
CREATE POLICY "Published jobs are viewable by everyone"
  ON public.jobs FOR SELECT
  USING (
    status = 'published' OR
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = jobs.company_id 
      AND companies.profile_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Recruiters can insert jobs" ON public.jobs;
CREATE POLICY "Recruiters can insert jobs"
  ON public.jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = company_id 
      AND companies.profile_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Recruiters can update own jobs" ON public.jobs;
CREATE POLICY "Recruiters can update own jobs"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = company_id 
      AND companies.profile_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = company_id 
      AND companies.profile_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Recruiters can delete own jobs" ON public.jobs;
CREATE POLICY "Recruiters can delete own jobs"
  ON public.jobs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = company_id 
      AND companies.profile_id = (select auth.uid())
    )
  );

-- ============================================
-- 9. OPTIMIZE RLS POLICIES - SAVED JOBS
-- ============================================

DROP POLICY IF EXISTS "Users can view own saved jobs" ON public.saved_jobs;
CREATE POLICY "Users can view own saved jobs"
  ON public.saved_jobs FOR SELECT
  TO authenticated
  USING (candidate_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can save jobs" ON public.saved_jobs;
CREATE POLICY "Users can save jobs"
  ON public.saved_jobs FOR INSERT
  TO authenticated
  WITH CHECK (candidate_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can unsave jobs" ON public.saved_jobs;
CREATE POLICY "Users can unsave jobs"
  ON public.saved_jobs FOR DELETE
  TO authenticated
  USING (candidate_id = (select auth.uid()));

-- ============================================
-- 10. OPTIMIZE RLS POLICIES - JOB VIEWS
-- ============================================

DROP POLICY IF EXISTS "Job owners can view their job analytics" ON public.job_views;
CREATE POLICY "Job owners can view their job analytics"
  ON public.job_views FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      JOIN companies ON jobs.company_id = companies.id
      WHERE jobs.id = job_id 
      AND companies.profile_id = (select auth.uid())
    )
  );

-- ============================================
-- 11. OPTIMIZE RLS POLICIES - APPLICATIONS
-- ============================================

DROP POLICY IF EXISTS "Candidates can insert own applications" ON public.applications;
CREATE POLICY "Candidates can insert own applications"
  ON public.applications FOR INSERT
  TO authenticated
  WITH CHECK (candidate_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view applications they are involved in" ON public.applications;
CREATE POLICY "Users can view applications they are involved in"
  ON public.applications FOR SELECT
  TO authenticated
  USING (
    candidate_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM jobs 
      JOIN companies ON jobs.company_id = companies.id
      WHERE jobs.id = job_id 
      AND companies.profile_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Recruiters can update applications for their jobs" ON public.applications;
CREATE POLICY "Recruiters can update applications for their jobs"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      JOIN companies ON jobs.company_id = companies.id
      WHERE jobs.id = job_id 
      AND companies.profile_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs 
      JOIN companies ON jobs.company_id = companies.id
      WHERE jobs.id = job_id 
      AND companies.profile_id = (select auth.uid())
    )
  );

-- ============================================
-- 12. OPTIMIZE RLS POLICIES - WORKFLOW STAGES
-- ============================================

DROP POLICY IF EXISTS "Companies can manage their workflow stages" ON public.workflow_stages;
CREATE POLICY "Companies can manage their workflow stages"
  ON public.workflow_stages
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = company_id 
      AND companies.profile_id = (select auth.uid())
    )
  );

-- ============================================
-- 13. OPTIMIZE RLS POLICIES - APPLICATION NOTES
-- ============================================

DROP POLICY IF EXISTS "Recruiters can create notes" ON public.application_notes;
CREATE POLICY "Recruiters can create notes"
  ON public.application_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    recruiter_id = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE a.id = application_id 
      AND c.profile_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Recruiters can view notes for their company applications" ON public.application_notes;
CREATE POLICY "Recruiters can view notes for their company applications"
  ON public.application_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE a.id = application_id 
      AND c.profile_id = (select auth.uid())
    )
  );

-- ============================================
-- 14. OPTIMIZE RLS POLICIES - APPLICATION TIMELINE
-- ============================================

DROP POLICY IF EXISTS "Recruiters and candidates can view timeline" ON public.application_timeline;
CREATE POLICY "Recruiters and candidates can view timeline"
  ON public.application_timeline FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = application_id 
      AND (
        a.candidate_id = (select auth.uid()) OR
        EXISTS (
          SELECT 1 FROM jobs j
          JOIN companies c ON j.company_id = c.id
          WHERE j.id = a.job_id 
          AND c.profile_id = (select auth.uid())
        )
      )
    )
  );

-- ============================================
-- 15. OPTIMIZE RLS POLICIES - RECRUITER MESSAGES
-- ============================================

DROP POLICY IF EXISTS "Users can view their messages" ON public.recruiter_messages;
CREATE POLICY "Users can view their messages"
  ON public.recruiter_messages FOR SELECT
  TO authenticated
  USING (
    sender_id = (select auth.uid()) OR 
    recipient_id = (select auth.uid())
  );

DROP POLICY IF EXISTS "Users can send messages" ON public.recruiter_messages;
CREATE POLICY "Users can send messages"
  ON public.recruiter_messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their received messages" ON public.recruiter_messages;
CREATE POLICY "Users can update their received messages"
  ON public.recruiter_messages FOR UPDATE
  TO authenticated
  USING (recipient_id = (select auth.uid()))
  WITH CHECK (recipient_id = (select auth.uid()));

-- ============================================
-- 16. OPTIMIZE RLS POLICIES - RECRUITMENT ANALYTICS
-- ============================================

DROP POLICY IF EXISTS "Companies can view their analytics" ON public.recruitment_analytics;
CREATE POLICY "Companies can view their analytics"
  ON public.recruitment_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = company_id 
      AND companies.profile_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "System can insert analytics" ON public.recruitment_analytics;
CREATE POLICY "System can insert analytics"
  ON public.recruitment_analytics FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.id = company_id 
      AND companies.profile_id = (select auth.uid())
    )
  );

-- ============================================
-- 17. FIX FUNCTION SEARCH PATHS
-- ============================================

CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = auth.uid() AND read = false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE notifications
  SET read = true, updated_at = now()
  WHERE user_id = auth.uid() AND read = false;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_job_view_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE jobs
  SET views_count = views_count + 1
  WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_job_applications_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE jobs
    SET applications_count = applications_count + 1
    WHERE id = NEW.job_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE jobs
    SET applications_count = GREATEST(applications_count - 1, 0)
    WHERE id = OLD.job_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_newsletter_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;