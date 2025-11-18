/*
  # Fix Remaining Indexes and Function Security

  ## Changes
    - Remove remaining unused indexes (Part 2)
    - Fix function search_path security issues
    - Improve overall database performance
*/

-- ============================================
-- REMOVE UNUSED INDEXES (PART 2)
-- ============================================

DROP INDEX IF EXISTS idx_job_form_config_key;
DROP INDEX IF EXISTS idx_job_form_config_active;
DROP INDEX IF EXISTS idx_formation_enrollments_status;
DROP INDEX IF EXISTS idx_application_notes_application_id;
DROP INDEX IF EXISTS idx_application_timeline_application_id;
DROP INDEX IF EXISTS idx_cms_media_uploaded_by;
DROP INDEX IF EXISTS idx_cms_navigation_page_id;
DROP INDEX IF EXISTS idx_cms_navigation_parent_id;
DROP INDEX IF EXISTS idx_cms_pages_author_id;
DROP INDEX IF EXISTS idx_companies_profile_id;
DROP INDEX IF EXISTS idx_job_views_job_id;
DROP INDEX IF EXISTS idx_coaching_bookings_user;
DROP INDEX IF EXISTS idx_coaching_bookings_date;
DROP INDEX IF EXISTS idx_coaching_bookings_status;
DROP INDEX IF EXISTS idx_trainer_applications_user;
DROP INDEX IF EXISTS idx_trainer_applications_status;
DROP INDEX IF EXISTS idx_trainer_profiles_profile_id;
DROP INDEX IF EXISTS idx_trainer_profiles_is_verified;
DROP INDEX IF EXISTS idx_resources_category;
DROP INDEX IF EXISTS idx_resources_published;
DROP INDEX IF EXISTS idx_resources_tags;
DROP INDEX IF EXISTS idx_formations_format;
DROP INDEX IF EXISTS idx_formations_start_date;
DROP INDEX IF EXISTS idx_trainer_profiles_company_email;
DROP INDEX IF EXISTS idx_trainer_profiles_institute_email;
DROP INDEX IF EXISTS idx_trainer_profiles_organization_type;
DROP INDEX IF EXISTS idx_api_keys_is_active;
DROP INDEX IF EXISTS idx_api_keys_created_by;
DROP INDEX IF EXISTS idx_job_alerts_active;
DROP INDEX IF EXISTS idx_candidate_profiles_availability;
DROP INDEX IF EXISTS idx_candidate_profiles_nationality;
DROP INDEX IF EXISTS idx_candidate_profiles_languages;
DROP INDEX IF EXISTS idx_jobs_visibility;
DROP INDEX IF EXISTS idx_jobs_is_premium;
DROP INDEX IF EXISTS idx_jobs_category;
DROP INDEX IF EXISTS idx_jobs_recruiter;
DROP INDEX IF EXISTS idx_chatbot_faqs_active;
DROP INDEX IF EXISTS idx_messages_conversation;
DROP INDEX IF EXISTS idx_messages_sender;
DROP INDEX IF EXISTS idx_messages_created;
DROP INDEX IF EXISTS idx_job_alerts_is_active;
DROP INDEX IF EXISTS idx_job_alerts_frequency;
DROP INDEX IF EXISTS idx_messages_is_read;
DROP INDEX IF EXISTS idx_conversations_participant_one;
DROP INDEX IF EXISTS idx_conversations_participant_two;
DROP INDEX IF EXISTS idx_conversations_last_message;
DROP INDEX IF EXISTS idx_conversation_participants_user;
DROP INDEX IF EXISTS idx_conversation_participants_conversation;
DROP INDEX IF EXISTS idx_candidate_documents_type;
DROP INDEX IF EXISTS idx_candidate_documents_primary;
DROP INDEX IF EXISTS idx_premium_subscriptions_status;
DROP INDEX IF EXISTS idx_premium_credits_service;
DROP INDEX IF EXISTS idx_premium_transactions_user_id;
DROP INDEX IF EXISTS idx_premium_transactions_type;
DROP INDEX IF EXISTS idx_premium_service_usage_user_id;
DROP INDEX IF EXISTS idx_premium_service_usage_service;
DROP INDEX IF EXISTS idx_ai_documents_user_id;
DROP INDEX IF EXISTS idx_ai_documents_type;
DROP INDEX IF EXISTS idx_ai_documents_status;
DROP INDEX IF EXISTS idx_ai_documents_created;
DROP INDEX IF EXISTS idx_ai_documents_target_job;
DROP INDEX IF EXISTS idx_ai_profile_analysis_offer_id;
DROP INDEX IF EXISTS idx_ai_profile_analysis_score;
DROP INDEX IF EXISTS idx_ai_profile_analysis_date;
DROP INDEX IF EXISTS idx_ai_profile_analysis_status;
DROP INDEX IF EXISTS idx_social_media_configuration_created_at;
DROP INDEX IF EXISTS idx_credit_packages_active;
DROP INDEX IF EXISTS idx_service_costs_active;
DROP INDEX IF EXISTS idx_credit_transactions_user_id;
DROP INDEX IF EXISTS idx_credit_transactions_type;
DROP INDEX IF EXISTS idx_job_payments_job_id;
DROP INDEX IF EXISTS idx_job_payments_company_id;
DROP INDEX IF EXISTS idx_job_payments_status;
DROP INDEX IF EXISTS idx_job_formatting_active;

-- ============================================
-- FIX FUNCTION SEARCH PATHS (SECURITY)
-- ============================================

-- Update trigger functions
CREATE OR REPLACE FUNCTION public.update_trainer_profiles_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_formations_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_resource_downloads(resource_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE resources
  SET downloads = COALESCE(downloads, 0) + 1
  WHERE id = resource_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_api_keys_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_suggestion_frequency(
  p_category text,
  p_value text
)
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO autocomplete_suggestions (category, value, frequency)
  VALUES (p_category, p_value, 1)
  ON CONFLICT (category, value)
  DO UPDATE SET
    frequency = autocomplete_suggestions.frequency + 1,
    last_used = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.update_job_alerts_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_job_form_config_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;