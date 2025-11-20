/*
  # User Service Credits Management System

  1. Overview
    - Allows admins to manage credits per service for each user
    - Tracks credit balance for each user-service combination
    - Maintains history of credit additions/deductions

  2. New Tables
    - `user_service_credits`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `service_id` (uuid, references premium_services)
      - `credits_balance` (integer) - Current credit balance for this service
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - Unique constraint on (user_id, service_id)
    
    - `user_service_credit_transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `service_id` (uuid, references premium_services)
      - `amount` (integer) - Positive for additions, negative for deductions
      - `balance_after` (integer) - Balance after this transaction
      - `transaction_type` (text) - 'admin_add', 'admin_remove', 'usage', etc.
      - `note` (text) - Optional note from admin
      - `performed_by` (uuid, references auth.users) - Admin who performed the action
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on both tables
    - Admins can read and modify all records
    - Users can read their own credits but cannot modify

  4. Functions
    - `add_service_credits` - Add credits to a user's service balance
    - `deduct_service_credits` - Deduct credits from usage
    - `get_user_service_credits` - Get all credits for a user
*/

-- Create user_service_credits table
CREATE TABLE IF NOT EXISTS user_service_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES premium_services(id) ON DELETE CASCADE,
  credits_balance integer NOT NULL DEFAULT 0 CHECK (credits_balance >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, service_id)
);

-- Create user_service_credit_transactions table
CREATE TABLE IF NOT EXISTS user_service_credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES premium_services(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  balance_after integer NOT NULL CHECK (balance_after >= 0),
  transaction_type text NOT NULL CHECK (transaction_type IN ('admin_add', 'admin_remove', 'usage', 'refund', 'bonus')),
  note text,
  performed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_service_credits_user_id ON user_service_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_service_credits_service_id ON user_service_credits(service_id);
CREATE INDEX IF NOT EXISTS idx_user_service_credit_transactions_user_id ON user_service_credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_service_credit_transactions_service_id ON user_service_credit_transactions(service_id);
CREATE INDEX IF NOT EXISTS idx_user_service_credit_transactions_created_at ON user_service_credit_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE user_service_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_service_credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_service_credits

-- Admins can view all credits
CREATE POLICY "Admins can view all service credits"
  ON user_service_credits
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Users can view their own credits
CREATE POLICY "Users can view own service credits"
  ON user_service_credits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can insert credits
CREATE POLICY "Admins can insert service credits"
  ON user_service_credits
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Admins can update credits
CREATE POLICY "Admins can update service credits"
  ON user_service_credits
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

-- RLS Policies for user_service_credit_transactions

-- Admins can view all transactions
CREATE POLICY "Admins can view all service credit transactions"
  ON user_service_credit_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Users can view their own transactions
CREATE POLICY "Users can view own service credit transactions"
  ON user_service_credit_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can insert transactions
CREATE POLICY "Admins can insert service credit transactions"
  ON user_service_credit_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Function to add service credits
CREATE OR REPLACE FUNCTION add_service_credits(
  p_user_id uuid,
  p_service_id uuid,
  p_amount integer,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance integer;
  v_admin_id uuid;
BEGIN
  -- Check if caller is admin
  SELECT id INTO v_admin_id
  FROM profiles
  WHERE id = auth.uid() AND user_type = 'admin';
  
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Only admins can add service credits';
  END IF;

  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Insert or update credits balance
  INSERT INTO user_service_credits (user_id, service_id, credits_balance, updated_at)
  VALUES (p_user_id, p_service_id, p_amount, now())
  ON CONFLICT (user_id, service_id)
  DO UPDATE SET
    credits_balance = user_service_credits.credits_balance + p_amount,
    updated_at = now()
  RETURNING credits_balance INTO v_new_balance;

  -- Record transaction
  INSERT INTO user_service_credit_transactions (
    user_id,
    service_id,
    amount,
    balance_after,
    transaction_type,
    note,
    performed_by
  )
  VALUES (
    p_user_id,
    p_service_id,
    p_amount,
    v_new_balance,
    'admin_add',
    p_note,
    v_admin_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance
  );
END;
$$;

-- Function to deduct service credits
CREATE OR REPLACE FUNCTION deduct_service_credits(
  p_user_id uuid,
  p_service_id uuid,
  p_amount integer,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance integer;
  v_new_balance integer;
  v_admin_id uuid;
BEGIN
  -- Check if caller is admin
  SELECT id INTO v_admin_id
  FROM profiles
  WHERE id = auth.uid() AND user_type = 'admin';
  
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Only admins can deduct service credits';
  END IF;

  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Get current balance
  SELECT credits_balance INTO v_current_balance
  FROM user_service_credits
  WHERE user_id = p_user_id AND service_id = p_service_id;

  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'User has no credits for this service';
  END IF;

  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits. Current balance: %', v_current_balance;
  END IF;

  -- Update balance
  UPDATE user_service_credits
  SET credits_balance = credits_balance - p_amount,
      updated_at = now()
  WHERE user_id = p_user_id AND service_id = p_service_id
  RETURNING credits_balance INTO v_new_balance;

  -- Record transaction
  INSERT INTO user_service_credit_transactions (
    user_id,
    service_id,
    amount,
    balance_after,
    transaction_type,
    note,
    performed_by
  )
  VALUES (
    p_user_id,
    p_service_id,
    -p_amount,
    v_new_balance,
    'admin_remove',
    p_note,
    v_admin_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance
  );
END;
$$;

-- Function to get user service credits
CREATE OR REPLACE FUNCTION get_user_service_credits(p_user_id uuid)
RETURNS TABLE (
  service_id uuid,
  service_name text,
  credits_balance integer,
  last_updated timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin or the user themselves
  IF auth.uid() != p_user_id AND NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    ps.id,
    ps.name,
    COALESCE(usc.credits_balance, 0)::integer,
    usc.updated_at
  FROM premium_services ps
  LEFT JOIN user_service_credits usc
    ON usc.service_id = ps.id AND usc.user_id = p_user_id
  ORDER BY ps.display_order, ps.name;
END;
$$;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_user_service_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_service_credits_updated_at
  BEFORE UPDATE ON user_service_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_user_service_credits_updated_at();
