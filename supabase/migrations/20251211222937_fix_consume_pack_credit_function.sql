/*
  # Correction de la fonction consume_cvtheque_pack_credit

  1. Problème identifié
    - La fonction utilise la colonne 'purchase_price' qui n'existe pas
    - La vraie colonne dans profile_purchases s'appelle 'amount'

  2. Solution
    - Corriger la fonction pour utiliser 'amount' au lieu de 'purchase_price'
    - Ajouter le prix réel du profil au lieu de 0
    - Améliorer le tracking pour inclure le prix même quand payé via pack
*/

CREATE OR REPLACE FUNCTION consume_cvtheque_pack_credit(
  p_buyer_id uuid,
  p_candidate_id uuid
)
RETURNS boolean AS $$
DECLARE
  v_pack_id uuid;
  v_remaining integer;
  v_profile_price integer;
BEGIN
  -- Trouver un pack actif avec des crédits restants
  SELECT id, profiles_remaining INTO v_pack_id, v_remaining
  FROM cvtheque_pack_purchases
  WHERE buyer_id = p_buyer_id
    AND purchase_status = 'active'
    AND profiles_remaining > 0
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF v_pack_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Récupérer le prix du profil candidat
  SELECT profile_price INTO v_profile_price
  FROM candidate_profiles
  WHERE id = p_candidate_id;
  
  IF v_profile_price IS NULL THEN
    v_profile_price := 0;
  END IF;
  
  -- Décrémenter le compteur
  UPDATE cvtheque_pack_purchases
  SET 
    profiles_remaining = profiles_remaining - 1,
    profiles_consumed = profiles_consumed + 1,
    updated_at = now()
  WHERE id = v_pack_id;
  
  -- Créer la purchase entry si pas déjà achetée
  -- Utiliser 'amount' au lieu de 'purchase_price'
  INSERT INTO profile_purchases (buyer_id, candidate_id, amount, payment_status, payment_verified_by_admin, purchased_at)
  VALUES (p_buyer_id, p_candidate_id, v_profile_price, 'completed', true, now())
  ON CONFLICT (buyer_id, candidate_id) DO NOTHING;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
