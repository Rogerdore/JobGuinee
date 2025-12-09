-- Create ia_service_config table
CREATE TABLE IF NOT EXISTS ia_service_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES ia_services(id) ON DELETE CASCADE NOT NULL,
  config_key text NOT NULL,
  config_value jsonb,
  description text,
  is_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(service_id, config_key)
);

-- Create ia_user_service_config table
CREATE TABLE IF NOT EXISTS ia_user_service_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_id uuid REFERENCES ia_services(id) ON DELETE CASCADE NOT NULL,
  config_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, service_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_service_config_service ON ia_service_config(service_id);
CREATE INDEX IF NOT EXISTS idx_user_service_config_user ON ia_user_service_config(user_id);
CREATE INDEX IF NOT EXISTS idx_user_service_config_service ON ia_user_service_config(service_id);

-- Enable RLS
ALTER TABLE ia_service_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_user_service_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view service configs"
  ON ia_service_config FOR SELECT
  USING (true);

CREATE POLICY "Users can view their service configs"
  ON ia_user_service_config FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their service configs"
  ON ia_user_service_config FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);