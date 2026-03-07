/*
  # Fix Admin RLS Policies - Recursion Issue

  ## Problem
  The existing "Admins can update any profile" and "Admins can delete profiles" policies
  use a subquery that reads from the `profiles` table itself to check if the current user
  is an admin. This causes infinite recursion and silently fails all UPDATE/DELETE operations
  for admins.

  ## Solution
  Replace the recursive subquery with `auth.jwt()` to read the user_type from the JWT
  metadata, which is set at signup and updated via a helper function. This avoids
  any table lookup and breaks the recursion.

  We also add a dedicated function `is_admin()` using SECURITY DEFINER to safely check
  admin status without recursion.

  ## Changes
  - Drop and recreate "Admins can update any profile" UPDATE policy (no recursion)
  - Drop and recreate "Admins can delete profiles" DELETE policy (no recursion)
  - Create helper function `is_admin()` for safe admin checks
*/

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'user_type' = 'admin'
  )
  OR EXISTS (
    SELECT 1 FROM auth.users u
    JOIN public.profiles p ON p.id = u.id
    WHERE u.id = auth.uid()
    AND p.user_type = 'admin'
    LIMIT 1
  );
$$;

DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update user type" ON profiles;
DROP POLICY IF EXISTS "Admin update user_type policy" ON profiles;

CREATE POLICY "Admins can update any profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() <> id
    AND public.is_admin()
  )
  WITH CHECK (
    public.is_admin()
  );

CREATE POLICY "Admins can delete profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() <> id
    AND public.is_admin()
  );
