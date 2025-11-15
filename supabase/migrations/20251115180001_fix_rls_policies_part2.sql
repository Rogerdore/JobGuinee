/*
  # Fix Security and Performance Issues - Part 2: RLS Policies Optimization

  Optimize RLS policies by using subqueries for auth functions to prevent
  re-evaluation for each row, improving query performance at scale.
*/

-- Chatbot Conversations
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.chatbot_conversations;
DROP POLICY IF EXISTS "Users can create own conversations" ON public.chatbot_conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.chatbot_conversations;
DROP POLICY IF EXISTS "Users can view own conversations" ON public.chatbot_conversations;

CREATE POLICY "Admins can view all conversations" ON public.chatbot_conversations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Users can create own conversations" ON public.chatbot_conversations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own conversations" ON public.chatbot_conversations
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can view own conversations" ON public.chatbot_conversations
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- Chatbot FAQs - Remove duplicates
DROP POLICY IF EXISTS "Admins can read all FAQs" ON public.chatbot_faqs;
DROP POLICY IF EXISTS "Only admins can manage FAQs" ON public.chatbot_faqs;

CREATE POLICY "Admins can manage FAQs" ON public.chatbot_faqs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- Chatbot Config - Consolidate policies
DROP POLICY IF EXISTS "Admins can read full chatbot config" ON public.chatbot_config;
DROP POLICY IF EXISTS "Only admins can insert chatbot config" ON public.chatbot_config;
DROP POLICY IF EXISTS "Only admins can update chatbot config" ON public.chatbot_config;

CREATE POLICY "Admins can manage chatbot config" ON public.chatbot_config
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- IA Shortlisting - Consolidate policies
DROP POLICY IF EXISTS "Premium recruiters can create shortlisting analyses" ON public.ia_shortlisting;
DROP POLICY IF EXISTS "Recruiters can delete own shortlisting analyses" ON public.ia_shortlisting;
DROP POLICY IF EXISTS "Recruiters can update own shortlisting analyses" ON public.ia_shortlisting;
DROP POLICY IF EXISTS "Recruiters can view own shortlisting analyses" ON public.ia_shortlisting;

CREATE POLICY "Recruiters can manage own shortlisting" ON public.ia_shortlisting
  FOR ALL TO authenticated
  USING (recruiter_id = (select auth.uid()))
  WITH CHECK (recruiter_id = (select auth.uid()));

-- IA Shortlisting Results
DROP POLICY IF EXISTS "Recruiters can delete results of own analyses" ON public.ia_shortlisting_results;
DROP POLICY IF EXISTS "Recruiters can update results of own analyses" ON public.ia_shortlisting_results;
DROP POLICY IF EXISTS "Recruiters can view results of own analyses" ON public.ia_shortlisting_results;
DROP POLICY IF EXISTS "System can insert shortlisting results" ON public.ia_shortlisting_results;

CREATE POLICY "Recruiters can manage own results" ON public.ia_shortlisting_results
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ia_shortlisting
      WHERE ia_shortlisting.id = ia_shortlisting_results.shortlisting_id
      AND ia_shortlisting.recruiter_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ia_shortlisting
      WHERE ia_shortlisting.id = ia_shortlisting_results.shortlisting_id
      AND ia_shortlisting.recruiter_id = (select auth.uid())
    )
  );

-- Formation Enrollments
DROP POLICY IF EXISTS "Admins can update enrollments" ON public.formation_enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.formation_enrollments;
DROP POLICY IF EXISTS "Users can create enrollments" ON public.formation_enrollments;
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.formation_enrollments;

CREATE POLICY "Users can manage own enrollments" ON public.formation_enrollments
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Admins can manage all enrollments" ON public.formation_enrollments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- Coaching Bookings
DROP POLICY IF EXISTS "Admins can update bookings" ON public.coaching_bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.coaching_bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.coaching_bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON public.coaching_bookings;

CREATE POLICY "Users can manage own bookings" ON public.coaching_bookings
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Admins can manage all bookings" ON public.coaching_bookings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- Trainer Applications
DROP POLICY IF EXISTS "Admins can update applications" ON public.trainer_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.trainer_applications;
DROP POLICY IF EXISTS "Users can create applications" ON public.trainer_applications;
DROP POLICY IF EXISTS "Users can view own applications" ON public.trainer_applications;

CREATE POLICY "Users can manage own applications" ON public.trainer_applications
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Admins can manage all applications" ON public.trainer_applications
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- Trainer Profiles
DROP POLICY IF EXISTS "Admins can manage all trainer profiles" ON public.trainer_profiles;
DROP POLICY IF EXISTS "Trainers can create own profile" ON public.trainer_profiles;
DROP POLICY IF EXISTS "Trainers can update own profile" ON public.trainer_profiles;
DROP POLICY IF EXISTS "Trainers can view own profile" ON public.trainer_profiles;

CREATE POLICY "Trainers can manage own profile" ON public.trainer_profiles
  FOR ALL TO authenticated
  USING (profile_id = (select auth.uid()))
  WITH CHECK (profile_id = (select auth.uid()));

CREATE POLICY "Admins can manage trainer profiles" ON public.trainer_profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );
