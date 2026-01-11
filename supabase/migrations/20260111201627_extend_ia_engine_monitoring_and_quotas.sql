/*
  # Extension Moteur IA - Monitoring, Quotas et Analytics

  1. Vues Analytics
    - `v_ia_service_stats`: Statistiques par service IA
    - `v_ia_user_consumption`: Consommation par utilisateur
    - `v_ia_daily_metrics`: Métriques quotidiennes

  2. Quotas et Alertes
    - `ia_service_quotas`: Quotas configurables par service et user_type
    - `ia_consumption_alerts`: Alertes de seuils de consommation

  3. Configuration Avancée
    - Extensions pour CVThèque (scoring weights, search params)
    - Paramètres de performance et cache

  4. Fonctions RPC
    - `get_ia_service_stats()`: Stats admin
    - `get_user_ia_consumption()`: Conso utilisateur
    - `check_service_quota()`: Vérification quota avant usage

  5. Principe
    - AUCUNE duplication de tables ou logique existante
    - Extension UNIQUEMENT via vues, fonctions et tables de config
    - Compatibilité totale avec l'existant

  Note: Utilise les tables existantes:
    - ia_service_config (configs services)
    - ai_service_usage_history (logs usage)
    - wallet + wallet_logs (crédits)
    - service_credit_costs (tarifs)
*/

-- =========================================
-- 1. VUES ANALYTICS (lecture seule, pas de duplication)
-- =========================================

-- Vue: Statistiques par service IA
CREATE OR REPLACE VIEW v_ia_service_stats AS
SELECT
  s.service_code,
  s.service_name,
  s.category,
  s.is_active,
  c.credits_cost,
  COUNT(u.id) as total_uses,
  COUNT(DISTINCT u.user_id) as unique_users,
  SUM(u.credits_consumed) as total_credits_consumed,
  AVG(u.credits_consumed) as avg_credits_per_use,
  MIN(u.created_at) as first_use_at,
  MAX(u.created_at) as last_use_at,
  COUNT(u.id) FILTER (WHERE u.created_at >= now() - interval '24 hours') as uses_last_24h,
  COUNT(u.id) FILTER (WHERE u.created_at >= now() - interval '7 days') as uses_last_7d,
  COUNT(u.id) FILTER (WHERE u.created_at >= now() - interval '30 days') as uses_last_30d
FROM ia_service_config s
LEFT JOIN service_credit_costs c ON c.service_code = s.service_code
LEFT JOIN ai_service_usage_history u ON u.service_key = s.service_code
GROUP BY s.service_code, s.service_name, s.category, s.is_active, c.credits_cost
ORDER BY total_uses DESC NULLS LAST;

COMMENT ON VIEW v_ia_service_stats IS
'Vue analytics des services IA - monitoring centralisé sans duplication de données';

-- Vue: Consommation par utilisateur
CREATE OR REPLACE VIEW v_ia_user_consumption AS
SELECT
  p.id as user_id,
  p.user_type,
  p.credits_balance as current_balance,
  COUNT(u.id) as total_ia_uses,
  SUM(u.credits_consumed) as total_credits_spent,
  COUNT(DISTINCT u.service_key) as services_used_count,
  MAX(u.created_at) as last_ia_use_at,
  COUNT(u.id) FILTER (WHERE u.created_at >= now() - interval '24 hours') as uses_today,
  SUM(u.credits_consumed) FILTER (WHERE u.created_at >= now() - interval '24 hours') as credits_today,
  COUNT(u.id) FILTER (WHERE u.created_at >= now() - interval '7 days') as uses_this_week,
  SUM(u.credits_consumed) FILTER (WHERE u.created_at >= now() - interval '7 days') as credits_this_week,
  COUNT(u.id) FILTER (WHERE u.created_at >= now() - interval '30 days') as uses_this_month,
  SUM(u.credits_consumed) FILTER (WHERE u.created_at >= now() - interval '30 days') as credits_this_month
FROM profiles p
LEFT JOIN ai_service_usage_history u ON u.user_id = p.id
GROUP BY p.id, p.user_type, p.credits_balance
ORDER BY total_credits_spent DESC NULLS LAST;

