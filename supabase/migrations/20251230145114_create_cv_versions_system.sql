/*
  # Système de Gestion de Versions CV

  1. Tables créées
    - `cv_versions`: Stocke les différentes versions de CV d'un candidat
    - `cv_sections`: Stocke les sections individuelles d'un CV

  2. Fonctionnalités
    - Un candidat peut avoir plusieurs CV
    - Chaque CV peut avoir plusieurs versions
    - Historique complet des modifications
    - Liaison avec les candidatures
    - Templates et styles personnalisables

  3. Sécurité RLS
    - Candidats: accès complet à leurs propres CV
    - Recruteurs: accès lecture via candidatures
    - Admins: accès complet
*/

-- Table des versions de CV
CREATE TABLE IF NOT EXISTS cv_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Métadonnées CV
  cv_title text NOT NULL DEFAULT 'Mon CV',
  version_number integer NOT NULL DEFAULT 1,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,

  -- Données structurées du CV
  full_name text,
  professional_title text,
  email text,
  phone text,
  location text,
  nationality text,
  professional_summary text,

  -- Sections (JSON pour flexibilité)
  experiences jsonb DEFAULT '[]'::jsonb,
  education jsonb DEFAULT '[]'::jsonb,
  skills jsonb DEFAULT '[]'::jsonb,
  languages jsonb DEFAULT '[]'::jsonb,
  certifications jsonb DEFAULT '[]'::jsonb,
  projects jsonb DEFAULT '[]'::jsonb,

  -- Liens professionnels
  linkedin_url text,
  portfolio_url text,
  github_url text,
  other_urls jsonb DEFAULT '[]'::jsonb,

  -- Style et template
  template_id text DEFAULT 'modern',
  template_config jsonb DEFAULT '{}'::jsonb,
  color_scheme text DEFAULT 'blue',
  font_family text DEFAULT 'Inter',

  -- Métadonnées parsing
  parsed_from_file text,
  parsing_method text,
  parsing_confidence_score numeric(3,2),
  raw_parsed_data jsonb,

  -- Stats et tracking
  view_count integer DEFAULT 0,
  download_count integer DEFAULT 0,
  last_viewed_at timestamptz,
  last_downloaded_at timestamptz,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(profile_id, version_number)
);

-- Table des sections de CV
CREATE TABLE IF NOT EXISTS cv_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_version_id uuid REFERENCES cv_versions(id) ON DELETE CASCADE NOT NULL,

  -- Type de section
  section_type text NOT NULL CHECK (section_type IN (
    'experience',
    'education',
    'skill',
    'language',
    'certification',
    'project',
    'award',
    'volunteer',
    'hobby',
    'custom'
  )),

  -- Ordre d'affichage
  display_order integer NOT NULL DEFAULT 0,
  is_visible boolean DEFAULT true,

  -- Contenu de la section
  title text,
  subtitle text,
  organization text,
  location text,
  start_date date,
  end_date date,
  is_current boolean DEFAULT false,
  description text,
  achievements jsonb DEFAULT '[]'::jsonb,

  -- Métadonnées
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_cv_versions_profile ON cv_versions(profile_id);
CREATE INDEX IF NOT EXISTS idx_cv_versions_active ON cv_versions(profile_id, is_active);
CREATE INDEX IF NOT EXISTS idx_cv_versions_default ON cv_versions(profile_id, is_default);
CREATE INDEX IF NOT EXISTS idx_cv_sections_version ON cv_sections(cv_version_id);
CREATE INDEX IF NOT EXISTS idx_cv_sections_type ON cv_sections(cv_version_id, section_type);

-- Enable RLS
ALTER TABLE cv_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_sections ENABLE ROW LEVEL SECURITY;

-- Policies pour cv_versions
CREATE POLICY "Candidats peuvent voir leurs propres CV"
  ON cv_versions FOR SELECT
  TO authenticated
  USING (
    profile_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM applications a
      INNER JOIN jobs j ON a.job_id = j.id
      WHERE a.candidate_id = cv_versions.profile_id
      AND j.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.user_type = 'admin'
    )
  );

CREATE POLICY "Candidats peuvent créer leurs CV"
  ON cv_versions FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Candidats peuvent modifier leurs CV"
  ON cv_versions FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Candidats peuvent supprimer leurs CV"
  ON cv_versions FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- Policies pour cv_sections
CREATE POLICY "Candidats peuvent voir sections de leurs CV"
  ON cv_sections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cv_versions cv
      WHERE cv.id = cv_sections.cv_version_id
      AND (
        cv.profile_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM applications a
          INNER JOIN jobs j ON a.job_id = j.id
          WHERE a.candidate_id = cv.profile_id
          AND j.user_id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
          AND p.user_type = 'admin'
        )
      )
    )
  );

CREATE POLICY "Candidats peuvent créer sections de leurs CV"
  ON cv_sections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cv_versions cv
      WHERE cv.id = cv_sections.cv_version_id
      AND cv.profile_id = auth.uid()
    )
  );

CREATE POLICY "Candidats peuvent modifier sections de leurs CV"
  ON cv_sections FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cv_versions cv
      WHERE cv.id = cv_sections.cv_version_id
      AND cv.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cv_versions cv
      WHERE cv.id = cv_sections.cv_version_id
      AND cv.profile_id = auth.uid()
    )
  );

CREATE POLICY "Candidats peuvent supprimer sections de leurs CV"
  ON cv_sections FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cv_versions cv
      WHERE cv.id = cv_sections.cv_version_id
      AND cv.profile_id = auth.uid()
    )
  );

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_cv_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS trigger_cv_versions_updated_at ON cv_versions;
CREATE TRIGGER trigger_cv_versions_updated_at
  BEFORE UPDATE ON cv_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_cv_updated_at();

DROP TRIGGER IF EXISTS trigger_cv_sections_updated_at ON cv_sections;
CREATE TRIGGER trigger_cv_sections_updated_at
  BEFORE UPDATE ON cv_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_cv_updated_at();

-- Fonction pour incrémenter automatiquement version_number
CREATE OR REPLACE FUNCTION set_cv_version_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.version_number IS NULL OR NEW.version_number = 0 THEN
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO NEW.version_number
    FROM cv_versions
    WHERE profile_id = NEW.profile_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour version_number
DROP TRIGGER IF EXISTS trigger_set_cv_version_number ON cv_versions;
CREATE TRIGGER trigger_set_cv_version_number
  BEFORE INSERT ON cv_versions
  FOR EACH ROW
  EXECUTE FUNCTION set_cv_version_number();