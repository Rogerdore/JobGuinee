/*
  # Fix get_all_users_with_services Function

  1. Changes
    - Fix column name from `used_credits` to `credits_used` in user_credit_balances
    - Correct the credit balance calculation
*/

-- Drop and recreate the function with correct column name
DROP FUNCTION IF EXISTS get_all_users_with_services(uuid);

CREATE OR REPLACE FUNCTION get_all_users_with_services(p_admin_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin boolean;
  v_result jsonb;
BEGIN
  -- Check if user is admin
  SELECT user_type = 'admin' INTO v_is_admin
  FROM profiles
  WHERE id = p_admin_id;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Accès refusé: droits administrateur requis'
    );
  END IF;

  -- Get all users with their service access
  SELECT jsonb_build_object(
    'success', true,
    'users', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', p.id,
            'email', u.email,
            'full_name', p.full_name,
            'user_type', p.user_type,
            'credit_balance', COALESCE(
              (SELECT total_credits - credits_used FROM user_credit_balances WHERE user_id = p.id),
              0
            ),
            'services', COALESCE(
              (
                SELECT jsonb_object_agg(
                  usa.service_code,
                  jsonb_build_object(
                    'is_active', usa.is_active,
                    'expires_at', usa.expires_at,
                    'notes', usa.notes,
                    'granted_at', usa.created_at
                  )
                )
                FROM user_service_access usa
                WHERE usa.user_id = p.id
              ),
              '{}'::jsonb
            ),
            'created_at', p.created_at
          )
          ORDER BY p.created_at DESC
        )
        FROM profiles p
        JOIN auth.users u ON u.id = p.id
        WHERE p.user_type IN ('candidate', 'recruiter', 'trainer')
      ),
      '[]'::jsonb
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
