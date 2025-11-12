/*
  # Ajustement des Crédits Gratuits à 150,000 GNF

  ## Description
  Réduction des crédits gratuits pour un total de 150,000 GNF de valeur.

  ## Nouveaux Crédits Gratuits
    - Analyse IA profil: Illimité (inclus gratuit)
    - Création CV/Lettre IA: 1 crédit (100,000 GNF)
    - Alertes IA ciblées: Illimité (inclus gratuit)
    - Chatbot Emploi: 50 crédits (inclus)
    - Rapport mensuel IA: 0 crédit (non inclus)
    - Coaching carrière IA: 0 crédit (non inclus, mais 50,000 GNF d'essai via autre service)

  ## Calcul de la Valeur
    - Création CV/Lettre: 100,000 GNF (1 × 100,000)
    - Chatbot: Inclus (50 requêtes d'essai)
    - Bonus d'essai: 50,000 GNF (réserve pour tester autres services)
    ────────────────────────────────────
    TOTAL: 150,000 GNF
*/

-- Fonction mise à jour pour initialiser avec 150,000 GNF de crédits
CREATE OR REPLACE FUNCTION initialize_free_subscription(p_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Créer l'abonnement gratuit
  INSERT INTO premium_subscriptions (user_id, subscription_type, status)
  VALUES (p_user_id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  -- Initialiser les crédits gratuits (total: 150,000 GNF)
  INSERT INTO premium_credits (user_id, service_type, credits_available, credits_total, last_recharged_at)
  VALUES
    -- Services illimités (inclus)
    (p_user_id, 'profile_analysis', 999, 999, now()),
    (p_user_id, 'smart_alerts', 999, 999, now()),
    
    -- Services avec crédits d'essai
    (p_user_id, 'cv_generation', 1, 1, now()),  -- 1 CV/Lettre gratuit (100,000 GNF)
    (p_user_id, 'cover_letter_generation', 1, 1, now()),  -- 1 lettre gratuite
    (p_user_id, 'chatbot_queries', 50, 50, now()),  -- 50 requêtes chatbot
    
    -- Pas de crédits pour ces services (doivent acheter)
    (p_user_id, 'monthly_report', 0, 0, now()),
    (p_user_id, 'career_coaching', 0, 0, now())
  ON CONFLICT (user_id, service_type) 
  DO UPDATE SET
    credits_available = CASE 
      WHEN premium_credits.credits_total = 0 THEN EXCLUDED.credits_available
      ELSE premium_credits.credits_available
    END,
    credits_total = CASE 
      WHEN premium_credits.credits_total = 0 THEN EXCLUDED.credits_total
      ELSE premium_credits.credits_total
    END,
    last_recharged_at = CASE 
      WHEN premium_credits.credits_total = 0 THEN now()
      ELSE premium_credits.last_recharged_at
    END,
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
    (p_user_id, 'bonus', 'cv_generation', 0, 1, 'Crédits de bienvenue - 1 CV/Lettre gratuit (100,000 GNF)', 'completed'),
    (p_user_id, 'bonus', 'chatbot_queries', 0, 50, 'Crédits de bienvenue - 50 requêtes Chatbot', 'completed')
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction mise à jour pour calculer la valeur (150,000 GNF)
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
        -- Note: monthly_report et career_coaching ne sont plus inclus gratuitement
        ELSE 0
      END
    ) INTO v_total_value
  FROM premium_credits
  WHERE user_id = p_user_id
    AND service_type IN ('cv_generation', 'cover_letter_generation');
  
  -- Ajouter une valeur estimée pour le chatbot (50,000 GNF symbolique)
  SELECT v_total_value + 50000 INTO v_total_value;
  
  RETURN COALESCE(v_total_value, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction mise à jour pour le récapitulatif
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
      WHEN 'cv_generation' THEN '100 000 GNF'
      WHEN 'cover_letter_generation' THEN '100 000 GNF'
      WHEN 'smart_alerts' THEN 'Illimité'
      WHEN 'chatbot_queries' THEN '50 000 GNF d''essai'
      ELSE ''
    END as service_value,
    CASE pc.service_type
      WHEN 'profile_analysis' THEN 'Analysez votre profil sans limite'
      WHEN 'cv_generation' THEN 'Générez 1 CV professionnel gratuit'
      WHEN 'cover_letter_generation' THEN 'Créez 1 lettre de motivation'
      WHEN 'smart_alerts' THEN 'Recevez des alertes emploi intelligentes'
      WHEN 'chatbot_queries' THEN '50 questions sur le Code du Travail'
      ELSE ''
    END as description
  FROM premium_credits pc
  WHERE pc.user_id = p_user_id
    AND pc.credits_available > 0
    AND pc.service_type NOT IN ('monthly_report', 'career_coaching')
  ORDER BY 
    CASE pc.service_type
      WHEN 'profile_analysis' THEN 1
      WHEN 'cv_generation' THEN 2
      WHEN 'cover_letter_generation' THEN 3
      WHEN 'chatbot_queries' THEN 4
      WHEN 'smart_alerts' THEN 5
      ELSE 8
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires mis à jour
COMMENT ON FUNCTION initialize_free_subscription(uuid) IS 
  'Initialise un abonnement gratuit avec 150,000 GNF de crédits de test pour un nouveau candidat';

COMMENT ON FUNCTION calculate_free_credits_value(uuid) IS 
  'Calcule la valeur monétaire totale des crédits gratuits disponibles (150,000 GNF)';
