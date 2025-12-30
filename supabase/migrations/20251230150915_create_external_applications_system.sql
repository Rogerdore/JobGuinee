/*
  # Module Candidatures Externes JobGuinée

  1. Tables créées
    - `external_applications`: Candidatures à des offres externes
    - `public_profile_tokens`: Tokens pour accès public aux profils
    - `external_application_documents`: Documents joints aux candidatures externes
    - `external_application_relances`: Historique des relances

  2. Fonctionnalités
    - Import d'offres externes via URL
    - Envoi de candidatures par email
    - Accès public sécurisé au profil candidat
    - Suivi et relances des candidatures
    - Configuration Admin

  3. Sécurité
    - RLS complet sur toutes les tables
    - Tokens sécurisés avec expiration
    - Journalisation des accès
    - Protection anti-spam
*/

-- Table des candidatures externes
CREATE TABLE IF NOT EXISTS external_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Informations sur l'offre externe
  job_title text NOT NULL,
  company_name text NOT NULL,
  job_url text,
  job_description text,
  
  -- Contact recruteur externe
  recruiter_email text NOT NULL,
  recruiter_name text,
  
  -- Documents joints (références)
  cv_document_id uuid REFERENCES candidate_documents(id),
  cover_letter_document_id uuid REFERENCES candidate_documents(id),
  additional_document_ids uuid[] DEFAULT ARRAY[]::uuid[],
  
  -- CV source tracking
  cv_source text CHECK (cv_source IN ('profile', 'document_center', 'uploaded')),
  
  -- Message personnalisé
  custom_message text,
  
  -- Token profil public envoyé
  public_profile_token uuid,
  
  -- Statut
  status text DEFAULT 'sent' CHECK (status IN (
    'sent', 'in_progress', 'relance_sent', 'rejected', 
    'accepted', 'no_response', 'cancelled'
  )),
  
  -- Métadonnées envoi
  sent_at timestamptz DEFAULT now(),
  email_sent_successfully boolean DEFAULT false,
  email_error_message text,
  
  -- Suivi
  last_relance_at timestamptz,
  relance_count integer DEFAULT 0,
  candidate_notes text,
  
  -- Import automatique
  imported_from_url boolean DEFAULT false,
  import_method text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des tokens d'accès public au profil
CREATE TABLE IF NOT EXISTS public_profile_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Token sécurisé
  token text UNIQUE NOT NULL,
  
  -- Expiration
  expires_at timestamptz NOT NULL,
  is_revoked boolean DEFAULT false,
  
  -- Tracking
  created_for_application_id uuid REFERENCES external_applications(id),
  view_count integer DEFAULT 0,
  last_viewed_at timestamptz,
  
  -- Métadonnées
  allowed_sections text[] DEFAULT ARRAY['basic', 'experience', 'education', 'skills', 'documents']::text[],
  custom_message text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table liaison documents candidatures externes
CREATE TABLE IF NOT EXISTS external_application_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_application_id uuid REFERENCES external_applications(id) ON DELETE CASCADE NOT NULL,
  document_id uuid REFERENCES candidate_documents(id) ON DELETE CASCADE NOT NULL,
  document_type text CHECK (document_type IN ('cv', 'cover_letter', 'certificate', 'other')),
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Table des relances
CREATE TABLE IF NOT EXISTS external_application_relances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_application_id uuid REFERENCES external_applications(id) ON DELETE CASCADE NOT NULL,
  
  -- Contenu relance
  message text NOT NULL,
  
  -- Envoi
  sent_at timestamptz DEFAULT now(),
  email_sent_successfully boolean DEFAULT false,
  email_error_message text,
  
  -- Métadonnées
  created_at timestamptz DEFAULT now()
);

-- Configuration Admin du module
CREATE TABLE IF NOT EXISTS external_applications_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Activation module
  module_enabled boolean DEFAULT true,
  
  -- Règles d'accès
  min_profile_completion integer DEFAULT 80,
  
  -- Limites fichiers
  max_file_size_mb integer DEFAULT 10,
  allowed_file_types text[] DEFAULT ARRAY['pdf', 'doc', 'docx', 'jpg', 'png']::text[],
  
  -- Limites anti-spam
  max_applications_per_day integer DEFAULT 10,
  max_relances_per_application integer DEFAULT 3,
  min_days_between_relances integer DEFAULT 7,
  
  -- Durée token profil public
  token_validity_days integer DEFAULT 90,
  
  -- Templates email
  application_email_template text,
  relance_email_template text,
  
  -- Métadonnées
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES profiles(id)
);

