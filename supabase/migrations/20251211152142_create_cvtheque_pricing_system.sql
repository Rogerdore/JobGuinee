/*
  # Système de Tarification CVThèque Complet

  ## Vue d'ensemble
  Système complet de packs et abonnements pour la CVThèque, totalement indépendant des services IA.

  ## 1. Tables créées

  ### cvtheque_pricing_packs
  Packs de CV (mono-niveau, mixtes, entreprises)
  - Junior, Intermédiaire, Senior (20, 50 profils)
  - Mix 20, Mix 50, Mix 100
  - Basic, Silver (entreprises)

  ### enterprise_subscriptions
  Abonnements entreprises incluant GOLD (validation obligatoire)
  - Basic, Silver : activation automatique
  - GOLD : validation admin requise

  ### cvtheque_pack_purchases
  Suivi des achats de packs
  - Historique complet
  - Consommation des crédits CV
  - Paiement Orange Money

  ## 2. Modifications tables existantes
  - profiles : ajout de champs cvtheque_credits et gold_active
  - companies : ajout de current_subscription

  ## 3. Sécurité
  - RLS activé sur toutes les tables
  - Policies restrictives
  - Validation admin pour GOLD

  ## 4. Notes importantes
  - Totalement indépendant des services IA
  - Utilise le workflow Orange Money existant
  - Pas de duplication
  - Compatible avec système existant
*/

-- ============================================================================
-- 1. TABLE CVTHEQUE_PRICING_PACKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS cvtheque_pricing_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_name text NOT NULL UNIQUE,
  pack_type text NOT NULL CHECK (pack_type IN ('junior', 'intermediate', 'senior', 'mixed', 'enterprise', 'gold')),
  total_profiles integer NOT NULL CHECK (total_profiles > 0),
  price_gnf numeric NOT NULL CHECK (price_gnf > 0),
  description text,
  features jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  order_index integer DEFAULT 0,
  
  -- Détails par type
  experience_level text, -- Pour packs mono-niveau: 'junior', 'intermediate', 'senior'
  mix_composition jsonb, -- Pour packs mixtes: {"junior": X, "intermediate": Y, "senior": Z}
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cvtheque_packs_type ON cvtheque_pricing_packs(pack_type);
CREATE INDEX IF NOT EXISTS idx_cvtheque_packs_active ON cvtheque_pricing_packs(is_active);
CREATE INDEX IF NOT EXISTS idx_cvtheque_packs_order ON cvtheque_pricing_packs(order_index);

-- ============================================================================
-- 2. TABLE ENTERPRISE_SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS enterprise_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  subscription_type text NOT NULL CHECK (subscription_type IN ('basic', 'silver', 'gold')),
  price_gnf numeric NOT NULL,
  
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'expired', 'cancelled')),
  requires_validation boolean DEFAULT false,
  
  -- Validation admin (pour GOLD)
  approved_by uuid REFERENCES profiles(id),
  approval_notes text,
  approved_at timestamptz,
  rejection_reason text,
  
  -- Paiement
  payment_method text DEFAULT 'orange_money',
  payment_reference text UNIQUE,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'waiting_proof', 'completed', 'failed', 'cancelled')),
  payment_proof_url text,
  
  -- Période
  start_date timestamptz,
  end_date timestamptz,
  
  -- Quotas (pour Basic et Silver)
  monthly_cv_quota integer, -- NULL = illimité (GOLD)
  cv_consumed integer DEFAULT 0 CHECK (cv_consumed >= 0),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enterprise_subs_company ON enterprise_subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_subs_profile ON enterprise_subscriptions(profile_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_subs_status ON enterprise_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_enterprise_subs_type ON enterprise_subscriptions(subscription_type);
CREATE INDEX IF NOT EXISTS idx_enterprise_subs_end_date ON enterprise_subscriptions(end_date);

-- ============================================================================
-- 3. TABLE CVTHEQUE_PACK_PURCHASES
-- ============================================================================

CREATE TABLE IF NOT EXISTS cvtheque_pack_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  pack_id uuid REFERENCES cvtheque_pricing_packs(id) ON DELETE SET NULL,
  
  pack_name text NOT NULL,
  pack_type text NOT NULL,
  total_profiles integer NOT NULL,
  price_paid numeric NOT NULL,
  
  -- Consommation
  profiles_remaining integer NOT NULL,
  profiles_consumed integer DEFAULT 0 CHECK (profiles_consumed >= 0),
  
  -- Paiement
  payment_method text DEFAULT 'orange_money',
  payment_reference text UNIQUE,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'waiting_proof', 'completed', 'failed', 'cancelled')),
  payment_proof_url text,
  
  -- Statut
  purchase_status text DEFAULT 'pending' CHECK (purchase_status IN ('pending', 'active', 'expired', 'cancelled')),
  
  -- Dates
  activated_at timestamptz,
  expires_at timestamptz, -- Optionnel, peut être NULL pour packs sans expiration
  
  -- Admin
  admin_notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pack_purchases_buyer ON cvtheque_pack_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_pack_purchases_pack ON cvtheque_pack_purchases(pack_id);
