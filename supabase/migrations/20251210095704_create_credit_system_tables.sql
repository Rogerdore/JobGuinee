/*
  # Création Tables Système de Crédits

  1. Nouvelles Tables
    - `credit_packages` - Packages de crédits disponibles à l'achat
    - `credit_transactions` - Historique de toutes les transactions de crédits

  2. Sécurité
    - RLS activé sur toutes les tables
    - Utilisateurs peuvent voir leurs propres transactions
    - Admins peuvent tout gérer
    - Packages actifs visibles par tous

  3. Indexes
    - Index sur is_active et display_order pour credit_packages
    - Index sur user_id et created_at pour credit_transactions
*/

-- Table: credit_packages
CREATE TABLE IF NOT EXISTS credit_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_name text NOT NULL,
  credits_amount integer NOT NULL CHECK (credits_amount > 0),
  bonus_credits integer DEFAULT 0 CHECK (bonus_credits >= 0),
  price_amount numeric(10,2) NOT NULL CHECK (price_amount > 0),
  currency text DEFAULT 'GNF' NOT NULL,
  description text,
  is_active boolean DEFAULT true NOT NULL,
  is_popular boolean DEFAULT false NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_packages_active_order
  ON credit_packages(is_active, display_order);

-- RLS pour credit_packages
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'credit_packages' 
    AND policyname = 'Anyone can view active packages'
  ) THEN
    CREATE POLICY "Anyone can view active packages"
      ON credit_packages FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'credit_packages' 
    AND policyname = 'Admins can manage packages'
  ) THEN
    CREATE POLICY "Admins can manage packages"
      ON credit_packages FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.user_type = 'admin'
        )
      );
  END IF;
END $$;

-- Données par défaut
INSERT INTO credit_packages (
  package_name,
  credits_amount,
  bonus_credits,
  price_amount,
  is_popular,
  display_order,
  description
) VALUES
  ('Pack Découverte', 50, 5, 25000, false, 1, 'Idéal pour tester nos services'),
  ('Pack Starter', 100, 15, 45000, false, 2, 'Parfait pour débuter'),
  ('Pack Premium', 300, 60, 120000, true, 3, 'Le plus populaire - Meilleur rapport qualité/prix'),
  ('Pack Pro', 600, 180, 200000, false, 4, 'Pour une utilisation intensive'),
  ('Pack Enterprise', 1500, 600, 450000, false, 5, 'Solution complète pour professionnels')
ON CONFLICT DO NOTHING;

-- Table: credit_transactions
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN (
    'purchase', 'usage', 'refund', 'bonus', 'admin_adjustment'
  )),
  credits_amount integer NOT NULL,
  description text,
  balance_before integer NOT NULL,
  balance_after integer NOT NULL,
  service_code text,
  reference_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_date
  ON credit_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_type
  ON credit_transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_service
  ON credit_transactions(service_code)
  WHERE service_code IS NOT NULL;

-- RLS pour credit_transactions
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'credit_transactions' 
    AND policyname = 'Users can view own transactions'
  ) THEN
    CREATE POLICY "Users can view own transactions"
      ON credit_transactions FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'credit_transactions' 
    AND policyname = 'System can insert transactions'
  ) THEN
    CREATE POLICY "System can insert transactions"
      ON credit_transactions FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'credit_transactions' 
    AND policyname = 'Admins can view all transactions'
  ) THEN
    CREATE POLICY "Admins can view all transactions"
      ON credit_transactions FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.user_type = 'admin'
        )
      );
  END IF;
END $$;

-- Trigger pour mise à jour updated_at
CREATE OR REPLACE FUNCTION update_credit_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_credit_packages_updated_at ON credit_packages;
CREATE TRIGGER set_credit_packages_updated_at
  BEFORE UPDATE ON credit_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_packages_updated_at();