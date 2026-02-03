/*
  # Fix Security Issues - Batch 5: Campaigns & Communications

  Optimize RLS policies for:
  - Campaigns and campaign channels
  - Candidate documents and verification
  - Profile cart and purchases
  - Direct profile purchases
  - Recruiter messages and matching
*/

-- =====================================================
-- JOB MODERATION HISTORY
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all moderation history" ON job_moderation_history;
CREATE POLICY "Admins can view all moderation history" ON job_moderation_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Recruiters can view own job moderation history" ON job_moderation_history;
CREATE POLICY "Recruiters can view own job moderation history" ON job_moderation_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_moderation_history.job_id
      AND jobs.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can insert moderation history" ON job_moderation_history;
CREATE POLICY "Admins can insert moderation history" ON job_moderation_history
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- B2B LEADS
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all B2B leads" ON b2b_leads;
CREATE POLICY "Admins can view all B2B leads" ON b2b_leads
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert B2B leads" ON b2b_leads;
CREATE POLICY "Admins can insert B2B leads" ON b2b_leads
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update B2B leads" ON b2b_leads;
CREATE POLICY "Admins can update B2B leads" ON b2b_leads
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- B2B PAGE CONFIG
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all B2B page config" ON b2b_page_config;
CREATE POLICY "Admins can view all B2B page config" ON b2b_page_config
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage B2B page config" ON b2b_page_config;
CREATE POLICY "Admins can manage B2B page config" ON b2b_page_config
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- SEO AUDIT REPORTS
-- =====================================================

DROP POLICY IF EXISTS "Admins can view audit reports" ON seo_audit_reports;
CREATE POLICY "Admins can view audit reports" ON seo_audit_reports
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "System can create audit reports" ON seo_audit_reports;
CREATE POLICY "System can create audit reports" ON seo_audit_reports
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- =====================================================
-- SEO I18N TABLES
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage i18n page meta" ON seo_page_meta_i18n;
CREATE POLICY "Admins can manage i18n page meta" ON seo_page_meta_i18n
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage i18n config" ON seo_config_i18n;
CREATE POLICY "Admins can manage i18n config" ON seo_config_i18n
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can view i18n keywords" ON seo_keywords_i18n;
CREATE POLICY "Admins can view i18n keywords" ON seo_keywords_i18n
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage i18n keywords" ON seo_keywords_i18n;
CREATE POLICY "Admins can manage i18n keywords" ON seo_keywords_i18n
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage hreflang config" ON seo_hreflang_config;
CREATE POLICY "Admins can manage hreflang config" ON seo_hreflang_config
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- SEO PERFORMANCE
-- =====================================================

DROP POLICY IF EXISTS "Admins can read all metrics" ON seo_core_web_vitals;
CREATE POLICY "Admins can read all metrics" ON seo_core_web_vitals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage mobile scores" ON seo_mobile_scores;
CREATE POLICY "Admins can manage mobile scores" ON seo_mobile_scores
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage performance alerts" ON seo_performance_alerts;
CREATE POLICY "Admins can manage performance alerts" ON seo_performance_alerts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- SEO MARKETPLACE & LANDING PAGES
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage marketplace pages" ON seo_marketplace_pages;
CREATE POLICY "Admins can manage marketplace pages" ON seo_marketplace_pages
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage cvtheque teaser pages" ON seo_cvtheque_teaser_pages;
CREATE POLICY "Admins can manage cvtheque teaser pages" ON seo_cvtheque_teaser_pages
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage B2B pages" ON seo_b2b_pages;
CREATE POLICY "Admins can manage B2B pages" ON seo_b2b_pages
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage blog posts" ON seo_blog_posts;
CREATE POLICY "Admins can manage blog posts" ON seo_blog_posts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage landing pages" ON seo_landing_pages;
CREATE POLICY "Admins can manage landing pages" ON seo_landing_pages
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- B2B PIPELINE & QUOTES
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all pipeline" ON b2b_pipeline;
CREATE POLICY "Admins can view all pipeline" ON b2b_pipeline
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage pipeline" ON b2b_pipeline;
CREATE POLICY "Admins can manage pipeline" ON b2b_pipeline
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can view all quotes" ON b2b_quotes;
CREATE POLICY "Admins can view all quotes" ON b2b_quotes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage quotes" ON b2b_quotes;
CREATE POLICY "Admins can manage quotes" ON b2b_quotes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can view all missions" ON b2b_missions;
CREATE POLICY "Admins can view all missions" ON b2b_missions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage missions" ON b2b_missions;
CREATE POLICY "Admins can manage missions" ON b2b_missions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- SEO CONVERSION TRACKING
-- =====================================================

DROP POLICY IF EXISTS "Admins can view conversion tracking" ON seo_conversion_tracking;
CREATE POLICY "Admins can view conversion tracking" ON seo_conversion_tracking
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- DOWNLOAD LOGS
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can create download logs" ON download_logs;
CREATE POLICY "Authenticated users can create download logs" ON download_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR user_id IS NULL);
