/*
  # Historique d'utilisation IA et Déduction automatique Badge Vérifié

  ## Description
  Système complet pour:
  - Suivre l'historique d'utilisation des services IA par les utilisateurs
  - Gérer la déduction automatique quotidienne du Badge Profil Vérifié
  
  ## Nouvelles tables
  
  ### ai_service_usage_history
  Enregistre chaque utilisation d'un service IA par un utilisateur:
  - `id` (uuid, primary key)
  - `user_id` (uuid, référence profiles)
  - `service_code` (text) - Code du service utilisé
  - `service_name` (text) - Nom du service
  - `credits_consumed` (integer) - Nombre de crédits consommés
  - `balance_before` (integer) - Solde avant utilisation
  - `balance_after` (integer) - Solde après utilisation
  - `metadata` (jsonb) - Données supplémentaires (job_id, etc.)
  - `created_at` (timestamptz)
  
  ### verified_badge_subscriptions
  Gère les abonnements au Badge Vérifié avec déduction quotidienne:
  - `id` (uuid, primary key)
  - `user_id` (uuid, référence profiles, unique)
  - `is_active` (boolean) - Badge actif ou non
  - `started_at` (timestamptz) - Date d'activation
  - `last_deduction_at` (timestamptz) - Dernière déduction
  - `total_days` (integer) - Nombre total de jours actif
  - `total_credits_spent` (integer) - Total crédits dépensés
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ## Fonctions
  - `record_ai_service_usage()` - Enregistre l'utilisation d'un service
  - `activate_verified_badge()` - Active le badge pour un utilisateur
  - `deactivate_verified_badge()` - Désactive le badge
  - `process_daily_badge_deductions()` - Fonction CRON pour déductions quotidiennes
  
  ## Sécurité
  - RLS activé sur toutes les tables
  - Utilisateurs voient uniquement leurs données
  - Admins voient toutes les données
*/

-- Table d'historique d'utilisation des services IA
CREATE TABLE IF NOT EXISTS ai_service_usage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_code text NOT NULL,
  service_name text NOT NULL,
  credits_consumed integer NOT NULL CHECK (credits_consumed >= 0),
  balance_before integer NOT NULL,
  balance_after integer NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table des abonnements au Badge Vérifié
CREATE TABLE IF NOT EXISTS verified_badge_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_deduction_at timestamptz,
  total_days integer NOT NULL DEFAULT 0 CHECK (total_days >= 0),
  total_credits_spent integer NOT NULL DEFAULT 0 CHECK (total_credits_spent >= 0),
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_ai_usage_history_user_id 
  ON ai_service_usage_history(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_history_service 
  ON ai_service_usage_history(service_code, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_history_created_at 
  ON ai_service_usage_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_badge_subscriptions_active 
  ON verified_badge_subscriptions(is_active, last_deduction_at);

-- Enable RLS
ALTER TABLE ai_service_usage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE verified_badge_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies pour ai_service_usage_history
CREATE POLICY "Users can view own usage history"
  ON ai_service_usage_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage history"
  ON ai_service_usage_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );

CREATE POLICY "System can insert usage records"
  ON ai_service_usage_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies pour verified_badge_subscriptions
CREATE POLICY "Users can view own badge subscription"
  ON verified_badge_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all badge subscriptions"
  ON verified_badge_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );

CREATE POLICY "Users can manage own badge subscription"
  ON verified_badge_subscriptions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fonction pour enregistrer l'utilisation d'un service IA
