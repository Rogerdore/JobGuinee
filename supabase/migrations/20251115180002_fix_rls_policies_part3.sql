/*
  # Fix Security and Performance Issues - Part 3: More RLS Policy Optimizations

  Continue optimizing RLS policies for better performance.
*/

-- API Keys
DROP POLICY IF EXISTS "Admins can delete API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Admins can insert API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Admins can read API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Admins can update API keys" ON public.api_keys;

CREATE POLICY "Admins can manage API keys" ON public.api_keys
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- Resources
DROP POLICY IF EXISTS "Admins can delete resources" ON public.resources;
DROP POLICY IF EXISTS "Admins can insert resources" ON public.resources;
DROP POLICY IF EXISTS "Admins can update resources" ON public.resources;

CREATE POLICY "Admins can manage resources" ON public.resources
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

-- Job Alert History
DROP POLICY IF EXISTS "Users can view own alert history" ON public.job_alert_history;

CREATE POLICY "Users can view own alert history" ON public.job_alert_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.job_alerts
      WHERE job_alerts.id = job_alert_history.alert_id
      AND job_alerts.user_id = (select auth.uid())
    )
  );

-- Job Alerts - Remove duplicates
DROP POLICY IF EXISTS "Users can create own alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can create own job alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can delete own alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can delete own job alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can update own alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can update own job alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can view own alerts" ON public.job_alerts;
DROP POLICY IF EXISTS "Users can view own job alerts" ON public.job_alerts;

CREATE POLICY "Users can manage own job alerts" ON public.job_alerts
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Candidate Documents
DROP POLICY IF EXISTS "Users can create own documents" ON public.candidate_documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON public.candidate_documents;
DROP POLICY IF EXISTS "Users can update own documents" ON public.candidate_documents;
DROP POLICY IF EXISTS "Users can view own documents" ON public.candidate_documents;

CREATE POLICY "Users can manage own documents" ON public.candidate_documents
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Workflow Stages
DROP POLICY IF EXISTS "Companies can manage their workflow stages" ON public.workflow_stages;

CREATE POLICY "Companies can manage their workflow stages" ON public.workflow_stages
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.company_id = workflow_stages.company_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.company_id = workflow_stages.company_id
    )
  );

-- Conversations
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view conversations they are part of" ON public.conversations;

CREATE POLICY "Users can manage their conversations" ON public.conversations
  FOR ALL TO authenticated
  USING (
    participant_one_id = (select auth.uid()) OR
    participant_two_id = (select auth.uid())
  )
  WITH CHECK (
    participant_one_id = (select auth.uid()) OR
    participant_two_id = (select auth.uid())
  );

-- Messages
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;

CREATE POLICY "Users can view messages in conversations" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.participant_one_id = (select auth.uid())
           OR conversations.participant_two_id = (select auth.uid()))
    )
  );

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.participant_one_id = (select auth.uid())
           OR conversations.participant_two_id = (select auth.uid()))
    )
  );

CREATE POLICY "Users can update own messages" ON public.messages
  FOR UPDATE TO authenticated
  USING (sender_id = (select auth.uid()));

-- Conversation Participants
DROP POLICY IF EXISTS "Users can create participation records" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update their participation records" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view their participation records" ON public.conversation_participants;

CREATE POLICY "Users can manage their participation" ON public.conversation_participants
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));
