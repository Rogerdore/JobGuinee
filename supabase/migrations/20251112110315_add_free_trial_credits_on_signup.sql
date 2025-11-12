/*
  # Crédits Gratuits de Test pour Nouveaux Candidats

  ## Description
  Attribution automatique de crédits gratuits pour tester les services premium
  dès la création d'un compte candidat.

  ## Crédits Gratuits Attribués
    - Analyse IA profil: Illimité (999 crédits)
    - Création CV/Lettre IA: 2 crédits gratuits
    - Alertes IA ciblées: Illimité (999 crédits)
    - Chatbot Emploi: 100 crédits
    - Rapport mensuel IA: 1 crédit gratuit (1 mois d'essai)
    - Coaching carrière IA: 1 session gratuite

  ## Modifications
    1. Mise à jour de la fonction initialize_free_subscription
    2. Création d'un trigger sur auth.users pour attribution automatique
    3. Fonction de vérification pour comptes existants
*/

-- Fonction améliorée pour initialiser un abonnement avec crédits gratuits
CREATE OR REPLACE FUNCTION initialize_free_subscription(p_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Créer l'abonnement gratuit
  INSERT INTO premium_subscriptions (user_id, subscription_type, status)
  VALUES (p_user_id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  -- Initialiser TOUS les crédits gratuits (inclus services de test)
  INSERT INTO premium_credits (user_id, service_type, credits_available, credits_total, last_recharged_at)
  VALUES
    -- Services illimités
    (p_user_id, 'profile_analysis', 999, 999, now()),
    (p_user_id, 'smart_alerts', 999, 999, now()),
    
    -- Services avec crédits de test généreux
    (p_user_id, 'cv_generation', 2, 2, now()),  -- 2 CV/Lettres gratuits
    (p_user_id, 'cover_letter_generation', 2, 2, now()),  -- 2 lettres gratuites
    (p_user_id, 'chatbot_queries', 100, 100, now()),  -- 100 requêtes chatbot
    (p_user_id, 'monthly_report', 1, 1, now()),  -- 1 rapport gratuit
    (p_user_id, 'career_coaching', 1, 1, now())  -- 1 session de coaching
  ON CONFLICT (user_id, service_type) 
  DO UPDATE SET
    credits_available = premium_credits.credits_available + EXCLUDED.credits_available,
    credits_total = premium_credits.credits_total + EXCLUDED.credits_total,
    last_recharged_at = now(),
    updated_at = now();

  -- Créer une transaction bonus pour traçabilité
  INSERT INTO premium_transactions (
    user_id,
    transaction_type,
    service_type,
    amount,
    credits_change,
    description,
    status
  ) VALUES
    (p_user_id, 'bonus', 'cv_generation', 0, 2, 'Crédits de bienvenue - Création CV/Lettre', 'completed'),
    (p_user_id, 'bonus', 'chatbot_queries', 0, 100, 'Crédits de bienvenue - Chatbot Emploi', 'completed'),
    (p_user_id, 'bonus', 'monthly_report', 0, 1, 'Crédits de bienvenue - Rapport mensuel', 'completed'),
    (p_user_id, 'bonus', 'career_coaching', 0, 1, 'Crédits de bienvenue - Coaching carrière', 'completed')
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour attribuer automatiquement les crédits aux candidats existants
CREATE OR REPLACE FUNCTION grant_trial_credits_to_existing_candidates()
RETURNS TABLE(
  user_id uuid,
  email text,
  credits_granted boolean
) AS $$
BEGIN
  RETURN QUERY
  WITH candidate_users AS (
    SELECT 
      p.id as user_id,
      p.email
    FROM profiles p
    WHERE p.user_type = 'candidate'
      AND NOT EXISTS (
        SELECT 1 FROM premium_credits pc
        WHERE pc.user_id = p.id
          AND pc.service_type = 'cv_generation'
      )
  )
  SELECT 
    cu.user_id,
    cu.email,
    (SELECT initialize_free_subscription(cu.user_id)) IS NOT NULL as credits_granted
  FROM candidate_users cu;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction trigger pour attribution automatique lors de la création de profil
CREATE OR REPLACE FUNCTION auto_initialize_premium_on_profile_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Si c'est un candidat, initialiser les crédits automatiquement
  IF NEW.user_type = 'candidate' THEN
    PERFORM initialize_free_subscription(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur la table profiles
DROP TRIGGER IF EXISTS trigger_auto_initialize_premium ON profiles;
CREATE TRIGGER trigger_auto_initialize_premium
  AFTER INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.user_type = 'candidate')
  EXECUTE FUNCTION auto_initialize_premium_on_profile_creation();

-- Fonction pour afficher un récapitulatif des crédits gratuits
CREATE OR REPLACE FUNCTION get_welcome_credits_summary(p_user_id uuid)
RETURNS TABLE(
  service_name text,
  credits_available integer,
  service_value text,
  description text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE pc.service_type
      WHEN 'profile_analysis' THEN 'Analyse IA de profil'
      WHEN 'cv_generation' THEN 'Création CV/Lettre IA'
      WHEN 'cover_letter_generation' THEN 'Lettres de motivation IA'
      WHEN 'smart_alerts' THEN 'Alertes IA ciblées'
      WHEN 'chatbot_queries' THEN 'Chatbot Travail & Emploi'
      WHEN 'monthly_report' THEN 'Rapport mensuel IA'
      WHEN 'career_coaching' THEN 'Coaching carrière IA'
      ELSE pc.service_type
    END as service_name,
    pc.credits_available::integer,
    CASE pc.service_type
      WHEN 'profile_analysis' THEN 'Illimité'
      WHEN 'cv_generation' THEN '200 000 GNF de valeur'
      WHEN 'cover_letter_generation' THEN '200 000 GNF de valeur'
      WHEN 'smart_alerts' THEN 'Illimité'
      WHEN 'chatbot_queries' THEN 'Inclus'
      WHEN 'monthly_report' THEN '150 000 GNF de valeur'
      WHEN 'career_coaching' THEN '250 000 GNF de valeur'
      ELSE 'Gratuit'
    END as service_value,
    CASE pc.service_type
      WHEN 'profile_analysis' THEN 'Analysez votre profil sans limite'
      WHEN 'cv_generation' THEN 'Générez 2 CV ou lettres professionnels'
      WHEN 'cover_letter_generation' THEN 'Créez 2 lettres de motivation'
      WHEN 'smart_alerts' THEN 'Recevez des alertes emploi intelligentes'
      WHEN 'chatbot_queries' THEN '100 questions sur le Code du Travail'
      WHEN 'monthly_report' THEN '1 rapport détaillé de vos candidatures'
      WHEN 'career_coaching' THEN '1 session de simulation d''entretien'
      ELSE 'Service gratuit'
    END as description
  FROM premium_credits pc
  WHERE pc.user_id = p_user_id
    AND pc.credits_available > 0
  ORDER BY 
    CASE pc.service_type
      WHEN 'profile_analysis' THEN 1
      WHEN 'cv_generation' THEN 2
      WHEN 'cover_letter_generation' THEN 3
      WHEN 'chatbot_queries' THEN 4
      WHEN 'smart_alerts' THEN 5
      WHEN 'monthly_report' THEN 6
      WHEN 'career_coaching' THEN 7
      ELSE 8
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour calculer la valeur totale des crédits gratuits
CREATE OR REPLACE FUNCTION calculate_free_credits_value(p_user_id uuid)
RETURNS numeric AS $$
DECLARE
  v_total_value numeric := 0;
BEGIN
  SELECT 
    SUM(
      CASE service_type
        WHEN 'cv_generation' THEN credits_available * 100000
        WHEN 'cover_letter_generation' THEN credits_available * 100000
        WHEN 'monthly_report' THEN credits_available * 150000
        WHEN 'career_coaching' THEN credits_available * 250000
        ELSE 0
      END
    ) INTO v_total_value
  FROM premium_credits
  WHERE user_id = p_user_id
    AND service_type IN ('cv_generation', 'cover_letter_generation', 'monthly_report', 'career_coaching');
  
  RETURN COALESCE(v_total_value, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour get_user_premium_status pour inclure la valeur des crédits gratuits
CREATE OR REPLACE FUNCTION get_user_premium_status(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_subscription record;
  v_credits jsonb;
  v_total_value numeric;
BEGIN
  -- Récupérer l'abonnement
  SELECT * INTO v_subscription
  FROM premium_subscriptions
  WHERE user_id = p_user_id;

  -- Si pas d'abonnement, initialiser
  IF v_subscription IS NULL THEN
    PERFORM initialize_free_subscription(p_user_id);
    SELECT * INTO v_subscription
    FROM premium_subscriptions
    WHERE user_id = p_user_id;
  END IF;

  -- Récupérer les crédits
  SELECT jsonb_object_agg(service_type, jsonb_build_object(
    'available', credits_available,
    'used', credits_used,
    'total', credits_total,
    'last_recharged', last_recharged_at
  )) INTO v_credits
  FROM premium_credits
  WHERE user_id = p_user_id;

  -- Calculer la valeur totale
  v_total_value := calculate_free_credits_value(p_user_id);

  RETURN jsonb_build_object(
    'subscription_type', v_subscription.subscription_type,
    'status', v_subscription.status,
    'credits', COALESCE(v_credits, '{}'::jsonb),
    'free_credits_value', v_total_value,
    'is_trial', v_subscription.subscription_type = 'free'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires pour documentation
COMMENT ON FUNCTION initialize_free_subscription(uuid) IS 
  'Initialise un abonnement gratuit avec crédits de test pour un nouveau candidat';

COMMENT ON FUNCTION grant_trial_credits_to_existing_candidates() IS 
  'Attribue les crédits gratuits aux candidats existants qui n''en ont pas encore';

COMMENT ON FUNCTION get_welcome_credits_summary(uuid) IS 
  'Retourne un récapitulatif lisible des crédits gratuits d''un utilisateur';

COMMENT ON FUNCTION calculate_free_credits_value(uuid) IS 
  'Calcule la valeur monétaire totale des crédits gratuits disponibles';
