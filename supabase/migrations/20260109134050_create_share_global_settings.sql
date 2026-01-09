/*
  # Create Global Social Share Settings Table

  1. New Table
    - `share_global_settings` - Singleton table for centralized automation control
      - `id` (uuid, fixed to specific UUID) - Forces single row
      - `automation_enabled` (boolean) - Global kill switch for auto-sharing
      - `delay_minutes` (integer) - Delay before sharing (0-1440 minutes)
      - `default_image_url` (text) - Default OG image for shares
      - `default_fallback_text` (text) - Fallback text when template fails
      - `updated_by` (uuid) - Admin who made last change
      - `updated_at` (timestamptz) - Last modification timestamp
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS
    - Admin-only SELECT policy
    - Admin-only UPDATE policy
    - No INSERT/DELETE policies (singleton enforced by constraint)

  3. Features
    - Single row constraint ensures one global config
    - Auto-update timestamp trigger
    - Initial row created with safe defaults (automation disabled)
*/

-- Create singleton settings table
CREATE TABLE IF NOT EXISTS share_global_settings (
  id uuid PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  automation_enabled boolean NOT NULL DEFAULT false,
  delay_minutes integer DEFAULT 0 CHECK (delay_minutes >= 0 AND delay_minutes <= 1440),
  default_image_url text,
  default_fallback_text text DEFAULT 'Nouvelle offre d''emploi disponible sur JobGuinée !',
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row_only CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

-- Enable RLS
ALTER TABLE share_global_settings ENABLE ROW LEVEL SECURITY;

-- Admin-only SELECT policy
CREATE POLICY "Admins can view global settings"
  ON share_global_settings FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin'
  ));

-- Admin-only UPDATE policy
CREATE POLICY "Admins can update global settings"
  ON share_global_settings FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin'
  ));

-- Insert the single global settings row
INSERT INTO share_global_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;

-- Create or replace function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS share_global_settings_updated_at ON share_global_settings;
CREATE TRIGGER share_global_settings_updated_at
  BEFORE UPDATE ON share_global_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
