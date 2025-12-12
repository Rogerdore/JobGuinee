/*
  # Système de Tarification Matching IA Recruteur

  ## Nouvelles Tables

  ### 1. `recruiter_matching_pricing`
  Configuration des tarifs pour le service Matching IA Recruteur avec 3 modes:
  - **Mode A**: Par candidat (dégressif)
  - **Mode B**: Par batch (10, 25, 50, 100 candidats)
  - **Mode C**: Abonnement IA recruteur

  Colonnes:
  - `id` (uuid, primary key)
  - `mode` (text): 'per_candidate', 'batch', 'subscription'
  - `name` (text): Nom du tarif
  - `description` (text): Description
  - `credits_cost` (integer): Coût en crédits IA
  - `gnf_cost` (integer): Équivalent en GNF (1 crédit = 1000 GNF)
  - `candidate_count` (integer): Nombre de candidats (pour batch/subscription)
  - `is_active` (boolean): Actif ou non
  - `display_order` (integer): Ordre d'affichage
  - `metadata` (jsonb): Config additionnelle (dégressivité, etc.)

  ### 2. `recruiter_ai_subscriptions`
  Abonnements IA pour les recruteurs (mode C)

  Colonnes:
  - `id` (uuid, primary key)
  - `recruiter_id` (uuid, FK profiles)
  - `plan_type` (text): 'basic', 'pro', 'gold'
  - `credits_included` (integer): Crédits inclus dans l'abonnement
  - `matching_quota` (integer): Quota de matchings (null = illimité pour gold)
  - `matching_used` (integer): Matchings utilisés ce mois
  - `start_date` (timestamptz): Date de début
  - `end_date` (timestamptz): Date de fin
  - `status` (text): 'active', 'expired', 'cancelled'
  - `auto_renew` (boolean): Renouvellement automatique
  - `needs_admin_validation` (boolean): Pour le plan Gold

  ## Sécurité
  - RLS activé sur toutes les tables
  - Admins: accès complet
  - Recruteurs: lecture de leurs propres abonnements

  ## Données Initiales
  - Tarifs par défaut pour les 3 modes
  - Calcul automatique GNF basé sur crédits
*/

-- Table de configuration des tarifs Matching IA
CREATE TABLE IF NOT EXISTS recruiter_matching_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode text NOT NULL CHECK (mode IN ('per_candidate', 'batch', 'subscription')),
  name text NOT NULL,
  description text,
  credits_cost integer NOT NULL DEFAULT 0,
  gnf_cost integer NOT NULL DEFAULT 0,
  candidate_count integer,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des abonnements IA recruteur
CREATE TABLE IF NOT EXISTS recruiter_ai_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type text NOT NULL CHECK (plan_type IN ('basic', 'pro', 'gold')),
  credits_included integer NOT NULL DEFAULT 0,
  matching_quota integer,
  matching_used integer DEFAULT 0,
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
  auto_renew boolean DEFAULT false,
  needs_admin_validation boolean DEFAULT false,
  payment_method text,
  amount_paid integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_recruiter_matching_pricing_mode ON recruiter_matching_pricing(mode);
CREATE INDEX IF NOT EXISTS idx_recruiter_matching_pricing_active ON recruiter_matching_pricing(is_active);
CREATE INDEX IF NOT EXISTS idx_recruiter_ai_subscriptions_recruiter ON recruiter_ai_subscriptions(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_ai_subscriptions_status ON recruiter_ai_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_recruiter_ai_subscriptions_dates ON recruiter_ai_subscriptions(start_date, end_date);

-- RLS
ALTER TABLE recruiter_matching_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_ai_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies pour recruiter_matching_pricing
CREATE POLICY "Admins can manage matching pricing"
  ON recruiter_matching_pricing
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Everyone can view active matching pricing"
  ON recruiter_matching_pricing
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policies pour recruiter_ai_subscriptions
CREATE POLICY "Admins can manage all AI subscriptions"
  ON recruiter_ai_subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Recruiters can view own AI subscriptions"
  ON recruiter_ai_subscriptions
  FOR SELECT
  TO authenticated
  USING (recruiter_id = auth.uid());

CREATE POLICY "Recruiters can insert own AI subscriptions"
  ON recruiter_ai_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (recruiter_id = auth.uid());

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_recruiter_matching_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_recruiter_matching_pricing_updated_at
  BEFORE UPDATE ON recruiter_matching_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_recruiter_matching_pricing_updated_at();

CREATE TRIGGER set_recruiter_ai_subscriptions_updated_at
  BEFORE UPDATE ON recruiter_ai_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_recruiter_matching_pricing_updated_at();

-- Fonction pour calculer automatiquement gnf_cost
CREATE OR REPLACE FUNCTION sync_gnf_cost()
RETURNS TRIGGER AS $$
BEGIN
  NEW.gnf_cost = NEW.credits_cost * 1000;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_gnf_cost
  BEFORE INSERT OR UPDATE OF credits_cost ON recruiter_matching_pricing
  FOR EACH ROW
  EXECUTE FUNCTION sync_gnf_cost();

-- Insertion des tarifs par défaut

-- MODE A: Par candidat
INSERT INTO recruiter_matching_pricing (mode, name, description, credits_cost, candidate_count, display_order, metadata) VALUES
('per_candidate', 'Par Candidat', 'Analyse individuelle avec scoring détaillé', 10, 1, 100, '{"degressive": [{"from": 1, "to": 10, "cost": 10}, {"from": 11, "to": 50, "cost": 9}, {"from": 51, "to": null, "cost": 8}]}'::jsonb);

-- MODE B: Par batch
INSERT INTO recruiter_matching_pricing (mode, name, description, credits_cost, candidate_count, display_order) VALUES
('batch', 'Batch 10 Candidats', 'Analysez jusqu''à 10 candidats - Économisez 20%', 80, 10, 200),
('batch', 'Batch 25 Candidats', 'Analysez jusqu''à 25 candidats - Économisez 28%', 180, 25, 210),
('batch', 'Batch 50 Candidats', 'Analysez jusqu''à 50 candidats - Économisez 36%', 320, 50, 220),
('batch', 'Batch 100 Candidats', 'Analysez jusqu''à 100 candidats - Économisez 40%', 600, 100, 230);

-- MODE C: Abonnements
INSERT INTO recruiter_matching_pricing (mode, name, description, credits_cost, candidate_count, display_order, metadata) VALUES
('subscription', 'Abonnement Basic', '300 matchings par mois - Support standard', 3000, 300, 300, '{"gnf_price": 3000000, "duration_days": 30, "features": ["300 matchings/mois", "Support standard", "Rapports basiques"]}'::jsonb),
('subscription', 'Abonnement Pro', '800 matchings par mois - Support prioritaire', 8000, 800, 310, '{"gnf_price": 7500000, "duration_days": 30, "features": ["800 matchings/mois", "Support prioritaire", "Rapports avancés", "Analytics IA"]}'::jsonb),
('subscription', 'Abonnement Gold', 'Matchings illimités - Validation admin requise', 10000, NULL, 320, '{"gnf_price": 10000000, "duration_days": 30, "needs_validation": true, "features": ["Matchings illimités", "Account manager dédié", "API accès", "Formation équipe"]}'::jsonb);
