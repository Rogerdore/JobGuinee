/*
  # Apply IA Service Configuration System
  
  This migration creates the ia_service_config and ia_service_config_history tables
  with all necessary functions and default data.
*/

-- Create ia_service_config table
CREATE TABLE IF NOT EXISTS ia_service_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_code text UNIQUE NOT NULL,
  service_name text NOT NULL,
  service_description text,
  
  -- Prompt configuration
  base_prompt text NOT NULL,
  instructions text,
  system_message text,
  
  -- Input/Output schemas
  input_schema jsonb DEFAULT '{}'::jsonb,
  output_schema jsonb DEFAULT '{}'::jsonb,
  example_input jsonb,
  example_output jsonb,
  
  -- Model parameters
  model text DEFAULT 'gpt-4' NOT NULL,
  temperature numeric(3,2) DEFAULT 0.7,
  max_tokens integer DEFAULT 2000,
  top_p numeric(3,2) DEFAULT 1.0,
  frequency_penalty numeric(3,2) DEFAULT 0.0,
  presence_penalty numeric(3,2) DEFAULT 0.0,
  
  -- Version and status
  version integer DEFAULT 1 NOT NULL,
  is_active boolean DEFAULT true,
  
  -- Metadata
  category text DEFAULT 'general',
  tags text[],
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ia_service_config_history table
CREATE TABLE IF NOT EXISTS ia_service_config_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES ia_service_config(id) ON DELETE CASCADE,
  service_code text NOT NULL,
  
  -- Version tracking
  previous_version integer,
  new_version integer NOT NULL,
  
  -- Changes
  changes_summary text,
  field_changes jsonb NOT NULL,
  previous_config jsonb,
  new_config jsonb,
  
  -- Audit
  changed_by uuid REFERENCES auth.users(id),
  change_reason text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ia_service_config_code ON ia_service_config(service_code);
CREATE INDEX IF NOT EXISTS idx_ia_service_config_active ON ia_service_config(is_active);
CREATE INDEX IF NOT EXISTS idx_ia_service_config_category ON ia_service_config(category);
CREATE INDEX IF NOT EXISTS idx_ia_service_config_version ON ia_service_config(version);
CREATE INDEX IF NOT EXISTS idx_ia_config_history_service ON ia_service_config_history(service_id);
CREATE INDEX IF NOT EXISTS idx_ia_config_history_date ON ia_service_config_history(created_at DESC);

-- Function: Get active config for a service
CREATE OR REPLACE FUNCTION get_ia_service_config(p_service_code text)
RETURNS json AS $$
DECLARE
  v_config record;
BEGIN
  SELECT * INTO v_config
  FROM ia_service_config
  WHERE service_code = p_service_code
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'SERVICE_NOT_FOUND',
      'message', 'Service configuration not found'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'config', row_to_json(v_config)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update config (creates new version)
