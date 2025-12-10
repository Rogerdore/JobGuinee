/*
  # Création Table Service Credit Costs

  1. Table service_credit_costs
    - Configuration des coûts en crédits pour chaque service IA
    - Support promotions et réductions
    - Ordre d'affichage et catégorisation

  2. Données par défaut
    - Service codes cohérents avec ia_service_config
    - Coûts en crédits alignés sur le business model

  3. Sécurité
    - RLS activé
    - Lecture publique des services actifs
    - Admins peuvent gérer
*/

CREATE TABLE IF NOT EXISTS service_credit_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_code text UNIQUE NOT NULL,
  service_name text NOT NULL,
  service_description text,
  credits_cost integer NOT NULL DEFAULT 0 CHECK (credits_cost >= 0),
  is_active boolean DEFAULT true,
  category text,
  promotion_active boolean DEFAULT false,
  discount_percent integer DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  display_order integer DEFAULT 0,
  icon text DEFAULT 'Sparkles',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_credit_costs_service_code
  ON service_credit_costs(service_code);

CREATE INDEX IF NOT EXISTS idx_service_credit_costs_is_active
  ON service_credit_costs(is_active);

CREATE INDEX IF NOT EXISTS idx_service_credit_costs_category
  ON service_credit_costs(category);

CREATE INDEX IF NOT EXISTS idx_service_credit_costs_display_order
  ON service_credit_costs(display_order);

-- RLS
ALTER TABLE service_credit_costs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'service_credit_costs' 
    AND policyname = 'Anyone can read active services'
  ) THEN
    CREATE POLICY "Anyone can read active services"
      ON service_credit_costs FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'service_credit_costs' 
    AND policyname = 'Admins can manage services'
  ) THEN
    CREATE POLICY "Admins can manage services"
      ON service_credit_costs FOR ALL
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

-- Données par défaut avec codes cohérents
INSERT INTO service_credit_costs (
  service_code,
  service_name,
  service_description,
  credits_cost,
  category,
  display_order,
  icon
) VALUES
  (
    'ai_cv_generation',
    'Génération de CV IA',
    'Créez un CV professionnel optimisé par intelligence artificielle',
    30,
    'CV & Documents',
    1,
    'FileText'
  ),
  (
    'ai_cover_letter',
    'Génération Lettre de Motivation',
    'Générez une lettre de motivation personnalisée et convaincante',
    20,
    'CV & Documents',
    2,
    'Mail'
  ),
  (
    'ai_matching',
    'Matching Intelligent',
    'Analysez la compatibilité entre votre profil et une offre d''emploi',
    50,
    'Analyse & Matching',
    3,
    'Target'
  ),
  (
    'ai_coach',
    'Coaching Entretien',
    'Préparez-vous aux entretiens avec des simulations et conseils personnalisés',
    60,
    'Coaching',
    4,
    'Users'
  ),
  (
    'ai_career_plan',
    'Plan de Carrière',
    'Obtenez un plan de carrière personnalisé avec objectifs et étapes',
    40,
    'Analyse & Matching',
    5,
    'TrendingUp'
  ),
  (
    'profile_visibility_boost',
    'Boost de Visibilité',
    'Augmentez la visibilité de votre profil pendant 30 jours',
    25,
    'Services Premium',
    6,
    'Eye'
  ),
  (
    'featured_application',
    'Candidature en Vedette',
    'Placez votre candidature en tête de liste',
    15,
    'Services Premium',
    7,
    'Star'
  )
ON CONFLICT (service_code) DO UPDATE SET
  service_name = EXCLUDED.service_name,
  service_description = EXCLUDED.service_description,
  credits_cost = EXCLUDED.credits_cost,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon,
  updated_at = now();

-- Trigger pour mise à jour automatique updated_at
CREATE OR REPLACE FUNCTION update_service_credit_costs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_service_credit_costs_updated_at ON service_credit_costs;
CREATE TRIGGER set_service_credit_costs_updated_at
  BEFORE UPDATE ON service_credit_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_service_credit_costs_updated_at();