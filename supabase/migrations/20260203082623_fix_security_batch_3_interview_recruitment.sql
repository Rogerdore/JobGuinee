/*
  # Fix Security Issues - Batch 3: Interview & Recruitment

  Optimize RLS policies for:
  - Interview simulations
  - Interviews
  - Interview evaluations
  - Recruitment analytics
  - Application activity logs
  - Workflow stages
*/

-- =====================================================
-- INTERVIEW SIMULATIONS
-- =====================================================

DROP POLICY IF EXISTS "Users can view own simulations" ON interview_simulations;
CREATE POLICY "Users can view own simulations" ON interview_simulations
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create simulations" ON interview_simulations;
CREATE POLICY "Users can create simulations" ON interview_simulations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own simulations" ON interview_simulations;
CREATE POLICY "Users can update own simulations" ON interview_simulations
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- =====================================================
-- CHATBOT CONVERSATIONS
-- =====================================================

DROP POLICY IF EXISTS "Users can delete own conversations" ON chatbot_conversations;
CREATE POLICY "Users can delete own conversations" ON chatbot_conversations
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

-- =====================================================
-- JOB VIEWS
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own job views" ON job_views;
CREATE POLICY "Users can view their own job views" ON job_views
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create their own job views" ON job_views;
CREATE POLICY "Users can create their own job views" ON job_views
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR user_id IS NULL);

-- =====================================================
-- FORMATION ENROLLMENTS
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own enrollments" ON formation_enrollments;
CREATE POLICY "Users can view their own enrollments" ON formation_enrollments
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create their own enrollments" ON formation_enrollments;
CREATE POLICY "Users can create their own enrollments" ON formation_enrollments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own enrollments" ON formation_enrollments;
CREATE POLICY "Users can update their own enrollments" ON formation_enrollments
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- =====================================================
-- PROFILE PURCHASES
-- =====================================================

DROP POLICY IF EXISTS "Recruiters can view own purchases" ON profile_purchases;
CREATE POLICY "Recruiters can view own purchases" ON profile_purchases
  FOR SELECT TO authenticated
  USING (buyer_id = (select auth.uid()));

DROP POLICY IF EXISTS "Recruiters can create own purchases" ON profile_purchases;
CREATE POLICY "Recruiters can create own purchases" ON profile_purchases
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id = (select auth.uid()));

DROP POLICY IF EXISTS "Recruiters can update own purchases" ON profile_purchases;
CREATE POLICY "Recruiters can update own purchases" ON profile_purchases
  FOR UPDATE TO authenticated
  USING (buyer_id = (select auth.uid()))
  WITH CHECK (buyer_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all purchases" ON profile_purchases;
CREATE POLICY "Admins can view all purchases" ON profile_purchases
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update all purchases" ON profile_purchases;
CREATE POLICY "Admins can update all purchases" ON profile_purchases
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- PAYMENT METHODS
-- =====================================================

DROP POLICY IF EXISTS "Admins can insert payment methods" ON payment_methods;
CREATE POLICY "Admins can insert payment methods" ON payment_methods
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update payment methods" ON payment_methods;
CREATE POLICY "Admins can update payment methods" ON payment_methods
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete payment methods" ON payment_methods;
CREATE POLICY "Admins can delete payment methods" ON payment_methods
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- PREMIUM SUBSCRIPTIONS
-- =====================================================

DROP POLICY IF EXISTS "Users can view own premium subscriptions" ON premium_subscriptions;
CREATE POLICY "Users can view own premium subscriptions" ON premium_subscriptions
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all premium subscriptions" ON premium_subscriptions;
CREATE POLICY "Admins can view all premium subscriptions" ON premium_subscriptions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can create own premium subscriptions" ON premium_subscriptions;
CREATE POLICY "Users can create own premium subscriptions" ON premium_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can update premium subscriptions" ON premium_subscriptions;
CREATE POLICY "Admins can update premium subscriptions" ON premium_subscriptions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete premium subscriptions" ON premium_subscriptions;
CREATE POLICY "Admins can delete premium subscriptions" ON premium_subscriptions
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- NEWSLETTER SUBSCRIBERS
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all newsletter subscriptions" ON newsletter_subscribers;
CREATE POLICY "Admins can view all newsletter subscriptions" ON newsletter_subscribers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update newsletter subscriptions" ON newsletter_subscribers;
CREATE POLICY "Admins can update newsletter subscriptions" ON newsletter_subscribers
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- PROFILE CART HISTORY
-- =====================================================

DROP POLICY IF EXISTS "Recruiters can insert own cart history" ON profile_cart_history;
CREATE POLICY "Recruiters can insert own cart history" ON profile_cart_history
  FOR INSERT TO authenticated
  WITH CHECK (recruiter_id = (select auth.uid()));

DROP POLICY IF EXISTS "Recruiters can view own cart history" ON profile_cart_history;
CREATE POLICY "Recruiters can view own cart history" ON profile_cart_history
  FOR SELECT TO authenticated
  USING (recruiter_id = (select auth.uid()));

DROP POLICY IF EXISTS "Recruiters can update own cart history" ON profile_cart_history;
CREATE POLICY "Recruiters can update own cart history" ON profile_cart_history
  FOR UPDATE TO authenticated
  USING (recruiter_id = (select auth.uid()))
  WITH CHECK (recruiter_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all cart history" ON profile_cart_history;
CREATE POLICY "Admins can view all cart history" ON profile_cart_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- HOMEPAGE VIDEO SETTINGS
-- =====================================================

DROP POLICY IF EXISTS "Admin can manage video settings" ON homepage_video_settings;
CREATE POLICY "Admin can manage video settings" ON homepage_video_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- HOMEPAGE GUIDES
-- =====================================================

DROP POLICY IF EXISTS "Admin can manage guides" ON homepage_guides;
CREATE POLICY "Admin can manage guides" ON homepage_guides
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );
