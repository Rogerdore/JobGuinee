/*
  # Correction de la fonction complete_credit_purchase
  
  Correctifs appliqués:
  1. Remplace `amount` par `credits_amount` (nom correct de la colonne)
  2. Supprime `reference_type` (colonne inexistante)
  3. Ajoute `balance_before` (colonne requise)
  4. Utilise les bons noms de colonnes selon le schéma de la table
*/

CREATE OR REPLACE FUNCTION complete_credit_purchase(
  p_purchase_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_purchase record;
  v_user_id uuid;
  v_is_admin boolean;
  v_new_balance integer;
  v_old_balance integer;
BEGIN
  -- Vérifier authentification
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Vous devez être connecté',
      'error', 'UNAUTHORIZED'
    );
  END IF;

  -- Vérifier si admin
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = v_user_id AND user_type = 'admin'
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Action réservée aux administrateurs',
      'error', 'FORBIDDEN'
    );
  END IF;

  -- Récupérer l'achat
  SELECT * INTO v_purchase
  FROM credit_purchases
  WHERE id = p_purchase_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Achat introuvable',
      'error', 'PURCHASE_NOT_FOUND'
    );
  END IF;

  -- Vérifier si déjà complété
  IF v_purchase.payment_status = 'completed' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Achat déjà complété',
      'error', 'ALREADY_COMPLETED'
    );
  END IF;

  -- Récupérer le solde actuel
  SELECT COALESCE(credits_balance, 0) INTO v_old_balance
  FROM profiles
  WHERE id = v_purchase.user_id;

  -- Mettre à jour le solde
  UPDATE profiles
  SET credits_balance = COALESCE(credits_balance, 0) + v_purchase.total_credits
  WHERE id = v_purchase.user_id
  RETURNING credits_balance INTO v_new_balance;

  -- Marquer l'achat comme complété
  UPDATE credit_purchases
  SET 
    payment_status = 'completed',
    purchase_status = 'completed',
    completed_at = now(),
    admin_notes = p_admin_notes
  WHERE id = p_purchase_id;

  -- Enregistrer la transaction avec les BONS noms de colonnes
  INSERT INTO credit_transactions (
    user_id,
    credits_amount,      -- Correction: "credits_amount" au lieu de "amount"
    transaction_type,
    reference_id,
    description,
    balance_before,      -- Ajout de balance_before
    balance_after
  ) VALUES (
    v_purchase.user_id,
    v_purchase.total_credits,
    'purchase',
    p_purchase_id,
    'Achat de crédits IA - ' || v_purchase.payment_reference,
    v_old_balance,
    v_new_balance
  );

  -- Envoyer une notification à l'utilisateur
  INSERT INTO notifications (
    profile_id,
    type,
    title,
    message,
    metadata,
    is_read
  ) VALUES (
    v_purchase.user_id,
    'credits_validated',
    format('Paiement validé - %s crédits IA ajoutés', v_purchase.total_credits),
    format(
      E'Excellente nouvelle! Votre paiement a été validé avec succès.\n\n' ||
      '💳 Référence : %s\n' ||
      '💰 Montant : %s %s\n' ||
      '✨ Crédits ajoutés : %s crédits IA\n' ||
      '📊 Nouveau solde : %s crédits\n\n' ||
      'Vos crédits sont maintenant disponibles et vous pouvez les utiliser pour accéder aux services IA premium de JobGuinée.' ||
      CASE 
        WHEN p_admin_notes IS NOT NULL THEN E'\n\n📝 Note de l''administrateur :\n' || p_admin_notes
        ELSE ''
      END ||
      E'\n\nMerci pour votre confiance!\n\nL''équipe JobGuinée',
      v_purchase.payment_reference,
      v_purchase.price_amount,
      v_purchase.currency,
      v_purchase.total_credits,
      v_new_balance
    ),
    jsonb_build_object(
      'payment_reference', v_purchase.payment_reference,
      'credits_amount', v_purchase.total_credits,
      'new_balance', v_new_balance,
      'price_amount', v_purchase.price_amount,
      'currency', v_purchase.currency
    ),
    false
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Achat validé et crédits ajoutés',
    'credits_added', v_purchase.total_credits,
    'new_balance', v_new_balance
  );
END;
$$;
