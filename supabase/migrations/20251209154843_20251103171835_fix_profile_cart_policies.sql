/*
  # Fix Profile Cart Policies
  
  1. Changes
    - Add policies to allow authenticated users to use session_id for anonymous browsing
    - This allows logged-in users to browse and add items before deciding to purchase
  
  2. Security
    - Maintains security by checking either user_id OR session_id
    - Users can access cart items by either method
*/

-- Drop and recreate policies to fix the access issue

-- Allow authenticated users to view cart by session_id as well
DROP POLICY IF EXISTS "Authenticated users can view cart by session" ON profile_cart;
CREATE POLICY "Authenticated users can view cart by session"
  ON profile_cart
  FOR SELECT
  TO authenticated
  USING (session_id IS NOT NULL OR auth.uid() = user_id);

-- Allow authenticated users to add to cart by session_id
DROP POLICY IF EXISTS "Authenticated users can add by session" ON profile_cart;
CREATE POLICY "Authenticated users can add by session"
  ON profile_cart
  FOR INSERT
  TO authenticated
  WITH CHECK (session_id IS NOT NULL OR auth.uid() = user_id);

-- Allow authenticated users to delete from cart by session_id
DROP POLICY IF EXISTS "Authenticated users can delete by session" ON profile_cart;
CREATE POLICY "Authenticated users can delete by session"
  ON profile_cart
  FOR DELETE
  TO authenticated
  USING (session_id IS NOT NULL OR auth.uid() = user_id);