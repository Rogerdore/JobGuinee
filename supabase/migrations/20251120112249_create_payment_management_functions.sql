/*
  # Create Payment Management Functions for Admin

  1. New Functions
    - `approve_credit_purchase`: Approves a credit purchase and credits the user account
    - `approve_job_publication_payment`: Approves a job publication payment and publishes the job
    - `approve_job_premium_purchase`: Approves a job premium feature purchase and activates it
    - `get_pending_payments`: Retrieves all pending payments across all tables
    - `reject_payment`: Rejects a payment and updates its status

  2. Security
    - All functions use SECURITY DEFINER with search_path set
    - Functions check for admin role before executing
*/

-- Function to approve credit purchase and credit user account
CREATE OR REPLACE FUNCTION approve_credit_purchase(
  p_transaction_id uuid,
  p_admin_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_transaction record;
  v_is_admin boolean;
  v_credits_to_add integer;
BEGIN
  -- Check if user is admin
  SELECT user_type = 'admin' INTO v_is_admin
  FROM profiles
  WHERE id = p_admin_id;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Accès refusé: droits administrateur requis'
    );
  END IF;

  -- Get transaction details
  SELECT * INTO v_transaction
  FROM premium_transactions
  WHERE id = p_transaction_id
  AND transaction_type = 'purchase';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Transaction non trouvée'
    );
  END IF;

  IF v_transaction.status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Cette transaction a déjà été traitée'
    );
  END IF;

  -- Extract credits from metadata
  v_credits_to_add := COALESCE((v_transaction.metadata->>'credits')::integer, 0);

  IF v_credits_to_add <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Montant de crédits invalide'
    );
  END IF;

  -- Update transaction status
  UPDATE premium_transactions
  SET 
    status = 'completed',
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'approved_by', p_admin_id,
      'approved_at', now(),
      'admin_notes', p_notes
    )
  WHERE id = p_transaction_id;

  -- Add credits to user account
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_amount,
    price_paid,
    currency,
    description,
    metadata
  )
  SELECT
    v_transaction.user_id,
    'purchase',
    v_credits_to_add,
    v_transaction.amount,
    v_transaction.currency,
    'Achat de crédits approuvé par admin',
    jsonb_build_object(
      'premium_transaction_id', p_transaction_id,
      'approved_by', p_admin_id
    );

  -- Update user balance
  INSERT INTO user_credit_balances (user_id, total_credits, used_credits)
  VALUES (v_transaction.user_id, v_credits_to_add, 0)
  ON CONFLICT (user_id)
  DO UPDATE SET total_credits = user_credit_balances.total_credits + v_credits_to_add;

  -- Create notification
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    v_transaction.user_id,
    'Paiement approuvé',
    format('Votre achat de %s crédits a été approuvé. Les crédits ont été ajoutés à votre compte.', v_credits_to_add),
    'success'
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Achat approuvé et crédits ajoutés',
    'credits_added', v_credits_to_add
  );
END;
$$;

-- Function to approve job publication payment
CREATE OR REPLACE FUNCTION approve_job_publication_payment(
  p_payment_id uuid,
  p_admin_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_payment record;
  v_is_admin boolean;
  v_job record;
BEGIN
  -- Check if user is admin
  SELECT user_type = 'admin' INTO v_is_admin
  FROM profiles
  WHERE id = p_admin_id;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Accès refusé: droits administrateur requis'
    );
  END IF;

  -- Get payment details
  SELECT * INTO v_payment
  FROM job_publication_payments
  WHERE id = p_payment_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Paiement non trouvé'
    );
  END IF;

  IF v_payment.payment_status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Ce paiement a déjà été traité'
    );
  END IF;

  -- Get job details
  SELECT * INTO v_job
  FROM jobs
  WHERE id = v_payment.job_id;

  -- Update payment status
  UPDATE job_publication_payments
  SET 
    payment_status = 'completed',
    paid_at = now(),
    notes = COALESCE(notes, '') || E'\n' || format('Approuvé par admin le %s. %s', now(), COALESCE(p_notes, ''))
  WHERE id = p_payment_id;

  -- Publish the job
  UPDATE jobs
  SET 
    status = 'published',
    published_at = now()
  WHERE id = v_payment.job_id
  AND status = 'pending_payment';

  -- Create notification for recruiter
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    v_job.recruiter_id,
    'Offre publiée',
    format('Votre paiement pour l''offre "%s" a été approuvé. L''offre est maintenant publiée.', v_job.title),
    'success'
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Paiement approuvé et offre publiée',
    'job_id', v_payment.job_id
  );
END;
$$;

