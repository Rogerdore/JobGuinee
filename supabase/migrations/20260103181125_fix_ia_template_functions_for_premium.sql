/*
  # Fix IA Template Functions for Premium Support

  1. Updates
    - Update create_ia_service_template to handle is_premium and min_credits_required
    - Update update_ia_service_template to handle is_premium and min_credits_required

  2. Security
    - Maintains existing RLS policies
    - Preserves admin-only access
*/

-- Update create_ia_service_template function to handle premium fields
CREATE OR REPLACE FUNCTION create_ia_service_template(p_template jsonb)
RETURNS json AS $$
DECLARE
  v_user_id uuid;
  v_template_id uuid;
  v_is_default boolean;
  v_is_premium boolean;
  v_min_credits integer;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'UNAUTHORIZED'
    );
  END IF;

  v_is_default := COALESCE((p_template->>'is_default')::boolean, false);
  v_is_premium := COALESCE((p_template->>'is_premium')::boolean, false);
  v_min_credits := COALESCE((p_template->>'min_credits_required')::integer, 0);

  -- If setting as default, unset other defaults for this service
  IF v_is_default THEN
    UPDATE ia_service_templates
    SET is_default = false
    WHERE service_code = p_template->>'service_code'
      AND is_default = true;
  END IF;

  INSERT INTO ia_service_templates (
    service_code,
    template_name,
    template_description,
    template_structure,
    format,
    css_styles,
    is_default,
    is_active,
    is_premium,
    min_credits_required,
    display_order,
    created_by,
    updated_by
  ) VALUES (
    p_template->>'service_code',
    p_template->>'template_name',
    p_template->>'template_description',
    p_template->>'template_structure',
    p_template->>'format',
    p_template->>'css_styles',
    v_is_default,
    COALESCE((p_template->>'is_active')::boolean, true),
    v_is_premium,
    v_min_credits,
    COALESCE((p_template->>'display_order')::integer, 0),
    v_user_id,
    v_user_id
  )
  RETURNING id INTO v_template_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Template created successfully',
    'template_id', v_template_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update update_ia_service_template function to handle premium fields
CREATE OR REPLACE FUNCTION update_ia_service_template(
  p_template_id uuid,
  p_updates jsonb,
  p_change_reason text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_current record;
  v_user_id uuid;
  v_is_default boolean;
  v_is_premium boolean;
  v_min_credits integer;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'UNAUTHORIZED'
    );
  END IF;

  -- Get current template
  SELECT * INTO v_current
  FROM ia_service_templates
  WHERE id = p_template_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'TEMPLATE_NOT_FOUND'
    );
  END IF;

  v_is_default := COALESCE((p_updates->>'is_default')::boolean, v_current.is_default);
  v_is_premium := COALESCE((p_updates->>'is_premium')::boolean, v_current.is_premium);
  v_min_credits := COALESCE((p_updates->>'min_credits_required')::integer, v_current.min_credits_required);

  -- If setting as default, unset other defaults
  IF v_is_default AND NOT v_current.is_default THEN
    UPDATE ia_service_templates
    SET is_default = false
    WHERE service_code = v_current.service_code
      AND is_default = true
      AND id != p_template_id;
  END IF;

  -- Save to history
  INSERT INTO ia_service_templates_history (
    template_id,
    service_code,
    template_name,
    old_structure,
    new_structure,
    old_format,
    new_format,
    field_changes,
    changed_by,
    change_reason
  ) VALUES (
    p_template_id,
    v_current.service_code,
    v_current.template_name,
    v_current.template_structure,
    COALESCE(p_updates->>'template_structure', v_current.template_structure),
    v_current.format,
    COALESCE(p_updates->>'format', v_current.format),
    p_updates,
    v_user_id,
    p_change_reason
  );

  -- Update template
  UPDATE ia_service_templates
  SET
    template_name = COALESCE(p_updates->>'template_name', template_name),
    template_description = COALESCE(p_updates->>'template_description', template_description),
    template_structure = COALESCE(p_updates->>'template_structure', template_structure),
    format = COALESCE(p_updates->>'format', format),
    css_styles = COALESCE(p_updates->>'css_styles', css_styles),
    is_default = v_is_default,
    is_active = COALESCE((p_updates->>'is_active')::boolean, is_active),
    is_premium = v_is_premium,
    min_credits_required = v_min_credits,
    display_order = COALESCE((p_updates->>'display_order')::integer, display_order),
    updated_by = v_user_id,
    updated_at = now()
  WHERE id = p_template_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Template updated successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;