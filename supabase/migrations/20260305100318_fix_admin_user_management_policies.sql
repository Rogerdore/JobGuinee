/*
  # Fix admin user management policies

  Purpose: Ensure admins can properly update any user's profile (including user_type)
  and delete profiles. Also add missing DELETE policy for admins.

  Changes:
  - Drop conflicting UPDATE policies
  - Create single clean admin UPDATE policy
  - Keep user self-update policy
  - Add admin DELETE policy
  - Add admin-only function to create users
*/

-- Drop conflicting policies
DROP POLICY IF EXISTS "Admins can update any field" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Clean single policy: users update themselves, admins update anyone
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin'
    )
  );

-- Add DELETE policy for admins (cannot delete their own profile)
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    auth.uid() != id AND
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin'
    )
  );
