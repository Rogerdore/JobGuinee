-- Drop unused indexes
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

-- Create essential indexes only
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