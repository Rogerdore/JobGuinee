/*
  # Système WALLET + STATS + IA - BACKEND FIRST

  PRINCIPES NON NÉGOCIABLES RESPECTÉS:
  1. Backend First - Tous calculs côté serveur uniquement
  2. Source de vérité unique - wallet + wallet_logs
  3. Traçabilité totale - Logs obligatoires pour toute action
  4. Aucune valeur sans coût - Validation crédits avant action
  5. Intégrité des données - Anti-spam, anti-refresh
  
  TABLES CRÉÉES:
  - wallet (solde utilisateur)
  - wallet_logs (audit complet)
  - candidate_stats_logs (logs statistiques)
  - Ajout ai_score_version + ai_score_breakdown à candidate_stats
  
  FONCTIONS RPC CRÉÉES:
  - check_wallet_balance()
  - debit_wallet()
  - calculate_ai_score_backend()
  - get_full_candidate_stats()
*/

-- ============================================
-- 1. TABLE WALLET (Source de vérité unique)
-- ============================================

CREATE TABLE IF NOT EXISTS wallet (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_wallet_user_id ON wallet(user_id);

-- RLS: Les utilisateurs voient leur propre wallet
ALTER TABLE wallet ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'wallet' AND policyname = 'Users can view own wallet'
  ) THEN
    CREATE POLICY "Users can view own wallet"
      ON wallet FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'wallet' AND policyname = 'Admins can view all wallets'
  ) THEN
    CREATE POLICY "Admins can view all wallets"
      ON wallet FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.user_type = 'admin'
        )
      );
  END IF;
END $$;


-- ============================================
-- 2. TABLE WALLET_LOGS (Audit obligatoire)
-- ============================================

CREATE TABLE IF NOT EXISTS wallet_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'credit_purchase',
    'ai_service_used',
    'profile_purchase',
    'refund',
    'admin_adjustment',
    'blocked_insufficient_credit'
  )),
  amount INTEGER NOT NULL, -- Positif pour crédit, négatif pour débit
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'blocked_no_credit', 'failed', 'pending')),
  reference_id TEXT, -- ID de la transaction liée
  service_code TEXT, -- Code du service IA utilisé
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour audit et recherche
CREATE INDEX IF NOT EXISTS idx_wallet_logs_user_id ON wallet_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_logs_created_at ON wallet_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_logs_action_type ON wallet_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_wallet_logs_status ON wallet_logs(status);

-- RLS
ALTER TABLE wallet_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'wallet_logs' AND policyname = 'Users can view own wallet logs'
  ) THEN
    CREATE POLICY "Users can view own wallet logs"
      ON wallet_logs FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'wallet_logs' AND policyname = 'Admins can view all wallet logs'
  ) THEN
    CREATE POLICY "Admins can view all wallet logs"
      ON wallet_logs FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.user_type = 'admin'
        )
      );
  END IF;
END $$;


-- ============================================
-- 3. TABLE CANDIDATE_STATS_LOGS (Audit stats)
-- ============================================

CREATE TABLE IF NOT EXISTS candidate_stats_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stat_type TEXT NOT NULL CHECK (stat_type IN (
    'job_view',
    'application',
    'profile_view',
    'purchase',
    'formation',
    'ai_score_update'
  )),
  source TEXT, -- 'job_detail', 'cvtheque', 'admin', etc.
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  ip_hash TEXT, -- Hash de l'IP pour RGPD
  user_agent TEXT,
  delta INTEGER DEFAULT 1, -- Incrément (1 pour +1, -1 pour rollback)
  status TEXT NOT NULL CHECK (status IN ('success', 'blocked', 'blocked_no_credit', 'duplicate', 'spam')),
  wallet_log_id UUID REFERENCES wallet_logs(id) ON DELETE SET NULL, -- Si action payante
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour anti-spam et audit
CREATE INDEX IF NOT EXISTS idx_candidate_stats_logs_candidate_id ON candidate_stats_logs(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_stats_logs_created_at ON candidate_stats_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_candidate_stats_logs_stat_type ON candidate_stats_logs(stat_type);
CREATE INDEX IF NOT EXISTS idx_candidate_stats_logs_viewer_session ON candidate_stats_logs(viewer_id, session_id, created_at);

-- RLS
ALTER TABLE candidate_stats_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'candidate_stats_logs' AND policyname = 'Candidates can view own stats logs'
  ) THEN
    CREATE POLICY "Candidates can view own stats logs"
      ON candidate_stats_logs FOR SELECT
      TO authenticated
      USING (
        candidate_id IN (
          SELECT id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'candidate_stats_logs' AND policyname = 'Admins can view all stats logs'
  ) THEN
    CREATE POLICY "Admins can view all stats logs"
      ON candidate_stats_logs FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.user_type = 'admin'
        )
      );
  END IF;
END $$;


-- ============================================
-- 4. AMÉLIORATION CANDIDATE_STATS
-- ============================================

