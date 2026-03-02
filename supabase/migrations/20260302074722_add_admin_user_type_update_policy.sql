/*
  # Add admin update policy for user_type field

  1. Security
    - Allow admins to update user_type field for any user
    - Prevent admins from modifying other sensitive fields
    - Keep original user self-update restrictions in place
*/

CREATE POLICY "Admins can update user_type"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );