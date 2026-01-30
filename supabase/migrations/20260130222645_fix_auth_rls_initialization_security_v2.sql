/*
  # Fix Auth RLS Initialization Security Issues
  
  1. Security Improvements
    - Replace `auth.uid()` with `(select auth.uid())` in RLS policies
    - This prevents initialization errors and improves query planning
    - Affects multiple tables across the application
  
  2. Performance Benefits
    - Better query optimization by PostgreSQL planner
    - Consistent auth check behavior
    - Reduces edge case authentication errors
  
  3. Important Notes
    - NO data modifications
    - Only policy definition changes
    - All existing access patterns remain unchanged
    - Security level maintained or improved
*/

-- Fix profiles table policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- Fix candidate_profiles policies
DROP POLICY IF EXISTS "Candidates can view own profile" ON candidate_profiles;
CREATE POLICY "Candidates can view own profile"
  ON candidate_profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = profile_id);

DROP POLICY IF EXISTS "Candidates can update own profile" ON candidate_profiles;
CREATE POLICY "Candidates can update own profile"
  ON candidate_profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = profile_id)
  WITH CHECK ((select auth.uid()) = profile_id);

-- Fix applications policies
DROP POLICY IF EXISTS "Candidates can view own applications" ON applications;
CREATE POLICY "Candidates can view own applications"
  ON applications FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = candidate_id);

DROP POLICY IF EXISTS "Candidates can create applications" ON applications;
CREATE POLICY "Candidates can create applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = candidate_id);

-- Fix saved_jobs policies
DROP POLICY IF EXISTS "Users can view own saved jobs" ON saved_jobs;
CREATE POLICY "Users can view own saved jobs"
  ON saved_jobs FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can save jobs" ON saved_jobs;
CREATE POLICY "Users can save jobs"
  ON saved_jobs FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can remove saved jobs" ON saved_jobs;
CREATE POLICY "Users can remove saved jobs"
  ON saved_jobs FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Fix candidate_documents policies
DROP POLICY IF EXISTS "Candidates can view own documents" ON candidate_documents;
CREATE POLICY "Candidates can view own documents"
  ON candidate_documents FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = candidate_id);

DROP POLICY IF EXISTS "Candidates can manage own documents" ON candidate_documents;
CREATE POLICY "Candidates can manage own documents"
  ON candidate_documents FOR ALL
  TO authenticated
  USING ((select auth.uid()) = candidate_id)
  WITH CHECK ((select auth.uid()) = candidate_id);

-- Fix credit_purchases policies
DROP POLICY IF EXISTS "Users can view own purchases" ON credit_purchases;
CREATE POLICY "Users can view own purchases"
  ON credit_purchases FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Fix ai_service_usage_history policies
DROP POLICY IF EXISTS "Users can view own AI usage" ON ai_service_usage_history;
CREATE POLICY "Users can view own AI usage"
  ON ai_service_usage_history FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Fix chatbot_conversations policies
DROP POLICY IF EXISTS "Users can view own conversations" ON chatbot_conversations;
CREATE POLICY "Users can view own conversations"
  ON chatbot_conversations FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create conversations" ON chatbot_conversations;
CREATE POLICY "Users can create conversations"
  ON chatbot_conversations FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Fix job_alerts policies
DROP POLICY IF EXISTS "Users can manage own job alerts" ON job_alerts;
CREATE POLICY "Users can manage own job alerts"
  ON job_alerts FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Fix external_applications policies
DROP POLICY IF EXISTS "Candidates can view own external applications" ON external_applications;
CREATE POLICY "Candidates can view own external applications"
  ON external_applications FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = candidate_id);

DROP POLICY IF EXISTS "Candidates can create external applications" ON external_applications;
CREATE POLICY "Candidates can create external applications"
  ON external_applications FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = candidate_id);