COMMENT ON VIEW v_ia_user_consumption IS
'Vue consommation IA par utilisateur - tracking agrégé';

-- Vue: Métriques quotidiennes
CREATE OR REPLACE VIEW v_ia_daily_metrics AS
SELECT
  DATE(u.created_at) as date,
  u.service_key,
  s.service_name,
  COUNT(u.id) as daily_uses,
  COUNT(DISTINCT u.user_id) as daily_unique_users,
  SUM(u.credits_consumed) as daily_credits_consumed,
  AVG(u.credits_consumed) as avg_credits_per_use
FROM ai_service_usage_history u
JOIN ia_service_config s ON s.service_code = u.service_key
WHERE u.created_at >= now() - interval '90 days'
GROUP BY DATE(u.created_at), u.service_key, s.service_name
ORDER BY date DESC, daily_uses DESC;

COMMENT ON VIEW v_ia_daily_metrics IS
'Vue métriques quotidiennes IA - tendances et patterns';

-- =========================================
-- 2. QUOTAS ET ALERTES (extension, pas duplication)
-- =========================================

-- Table: Quotas par service (configuration uniquement)
CREATE TABLE IF NOT EXISTS ia_service_quotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_code text NOT NULL REFERENCES ia_service_config(service_code) ON DELETE CASCADE,
  user_type text NOT NULL CHECK (user_type IN ('candidate', 'recruiter', 'trainer', 'admin')),

  -- Quotas configurables
  max_daily_uses integer,
  max_weekly_uses integer,
  max_monthly_uses integer,

  -- Quotas crédits
  max_daily_credits integer,
  max_weekly_credits integer,
  max_monthly_credits integer,

  -- Premium bypass
  premium_unlimited boolean DEFAULT false,

  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(service_code, user_type)
);

CREATE INDEX IF NOT EXISTS idx_ia_quotas_service ON ia_service_quotas(service_code);
CREATE INDEX IF NOT EXISTS idx_ia_quotas_user_type ON ia_service_quotas(user_type);

-- RLS
ALTER TABLE ia_service_quotas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ia_service_quotas'
    AND policyname = 'Admins manage quotas'
  ) THEN
    CREATE POLICY "Admins manage quotas"
      ON ia_service_quotas FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND user_type = 'admin'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ia_service_quotas'
    AND policyname = 'Users read quotas'
  ) THEN
    CREATE POLICY "Users read quotas"
      ON ia_service_quotas FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

COMMENT ON TABLE ia_service_quotas IS
'Quotas configurables par service IA et type utilisateur - extension sans duplication';

-- Table: Alertes consommation (tracking dépassements)
CREATE TABLE IF NOT EXISTS ia_consumption_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_code text NOT NULL,
  alert_type text NOT NULL CHECK (alert_type IN ('quota_exceeded', 'threshold_warning', 'low_credits')),
  alert_level text NOT NULL CHECK (alert_level IN ('info', 'warning', 'critical')),

  -- Détails alerte
  message text NOT NULL,
  current_value integer,
  threshold_value integer,
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Notification
  is_notified boolean DEFAULT false,
  notified_at timestamptz,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ia_alerts_user ON ia_consumption_alerts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ia_alerts_service ON ia_consumption_alerts(service_code);
CREATE INDEX IF NOT EXISTS idx_ia_alerts_notified ON ia_consumption_alerts(is_notified) WHERE NOT is_notified;

-- RLS
ALTER TABLE ia_consumption_alerts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ia_consumption_alerts'
    AND policyname = 'Users view own alerts'
  ) THEN
    CREATE POLICY "Users view own alerts"
      ON ia_consumption_alerts FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ia_consumption_alerts'
    AND policyname = 'System inserts alerts'
  ) THEN
    CREATE POLICY "System inserts alerts"
      ON ia_consumption_alerts FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

COMMENT ON TABLE ia_consumption_alerts IS
'Alertes de consommation IA - notifie dépassements quotas ou seuils';

-- =========================================
-- 3. CONFIGURATION AVANCÉE (paramètres supplémentaires)
-- =========================================

