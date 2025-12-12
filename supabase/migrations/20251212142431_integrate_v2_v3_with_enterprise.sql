/*
  # Intégration V2/V3 avec Packs Enterprise

  ## Description
  Cette migration intègre les nouvelles fonctionnalités V2/V3 avec le système de packs Enterprise
  en ajoutant le tracking des usages et les limites appropriées.

  ## Modifications

  ### Colonnes ajoutées à enterprise_subscriptions
  - reports_generated_monthly (integer) - Nombre de rapports PDF générés ce mois
  - reports_monthly_limit (integer) - Limite mensuelle de rapports PDF
  - last_report_reset (timestamptz) - Dernière réinitialisation compteur rapports

  ### Support dans enterprise_usage_tracking
  Nouveaux types d'usage supportés via usage_type:
  - automation_executed
  - report_generated
  - calendar_export

  ## Fonctionnalités
  - Tracking des rapports PDF générés
  - Limites mensuelles configurables par pack
  - Réinitialisation automatique mensuelle des compteurs
*/

-- Ajouter les colonnes pour le tracking des rapports PDF
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enterprise_subscriptions' 
    AND column_name = 'reports_generated_monthly'
  ) THEN
    ALTER TABLE enterprise_subscriptions 
    ADD COLUMN reports_generated_monthly INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enterprise_subscriptions' 
    AND column_name = 'reports_monthly_limit'
  ) THEN
    ALTER TABLE enterprise_subscriptions 
    ADD COLUMN reports_monthly_limit INTEGER DEFAULT 10;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enterprise_subscriptions' 
    AND column_name = 'last_report_reset'
  ) THEN
    ALTER TABLE enterprise_subscriptions 
    ADD COLUMN last_report_reset TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Définir les limites par type de pack
UPDATE enterprise_subscriptions
SET 
  reports_monthly_limit = CASE subscription_type
    WHEN 'ENTERPRISE_BASIC' THEN 5
    WHEN 'ENTERPRISE_PRO' THEN 20
    WHEN 'ENTERPRISE_GOLD' THEN 100
    WHEN 'CABINET_RH' THEN 200
    ELSE 10
  END
WHERE reports_monthly_limit = 10;

-- Function pour vérifier et réinitialiser les compteurs mensuels
CREATE OR REPLACE FUNCTION check_and_reset_enterprise_counters()
RETURNS TRIGGER AS $$
BEGIN
  -- Réinitialiser compteur rapports si nouveau mois
  IF NEW.last_report_reset IS NULL OR 
     DATE_TRUNC('month', NEW.last_report_reset) < DATE_TRUNC('month', now()) THEN
    NEW.reports_generated_monthly = 0;
    NEW.last_report_reset = now();
  END IF;

  -- Réinitialiser compteur matching si nouveau mois
  IF NEW.last_matching_reset IS NULL OR 
     DATE_TRUNC('month', NEW.last_matching_reset) < DATE_TRUNC('month', now()) THEN
    NEW.matching_consumed = 0;
    NEW.matching_consumed_today = 0;
    NEW.last_matching_reset = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_reset_enterprise_counters ON enterprise_subscriptions;
CREATE TRIGGER check_reset_enterprise_counters
  BEFORE UPDATE ON enterprise_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION check_and_reset_enterprise_counters();

