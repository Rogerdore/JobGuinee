/*
  # Create Credit Purchases and Store Settings Tables
  
  1. Tables
    - credit_purchases: Track all credit purchase attempts and status
    - credit_store_settings: Admin configuration for Orange Money payment
    
  2. Security
    - Enable RLS on both tables
    - Policies for users and admins
*/

-- Create credit_purchases table
CREATE TABLE IF NOT EXISTS credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  package_id uuid REFERENCES credit_packages(id) ON DELETE SET NULL,
  credits_amount integer NOT NULL,
  bonus_credits integer NOT NULL DEFAULT 0,
  total_credits integer NOT NULL,
  price_amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'GNF',
  payment_method text NOT NULL DEFAULT 'orange_money',
  payment_reference text UNIQUE,
  payment_status text NOT NULL DEFAULT 'pending',
  purchase_status text NOT NULL DEFAULT 'pending',
  payment_proof_url text,
  admin_notes text,
  completed_at timestamptz,
  failed_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT payment_status_check CHECK (payment_status IN ('pending', 'waiting_proof', 'completed', 'failed', 'cancelled')),
  CONSTRAINT purchase_status_check CHECK (purchase_status IN ('pending', 'processing', 'completed', 'cancelled'))
);

-- Create credit_store_settings table
CREATE TABLE IF NOT EXISTS credit_store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_phone_number text NOT NULL DEFAULT '622000000',
  admin_whatsapp_number text NOT NULL DEFAULT '622000000',
  payment_instructions text NOT NULL DEFAULT 'Effectuez le transfert Orange Money vers le numéro indiqué, puis envoyez la preuve de paiement via WhatsApp.',
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default settings if not exists
INSERT INTO credit_store_settings (admin_phone_number, admin_whatsapp_number, payment_instructions)
SELECT '622000000', '622000000', 'Effectuez le transfert Orange Money vers le numéro indiqué ci-dessous, puis envoyez la capture d''écran de la confirmation via WhatsApp pour validation rapide.'
WHERE NOT EXISTS (SELECT 1 FROM credit_store_settings LIMIT 1);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_credit_purchases_user ON credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_status ON credit_purchases(payment_status);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_created ON credit_purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_reference ON credit_purchases(payment_reference);

-- Enable RLS
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_store_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for credit_purchases
CREATE POLICY "Users can view own purchases"
  ON credit_purchases FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own purchases"
  ON credit_purchases FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pending purchases"
  ON credit_purchases FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND payment_status IN ('pending', 'waiting_proof'))
  WITH CHECK (user_id = auth.uid());

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

CREATE POLICY "Admins can update all purchases"
  ON credit_purchases FOR UPDATE
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

-- RLS Policies for credit_store_settings
CREATE POLICY "Anyone can view store settings"
  ON credit_store_settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage store settings"
  ON credit_store_settings FOR ALL
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

-- Update trigger for credit_purchases
CREATE OR REPLACE FUNCTION update_credit_purchases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_credit_purchases_updated_at
  BEFORE UPDATE ON credit_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_purchases_updated_at();

-- Update trigger for credit_store_settings
CREATE OR REPLACE FUNCTION update_credit_store_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_credit_store_settings_updated_at
  BEFORE UPDATE ON credit_store_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_store_settings_updated_at();