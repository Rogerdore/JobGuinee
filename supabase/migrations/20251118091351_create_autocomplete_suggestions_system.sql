/*
  # Système de suggestions d'auto-complétion

  1. Nouvelles Tables
    - `autocomplete_suggestions`
      - `id` (uuid, primary key)
      - `category` (text) - Type de suggestion: job_title, skill, location, benefit, etc.
      - `value` (text) - La valeur de la suggestion
      - `frequency` (integer) - Nombre de fois utilisée
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `job_templates`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Recruteur qui a créé le template
      - `name` (text) - Nom du template
      - `template_data` (jsonb) - Données du formulaire sauvegardées
      - `is_public` (boolean) - Template public ou privé
      - `usage_count` (integer) - Nombre d'utilisations
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies pour lecture publique des suggestions
    - Policies pour création/modification restreintes

  3. Index
    - Index sur category et value pour recherche rapide
    - Index sur frequency pour tri
*/

-- Create autocomplete_suggestions table
CREATE TABLE IF NOT EXISTS autocomplete_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  value text NOT NULL,
  frequency integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(category, value)
);

ALTER TABLE autocomplete_suggestions ENABLE ROW LEVEL SECURITY;

-- Create job_templates table
CREATE TABLE IF NOT EXISTS job_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  template_data jsonb NOT NULL,
  is_public boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE job_templates ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_autocomplete_category ON autocomplete_suggestions(category);
CREATE INDEX IF NOT EXISTS idx_autocomplete_value ON autocomplete_suggestions(value);
CREATE INDEX IF NOT EXISTS idx_autocomplete_frequency ON autocomplete_suggestions(frequency DESC);
CREATE INDEX IF NOT EXISTS idx_job_templates_user ON job_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_job_templates_public ON job_templates(is_public) WHERE is_public = true;

-- RLS Policies for autocomplete_suggestions
CREATE POLICY "Anyone can read autocomplete suggestions"
  ON autocomplete_suggestions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert autocomplete suggestions"
  ON autocomplete_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update autocomplete suggestions"
  ON autocomplete_suggestions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for job_templates
CREATE POLICY "Users can read own templates"
  ON job_templates
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read public templates"
  ON job_templates
  FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can create own templates"
  ON job_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON job_templates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON job_templates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update suggestion frequency
CREATE OR REPLACE FUNCTION increment_suggestion_frequency(p_category text, p_value text)
RETURNS void AS $$
BEGIN
  INSERT INTO autocomplete_suggestions (category, value, frequency)
  VALUES (p_category, p_value, 1)
  ON CONFLICT (category, value)
  DO UPDATE SET 
    frequency = autocomplete_suggestions.frequency + 1,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert initial popular suggestions
INSERT INTO autocomplete_suggestions (category, value, frequency) VALUES
  -- Job Titles
  ('job_title', 'Ingénieur Logiciel', 50),
  ('job_title', 'Développeur Full Stack', 45),
  ('job_title', 'Chef de Projet', 40),
  ('job_title', 'Comptable', 38),
  ('job_title', 'Responsable RH', 35),
  ('job_title', 'Ingénieur Mines', 33),
  ('job_title', 'Analyste Financier', 30),
  ('job_title', 'Assistant Commercial', 28),
  ('job_title', 'Technicien Maintenance', 25),
  ('job_title', 'Responsable Logistique', 23),
  ('job_title', 'Data Analyst', 20),
  ('job_title', 'Développeur Mobile', 18),
  ('job_title', 'Gestionnaire de Paie', 15),
  
  -- Skills
  ('skill', 'JavaScript', 100),
  ('skill', 'React', 95),
  ('skill', 'Python', 90),
  ('skill', 'TypeScript', 85),
  ('skill', 'Node.js', 80),
  ('skill', 'SQL', 75),
  ('skill', 'Git', 70),
  ('skill', 'Gestion de projet', 65),
  ('skill', 'Communication', 60),
  ('skill', 'Travail en équipe', 58),
  ('skill', 'Excel', 55),
  ('skill', 'Comptabilité', 50),
  ('skill', 'SAP', 45),
  ('skill', 'Leadership', 40),
  ('skill', 'Anglais courant', 38),
  
  -- Locations
  ('location', 'Conakry', 200),
  ('location', 'Kaloum', 80),
  ('location', 'Matam', 60),
  ('location', 'Ratoma', 55),
  ('location', 'Matoto', 50),
  ('location', 'Kamsar', 45),
  ('location', 'Kindia', 40),
  ('location', 'Labé', 35),
  ('location', 'Kankan', 30),
  ('location', 'Nzérékoré', 25),
  ('location', 'Boké', 20),
  ('location', 'Dubréka', 15),
  
  -- Benefits
  ('benefit', 'Assurance santé', 100),
  ('benefit', 'Primes de performance', 95),
  ('benefit', 'Formation continue', 90),
  ('benefit', 'Télétravail possible', 85),
  ('benefit', 'Tickets restaurant', 80),
  ('benefit', 'Transport fourni', 75),
  ('benefit', 'Congés payés', 70),
  ('benefit', '13ème mois', 65),
  ('benefit', 'Plan de carrière', 60),
  ('benefit', 'Mutuelle familiale', 55),
  ('benefit', 'Horaires flexibles', 50),
  ('benefit', 'Prime annuelle', 45),
  
  -- Languages
  ('language', 'Français', 200),
  ('language', 'Anglais', 150),
  ('language', 'Soussou', 80),
  ('language', 'Peul', 75),
  ('language', 'Malinké', 70),
  ('language', 'Espagnol', 40),
  ('language', 'Arabe', 35),
  ('language', 'Portugais', 30)
ON CONFLICT (category, value) DO NOTHING;
