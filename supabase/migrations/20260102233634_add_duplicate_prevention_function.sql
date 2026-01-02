/*
  # Prévention des doublons d'achats via fonction

  1. Fonction helper
    - Créer une fonction pour vérifier les doublons récents
    - Utilisable dans les contraintes ou validations

  2. Objectif
    - Éviter les clics multiples accidentels
    - Éviter les tentatives de fraude
    - Maintenir l'intégrité des données

  Note: Comme NOW() n'est pas IMMUTABLE, on utilise une approche différente
*/

-- Créer une fonction pour vérifier les doublons récents
CREATE OR REPLACE FUNCTION check_duplicate_purchase(
  p_user_id UUID,
  p_package_id UUID,
  p_price_amount NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM credit_purchases
    WHERE user_id = p_user_id
      AND package_id = p_package_id
      AND price_amount = p_price_amount
      AND payment_status = 'pending'
      AND created_at > NOW() - INTERVAL '1 hour'
  );
END;
$$;

-- Créer un index pour améliorer les performances des vérifications
CREATE INDEX IF NOT EXISTS idx_credit_purchases_duplicate_check
ON credit_purchases(user_id, package_id, price_amount, created_at DESC)
WHERE payment_status = 'pending';

-- Commentaire
COMMENT ON FUNCTION check_duplicate_purchase IS 'Vérifie si un achat identique existe dans l''heure écoulée';
