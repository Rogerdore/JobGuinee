/*
  # Create Profile Purchases Table with Admin Verification

  1. New Tables
    - `profile_purchases`
      - `id` (uuid, primary key)
      - `buyer_id` (uuid, references profiles) - The recruiter buying the profile
      - `candidate_id` (uuid, references candidate_profiles) - The candidate profile being purchased
      - `amount` (integer, purchase amount in GNF)
      - `payment_status` (text, status of payment: pending, completed, failed, refunded)
      - `payment_method` (text, method used for payment)
      - `transaction_id` (text, external transaction reference)
      - `payment_verified_by_admin` (boolean) - Whether admin has verified the payment
      - `verified_by` (uuid, references profiles) - Which admin verified the payment
      - `verified_at` (timestamptz) - When verification occurred
      - `admin_notes` (text) - Admin comments about the purchase
      - `purchased_at` (timestamp)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `profile_purchases` table
    - Add policy for recruiters to view their own purchases
    - Add policy for recruiters to create purchases for themselves
    - Add policy for admins to view all purchases
    - Add policy for admins to update purchase verification status
  
  3. Indexes
    - Index on buyer_id for fast purchase lookups
    - Index on candidate_id for profile access checks
    - Index on payment_status for filtering
    - Index on payment_verified_by_admin for admin verification queries
*/

-- Create profile_purchases table
CREATE TABLE IF NOT EXISTS profile_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  candidate_id uuid REFERENCES candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending',
  payment_method text,
  transaction_id text,
  payment_verified_by_admin boolean DEFAULT false NOT NULL,
  verified_by uuid REFERENCES profiles(id),
  verified_at timestamptz,
  admin_notes text,
  purchased_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT profile_purchases_payment_status_check CHECK (
    payment_status IN ('pending', 'completed', 'failed', 'refunded')
  ),
  CONSTRAINT profile_purchases_unique_purchase UNIQUE (buyer_id, candidate_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profile_purchases_buyer_id ON profile_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_profile_purchases_candidate_id ON profile_purchases(candidate_id);
CREATE INDEX IF NOT EXISTS idx_profile_purchases_payment_status ON profile_purchases(payment_status);
CREATE INDEX IF NOT EXISTS idx_profile_purchases_verified ON profile_purchases(payment_verified_by_admin);

-- Enable RLS
ALTER TABLE profile_purchases ENABLE ROW LEVEL SECURITY;

-- Policy: Recruiters can view their own purchases
CREATE POLICY "Recruiters can view own purchases"
  ON profile_purchases
  FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id);

-- Policy: Recruiters can create purchases for themselves
CREATE POLICY "Recruiters can create own purchases"
  ON profile_purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- Policy: Recruiters can update their own purchases (e.g., payment status updates)
CREATE POLICY "Recruiters can update own purchases"
  ON profile_purchases
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = buyer_id);

-- Policy: Admins can view all purchases
CREATE POLICY "Admins can view all purchases"
  ON profile_purchases
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Policy: Admins can update all purchases for verification
CREATE POLICY "Admins can update all purchases"
  ON profile_purchases
  FOR UPDATE
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