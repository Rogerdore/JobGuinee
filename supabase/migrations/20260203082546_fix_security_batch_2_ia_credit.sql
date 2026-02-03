/*
  # Fix Security Issues - Batch 2: IA & Credit Systems

  Optimize RLS policies for:
  - IA service config and templates
  - Credit purchases and store
  - Premium subscriptions
  - Site settings and CMS
*/

-- =====================================================
-- IA SERVICE CONFIG
-- =====================================================

DROP POLICY IF EXISTS "Admins can view configs" ON ia_service_config;
CREATE POLICY "Admins can view configs" ON ia_service_config
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update configs" ON ia_service_config;
CREATE POLICY "Admins can update configs" ON ia_service_config
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert configs" ON ia_service_config;
CREATE POLICY "Admins can insert configs" ON ia_service_config
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can view history" ON ia_service_config_history;
CREATE POLICY "Admins can view history" ON ia_service_config_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- CREDIT PURCHASES
-- =====================================================

DROP POLICY IF EXISTS "Users can create own purchases" ON credit_purchases;
CREATE POLICY "Users can create own purchases" ON credit_purchases
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own pending purchases" ON credit_purchases;
CREATE POLICY "Users can update own pending purchases" ON credit_purchases
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()) AND payment_status = 'pending')
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all purchases" ON credit_purchases;
CREATE POLICY "Admins can view all purchases" ON credit_purchases
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update all purchases" ON credit_purchases;
CREATE POLICY "Admins can update all purchases" ON credit_purchases
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- CREDIT STORE SETTINGS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage store settings" ON credit_store_settings;
CREATE POLICY "Admins can manage store settings" ON credit_store_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- AI RATE LIMITS
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all rate limits" ON ai_rate_limits;
CREATE POLICY "Admins can view all rate limits" ON ai_rate_limits
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- AI SECURITY LOGS
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all security logs" ON ai_security_logs;
CREATE POLICY "Admins can view all security logs" ON ai_security_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- AI USER RESTRICTIONS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage all restrictions" ON ai_user_restrictions;
CREATE POLICY "Admins can manage all restrictions" ON ai_user_restrictions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- SITE SETTINGS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage all settings" ON site_settings;
CREATE POLICY "Admins can manage all settings" ON site_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- CMS SECTIONS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage CMS sections" ON cms_sections;
CREATE POLICY "Admins can manage CMS sections" ON cms_sections
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- PROFILE FORM SETTINGS
-- =====================================================

DROP POLICY IF EXISTS "Admins can read form settings" ON profile_form_settings;
CREATE POLICY "Admins can read form settings" ON profile_form_settings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert form settings" ON profile_form_settings;
CREATE POLICY "Admins can insert form settings" ON profile_form_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update form settings" ON profile_form_settings;
CREATE POLICY "Admins can update form settings" ON profile_form_settings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
CREATE POLICY "Users can insert own notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- =====================================================
-- JOB ALERTS
-- =====================================================

DROP POLICY IF EXISTS "Users can update own alerts" ON job_alerts;
CREATE POLICY "Users can update own alerts" ON job_alerts
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own alerts" ON job_alerts;
CREATE POLICY "Users can view own alerts" ON job_alerts
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create alerts" ON job_alerts;
CREATE POLICY "Users can create alerts" ON job_alerts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own alerts" ON job_alerts;
CREATE POLICY "Users can delete own alerts" ON job_alerts
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- USER PREMIUM SERVICES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own premium services" ON user_premium_services;
CREATE POLICY "Users can view their own premium services" ON user_premium_services
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));
