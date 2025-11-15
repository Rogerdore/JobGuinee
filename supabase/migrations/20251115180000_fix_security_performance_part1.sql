/*
  # Fix Security and Performance Issues - Part 1: Indexes

  1. Add missing indexes on foreign keys for optimal query performance
*/

-- Add missing foreign key indexes
CREATE INDEX IF NOT EXISTS idx_ai_cover_letters_job_id ON public.ai_cover_letters(job_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_documents_parent_document_id ON public.ai_generated_documents(parent_document_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_conversations_application_id ON public.conversations(application_id);
CREATE INDEX IF NOT EXISTS idx_conversations_job_id ON public.conversations(job_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_package_id ON public.credit_transactions(package_id);
CREATE INDEX IF NOT EXISTS idx_ia_shortlisting_results_application_id ON public.ia_shortlisting_results(application_id);
CREATE INDEX IF NOT EXISTS idx_job_alert_history_job_id ON public.job_alert_history(job_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_cart_candidate_id ON public.profile_cart(candidate_id);
CREATE INDEX IF NOT EXISTS idx_profile_purchases_candidate_id ON public.profile_purchases(candidate_id);
CREATE INDEX IF NOT EXISTS idx_recruitment_analytics_job_id ON public.recruitment_analytics(job_id);
CREATE INDEX IF NOT EXISTS idx_video_cvs_coach_id ON public.video_cvs(coach_id);
