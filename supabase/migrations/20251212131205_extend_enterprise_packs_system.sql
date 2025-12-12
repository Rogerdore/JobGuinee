/*
  # Extend Enterprise Subscriptions System with Complete Pack Support

  ## Overview
  Étend le système enterprise_subscriptions existant pour supporter les 4 packs complets:
  - ENTERPRISE BASIC
  - ENTERPRISE PRO  
  - ENTERPRISE GOLD
  - CABINET RH

  ## 1. Modifications Tables Existantes
  
  ### `enterprise_subscriptions`
  - Étend les types de subscription_type pour inclure tous les packs
  - Ajoute les champs de limites manquants:
    - `max_active_jobs` - Nombre max d'offres actives
    - `max_monthly_matching` - Nombre max de matching IA par mois
    - `matching_consumed` - Nombre de matching IA consommés ce mois
    - `features` (jsonb) - Fonctionnalités activées par pack
  
  ## 2. Nouvelles Tables
  
  ### `enterprise_usage_tracking`
  - Track détaillé de l'utilisation des services
  - Historique pour analytics et ROI
  
  ### `premium_services_activations`
  - Activation de services premium à l'unité (offre à la une, etc.)
  
  ## 3. Security
  - RLS stricte sur toutes les tables
  - Validation GOLD obligatoire
  - Audit logs des usages
*/

-- ============================================================================
-- 1. EXTEND enterprise_subscriptions TABLE
-- ============================================================================

-- Drop old constraint and add new one with all pack types
DO $$
BEGIN
  -- Drop existing constraint
  ALTER TABLE enterprise_subscriptions 
  DROP CONSTRAINT IF EXISTS enterprise_subscriptions_subscription_type_check;
  
  -- Add new constraint with all pack types
  ALTER TABLE enterprise_subscriptions
  ADD CONSTRAINT enterprise_subscriptions_subscription_type_check 
  CHECK (subscription_type IN ('basic', 'silver', 'gold', 'enterprise_basic', 'enterprise_pro', 'enterprise_gold', 'cabinet_rh'));
END $$;

-- Add new columns for limits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enterprise_subscriptions' AND column_name = 'max_active_jobs'
  ) THEN
    ALTER TABLE enterprise_subscriptions ADD COLUMN max_active_jobs integer DEFAULT 5;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enterprise_subscriptions' AND column_name = 'max_monthly_matching'
  ) THEN
    ALTER TABLE enterprise_subscriptions ADD COLUMN max_monthly_matching integer DEFAULT 150;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enterprise_subscriptions' AND column_name = 'matching_consumed'
  ) THEN
    ALTER TABLE enterprise_subscriptions ADD COLUMN matching_consumed integer DEFAULT 0 CHECK (matching_consumed >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enterprise_subscriptions' AND column_name = 'features'
  ) THEN
    ALTER TABLE enterprise_subscriptions ADD COLUMN features jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enterprise_subscriptions' AND column_name = 'daily_matching_limit'
  ) THEN
    ALTER TABLE enterprise_subscriptions ADD COLUMN daily_matching_limit integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enterprise_subscriptions' AND column_name = 'matching_consumed_today'
  ) THEN
    ALTER TABLE enterprise_subscriptions ADD COLUMN matching_consumed_today integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enterprise_subscriptions' AND column_name = 'last_matching_reset'
  ) THEN
    ALTER TABLE enterprise_subscriptions ADD COLUMN last_matching_reset timestamptz DEFAULT now();
  END IF;
END $$;

