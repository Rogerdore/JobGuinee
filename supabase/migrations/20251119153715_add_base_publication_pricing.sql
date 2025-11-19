/*
  # Add Base Publication Pricing Configuration

  1. New Table
    - `job_publication_base_pricing`
      - Prix de base pour publier une offre
      - Configurable par l'admin
      - Séparé des options premium

  2. Security
    - RLS activé
    - Admins peuvent tout gérer
    - Recruteurs peuvent voir les tarifs actifs
*/

CREATE TABLE IF NOT EXISTS job_publication_base_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Publication standard',
  description text DEFAULT 'Prix de base pour publier une offre d''emploi',
  price numeric(10,2) NOT NULL DEFAULT 500000.00,
  currency text DEFAULT 'GNF' NOT NULL,
  duration_days integer NOT NULL DEFAULT 30,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_base_pricing_active ON job_publication_base_pricing(is_active);

ALTER TABLE job_publication_base_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active base pricing"
  ON job_publication_base_pricing
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage base pricing"
  ON job_publication_base_pricing
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

INSERT INTO job_publication_base_pricing (name, description, price, duration_days) VALUES
  ('Publication standard', 'Prix de base pour publier une offre d''emploi sur la plateforme pendant 30 jours', 500000.00, 30)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE job_publication_base_pricing IS 'Configuration du prix de base pour la publication d''offres, séparé des options premium';