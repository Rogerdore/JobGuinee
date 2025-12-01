/*
  # Create Credit Purchase System

  1. New Table: credit_purchases
    - Tracks all credit package purchases
    - Links to users and packages
    - Stores payment information
    - Status tracking (pending, completed, failed, cancelled)

  2. Functions
    - create_credit_purchase: Initialize purchase
    - complete_credit_purchase: Finalize and add credits
    - cancel_credit_purchase: Cancel pending purchase

  3. Security
    - RLS policies for user access
    - Admin access for management
*/

-- Create credit_purchases table
CREATE TABLE IF NOT EXISTS credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES credit_packages(id) ON DELETE RESTRICT,
  
  -- Purchase details
  credits_amount integer NOT NULL,
  bonus_credits integer DEFAULT 0,
  total_credits integer GENERATED ALWAYS AS (credits_amount + COALESCE(bonus_credits, 0)) STORED,
  price_amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'GNF',
  
  -- Payment details
  payment_method text CHECK (payment_method IN ('orange_money', 'mtn_money', 'visa', 'mastercard', 'cash', 'bank_transfer')),
  payment_reference text,
  payment_provider_id text,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
  
  -- Status
  purchase_status text DEFAULT 'pending' CHECK (purchase_status IN ('pending', 'completed', 'failed', 'cancelled')),
  completed_at timestamptz,
  failed_reason text,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_credit_purchases_user_id ON credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_package_id ON credit_purchases(package_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_status ON credit_purchases(purchase_status);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_payment_ref ON credit_purchases(payment_reference);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_created_at ON credit_purchases(created_at DESC);

-- Function: Create credit purchase
CREATE OR REPLACE FUNCTION create_credit_purchase(
  p_package_id uuid,
  p_payment_method text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_user_id uuid;
  v_package record;
  v_purchase_id uuid;
  v_payment_reference text;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'UNAUTHORIZED',
      'message', 'Utilisateur non authentifie'
    );
  END IF;

  SELECT * INTO v_package
  FROM credit_packages
  WHERE id = p_package_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'PACKAGE_NOT_FOUND',
      'message', 'Pack de credits introuvable ou inactif'
    );
  END IF;

  v_payment_reference := 'CP-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || SUBSTRING(gen_random_uuid()::text, 1, 8);

  INSERT INTO credit_purchases (
    user_id,
    package_id,
    credits_amount,
    bonus_credits,
    price_amount,
    currency,
    payment_method,
    payment_reference
  ) VALUES (
    v_user_id,
    p_package_id,
    v_package.credits_amount,
    COALESCE(v_package.bonus_credits, 0),
    v_package.price_amount,
    v_package.currency,
    p_payment_method,
    v_payment_reference
  )
  RETURNING id INTO v_purchase_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Achat cree avec succes',
    'purchase_id', v_purchase_id,
    'payment_reference', v_payment_reference,
    'amount', v_package.price_amount,
    'currency', v_package.currency,
    'credits', v_package.credits_amount + COALESCE(v_package.bonus_credits, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Complete credit purchase
CREATE OR REPLACE FUNCTION complete_credit_purchase(
  p_purchase_id uuid,
  p_payment_provider_id text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_purchase record;
  v_user_balance integer;
BEGIN
  SELECT * INTO v_purchase
  FROM credit_purchases
  WHERE id = p_purchase_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'PURCHASE_NOT_FOUND',
      'message', 'Achat introuvable'
    );
  END IF;

  IF v_purchase.purchase_status = 'completed' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'ALREADY_COMPLETED',
      'message', 'Cet achat a deja ete traite'
    );
  END IF;

  UPDATE credit_purchases
  SET 
    purchase_status = 'completed',
    payment_status = 'completed',
    payment_provider_id = p_payment_provider_id,
    completed_at = now(),
    updated_at = now()
  WHERE id = p_purchase_id;

  UPDATE profiles
  SET 
    credits_balance = COALESCE(credits_balance, 0) + v_purchase.total_credits,
    updated_at = now()
  WHERE id = v_purchase.user_id
  RETURNING credits_balance INTO v_user_balance;

  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_amount,
    description,
    balance_before,
    balance_after,
    service_code
  ) VALUES (
    v_purchase.user_id,
    'credit_purchase',
    v_purchase.total_credits,
    'Achat de pack: ' || v_purchase.total_credits || ' credits',
    v_user_balance - v_purchase.total_credits,
    v_user_balance,
    'credit_purchase'
  );

  RETURN json_build_object(
    'success', true,
    'message', 'Achat complete avec succes',
    'credits_added', v_purchase.total_credits,
    'new_balance', v_user_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Cancel credit purchase
CREATE OR REPLACE FUNCTION cancel_credit_purchase(
  p_purchase_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'UNAUTHORIZED',
      'message', 'Utilisateur non authentifie'
    );
  END IF;

  UPDATE credit_purchases
  SET 
    purchase_status = 'cancelled',
    payment_status = 'cancelled',
    failed_reason = p_reason,
    updated_at = now()
  WHERE id = p_purchase_id
    AND user_id = v_user_id
    AND purchase_status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'CANNOT_CANCEL',
      'message', 'Impossible d annuler cet achat'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Achat annule'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own purchases" ON credit_purchases;
CREATE POLICY "Users can view own purchases"
  ON credit_purchases FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create purchases" ON credit_purchases;
CREATE POLICY "Users can create purchases"
  ON credit_purchases FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all purchases" ON credit_purchases;
CREATE POLICY "Admins can view all purchases"
  ON credit_purchases FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update purchases" ON credit_purchases;
CREATE POLICY "Admins can update purchases"
  ON credit_purchases FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

DROP TRIGGER IF EXISTS update_credit_purchases_updated_at ON credit_purchases;
CREATE TRIGGER update_credit_purchases_updated_at
  BEFORE UPDATE ON credit_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
