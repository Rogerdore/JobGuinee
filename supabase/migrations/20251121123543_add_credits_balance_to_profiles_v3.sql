/*
  # Ajout du solde global de crédits aux profils (v3)

  1. Modifications
    - Ajout de la colonne credits_balance à la table profiles si elle n'existe pas
    - Migration des crédits existants depuis user_service_credits vers le solde global
    - Utilise les bons types de transaction : 'purchase', 'bonus', 'usage', 'refund', 'admin_adjustment'

  2. Sécurité
    - La colonne est protégée par CHECK (credits_balance >= 0)
    - Seuls les admins peuvent modifier via les fonctions dédiées
*/

-- Add credits_balance column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'credits_balance'
  ) THEN
    ALTER TABLE profiles ADD COLUMN credits_balance integer NOT NULL DEFAULT 0 CHECK (credits_balance >= 0);
    
    -- Migrate existing user_service_credits to global balance
    DECLARE
      user_record RECORD;
      total_credits integer;
    BEGIN
      FOR user_record IN (
        SELECT DISTINCT user_id
        FROM user_service_credits
        WHERE credits_balance > 0
      )
      LOOP
        SELECT COALESCE(SUM(credits_balance), 0)
        INTO total_credits
        FROM user_service_credits
        WHERE user_id = user_record.user_id;

        IF total_credits > 0 THEN
          UPDATE profiles
          SET credits_balance = total_credits
          WHERE id = user_record.user_id;

          INSERT INTO credit_transactions (
            user_id,
            transaction_type,
            credits_amount,
            balance_before,
            balance_after,
            description
          )
          VALUES (
            user_record.user_id,
            'bonus',
            total_credits,
            0,
            total_credits,
            'Migration des crédits par service vers solde global'
          );
        END IF;
      END LOOP;
    END;
  END IF;
END $$;

-- Function to consume global credits (for service usage)
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
  v_service_cost integer;
  v_current_balance integer;
  v_new_balance integer;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_authenticated',
      'message', 'Utilisateur non authentifié'
    );
  END IF;

  SELECT credits_cost INTO v_service_cost
  FROM service_credit_costs
  WHERE service_code = p_service_code
  AND is_active = true;

  IF v_service_cost IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'service_not_found',
      'message', 'Service non trouvé ou coût non configuré'
    );
  END IF;

  SELECT credits_balance INTO v_current_balance
  FROM profiles
  WHERE id = v_user_id;

  IF v_current_balance IS NULL THEN
    v_current_balance := 0;
  END IF;

  IF v_current_balance < v_service_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_credits',
      'message', 'Crédits insuffisants',
      'required', v_service_cost,
      'available', v_current_balance
    );
  END IF;

  v_new_balance := v_current_balance - v_service_cost;

  UPDATE profiles
  SET credits_balance = v_new_balance
  WHERE id = v_user_id;

  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_amount,
    service_code,
    balance_before,
    balance_after,
    description,
    metadata
  )
  VALUES (
    v_user_id,
    'usage',
    v_service_cost,
    p_service_code,
    v_current_balance,
    v_new_balance,
    'Utilisation du service: ' || p_service_code,
    p_metadata
  );

  RETURN jsonb_build_object(
    'success', true,
    'credits_used', v_service_cost,
    'new_balance', v_new_balance,
    'service_code', p_service_code,
    'message', 'Crédits consommés avec succès'
  );
END;
$$;

