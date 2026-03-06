/*
  # Update admin_list_all_users to include profile completion data (v2)

  Drop and recreate to change return type signature.
  Adds profile_completion_percentage and profile_completed columns.
*/

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
  profile_completed boolean
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
    COALESCE(p.profile_completed, false) AS profile_completed
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  ORDER BY au.created_at DESC;
END;
$$;
