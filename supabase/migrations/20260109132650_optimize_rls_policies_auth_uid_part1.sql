/*
  # Optimize RLS Policies - Part 1: Critical Tables

  1. Performance Optimization
    - Wraps auth.uid() calls in (select auth.uid()) for policy caching
    - Focuses on most frequently accessed tables
    - Prevents re-evaluation of auth functions for every row
    
  2. Expected Impact
    - 10-50x performance improvement on row-level filtered queries
    - Reduced database CPU usage
    - Faster query response times for authenticated operations

  3. Tables Optimized
    - profiles, applications, notifications
    - ai_rate_limits, ai_security_logs, ai_service_usage_history, ai_user_restrictions
    - saved_jobs, job_alerts, candidate_documents
    - premium_subscriptions, credit_purchases
    - chatbot_conversations, interview_simulations
    - candidate_profiles, recruiter_profiles, trainer_profiles
*/

-- Optimize profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- Optimize applications policies
DROP POLICY IF EXISTS "Candidates can insert own applications" ON applications;
CREATE POLICY "Candidates can insert own applications" ON applications
  FOR INSERT TO authenticated
  WITH CHECK (candidate_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Candidates can view own applications" ON applications;
CREATE POLICY "Candidates can view own applications" ON applications
  FOR SELECT TO authenticated
  USING (candidate_id = (select auth.uid()));

DROP POLICY IF EXISTS "Recruiters can update applications for their jobs" ON applications;
CREATE POLICY "Recruiters can update applications for their jobs" ON applications
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM jobs j
    JOIN companies c ON c.id = j.company_id
    WHERE j.id = applications.job_id AND c.profile_id = (select auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM jobs j
    JOIN companies c ON c.id = j.company_id
    WHERE j.id = applications.job_id AND c.profile_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Recruiters can view applications for their jobs" ON applications;
CREATE POLICY "Recruiters can view applications for their jobs" ON applications
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM jobs j
    JOIN companies c ON c.id = j.company_id
    WHERE j.id = applications.job_id AND c.profile_id = (select auth.uid())
  ));

-- Optimize AI service policies
DROP POLICY IF EXISTS "Users can view own rate limits" ON ai_rate_limits;
CREATE POLICY "Users can view own rate limits" ON ai_rate_limits
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own security logs" ON ai_security_logs;
CREATE POLICY "Users can view own security logs" ON ai_security_logs
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own restrictions" ON ai_user_restrictions;
CREATE POLICY "Users can view own restrictions" ON ai_user_restrictions
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own usage history" ON ai_service_usage_history;
CREATE POLICY "Users can view own usage history" ON ai_service_usage_history
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- Optimize notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

-- Optimize saved_jobs (uses user_id not candidate_id)
DROP POLICY IF EXISTS "Candidates can manage own saved jobs" ON saved_jobs;
CREATE POLICY "Users can manage own saved jobs" ON saved_jobs
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Optimize job_alerts
DROP POLICY IF EXISTS "Users can manage own job alerts" ON job_alerts;
CREATE POLICY "Users can manage own job alerts" ON job_alerts
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Optimize candidate_profiles
DROP POLICY IF EXISTS "Users can view own candidate profile" ON candidate_profiles;
CREATE POLICY "Users can view own candidate profile" ON candidate_profiles
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own candidate profile" ON candidate_profiles;
CREATE POLICY "Users can update own candidate profile" ON candidate_profiles
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own candidate profile" ON candidate_profiles;
CREATE POLICY "Users can insert own candidate profile" ON candidate_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- Optimize recruiter_profiles
DROP POLICY IF EXISTS "Users can view own recruiter profile" ON recruiter_profiles;
CREATE POLICY "Users can view own recruiter profile" ON recruiter_profiles
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own recruiter profile" ON recruiter_profiles;
CREATE POLICY "Users can update own recruiter profile" ON recruiter_profiles
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own recruiter profile" ON recruiter_profiles;
CREATE POLICY "Users can insert own recruiter profile" ON recruiter_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- Optimize trainer_profiles
DROP POLICY IF EXISTS "Users can view own trainer profile" ON trainer_profiles;
CREATE POLICY "Users can view own trainer profile" ON trainer_profiles
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own trainer profile" ON trainer_profiles;
CREATE POLICY "Users can update own trainer profile" ON trainer_profiles
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Optimize candidate_documents
DROP POLICY IF EXISTS "Candidates can manage own documents" ON candidate_documents;
CREATE POLICY "Candidates can manage own documents" ON candidate_documents
  FOR ALL TO authenticated
  USING (candidate_id = (select auth.uid()))
  WITH CHECK (candidate_id = (select auth.uid()));

-- Optimize premium_subscriptions
DROP POLICY IF EXISTS "Users can view own subscription" ON premium_subscriptions;
CREATE POLICY "Users can view own subscription" ON premium_subscriptions
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own subscription" ON premium_subscriptions;
CREATE POLICY "Users can insert own subscription" ON premium_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- Optimize credit_purchases
DROP POLICY IF EXISTS "Users can view own credit purchases" ON credit_purchases;
CREATE POLICY "Users can view own credit purchases" ON credit_purchases
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert credit purchases" ON credit_purchases;
CREATE POLICY "Users can insert credit purchases" ON credit_purchases
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- Optimize chatbot_conversations
DROP POLICY IF EXISTS "Users can view own conversations" ON chatbot_conversations;
CREATE POLICY "Users can view own conversations" ON chatbot_conversations
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own conversations" ON chatbot_conversations;
CREATE POLICY "Users can create own conversations" ON chatbot_conversations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own conversations" ON chatbot_conversations;
CREATE POLICY "Users can update own conversations" ON chatbot_conversations
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Optimize interview_simulations (uses user_id not candidate_id)
DROP POLICY IF EXISTS "Users can view own interview simulations" ON interview_simulations;
CREATE POLICY "Users can view own interview simulations" ON interview_simulations
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own interview simulations" ON interview_simulations;
CREATE POLICY "Users can create own interview simulations" ON interview_simulations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own interview simulations" ON interview_simulations;
CREATE POLICY "Users can update own interview simulations" ON interview_simulations
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));
