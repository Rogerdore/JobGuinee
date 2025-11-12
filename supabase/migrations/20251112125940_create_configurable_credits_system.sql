/*
  # Système de Gestion des Crédits Premium Configurable

  ## Description
  Système complet pour gérer les crédits premium avec:
  - Configuration des tarifs crédits/montants
  - Configuration de la consommation par service
  - Historique des transactions
  - Achat et recharge de crédits
  - Tableau de bord admin

  ## Tables
    - `credit_packages` - Packages de crédits disponibles à l'achat
    - `service_credit_costs` - Coût en crédits de chaque service
    - `credit_transactions` - Historique des transactions
    - `user_credit_balances` - Soldes de crédits par utilisateur

  ## Sécurité
    - RLS activé sur toutes les tables
    - Accès admin pour configuration
    - Accès utilisateur pour leurs données
*/

-- Table des packages de crédits (configurable par admin)
CREATE TABLE IF NOT EXISTS credit_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  credits_amount integer NOT NULL CHECK (credits_amount > 0),
  price_amount decimal(10, 2) NOT NULL CHECK (price_amount > 0),
  currency text NOT NULL DEFAULT 'GNF',
  bonus_credits integer DEFAULT 0 CHECK (bonus_credits >= 0),
  is_popular boolean DEFAULT false,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table des coûts en crédits par service (configurable par admin)
CREATE TABLE IF NOT EXISTS service_credit_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_code text NOT NULL UNIQUE,
  service_name text NOT NULL,
  service_description text,
  credits_cost integer NOT NULL CHECK (credits_cost >= 0),
  is_active boolean DEFAULT true,
  category text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table des soldes de crédits par utilisateur
CREATE TABLE IF NOT EXISTS user_credit_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_credits integer NOT NULL DEFAULT 0 CHECK (total_credits >= 0),
  credits_purchased integer DEFAULT 0,
  credits_bonus integer DEFAULT 0,
  credits_used integer DEFAULT 0,
  last_purchase_at timestamptz,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table des transactions de crédits
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'bonus', 'usage', 'refund', 'admin_adjustment')),
  credits_amount integer NOT NULL,
  service_code text,
  package_id uuid REFERENCES credit_packages(id) ON DELETE SET NULL,
  price_paid decimal(10, 2),
  currency text DEFAULT 'GNF',
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  balance_before integer NOT NULL,
  balance_after integer NOT NULL,
  
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_credit_packages_active ON credit_packages(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_service_costs_active ON service_credit_costs(is_active, service_code);
CREATE INDEX IF NOT EXISTS idx_user_balances_user_id ON user_credit_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type, created_at DESC);

-- Enable RLS
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_credit_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Policies pour credit_packages
CREATE POLICY "Anyone can view active packages"
  ON credit_packages FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage packages"
  ON credit_packages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );

-- Policies pour service_credit_costs
CREATE POLICY "Anyone can view active service costs"
  ON service_credit_costs FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage service costs"
  ON service_credit_costs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );

-- Policies pour user_credit_balances
CREATE POLICY "Users can view own balance"
  ON user_credit_balances FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all balances"
  ON user_credit_balances FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );

-- Policies pour credit_transactions
CREATE POLICY "Users can view own transactions"
  ON credit_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON credit_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );

-- Fonction pour obtenir le solde d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_credit_balance(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  v_balance integer;
BEGIN
  SELECT total_credits INTO v_balance
  FROM user_credit_balances
  WHERE user_id = p_user_id;
  
  IF v_balance IS NULL THEN
    -- Créer le solde s'il n'existe pas
    INSERT INTO user_credit_balances (user_id, total_credits)
    VALUES (p_user_id, 0)
    RETURNING total_credits INTO v_balance;
  END IF;
  
  RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour acheter un package de crédits
CREATE OR REPLACE FUNCTION purchase_credit_package(
  p_user_id uuid,
  p_package_id uuid,
  p_payment_method text DEFAULT 'manual'
)
RETURNS jsonb AS $$
DECLARE
  v_package record;
  v_current_balance integer;
  v_new_balance integer;
  v_total_credits integer;
  v_transaction_id uuid;
BEGIN
  -- Récupérer le package
  SELECT * INTO v_package
  FROM credit_packages
  WHERE id = p_package_id AND is_active = true;
  
  IF v_package IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'package_not_found',
      'message', 'Package de crédits non trouvé ou inactif'
    );
  END IF;
  
  -- Obtenir le solde actuel
  v_current_balance := get_user_credit_balance(p_user_id);
  
  -- Calculer le total de crédits (montant + bonus)
  v_total_credits := v_package.credits_amount + v_package.bonus_credits;
  v_new_balance := v_current_balance + v_total_credits;
  
  -- Mettre à jour le solde
  UPDATE user_credit_balances
  SET
    total_credits = v_new_balance,
    credits_purchased = credits_purchased + v_package.credits_amount,
    credits_bonus = credits_bonus + v_package.bonus_credits,
    last_purchase_at = now(),
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Créer la transaction d'achat
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_amount,
    package_id,
    price_paid,
    currency,
    description,
    metadata,
    balance_before,
    balance_after
  ) VALUES (
    p_user_id,
    'purchase',
    v_total_credits,
    p_package_id,
    v_package.price_amount,
    v_package.currency,
    'Achat de ' || v_package.name,
    jsonb_build_object(
      'package_name', v_package.name,
      'base_credits', v_package.credits_amount,
      'bonus_credits', v_package.bonus_credits,
      'payment_method', p_payment_method
    ),
    v_current_balance,
    v_new_balance
  ) RETURNING id INTO v_transaction_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'credits_added', v_total_credits,
    'new_balance', v_new_balance,
    'package_name', v_package.name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour utiliser des crédits pour un service
