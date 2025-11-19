/*
  # Fix Premium Services Update Policies

  1. Changes
    - Drop existing "Admins can manage services" policy for premium_services
    - Create separate UPDATE policy with proper WITH CHECK clause
    - Ensure admins can update both active and inactive services

  2. Security
    - Only admins can update services
    - Proper WITH CHECK validation
*/

-- Drop existing ALL policy and create specific ones
DROP POLICY IF EXISTS "Admins can manage services" ON premium_services;

-- Allow admins to select all services
CREATE POLICY "Admins can view all services"
ON premium_services FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

-- Allow admins to update services
CREATE POLICY "Admins can update services"
ON premium_services FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

-- Allow admins to insert services
CREATE POLICY "Admins can insert services"
ON premium_services FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

-- Allow admins to delete services
CREATE POLICY "Admins can delete services"
ON premium_services FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);
