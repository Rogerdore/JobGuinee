/*
  # Fix Security Issues - Batch 4: SEO & Content

  Optimize RLS policies for:
  - SEO configuration tables
  - SEO analytics and audits
  - Content management
  - Recruiter profiles
*/

-- =====================================================
-- SEO CONFIG
-- =====================================================

DROP POLICY IF EXISTS "Admins can update SEO config" ON seo_config;
CREATE POLICY "Admins can update SEO config" ON seo_config
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert SEO config" ON seo_config;
CREATE POLICY "Admins can insert SEO config" ON seo_config
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- SEO PAGE META
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage page meta" ON seo_page_meta;
CREATE POLICY "Admins can manage page meta" ON seo_page_meta
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- SEO SCHEMAS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage schemas" ON seo_schemas;
CREATE POLICY "Admins can manage schemas" ON seo_schemas
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- SEO KEYWORDS
-- =====================================================

DROP POLICY IF EXISTS "Admins can read keywords" ON seo_keywords;
CREATE POLICY "Admins can read keywords" ON seo_keywords
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage keywords" ON seo_keywords;
CREATE POLICY "Admins can manage keywords" ON seo_keywords
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- SEO KEYWORD RANKINGS
-- =====================================================

DROP POLICY IF EXISTS "Admins can read keyword rankings" ON seo_keyword_rankings;
CREATE POLICY "Admins can read keyword rankings" ON seo_keyword_rankings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage keyword rankings" ON seo_keyword_rankings;
CREATE POLICY "Admins can manage keyword rankings" ON seo_keyword_rankings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- SEO INTERNAL LINKS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage internal links" ON seo_internal_links;
CREATE POLICY "Admins can manage internal links" ON seo_internal_links
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- SEO GENERATION LOGS
-- =====================================================

DROP POLICY IF EXISTS "Admins can read generation logs" ON seo_generation_logs;
CREATE POLICY "Admins can read generation logs" ON seo_generation_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage generation logs" ON seo_generation_logs;
CREATE POLICY "Admins can manage generation logs" ON seo_generation_logs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- SEO AB TESTS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage ab tests" ON seo_ab_tests;
CREATE POLICY "Admins can manage ab tests" ON seo_ab_tests
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- SEO AB VARIANTS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage ab variants" ON seo_ab_variants;
CREATE POLICY "Admins can manage ab variants" ON seo_ab_variants
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- SEO AB RESULTS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage ab results" ON seo_ab_results;
CREATE POLICY "Admins can manage ab results" ON seo_ab_results
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- SEO PAGE SCORES
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage page scores" ON seo_page_scores;
CREATE POLICY "Admins can manage page scores" ON seo_page_scores
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- SEO OPTIMIZATION SUGGESTIONS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage optimization suggestions" ON seo_optimization_suggestions;
CREATE POLICY "Admins can manage optimization suggestions" ON seo_optimization_suggestions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- SEO CONTENT IDEAS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage content ideas" ON seo_content_ideas;
CREATE POLICY "Admins can manage content ideas" ON seo_content_ideas
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- SEO DOMAINS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage domains" ON seo_domains;
CREATE POLICY "Admins can manage domains" ON seo_domains
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- SEO EXTERNAL LINKS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage external links" ON seo_external_links;
CREATE POLICY "Admins can manage external links" ON seo_external_links
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- SEO OUTBOUND LINKS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage outbound links" ON seo_outbound_links;
CREATE POLICY "Admins can manage outbound links" ON seo_outbound_links
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- SEO LINK OPPORTUNITIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage link opportunities" ON seo_link_opportunities;
CREATE POLICY "Admins can manage link opportunities" ON seo_link_opportunities
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- SEO TOXIC LINKS
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage toxic links" ON seo_toxic_links;
CREATE POLICY "Admins can manage toxic links" ON seo_toxic_links
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- SEO BACKLINK CHANGES
-- =====================================================

DROP POLICY IF EXISTS "Admins can view backlink changes" ON seo_backlink_changes;
CREATE POLICY "Admins can view backlink changes" ON seo_backlink_changes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- RECRUITER PROFILES
-- =====================================================

DROP POLICY IF EXISTS "Recruiters can view own profile" ON recruiter_profiles;
CREATE POLICY "Recruiters can view own profile" ON recruiter_profiles
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Recruiters can update own profile" ON recruiter_profiles;
CREATE POLICY "Recruiters can update own profile" ON recruiter_profiles
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Recruiters can insert own profile" ON recruiter_profiles;
CREATE POLICY "Recruiters can insert own profile" ON recruiter_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all recruiter profiles" ON recruiter_profiles;
CREATE POLICY "Admins can view all recruiter profiles" ON recruiter_profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );
