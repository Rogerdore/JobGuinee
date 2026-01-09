/*
  # Social Platforms Configuration System

  1. New Table
    - `social_platforms_config`
      - Configuration for each social media platform
      - Stores credentials, templates, and settings
      - Enables/disables platforms and auto-sharing

  2. Security
    - Enable RLS
    - Admin full access policy
    - Public can read enabled platforms only

  3. Default Data
    - Pre-populate with Facebook, LinkedIn, Twitter, WhatsApp
    - Default templates with variables
    - All platforms disabled by default
*/

-- Create table
CREATE TABLE IF NOT EXISTS social_platforms_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('facebook', 'linkedin', 'twitter', 'whatsapp')),
  is_enabled boolean DEFAULT false NOT NULL,
  credentials jsonb DEFAULT '{}'::jsonb NOT NULL,
  post_template text DEFAULT '' NOT NULL,
  auto_share_enabled boolean DEFAULT false NOT NULL,
  settings jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(platform)
);

-- Enable RLS
ALTER TABLE social_platforms_config ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access to social platforms config"
  ON social_platforms_config
  FOR ALL
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

-- Public read enabled platforms
CREATE POLICY "Public read enabled social platforms"
  ON social_platforms_config
  FOR SELECT
  TO authenticated
  USING (is_enabled = true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_social_platforms_enabled ON social_platforms_config(is_enabled);
CREATE INDEX IF NOT EXISTS idx_social_platforms_auto_share ON social_platforms_config(auto_share_enabled);

-- Insert default platforms with templates
INSERT INTO social_platforms_config (platform, is_enabled, post_template, auto_share_enabled, settings) VALUES
(
  'facebook',
  false,
  '🎯 {title}
📍 {location}
💼 {contract_type}

Postulez maintenant: {url}

#JobGuinée #EmploiGuinée #Recrutement',
  false,
  jsonb_build_object(
    'page_id', '',
    'app_id', '',
    'app_secret', '',
    'access_token', '',
    'token_expires_at', null
  )
),
(
  'linkedin',
  false,
  '🎯 Nouvelle opportunité: {title}

📍 Localisation: {location}
💼 Type de contrat: {contract_type}
🏢 Entreprise: {company}

En savoir plus et postuler: {url}

#JobGuinée #Recrutement #Guinée #EmploiGuinée',
  false,
  jsonb_build_object(
    'client_id', '',
    'client_secret', '',
    'access_token', '',
    'token_expires_at', null,
    'organization_id', ''
  )
),
(
  'twitter',
  false,
  '🎯 {title} - {location}
💼 {contract_type}
chez {company}

{url}

#JobGuinée #EmploiGuinée #Recrutement',
  false,
  jsonb_build_object(
    'api_key', '',
    'api_secret', '',
    'bearer_token', '',
    'access_token', '',
    'access_token_secret', ''
  )
),
(
  'whatsapp',
  false,
  '🎯 *{title}*

📍 {location}
💼 {contract_type}
🏢 {company}

Postulez sur JobGuinée:
{url}',
  false,
  jsonb_build_object(
    'business_account_id', '',
    'phone_number_id', '',
    'access_token', ''
  )
)
ON CONFLICT (platform) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_social_platforms_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_social_platforms_config_updated_at_trigger ON social_platforms_config;
CREATE TRIGGER update_social_platforms_config_updated_at_trigger
  BEFORE UPDATE ON social_platforms_config
  FOR EACH ROW
  EXECUTE FUNCTION update_social_platforms_config_updated_at();