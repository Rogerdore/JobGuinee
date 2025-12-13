/*
  # Centre de Documentation Intelligent du Candidat

  1. Nouvelle table candidate_documents
    - Table centrale pour tous les documents
    - Versioning automatique
    - Métadonnées et tags intelligents
    - Traçabilité complète
  
  2. Table candidate_document_usage
    - Historique des utilisations
    - Lien avec candidatures, formations, etc.
  
  3. Sécurité RLS
    - Accès limité au candidat propriétaire uniquement
    - Aucun accès recruteur sans autorisation
*/

-- Type enums
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type') THEN
    CREATE TYPE document_type AS ENUM ('cv', 'cover_letter', 'certificate', 'other');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_source') THEN
    CREATE TYPE document_source AS ENUM ('upload', 'ai_generated', 'application', 'formation', 'system');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_usage_type') THEN
    CREATE TYPE document_usage_type AS ENUM ('application', 'shared', 'downloaded', 'viewed', 'generated');
  END IF;
END $$;

-- Table principale des documents
CREATE TABLE IF NOT EXISTS candidate_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  document_source document_source NOT NULL DEFAULT 'upload',
  
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text,
  file_size bigint,
  
  version integer NOT NULL DEFAULT 1,
  is_primary boolean NOT NULL DEFAULT false,
  parent_document_id uuid REFERENCES candidate_documents(id),
  
  metadata jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT ARRAY[]::text[],
  
  usage_count integer NOT NULL DEFAULT 0,
  last_used_at timestamptz,
  
  archived_at timestamptz,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Contrainte unique pour document principal par type
CREATE UNIQUE INDEX IF NOT EXISTS unique_primary_per_type
  ON candidate_documents(candidate_id, document_type)
  WHERE is_primary = true AND archived_at IS NULL;

-- Table de traçabilité des usages
CREATE TABLE IF NOT EXISTS candidate_document_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES candidate_documents(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  usage_type document_usage_type NOT NULL,
  
  related_entity_id uuid,
  related_entity_type text,
  
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_candidate_documents_candidate_id ON candidate_documents(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_documents_type ON candidate_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_candidate_documents_source ON candidate_documents(document_source);
CREATE INDEX IF NOT EXISTS idx_candidate_documents_archived ON candidate_documents(archived_at) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_candidate_documents_tags ON candidate_documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_candidate_documents_metadata ON candidate_documents USING GIN(metadata);

CREATE INDEX IF NOT EXISTS idx_document_usage_document_id ON candidate_document_usage(document_id);
CREATE INDEX IF NOT EXISTS idx_document_usage_candidate_id ON candidate_document_usage(candidate_id);
CREATE INDEX IF NOT EXISTS idx_document_usage_type ON candidate_document_usage(usage_type);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_candidate_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_candidate_documents_updated_at ON candidate_documents;
CREATE TRIGGER trigger_update_candidate_documents_updated_at
  BEFORE UPDATE ON candidate_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_candidate_documents_updated_at();

-- Fonction pour incrémenter usage_count
CREATE OR REPLACE FUNCTION increment_document_usage(
  p_document_id uuid, 
  p_usage_type document_usage_type, 
  p_related_entity_id uuid DEFAULT NULL, 
  p_related_entity_type text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_candidate_id uuid;
BEGIN
  SELECT candidate_id INTO v_candidate_id
  FROM candidate_documents
  WHERE id = p_document_id;
  
  IF v_candidate_id IS NULL THEN
    RAISE EXCEPTION 'Document not found';
  END IF;
  
  UPDATE candidate_documents
  SET 
    usage_count = usage_count + 1,
    last_used_at = now()
  WHERE id = p_document_id;
  
  INSERT INTO candidate_document_usage (
    document_id,
    candidate_id,
    usage_type,
    related_entity_id,
    related_entity_type
  ) VALUES (
    p_document_id,
    v_candidate_id,
    p_usage_type,
    p_related_entity_id,
    p_related_entity_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE candidate_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_document_usage ENABLE ROW LEVEL SECURITY;

-- Policies pour candidate_documents
DROP POLICY IF EXISTS "Candidates can view own documents" ON candidate_documents;
CREATE POLICY "Candidates can view own documents"
  ON candidate_documents FOR SELECT
  TO authenticated
  USING (candidate_id = auth.uid());

DROP POLICY IF EXISTS "Candidates can insert own documents" ON candidate_documents;
CREATE POLICY "Candidates can insert own documents"
  ON candidate_documents FOR INSERT
  TO authenticated
  WITH CHECK (candidate_id = auth.uid());

DROP POLICY IF EXISTS "Candidates can update own documents" ON candidate_documents;
CREATE POLICY "Candidates can update own documents"
  ON candidate_documents FOR UPDATE
  TO authenticated
  USING (candidate_id = auth.uid())
  WITH CHECK (candidate_id = auth.uid());

DROP POLICY IF EXISTS "Candidates can delete own documents" ON candidate_documents;
CREATE POLICY "Candidates can delete own documents"
  ON candidate_documents FOR DELETE
  TO authenticated
  USING (candidate_id = auth.uid());

-- Policies pour candidate_document_usage
DROP POLICY IF EXISTS "Candidates can view own usage" ON candidate_document_usage;
CREATE POLICY "Candidates can view own usage"
  ON candidate_document_usage FOR SELECT
  TO authenticated
  USING (candidate_id = auth.uid());

DROP POLICY IF EXISTS "System can insert usage" ON candidate_document_usage;
CREATE POLICY "System can insert usage"
  ON candidate_document_usage FOR INSERT
  TO authenticated
  WITH CHECK (candidate_id = auth.uid());