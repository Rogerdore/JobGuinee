/*
  # Fix Overly Permissive RLS Policies (Corrected)
  
  1. Security Improvements
    - Remove policies with "true" conditions that bypass security
    - Add proper authentication and ownership checks
    - Use correct column names for visibility checks
  
  2. Policies Fixed
    - AI rate limits - remove overly permissive ALL policy
    - Email queue - restrict to proper context
    - CMS and navigation - restrict to visible/published content
  
  3. Important Notes
    - Public read access for configuration is intentionally kept
    - Service role policies for system operations are preserved
    - User ownership is enforced for user-specific data
*/

-- Fix AI rate limits - remove overly permissive policy
DROP POLICY IF EXISTS "System can manage rate limits" ON ai_rate_limits;

-- Add specific policies for rate limits management
CREATE POLICY "System can create rate limits"
  ON ai_rate_limits FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "System can update own rate limits"
  ON ai_rate_limits FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "System can delete own rate limits"
  ON ai_rate_limits FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Fix email queue - remove overly permissive policy and add specific ones
DROP POLICY IF EXISTS "System can manage email queue" ON email_queue;

CREATE POLICY "Authenticated can insert email queue"
  ON email_queue FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR (select auth.uid()) = user_id);

CREATE POLICY "Users can view own email queue"
  ON email_queue FOR SELECT
  TO authenticated
  USING (user_id IS NULL OR (select auth.uid()) = user_id);

CREATE POLICY "Service can update email queue status"
  ON email_queue FOR UPDATE
  TO service_role
  USING (true);

-- Fix CMS pages - restrict to published only
DROP POLICY IF EXISTS "Authenticated users can view all pages" ON cms_pages;
CREATE POLICY "Users can view published pages"
  ON cms_pages FOR SELECT
  TO authenticated
  USING (status = 'published' OR status IS NULL);

-- Fix navigation items - use correct 'visible' column
DROP POLICY IF EXISTS "Authenticated users can view all navigation items" ON navigation_items;
CREATE POLICY "Users can view visible navigation"
  ON navigation_items FOR SELECT
  TO authenticated
  USING (visible = true OR visible IS NULL);

-- Remove duplicate chatbot settings policy
DROP POLICY IF EXISTS "Public can read chatbot settings" ON chatbot_settings;

-- Remove duplicate chatbot styles policy
DROP POLICY IF EXISTS "Public can read chatbot styles" ON chatbot_styles;

-- Note: Policies allowing public INSERT/SELECT on configuration tables
-- (like credit_packages, diffusion_settings, etc.) are intentionally kept
-- as they're designed for public configuration viewing and lead generation