-- ============================================================================
-- 2. CREATE enterprise_usage_tracking TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS enterprise_usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES enterprise_subscriptions(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Type d'usage
  usage_type text NOT NULL CHECK (usage_type IN ('cv_view', 'matching_ai', 'export', 'communication', 'job_post', 'interview_schedule')),
  
  -- Détails
  job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  application_id uuid REFERENCES applications(id) ON DELETE SET NULL,
  candidate_profile_id uuid REFERENCES candidate_profiles(id) ON DELETE SET NULL,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  
  -- Timestamps
  used_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_subscription ON enterprise_usage_tracking(subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_company ON enterprise_usage_tracking(company_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_type ON enterprise_usage_tracking(usage_type);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_used_at ON enterprise_usage_tracking(used_at DESC);

-- ============================================================================
-- 3. CREATE premium_services_activations TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS premium_services_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Service
  service_type text NOT NULL CHECK (service_type IN ('featured_job_7d', 'featured_job_30d', 'featured_job_60d', 'featured_profile_30d', 'targeted_campaign_7d')),
  service_name text NOT NULL,
  price_gnf numeric NOT NULL,
  
  -- Target
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  
  -- Paiement
  payment_method text DEFAULT 'orange_money',
  payment_reference text UNIQUE,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'waiting_proof', 'completed', 'failed', 'cancelled')),
  payment_proof_url text,
  
  -- Activation
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  activated_at timestamptz,
  expires_at timestamptz,
  
  -- Admin
  admin_notes text,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_premium_services_company ON premium_services_activations(company_id);
CREATE INDEX IF NOT EXISTS idx_premium_services_profile ON premium_services_activations(profile_id);
CREATE INDEX IF NOT EXISTS idx_premium_services_job ON premium_services_activations(job_id);
CREATE INDEX IF NOT EXISTS idx_premium_services_status ON premium_services_activations(status);
CREATE INDEX IF NOT EXISTS idx_premium_services_type ON premium_services_activations(service_type);

-- ============================================================================
-- 4. RLS POLICIES
-- ============================================================================

-- enterprise_usage_tracking policies
ALTER TABLE enterprise_usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can view own usage tracking"
  ON enterprise_usage_tracking
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM companies WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all usage tracking"
  ON enterprise_usage_tracking
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

CREATE POLICY "System can insert usage tracking"
  ON enterprise_usage_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- premium_services_activations policies
ALTER TABLE premium_services_activations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can view own premium services"
  ON premium_services_activations
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM companies WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Companies can create premium services"
  ON premium_services_activations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT id FROM companies WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all premium services"
  ON premium_services_activations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update premium services"
  ON premium_services_activations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- ============================================================================
-- 5. FUNCTIONS
-- ============================================================================

-- Function: Get active enterprise subscription for company
CREATE OR REPLACE FUNCTION public.get_active_enterprise_subscription(company_id_param uuid)
RETURNS TABLE (
  id uuid,
  subscription_type text,
  max_active_jobs integer,
  monthly_cv_quota integer,
  cv_consumed integer,
  max_monthly_matching integer,
  matching_consumed integer,
  features jsonb,
  status text,
  end_date timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    es.id,
    es.subscription_type,
    es.max_active_jobs,
    es.monthly_cv_quota,
    es.cv_consumed,
    es.max_monthly_matching,
    es.matching_consumed,
    es.features,
    es.status,
    es.end_date
  FROM enterprise_subscriptions es
  WHERE es.company_id = company_id_param
    AND es.status = 'active'
    AND (es.end_date IS NULL OR es.end_date > now())
  ORDER BY es.created_at DESC
  LIMIT 1;
END;
$$;

-- Function: Check if company can perform action (limits)
CREATE OR REPLACE FUNCTION public.can_use_enterprise_feature(
  company_id_param uuid,
  feature_type text,
  count_requested integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription enterprise_subscriptions%ROWTYPE;
  v_active_jobs_count integer;
BEGIN
  -- Get active subscription
  SELECT * INTO v_subscription
  FROM enterprise_subscriptions
  WHERE company_id = company_id_param
    AND status = 'active'
    AND (end_date IS NULL OR end_date > now())
  ORDER BY created_at DESC
  LIMIT 1;

  -- No active subscription
  IF v_subscription.id IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'no_active_subscription',
      'message', 'Aucun abonnement enterprise actif'
    );
  END IF;

  -- Check feature type
  CASE feature_type
    WHEN 'cv_view' THEN
      IF v_subscription.monthly_cv_quota IS NULL THEN
        -- Unlimited for GOLD
        RETURN jsonb_build_object('allowed', true, 'unlimited', true);
      ELSIF v_subscription.cv_consumed + count_requested > v_subscription.monthly_cv_quota THEN
        RETURN jsonb_build_object(
          'allowed', false,
          'reason', 'cv_quota_exceeded',
          'message', 'Quota mensuel de CV atteint',
          'current', v_subscription.cv_consumed,
          'limit', v_subscription.monthly_cv_quota
        );
      ELSE
        RETURN jsonb_build_object('allowed', true);
      END IF;

    WHEN 'matching_ai' THEN
      IF v_subscription.max_monthly_matching IS NULL THEN
        -- Check daily limit for GOLD
        IF v_subscription.daily_matching_limit IS NOT NULL THEN
          IF v_subscription.matching_consumed_today + count_requested > v_subscription.daily_matching_limit THEN
            RETURN jsonb_build_object(
              'allowed', false,
              'reason', 'daily_matching_limit',
              'message', 'Limite journalière de matching IA atteinte',
              'current', v_subscription.matching_consumed_today,
              'limit', v_subscription.daily_matching_limit
            );
          END IF;
        END IF;
        RETURN jsonb_build_object('allowed', true);
      ELSIF v_subscription.matching_consumed + count_requested > v_subscription.max_monthly_matching THEN
        RETURN jsonb_build_object(
          'allowed', false,
          'reason', 'matching_quota_exceeded',
          'message', 'Quota mensuel de matching IA atteint',
          'current', v_subscription.matching_consumed,
          'limit', v_subscription.max_monthly_matching
        );
      ELSE
        RETURN jsonb_build_object('allowed', true);
      END IF;

    WHEN 'job_post' THEN
      -- Count active jobs
      SELECT COUNT(*) INTO v_active_jobs_count
      FROM jobs
      WHERE company_id = company_id_param
        AND status IN ('published', 'draft');

      IF v_active_jobs_count >= v_subscription.max_active_jobs THEN
        RETURN jsonb_build_object(
          'allowed', false,
          'reason', 'max_jobs_reached',
          'message', 'Nombre maximum d''offres actives atteint',
          'current', v_active_jobs_count,
          'limit', v_subscription.max_active_jobs
        );
      ELSE
        RETURN jsonb_build_object('allowed', true);
      END IF;

    ELSE
      RETURN jsonb_build_object('allowed', true);
  END CASE;
END;
$$;

-- Function: Track enterprise usage
CREATE OR REPLACE FUNCTION public.track_enterprise_usage(
  company_id_param uuid,
  usage_type_param text,
  metadata_param jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription_id uuid;
BEGIN
  -- Get active subscription
  SELECT id INTO v_subscription_id
  FROM enterprise_subscriptions
  WHERE company_id = company_id_param
    AND status = 'active'
    AND (end_date IS NULL OR end_date > now())
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_subscription_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'No active subscription'
    );
  END IF;

  -- Insert tracking record
  INSERT INTO enterprise_usage_tracking (
    subscription_id,
    company_id,
    usage_type,
    metadata
  ) VALUES (
    v_subscription_id,
    company_id_param,
    usage_type_param,
    metadata_param
  );

  -- Update consumption counters
  IF usage_type_param = 'cv_view' THEN
    UPDATE enterprise_subscriptions
    SET cv_consumed = cv_consumed + 1,
        updated_at = now()
    WHERE id = v_subscription_id;
  ELSIF usage_type_param = 'matching_ai' THEN
    UPDATE enterprise_subscriptions
    SET matching_consumed = matching_consumed + 1,
        matching_consumed_today = matching_consumed_today + 1,
        updated_at = now()
    WHERE id = v_subscription_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', v_subscription_id
  );
END;
$$;

-- ============================================================================
-- 6. TRIGGER TO RESET DAILY COUNTERS
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_daily_matching_counter()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Reset daily counter if last reset was yesterday or earlier
  IF NEW.last_matching_reset IS NULL OR 
     DATE(NEW.last_matching_reset) < CURRENT_DATE THEN
    NEW.matching_consumed_today := 0;
    NEW.last_matching_reset := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_reset_daily_matching ON enterprise_subscriptions;
CREATE TRIGGER trigger_reset_daily_matching
  BEFORE UPDATE ON enterprise_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION reset_daily_matching_counter();