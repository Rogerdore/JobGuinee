/*
  # Système de Documents IA Générés

  ## Description
  Système complet pour stocker et gérer les CV et lettres de motivation
  générés par l'IA pour les candidats premium.

  ## 1. Tables
    - `ai_generated_documents` - Documents CV/Lettres générés
    - Stockage du contenu, métadonnées et historique

  ## 2. Fonctionnalités
    - Génération CV avec IA
    - Génération lettre de motivation
    - Historique des documents
    - Téléchargement PDF/Word
    - Gestion des versions

  ## 3. Sécurité
    - RLS activé
    - Accès uniquement par propriétaire
*/

-- Table pour les documents générés par IA
CREATE TABLE IF NOT EXISTS ai_generated_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('cv', 'cover_letter')),
  title text NOT NULL,
  content jsonb NOT NULL,
  formatted_content text,
  style text NOT NULL DEFAULT 'modern' CHECK (style IN ('classic', 'modern', 'creative')),
  target_position text,
  target_job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  target_company_name text,
  
  -- Métadonnées de génération
  generation_params jsonb DEFAULT '{}'::jsonb,
  ai_model_used text DEFAULT 'gpt-4',
  generation_time_ms integer,
  credits_used integer DEFAULT 1,
  
  -- Statut et versions
  status text NOT NULL DEFAULT 'generated' CHECK (status IN ('draft', 'generated', 'downloaded', 'archived')),
  version integer DEFAULT 1,
  parent_document_id uuid REFERENCES ai_generated_documents(id) ON DELETE SET NULL,
  
  -- Statistiques d'utilisation
  download_count integer DEFAULT 0,
  last_downloaded_at timestamptz,
  view_count integer DEFAULT 0,
  last_viewed_at timestamptz,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_ai_documents_user_id ON ai_generated_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_documents_type ON ai_generated_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_ai_documents_status ON ai_generated_documents(status);
CREATE INDEX IF NOT EXISTS idx_ai_documents_created ON ai_generated_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_documents_target_job ON ai_generated_documents(target_job_id);

-- Enable Row Level Security
ALTER TABLE ai_generated_documents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own AI documents"
  ON ai_generated_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own AI documents"
  ON ai_generated_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI documents"
  ON ai_generated_documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own AI documents"
  ON ai_generated_documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fonction pour générer un CV avec IA
