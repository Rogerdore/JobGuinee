/*
  # Add Profile Cart and Purchase System

  ## Overview
  Allow all users to browse anonymized profiles and add them to a cart for purchase.

  ## 1. New Tables
    
    ### `profile_cart`
    - Shopping cart for profile purchases
    - Support for both authenticated and guest users

    ### `profile_purchases`
    - Track completed profile purchases
    - Payment status and transaction details

  ## 2. Extend candidate_profiles
    - Add profile pricing

  ## 3. Security
    - RLS policies for cart and purchases
*/

-- Extend candidate_profiles with pricing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'profile_price'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN profile_price numeric DEFAULT 0;
  END IF;
END $$;

-- Create profile_cart table
CREATE TABLE IF NOT EXISTS profile_cart (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_id text,
  candidate_id uuid REFERENCES candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  added_at timestamptz DEFAULT now()
);

-- Create profile_purchases table
CREATE TABLE IF NOT EXISTS profile_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  candidate_id uuid REFERENCES candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  purchase_price numeric NOT NULL,
  payment_status text DEFAULT 'pending',
  payment_method text,
  transaction_id text,
  purchased_at timestamptz DEFAULT now(),
  UNIQUE(buyer_id, candidate_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cart_user ON profile_cart(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_session ON profile_cart(session_id);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer ON profile_purchases(buyer_id, purchased_at);
CREATE INDEX IF NOT EXISTS idx_purchases_candidate ON profile_purchases(candidate_id);

-- Enable RLS
ALTER TABLE profile_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profile_cart
CREATE POLICY "Users can view own cart"
  ON profile_cart FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own cart"
  ON profile_cart FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can insert to cart"
  ON profile_cart FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- RLS Policies for profile_purchases
CREATE POLICY "Buyers can view own purchases"
  ON profile_purchases FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "Users can create purchases"
  ON profile_purchases FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());