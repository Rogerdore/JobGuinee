/*
  # Ajouter la traçabilité des actions admin

  1. Nouvelles colonnes
    - `validated_by` - UUID de l'admin qui a validé
    - `cancelled_by` - UUID de l'admin qui a annulé
    - `ip_address` - IP lors de la création de l'achat
    - `user_agent` - Navigateur utilisé

  2. Objectif
    - Traçabilité complète des actions admin
    - Audit et conformité
    - Détection d'abus potentiels

  3. Index
    - Index sur validated_by pour statistiques admin
*/

-- Ajouter les colonnes de traçabilité admin
ALTER TABLE credit_purchases
ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Créer des index pour les requêtes d'audit
CREATE INDEX IF NOT EXISTS idx_credit_purchases_validated_by
ON credit_purchases(validated_by)
WHERE validated_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_credit_purchases_cancelled_by
ON credit_purchases(cancelled_by)
WHERE cancelled_by IS NOT NULL;

-- Commentaires
COMMENT ON COLUMN credit_purchases.validated_by IS 'UUID de l''admin qui a validé le paiement';
COMMENT ON COLUMN credit_purchases.cancelled_by IS 'UUID de l''admin qui a annulé le paiement';
COMMENT ON COLUMN credit_purchases.ip_address IS 'Adresse IP de l''utilisateur lors de la création de l''achat';
COMMENT ON COLUMN credit_purchases.user_agent IS 'User agent du navigateur lors de la création';
