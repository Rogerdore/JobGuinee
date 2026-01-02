/*
  # Ajouter le numéro de téléphone de paiement (corrigé)

  1. Modifications
    - Ajouter `payment_phone_number` à `credit_purchases`
      - Format: 62XXXXXXX (numéros Orange Money Guinée)
      - Utilisé pour traçabilité et vérification
    
  2. Index
    - Index sur payment_phone_number pour recherches

  3. Validation
    - Format Orange Money Guinée valide (optionnel pour rétrocompatibilité)
*/

-- Ajouter la colonne
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'credit_purchases'
    AND column_name = 'payment_phone_number'
  ) THEN
    ALTER TABLE credit_purchases ADD COLUMN payment_phone_number TEXT;
  END IF;
END $$;

-- Créer un index pour les recherches par téléphone
CREATE INDEX IF NOT EXISTS idx_credit_purchases_phone
ON credit_purchases(payment_phone_number)
WHERE payment_phone_number IS NOT NULL;

-- Ajouter une contrainte de validation (format Orange Money)
-- Format: 62X XXX XXX (9 chiffres commençant par 62)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'valid_orange_money_format'
  ) THEN
    ALTER TABLE credit_purchases
    ADD CONSTRAINT valid_orange_money_format
    CHECK (
      payment_phone_number IS NULL
      OR payment_phone_number ~ '^62[0-9]{7}$'
    );
  END IF;
END $$;

-- Commentaire pour documentation
COMMENT ON COLUMN credit_purchases.payment_phone_number IS 'Numéro Orange Money utilisé pour le paiement (format: 62XXXXXXX)';
