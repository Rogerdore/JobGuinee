/*
  # Amélioration système alertes emploi newsletter
  
  ## Objectif
  Connecter les abonnés newsletter (newsletter_subscribers) au pipeline d'envoi 
  d'emails automatiques lorsqu'une offre correspondante est publiée.
  
  ## Modifications
  1. Ajout de colonnes critères à newsletter_subscribers (sectors, locations, contract_types, experience_level, keywords)
  2. Mise à jour du trigger trigger_job_alerts_to_candidates pour aussi notifier les newsletter_subscribers
*/

-- ============================================================================
-- ÉTAPE 1 : Ajouter colonnes critères à newsletter_subscribers
-- ============================================================================

ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS sectors text[] DEFAULT '{}';
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS locations text[] DEFAULT '{}';
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS contract_types text[] DEFAULT '{}';
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS experience_level text[] DEFAULT '{}';
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS keywords text[] DEFAULT '{}';

-- Index pour les recherches de matching
CREATE INDEX IF NOT EXISTS idx_newsletter_sectors ON newsletter_subscribers USING GIN(sectors);
CREATE INDEX IF NOT EXISTS idx_newsletter_locations ON newsletter_subscribers USING GIN(locations);

-- ============================================================================
-- ÉTAPE 2 : Mettre à jour le trigger pour aussi notifier les newsletter_subscribers
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_job_alerts_to_candidates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alert RECORD;
  v_newsletter RECORD;
  v_company_name TEXT;
BEGIN
  -- Ne traiter que les jobs publiés
  IF NOT (
    (TG_OP = 'INSERT' AND NEW.status = 'published') OR
    (TG_OP = 'UPDATE' AND OLD.status != 'published' AND NEW.status = 'published')
  ) THEN
    RETURN NEW;
  END IF;

  -- Récupérer le nom de la compagnie
  SELECT name INTO v_company_name
  FROM companies
  WHERE id = NEW.company_id;

  -- ========================================
  -- PARTIE 1 : Alertes utilisateurs connectés (job_alerts)
  -- ========================================
  FOR v_alert IN
    SELECT DISTINCT
      ja.user_id,
      p.email,
      p.full_name,
      ja.id as alert_id
    FROM job_alerts ja
    JOIN profiles p ON ja.user_id = p.id
    WHERE ja.is_active = true
    AND ja.notify_email = true
    AND (
      ja.keywords = '{}' OR ja.keywords IS NULL
      OR EXISTS (
        SELECT 1 
        FROM unnest(ja.keywords) kw 
        WHERE NEW.title ILIKE '%' || kw || '%'
        OR NEW.description ILIKE '%' || kw || '%'
      )
    )
    AND (
      ja.sectors = '{}' OR ja.sectors IS NULL
      OR NEW.sector = ANY(ja.sectors)
    )
    AND (
      ja.locations = '{}' OR ja.locations IS NULL
      OR NEW.location = ANY(ja.locations)
    )
    AND (
      ja.contract_types = '{}' OR ja.contract_types IS NULL
      OR NEW.contract_type = ANY(ja.contract_types)
    )
    AND (
      ja.experience_level = '{}' OR ja.experience_level IS NULL
      OR NEW.experience_level = ANY(ja.experience_level)
    )
  LOOP
    PERFORM enqueue_email(
      p_template_key := 'job_alert_match',
      p_to_email := v_alert.email,
      p_to_name := v_alert.full_name,
      p_variables := jsonb_build_object(
        'candidate_name', COALESCE(v_alert.full_name, 'Candidat'),
        'job_title', NEW.title,
        'company_name', COALESCE(v_company_name, NEW.company_name, 'Une entreprise'),
        'location', COALESCE(NEW.location, 'Guinée'),
        'job_type', COALESCE(NEW.contract_type, ''),
        'salary_range', COALESCE(NEW.salary_range, 'Non spécifié'),
        'app_url', 'https://jobguinee-pro.com',
        'job_url', 'https://jobguinee-pro.com/jobs/' || NEW.id
      ),
      p_priority := 5,
      p_scheduled_for := now() + interval '5 minutes',
      p_user_id := v_alert.user_id,
      p_job_id := NEW.id
    );

    UPDATE job_alerts
    SET matched_jobs_count = matched_jobs_count + 1,
        last_check_at = now()
    WHERE id = v_alert.alert_id;
  END LOOP;

  -- ========================================
  -- PARTIE 2 : Alertes abonnés newsletter (newsletter_subscribers)
  -- ========================================
  FOR v_newsletter IN
    SELECT DISTINCT ns.id, ns.email
    FROM newsletter_subscribers ns
    WHERE ns.is_active = true
    AND (
      ns.domain = 'all' 
      OR ns.domain IS NULL 
      OR ns.domain = '' 
      OR ns.domain = NEW.sector
    )
    AND (
      ns.sectors = '{}' OR ns.sectors IS NULL
      OR NEW.sector = ANY(ns.sectors)
    )
    AND (
      ns.locations = '{}' OR ns.locations IS NULL
      OR NEW.location = ANY(ns.locations)
    )
    AND (
      ns.contract_types = '{}' OR ns.contract_types IS NULL
      OR NEW.contract_type = ANY(ns.contract_types)
    )
    AND (
      ns.experience_level = '{}' OR ns.experience_level IS NULL
      OR NEW.experience_level = ANY(ns.experience_level)
    )
    AND (
      ns.keywords = '{}' OR ns.keywords IS NULL
      OR EXISTS (
        SELECT 1 
        FROM unnest(ns.keywords) kw 
        WHERE NEW.title ILIKE '%' || kw || '%'
        OR NEW.description ILIKE '%' || kw || '%'
      )
    )
    -- Éviter les doublons avec les alertes job_alerts déjà envoyées
    AND NOT EXISTS (
      SELECT 1 FROM job_alerts ja
      JOIN profiles p ON ja.user_id = p.id
      WHERE p.email = ns.email
      AND ja.is_active = true
    )
  LOOP
    PERFORM enqueue_email(
      p_template_key := 'job_alert_match',
      p_to_email := v_newsletter.email,
      p_to_name := NULL,
      p_variables := jsonb_build_object(
        'candidate_name', 'Cher abonné',
        'job_title', NEW.title,
        'company_name', COALESCE(v_company_name, NEW.company_name, 'Une entreprise'),
        'location', COALESCE(NEW.location, 'Guinée'),
        'job_type', COALESCE(NEW.contract_type, ''),
        'salary_range', COALESCE(NEW.salary_range, 'Non spécifié'),
        'app_url', 'https://jobguinee-pro.com',
        'job_url', 'https://jobguinee-pro.com/jobs/' || NEW.id
      ),
      p_priority := 6,
      p_scheduled_for := now() + interval '10 minutes',
      p_job_id := NEW.id
    );
  END LOOP;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur trigger_job_alerts_to_candidates: %', SQLERRM;
  RETURN NEW;
END;
$$;
