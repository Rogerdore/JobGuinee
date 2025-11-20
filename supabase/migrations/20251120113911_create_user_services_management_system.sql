/*
  # Create User Services Management System

  1. New Tables
    - `user_service_access` - Tracks which services each user has access to
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `service_code` (text)
      - `is_active` (boolean)
      - `granted_by` (uuid, admin who granted access)
      - `expires_at` (timestamp, null for unlimited)
      - `notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. New Functions
    - `get_all_users_with_services` - Returns all users with their service access
    - `toggle_user_service_access` - Enable/disable a service for a user
    - `grant_service_to_user` - Grant a specific service to a user
    - `revoke_service_from_user` - Revoke a specific service from a user
    - `get_user_active_services` - Get all active services for a user

  3. Security
    - Enable RLS on user_service_access table
    - Policies for admin access
    - Policies for users to view their own services
*/

-- Create user_service_access table
CREATE TABLE IF NOT EXISTS user_service_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_code text NOT NULL,
  is_active boolean DEFAULT true,
  granted_by uuid REFERENCES profiles(id),
  expires_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, service_code)
);

ALTER TABLE user_service_access ENABLE ROW LEVEL SECURITY;

-- Policies for user_service_access
CREATE POLICY "Admins can view all service access"
  ON user_service_access FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Users can view their own service access"
  ON user_service_access FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage service access"
  ON user_service_access FOR ALL
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

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_service_access_user_id ON user_service_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_service_access_service_code ON user_service_access(service_code);
CREATE INDEX IF NOT EXISTS idx_user_service_access_active ON user_service_access(is_active) WHERE is_active = true;

-- Function to get all users with their services
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
              (SELECT total_credits - used_credits FROM user_credit_balances WHERE user_id = p.id),
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

-- Function to toggle service access
CREATE OR REPLACE FUNCTION toggle_user_service_access(
  p_admin_id uuid,
  p_user_id uuid,
  p_service_code text,
  p_is_active boolean,
  p_expires_at timestamptz DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin boolean;
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

  -- Insert or update service access
  INSERT INTO user_service_access (
    user_id,
    service_code,
    is_active,
    granted_by,
    expires_at,
    notes,
    updated_at
  )
  VALUES (
    p_user_id,
    p_service_code,
    p_is_active,
    p_admin_id,
    p_expires_at,
    p_notes,
    now()
  )
  ON CONFLICT (user_id, service_code)
  DO UPDATE SET
    is_active = p_is_active,
    granted_by = p_admin_id,
    expires_at = p_expires_at,
    notes = COALESCE(p_notes, user_service_access.notes),
    updated_at = now();

  -- Create notification
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    p_user_id,
    CASE 
      WHEN p_is_active THEN 'Service activé'
      ELSE 'Service désactivé'
    END,
    format(
      'Le service "%s" a été %s par un administrateur.',
      p_service_code,
      CASE WHEN p_is_active THEN 'activé' ELSE 'désactivé' END
    ),
    CASE WHEN p_is_active THEN 'success' ELSE 'info' END
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', format('Service %s avec succès', CASE WHEN p_is_active THEN 'activé' ELSE 'désactivé' END)
  );
END;
$$;

-- Function to grant multiple services to user
CREATE OR REPLACE FUNCTION grant_services_to_user(
  p_admin_id uuid,
  p_user_id uuid,
  p_service_codes text[],
  p_expires_at timestamptz DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin boolean;
  v_service_code text;
  v_count int := 0;
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

  -- Grant each service
  FOREACH v_service_code IN ARRAY p_service_codes
  LOOP
    INSERT INTO user_service_access (
      user_id,
      service_code,
      is_active,
      granted_by,
      expires_at,
      notes
    )
    VALUES (
      p_user_id,
      v_service_code,
      true,
      p_admin_id,
      p_expires_at,
      p_notes
    )
    ON CONFLICT (user_id, service_code)
    DO UPDATE SET
      is_active = true,
      granted_by = p_admin_id,
      expires_at = p_expires_at,
      notes = COALESCE(p_notes, user_service_access.notes),
      updated_at = now();
    
    v_count := v_count + 1;
  END LOOP;

  -- Create notification
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    p_user_id,
    'Services activés',
    format('%s service(s) ont été activés sur votre compte.', v_count),
    'success'
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', format('%s service(s) activé(s) avec succès', v_count)
  );
END;
$$;

-- Function to check if user has access to service
CREATE OR REPLACE FUNCTION user_has_service_access(
  p_user_id uuid,
  p_service_code text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_has_access boolean;
BEGIN
  SELECT 
    CASE 
      WHEN usa.is_active IS NULL THEN false
      WHEN usa.expires_at IS NOT NULL AND usa.expires_at < now() THEN false
      ELSE usa.is_active
    END INTO v_has_access
  FROM user_service_access usa
  WHERE usa.user_id = p_user_id
  AND usa.service_code = p_service_code;

  RETURN COALESCE(v_has_access, false);
END;
$$;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_service_access_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_user_service_access_updated_at ON user_service_access;
CREATE TRIGGER trigger_update_user_service_access_updated_at
  BEFORE UPDATE ON user_service_access
  FOR EACH ROW
  EXECUTE FUNCTION update_user_service_access_updated_at();