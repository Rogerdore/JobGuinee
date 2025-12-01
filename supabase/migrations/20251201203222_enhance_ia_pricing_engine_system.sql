/*
  # Enhance IA Pricing Engine System

  1. Improvements to service_credit_costs table
    - Add promotion_active (boolean) - Enable/disable promotional pricing
    - Add discount_percent (integer) - Percentage discount during promotions
    - Add display_order (integer) - Control order in admin interface
    - Add icon (text) - Icon name for UI display
    - Update updated_at trigger

  2. Database Functions
    - get_all_ia_services: Fetch all services with pricing details
    - update_ia_service_pricing: Update service pricing and promotions
    - add_new_ia_service: Add new AI service
    - get_effective_cost: Calculate cost with promotions applied
    - get_service_statistics: Get usage stats for each service

  3. Security
    - RLS policies for admin access only
    - Validation functions for pricing data

  4. Indexes
    - Performance indexes for common queries
*/

-- Add new columns to service_credit_costs if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_credit_costs' AND column_name = 'promotion_active'
  ) THEN
    ALTER TABLE service_credit_costs ADD COLUMN promotion_active boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_credit_costs' AND column_name = 'discount_percent'
  ) THEN
    ALTER TABLE service_credit_costs ADD COLUMN discount_percent integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_credit_costs' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE service_credit_costs ADD COLUMN display_order integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_credit_costs' AND column_name = 'icon'
  ) THEN
    ALTER TABLE service_credit_costs ADD COLUMN icon text DEFAULT 'Sparkles';
  END IF;
END $$;

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to service_credit_costs
DROP TRIGGER IF EXISTS update_service_credit_costs_updated_at ON service_credit_costs;
CREATE TRIGGER update_service_credit_costs_updated_at
  BEFORE UPDATE ON service_credit_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Get all IA services with full details
CREATE OR REPLACE FUNCTION get_all_ia_services()
RETURNS TABLE (
  id uuid,
  service_code text,
  service_name text,
  service_description text,
  credits_cost integer,
  is_active boolean,
  category text,
  promotion_active boolean,
  discount_percent integer,
  effective_cost integer,
  display_order integer,
  icon text,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    scc.id,
    scc.service_code,
    scc.service_name,
    scc.service_description,
    scc.credits_cost,
    scc.is_active,
    scc.category,
    scc.promotion_active,
    scc.discount_percent,
    CASE 
      WHEN scc.promotion_active THEN 
        GREATEST(0, scc.credits_cost - (scc.credits_cost * scc.discount_percent / 100))
      ELSE scc.credits_cost
    END::integer as effective_cost,
    scc.display_order,
    scc.icon,
    scc.created_at,
    scc.updated_at
  FROM service_credit_costs scc
  ORDER BY scc.display_order, scc.service_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update IA service pricing
CREATE OR REPLACE FUNCTION update_ia_service_pricing(
  p_service_code text,
  p_credits_cost integer DEFAULT NULL,
  p_is_active boolean DEFAULT NULL,
  p_promotion_active boolean DEFAULT NULL,
  p_discount_percent integer DEFAULT NULL,
  p_display_order integer DEFAULT NULL,
  p_icon text DEFAULT NULL,
  p_service_description text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_result json;
  v_service_exists boolean;
BEGIN
  -- Check if service exists
  SELECT EXISTS(
    SELECT 1 FROM service_credit_costs WHERE service_code = p_service_code
  ) INTO v_service_exists;

  IF NOT v_service_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'SERVICE_NOT_FOUND',
      'message', 'Service non trouvé'
    );
  END IF;

  -- Validate discount percent
  IF p_discount_percent IS NOT NULL AND (p_discount_percent < 0 OR p_discount_percent > 100) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'INVALID_DISCOUNT',
      'message', 'Le pourcentage de remise doit être entre 0 et 100'
    );
  END IF;

  -- Validate credits cost
  IF p_credits_cost IS NOT NULL AND p_credits_cost < 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'INVALID_COST',
      'message', 'Le coût ne peut pas être négatif'
    );
  END IF;

  -- Update service
  UPDATE service_credit_costs
  SET
    credits_cost = COALESCE(p_credits_cost, credits_cost),
    is_active = COALESCE(p_is_active, is_active),
    promotion_active = COALESCE(p_promotion_active, promotion_active),
    discount_percent = COALESCE(p_discount_percent, discount_percent),
    display_order = COALESCE(p_display_order, display_order),
    icon = COALESCE(p_icon, icon),
    service_description = COALESCE(p_service_description, service_description),
    updated_at = now()
  WHERE service_code = p_service_code;

  -- Return success with updated data
  SELECT json_build_object(
    'success', true,
    'message', 'Service mis à jour avec succès',
    'service', row_to_json(scc.*)
  ) INTO v_result
  FROM service_credit_costs scc
  WHERE scc.service_code = p_service_code;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Add new IA service
