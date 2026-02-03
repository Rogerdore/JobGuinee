/*
  # Fix Critical Security Issues

  1. Performance Improvements
    - Add missing indexes on foreign keys
    - Remove duplicate indexes

  2. Security Fixes
    - Optimize RLS policies with auth.uid() initialization
    - Fix RLS policies that bypass security
*/

-- =====================================================
-- 1. ADD MISSING INDEXES ON FOREIGN KEYS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_email_provider_config_created_by
  ON email_provider_config(created_by);

CREATE INDEX IF NOT EXISTS idx_email_templates_created_by
  ON email_templates(created_by);

CREATE INDEX IF NOT EXISTS idx_social_share_clicks_candidate_id
  ON social_share_clicks(candidate_id);

-- =====================================================
-- 2. DROP DUPLICATE INDEXES
-- =====================================================

DROP INDEX IF EXISTS idx_b2b_contracts_pipeline;
DROP INDEX IF EXISTS idx_candidate_prefs_person;
DROP INDEX IF EXISTS idx_cv_sections_version;
DROP INDEX IF EXISTS idx_daily_digest_recruiter;
DROP INDEX IF EXISTS idx_email_logs_application;
DROP INDEX IF EXISTS idx_enterprise_subs_company;
DROP INDEX IF EXISTS idx_enterprise_subs_profile;
DROP INDEX IF EXISTS idx_usage_tracking_company;
DROP INDEX IF EXISTS idx_usage_tracking_subscription;
DROP INDEX IF EXISTS idx_external_application_documents_app;
DROP INDEX IF EXISTS idx_ext_app_supp_docs_candidate;
DROP INDEX IF EXISTS idx_ext_app_supp_docs_application;
DROP INDEX IF EXISTS idx_seo_conversion_landing_page;
DROP INDEX IF EXISTS idx_keyword_rankings_keyword;

-- =====================================================
-- 3. FIX CRITICAL RLS POLICIES - AUTH INITIALIZATION
-- =====================================================

-- Jobs table
DROP POLICY IF EXISTS "Recruiters can delete own jobs" ON jobs;
CREATE POLICY "Recruiters can delete own jobs" ON jobs
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all jobs" ON jobs;
CREATE POLICY "Admins can view all jobs" ON jobs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update all jobs" ON jobs;
CREATE POLICY "Admins can update all jobs" ON jobs
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- Candidate Profiles
DROP POLICY IF EXISTS "Public candidate profiles are viewable by everyone" ON candidate_profiles;
CREATE POLICY "Public candidate profiles are viewable by everyone" ON candidate_profiles
  FOR SELECT TO authenticated
  USING (
    visible_in_cvtheque = true
    OR user_id = (select auth.uid())
  );

DROP POLICY IF EXISTS "Candidates can insert own profile" ON candidate_profiles;
CREATE POLICY "Candidates can insert own profile" ON candidate_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- Applications
DROP POLICY IF EXISTS "Users can view applications they are involved in" ON applications;
CREATE POLICY "Users can view applications they are involved in" ON applications
  FOR SELECT TO authenticated
  USING (
    candidate_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
      AND jobs.user_id = (select auth.uid())
    )
  );

-- Blog Posts
DROP POLICY IF EXISTS "Authors can manage own blog posts" ON blog_posts;
CREATE POLICY "Authors can manage own blog posts" ON blog_posts
  FOR ALL TO authenticated
  USING (author_id = (select auth.uid()))
  WITH CHECK (author_id = (select auth.uid()));

-- Chatbot Settings
DROP POLICY IF EXISTS "Admins can manage chatbot settings" ON chatbot_settings;
CREATE POLICY "Admins can manage chatbot settings" ON chatbot_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- Chatbot Styles
DROP POLICY IF EXISTS "Admins can manage chatbot styles" ON chatbot_styles;
CREATE POLICY "Admins can manage chatbot styles" ON chatbot_styles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- Profiles
DROP POLICY IF EXISTS "Enable insert for system and self" ON profiles;
CREATE POLICY "Enable insert for system and self" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (select auth.uid()));

-- Notification Preferences
DROP POLICY IF EXISTS "Enable insert for system and self on notification_preferences" ON notification_preferences;
CREATE POLICY "Enable insert for system and self on notification_preferences" ON notification_preferences
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own preferences" ON notification_preferences;
CREATE POLICY "Users can view own preferences" ON notification_preferences
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own preferences" ON notification_preferences;
CREATE POLICY "Users can update own preferences" ON notification_preferences
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Chatbot Logs
DROP POLICY IF EXISTS "Users can read their own logs" ON chatbot_logs;
CREATE POLICY "Users can read their own logs" ON chatbot_logs
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can read all logs" ON chatbot_logs;
CREATE POLICY "Admins can read all logs" ON chatbot_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create logs" ON chatbot_logs;
CREATE POLICY "Authenticated users can create logs" ON chatbot_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR user_id IS NULL);

-- Credit Packages
DROP POLICY IF EXISTS "Admins can manage packages" ON credit_packages;
CREATE POLICY "Admins can manage packages" ON credit_packages
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- Credit Transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON credit_transactions;
CREATE POLICY "Users can view own transactions" ON credit_transactions
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all transactions" ON credit_transactions;
CREATE POLICY "Admins can view all transactions" ON credit_transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- Job Clicks (uses user_id not candidate_id)
DROP POLICY IF EXISTS "Candidates can view their own clicks" ON job_clicks;
CREATE POLICY "Candidates can view their own clicks" ON job_clicks
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- Service Credit Costs
DROP POLICY IF EXISTS "Admins can manage services" ON service_credit_costs;
CREATE POLICY "Admins can manage services" ON service_credit_costs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- 4. FIX RLS POLICIES THAT BYPASS SECURITY
-- =====================================================

-- ai_security_logs
DROP POLICY IF EXISTS "System can create security logs" ON ai_security_logs;
CREATE POLICY "System can create security logs" ON ai_security_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR user_id IS NULL);

-- ai_service_usage_history
DROP POLICY IF EXISTS "System can insert usage" ON ai_service_usage_history;
CREATE POLICY "System can insert usage" ON ai_service_usage_history
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- application_timeline
DROP POLICY IF EXISTS "System can insert timeline events" ON application_timeline;
CREATE POLICY "System can insert timeline events" ON application_timeline
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_timeline.application_id
      AND (
        applications.candidate_id = (select auth.uid())
        OR EXISTS (
          SELECT 1 FROM jobs
          WHERE jobs.id = applications.job_id
          AND jobs.user_id = (select auth.uid())
        )
      )
    )
  );

-- credit_transactions
DROP POLICY IF EXISTS "System can insert transactions" ON credit_transactions;
CREATE POLICY "System can insert transactions" ON credit_transactions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- profile_views
DROP POLICY IF EXISTS "Authenticated users can record profile views" ON profile_views;
CREATE POLICY "Authenticated users can record profile views" ON profile_views
  FOR INSERT TO authenticated
  WITH CHECK (viewer_id = (select auth.uid()) OR viewer_id IS NULL);