-- Table: Paramètres avancés CVThèque (extend config sans dupliquer)
CREATE TABLE IF NOT EXISTS ia_cvtheque_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Scoring weights (personnalisables)
  scoring_weights jsonb DEFAULT '{
    "experience": 40,
    "education": 25,
    "skills": 20,
    "verification": 10,
    "completion": 5
  }'::jsonb,

  -- Search parameters
  search_max_results integer DEFAULT 50,
  search_relevance_threshold numeric DEFAULT 0.6,
  search_boost_verified boolean DEFAULT true,
  search_boost_gold boolean DEFAULT true,

  -- Performance
  enable_cache boolean DEFAULT true,
  cache_duration_minutes integer DEFAULT 60,

  -- Scoring thresholds
  min_visible_score integer DEFAULT 60,
  excellent_score_threshold integer DEFAULT 85,

  -- Active flag
  is_active boolean DEFAULT true,

  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Une seule ligne de config (singleton pattern)
INSERT INTO ia_cvtheque_config (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE ia_cvtheque_config ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ia_cvtheque_config'
    AND policyname = 'Everyone reads cvtheque config'
  ) THEN
    CREATE POLICY "Everyone reads cvtheque config"
      ON ia_cvtheque_config FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ia_cvtheque_config'
    AND policyname = 'Admins update cvtheque config'
  ) THEN
    CREATE POLICY "Admins update cvtheque config"
      ON ia_cvtheque_config FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND user_type = 'admin'
        )
      );
  END IF;
END $$;

COMMENT ON TABLE ia_cvtheque_config IS
'Configuration avancée CVThèque IA - paramètres scoring et recherche';

-- =========================================
-- 4. FONCTIONS RPC (agrégation et helpers)
-- =========================================