CREATE OR REPLACE FUNCTION update_ia_service_config(
  p_service_code text,
  p_updates jsonb,
  p_change_reason text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_current record;
  v_new_version integer;
  v_user_id uuid;
  v_service_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'UNAUTHORIZED',
      'message', 'User not authenticated'
    );
  END IF;

  -- Get current config
  SELECT * INTO v_current
  FROM ia_service_config
  WHERE service_code = p_service_code;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'SERVICE_NOT_FOUND',
      'message', 'Service not found'
    );
  END IF;

  v_new_version := v_current.version + 1;
  v_service_id := v_current.id;

  -- Save to history
  INSERT INTO ia_service_config_history (
    service_id,
    service_code,
    previous_version,
    new_version,
    field_changes,
    previous_config,
    new_config,
    changed_by,
    change_reason
  ) VALUES (
    v_service_id,
    p_service_code,
    v_current.version,
    v_new_version,
    p_updates,
    row_to_json(v_current)::jsonb,
    row_to_json(v_current)::jsonb || p_updates,
    v_user_id,
    p_change_reason
  );

  -- Update config
  UPDATE ia_service_config
  SET
    base_prompt = COALESCE((p_updates->>'base_prompt')::text, base_prompt),
    instructions = COALESCE((p_updates->>'instructions')::text, instructions),
    system_message = COALESCE((p_updates->>'system_message')::text, system_message),
    input_schema = COALESCE((p_updates->'input_schema')::jsonb, input_schema),
    output_schema = COALESCE((p_updates->'output_schema')::jsonb, output_schema),
    model = COALESCE((p_updates->>'model')::text, model),
    temperature = COALESCE((p_updates->>'temperature')::numeric, temperature),
    max_tokens = COALESCE((p_updates->>'max_tokens')::integer, max_tokens),
    top_p = COALESCE((p_updates->>'top_p')::numeric, top_p),
    frequency_penalty = COALESCE((p_updates->>'frequency_penalty')::numeric, frequency_penalty),
    presence_penalty = COALESCE((p_updates->>'presence_penalty')::numeric, presence_penalty),
    is_active = COALESCE((p_updates->>'is_active')::boolean, is_active),
    version = v_new_version,
    updated_by = v_user_id,
    updated_at = now()
  WHERE service_code = p_service_code;

  RETURN json_build_object(
    'success', true,
    'message', 'Configuration updated successfully',
    'new_version', v_new_version
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Create new service config
CREATE OR REPLACE FUNCTION create_ia_service_config(p_config jsonb)
RETURNS json AS $$
DECLARE
  v_user_id uuid;
  v_service_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'UNAUTHORIZED'
    );
  END IF;

  INSERT INTO ia_service_config (
    service_code,
    service_name,
    service_description,
    base_prompt,
    instructions,
    system_message,
    input_schema,
    output_schema,
    model,
    temperature,
    max_tokens,
    top_p,
    created_by,
    updated_by
  ) VALUES (
    p_config->>'service_code',
    p_config->>'service_name',
    p_config->>'service_description',
    p_config->>'base_prompt',
    p_config->>'instructions',
    p_config->>'system_message',
    COALESCE((p_config->'input_schema')::jsonb, '{}'::jsonb),
    COALESCE((p_config->'output_schema')::jsonb, '{}'::jsonb),
    COALESCE(p_config->>'model', 'gpt-4'),
    COALESCE((p_config->>'temperature')::numeric, 0.7),
    COALESCE((p_config->>'max_tokens')::integer, 2000),
    COALESCE((p_config->>'top_p')::numeric, 1.0),
    v_user_id,
    v_user_id
  )
  RETURNING id INTO v_service_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Service created successfully',
    'service_id', v_service_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE ia_service_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_service_config_history ENABLE ROW LEVEL SECURITY;

-- Admins can view all configs
DROP POLICY IF EXISTS "Admins can view configs" ON ia_service_config;
CREATE POLICY "Admins can view configs"
  ON ia_service_config FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Admins can update configs
DROP POLICY IF EXISTS "Admins can update configs" ON ia_service_config;
CREATE POLICY "Admins can update configs"
  ON ia_service_config FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Admins can insert configs
DROP POLICY IF EXISTS "Admins can insert configs" ON ia_service_config;
CREATE POLICY "Admins can insert configs"
  ON ia_service_config FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Anyone authenticated can read active configs
DROP POLICY IF EXISTS "Users can view active configs" ON ia_service_config;
CREATE POLICY "Users can view active configs"
  ON ia_service_config FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins can view history
DROP POLICY IF EXISTS "Admins can view history" ON ia_service_config_history;
CREATE POLICY "Admins can view history"
  ON ia_service_config_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Insert default configs for existing services
INSERT INTO ia_service_config (service_code, service_name, service_description, base_prompt, instructions, category) VALUES
  ('ai_cv_generation', 'Generation CV IA', 'Generation automatique de CV professionnels', 
   'Tu es un expert en redaction de CV professionnels. Cree un CV structure, clair et professionnel base sur les informations fournies.',
   'Respecte les standards internationaux. Utilise un ton professionnel. Mets en valeur les competences et experiences.',
   'document_generation'),
  
  ('ai_cover_letter', 'Lettre de Motivation IA', 'Generation de lettres de motivation personnalisees',
   'Tu es un expert en redaction de lettres de motivation. Cree une lettre persuasive et professionnelle.',
   'Personnalise selon le poste et l entreprise. Montre la motivation du candidat. Utilise un ton formel.',
   'document_generation'),
  
  ('ai_coach', 'Coach Carriere IA', 'Conseils personnalises pour evolution de carriere',
   'Tu es un coach carriere expert. Donne des conseils personnalises, pratiques et motiv ants.',
   'Analyse la situation du candidat. Propose des actions concretes. Encourage et motive.',
   'coaching'),
  
  ('ai_matching', 'Matching Candidat-Job IA', 'Analyse de compatibilite candidat/offre',
   'Tu es un expert en recrutement. Analyse la compatibilite entre un profil candidat et une offre d emploi.',
   'Evalue competences, experience, formation. Donne un score de compatibilite. Explique les points forts et axes d amelioration.',
   'matching'),
  
  ('ai_career_plan', 'Plan de Carriere IA', 'Creation de plans de carriere personnalises',
   'Tu es un conseiller en orientation professionnelle. Cree un plan de carriere detaille et realiste.',
   'Analyse les competences actuelles. Definis objectifs court/moyen/long terme. Propose etapes concretes.',
   'coaching')
ON CONFLICT (service_code) DO NOTHING;