CREATE OR REPLACE FUNCTION record_ai_service_usage(
  p_user_id uuid,
  p_service_code text,
  p_service_name text,
  p_credits_consumed integer,
  p_balance_before integer,
  p_balance_after integer,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  v_record_id uuid;
BEGIN
  INSERT INTO ai_service_usage_history (
    user_id,
    service_code,
    service_name,
    credits_consumed,
    balance_before,
    balance_after,
    metadata
  ) VALUES (
    p_user_id,
    p_service_code,
    p_service_name,
    p_credits_consumed,
    p_balance_before,
    p_balance_after,
    p_metadata
  ) RETURNING id INTO v_record_id;
  
  RETURN v_record_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour activer le Badge Vérifié
CREATE OR REPLACE FUNCTION activate_verified_badge(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_current_balance integer;
  v_subscription_id uuid;
BEGIN
  -- Vérifier le solde (au moins 3 crédits pour 1 jour)
  SELECT total_credits INTO v_current_balance
  FROM user_credit_balances
  WHERE user_id = p_user_id;
  
  IF v_current_balance < 3 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_credits',
      'message', 'Vous devez avoir au moins 3 crédits pour activer le Badge Vérifié',
      'required_credits', 3,
      'available_credits', v_current_balance
    );
  END IF;
  
  -- Créer ou réactiver l'abonnement
  INSERT INTO verified_badge_subscriptions (
    user_id,
    is_active,
    started_at
  ) VALUES (
    p_user_id,
    true,
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    is_active = true,
    started_at = now(),
    updated_at = now()
  RETURNING id INTO v_subscription_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', v_subscription_id,
    'message', 'Badge Vérifié activé - Déduction automatique de 3 crédits/jour'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour désactiver le Badge Vérifié
CREATE OR REPLACE FUNCTION deactivate_verified_badge(p_user_id uuid)
RETURNS jsonb AS $$
BEGIN
  UPDATE verified_badge_subscriptions
  SET 
    is_active = false,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'subscription_not_found',
      'message', 'Aucun abonnement Badge Vérifié trouvé'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Badge Vérifié désactivé'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour traiter les déductions quotidiennes du Badge Vérifié
-- Cette fonction doit être appelée par un CRON job une fois par jour
CREATE OR REPLACE FUNCTION process_daily_badge_deductions()
RETURNS jsonb AS $$
DECLARE
  v_subscription record;
  v_processed_count integer := 0;
  v_failed_count integer := 0;
  v_daily_cost integer := 3;
  v_current_balance integer;
  v_new_balance integer;
  v_balance_before integer;
BEGIN
  -- Parcourir tous les abonnements actifs
  FOR v_subscription IN 
    SELECT * 
    FROM verified_badge_subscriptions 
    WHERE is_active = true
    AND (
      last_deduction_at IS NULL 
      OR last_deduction_at < CURRENT_DATE
    )
  LOOP
    -- Obtenir le solde actuel
    SELECT total_credits INTO v_current_balance
    FROM user_credit_balances
    WHERE user_id = v_subscription.user_id;
    
    -- Si pas assez de crédits, désactiver le badge
    IF v_current_balance < v_daily_cost THEN
      UPDATE verified_badge_subscriptions
      SET 
        is_active = false,
        updated_at = now()
      WHERE id = v_subscription.id;
      
      v_failed_count := v_failed_count + 1;
      CONTINUE;
    END IF;
    
    -- Déduire les crédits
    v_balance_before := v_current_balance;
    v_new_balance := v_current_balance - v_daily_cost;
    
    UPDATE user_credit_balances
    SET
      total_credits = v_new_balance,
      credits_used = credits_used + v_daily_cost,
      updated_at = now()
    WHERE user_id = v_subscription.user_id;
    
    -- Enregistrer la transaction
    INSERT INTO credit_transactions (
      user_id,
      transaction_type,
      credits_amount,
      service_code,
      description,
      metadata,
      balance_before,
      balance_after
    ) VALUES (
      v_subscription.user_id,
      'usage',
      -v_daily_cost,
      'verified_badge',
      'Déduction quotidienne Badge Vérifié',
      jsonb_build_object('subscription_id', v_subscription.id, 'deduction_date', CURRENT_DATE),
      v_balance_before,
      v_new_balance
    );
    
    -- Enregistrer dans l'historique d'utilisation
    PERFORM record_ai_service_usage(
      v_subscription.user_id,
      'verified_badge',
      'Badge Profil Vérifié (quotidien)',
      v_daily_cost,
      v_balance_before,
      v_new_balance,
      jsonb_build_object('subscription_id', v_subscription.id, 'deduction_date', CURRENT_DATE)
    );
    
    -- Mettre à jour l'abonnement
    UPDATE verified_badge_subscriptions
    SET
      last_deduction_at = now(),
      total_days = total_days + 1,
      total_credits_spent = total_credits_spent + v_daily_cost,
      updated_at = now()
    WHERE id = v_subscription.id;
    
    v_processed_count := v_processed_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'processed_count', v_processed_count,
    'failed_count', v_failed_count,
    'message', format('Traité %s déductions, %s échecs', v_processed_count, v_failed_count)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_badge_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_badge_subscriptions_updated_at ON verified_badge_subscriptions;
CREATE TRIGGER update_badge_subscriptions_updated_at
  BEFORE UPDATE ON verified_badge_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_badge_subscription_updated_at();

-- Commentaires
COMMENT ON TABLE ai_service_usage_history IS 'Historique complet d''utilisation des services Premium IA par les utilisateurs';
COMMENT ON TABLE verified_badge_subscriptions IS 'Abonnements au Badge Profil Vérifié avec déduction quotidienne automatique (3 crédits/jour)';
COMMENT ON FUNCTION record_ai_service_usage IS 'Enregistre l''utilisation d''un service IA dans l''historique';
COMMENT ON FUNCTION activate_verified_badge IS 'Active le Badge Vérifié pour un utilisateur (3 crédits/jour)';
COMMENT ON FUNCTION deactivate_verified_badge IS 'Désactive le Badge Vérifié pour un utilisateur';
COMMENT ON FUNCTION process_daily_badge_deductions IS 'Traite les déductions quotidiennes pour tous les Badges Vérifiés actifs (CRON)';