-- Function to add global credits (admin only)
CREATE OR REPLACE FUNCTION add_global_credits(
  p_user_id uuid,
  p_amount integer,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance integer;
  v_new_balance integer;
  v_admin_id uuid;
BEGIN
  SELECT id INTO v_admin_id
  FROM profiles
  WHERE id = auth.uid() AND user_type = 'admin';

  IF v_admin_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', 'Seuls les admins peuvent ajouter des crédits'
    );
  END IF;

  IF p_amount <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_amount',
      'message', 'Le montant doit être positif'
    );
  END IF;

  SELECT credits_balance INTO v_current_balance
  FROM profiles
  WHERE id = p_user_id;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'user_not_found',
      'message', 'Utilisateur non trouvé'
    );
  END IF;

  v_new_balance := v_current_balance + p_amount;

  UPDATE profiles
  SET credits_balance = v_new_balance
  WHERE id = p_user_id;

  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_amount,
    balance_before,
    balance_after,
    description,
    metadata
  )
  VALUES (
    p_user_id,
    'admin_adjustment',
    p_amount,
    v_current_balance,
    v_new_balance,
    COALESCE(p_note, 'Ajout de crédits par admin'),
    jsonb_build_object('admin_id', v_admin_id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'message', 'Crédits ajoutés avec succès'
  );
END;
$$;

-- Function to remove global credits (admin only)
CREATE OR REPLACE FUNCTION remove_global_credits(
  p_user_id uuid,
  p_amount integer,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance integer;
  v_new_balance integer;
  v_admin_id uuid;
BEGIN
  SELECT id INTO v_admin_id
  FROM profiles
  WHERE id = auth.uid() AND user_type = 'admin';

  IF v_admin_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', 'Seuls les admins peuvent retirer des crédits'
    );
  END IF;

  IF p_amount <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_amount',
      'message', 'Le montant doit être positif'
    );
  END IF;

  SELECT credits_balance INTO v_current_balance
  FROM profiles
  WHERE id = p_user_id;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'user_not_found',
      'message', 'Utilisateur non trouvé'
    );
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_credits',
      'message', 'Crédits insuffisants. Solde actuel: ' || v_current_balance
    );
  END IF;

  v_new_balance := v_current_balance - p_amount;

  UPDATE profiles
  SET credits_balance = v_new_balance
  WHERE id = p_user_id;

  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_amount,
    balance_before,
    balance_after,
    description,
    metadata
  )
  VALUES (
    p_user_id,
    'admin_adjustment',
    p_amount,
    v_current_balance,
    v_new_balance,
    COALESCE(p_note, 'Retrait de crédits par admin'),
    jsonb_build_object('admin_id', v_admin_id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'message', 'Crédits retirés avec succès'
  );
END;
$$;

-- Function to get user credit summary
CREATE OR REPLACE FUNCTION get_user_credit_summary(p_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_user_id uuid;
  v_current_balance integer;
  v_total_added integer;
  v_total_used integer;
  v_transactions jsonb;
BEGIN
  v_target_user_id := COALESCE(p_user_id, auth.uid());

  IF p_user_id IS NOT NULL AND p_user_id != auth.uid() THEN
    IF NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    ) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'unauthorized',
        'message', 'Non autorisé'
      );
    END IF;
  END IF;

  SELECT credits_balance INTO v_current_balance
  FROM profiles
  WHERE id = v_target_user_id;

  SELECT COALESCE(SUM(credits_amount), 0) INTO v_total_added
  FROM credit_transactions
  WHERE user_id = v_target_user_id
  AND transaction_type IN ('purchase', 'bonus', 'admin_adjustment')
  AND credits_amount > 0;

  SELECT COALESCE(SUM(credits_amount), 0) INTO v_total_used
  FROM credit_transactions
  WHERE user_id = v_target_user_id
  AND transaction_type = 'usage';

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'credits_amount', credits_amount,
      'balance_after', balance_after,
      'transaction_type', transaction_type,
      'service_code', service_code,
      'description', description,
      'created_at', created_at
    ) ORDER BY created_at DESC
  )
  INTO v_transactions
  FROM (
    SELECT * FROM credit_transactions
    WHERE user_id = v_target_user_id
    ORDER BY created_at DESC
    LIMIT 50
  ) recent;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_target_user_id,
    'current_balance', COALESCE(v_current_balance, 0),
    'total_added', v_total_added,
    'total_used', v_total_used,
    'recent_transactions', COALESCE(v_transactions, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION consume_global_credits TO authenticated;
GRANT EXECUTE ON FUNCTION add_global_credits TO authenticated;
GRANT EXECUTE ON FUNCTION remove_global_credits TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_credit_summary TO authenticated;