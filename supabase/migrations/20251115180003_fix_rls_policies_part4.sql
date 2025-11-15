/*
  # Fix Security and Performance Issues - Part 4: Premium & AI Services RLS

  Optimize RLS policies for premium services and AI-related tables.
*/

-- Premium Subscriptions
DROP POLICY IF EXISTS "Users can update own subscription" ON public.premium_subscriptions;
DROP POLICY IF EXISTS "Users can view own subscription" ON public.premium_subscriptions;

CREATE POLICY "Users can manage own subscription" ON public.premium_subscriptions
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Premium Credits
DROP POLICY IF EXISTS "Users can update own credits" ON public.premium_credits;
DROP POLICY IF EXISTS "Users can view own credits" ON public.premium_credits;

CREATE POLICY "Users can manage own credits" ON public.premium_credits
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Premium Transactions
DROP POLICY IF EXISTS "System can insert transactions" ON public.premium_transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.premium_transactions;

CREATE POLICY "Users can view own premium transactions" ON public.premium_transactions
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "System can create premium transactions" ON public.premium_transactions
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Premium Service Usage
DROP POLICY IF EXISTS "System can insert usage" ON public.premium_service_usage;
DROP POLICY IF EXISTS "Users can view own usage" ON public.premium_service_usage;

CREATE POLICY "Users can view own service usage" ON public.premium_service_usage
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "System can record service usage" ON public.premium_service_usage
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- AI Generated Documents
DROP POLICY IF EXISTS "Users can create own AI documents" ON public.ai_generated_documents;
DROP POLICY IF EXISTS "Users can delete own AI documents" ON public.ai_generated_documents;
DROP POLICY IF EXISTS "Users can update own AI documents" ON public.ai_generated_documents;
DROP POLICY IF EXISTS "Users can view own AI documents" ON public.ai_generated_documents;

CREATE POLICY "Users can manage own AI documents" ON public.ai_generated_documents
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- AI Profile Analysis
DROP POLICY IF EXISTS "Users can create own profile analyses" ON public.ai_profile_analysis;
DROP POLICY IF EXISTS "Users can delete own profile analyses" ON public.ai_profile_analysis;
DROP POLICY IF EXISTS "Users can update own profile analyses" ON public.ai_profile_analysis;
DROP POLICY IF EXISTS "Users can view own profile analyses" ON public.ai_profile_analysis;

CREATE POLICY "Users can manage own profile analyses" ON public.ai_profile_analysis
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Social Media Configuration
DROP POLICY IF EXISTS "Seuls les admins peuvent insérer la configuration" ON public.social_media_configuration;
DROP POLICY IF EXISTS "Seuls les admins peuvent modifier la configuration" ON public.social_media_configuration;
DROP POLICY IF EXISTS "Seuls les admins peuvent supprimer la configuration" ON public.social_media_configuration;

CREATE POLICY "Admins can manage social media config" ON public.social_media_configuration
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- Credit Packages
DROP POLICY IF EXISTS "Admins can manage packages" ON public.credit_packages;

CREATE POLICY "Admins can manage credit packages" ON public.credit_packages
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

-- User Credit Balances
DROP POLICY IF EXISTS "Admins can view all balances" ON public.user_credit_balances;
DROP POLICY IF EXISTS "Users can view own balance" ON public.user_credit_balances;

CREATE POLICY "Users can view own credit balance" ON public.user_credit_balances
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Admins can view all credit balances" ON public.user_credit_balances
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- Credit Transactions
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.credit_transactions;

CREATE POLICY "Users can view own credit transactions" ON public.credit_transactions
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Admins can view all credit transactions" ON public.credit_transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- Service Credit Costs
DROP POLICY IF EXISTS "Admins can manage service costs" ON public.service_credit_costs;

CREATE POLICY "Admins can manage service costs" ON public.service_credit_costs
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

-- Job Publication Payments
DROP POLICY IF EXISTS "Admins can manage all payments" ON public.job_publication_payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.job_publication_payments;
DROP POLICY IF EXISTS "Recruiters can view own company payments" ON public.job_publication_payments;

CREATE POLICY "Recruiters can view company payments" ON public.job_publication_payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.company_id = job_publication_payments.company_id
    )
  );

CREATE POLICY "Admins can manage job payments" ON public.job_publication_payments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );

-- Job Description Formatting
DROP POLICY IF EXISTS "Admins can delete formatting configs" ON public.job_description_formatting;
DROP POLICY IF EXISTS "Admins can insert formatting configs" ON public.job_description_formatting;
DROP POLICY IF EXISTS "Admins can update formatting configs" ON public.job_description_formatting;
DROP POLICY IF EXISTS "Admins can view all formatting configs" ON public.job_description_formatting;

CREATE POLICY "Admins can manage formatting configs" ON public.job_description_formatting
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.user_type = 'admin'
    )
  );
