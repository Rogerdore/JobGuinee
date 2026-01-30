/*
  # Fix Function Search Path Security Issues (With Overloads)
  
  1. Security Improvements
    - Set immutable search_path on all functions with proper signatures
    - Prevents search_path injection attacks
    - Ensures functions always execute in expected schema context
  
  2. Functions Fixed
    - Credit purchase functions (with overloads)
    - AI service functions
    - Statistics and analytics functions
    - Trigger functions
  
  3. Standard Approach
    - Set search_path to 'public, pg_temp' on all functions
    - Handle function overloads by specifying full signatures
*/

-- Fix use_ai_credits function
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'use_ai_credits') THEN
    ALTER FUNCTION use_ai_credits(uuid, text, jsonb, jsonb) SET search_path = 'public', 'pg_temp';
  END IF;
END $$;

-- Fix complete_credit_purchase functions (both overloads)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
             WHERE n.nspname = 'public' AND p.proname = 'complete_credit_purchase' 
             AND pg_get_function_identity_arguments(p.oid) = 'p_purchase_id uuid, p_admin_notes text') THEN
    ALTER FUNCTION complete_credit_purchase(uuid, text) SET search_path = 'public', 'pg_temp';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
             WHERE n.nspname = 'public' AND p.proname = 'complete_credit_purchase' 
             AND pg_get_function_identity_arguments(p.oid) = 'p_purchase_id uuid, p_transaction_id text, p_payment_method text') THEN
    ALTER FUNCTION complete_credit_purchase(uuid, text, text) SET search_path = 'public', 'pg_temp';
  END IF;
END $$;

-- Fix consume_pack_credit function (check if exists first)
DO $$
DECLARE
  func_args text;
BEGIN
  SELECT pg_get_function_identity_arguments(p.oid) INTO func_args
  FROM pg_proc p 
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'consume_pack_credit'
  LIMIT 1;
  
  IF func_args IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION consume_pack_credit(%s) SET search_path = ''public'', ''pg_temp''', func_args);
  END IF;
END $$;

-- Fix get_candidate_stats function
DO $$
DECLARE
  func_args text;
BEGIN
  SELECT pg_get_function_identity_arguments(p.oid) INTO func_args
  FROM pg_proc p 
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'get_candidate_stats'
  LIMIT 1;
  
  IF func_args IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION get_candidate_stats(%s) SET search_path = ''public'', ''pg_temp''', func_args);
  END IF;
END $$;

-- Fix get_recruiter_dashboard_metrics function
DO $$
DECLARE
  func_args text;
BEGIN
  SELECT pg_get_function_identity_arguments(p.oid) INTO func_args
  FROM pg_proc p 
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'get_recruiter_dashboard_metrics'
  LIMIT 1;
  
  IF func_args IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION get_recruiter_dashboard_metrics(%s) SET search_path = ''public'', ''pg_temp''', func_args);
  END IF;
END $$;

-- Fix get_recent_applications function
DO $$
DECLARE
  func_args text;
BEGIN
  SELECT pg_get_function_identity_arguments(p.oid) INTO func_args
  FROM pg_proc p 
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'get_recent_applications'
  LIMIT 1;
  
  IF func_args IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION get_recent_applications(%s) SET search_path = ''public'', ''pg_temp''', func_args);
  END IF;
END $$;

-- Fix get_recent_jobs function
DO $$
DECLARE
  func_args text;
BEGIN
  SELECT pg_get_function_identity_arguments(p.oid) INTO func_args
  FROM pg_proc p 
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'get_recent_jobs'
  LIMIT 1;
  
  IF func_args IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION get_recent_jobs(%s) SET search_path = ''public'', ''pg_temp''', func_args);
  END IF;
END $$;

-- Fix trigger functions (these have no arguments)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    ALTER FUNCTION handle_new_user() SET search_path = 'public', 'pg_temp';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_application_count') THEN
    ALTER FUNCTION update_application_count() SET search_path = 'public', 'pg_temp';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_job_counters') THEN
    ALTER FUNCTION update_job_counters() SET search_path = 'public', 'pg_temp';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_profile_completion') THEN
    ALTER FUNCTION update_profile_completion() SET search_path = 'public', 'pg_temp';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_job_deadline_on_approval') THEN
    ALTER FUNCTION sync_job_deadline_on_approval() SET search_path = 'public', 'pg_temp';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_job_comments_count') THEN
    ALTER FUNCTION sync_job_comments_count() SET search_path = 'public', 'pg_temp';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_job_views_count') THEN
    ALTER FUNCTION update_job_views_count() SET search_path = 'public', 'pg_temp';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_cv_download_count') THEN
    ALTER FUNCTION update_cv_download_count() SET search_path = 'public', 'pg_temp';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_cv_views_count') THEN
    ALTER FUNCTION update_cv_views_count() SET search_path = 'public', 'pg_temp';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'reset_user_password') THEN
    ALTER FUNCTION reset_user_password() SET search_path = 'public', 'pg_temp';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'confirm_user_by_admin') THEN
    ALTER FUNCTION confirm_user_by_admin() SET search_path = 'public', 'pg_temp';
  END IF;
END $$;
