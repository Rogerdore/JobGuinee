/*
  # Create admin function to list all users (auth + profiles)

  ## Purpose
  The UserManagement page currently only queries `profiles`, missing users who
  have an auth.users entry but no profile (incomplete signups, failed triggers, etc).

  This function returns ALL users from auth.users LEFT JOIN profiles so admins
  can see and manage every account.

  ## Security
  - SECURITY DEFINER so it can read auth.users
  - Only callable by authenticated admins (checked inside the function)
*/

CREATE OR REPLACE FUNCTION public.admin_list_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  user_type text,
  created_at timestamptz,
  phone text,
  has_profile boolean
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
    (p.id IS NOT NULL) AS has_profile
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  ORDER BY au.created_at DESC;
END;
$$;