-- Function pour vérifier les limites de rapports PDF
CREATE OR REPLACE FUNCTION can_generate_report(p_company_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription RECORD;
  v_can_generate BOOLEAN;
BEGIN
  -- Récupérer la subscription active
  SELECT * INTO v_subscription
  FROM enterprise_subscriptions
  WHERE company_id = p_company_id
    AND status = 'active'
    AND (end_date IS NULL OR end_date > now())
  ORDER BY created_at DESC
  LIMIT 1;

  -- Si pas de subscription Enterprise, refuser
  IF v_subscription IS NULL THEN
    RETURN false;
  END IF;

  -- Vérifier les types autorisés
  IF v_subscription.subscription_type NOT IN ('ENTERPRISE_PRO', 'ENTERPRISE_GOLD', 'CABINET_RH') THEN
    RETURN false;
  END IF;

  -- Réinitialiser compteurs si nouveau mois
  IF v_subscription.last_report_reset IS NULL OR 
     DATE_TRUNC('month', v_subscription.last_report_reset) < DATE_TRUNC('month', now()) THEN
    UPDATE enterprise_subscriptions
    SET reports_generated_monthly = 0,
        last_report_reset = now()
    WHERE id = v_subscription.id;
    
    v_can_generate = true;
  ELSE
    -- Vérifier la limite
    v_can_generate = (
      v_subscription.reports_generated_monthly < v_subscription.reports_monthly_limit
    );
  END IF;

  RETURN v_can_generate;
END;
$$ LANGUAGE plpgsql;

-- Function pour incrémenter le compteur de rapports
CREATE OR REPLACE FUNCTION increment_report_counter(p_company_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_rows_affected INTEGER;
BEGIN
  UPDATE enterprise_subscriptions
  SET reports_generated_monthly = reports_generated_monthly + 1
  WHERE company_id = p_company_id
    AND status = 'active'
    AND (end_date IS NULL OR end_date > now());
    
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  
  RETURN v_rows_affected > 0;
END;
$$ LANGUAGE plpgsql;

-- Function pour logger l'usage des fonctionnalités V2/V3
CREATE OR REPLACE FUNCTION log_enterprise_feature_usage(
  p_company_id UUID,
  p_subscription_id UUID,
  p_feature_type TEXT,
  p_job_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO enterprise_usage_tracking (
    subscription_id,
    company_id,
    usage_type,
    job_id,
    metadata,
    used_at,
    created_at
  ) VALUES (
    p_subscription_id,
    p_company_id,
    p_feature_type,
    p_job_id,
    p_metadata,
    now(),
    now()
  );
END;
$$ LANGUAGE plpgsql;

-- Créer des index pour les nouvelles requêtes
CREATE INDEX IF NOT EXISTS idx_enterprise_subscriptions_reports 
  ON enterprise_subscriptions(company_id, reports_generated_monthly) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_enterprise_usage_tracking_usage_type 
  ON enterprise_usage_tracking(usage_type, created_at DESC);

-- Vue pour analytics des fonctionnalités V2/V3
CREATE OR REPLACE VIEW enterprise_feature_analytics AS
SELECT 
  es.company_id,
  c.name as company_name,
  es.subscription_type,
  es.reports_generated_monthly,
  es.reports_monthly_limit,
  COUNT(CASE WHEN eut.usage_type = 'report_generated' THEN 1 END) as total_reports_ever,
  COUNT(CASE WHEN eut.usage_type = 'automation_executed' THEN 1 END) as total_automations,
  COUNT(CASE WHEN eut.usage_type = 'calendar_export' THEN 1 END) as total_calendar_exports,
  es.matching_consumed as ai_matching_used,
  es.max_monthly_matching as ai_matching_limit,
  es.cv_consumed as profiles_purchased,
  es.monthly_cv_quota as profile_quota
FROM enterprise_subscriptions es
JOIN companies c ON c.id = es.company_id
LEFT JOIN enterprise_usage_tracking eut ON eut.company_id = es.company_id
WHERE es.status = 'active'
GROUP BY es.id, c.name;

-- Commentaires sur les nouvelles colonnes
COMMENT ON COLUMN enterprise_subscriptions.reports_generated_monthly IS 'Nombre de rapports PDF institutionnels générés ce mois';
COMMENT ON COLUMN enterprise_subscriptions.reports_monthly_limit IS 'Limite mensuelle de génération de rapports PDF';
COMMENT ON COLUMN enterprise_subscriptions.last_report_reset IS 'Date de dernière réinitialisation du compteur de rapports';
