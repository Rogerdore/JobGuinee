-- Migration: Add max_completion filter to calculate_communication_audience RPC
-- Fixes: min_completion=0 was bypassing the filter, and no max_completion support existed.

CREATE OR REPLACE FUNCTION calculate_communication_audience(
  p_filters jsonb
)
RETURNS integer AS $$
DECLARE
  v_count integer := 0;
  v_user_types text[];
  v_account_status text[];
  v_min_completion integer;
  v_max_completion integer;
BEGIN
  -- Extract filters from JSON
  v_user_types := ARRAY(SELECT jsonb_array_elements_text(p_filters->'user_types'));
  v_account_status := ARRAY(SELECT jsonb_array_elements_text(p_filters->'account_status'));
  v_min_completion := COALESCE((p_filters->>'min_completion')::integer, 0);
  v_max_completion := COALESCE((p_filters->>'max_completion')::integer, 100);

  -- Count matching users
  SELECT COUNT(DISTINCT u.id) INTO v_count
  FROM auth.users u
  LEFT JOIN profiles p ON p.id = u.id
  WHERE 1=1
    AND (CARDINALITY(v_user_types) = 0 OR p.user_type = ANY(v_user_types))
    -- min_completion: always apply (0 means >= 0 which is all, but combined with max it matters)
    AND COALESCE(p.profile_completion_percentage, 0) >= v_min_completion
    -- max_completion: apply when < 100 (100 means no upper bound)
    AND (v_max_completion = 100 OR COALESCE(p.profile_completion_percentage, 0) <= v_max_completion);

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
