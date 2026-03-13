-- =====================================================
-- MIGRATION: Add display_name to admin_list_all_users
-- Returns auth.users display_name (signup name) + phone
-- =====================================================

DROP FUNCTION IF EXISTS public.admin_list_all_users();

CREATE FUNCTION public.admin_list_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  display_name text,
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
    COALESCE(
      au.raw_user_meta_data->>'full_name',
      au.raw_user_meta_data->>'name',
      ''
    )::text AS display_name,
    COALESCE(p.user_type, 'candidate')::text AS user_type,
    au.created_at,
    COALESCE(
      p.phone,
      au.raw_user_meta_data->>'phone',
      ''
    )::text AS phone,
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
