/*
  # Compléter le système de quotas Premium IA

  ## Résumé
  Ajoute les colonnes manquantes pour activer le système de quotas quotidiens Premium PRO+
  déjà implémenté dans le code TypeScript mais incomplet côté base de données.

  ## Modifications apportées
  
  ### 1. Table ia_service_config
  - `enable_premium_limits` (boolean) : Active/désactive les limites premium pour ce service
  - `premium_daily_limit` (integer) : Nombre maximum d'utilisations par jour pour les Premium
  - `credits_cost` (integer) : Coût en crédits pour les utilisateurs non-premium
  
  ### 2. Table ai_service_usage_history
  - Ajout de la colonne `service_code` (en complément de `service_key` pour compatibilité)
  - Index sur (user_id, service_code, created_at) pour optimiser les requêtes de comptage
  
  ### 3. Fonction RPC get_premium_remaining_actions
  - Retourne le quota quotidien, les actions utilisées aujourd'hui, et le nombre restant
  - Utilisé par le chatbot et les services IA pour vérifier les limites
  
  ## Sécurité
  - RLS maintenu sur toutes les tables
  - Fonction RPC accessible uniquement aux utilisateurs authentifiés
  
  ## Notes importantes
  - Le code TypeScript existe déjà et utilisait ces colonnes
  - Cette migration complète l'implémentation existante
  - Aucune donnée existante n'est modifiée ou supprimée
*/

-- ============================================================================
-- 1. AJOUTER LES COLONNES DE QUOTAS À ia_service_config
-- ============================================================================

-- Activer/désactiver les limites premium pour ce service
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ia_service_config' 
    AND column_name = 'enable_premium_limits'
  ) THEN
    ALTER TABLE ia_service_config
    ADD COLUMN enable_premium_limits BOOLEAN DEFAULT false;
  END IF;
END $$;

COMMENT ON COLUMN ia_service_config.enable_premium_limits IS 
'Active les limites quotidiennes pour les utilisateurs Premium PRO+ sur ce service';

-- Limite quotidienne pour les utilisateurs Premium
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ia_service_config' 
    AND column_name = 'premium_daily_limit'
  ) THEN
    ALTER TABLE ia_service_config
    ADD COLUMN premium_daily_limit INTEGER DEFAULT 30 CHECK (premium_daily_limit >= 0);
  END IF;
END $$;

COMMENT ON COLUMN ia_service_config.premium_daily_limit IS 
'Nombre maximum d''utilisations par jour pour les Premium PRO+ (0 = illimité)';

-- Coût en crédits pour les utilisateurs non-premium
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ia_service_config' 
    AND column_name = 'credits_cost'
  ) THEN
    ALTER TABLE ia_service_config
    ADD COLUMN credits_cost INTEGER DEFAULT 0 CHECK (credits_cost >= 0);
  END IF;
END $$;

COMMENT ON COLUMN ia_service_config.credits_cost IS 
'Coût en crédits pour les utilisateurs non-premium';

-- ============================================================================
-- 2. CORRIGER ai_service_usage_history POUR AVOIR service_code
-- ============================================================================

-- Ajouter service_code (en complément de service_key pour compatibilité)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_service_usage_history' 
    AND column_name = 'service_code'
  ) THEN
    ALTER TABLE ai_service_usage_history
    ADD COLUMN service_code TEXT;
    
    -- Copier les valeurs de service_key vers service_code pour les données existantes
    UPDATE ai_service_usage_history 
    SET service_code = service_key 
    WHERE service_code IS NULL;
  END IF;
END $$;

-- Créer un index pour optimiser les requêtes de comptage quotidien
CREATE INDEX IF NOT EXISTS idx_ai_service_usage_user_service_date 
ON ai_service_usage_history(user_id, service_code, created_at DESC);

COMMENT ON COLUMN ai_service_usage_history.service_code IS 
'Code du service IA utilisé (utilisé pour les quotas premium)';

-- ============================================================================
-- 3. FONCTION RPC POUR OBTENIR LES ACTIONS RESTANTES
-- ============================================================================

CREATE OR REPLACE FUNCTION get_premium_remaining_actions(
  p_user_id UUID,
  p_service_code TEXT DEFAULT NULL
)
RETURNS TABLE (
  service_code TEXT,
  service_name TEXT,
  daily_limit INTEGER,
  actions_today INTEGER,
  remaining_actions INTEGER,
  is_premium BOOLEAN,
  premium_active BOOLEAN,
  quota_enabled BOOLEAN
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_is_premium BOOLEAN;
  v_premium_active BOOLEAN;
BEGIN
  -- Vérifier le statut premium de l'utilisateur
  SELECT 
    COALESCE(p.is_premium, false),
    COALESCE(p.is_premium, false) AND p.premium_expiration > NOW()
  INTO v_is_premium, v_premium_active
  FROM profiles p
  WHERE p.id = p_user_id;

  -- Si pas premium, retourner vide
  IF NOT v_premium_active THEN
    RETURN;
  END IF;

  -- Retourner les stats pour tous les services (ou un service spécifique)
  RETURN QUERY
  SELECT 
    sc.service_code,
    sc.service_name,
    COALESCE(sc.premium_daily_limit, 0) as daily_limit,
    COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM ai_service_usage_history uh
      WHERE uh.user_id = p_user_id
        AND uh.service_code = sc.service_code
        AND uh.created_at >= CURRENT_DATE
    ), 0) as actions_today,
    GREATEST(0, COALESCE(sc.premium_daily_limit, 0) - COALESCE((
      SELECT COUNT(*)::INTEGER
      FROM ai_service_usage_history uh
      WHERE uh.user_id = p_user_id
        AND uh.service_code = sc.service_code
        AND uh.created_at >= CURRENT_DATE
    ), 0)) as remaining_actions,
    v_is_premium,
    v_premium_active,
    COALESCE(sc.enable_premium_limits, false) as quota_enabled
  FROM ia_service_config sc
  WHERE sc.is_active = true
    AND (p_service_code IS NULL OR sc.service_code = p_service_code)
  ORDER BY sc.service_name;
END;
$$;

COMMENT ON FUNCTION get_premium_remaining_actions IS 
'Retourne les quotas et actions restantes pour un utilisateur Premium PRO+';

-- Accorder l'accès aux utilisateurs authentifiés uniquement
REVOKE ALL ON FUNCTION get_premium_remaining_actions FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_premium_remaining_actions TO authenticated;

-- ============================================================================
-- 4. METTRE À JOUR LES SERVICES IA EXISTANTS AVEC DES QUOTAS PAR DÉFAUT
-- ============================================================================

-- Activer les quotas premium avec des valeurs par défaut raisonnables
UPDATE ia_service_config
SET 
  enable_premium_limits = true,
  premium_daily_limit = 30,
  credits_cost = CASE 
    WHEN service_code IN ('ai_cv_builder', 'ai_cv_improver', 'ai_cv_targeted', 'ai_cover_letter') THEN 10
    WHEN service_code IN ('ai_job_matching', 'ai_career_plan') THEN 5
    WHEN service_code IN ('ai_career_coaching', 'ai_interview_simulator') THEN 15
    WHEN service_code = 'ai_chatbot' THEN 1
    WHEN service_code = 'ai_gold_profile' THEN 50
    ELSE 5
  END
WHERE enable_premium_limits IS NULL OR credits_cost IS NULL;
