/*
  # Système d'Abonnements Premium et Crédits

  ## Description
  Système complet pour gérer les abonnements premium IA et les crédits de services.

  ## 1. Tables
    - `premium_subscriptions` - Abonnements des utilisateurs
    - `premium_credits` - Gestion des crédits par service
    - `premium_transactions` - Historique des achats et utilisations
    - `premium_service_usage` - Suivi d'utilisation des services

  ## 2. Services Premium Disponibles
    - Analyse IA de profil (inclus)
    - Création CV/Lettre IA (100,000 GNF)
    - Alertes IA ciblées (inclus)
    - Chatbot Travail & Emploi (inclus)
    - Rapport mensuel IA (150,000 GNF/mois)
    - Coaching carrière IA (250,000 GNF)

  ## 3. Sécurité
    - RLS activé sur toutes les tables
    - Policies restrictives par utilisateur
*/

-- Table des abonnements premium
CREATE TABLE IF NOT EXISTS premium_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_type text NOT NULL CHECK (subscription_type IN ('free', 'basic', 'premium', 'enterprise')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  auto_renew boolean DEFAULT false,
  payment_method text,
  amount_paid numeric DEFAULT 0,
  currency text DEFAULT 'GNF',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Table des crédits par service
CREATE TABLE IF NOT EXISTS premium_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type text NOT NULL CHECK (service_type IN (
    'profile_analysis',
    'cv_generation',
    'cover_letter_generation',
    'smart_alerts',
    'chatbot_queries',
    'monthly_report',
    'career_coaching'
  )),
  credits_available integer NOT NULL DEFAULT 0,
  credits_used integer NOT NULL DEFAULT 0,
  credits_total integer NOT NULL DEFAULT 0,
  last_recharged_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, service_type)
);

-- Table des transactions
CREATE TABLE IF NOT EXISTS premium_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'bonus')),
  service_type text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'GNF',
  credits_change integer DEFAULT 0,
  description text,
  payment_method text,
  payment_reference text,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table d'utilisation des services
CREATE TABLE IF NOT EXISTS premium_service_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  usage_type text NOT NULL,
  credits_used integer DEFAULT 1,
  input_data jsonb,
  output_data jsonb,
  success boolean DEFAULT true,
  error_message text,
  execution_time_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_user_id ON premium_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_status ON premium_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_premium_credits_user_id ON premium_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_credits_service ON premium_credits(service_type);
CREATE INDEX IF NOT EXISTS idx_premium_transactions_user_id ON premium_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_transactions_type ON premium_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_premium_service_usage_user_id ON premium_service_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_service_usage_service ON premium_service_usage(service_type);

-- Enable Row Level Security
ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_service_usage ENABLE ROW LEVEL SECURITY;

-- Policies pour premium_subscriptions
CREATE POLICY "Users can view own subscription"
  ON premium_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON premium_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies pour premium_credits
CREATE POLICY "Users can view own credits"
  ON premium_credits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own credits"
  ON premium_credits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies pour premium_transactions
CREATE POLICY "Users can view own transactions"
  ON premium_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions"
  ON premium_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies pour premium_service_usage
CREATE POLICY "Users can view own usage"
  ON premium_service_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage"
  ON premium_service_usage FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Fonction pour initialiser un abonnement gratuit