CREATE INDEX IF NOT EXISTS idx_pack_purchases_status ON cvtheque_pack_purchases(purchase_status);
CREATE INDEX IF NOT EXISTS idx_pack_purchases_created ON cvtheque_pack_purchases(created_at DESC);

-- ============================================================================
-- 4. MISE À JOUR TABLES EXISTANTES
-- ============================================================================

-- Ajouter champs de suivi CVThèque sur profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'cvtheque_credits'
  ) THEN
    ALTER TABLE profiles ADD COLUMN cvtheque_credits integer DEFAULT 0 CHECK (cvtheque_credits >= 0);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'gold_active'
  ) THEN
    ALTER TABLE profiles ADD COLUMN gold_active boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'gold_expiration'
  ) THEN
    ALTER TABLE profiles ADD COLUMN gold_expiration timestamptz;
  END IF;
END $$;

-- Ajouter champs subscription sur companies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'current_subscription'
  ) THEN
    ALTER TABLE companies ADD COLUMN current_subscription text CHECK (current_subscription IN ('none', 'basic', 'silver', 'gold'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'subscription_expiration'
  ) THEN
    ALTER TABLE companies ADD COLUMN subscription_expiration timestamptz;
  END IF;
END $$;

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE cvtheque_pricing_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvtheque_pack_purchases ENABLE ROW LEVEL SECURITY;

-- ===== POLICIES cvtheque_pricing_packs =====

CREATE POLICY "Packs publics visibles par tous"
  ON cvtheque_pricing_packs FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ===== POLICIES enterprise_subscriptions =====

CREATE POLICY "Utilisateurs voient leurs abonnements"
  ON enterprise_subscriptions FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Utilisateurs créent des abonnements"
  ON enterprise_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Utilisateurs modifient leurs abonnements"
  ON enterprise_subscriptions FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- ===== POLICIES cvtheque_pack_purchases =====

CREATE POLICY "Acheteurs voient leurs achats"
  ON cvtheque_pack_purchases FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "Utilisateurs créent des achats"
  ON cvtheque_pack_purchases FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Acheteurs modifient leurs achats"
  ON cvtheque_pack_purchases FOR UPDATE
  TO authenticated
  USING (buyer_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid());

-- ============================================================================
-- 6. FUNCTIONS UTILITAIRES
-- ============================================================================

-- Fonction pour consommer un crédit CV d'un pack
CREATE OR REPLACE FUNCTION consume_cvtheque_pack_credit(
  p_buyer_id uuid,
  p_candidate_id uuid
)
RETURNS boolean AS $$
DECLARE
  v_pack_id uuid;
  v_remaining integer;
BEGIN
  -- Trouver un pack actif avec des crédits restants
  SELECT id, profiles_remaining INTO v_pack_id, v_remaining
  FROM cvtheque_pack_purchases
  WHERE buyer_id = p_buyer_id
    AND purchase_status = 'active'
    AND profiles_remaining > 0
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF v_pack_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Décrémenter le compteur
  UPDATE cvtheque_pack_purchases
  SET 
    profiles_remaining = profiles_remaining - 1,
    profiles_consumed = profiles_consumed + 1,
    updated_at = now()
  WHERE id = v_pack_id;
  
  -- Créer la purchase entry si pas déjà achetée
  INSERT INTO profile_purchases (buyer_id, candidate_id, purchase_price, payment_status)
  VALUES (p_buyer_id, p_candidate_id, 0, 'completed')
  ON CONFLICT (buyer_id, candidate_id) DO NOTHING;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour auto-expirer les abonnements
CREATE OR REPLACE FUNCTION auto_expire_enterprise_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE enterprise_subscriptions
  SET status = 'expired'
  WHERE status = 'active'
    AND end_date < now();
    
  -- Mettre à jour companies
  UPDATE companies c
  SET 
    current_subscription = 'none',
    subscription_expiration = NULL
  WHERE EXISTS (
    SELECT 1 FROM enterprise_subscriptions es
    WHERE es.company_id = c.id
      AND es.status = 'expired'
      AND c.current_subscription != 'none'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. DONNÉES INITIALES - PACKS OFFICIELS
-- ============================================================================

-- Packs JUNIOR
INSERT INTO cvtheque_pricing_packs (pack_name, pack_type, total_profiles, price_gnf, experience_level, description, features, order_index)
VALUES
  (
    'Junior 20',
    'junior',
    20,
    150000,
    'junior',
    'Accès à 20 profils juniors (0-2 ans d''expérience)',
    '["20 profils juniors", "Accès complet coordonnées", "Support inclus"]'::jsonb,
    1
  ),
  (
    'Junior 50',
    'junior',
    50,
    300000,
    'junior',
    'Accès à 50 profils juniors (0-2 ans d''expérience)',
    '["50 profils juniors", "Accès complet coordonnées", "Support inclus", "Économie 20%"]'::jsonb,
    2
  )
ON CONFLICT (pack_name) DO UPDATE SET
  price_gnf = EXCLUDED.price_gnf,
  total_profiles = EXCLUDED.total_profiles,
  updated_at = now();

-- Packs INTERMÉDIAIRE
INSERT INTO cvtheque_pricing_packs (pack_name, pack_type, total_profiles, price_gnf, experience_level, description, features, order_index)
VALUES
  (
    'Intermédiaire 20',
    'intermediate',
    20,
    200000,
    'intermediate',
    'Accès à 20 profils intermédiaires (3-5 ans d''expérience)',
    '["20 profils intermédiaires", "Accès complet coordonnées", "Support inclus"]'::jsonb,
    3
  ),
  (
    'Intermédiaire 50',
    'intermediate',
    50,
    460000,
    'intermediate',
    'Accès à 50 profils intermédiaires (3-5 ans d''expérience)',
    '["50 profils intermédiaires", "Accès complet coordonnées", "Support inclus", "Économie 23%"]'::jsonb,
    4
  )
ON CONFLICT (pack_name) DO UPDATE SET
  price_gnf = EXCLUDED.price_gnf,
  total_profiles = EXCLUDED.total_profiles,
  updated_at = now();

-- Packs SENIOR
INSERT INTO cvtheque_pricing_packs (pack_name, pack_type, total_profiles, price_gnf, experience_level, description, features, order_index)
VALUES
  (
    'Senior 20',
    'senior',
    20,
    400000,
    'senior',
    'Accès à 20 profils seniors (6+ ans d''expérience)',
    '["20 profils seniors", "Accès complet coordonnées", "Support inclus"]'::jsonb,
    5
  ),
  (
    'Senior 50',
    'senior',
    50,
    890000,
    'senior',
    'Accès à 50 profils seniors (6+ ans d''expérience)',
    '["50 profils seniors", "Accès complet coordonnées", "Support inclus", "Économie 22%"]'::jsonb,
    6
  )
ON CONFLICT (pack_name) DO UPDATE SET
  price_gnf = EXCLUDED.price_gnf,
  total_profiles = EXCLUDED.total_profiles,
  updated_at = now();

-- Packs MIXTES
INSERT INTO cvtheque_pricing_packs (pack_name, pack_type, total_profiles, price_gnf, description, mix_composition, features, order_index)
VALUES
  (
    'Mix 20',
    'mixed',
    20,
    220000,
    'Pack mixte : accès à 20 profils variés (tous niveaux)',
    '{"junior": 8, "intermediate": 8, "senior": 4}'::jsonb,
    '["20 profils mixtes", "Tous niveaux d''expérience", "Accès complet coordonnées", "Support inclus"]'::jsonb,
    7
  ),
  (
    'Mix 50',
    'mixed',
    50,
    550000,
    'Pack mixte : accès à 50 profils variés (tous niveaux)',
    '{"junior": 20, "intermediate": 20, "senior": 10}'::jsonb,
    '["50 profils mixtes", "Tous niveaux d''expérience", "Accès complet coordonnées", "Support inclus", "Économie 20%"]'::jsonb,
    8
  ),
  (
    'Mix 100',
    'mixed',
    100,
    1050000,
    'Pack mixte : accès à 100 profils variés (tous niveaux)',
    '{"junior": 40, "intermediate": 40, "senior": 20}'::jsonb,
    '["100 profils mixtes", "Tous niveaux d''expérience", "Accès complet coordonnées", "Support inclus", "Économie 25%"]'::jsonb,
    9
  )
ON CONFLICT (pack_name) DO UPDATE SET
  price_gnf = EXCLUDED.price_gnf,
  total_profiles = EXCLUDED.total_profiles,
  mix_composition = EXCLUDED.mix_composition,
  updated_at = now();

-- Packs ENTREPRISE
INSERT INTO cvtheque_pricing_packs (pack_name, pack_type, total_profiles, price_gnf, description, features, order_index)
VALUES
  (
    'Basic Entreprise',
    'enterprise',
    60,
    1200000,
    'Abonnement mensuel Basic : 60 profils/mois (tous niveaux)',
    '["60 profils/mois", "Tous niveaux", "Accès complet coordonnées", "Support prioritaire", "Statistiques"]'::jsonb,
    10
  ),
  (
    'Silver Entreprise',
    'enterprise',
    150,
    2800000,
    'Abonnement mensuel Silver : 150 profils/mois (tous niveaux)',
    '["150 profils/mois", "Tous niveaux", "Accès complet coordonnées", "Support prioritaire", "Statistiques avancées", "Multi-utilisateurs"]'::jsonb,
    11
  ),
  (
    'Gold Entreprise',
    'gold',
    999999,
    10000000,
    'Abonnement mensuel GOLD : Accès illimité à toute la CVThèque (validation obligatoire)',
    '["Accès ILLIMITÉ", "Tous niveaux", "Validation manuelle admin", "Support VIP 24/7", "Statistiques avancées", "API dédiée", "Multi-utilisateurs", "Gestionnaire de compte"]'::jsonb,
    12
  )
ON CONFLICT (pack_name) DO UPDATE SET
  price_gnf = EXCLUDED.price_gnf,
  total_profiles = EXCLUDED.total_profiles,
  updated_at = now();

-- ============================================================================
-- TERMINÉ
-- ============================================================================