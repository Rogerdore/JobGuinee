-- Create ia_service_templates_extended table
CREATE TABLE IF NOT EXISTS ia_service_templates_extended (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES ia_service_templates(id) ON DELETE CASCADE,
  template_name text NOT NULL,
  description text,
  template_content jsonb,
  category text,
  tags text[],
  is_public boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  rating numeric(3,2),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ia_template_variants table
CREATE TABLE IF NOT EXISTS ia_template_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES ia_service_templates(id) ON DELETE CASCADE NOT NULL,
  variant_name text NOT NULL,
  variant_config jsonb,
  description text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_templates_extended_category ON ia_service_templates_extended(category);
CREATE INDEX IF NOT EXISTS idx_templates_extended_public ON ia_service_templates_extended(is_public);
CREATE INDEX IF NOT EXISTS idx_template_variants_template ON ia_template_variants(template_id);

-- Enable RLS
ALTER TABLE ia_service_templates_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_template_variants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view public templates"
  ON ia_service_templates_extended FOR SELECT
  USING (is_public = true);

CREATE POLICY "Creators can manage their templates"
  ON ia_service_templates_extended FOR ALL
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Public can view template variants"
  ON ia_template_variants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ia_service_templates_extended
      WHERE ia_service_templates_extended.template_id = ia_template_variants.template_id
      AND ia_service_templates_extended.is_public = true
    )
  );