-- Function to approve job premium feature purchase
CREATE OR REPLACE FUNCTION approve_job_premium_purchase(
  p_purchase_id uuid,
  p_admin_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_purchase record;
  v_is_admin boolean;
  v_job record;
BEGIN
  -- Check if user is admin
  SELECT user_type = 'admin' INTO v_is_admin
  FROM profiles
  WHERE id = p_admin_id;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Accès refusé: droits administrateur requis'
    );
  END IF;

  -- Get purchase details
  SELECT * INTO v_purchase
  FROM job_premium_purchases
  WHERE id = p_purchase_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Achat non trouvé'
    );
  END IF;

  IF v_purchase.payment_status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Cet achat a déjà été traité'
    );
  END IF;

  -- Get job details
  SELECT * INTO v_job
  FROM jobs
  WHERE id = v_purchase.job_id;

  -- Update purchase status
  UPDATE job_premium_purchases
  SET 
    payment_status = 'completed',
    paid_at = now(),
    start_date = now(),
    end_date = now() + (duration_days || ' days')::interval,
    notes = COALESCE(notes, '') || E'\n' || format('Approuvé par admin le %s. %s', now(), COALESCE(p_notes, ''))
  WHERE id = p_purchase_id;

  -- Activate premium feature on job
  UPDATE jobs
  SET 
    is_premium = CASE WHEN v_purchase.feature_type = 'premium_listing' THEN true ELSE is_premium END,
    featured = CASE WHEN v_purchase.feature_type = 'featured' THEN true ELSE featured END,
    urgent = CASE WHEN v_purchase.feature_type = 'urgent' THEN true ELSE urgent END
  WHERE id = v_purchase.job_id;

  -- Create notification for recruiter
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    v_job.recruiter_id,
    'Option premium activée',
    format('Votre paiement pour l''option "%s" de l''offre "%s" a été approuvé.', v_purchase.feature_type, v_job.title),
    'success'
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Achat approuvé et option activée',
    'job_id', v_purchase.job_id,
    'feature_type', v_purchase.feature_type
  );
END;
$$;

-- Function to get all pending payments
CREATE OR REPLACE FUNCTION get_pending_payments(p_admin_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin boolean;
  v_result jsonb;
BEGIN
  -- Check if user is admin
  SELECT user_type = 'admin' INTO v_is_admin
  FROM profiles
  WHERE id = p_admin_id;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Accès refusé: droits administrateur requis'
    );
  END IF;

  SELECT jsonb_build_object(
    'success', true,
    'credit_purchases', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', pt.id,
          'user_id', pt.user_id,
          'user_email', u.email,
          'amount', pt.amount,
          'currency', pt.currency,
          'credits', pt.metadata->>'credits',
          'payment_method', pt.payment_method,
          'payment_reference', pt.payment_reference,
          'created_at', pt.created_at,
          'description', pt.description
        )
      ), '[]'::jsonb)
      FROM premium_transactions pt
      JOIN auth.users u ON u.id = pt.user_id
      WHERE pt.status = 'pending'
      AND pt.transaction_type = 'purchase'
      ORDER BY pt.created_at DESC
    ),
    'job_publications', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', jpp.id,
          'job_id', jpp.job_id,
          'job_title', j.title,
          'company_id', jpp.company_id,
          'company_name', c.name,
          'amount', jpp.amount,
          'currency', jpp.currency,
          'payment_method', jpp.payment_method,
          'created_at', jpp.created_at
        )
      ), '[]'::jsonb)
      FROM job_publication_payments jpp
      JOIN jobs j ON j.id = jpp.job_id
      JOIN companies c ON c.id = jpp.company_id
      WHERE jpp.payment_status = 'pending'
      ORDER BY jpp.created_at DESC
    ),
    'job_premium_purchases', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', jpr.id,
          'job_id', jpr.job_id,
          'job_title', j.title,
          'company_name', c.name,
          'feature_type', jpr.feature_type,
          'amount', jpr.amount,
          'currency', jpr.currency,
          'duration_days', jpr.duration_days,
          'payment_method', jpr.payment_method,
          'created_at', jpr.created_at
        )
      ), '[]'::jsonb)
      FROM job_premium_purchases jpr
      JOIN jobs j ON j.id = jpr.job_id
      JOIN companies c ON c.id = jpr.company_id
      WHERE jpr.payment_status = 'pending'
      ORDER BY jpr.created_at DESC
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Function to reject a payment
CREATE OR REPLACE FUNCTION reject_payment(
  p_payment_id uuid,
  p_payment_type text,
  p_admin_id uuid,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin boolean;
  v_user_id uuid;
BEGIN
  -- Check if user is admin
  SELECT user_type = 'admin' INTO v_is_admin
  FROM profiles
  WHERE id = p_admin_id;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Accès refusé: droits administrateur requis'
    );
  END IF;

  -- Update based on payment type
  CASE p_payment_type
    WHEN 'credit_purchase' THEN
      UPDATE premium_transactions
      SET 
        status = 'rejected',
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
          'rejected_by', p_admin_id,
          'rejected_at', now(),
          'rejection_reason', p_reason
        )
      WHERE id = p_payment_id
      RETURNING user_id INTO v_user_id;

    WHEN 'job_publication' THEN
      UPDATE job_publication_payments
      SET 
        payment_status = 'rejected',
        notes = COALESCE(notes, '') || E'\n' || format('Rejeté par admin le %s. Raison: %s', now(), p_reason)
      WHERE id = p_payment_id
      RETURNING company_id INTO v_user_id;

      -- Also update job status
      UPDATE jobs j
      SET status = 'draft'
      FROM job_publication_payments jpp
      WHERE j.id = jpp.job_id
      AND jpp.id = p_payment_id
      AND j.status = 'pending_payment';

    WHEN 'job_premium' THEN
      UPDATE job_premium_purchases
      SET 
        payment_status = 'rejected',
        notes = COALESCE(notes, '') || E'\n' || format('Rejeté par admin le %s. Raison: %s', now(), p_reason)
      WHERE id = p_payment_id
      RETURNING company_id INTO v_user_id;

    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Type de paiement invalide'
      );
  END CASE;

  -- Create notification
  IF v_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      v_user_id,
      'Paiement refusé',
      format('Votre paiement a été refusé. Raison: %s', p_reason),
      'error'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Paiement rejeté'
  );
END;
$$;