-- Fonction: Stats admin (agrégation sans duplication)
CREATE OR REPLACE FUNCTION get_ia_service_stats(
  p_service_code text DEFAULT NULL,
  p_days integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats jsonb;
BEGIN
  IF p_service_code IS NULL THEN
    -- Stats globales tous services
    SELECT jsonb_build_object(
      'total_services', COUNT(DISTINCT s.service_code),
      'active_services', COUNT(DISTINCT s.service_code) FILTER (WHERE s.is_active),
      'total_uses', COUNT(u.id),
      'total_credits_consumed', COALESCE(SUM(u.credits_consumed), 0),
      'unique_users', COUNT(DISTINCT u.user_id),
      'period_days', p_days,
      'period_start', now() - (p_days || ' days')::interval,
      'by_category', (
        SELECT jsonb_object_agg(
          s2.category,
          jsonb_build_object(
            'uses', COUNT(u2.id),
            'credits', COALESCE(SUM(u2.credits_consumed), 0)
          )
        )
        FROM ia_service_config s2
        LEFT JOIN ai_service_usage_history u2 ON u2.service_key = s2.service_code
          AND u2.created_at >= now() - (p_days || ' days')::interval
        GROUP BY s2.category
      )
    )
    INTO v_stats
    FROM ia_service_config s
    LEFT JOIN ai_service_usage_history u ON u.service_key = s.service_code
      AND u.created_at >= now() - (p_days || ' days')::interval;
  ELSE
    -- Stats service spécifique
    SELECT jsonb_build_object(
      'service_code', s.service_code,
      'service_name', s.service_name,
      'category', s.category,
      'is_active', s.is_active,
      'credits_cost', c.credits_cost,
      'total_uses', COUNT(u.id),
      'unique_users', COUNT(DISTINCT u.user_id),
      'total_credits_consumed', COALESCE(SUM(u.credits_consumed), 0),
      'avg_credits_per_use', COALESCE(AVG(u.credits_consumed), 0),
      'uses_today', COUNT(u.id) FILTER (WHERE u.created_at >= CURRENT_DATE),
      'uses_this_week', COUNT(u.id) FILTER (WHERE u.created_at >= date_trunc('week', CURRENT_DATE)),
      'uses_this_month', COUNT(u.id) FILTER (WHERE u.created_at >= date_trunc('month', CURRENT_DATE))
    )
    INTO v_stats
    FROM ia_service_config s
    LEFT JOIN service_credit_costs c ON c.service_code = s.service_code
    LEFT JOIN ai_service_usage_history u ON u.service_key = s.service_code
      AND u.created_at >= now() - (p_days || ' days')::interval
    WHERE s.service_code = p_service_code
    GROUP BY s.service_code, s.service_name, s.category, s.is_active, c.credits_cost;
  END IF;

  RETURN COALESCE(v_stats, '{}'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION get_ia_service_stats TO authenticated;

COMMENT ON FUNCTION get_ia_service_stats IS
'Récupère stats agrégées services IA - utilise tables existantes sans duplication';

-- Fonction: Consommation utilisateur
CREATE OR REPLACE FUNCTION get_user_ia_consumption(
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_consumption jsonb;
  v_target_user_id uuid;
BEGIN
  -- Si pas d'user_id fourni, utiliser l'utilisateur courant
  v_target_user_id := COALESCE(p_user_id, auth.uid());

  SELECT jsonb_build_object(
    'user_id', p.id,
    'user_type', p.user_type,
    'current_balance', p.credits_balance,
    'total_uses', COUNT(u.id),
    'total_credits_spent', COALESCE(SUM(u.credits_consumed), 0),
    'services_used', COUNT(DISTINCT u.service_key),
    'last_use_at', MAX(u.created_at),
    'today', jsonb_build_object(
      'uses', COUNT(u.id) FILTER (WHERE u.created_at >= CURRENT_DATE),
      'credits', COALESCE(SUM(u.credits_consumed) FILTER (WHERE u.created_at >= CURRENT_DATE), 0)
    ),
    'this_week', jsonb_build_object(
      'uses', COUNT(u.id) FILTER (WHERE u.created_at >= date_trunc('week', CURRENT_DATE)),
      'credits', COALESCE(SUM(u.credits_consumed) FILTER (WHERE u.created_at >= date_trunc('week', CURRENT_DATE)), 0)
    ),
    'this_month', jsonb_build_object(
      'uses', COUNT(u.id) FILTER (WHERE u.created_at >= date_trunc('month', CURRENT_DATE)),
      'credits', COALESCE(SUM(u.credits_consumed) FILTER (WHERE u.created_at >= date_trunc('month', CURRENT_DATE)), 0)
    ),
    'by_service', (
      SELECT jsonb_object_agg(
        u2.service_key,
        jsonb_build_object(
          'uses', COUNT(*),
          'credits', SUM(u2.credits_consumed),
          'last_use', MAX(u2.created_at)
        )
      )
      FROM ai_service_usage_history u2
      WHERE u2.user_id = v_target_user_id
      GROUP BY u2.service_key
    )
  )
  INTO v_consumption
  FROM profiles p
  LEFT JOIN ai_service_usage_history u ON u.user_id = p.id
  WHERE p.id = v_target_user_id
  GROUP BY p.id, p.user_type, p.credits_balance;

  RETURN COALESCE(v_consumption, '{}'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_ia_consumption TO authenticated;

COMMENT ON FUNCTION get_user_ia_consumption IS
'Récupère consommation IA utilisateur - agrégation sur tables existantes';

-- Fonction: Vérifier quota avant usage
CREATE OR REPLACE FUNCTION check_service_quota(
  p_user_id uuid,
  p_service_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type text;
  v_is_premium boolean;
  v_quota record;
  v_daily_uses integer;
  v_weekly_uses integer;
  v_monthly_uses integer;
  v_daily_credits integer;
  v_weekly_credits integer;
  v_monthly_credits integer;
BEGIN
  -- Récupérer type et premium
  SELECT user_type,
    CASE
      WHEN premium_subscription_expires_at IS NOT NULL
        AND premium_subscription_expires_at > now()
      THEN true
      ELSE false
    END as is_premium
  INTO v_user_type, v_is_premium
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'USER_NOT_FOUND'
    );
  END IF;

  -- Récupérer quotas configurés
  SELECT * INTO v_quota
  FROM ia_service_quotas
  WHERE service_code = p_service_code
    AND user_type = v_user_type
    AND is_active = true;

  -- Si pas de quota configuré ou premium unlimited, autoriser
  IF NOT FOUND OR (v_quota.premium_unlimited AND v_is_premium) THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'reason', 'NO_QUOTA_OR_PREMIUM'
    );
  END IF;

  -- Compter usage actuel
  SELECT
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as daily_uses,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('week', CURRENT_DATE)) as weekly_uses,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) as monthly_uses,
    COALESCE(SUM(credits_consumed) FILTER (WHERE created_at >= CURRENT_DATE), 0) as daily_credits,
    COALESCE(SUM(credits_consumed) FILTER (WHERE created_at >= date_trunc('week', CURRENT_DATE)), 0) as weekly_credits,
    COALESCE(SUM(credits_consumed) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)), 0) as monthly_credits
  INTO v_daily_uses, v_weekly_uses, v_monthly_uses, v_daily_credits, v_weekly_credits, v_monthly_credits
  FROM ai_service_usage_history
  WHERE user_id = p_user_id
    AND service_key = p_service_code;

  -- Vérifier dépassements
  IF v_quota.max_daily_uses IS NOT NULL AND v_daily_uses >= v_quota.max_daily_uses THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'DAILY_QUOTA_EXCEEDED',
      'current', v_daily_uses,
      'limit', v_quota.max_daily_uses
    );
  END IF;

  IF v_quota.max_weekly_uses IS NOT NULL AND v_weekly_uses >= v_quota.max_weekly_uses THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'WEEKLY_QUOTA_EXCEEDED',
      'current', v_weekly_uses,
      'limit', v_quota.max_weekly_uses
    );
  END IF;

  IF v_quota.max_monthly_uses IS NOT NULL AND v_monthly_uses >= v_quota.max_monthly_uses THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'MONTHLY_QUOTA_EXCEEDED',
      'current', v_monthly_uses,
      'limit', v_quota.max_monthly_uses
    );
  END IF;

  -- Quotas crédits
  IF v_quota.max_daily_credits IS NOT NULL AND v_daily_credits >= v_quota.max_daily_credits THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'DAILY_CREDITS_QUOTA_EXCEEDED',
      'current', v_daily_credits,
      'limit', v_quota.max_daily_credits
    );
  END IF;

  -- Tout OK
  RETURN jsonb_build_object(
    'allowed', true,
    'usage', jsonb_build_object(
      'daily_uses', v_daily_uses,
      'weekly_uses', v_weekly_uses,
      'monthly_uses', v_monthly_uses,
      'daily_credits', v_daily_credits
    ),
    'limits', jsonb_build_object(
      'max_daily_uses', v_quota.max_daily_uses,
      'max_weekly_uses', v_quota.max_weekly_uses,
      'max_monthly_uses', v_quota.max_monthly_uses,
      'max_daily_credits', v_quota.max_daily_credits
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION check_service_quota TO authenticated;

COMMENT ON FUNCTION check_service_quota IS
'Vérifie quotas avant usage service IA - prévention dépassements';

-- =========================================
-- 5. QUOTAS PAR DÉFAUT (configuration initiale)
-- =========================================

-- Quotas par défaut pour CVThèque (exemple)
INSERT INTO ia_service_quotas (service_code, user_type, max_daily_uses, max_weekly_uses, max_monthly_uses, premium_unlimited)
VALUES
  -- Scoring profils (peu coûteux, limites généreuses)
  ('cv_profile_scoring', 'candidate', 50, 200, 500, false),
  ('cv_profile_scoring', 'recruiter', 100, 500, 2000, true),
  ('cv_profile_scoring', 'trainer', 30, 100, 300, false),
  ('cv_profile_scoring', 'admin', NULL, NULL, NULL, true),

  -- Recherche sémantique (plus coûteux, limites strictes)
  ('cv_semantic_search', 'candidate', 5, 20, 50, false),
  ('cv_semantic_search', 'recruiter', 20, 100, 400, true),
  ('cv_semantic_search', 'trainer', 10, 40, 150, false),
  ('cv_semantic_search', 'admin', NULL, NULL, NULL, true)
ON CONFLICT (service_code, user_type) DO NOTHING;
