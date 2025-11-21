/*
  # Fonction consume_global_credits pour le nouveau système de crédits

  ## Description
  Fonction RPC pour consommer des crédits depuis le solde global (credits_balance dans profiles)
  et enregistrer l'utilisation dans l'historique.
  
  ## Fonctionnement
  1. Vérifie que l'utilisateur est authentifié
  2. Récupère le coût du service depuis service_credit_costs
  3. Vérifie que le solde global est suffisant
  4. Déduit les crédits du solde global dans profiles
  5. Enregistre l'utilisation dans ai_service_usage_history
  6. Retourne le succès et le nouveau solde
  
  ## Paramètres
  - p_service_code (text) : Code du service (cv_generation, cover_letter_generation, etc.)
  - p_metadata (jsonb) : Métadonnées optionnelles (style, target_position, etc.)
  
  ## Retour
  - success (boolean) : Succès de l'opération
  - credits_used (integer) : Nombre de crédits consommés
  - new_balance (integer) : Nouveau solde après déduction
  - message (text) : Message de succès ou d'erreur
  
  ## Sécurité
  - SECURITY DEFINER : Permet la mise à jour du solde
  - auth.uid() : Identifie l'utilisateur authentifié
  - Vérifications de sécurité intégrées
*/

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS consume_global_credits(text, jsonb);

-- Créer la nouvelle fonction
CREATE OR REPLACE FUNCTION consume_global_credits(
  p_service_code text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_service_name text;
  v_service_cost integer;
  v_current_balance integer;
  v_new_balance integer;
BEGIN
  -- Récupérer l'utilisateur authentifié
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_authenticated',
      'message', 'Utilisateur non authentifié'
    );
  END IF;

  -- Récupérer le coût et le nom du service
  SELECT service_name, credits_cost 
  INTO v_service_name, v_service_cost
  FROM service_credit_costs
  WHERE service_code = p_service_code
  AND is_active = true;

  IF v_service_cost IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'service_not_found',
      'message', 'Service non trouvé ou inactif'
    );
  END IF;

  -- Récupérer le solde global actuel
  SELECT credits_balance INTO v_current_balance
  FROM profiles
  WHERE id = v_user_id;

  IF v_current_balance IS NULL THEN
    v_current_balance := 0;
  END IF;

  -- Vérifier si l'utilisateur a assez de crédits
  IF v_current_balance < v_service_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_credits',
      'message', 'Crédits insuffisants',
      'required', v_service_cost,
      'available', v_current_balance
    );
  END IF;

  -- Calculer le nouveau solde
  v_new_balance := v_current_balance - v_service_cost;

  -- Mettre à jour le solde global dans profiles
  UPDATE profiles
  SET
    credits_balance = v_new_balance,
    updated_at = now()
  WHERE id = v_user_id;

  -- Enregistrer l'utilisation dans l'historique
  INSERT INTO ai_service_usage_history (
    user_id,
    service_code,
    service_name,
    credits_consumed,
    balance_before,
    balance_after,
    metadata
  ) VALUES (
    v_user_id,
    p_service_code,
    v_service_name,
    v_service_cost,
    v_current_balance,
    v_new_balance,
    p_metadata
  );

  -- Retourner le succès
  RETURN jsonb_build_object(
    'success', true,
    'credits_used', v_service_cost,
    'new_balance', v_new_balance,
    'service_code', p_service_code,
    'service_name', v_service_name,
    'message', 'Crédits consommés avec succès'
  );
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION consume_global_credits TO authenticated;

-- Commentaire
COMMENT ON FUNCTION consume_global_credits IS 'Consomme des crédits depuis le solde global (profiles.credits_balance) et enregistre l''utilisation dans l''historique';
