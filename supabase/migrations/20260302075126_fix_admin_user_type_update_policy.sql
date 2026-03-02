/*
  # Fix admin user_type update policy

  1. Security
    - Allow admins to update user_type field for any user
    - Remove restrictive policy that blocks admin updates
    - Allow updates when changing user_type field
*/

DROP POLICY IF EXISTS "Admins can update user_type" ON profiles;

CREATE POLICY "Admins can update any field"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    (auth.uid() = id) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  )
  WITH CHECK (
    (auth.uid() = id) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );
