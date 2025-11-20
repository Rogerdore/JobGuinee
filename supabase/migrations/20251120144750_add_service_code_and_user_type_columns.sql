/*
  # Add Service Code and User Type Columns

  1. Changes
    - Add `code` column to premium_services (unique identifier for services)
    - Add `target_user_type` column (candidate, recruiter, trainer, or all)
    - Add `display_order` column for sorting services
    - Update existing services with proper codes and target types

  2. Security
    - No RLS changes needed (already configured)
*/

-- Add new columns to premium_services
ALTER TABLE premium_services
ADD COLUMN IF NOT EXISTS code text,
ADD COLUMN IF NOT EXISTS target_user_type text DEFAULT 'all',
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Create unique index on code
CREATE UNIQUE INDEX IF NOT EXISTS idx_premium_services_code ON premium_services(code) WHERE code IS NOT NULL;

-- Update existing services with codes based on their type
UPDATE premium_services
SET 
  code = CASE
    WHEN type = 'ai_cv_generation' THEN 'cv_generation'
    WHEN type = 'ai_cover_letter' THEN 'cover_letter_generation'
    WHEN type = 'ai_profile_analysis' THEN 'profile_analysis'
    WHEN type = 'ai_interview_coaching' THEN 'interview_coaching'
    WHEN type = 'ai_job_matching' THEN 'job_matching'
    WHEN type = 'profile_visibility_boost' THEN 'profile_visibility_boost'
    WHEN type = 'unlimited_applications' THEN 'unlimited_applications'
    WHEN type = 'featured_application' THEN 'featured_application'
    WHEN type = 'direct_message_recruiter' THEN 'direct_message_recruiter'
    WHEN type = 'access_contact_info' THEN 'access_contact_info'
    WHEN type = 'gold_profile' THEN 'profile_visibility_boost'
    ELSE lower(regexp_replace(name, '[^a-zA-Z0-9]+', '_', 'g'))
  END,
  target_user_type = CASE
    WHEN type IN ('ai_cv_generation', 'ai_cover_letter', 'ai_profile_analysis', 'ai_interview_coaching', 'ai_job_matching', 'profile_visibility_boost', 'unlimited_applications', 'featured_application', 'direct_message_recruiter', 'gold_profile') THEN 'candidate'
    WHEN type = 'access_contact_info' THEN 'recruiter'
    ELSE 'all'
  END,
  display_order = CASE
    WHEN type = 'ai_cv_generation' THEN 1
    WHEN type = 'ai_cover_letter' THEN 2
    WHEN type = 'ai_profile_analysis' THEN 3
    WHEN type = 'ai_interview_coaching' THEN 4
    WHEN type = 'ai_job_matching' THEN 5
    WHEN type = 'profile_visibility_boost' THEN 6
    WHEN type = 'gold_profile' THEN 6
    WHEN type = 'unlimited_applications' THEN 7
    WHEN type = 'featured_application' THEN 8
    WHEN type = 'direct_message_recruiter' THEN 9
    WHEN type = 'access_contact_info' THEN 10
    ELSE 99
  END
WHERE code IS NULL;

-- Make code NOT NULL after updating existing records
ALTER TABLE premium_services
ALTER COLUMN code SET NOT NULL;
