/*
  # Create admin function to update user type

  ## Purpose
  When an admin changes a user's role via the dashboard, we need to:
  1. Update the `profiles` table (user_type column)
  2. Sync the metadata in auth.users so is_admin() stays consistent

  ## Changes
  - Creates `admin_update_user_type(target_user_id, new_type)` function
    that updates both tables atomically using SECURITY DEFINER
  - Only callable by authenticated admins
*/

CREATE OR REPLACE FUNCTION public.admin_update_user_type(
  target_user_id uuid,
  new_type text
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
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;

  IF new_type NOT IN ('candidate', 'recruiter', 'trainer', 'admin') THEN
    RAISE EXCEPTION 'Invalid user type: %', new_type;
  END IF;

  UPDATE public.profiles
  SET user_type = new_type
  WHERE id = target_user_id;

  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('user_type', new_type)
  WHERE id = target_user_id;
END;
$$;