CREATE OR REPLACE FUNCTION initialize_free_subscription(p_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Créer l'abonnement gratuit
  INSERT INTO premium_subscriptions (user_id, subscription_type, status)
  VALUES (p_user_id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  -- Initialiser les crédits gratuits
  INSERT INTO premium_credits (user_id, service_type, credits_available, credits_total)
  VALUES
    (p_user_id, 'profile_analysis', 999, 999),
    (p_user_id, 'smart_alerts', 999, 999),
    (p_user_id, 'chatbot_queries', 100, 100)
  ON CONFLICT (user_id, service_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour acheter des crédits
CREATE OR REPLACE FUNCTION purchase_service_credits(
  p_user_id uuid,
  p_service_type text,
  p_credits integer,
  p_amount numeric,
  p_payment_method text DEFAULT 'mobile_money',
  p_payment_reference text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_transaction_id uuid;
BEGIN
  -- Créer la transaction
  INSERT INTO premium_transactions (
    user_id,
    transaction_type,
    service_type,
    amount,
    credits_change,
    payment_method,
    payment_reference,
    status,
    description
  ) VALUES (
    p_user_id,
    'purchase',
    p_service_type,
    p_amount,
    p_credits,
    p_payment_method,
    p_payment_reference,
    'completed',
    'Achat de ' || p_credits || ' crédits pour ' || p_service_type
  ) RETURNING id INTO v_transaction_id;

  -- Ajouter les crédits
  INSERT INTO premium_credits (user_id, service_type, credits_available, credits_total)
  VALUES (p_user_id, p_service_type, p_credits, p_credits)
  ON CONFLICT (user_id, service_type)
  DO UPDATE SET
    credits_available = premium_credits.credits_available + p_credits,
    credits_total = premium_credits.credits_total + p_credits,
    last_recharged_at = now(),
    updated_at = now();

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'credits_added', p_credits
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour utiliser des crédits
CREATE OR REPLACE FUNCTION use_service_credits(
  p_user_id uuid,
  p_service_type text,
  p_credits integer DEFAULT 1,
  p_usage_type text DEFAULT 'service_call',
  p_input_data jsonb DEFAULT NULL,
  p_output_data jsonb DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_available_credits integer;
  v_usage_id uuid;
BEGIN
  -- Vérifier les crédits disponibles
  SELECT credits_available INTO v_available_credits
  FROM premium_credits
  WHERE user_id = p_user_id AND service_type = p_service_type
  FOR UPDATE;

  -- Si pas assez de crédits
  IF v_available_credits IS NULL OR v_available_credits < p_credits THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_credits',
      'available_credits', COALESCE(v_available_credits, 0),
      'required_credits', p_credits
    );
  END IF;

  -- Déduire les crédits
  UPDATE premium_credits
  SET
    credits_available = credits_available - p_credits,
    credits_used = credits_used + p_credits,
    updated_at = now()
  WHERE user_id = p_user_id AND service_type = p_service_type;

  -- Enregistrer l'utilisation
  INSERT INTO premium_service_usage (
    user_id,
    service_type,
    usage_type,
    credits_used,
    input_data,
    output_data,
    success
  ) VALUES (
    p_user_id,
    p_service_type,
    p_usage_type,
    p_credits,
    p_input_data,
    p_output_data,
    true
  ) RETURNING id INTO v_usage_id;

  -- Créer une transaction d'utilisation
  INSERT INTO premium_transactions (
    user_id,
    transaction_type,
    service_type,
    amount,
    credits_change,
    description
  ) VALUES (
    p_user_id,
    'usage',
    p_service_type,
    0,
    -p_credits,
    'Utilisation de ' || p_credits || ' crédit(s) pour ' || p_usage_type
  );

  RETURN jsonb_build_object(
    'success', true,
    'usage_id', v_usage_id,
    'credits_used', p_credits,
    'credits_remaining', v_available_credits - p_credits
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir le statut premium d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_premium_status(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_subscription record;
  v_credits jsonb;
BEGIN
  -- Récupérer l'abonnement
  SELECT * INTO v_subscription
  FROM premium_subscriptions
  WHERE user_id = p_user_id;

  -- Si pas d'abonnement, initialiser
  IF v_subscription IS NULL THEN
    PERFORM initialize_free_subscription(p_user_id);
    SELECT * INTO v_subscription
    FROM premium_subscriptions
    WHERE user_id = p_user_id;
  END IF;

  -- Récupérer les crédits
  SELECT jsonb_object_agg(service_type, jsonb_build_object(
    'available', credits_available,
    'used', credits_used,
    'total', credits_total
  )) INTO v_credits
  FROM premium_credits
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'subscription_type', v_subscription.subscription_type,
    'status', v_subscription.status,
    'credits', COALESCE(v_credits, '{}'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_premium_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_premium_subscriptions_updated_at_trigger ON premium_subscriptions;
CREATE TRIGGER update_premium_subscriptions_updated_at_trigger
  BEFORE UPDATE ON premium_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_premium_tables_updated_at();

DROP TRIGGER IF EXISTS update_premium_credits_updated_at_trigger ON premium_credits;
CREATE TRIGGER update_premium_credits_updated_at_trigger
  BEFORE UPDATE ON premium_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_premium_tables_updated_at();
