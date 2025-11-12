/*
  # Système de Gestion des Documents Candidats

  ## Description
  Ce système permet aux candidats de gérer leurs documents professionnels:
  - CV (multiples versions)
  - Lettres de motivation
  - Certificats et diplômes
  - Portfolio et travaux
  - Autres documents

  ## 1. Nouvelle Table
    - `candidate_documents`
      - `id` (uuid, primary key)
      - `user_id` (uuid, référence auth.users)
      - `document_name` (text) - Nom du document
      - `document_type` (text) - cv, cover_letter, certificate, portfolio, other
      - `file_url` (text) - URL du fichier dans storage
      - `file_name` (text) - Nom original du fichier
      - `file_size` (bigint) - Taille en bytes
      - `file_type` (text) - MIME type (application/pdf, image/jpeg, etc.)
      - `is_primary` (boolean) - Document principal (pour CV)
      - `description` (text) - Description optionnelle
      - `tags` (text[]) - Tags pour organisation
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  ## 2. Sécurité
    - Enable RLS sur candidate_documents
    - Policies pour que les utilisateurs gèrent uniquement leurs documents
    - Storage policies pour accès sécurisé aux fichiers

  ## 3. Fonctions utiles
    - Fonction pour obtenir la taille totale des documents d'un utilisateur
    - Trigger pour mettre à jour updated_at
*/

-- Créer la table candidate_documents
CREATE TABLE IF NOT EXISTS candidate_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('cv', 'cover_letter', 'certificate', 'portfolio', 'diploma', 'recommendation', 'other')),
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  file_type text NOT NULL,
  is_primary boolean DEFAULT false,
  description text,
  tags text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_candidate_documents_user_id ON candidate_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_documents_type ON candidate_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_candidate_documents_primary ON candidate_documents(is_primary) WHERE is_primary = true;

-- Enable Row Level Security
ALTER TABLE candidate_documents ENABLE ROW LEVEL SECURITY;

-- Policies pour candidate_documents
CREATE POLICY "Users can view own documents"
  ON candidate_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own documents"
  ON candidate_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON candidate_documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON candidate_documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_candidate_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_candidate_documents_updated_at_trigger ON candidate_documents;
CREATE TRIGGER update_candidate_documents_updated_at_trigger
  BEFORE UPDATE ON candidate_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_candidate_documents_updated_at();

-- Fonction pour obtenir la taille totale des documents d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_documents_size(p_user_id uuid)
RETURNS bigint AS $$
  SELECT COALESCE(SUM(file_size), 0)
  FROM candidate_documents
  WHERE user_id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques des documents
CREATE OR REPLACE FUNCTION get_user_documents_stats(p_user_id uuid)
RETURNS TABLE(
  total_documents bigint,
  total_size bigint,
  cv_count bigint,
  certificate_count bigint,
  other_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_documents,
    COALESCE(SUM(file_size), 0)::bigint as total_size,
    COUNT(*) FILTER (WHERE document_type = 'cv')::bigint as cv_count,
    COUNT(*) FILTER (WHERE document_type IN ('certificate', 'diploma'))::bigint as certificate_count,
    COUNT(*) FILTER (WHERE document_type NOT IN ('cv', 'certificate', 'diploma'))::bigint as other_count
  FROM candidate_documents
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour s'assurer qu'il n'y a qu'un seul CV principal par utilisateur
CREATE OR REPLACE FUNCTION ensure_single_primary_cv()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le nouveau document est marqué comme principal
  IF NEW.is_primary = true AND NEW.document_type = 'cv' THEN
    -- Désactiver tous les autres CV principaux de cet utilisateur
    UPDATE candidate_documents
    SET is_primary = false
    WHERE user_id = NEW.user_id
      AND document_type = 'cv'
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ensure_single_primary_cv_trigger ON candidate_documents;
CREATE TRIGGER ensure_single_primary_cv_trigger
  BEFORE INSERT OR UPDATE ON candidate_documents
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_cv();

-- Créer le bucket de stockage si nécessaire (via Storage UI ou SQL)
-- Note: Cette partie sera gérée via l'interface Supabase Storage ou via les policies
