/*
  # Create Service Credit Costs Table
  
  1. New Table
    - `service_credit_costs` - Configuration for credit costs per service
      - `service_code` (text) - Unique service identifier
      - `service_name` (text) - Display name for the service
      - `credits_cost` (integer) - Number of credits required
      - `is_active` (boolean) - Whether service is available
      - `category` (text) - Service category
      - `service_description` (text) - Description of service
  
  2. Security
    - Enable RLS on table
    - Add policy for public read access
    - Add policy for admin updates
*/

CREATE TABLE IF NOT EXISTS service_credit_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_code TEXT UNIQUE NOT NULL,
  service_name TEXT NOT NULL,
  service_description TEXT,
  credits_cost INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE service_credit_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active services"
  ON service_credit_costs
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can update services"
  ON service_credit_costs
  FOR UPDATE
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

CREATE POLICY "Only admins can insert services"
  ON service_credit_costs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

INSERT INTO service_credit_costs (service_code, service_name, service_description, credits_cost, is_active, category)
VALUES
  ('ai_cv_generation', 'Rédaction de CV IA', 'Génération automatique de CV professionnel', 30, true, 'cv'),
  ('ai_cover_letter_generation', 'Lettre de Motivation IA', 'Génération de lettre de motivation', 20, true, 'cover_letter'),
  ('job_matching', 'Analyse & Matching IA', 'Analyse et matching avec offres d''emploi', 50, true, 'matching'),
  ('interview_coaching', 'JobCoach IA', 'Coaching pour préparation aux entretiens', 60, true, 'coaching'),
  ('career_path_planning', 'Plan de Carrière IA', 'Planification de carrière personnalisée', 40, true, 'career_plan'),
  ('profile_visibility_boost', 'Boost de Visibilité', 'Augmenter la visibilité du profil', 25, true, 'visibility'),
  ('featured_application', 'Candidature Mise en Avant', 'Candidature mise en avant', 15, true, 'application')
ON CONFLICT (service_code) DO NOTHING;
