/*
  # Système de configuration du formulaire de publication d'offres

  1. Nouvelles Tables
    - `job_form_configuration`
      - `id` (uuid, primary key)
      - `section_key` (text) - Clé unique de la section (ex: general_info, job_details)
      - `section_title` (text) - Titre affiché de la section
      - `section_order` (integer) - Ordre d'affichage
      - `title_style` (jsonb) - Styles CSS du titre
      - `is_active` (boolean) - Section active ou non
      - `icon_name` (text) - Nom de l'icône Lucide React
      - `description` (text) - Description de la section
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS
    - Tous peuvent lire
    - Seuls les admins peuvent modifier

  3. Index
    - Index sur section_key pour recherche rapide
    - Index sur section_order pour tri
*/

-- Create job_form_configuration table
CREATE TABLE IF NOT EXISTS job_form_configuration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text UNIQUE NOT NULL,
  section_title text NOT NULL,
  section_order integer NOT NULL DEFAULT 0,
  title_style jsonb DEFAULT '{"fontSize": "xl", "fontWeight": "bold", "textTransform": "uppercase", "color": "gray-800"}'::jsonb,
  is_active boolean DEFAULT true,
  icon_name text DEFAULT 'FileText',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE job_form_configuration ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_job_form_config_key ON job_form_configuration(section_key);
CREATE INDEX IF NOT EXISTS idx_job_form_config_order ON job_form_configuration(section_order);
CREATE INDEX IF NOT EXISTS idx_job_form_config_active ON job_form_configuration(is_active) WHERE is_active = true;

-- RLS Policies
CREATE POLICY "Anyone can read form configuration"
  ON job_form_configuration
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can read all form configurations"
  ON job_form_configuration
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can insert form configurations"
  ON job_form_configuration
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update form configurations"
  ON job_form_configuration
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

CREATE POLICY "Admins can delete form configurations"
  ON job_form_configuration
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Insert default configuration
INSERT INTO job_form_configuration (section_key, section_title, section_order, icon_name, description, title_style) VALUES
  ('general_info', 'INFORMATIONS GÉNÉRALES', 1, 'FileText', 'Informations de base sur le poste', '{"fontSize": "xl", "fontWeight": "bold", "textTransform": "uppercase", "color": "gray-800"}'::jsonb),
  ('job_details', 'DÉTAILS DU POSTE', 2, 'Briefcase', 'Description et exigences du poste', '{"fontSize": "xl", "fontWeight": "bold", "textTransform": "uppercase", "color": "gray-800"}'::jsonb),
  ('company_info', 'INFORMATIONS ENTREPRISE', 3, 'Building2', 'Détails sur votre entreprise', '{"fontSize": "xl", "fontWeight": "bold", "textTransform": "uppercase", "color": "gray-800"}'::jsonb),
  ('salary_benefits', 'RÉMUNÉRATION ET AVANTAGES', 4, 'DollarSign', 'Salaire et bénéfices proposés', '{"fontSize": "xl", "fontWeight": "bold", "textTransform": "uppercase", "color": "gray-800"}'::jsonb),
  ('application_details', 'MODALITÉS DE CANDIDATURE', 5, 'Mail', 'Comment les candidats peuvent postuler', '{"fontSize": "xl", "fontWeight": "bold", "textTransform": "uppercase", "color": "gray-800"}'::jsonb),
  ('publication_settings', 'PARAMÈTRES DE PUBLICATION', 6, 'Eye', 'Visibilité et diffusion', '{"fontSize": "xl", "fontWeight": "bold", "textTransform": "uppercase", "color": "gray-800"}'::jsonb),
  ('legal_compliance', 'CONFORMITÉ ET VALIDATION', 7, 'CheckCircle2', 'Acceptation des conditions', '{"fontSize": "xl", "fontWeight": "bold", "textTransform": "uppercase", "color": "gray-800"}'::jsonb)
ON CONFLICT (section_key) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_job_form_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_form_config_timestamp
  BEFORE UPDATE ON job_form_configuration
  FOR EACH ROW
  EXECUTE FUNCTION update_job_form_config_updated_at();
