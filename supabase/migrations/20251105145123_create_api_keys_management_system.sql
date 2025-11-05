/*
  # Système de gestion des clés API pour services IA

  1. Nouvelle table
    - `api_keys`
      - `id` (uuid, primary key)
      - `service_name` (text) - Nom du service (OpenAI, Anthropic, etc.)
      - `api_key` (text) - Clé API chiffrée
      - `description` (text) - Description du service
      - `is_active` (boolean) - Statut actif/inactif
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `created_by` (uuid, foreign key to profiles)

  2. Sécurité
    - Enable RLS sur `api_keys` table
    - Seuls les administrateurs peuvent accéder aux clés API
    - Policies restrictives pour lecture/écriture

  3. Notes importantes
    - Les clés API sont sensibles et doivent être protégées
    - Seuls les admins peuvent voir et gérer les clés
    - Historique des modifications via updated_at
*/

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text NOT NULL UNIQUE,
  api_key text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Only admins can read API keys
CREATE POLICY "Admins can read API keys"
  ON api_keys
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Only admins can insert API keys
CREATE POLICY "Admins can insert API keys"
  ON api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Only admins can update API keys
CREATE POLICY "Admins can update API keys"
  ON api_keys
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

-- Only admins can delete API keys
CREATE POLICY "Admins can delete API keys"
  ON api_keys
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_api_keys_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_service_name ON api_keys(service_name);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_by ON api_keys(created_by);

-- Insert default API service entries (with empty keys to be configured by admin)
INSERT INTO api_keys (service_name, api_key, description, is_active, created_by)
VALUES 
  ('OpenAI', '', 'Service OpenAI pour génération de CV, matching IA, coach carrière', false, NULL),
  ('Anthropic Claude', '', 'Service Anthropic Claude pour assistance IA avancée', false, NULL),
  ('Gemini', '', 'Service Google Gemini pour analyse et génération de contenu', false, NULL)
ON CONFLICT (service_name) DO NOTHING;