/*
  # Create Job Description Formatting Configuration

  1. New Table
    - `job_description_formatting`
      - `id` (uuid, primary key)
      - `heading_level_1_style` (jsonb) - Style for main titles (##)
      - `heading_level_2_style` (jsonb) - Style for sub-titles (###)
      - `text_style` (jsonb) - Style for regular text
      - `list_style` (jsonb) - Style for lists
      - `is_active` (boolean) - Active configuration
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Default Configuration
    - H1: Bold, Uppercase, Large font
    - H2: Bold, Uppercase, Medium font
    - Regular text: Normal styling

  3. Security
    - Enable RLS
    - Everyone can read active config
    - Only admins can create/update
*/

-- Create job_description_formatting table
CREATE TABLE IF NOT EXISTS job_description_formatting (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Configuration par défaut',
  heading_level_1_style jsonb DEFAULT '{
    "fontWeight": "bold",
    "textTransform": "uppercase",
    "fontSize": "1.5rem",
    "color": "#0E2F56",
    "marginTop": "1.5rem",
    "marginBottom": "1rem"
  }'::jsonb,
  heading_level_2_style jsonb DEFAULT '{
    "fontWeight": "bold",
    "textTransform": "uppercase",
    "fontSize": "1.25rem",
    "color": "#FF8C00",
    "marginTop": "1.25rem",
    "marginBottom": "0.75rem"
  }'::jsonb,
  heading_level_3_style jsonb DEFAULT '{
    "fontWeight": "600",
    "textTransform": "capitalize",
    "fontSize": "1.1rem",
    "color": "#0E2F56",
    "marginTop": "1rem",
    "marginBottom": "0.5rem"
  }'::jsonb,
  text_style jsonb DEFAULT '{
    "fontSize": "1rem",
    "lineHeight": "1.6",
    "color": "#374151",
    "marginBottom": "0.5rem"
  }'::jsonb,
  list_style jsonb DEFAULT '{
    "marginLeft": "1.5rem",
    "marginBottom": "0.5rem",
    "listStyleType": "disc"
  }'::jsonb,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_job_formatting_active ON job_description_formatting(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE job_description_formatting ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view active formatting"
  ON job_description_formatting
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can view all formatting configs"
  ON job_description_formatting
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can insert formatting configs"
  ON job_description_formatting
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update formatting configs"
  ON job_description_formatting
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

CREATE POLICY "Admins can delete formatting configs"
  ON job_description_formatting
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Insert default configuration
INSERT INTO job_description_formatting (name, is_active)
VALUES ('Configuration par défaut', true)
ON CONFLICT DO NOTHING;

-- Function to ensure only one active config
CREATE OR REPLACE FUNCTION ensure_single_active_formatting()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE job_description_formatting
    SET is_active = false
    WHERE id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure only one active config
DROP TRIGGER IF EXISTS trigger_single_active_formatting ON job_description_formatting;
CREATE TRIGGER trigger_single_active_formatting
  BEFORE INSERT OR UPDATE ON job_description_formatting
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION ensure_single_active_formatting();

-- Comments
COMMENT ON TABLE job_description_formatting IS 'Configuration du formatage des descriptions d''offres - titres en gras, majuscules, etc.';
COMMENT ON FUNCTION ensure_single_active_formatting IS 'Garantit qu''une seule configuration de formatage est active à la fois';
