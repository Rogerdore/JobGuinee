-- Create ia_services table
CREATE TABLE IF NOT EXISTS ia_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type text NOT NULL,
  description text,
  price numeric(10,2),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ia_service_templates table
CREATE TABLE IF NOT EXISTS ia_service_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES ia_services(id) ON DELETE CASCADE,
  template_type text NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create ia_service_credits table
CREATE TABLE IF NOT EXISTS ia_service_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_id uuid REFERENCES ia_services(id) ON DELETE CASCADE NOT NULL,
  credits_balance numeric(10,2) DEFAULT 0,
  last_updated timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ia_services_active ON ia_services(is_active);
CREATE INDEX IF NOT EXISTS idx_ia_templates_service ON ia_service_templates(service_id);
CREATE INDEX IF NOT EXISTS idx_ia_credits_user ON ia_service_credits(user_id);

-- Enable RLS
ALTER TABLE ia_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_service_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_service_credits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view active services"
  ON ia_services FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can view their credits"
  ON ia_service_credits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);