CREATE OR REPLACE FUNCTION add_new_ia_service(
  p_service_code text,
  p_service_name text,
  p_service_description text,
  p_credits_cost integer,
  p_category text DEFAULT 'ia_services',
  p_icon text DEFAULT 'Sparkles',
  p_is_active boolean DEFAULT true
)
RETURNS json AS $$
DECLARE
  v_service_exists boolean;
  v_new_service_id uuid;
BEGIN
  -- Validate inputs
  IF p_service_code IS NULL OR p_service_code = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'INVALID_CODE',
      'message', 'Le code du service est requis'
    );
  END IF;

  IF p_service_name IS NULL OR p_service_name = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'INVALID_NAME',
      'message', 'Le nom du service est requis'
    );
  END IF;

  IF p_credits_cost < 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'INVALID_COST',
      'message', 'Le coût ne peut pas être négatif'
    );
  END IF;

  -- Check if service code already exists
  SELECT EXISTS(
    SELECT 1 FROM service_credit_costs WHERE service_code = p_service_code
  ) INTO v_service_exists;

  IF v_service_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'DUPLICATE_CODE',
      'message', 'Un service avec ce code existe déjà'
    );
  END IF;

  -- Insert new service
  INSERT INTO service_credit_costs (
    service_code,
    service_name,
    service_description,
    credits_cost,
    category,
    icon,
    is_active,
    promotion_active,
    discount_percent,
    display_order
  ) VALUES (
    p_service_code,
    p_service_name,
    p_service_description,
    p_credits_cost,
    p_category,
    p_icon,
    p_is_active,
    false,
    0,
    0
  )
  RETURNING id INTO v_new_service_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Service créé avec succès',
    'service_id', v_new_service_id,
    'service_code', p_service_code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get effective cost for a service
CREATE OR REPLACE FUNCTION get_effective_cost(p_service_code text)
RETURNS integer AS $$
DECLARE
  v_cost integer;
  v_promotion_active boolean;
  v_discount integer;
  v_effective_cost integer;
BEGIN
  SELECT 
    credits_cost, 
    promotion_active, 
    discount_percent
  INTO v_cost, v_promotion_active, v_discount
  FROM service_credit_costs
  WHERE service_code = p_service_code AND is_active = true;

  IF v_cost IS NULL THEN
    RETURN NULL;
  END IF;

  IF v_promotion_active THEN
    v_effective_cost := GREATEST(0, v_cost - (v_cost * v_discount / 100));
  ELSE
    v_effective_cost := v_cost;
  END IF;

  RETURN v_effective_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get service statistics
CREATE OR REPLACE FUNCTION get_service_statistics()
RETURNS TABLE (
  service_code text,
  service_name text,
  total_usage_count bigint,
  total_credits_consumed bigint,
  last_used_at timestamptz,
  unique_users_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    scc.service_code,
    scc.service_name,
    COUNT(ash.id)::bigint as total_usage_count,
    COALESCE(SUM(ash.credits_consumed), 0)::bigint as total_credits_consumed,
    MAX(ash.created_at) as last_used_at,
    COUNT(DISTINCT ash.user_id)::bigint as unique_users_count
  FROM service_credit_costs scc
  LEFT JOIN ai_service_usage_history ash ON ash.service_key = scc.service_code
  GROUP BY scc.service_code, scc.service_name
  ORDER BY total_usage_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for service_credit_costs
ALTER TABLE service_credit_costs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all services" ON service_credit_costs;
DROP POLICY IF EXISTS "Admins can update services" ON service_credit_costs;
DROP POLICY IF EXISTS "Admins can insert services" ON service_credit_costs;
DROP POLICY IF EXISTS "Users can view active services" ON service_credit_costs;

-- Admin policies
CREATE POLICY "Admins can view all services"
  ON service_credit_costs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update services"
  ON service_credit_costs FOR UPDATE
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

CREATE POLICY "Admins can insert services"
  ON service_credit_costs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Regular users can view active services (for pricing display)
CREATE POLICY "Users can view active services"
  ON service_credit_costs FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_credit_costs_service_code 
  ON service_credit_costs(service_code);
CREATE INDEX IF NOT EXISTS idx_service_credit_costs_is_active 
  ON service_credit_costs(is_active);
CREATE INDEX IF NOT EXISTS idx_service_credit_costs_category 
  ON service_credit_costs(category);
CREATE INDEX IF NOT EXISTS idx_service_credit_costs_display_order 
  ON service_credit_costs(display_order);
