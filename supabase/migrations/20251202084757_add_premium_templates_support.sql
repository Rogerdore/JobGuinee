/*
  # Add Premium Templates Support

  1. Changes
    - Add is_premium column to ia_service_templates
    - Add min_credits_required column
    - Create function to check template access
    - Add helper functions for premium logic

  2. Security
    - Premium validation at database level
    - Access control based on user credits
*/

-- Add premium columns to ia_service_templates
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ia_service_templates' AND column_name = 'is_premium'
  ) THEN
    ALTER TABLE ia_service_templates ADD COLUMN is_premium boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ia_service_templates' AND column_name = 'min_credits_required'
  ) THEN
    ALTER TABLE ia_service_templates ADD COLUMN min_credits_required integer DEFAULT 0;
  END IF;
END $$;

-- Function to check if user can access premium template
CREATE OR REPLACE FUNCTION can_access_template(
  p_user_id uuid,
  p_template_id uuid
)
RETURNS json AS $$
DECLARE
  v_template record;
  v_user_credits integer;
BEGIN
  -- Get template info
  SELECT is_premium, min_credits_required 
  INTO v_template
  FROM ia_service_templates
  WHERE id = p_template_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'TEMPLATE_NOT_FOUND'
    );
  END IF;

  -- If not premium, always accessible
  IF NOT v_template.is_premium THEN
    RETURN json_build_object(
      'success', true,
      'can_access', true
    );
  END IF;

  -- Check user credits
  SELECT COALESCE(credits_balance, 0)
  INTO v_user_credits
  FROM profiles
  WHERE id = p_user_id;

  IF v_user_credits >= v_template.min_credits_required THEN
    RETURN json_build_object(
      'success', true,
      'can_access', true
    );
  ELSE
    RETURN json_build_object(
      'success', true,
      'can_access', false,
      'required_credits', v_template.min_credits_required,
      'user_credits', v_user_credits
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get accessible templates for user
CREATE OR REPLACE FUNCTION get_accessible_templates(
  p_user_id uuid,
  p_service_code text
)
RETURNS json AS $$
DECLARE
  v_user_credits integer;
  v_templates json;
BEGIN
  -- Get user credits
  SELECT COALESCE(credits_balance, 0)
  INTO v_user_credits
  FROM profiles
  WHERE id = p_user_id;

  -- Get templates
  SELECT json_agg(
    json_build_object(
      'id', t.id,
      'template_name', t.template_name,
      'template_description', t.template_description,
      'format', t.format,
      'is_premium', t.is_premium,
      'min_credits_required', t.min_credits_required,
      'is_default', t.is_default,
      'can_access', CASE 
        WHEN NOT t.is_premium THEN true
        WHEN v_user_credits >= t.min_credits_required THEN true
        ELSE false
      END
    )
  )
  INTO v_templates
  FROM ia_service_templates t
  WHERE t.service_code = p_service_code
    AND t.is_active = true
  ORDER BY t.display_order, t.template_name;

  RETURN json_build_object(
    'success', true,
    'user_credits', v_user_credits,
    'templates', COALESCE(v_templates, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for premium templates
CREATE INDEX IF NOT EXISTS idx_ia_templates_premium ON ia_service_templates(is_premium, min_credits_required);

-- Update some templates to be premium examples
UPDATE ia_service_templates 
SET is_premium = true, min_credits_required = 100
WHERE template_name IN ('CV Moderne Professionnel', 'Lettre Moderne')
AND is_premium = false;
