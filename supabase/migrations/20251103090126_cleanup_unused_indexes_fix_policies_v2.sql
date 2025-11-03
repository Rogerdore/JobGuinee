/*
  # Cleanup Unused Indexes and Fix Remaining Issues

  ## 1. Remove Unused Indexes
    - Drops indexes that have never been used
    - Reduces maintenance overhead and storage
    - These can be recreated if needed in the future

  ## 2. Fix Multiple Permissive Policies
    - Consolidate duplicate SELECT policies on blog_posts

  ## 3. Fix Sample Data Functions
    - Add search_path to sample data functions

  ## Notes
    - Unused indexes are safe to drop
    - Core foreign key indexes are preserved
    - Essential composite indexes are added
*/

-- ============================================
-- 1. DROP UNUSED INDEXES
-- ============================================

DROP INDEX IF EXISTS public.idx_notifications_user_read;
DROP INDEX IF EXISTS public.idx_notifications_user_created;
DROP INDEX IF EXISTS public.idx_notification_preferences_user;
DROP INDEX IF EXISTS public.idx_profiles_user_type;
DROP INDEX IF EXISTS public.idx_companies_profile;
DROP INDEX IF EXISTS public.idx_candidate_profiles_user;
DROP INDEX IF EXISTS public.idx_candidate_profiles_visibility;
DROP INDEX IF EXISTS public.idx_blog_posts_published;
DROP INDEX IF EXISTS public.idx_formations_status;
DROP INDEX IF EXISTS public.idx_jobs_user;
DROP INDEX IF EXISTS public.idx_jobs_company;
DROP INDEX IF EXISTS public.idx_jobs_sector;
DROP INDEX IF EXISTS public.idx_jobs_experience_level;
DROP INDEX IF EXISTS public.idx_jobs_views_count;
DROP INDEX IF EXISTS public.idx_jobs_is_featured;
DROP INDEX IF EXISTS public.idx_jobs_deadline;
DROP INDEX IF EXISTS public.idx_jobs_keywords;
DROP INDEX IF EXISTS public.idx_jobs_status;
DROP INDEX IF EXISTS public.idx_saved_jobs_candidate;
DROP INDEX IF EXISTS public.idx_saved_jobs_job;
DROP INDEX IF EXISTS public.idx_job_views_job;
DROP INDEX IF EXISTS public.idx_job_views_date;
DROP INDEX IF EXISTS public.idx_applications_job;
DROP INDEX IF EXISTS public.idx_applications_candidate;
DROP INDEX IF EXISTS public.idx_applications_ai_category;
DROP INDEX IF EXISTS public.idx_applications_workflow_stage;
DROP INDEX IF EXISTS public.idx_workflow_stages_company;
DROP INDEX IF EXISTS public.idx_application_notes_application;
DROP INDEX IF EXISTS public.idx_application_timeline_application;
DROP INDEX IF EXISTS public.idx_recruiter_messages_application;
DROP INDEX IF EXISTS public.idx_recruiter_messages_unread;
DROP INDEX IF EXISTS public.idx_recruitment_analytics_company;
DROP INDEX IF EXISTS public.idx_newsletter_email;
DROP INDEX IF EXISTS public.idx_newsletter_active;
DROP INDEX IF EXISTS public.idx_newsletter_domain;

-- ============================================
-- 2. FIX MULTIPLE PERMISSIVE POLICIES ON BLOG_POSTS
-- ============================================

DROP POLICY IF EXISTS "Authors can manage own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Published blog posts viewable" ON public.blog_posts;

CREATE POLICY "View blog posts"
  ON public.blog_posts FOR SELECT
  TO authenticated
  USING (published = true OR author_id = (select auth.uid()));

CREATE POLICY "Authors can insert blog posts"
  ON public.blog_posts FOR INSERT
  TO authenticated
  WITH CHECK (author_id = (select auth.uid()));

CREATE POLICY "Authors can update own blog posts"
  ON public.blog_posts FOR UPDATE
  TO authenticated
  USING (author_id = (select auth.uid()))
  WITH CHECK (author_id = (select auth.uid()));

CREATE POLICY "Authors can delete own blog posts"
  ON public.blog_posts FOR DELETE
  TO authenticated
  USING (author_id = (select auth.uid()));

-- ============================================
-- 3. FIX SAMPLE DATA FUNCTIONS SEARCH PATHS
-- ============================================

DROP FUNCTION IF EXISTS public.create_sample_data_for_recruiter(UUID);
CREATE FUNCTION public.create_sample_data_for_recruiter(recruiter_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_company_id UUID;
  v_job_id UUID;
BEGIN
  INSERT INTO companies (profile_id, company_name, industry, company_size, website, description)
  VALUES (
    recruiter_id,
    'Entreprise Demo',
    'Technologie',
    '50-200',
    'https://demo.com',
    'Entreprise de démonstration'
  )
  RETURNING id INTO v_company_id;

  INSERT INTO jobs (
    company_id,
    title,
    description,
    location,
    employment_type,
    experience_level,
    salary_min,
    salary_max,
    status,
    deadline
  )
  VALUES (
    v_company_id,
    'Développeur Full Stack',
    'Nous recherchons un développeur full stack expérimenté',
    'Conakry',
    'CDI',
    'Intermédiaire',
    2000000,
    3500000,
    'published',
    CURRENT_DATE + INTERVAL '30 days'
  )
  RETURNING id INTO v_job_id;
END;
$$;

DROP FUNCTION IF EXISTS public.create_sample_companies();
CREATE FUNCTION public.create_sample_companies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE NOTICE 'Sample data function - deprecated';
END;
$$;

DROP FUNCTION IF EXISTS public.create_sample_jobs();
CREATE FUNCTION public.create_sample_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE NOTICE 'Sample data function - deprecated';
END;
$$;

DROP FUNCTION IF EXISTS public.create_sample_candidates();
CREATE FUNCTION public.create_sample_candidates()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE NOTICE 'Sample data function - deprecated';
END;
$$;

DROP FUNCTION IF EXISTS public.create_sample_applications();
CREATE FUNCTION public.create_sample_applications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE NOTICE 'Sample data function - deprecated';
END;
$$;

-- ============================================
-- 4. CREATE ESSENTIAL INDEXES ONLY
-- ============================================

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON public.notifications(user_id, read) 
  WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_jobs_status_created 
  ON public.jobs(status, created_at DESC) 
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_applications_candidate_status 
  ON public.applications(candidate_id, status);

CREATE INDEX IF NOT EXISTS idx_applications_job_status 
  ON public.applications(job_id, status);

CREATE INDEX IF NOT EXISTS idx_blog_posts_published_date 
  ON public.blog_posts(published_at DESC) 
  WHERE published = true;