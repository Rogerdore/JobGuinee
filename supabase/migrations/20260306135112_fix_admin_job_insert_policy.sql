/*
  # Fix Admin Job Insert Policy

  ## Problem
  Admins cannot insert jobs because:
  1. No INSERT RLS policy exists for admin users
  2. Only recruiters have an INSERT policy (with_check: auth.uid() = user_id)

  ## Changes
  - Add INSERT policy for admin users allowing them to publish jobs directly
*/

CREATE POLICY "Admins can insert jobs"
  ON jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.user_type = 'admin'
    )
  );
