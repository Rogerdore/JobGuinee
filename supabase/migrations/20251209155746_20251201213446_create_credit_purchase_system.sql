-- Create credit_purchases table
CREATE TABLE IF NOT EXISTS credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  credits_amount numeric(10,2) NOT NULL,
  price_paid numeric(10,2) NOT NULL,
  payment_method text,
  transaction_id text UNIQUE,
  status text DEFAULT 'pending',
  purchased_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_credit_purchases_user ON credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_status ON credit_purchases(status);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_date ON credit_purchases(purchased_at DESC);

-- Enable RLS
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their purchases"
  ON credit_purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create purchases"
  ON credit_purchases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);