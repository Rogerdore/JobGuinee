/*
  # Add Notification System for Credit Purchases

  1. Changes
    - Update complete_credit_purchase function to send notification on validation
    - Update cancel_credit_purchase function to send notification on rejection
    - Notifications are created in the notifications table automatically

  2. Security
    - Uses SECURITY DEFINER to allow notification creation
    - Validates admin permissions before actions
*/

-- Update complete_credit_purchase to send notification
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
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Vous devez être connecté',
      'error', 'UNAUTHORIZED'
    );
  END IF;

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

  IF v_purchase.payment_status = 'completed' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Achat déjà complété',
      'error', 'ALREADY_COMPLETED'
    );
  END IF;

  UPDATE profiles
  SET credits_balance = COALESCE(credits_balance, 0) + v_purchase.total_credits
  WHERE id = v_purchase.user_id
  RETURNING credits_balance INTO v_new_balance;

  UPDATE credit_purchases
  SET
    payment_status = 'completed',
    purchase_status = 'completed',
    completed_at = now(),
    admin_notes = p_admin_notes
  WHERE id = p_purchase_id;

  INSERT INTO credit_transactions (
    user_id,
    amount,
    transaction_type,
    reference_type,
    reference_id,
    description,
    balance_after
  ) VALUES (
    v_purchase.user_id,
    v_purchase.total_credits,
    'purchase',
    'credit_purchase',
    p_purchase_id,
    'Achat de crédits IA - ' || v_purchase.payment_reference,
    v_new_balance
  );

  -- Send notification to user
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

-- Update cancel_credit_purchase to send notification
CREATE OR REPLACE FUNCTION cancel_credit_purchase(
  p_purchase_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_is_admin boolean;
  v_purchase record;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Vous devez être connecté',
      'error', 'UNAUTHORIZED'
    );
  END IF;

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

  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = v_user_id AND user_type = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin AND v_purchase.user_id != v_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Non autorisé',
      'error', 'FORBIDDEN'
    );
  END IF;

  IF v_purchase.payment_status = 'completed' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Impossible d''annuler un achat complété',
      'error', 'ALREADY_COMPLETED'
    );
  END IF;

  UPDATE credit_purchases
  SET
    payment_status = 'cancelled',
    purchase_status = 'cancelled',
    failed_reason = p_reason
  WHERE id = p_purchase_id;

  -- Send notification to user if admin cancelled
  IF v_is_admin THEN
    INSERT INTO notifications (
      profile_id,
      type,
      title,
      message,
      metadata,
      is_read
    ) VALUES (
      v_purchase.user_id,
      'credits_rejected',
      format('Paiement non validé - %s', v_purchase.payment_reference),
      format(
        E'Nous avons examiné votre demande d''achat de crédits mais nous ne pouvons malheureusement pas la valider.\n\n' ||
        '💳 Référence : %s\n' ||
        '💰 Montant : %s %s\n' ||
        '❌ Crédits : %s crédits IA' ||
        CASE
          WHEN p_reason IS NOT NULL THEN E'\n\n📝 Raison :\n' || p_reason
          ELSE ''
        END ||
        E'\n\nSi vous pensez qu''il s''agit d''une erreur, veuillez nous contacter via WhatsApp avec votre preuve de paiement.\n\nL''équipe JobGuinée',
        v_purchase.payment_reference,
        v_purchase.price_amount,
        v_purchase.currency,
        v_purchase.total_credits
      ),
      jsonb_build_object(
        'payment_reference', v_purchase.payment_reference,
        'credits_amount', v_purchase.total_credits,
        'price_amount', v_purchase.price_amount,
        'currency', v_purchase.currency,
        'rejection_reason', p_reason
      ),
      false
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Achat annulé avec succès'
  );
END;
$$;