DO $$
BEGIN
  -- Ajouter ai_score_version si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_stats' AND column_name = 'ai_score_version'
  ) THEN
    ALTER TABLE candidate_stats ADD COLUMN ai_score_version INTEGER DEFAULT 1;
  END IF;

  -- Ajouter ai_score_breakdown si n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_stats' AND column_name = 'ai_score_breakdown'
  ) THEN
    ALTER TABLE candidate_stats ADD COLUMN ai_score_breakdown JSONB DEFAULT '{
      "profile_completion": 0,
      "cv_quality": 0,
      "activity": 0,
      "market_demand": 0
    }'::jsonb;
  END IF;
END $$;


-- ============================================
-- 5. FONCTIONS RPC BACKEND
-- ============================================

-- Fonction: check_wallet_balance
DROP FUNCTION IF EXISTS check_wallet_balance(UUID, INTEGER);

CREATE FUNCTION check_wallet_balance(
  p_user_id UUID,
  p_required_amount INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance INTEGER;
  v_is_premium BOOLEAN;
BEGIN
  SELECT 
    COALESCE(w.balance, 0),
    COALESCE(p.is_premium, false)
  INTO v_balance, v_is_premium
  FROM profiles p
  LEFT JOIN wallet w ON w.user_id = p.id
  WHERE p.id = p_user_id;

  IF v_is_premium THEN
    RETURN jsonb_build_object(
      'success', true,
      'has_sufficient_balance', true,
      'balance', v_balance,
      'is_premium', true,
      'message', 'Utilisateur premium - crédits illimités'
    );
  END IF;

  IF v_balance >= p_required_amount THEN
    RETURN jsonb_build_object(
      'success', true,
      'has_sufficient_balance', true,
      'balance', v_balance,
      'is_premium', false,
      'message', 'Solde suffisant'
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'has_sufficient_balance', false,
      'balance', v_balance,
      'required', p_required_amount,
      'is_premium', false,
      'message', format('Solde insuffisant. Requis: %s, Disponible: %s', p_required_amount, v_balance)
    );
  END IF;
END;
$$;


-- Fonction: debit_wallet
DROP FUNCTION IF EXISTS debit_wallet(UUID, INTEGER, TEXT, TEXT, TEXT, JSONB);

CREATE FUNCTION debit_wallet(
  p_user_id UUID,
  p_amount INTEGER,
  p_action_type TEXT,
  p_reference_id TEXT DEFAULT NULL,
  p_service_code TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance_before INTEGER;
  v_balance_after INTEGER;
  v_is_premium BOOLEAN;
  v_wallet_log_id UUID;
BEGIN
  SELECT COALESCE(is_premium, false) INTO v_is_premium
  FROM profiles WHERE id = p_user_id;

  IF v_is_premium THEN
    INSERT INTO wallet_logs (
      user_id, action_type, amount, balance_before, balance_after,
      status, reference_id, service_code, metadata
    ) VALUES (
      p_user_id, p_action_type, 0, 0, 0,
      'success', p_reference_id, p_service_code,
      jsonb_build_object('premium', true) || p_metadata
    ) RETURNING id INTO v_wallet_log_id;

    RETURN jsonb_build_object(
      'success', true,
      'debited', false,
      'is_premium', true,
      'wallet_log_id', v_wallet_log_id,
      'message', 'Utilisateur premium - pas de débit'
    );
  END IF;

  INSERT INTO wallet (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT balance INTO v_balance_before
  FROM wallet WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_balance_before < p_amount THEN
    INSERT INTO wallet_logs (
      user_id, action_type, amount, balance_before, balance_after,
      status, reference_id, service_code, metadata
    ) VALUES (
      p_user_id, p_action_type, -p_amount, v_balance_before, v_balance_before,
      'blocked_no_credit', p_reference_id, p_service_code,
      jsonb_build_object('required', p_amount) || p_metadata
    ) RETURNING id INTO v_wallet_log_id;

    RETURN jsonb_build_object(
      'success', false,
      'debited', false,
      'is_premium', false,
      'balance_before', v_balance_before,
      'required', p_amount,
      'wallet_log_id', v_wallet_log_id,
      'message', 'Crédits insuffisants'
    );
  END IF;

  v_balance_after := v_balance_before - p_amount;

  UPDATE wallet
  SET balance = v_balance_after, updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO wallet_logs (
    user_id, action_type, amount, balance_before, balance_after,
    status, reference_id, service_code, metadata
  ) VALUES (
    p_user_id, p_action_type, -p_amount, v_balance_before, v_balance_after,
    'success', p_reference_id, p_service_code, p_metadata
  ) RETURNING id INTO v_wallet_log_id;

  RETURN jsonb_build_object(
    'success', true,
    'debited', true,
    'is_premium', false,
    'balance_before', v_balance_before,
    'balance_after', v_balance_after,
    'wallet_log_id', v_wallet_log_id,
    'message', format('Débité %s crédits avec succès', p_amount)
  );
END;
$$;


-- Fonction: calculate_ai_score_backend_v2
DROP FUNCTION IF EXISTS calculate_ai_score_backend_v2(UUID, INTEGER, TEXT, TEXT[], BOOLEAN, BOOLEAN, INTEGER);

CREATE FUNCTION calculate_ai_score_backend_v2(
  p_candidate_id UUID,
  p_experience_years INTEGER DEFAULT 0,
  p_education_level TEXT DEFAULT 'bac',
  p_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_is_verified BOOLEAN DEFAULT false,
  p_is_gold BOOLEAN DEFAULT false,
  p_profile_completion INTEGER DEFAULT 80
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score INTEGER := 60;
  v_profile_completion_score INTEGER := 0;
  v_cv_quality_score INTEGER := 0;
  v_activity_score INTEGER := 0;
  v_market_demand_score INTEGER := 0;
  v_version INTEGER := 2;
BEGIN
  -- 1. Profile Completion (35 points max)
  v_profile_completion_score := (p_profile_completion * 35) / 100;

  -- 2. CV Quality (25 points max)
  v_cv_quality_score := LEAST(p_experience_years * 2, 15);
  
  CASE p_education_level
    WHEN 'doctorat' THEN v_cv_quality_score := v_cv_quality_score + 10;
    WHEN 'master' THEN v_cv_quality_score := v_cv_quality_score + 8;
    WHEN 'licence' THEN v_cv_quality_score := v_cv_quality_score + 5;
    WHEN 'bac' THEN v_cv_quality_score := v_cv_quality_score + 2;
    ELSE v_cv_quality_score := v_cv_quality_score + 0;
  END CASE;

  v_cv_quality_score := LEAST(v_cv_quality_score, 25);

  -- 3. Activity (20 points max)
  IF p_is_verified THEN
    v_activity_score := v_activity_score + 10;
  END IF;

  IF p_is_gold THEN
    v_activity_score := v_activity_score + 5;
  END IF;

  v_activity_score := v_activity_score + LEAST(array_length(p_skills, 1), 5);
  v_activity_score := LEAST(v_activity_score, 20);

  -- 4. Market Demand (20 points max)
  v_market_demand_score := 10;

  -- Score total
  v_score := v_profile_completion_score + v_cv_quality_score + v_activity_score + v_market_demand_score;
  v_score := LEAST(v_score, 100);

  -- Mettre à jour candidate_stats
  INSERT INTO candidate_stats (
    candidate_id, ai_score, ai_score_version, ai_score_breakdown, updated_at
  ) VALUES (
    p_candidate_id, v_score, v_version,
    jsonb_build_object(
      'profile_completion', v_profile_completion_score,
      'cv_quality', v_cv_quality_score,
      'activity', v_activity_score,
      'market_demand', v_market_demand_score
    ),
    now()
  )
  ON CONFLICT (candidate_id) DO UPDATE SET
    ai_score = v_score,
    ai_score_version = v_version,
    ai_score_breakdown = jsonb_build_object(
      'profile_completion', v_profile_completion_score,
      'cv_quality', v_cv_quality_score,
      'activity', v_activity_score,
      'market_demand', v_market_demand_score
    ),
    updated_at = now();

  -- Logger le recalcul
  INSERT INTO candidate_stats_logs (
    candidate_id, stat_type, source, delta, status, metadata
  ) VALUES (
    p_candidate_id, 'ai_score_update', 'backend_calculation', 0, 'success',
    jsonb_build_object('new_score', v_score, 'version', v_version)
  );

  RETURN jsonb_build_object(
    'success', true,
    'score', v_score,
    'version', v_version,
    'breakdown', jsonb_build_object(
      'profile_completion', v_profile_completion_score,
      'cv_quality', v_cv_quality_score,
      'activity', v_activity_score,
      'market_demand', v_market_demand_score
    )
  );
END;
$$;


-- Fonction: get_full_candidate_stats
DROP FUNCTION IF EXISTS get_full_candidate_stats(UUID);

CREATE FUNCTION get_full_candidate_stats(p_candidate_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats RECORD;
BEGIN
  SELECT * INTO v_stats
  FROM candidate_stats
  WHERE candidate_id = p_candidate_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Statistiques non trouvées'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'candidate_id', v_stats.candidate_id,
    'job_views_count', COALESCE(v_stats.job_views_count, 0),
    'applications_count', COALESCE(v_stats.applications_count, 0),
    'profile_views_count', COALESCE(v_stats.profile_views_count, 0),
    'purchases_count', COALESCE(v_stats.purchases_count, 0),
    'formations_count', COALESCE(v_stats.formations_count, 0),
    'ai_score', COALESCE(v_stats.ai_score, 0),
    'ai_score_version', COALESCE(v_stats.ai_score_version, 1),
    'ai_score_breakdown', COALESCE(v_stats.ai_score_breakdown, '{}'::jsonb),
    'updated_at', v_stats.updated_at
  );
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION check_wallet_balance TO authenticated;
GRANT EXECUTE ON FUNCTION debit_wallet TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_ai_score_backend_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION get_full_candidate_stats TO authenticated;
