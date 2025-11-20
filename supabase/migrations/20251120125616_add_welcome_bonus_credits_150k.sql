/*
  # Attribution de 150,000 GNF de Crédits Gratuits à la Création de Compte

  ## Description
  Attribution automatique de 150,000 GNF en crédits gratuits (équivalent à 150 crédits)
  lors de la création d'un nouveau compte utilisateur.

  ## Modifications
    1. Fonction pour attribuer les crédits de bienvenue
    2. Trigger sur la création de profil pour attribution automatique
    3. Conversion GNF en crédits (1 crédit = 1,000 GNF)
    4. Transaction bonus enregistrée pour traçabilité

  ## Valeur des Crédits Gratuits
    - 150,000 GNF = 150 crédits
    - Permet d'utiliser les services premium IA
    - Visible dans le solde de crédits de l'utilisateur

  ## Sécurité
    - Fonction SECURITY DEFINER pour accès contrôlé
    - Attribution unique par utilisateur
    - Traçabilité complète via credit_transactions
*/

-- Fonction pour attribuer les crédits de bienvenue (150,000 GNF = 150 crédits)
CREATE OR REPLACE FUNCTION grant_welcome_bonus_credits(p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_current_balance integer;
  v_new_balance integer;
  v_bonus_credits integer := 150;
BEGIN
  IF EXISTS (
    SELECT 1 FROM credit_transactions
    WHERE user_id = p_user_id
    AND transaction_type = 'bonus'
    AND description LIKE '%Crédits de bienvenue%'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO user_credit_balances (user_id, total_credits)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT total_credits INTO v_current_balance
  FROM user_credit_balances
  WHERE user_id = p_user_id;

  v_new_balance := v_current_balance + v_bonus_credits;

  UPDATE user_credit_balances
  SET
    total_credits = v_new_balance,
    credits_bonus = credits_bonus + v_bonus_credits,
    updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_amount,
    description,
    metadata,
    balance_before,
    balance_after
  ) VALUES (
    p_user_id,
    'bonus',
    v_bonus_credits,
    'Crédits de bienvenue - 150,000 GNF offerts',
    jsonb_build_object(
      'bonus_type', 'welcome',
      'value_gnf', 150000,
      'credits_granted', v_bonus_credits,
      'source', 'account_creation'
    ),
    v_current_balance,
    v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION trigger_grant_welcome_bonus()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM grant_welcome_bonus_credits(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_welcome_bonus_credits ON profiles;
CREATE TRIGGER trigger_welcome_bonus_credits
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_grant_welcome_bonus();

CREATE OR REPLACE FUNCTION grant_welcome_bonus_to_existing_users()
RETURNS TABLE(
  user_id uuid,
  email text,
  credits_granted boolean,
  credits_amount integer
) AS $$
BEGIN
  RETURN QUERY
  WITH users_without_bonus AS (
    SELECT
      p.id as user_id,
      p.email
    FROM profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM credit_transactions ct
      WHERE ct.user_id = p.id
      AND ct.transaction_type = 'bonus'
      AND ct.description LIKE '%Crédits de bienvenue%'
    )
  )
  SELECT
    uwb.user_id,
    uwb.email,
    true as credits_granted,
    150 as credits_amount
  FROM users_without_bonus uwb
  WHERE (SELECT grant_welcome_bonus_credits(uwb.user_id)) IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_welcome_bonus_stats()
RETURNS TABLE(
  total_users bigint,
  users_with_bonus bigint,
  users_without_bonus bigint,
  total_credits_distributed bigint,
  total_value_gnf bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM profiles)::bigint as total_users,
    (SELECT COUNT(DISTINCT user_id) FROM credit_transactions
     WHERE transaction_type = 'bonus'
     AND description LIKE '%Crédits de bienvenue%')::bigint as users_with_bonus,
    (SELECT COUNT(*) FROM profiles p
     WHERE NOT EXISTS (
       SELECT 1 FROM credit_transactions ct
       WHERE ct.user_id = p.id
       AND ct.transaction_type = 'bonus'
       AND ct.description LIKE '%Crédits de bienvenue%'
     ))::bigint as users_without_bonus,
    (SELECT COALESCE(SUM(credits_amount), 0) FROM credit_transactions
     WHERE transaction_type = 'bonus'
     AND description LIKE '%Crédits de bienvenue%')::bigint as total_credits_distributed,
    (SELECT COALESCE(SUM(credits_amount), 0) * 1000 FROM credit_transactions
     WHERE transaction_type = 'bonus'
     AND description LIKE '%Crédits de bienvenue%')::bigint as total_value_gnf;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT * FROM grant_welcome_bonus_to_existing_users();

COMMENT ON FUNCTION grant_welcome_bonus_credits IS 'Attribue 150,000 GNF (150 crédits) de bonus de bienvenue à un nouvel utilisateur';
COMMENT ON FUNCTION grant_welcome_bonus_to_existing_users IS 'Attribue les crédits de bienvenue aux utilisateurs existants';
COMMENT ON FUNCTION get_welcome_bonus_stats IS 'Retourne les statistiques sur l''attribution des crédits de bienvenue';