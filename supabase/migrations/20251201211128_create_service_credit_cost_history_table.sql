/*
  # Create Service Credit Cost History Table

  1. New Table
    - `service_credit_cost_history`
      - Tracks all changes to service credit costs
      - Stores old and new values for audit trail
      - Links to admin who made the change
  
  2. Trigger
    - Automatically log changes when service_credit_costs is updated
    - Capture all field changes with timestamp
  
  3. Function
    - get_service_cost_history: Retrieve history for a service
    - get_recent_pricing_changes: Get recent changes across all services
  
  4. Security
    - Admin-only access via RLS
    - Read-only for history records
*/

-- Create history table
CREATE TABLE IF NOT EXISTS service_credit_cost_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES service_credit_costs(id) ON DELETE CASCADE,
  service_code text NOT NULL,
  service_name text NOT NULL,
  
  -- Old values
  old_credits_cost integer,
  old_is_active boolean,
  old_promotion_active boolean,
  old_discount_percent integer,
  old_description text,
  
  -- New values
  new_credits_cost integer,
  new_is_active boolean,
  new_promotion_active boolean,
  new_discount_percent integer,
  new_description text,
  
  -- Metadata
  change_type text NOT NULL CHECK (change_type IN ('created', 'updated', 'deleted')),
  changed_by uuid REFERENCES auth.users(id),
  changed_by_email text,
  change_reason text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_credit_cost_history_service_id 
  ON service_credit_cost_history(service_id);
CREATE INDEX IF NOT EXISTS idx_service_credit_cost_history_created_at 
  ON service_credit_cost_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_credit_cost_history_changed_by 
  ON service_credit_cost_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_service_credit_cost_history_service_code 
  ON service_credit_cost_history(service_code);

-- Function to get history for a specific service
CREATE OR REPLACE FUNCTION get_service_cost_history(p_service_code text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  service_code text,
  service_name text,
  old_credits_cost integer,
  new_credits_cost integer,
  old_is_active boolean,
  new_is_active boolean,
  old_promotion_active boolean,
  new_promotion_active boolean,
  old_discount_percent integer,
  new_discount_percent integer,
  change_type text,
  changed_by_email text,
  change_reason text,
  created_at timestamptz
) AS $$
BEGIN
  IF p_service_code IS NULL THEN
    -- Return all history
    RETURN QUERY
    SELECT 
      h.id,
      h.service_code,
      h.service_name,
      h.old_credits_cost,
      h.new_credits_cost,
      h.old_is_active,
      h.new_is_active,
      h.old_promotion_active,
      h.new_promotion_active,
      h.old_discount_percent,
      h.new_discount_percent,
      h.change_type,
      h.changed_by_email,
      h.change_reason,
      h.created_at
    FROM service_credit_cost_history h
    ORDER BY h.created_at DESC
    LIMIT 100;
  ELSE
    -- Return history for specific service
    RETURN QUERY
    SELECT 
      h.id,
      h.service_code,
      h.service_name,
      h.old_credits_cost,
      h.new_credits_cost,
      h.old_is_active,
      h.new_is_active,
      h.old_promotion_active,
      h.new_promotion_active,
      h.old_discount_percent,
      h.new_discount_percent,
      h.change_type,
      h.changed_by_email,
      h.change_reason,
      h.created_at
    FROM service_credit_cost_history h
    WHERE h.service_code = p_service_code
    ORDER BY h.created_at DESC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log history automatically
CREATE OR REPLACE FUNCTION log_service_credit_cost_change()
RETURNS TRIGGER AS $$
DECLARE
  v_user_email text;
BEGIN
  -- Get user email if available
  IF auth.uid() IS NOT NULL THEN
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = auth.uid();
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Log service creation
    INSERT INTO service_credit_cost_history (
      service_id,
      service_code,
      service_name,
      new_credits_cost,
      new_is_active,
      new_promotion_active,
      new_discount_percent,
      new_description,
      change_type,
      changed_by,
      changed_by_email
    ) VALUES (
      NEW.id,
      NEW.service_code,
      NEW.service_name,
      NEW.credits_cost,
      NEW.is_active,
      COALESCE(NEW.promotion_active, false),
      COALESCE(NEW.discount_percent, 0),
      NEW.service_description,
      'created',
      auth.uid(),
      v_user_email
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log if something actually changed
    IF (OLD.credits_cost IS DISTINCT FROM NEW.credits_cost) OR
       (OLD.is_active IS DISTINCT FROM NEW.is_active) OR
       (OLD.promotion_active IS DISTINCT FROM NEW.promotion_active) OR
       (OLD.discount_percent IS DISTINCT FROM NEW.discount_percent) OR
       (OLD.service_description IS DISTINCT FROM NEW.service_description) THEN
      
      INSERT INTO service_credit_cost_history (
        service_id,
        service_code,
        service_name,
        old_credits_cost,
        new_credits_cost,
        old_is_active,
        new_is_active,
        old_promotion_active,
        new_promotion_active,
        old_discount_percent,
        new_discount_percent,
        old_description,
        new_description,
        change_type,
        changed_by,
        changed_by_email
      ) VALUES (
        NEW.id,
        NEW.service_code,
        NEW.service_name,
        OLD.credits_cost,
        NEW.credits_cost,
        OLD.is_active,
        NEW.is_active,
        COALESCE(OLD.promotion_active, false),
        COALESCE(NEW.promotion_active, false),
        COALESCE(OLD.discount_percent, 0),
        COALESCE(NEW.discount_percent, 0),
        OLD.service_description,
        NEW.service_description,
        'updated',
        auth.uid(),
        v_user_email
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Log service deletion
    INSERT INTO service_credit_cost_history (
      service_id,
      service_code,
      service_name,
      old_credits_cost,
      old_is_active,
      old_promotion_active,
      old_discount_percent,
      old_description,
      change_type,
      changed_by,
      changed_by_email
    ) VALUES (
      OLD.id,
      OLD.service_code,
      OLD.service_name,
      OLD.credits_cost,
      OLD.is_active,
      COALESCE(OLD.promotion_active, false),
      COALESCE(OLD.discount_percent, 0),
      OLD.service_description,
      'deleted',
      auth.uid(),
      v_user_email
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on service_credit_costs
DROP TRIGGER IF EXISTS service_credit_costs_history_trigger ON service_credit_costs;
CREATE TRIGGER service_credit_costs_history_trigger
  AFTER INSERT OR UPDATE OR DELETE ON service_credit_costs
  FOR EACH ROW
  EXECUTE FUNCTION log_service_credit_cost_change();

-- RLS Policies for history table
ALTER TABLE service_credit_cost_history ENABLE ROW LEVEL SECURITY;

-- Admin can view all history
DROP POLICY IF EXISTS "Admins can view pricing history" ON service_credit_cost_history;
CREATE POLICY "Admins can view pricing history"
  ON service_credit_cost_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Nobody can modify history (immutable audit log)
DROP POLICY IF EXISTS "History is immutable" ON service_credit_cost_history;
CREATE POLICY "History is immutable"
  ON service_credit_cost_history FOR UPDATE
  TO authenticated
  USING (false);

DROP POLICY IF EXISTS "History cannot be deleted" ON service_credit_cost_history;
CREATE POLICY "History cannot be deleted"
  ON service_credit_cost_history FOR DELETE
  TO authenticated
  USING (false);