-- Insérer configuration par défaut
INSERT INTO external_applications_config (
  module_enabled,
  min_profile_completion,
  max_applications_per_day,
  token_validity_days
) VALUES (
  true,
  80,
  10,
  90
) ON CONFLICT DO NOTHING;

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_external_applications_candidate ON external_applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_external_applications_status ON external_applications(status);
CREATE INDEX IF NOT EXISTS idx_external_applications_sent_at ON external_applications(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_profile_tokens_token ON public_profile_tokens(token) WHERE NOT is_revoked;
CREATE INDEX IF NOT EXISTS idx_public_profile_tokens_candidate ON public_profile_tokens(candidate_id);
CREATE INDEX IF NOT EXISTS idx_external_application_documents_app ON external_application_documents(external_application_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_external_application_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_external_applications_updated_at
  BEFORE UPDATE ON external_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_external_application_updated_at();

CREATE TRIGGER trigger_public_profile_tokens_updated_at
  BEFORE UPDATE ON public_profile_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_external_application_updated_at();

-- RLS Policies

-- external_applications
ALTER TABLE external_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidats voient leurs candidatures externes"
  ON external_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = candidate_id);

CREATE POLICY "Candidats créent leurs candidatures externes"
  ON external_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Candidats modifient leurs candidatures externes"
  ON external_applications FOR UPDATE
  TO authenticated
  USING (auth.uid() = candidate_id)
  WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Admins voient toutes les candidatures externes"
  ON external_applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- public_profile_tokens
ALTER TABLE public_profile_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidats voient leurs tokens"
  ON public_profile_tokens FOR SELECT
  TO authenticated
  USING (auth.uid() = candidate_id);

CREATE POLICY "Candidats créent leurs tokens"
  ON public_profile_tokens FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Candidats modifient leurs tokens"
  ON public_profile_tokens FOR UPDATE
  TO authenticated
  USING (auth.uid() = candidate_id)
  WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Admins voient tous les tokens"
  ON public_profile_tokens FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- external_application_documents
ALTER TABLE external_application_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidats voient leurs documents de candidatures"
  ON external_application_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM external_applications
      WHERE external_applications.id = external_application_documents.external_application_id
      AND external_applications.candidate_id = auth.uid()
    )
  );

CREATE POLICY "Candidats gèrent leurs documents de candidatures"
  ON external_application_documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM external_applications
      WHERE external_applications.id = external_application_documents.external_application_id
      AND external_applications.candidate_id = auth.uid()
    )
  );

-- external_application_relances
ALTER TABLE external_application_relances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidats voient leurs relances"
  ON external_application_relances FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM external_applications
      WHERE external_applications.id = external_application_relances.external_application_id
      AND external_applications.candidate_id = auth.uid()
    )
  );

CREATE POLICY "Candidats créent leurs relances"
  ON external_application_relances FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM external_applications
      WHERE external_applications.id = external_application_relances.external_application_id
      AND external_applications.candidate_id = auth.uid()
    )
  );

-- external_applications_config
ALTER TABLE external_applications_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde voit la config"
  ON external_applications_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins modifient la config"
  ON external_applications_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Fonction pour vérifier l'accès au module
CREATE OR REPLACE FUNCTION check_external_application_access(p_candidate_id uuid)
RETURNS boolean AS $$
DECLARE
  v_config record;
  v_profile_completion integer;
BEGIN
  SELECT * INTO v_config FROM external_applications_config LIMIT 1;
  
  IF NOT v_config.module_enabled THEN
    RETURN false;
  END IF;
  
  SELECT profile_completion_percentage INTO v_profile_completion
  FROM candidate_profiles
  WHERE profile_id = p_candidate_id;
  
  IF v_profile_completion IS NULL THEN
    v_profile_completion := 0;
  END IF;
  
  RETURN v_profile_completion >= v_config.min_profile_completion;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour générer un token public unique
CREATE OR REPLACE FUNCTION generate_public_profile_token(
  p_candidate_id uuid,
  p_application_id uuid DEFAULT NULL
)
RETURNS text AS $$
DECLARE
  v_token text;
  v_expires_at timestamptz;
  v_config record;
BEGIN
  SELECT * INTO v_config FROM external_applications_config LIMIT 1;
  
  v_token := encode(gen_random_bytes(32), 'base64');
  v_token := replace(replace(replace(v_token, '+', '-'), '/', '_'), '=', '');
  
  v_expires_at := now() + (v_config.token_validity_days || ' days')::interval;
  
  INSERT INTO public_profile_tokens (
    candidate_id,
    token,
    expires_at,
    created_for_application_id
  ) VALUES (
    p_candidate_id,
    v_token,
    v_expires_at,
    p_application_id
  );
  
  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour incrémenter les vues d'un token
CREATE OR REPLACE FUNCTION increment_token_view_count(p_token text)
RETURNS void AS $$
BEGIN
  UPDATE public_profile_tokens
  SET
    view_count = view_count + 1,
    last_viewed_at = now()
  WHERE token = p_token
  AND NOT is_revoked
  AND expires_at > now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;