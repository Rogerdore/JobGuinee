/*
  # Admin user management: activate, deactivate, delete users

  ## Changes
  1. Add `is_active` column to profiles (default true)
  2. Update `admin_list_all_users` to return is_active + banned_until + email_confirmed_at
  3. Create `admin_toggle_user_status` to activate/deactivate users (sets banned_until on auth.users)
  4. Create `admin_delete_user_account` to fully delete a user (auth + profiles cascade)
*/

-- 1. Add is_active to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 2. Update admin_list_all_users to include status info
DROP FUNCTION IF EXISTS public.admin_list_all_users();

CREATE FUNCTION public.admin_list_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  user_type text,
  created_at timestamptz,
  phone text,
  has_profile boolean,
  profile_completion_percentage integer,
  profile_completed boolean,
  is_active boolean,
  banned_until timestamptz,
  email_confirmed_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Permission denied: admin required';
  END IF;

  RETURN QUERY
  SELECT
    au.id,
    au.email::text,
    COALESCE(p.full_name, '')::text AS full_name,
    COALESCE(p.user_type, 'candidate')::text AS user_type,
    au.created_at,
    COALESCE(p.phone, '')::text AS phone,
    (p.id IS NOT NULL) AS has_profile,
    COALESCE(p.profile_completion_percentage, 0)::integer AS profile_completion_percentage,
    COALESCE(p.profile_completed, false) AS profile_completed,
    COALESCE(p.is_active, true) AS is_active,
    au.banned_until,
    au.email_confirmed_at,
    au.last_sign_in_at
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  ORDER BY au.created_at DESC;
END;
$$;

-- 3. Toggle user active status (activate / deactivate)
CREATE OR REPLACE FUNCTION public.admin_toggle_user_status(
  target_user_id uuid,
  activate boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Permission denied: admin required';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own account status';
  END IF;

  -- Update profiles.is_active
  UPDATE public.profiles
  SET is_active = activate, updated_at = now()
  WHERE id = target_user_id;

  -- Use Supabase's built-in banned_until on auth.users
  IF activate THEN
    -- Unban: set banned_until to null
    UPDATE auth.users
    SET banned_until = NULL,
        updated_at = now()
    WHERE id = target_user_id;
  ELSE
    -- Ban: set banned_until far in the future (effectively permanent)
    UPDATE auth.users
    SET banned_until = '2099-12-31T23:59:59Z'::timestamptz,
        updated_at = now()
    WHERE id = target_user_id;
  END IF;
END;
$$;

-- 4. Delete user account completely
CREATE OR REPLACE FUNCTION public.admin_delete_user_account(
  target_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Permission denied: admin required';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;

  -- Delete from auth.users (profiles will cascade due to FK ON DELETE CASCADE)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
