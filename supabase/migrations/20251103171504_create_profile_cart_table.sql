/*
  # Create Profile Cart Table

  1. New Tables
    - `profile_cart`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable - for authenticated users)
      - `session_id` (text, nullable - for anonymous users)
      - `candidate_id` (uuid, references candidate_profiles)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `profile_cart` table
    - Add policy for users to manage their own cart items
    - Add policy for anonymous users using session_id
  
  3. Indexes
    - Index on user_id for fast cart lookups
    - Index on session_id for anonymous carts
    - Index on candidate_id for cart item lookups
*/

-- Create profile_cart table
CREATE TABLE IF NOT EXISTS profile_cart (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  candidate_id uuid REFERENCES candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT profile_cart_user_or_session CHECK (
    (user_id IS NOT NULL AND session_id IS NULL) OR 
    (user_id IS NULL AND session_id IS NOT NULL)
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profile_cart_user_id ON profile_cart(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profile_cart_session_id ON profile_cart(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profile_cart_candidate_id ON profile_cart(candidate_id);

-- Enable RLS
ALTER TABLE profile_cart ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own cart items (authenticated)
CREATE POLICY "Users can view own cart items"
  ON profile_cart
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert into their own cart (authenticated)
CREATE POLICY "Users can add to own cart"
  ON profile_cart
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete from their own cart (authenticated)
CREATE POLICY "Users can remove from own cart"
  ON profile_cart
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Anonymous users can view their cart by session_id
CREATE POLICY "Anonymous users can view own cart by session"
  ON profile_cart
  FOR SELECT
  TO anon
  USING (session_id IS NOT NULL);

-- Policy: Anonymous users can add to cart by session_id
CREATE POLICY "Anonymous users can add to cart by session"
  ON profile_cart
  FOR INSERT
  TO anon
  WITH CHECK (session_id IS NOT NULL AND user_id IS NULL);

-- Policy: Anonymous users can delete from cart by session_id
CREATE POLICY "Anonymous users can remove from cart by session"
  ON profile_cart
  FOR DELETE
  TO anon
  USING (session_id IS NOT NULL);
