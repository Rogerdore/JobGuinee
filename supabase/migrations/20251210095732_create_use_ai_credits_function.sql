/*
  # Création Fonction RPC use_ai_credits

  1. Table ai_service_usage_history
    - Historique d'utilisation des services IA
    - Tracking des inputs/outputs
    - Calcul des statistiques

  2. Fonction use_ai_credits
    - Vérifie le solde utilisateur
    - Déduit les crédits de manière atomique
    - Log la transaction et l'usage
    - Retourne JSON avec succès/erreur

  3. Sécurité
    - SECURITY DEFINER pour exécution sécurisée
    - Verrouillage FOR UPDATE sur profiles
    - Validation complète des données
    - Gestion d'erreurs exhaustive
*/

-- Table pour historique d'usage AI
CREATE TABLE IF NOT EXISTS ai_service_usage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_key text NOT NULL,
  credits_consumed integer NOT NULL CHECK (credits_consumed >= 0),
  input_payload jsonb,
  output_response jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user
  ON ai_service_usage_history(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_service
  ON ai_service_usage_history(service_key);

-- RLS
ALTER TABLE ai_service_usage_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_service_usage_history' 
    AND policyname = 'Users can view own usage history'
  ) THEN
    CREATE POLICY "Users can view own usage history"
      ON ai_service_usage_history FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_service_usage_history' 
    AND policyname = 'System can insert usage'
  ) THEN
    CREATE POLICY "System can insert usage"
      ON ai_service_usage_history FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Fonction RPC use_ai_credits
CREATE OR REPLACE FUNCTION use_ai_credits(
  p_user_id uuid,
  p_service_key text,
  p_input_payload jsonb DEFAULT NULL,
  p_output_response jsonb DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service_cost integer;
  v_user_credits integer;
  v_new_balance integer;
  v_usage_id uuid;
  v_service_name text;
BEGIN
  -- Vérifier que le service existe et est actif
  SELECT credits_cost, service_name
  INTO v_service_cost, v_service_name
  FROM service_credit_costs
  WHERE service_code = p_service_key
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'SERVICE_NOT_FOUND',
      'message', 'Service IA non trouvé ou inactif: ' || p_service_key
    );
  END IF;

  -- Récupérer le solde actuel avec verrouillage
  SELECT credits_balance INTO v_user_credits
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'USER_NOT_FOUND',
      'message', 'Profil utilisateur non trouvé'
    );
  END IF;

  -- Vérifier solde suffisant
  IF v_user_credits < v_service_cost THEN
    RETURN json_build_object(
      'success', false,
      'error', 'INSUFFICIENT_CREDITS',
      'message', 'Crédits insuffisants',
      'required_credits', v_service_cost,
      'available_credits', v_user_credits,
      'missing_credits', v_service_cost - v_user_credits
    );
  END IF;

  -- Calculer nouveau solde
  v_new_balance := v_user_credits - v_service_cost;

  -- Déduire les crédits
  UPDATE profiles
  SET
    credits_balance = v_new_balance,
    updated_at = now()
  WHERE id = p_user_id;

  -- Enregistrer la transaction
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_amount,
    description,
    balance_before,
    balance_after,
    service_code
  ) VALUES (
    p_user_id,
    'usage',
    -v_service_cost,
    'Service: ' || v_service_name,
    v_user_credits,
    v_new_balance,
    p_service_key
  );

  -- Logger l'usage
  INSERT INTO ai_service_usage_history (
    user_id,
    service_key,
    credits_consumed,
    input_payload,
    output_response
  ) VALUES (
    p_user_id,
    p_service_key,
    v_service_cost,
    p_input_payload,
    p_output_response
  )
  RETURNING id INTO v_usage_id;

  -- Retourner succès
  RETURN json_build_object(
    'success', true,
    'message', 'Crédits consommés avec succès',
    'credits_consumed', v_service_cost,
    'credits_remaining', v_new_balance,
    'usage_id', v_usage_id,
    'service_name', v_service_name
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', 'UNEXPECTED_ERROR',
    'message', 'Erreur: ' || SQLERRM
  );
END;
$$;

GRANT EXECUTE ON FUNCTION use_ai_credits TO authenticated;

COMMENT ON FUNCTION use_ai_credits IS
'Consomme des crédits AI de manière sécurisée avec logging complet';