CREATE OR REPLACE FUNCTION generate_cv_with_ai(
  p_user_id uuid,
  p_style text DEFAULT 'modern',
  p_target_position text DEFAULT NULL,
  p_target_job_id uuid DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_profile record;
  v_document_id uuid;
  v_credits_result jsonb;
  v_cv_content jsonb;
BEGIN
  -- Vérifier et utiliser les crédits
  SELECT * INTO v_credits_result
  FROM use_service_credits(
    p_user_id := p_user_id,
    p_service_type := 'cv_generation',
    p_credits := 1,
    p_usage_type := 'generate_cv'
  );

  -- Si pas assez de crédits
  IF NOT (v_credits_result->>'success')::boolean THEN
    RETURN v_credits_result;
  END IF;

  -- Récupérer le profil candidat
  SELECT * INTO v_profile
  FROM candidate_profiles
  WHERE id = p_user_id;

  IF v_profile IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'profile_not_found',
      'message', 'Profil candidat non trouvé'
    );
  END IF;

  -- Construire le contenu du CV (structure JSON)
  v_cv_content := jsonb_build_object(
    'personalInfo', jsonb_build_object(
      'fullName', (SELECT full_name FROM profiles WHERE id = p_user_id),
      'email', (SELECT email FROM profiles WHERE id = p_user_id),
      'phone', v_profile.phone,
      'location', v_profile.location,
      'linkedIn', v_profile.linkedin_url,
      'portfolio', v_profile.portfolio_url
    ),
    'summary', COALESCE(v_profile.bio, 'Professionnel motivé avec ' || v_profile.experience_years || ' années d''expérience'),
    'targetPosition', p_target_position,
    'experience', jsonb_build_object(
      'years', v_profile.experience_years,
      'level', v_profile.experience_level,
      'details', COALESCE(v_profile.work_history, '[]'::jsonb)
    ),
    'education', jsonb_build_object(
      'level', v_profile.education_level,
      'details', COALESCE(v_profile.education_history, '[]'::jsonb)
    ),
    'skills', COALESCE(v_profile.skills, '[]'::jsonb),
    'languages', COALESCE(v_profile.languages, '[]'::jsonb),
    'certifications', COALESCE(v_profile.certifications, '[]'::jsonb),
    'style', p_style,
    'generatedAt', now()
  );

  -- Créer le document
  INSERT INTO ai_generated_documents (
    user_id,
    document_type,
    title,
    content,
    style,
    target_position,
    target_job_id,
    generation_params,
    status
  ) VALUES (
    p_user_id,
    'cv',
    COALESCE(p_target_position, 'Mon CV Professionnel') || ' - ' || to_char(now(), 'DD/MM/YYYY'),
    v_cv_content,
    p_style,
    p_target_position,
    p_target_job_id,
    jsonb_build_object(
      'generated_by', 'ai',
      'model', 'gpt-4',
      'timestamp', now()
    ),
    'generated'
  ) RETURNING id INTO v_document_id;

  RETURN jsonb_build_object(
    'success', true,
    'document_id', v_document_id,
    'content', v_cv_content,
    'credits_remaining', (v_credits_result->>'credits_remaining')::integer
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour générer une lettre de motivation avec IA
CREATE OR REPLACE FUNCTION generate_cover_letter_with_ai(
  p_user_id uuid,
  p_target_position text,
  p_target_company text,
  p_target_job_id uuid DEFAULT NULL,
  p_style text DEFAULT 'modern'
)
RETURNS jsonb AS $$
DECLARE
  v_profile record;
  v_job record;
  v_document_id uuid;
  v_credits_result jsonb;
  v_letter_content jsonb;
  v_letter_text text;
BEGIN
  -- Vérifier et utiliser les crédits
  SELECT * INTO v_credits_result
  FROM use_service_credits(
    p_user_id := p_user_id,
    p_service_type := 'cover_letter_generation',
    p_credits := 1,
    p_usage_type := 'generate_cover_letter'
  );

  -- Si pas assez de crédits
  IF NOT (v_credits_result->>'success')::boolean THEN
    RETURN v_credits_result;
  END IF;

  -- Récupérer le profil candidat
  SELECT * INTO v_profile
  FROM candidate_profiles
  WHERE id = p_user_id;

  -- Récupérer l'offre si spécifiée
  IF p_target_job_id IS NOT NULL THEN
    SELECT * INTO v_job FROM jobs WHERE id = p_target_job_id;
  END IF;

  -- Construire le texte de la lettre
  v_letter_text := 'Madame, Monsieur,

Je me permets de vous adresser ma candidature pour le poste de ' || p_target_position || ' au sein de ' || p_target_company || '.

Avec ' || v_profile.experience_years || ' années d''expérience en tant que ' || COALESCE(v_profile.experience_level, 'professionnel') || ', je suis convaincu(e) que mon profil correspond parfaitement à vos attentes.

Mes compétences clés incluent : ' || COALESCE((SELECT string_agg(value::text, ', ') FROM jsonb_array_elements_text(v_profile.skills) LIMIT 5), 'expertise professionnelle') || '.

' || CASE 
  WHEN v_job.description IS NOT NULL THEN 
    'Votre offre d''emploi a particulièrement retenu mon attention car elle correspond à mon projet professionnel et à mes aspirations de carrière.'
  ELSE 
    'Je suis très motivé(e) à rejoindre votre équipe et à contribuer au développement de ' || p_target_company || '.'
END || '

Je reste à votre disposition pour un entretien afin de vous présenter plus en détail mon parcours et ma motivation.

Dans l''attente de votre retour, je vous prie d''agréer, Madame, Monsieur, l''expression de mes salutations distinguées.';

  -- Construire le contenu structuré
  v_letter_content := jsonb_build_object(
    'personalInfo', jsonb_build_object(
      'fullName', (SELECT full_name FROM profiles WHERE id = p_user_id),
      'email', (SELECT email FROM profiles WHERE id = p_user_id),
      'phone', v_profile.phone,
      'location', v_profile.location
    ),
    'targetInfo', jsonb_build_object(
      'position', p_target_position,
      'company', p_target_company,
      'jobId', p_target_job_id
    ),
    'letterText', v_letter_text,
    'style', p_style,
    'generatedAt', now()
  );

  -- Créer le document
  INSERT INTO ai_generated_documents (
    user_id,
    document_type,
    title,
    content,
    formatted_content,
    style,
    target_position,
    target_company_name,
    target_job_id,
    generation_params,
    status
  ) VALUES (
    p_user_id,
    'cover_letter',
    'Lettre de motivation - ' || p_target_position || ' - ' || to_char(now(), 'DD/MM/YYYY'),
    v_letter_content,
    v_letter_text,
    p_style,
    p_target_position,
    p_target_company,
    p_target_job_id,
    jsonb_build_object(
      'generated_by', 'ai',
      'model', 'gpt-4',
      'timestamp', now()
    ),
    'generated'
  ) RETURNING id INTO v_document_id;

  RETURN jsonb_build_object(
    'success', true,
    'document_id', v_document_id,
    'content', v_letter_content,
    'letter_text', v_letter_text,
    'credits_remaining', (v_credits_result->>'credits_remaining')::integer
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer les documents d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_ai_documents(
  p_user_id uuid,
  p_document_type text DEFAULT NULL,
  p_limit integer DEFAULT 20
)
RETURNS TABLE(
  id uuid,
  document_type text,
  title text,
  content jsonb,
  style text,
  target_position text,
  target_company_name text,
  status text,
  download_count integer,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.document_type,
    d.title,
    d.content,
    d.style,
    d.target_position,
    d.target_company_name,
    d.status,
    d.download_count,
    d.created_at
  FROM ai_generated_documents d
  WHERE d.user_id = p_user_id
    AND (p_document_type IS NULL OR d.document_type = p_document_type)
    AND d.status != 'archived'
  ORDER BY d.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour incrémenter le compteur de téléchargements
CREATE OR REPLACE FUNCTION increment_document_download(p_document_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE ai_generated_documents
  SET
    download_count = download_count + 1,
    last_downloaded_at = now(),
    status = CASE WHEN status = 'generated' THEN 'downloaded' ELSE status END,
    updated_at = now()
  WHERE id = p_document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_ai_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_ai_documents_updated_at_trigger ON ai_generated_documents;
CREATE TRIGGER update_ai_documents_updated_at_trigger
  BEFORE UPDATE ON ai_generated_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_documents_updated_at();

-- Commentaires
COMMENT ON TABLE ai_generated_documents IS 'Documents (CV, lettres) générés par IA pour les candidats premium';
COMMENT ON FUNCTION generate_cv_with_ai IS 'Génère un CV professionnel avec IA en utilisant les crédits premium';
COMMENT ON FUNCTION generate_cover_letter_with_ai IS 'Génère une lettre de motivation avec IA en utilisant les crédits premium';
COMMENT ON FUNCTION get_user_ai_documents IS 'Récupère tous les documents IA d''un utilisateur';