CREATE OR REPLACE FUNCTION use_credits_for_service(
  p_user_id uuid,
  p_service_code text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb AS $$
DECLARE
  v_service record;
  v_current_balance integer;
  v_new_balance integer;
  v_transaction_id uuid;
BEGIN
  -- Récupérer le service et son coût
  SELECT * INTO v_service
  FROM service_credit_costs
  WHERE service_code = p_service_code AND is_active = true;
  
  IF v_service IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'service_not_found',
      'message', 'Service non trouvé ou inactif'
    );
  END IF;
  
  -- Obtenir le solde actuel
  v_current_balance := get_user_credit_balance(p_user_id);
  
  -- Vérifier si assez de crédits
  IF v_current_balance < v_service.credits_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_credits',
      'message', 'Crédits insuffisants',
      'required_credits', v_service.credits_cost,
      'available_credits', v_current_balance
    );
  END IF;
  
  -- Déduire les crédits
  v_new_balance := v_current_balance - v_service.credits_cost;
  
  UPDATE user_credit_balances
  SET
    total_credits = v_new_balance,
    credits_used = credits_used + v_service.credits_cost,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Créer la transaction d'utilisation
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
    p_user_id,
    'usage',
    -v_service.credits_cost,
    p_service_code,
    'Utilisation de ' || v_service.service_name,
    p_metadata,
    v_current_balance,
    v_new_balance
  ) RETURNING id INTO v_transaction_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'credits_used', v_service.credits_cost,
    'new_balance', v_new_balance,
    'service_name', v_service.service_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_credit_packages_updated_at ON credit_packages;
CREATE TRIGGER update_credit_packages_updated_at
  BEFORE UPDATE ON credit_packages
  FOR EACH ROW EXECUTE FUNCTION update_credits_updated_at();

DROP TRIGGER IF EXISTS update_service_costs_updated_at ON service_credit_costs;
CREATE TRIGGER update_service_costs_updated_at
  BEFORE UPDATE ON service_credit_costs
  FOR EACH ROW EXECUTE FUNCTION update_credits_updated_at();

DROP TRIGGER IF EXISTS update_user_balances_updated_at ON user_credit_balances;
CREATE TRIGGER update_user_balances_updated_at
  BEFORE UPDATE ON user_credit_balances
  FOR EACH ROW EXECUTE FUNCTION update_credits_updated_at();

-- Insérer les packages de crédits par défaut
INSERT INTO credit_packages (name, description, credits_amount, price_amount, currency, bonus_credits, is_popular, display_order) VALUES
('Starter', 'Pack de démarrage parfait pour essayer nos services', 100, 50000, 'GNF', 0, false, 1),
('Basic', 'Pack idéal pour une utilisation régulière', 500, 200000, 'GNF', 50, false, 2),
('Pro', 'Pack professionnel pour utilisateurs actifs', 1500, 500000, 'GNF', 200, true, 3),
('Premium', 'Pack premium avec bonus généreux', 3000, 900000, 'GNF', 500, false, 4),
('Ultimate', 'Pack ultime pour utilisateurs intensifs', 5000, 1400000, 'GNF', 1000, false, 5)
ON CONFLICT DO NOTHING;

-- Insérer les coûts par service
INSERT INTO service_credit_costs (service_code, service_name, service_description, credits_cost, category) VALUES
('profile_analysis', 'Analyse IA de Profil', 'Analyse complète du profil avec recommandations personnalisées', 0, 'IA & Analyse'),
('cv_generation', 'Génération CV IA', 'Création automatique d''un CV professionnel avec l''IA', 50, 'Documents'),
('cover_letter_generation', 'Génération Lettre IA', 'Création automatique d''une lettre de motivation', 30, 'Documents'),
('job_matching', 'Matching IA Emplois', 'Recommandations d''emplois basées sur votre profil', 20, 'IA & Analyse'),
('interview_coaching', 'Coaching Entretien IA', 'Préparation aux entretiens avec simulation IA', 100, 'Formation'),
('profile_visibility_boost', 'Boost Visibilité Profil', 'Augmentez la visibilité de votre profil pendant 30 jours', 200, 'Visibilité'),
('featured_application', 'Candidature Prioritaire', 'Votre candidature mise en avant auprès des recruteurs', 50, 'Candidature'),
('direct_message_recruiter', 'Message Direct Recruteur', 'Envoyez un message direct à un recruteur', 30, 'Communication'),
('access_contact_info', 'Accès Infos Contact', 'Accédez aux informations de contact d''un recruteur', 40, 'Communication'),
('unlimited_applications', 'Candidatures Illimitées (30j)', 'Postulez sans limite pendant 30 jours', 300, 'Candidature')
ON CONFLICT (service_code) DO UPDATE SET
  service_name = EXCLUDED.service_name,
  service_description = EXCLUDED.service_description,
  credits_cost = EXCLUDED.credits_cost,
  category = EXCLUDED.category;

-- Commentaires
COMMENT ON TABLE credit_packages IS 'Packages de crédits disponibles à l''achat (configurable par admin)';
COMMENT ON TABLE service_credit_costs IS 'Coût en crédits de chaque service premium (configurable par admin)';
COMMENT ON TABLE user_credit_balances IS 'Soldes de crédits par utilisateur';
COMMENT ON TABLE credit_transactions IS 'Historique complet des transactions de crédits';
COMMENT ON FUNCTION get_user_credit_balance IS 'Récupère le solde de crédits d''un utilisateur';
COMMENT ON FUNCTION purchase_credit_package IS 'Achète un package de crédits';
COMMENT ON FUNCTION use_credits_for_service IS 'Utilise des crédits pour un service premium';
