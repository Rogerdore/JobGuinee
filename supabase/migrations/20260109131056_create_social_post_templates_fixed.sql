/*
  # Social Post Templates System

  1. New Table
    - `social_post_templates`
      - Customizable templates for social media posts
      - Supports multiple templates per platform
      - Includes template variables

  2. Security
    - Enable RLS
    - Admin full access
    - Authenticated users can read

  3. Functions
    - Get template by platform
    - Get default template for platform
*/

-- Create table
CREATE TABLE IF NOT EXISTS social_post_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('facebook', 'linkedin', 'twitter', 'whatsapp')),
  template text NOT NULL,
  is_default boolean DEFAULT false NOT NULL,
  variables jsonb DEFAULT '["title", "location", "contract_type", "company", "url"]'::jsonb NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE social_post_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin full access to templates" ON social_post_templates;
DROP POLICY IF EXISTS "Authenticated users can read templates" ON social_post_templates;

-- Admin full access
CREATE POLICY "Admin full access to templates"
  ON social_post_templates
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

-- Authenticated users can read
CREATE POLICY "Authenticated users can read templates"
  ON social_post_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_post_templates_platform ON social_post_templates(platform);
CREATE INDEX IF NOT EXISTS idx_post_templates_default ON social_post_templates(is_default);

-- Drop existing functions
DROP FUNCTION IF EXISTS get_default_template(text);
DROP FUNCTION IF EXISTS get_templates_by_platform(text);

-- Function to get default template for platform
CREATE FUNCTION get_default_template(p_platform text)
RETURNS TABLE (
  id uuid,
  name text,
  template text,
  variables jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.template,
    t.variables
  FROM social_post_templates t
  WHERE t.platform = p_platform
  AND t.is_default = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all templates for platform
CREATE FUNCTION get_templates_by_platform(p_platform text)
RETURNS TABLE (
  id uuid,
  name text,
  template text,
  is_default boolean,
  variables jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.template,
    t.is_default,
    t.variables
  FROM social_post_templates t
  WHERE t.platform = p_platform
  ORDER BY t.is_default DESC, t.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to ensure only one default per platform
CREATE OR REPLACE FUNCTION ensure_single_default_template()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE social_post_templates
    SET is_default = false
    WHERE platform = NEW.platform
    AND id != NEW.id
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_default_template_trigger ON social_post_templates;
CREATE TRIGGER ensure_single_default_template_trigger
  BEFORE INSERT OR UPDATE ON social_post_templates
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_template();

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_social_post_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_social_post_templates_updated_at_trigger ON social_post_templates;
CREATE TRIGGER update_social_post_templates_updated_at_trigger
  BEFORE UPDATE ON social_post_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_social_post_templates_updated_at();