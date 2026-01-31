/*
  # Système Définitif de File d'Attente d'Emails

  ## Vue d'ensemble
  Ce système centralise TOUS les envois d'emails dans une file d'attente (email_queue).
  Aucun trigger ne doit envoyer d'emails directement - tous passent par la fonction enqueue_email().

  ## Architecture
  1. Fonction centrale : enqueue_email() - Insère les emails dans la queue
  2. Triggers métier - Appellent enqueue_email() lors d'événements spécifiques
  3. Edge Function externe - Traite la queue (déjà en place, non modifiée)

  ## Événements couverts
  1. Inscription candidat → Email de bienvenue
  2. Inscription recruteur → Email de bienvenue  
  3. Candidature envoyée → Confirmation candidat + Alerte recruteur
  4. Offre publiée → Alertes emploi aux candidats concernés

  ## Nettoyage
  - Suppression de tous les anciens triggers qui envoient directement des emails
  - Remplacement par des triggers propres utilisant enqueue_email()
*/

-- ============================================================================
-- ÉTAPE 1 : FONCTION CENTRALE enqueue_email
-- ============================================================================

CREATE OR REPLACE FUNCTION enqueue_email(
  p_template_key TEXT,
  p_to_email TEXT,
  p_to_name TEXT DEFAULT NULL,
  p_variables JSONB DEFAULT '{}'::jsonb,
  p_priority INTEGER DEFAULT 5,
  p_scheduled_for TIMESTAMPTZ DEFAULT now(),
  p_user_id UUID DEFAULT NULL,
  p_job_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template_id UUID;
  v_queue_id UUID;
BEGIN
  -- Récupérer l'ID du template
  SELECT id INTO v_template_id
  FROM email_templates
  WHERE template_key = p_template_key
  AND is_active = true
  LIMIT 1;

  -- Si le template n'existe pas, logger et retourner NULL
  IF v_template_id IS NULL THEN
    RAISE WARNING 'Template email introuvable ou inactif: %', p_template_key;
    RETURN NULL;
  END IF;

  -- Si l'email est vide, ne rien faire
  IF p_to_email IS NULL OR p_to_email = '' THEN
    RAISE WARNING 'Email destinataire vide pour template: %', p_template_key;
    RETURN NULL;
  END IF;

  -- Insérer dans la queue
  INSERT INTO email_queue (
    template_id,
    to_email,
    to_name,
    template_variables,
    priority,
    scheduled_for,
    status,
    retry_count,
    user_id,
    job_id
  ) VALUES (
    v_template_id,
    p_to_email,
    p_to_name,
    p_variables,
    p_priority,
    p_scheduled_for,
    'pending',
    0,
    p_user_id,
    p_job_id
  ) RETURNING id INTO v_queue_id;

  RETURN v_queue_id;

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur enqueue_email: template=%, email=%, erreur=%', 
    p_template_key, p_to_email, SQLERRM;
  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION enqueue_email IS 
'Fonction centrale pour ajouter un email à la file d''attente. 
Tous les triggers métier doivent utiliser cette fonction.';

-- ============================================================================
-- ÉTAPE 2 : NETTOYAGE DES ANCIENS TRIGGERS
-- ============================================================================

-- Supprimer les anciens triggers qui insèrent dans email_queue directement
DROP TRIGGER IF EXISTS send_application_confirmation_trigger ON applications;
DROP TRIGGER IF EXISTS send_recruiter_alert_trigger ON applications;
DROP TRIGGER IF EXISTS send_job_alerts_trigger ON jobs;
DROP TRIGGER IF EXISTS trigger_job_alerts_on_publish ON jobs;

-- Supprimer les anciennes fonctions associées
DROP FUNCTION IF EXISTS send_application_confirmation_email();
DROP FUNCTION IF EXISTS send_new_application_alert_to_recruiter();
DROP FUNCTION IF EXISTS send_job_alerts_to_matching_candidates();
DROP FUNCTION IF EXISTS trigger_immediate_job_alerts();

-- ============================================================================
-- ÉTAPE 3 : FONCTIONS MÉTIER PROPRES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- A. EMAIL DE BIENVENUE (déjà en place via send_welcome_email_on_signup)
-- -----------------------------------------------------------------------------
-- Note: La fonction send_welcome_email_on_signup() existe déjà et fonctionne correctement.
-- Elle insère déjà dans email_queue. Nous la laissons telle quelle.

-- -----------------------------------------------------------------------------
-- B. CONFIRMATION CANDIDATURE (au candidat)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION trigger_application_confirmation_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_candidate_email TEXT;
  v_candidate_name TEXT;
  v_job_title TEXT;
  v_company_name TEXT;
BEGIN
  -- Récupérer les informations du candidat
  SELECT p.email, p.full_name
  INTO v_candidate_email, v_candidate_name
  FROM profiles p
  WHERE p.id = NEW.candidate_id;

  -- Récupérer les informations du job
  SELECT j.title, c.name
  INTO v_job_title, v_company_name
  FROM jobs j
  LEFT JOIN companies c ON j.company_id = c.id
  WHERE j.id = NEW.job_id;

  -- Ajouter à la queue via la fonction centrale
  PERFORM enqueue_email(
    p_template_key := 'application_confirmation',
    p_to_email := v_candidate_email,
    p_to_name := v_candidate_name,
    p_variables := jsonb_build_object(
      'candidate_name', v_candidate_name,
      'job_title', v_job_title,
      'company_name', COALESCE(v_company_name, 'l''entreprise'),
      'application_reference', NEW.reference_number,
      'app_url', 'https://jobguinee-pro.com'
    ),
    p_priority := 8,
    p_user_id := NEW.candidate_id,
    p_job_id := NEW.job_id
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Ne jamais bloquer l'insertion de la candidature à cause d'un email
  RAISE WARNING 'Erreur trigger_application_confirmation_email: %', SQLERRM;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION trigger_application_confirmation_email IS
'Envoie un email de confirmation au candidat après sa candidature';

-- -----------------------------------------------------------------------------
-- C. ALERTE RECRUTEUR (nouvelle candidature)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION trigger_recruiter_new_application_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recruiter_email TEXT;
  v_recruiter_name TEXT;
  v_candidate_name TEXT;
  v_job_title TEXT;
BEGIN
  -- Récupérer les informations du recruteur via le job
  SELECT p.email, p.full_name
  INTO v_recruiter_email, v_recruiter_name
  FROM jobs j
  JOIN profiles p ON j.recruiter_id = p.id
  WHERE j.id = NEW.job_id;

  -- Récupérer le nom du candidat
  SELECT p.full_name
  INTO v_candidate_name
  FROM profiles p
  WHERE p.id = NEW.candidate_id;

  -- Récupérer le titre du job
  SELECT title
  INTO v_job_title
  FROM jobs
  WHERE id = NEW.job_id;

  -- Ajouter à la queue via la fonction centrale
  PERFORM enqueue_email(
    p_template_key := 'new_application_alert',
    p_to_email := v_recruiter_email,
    p_to_name := v_recruiter_name,
    p_variables := jsonb_build_object(
      'recruiter_name', v_recruiter_name,
      'candidate_name', v_candidate_name,
      'job_title', v_job_title,
      'application_reference', NEW.reference_number,
      'app_url', 'https://jobguinee-pro.com'
    ),
    p_priority := 7,
    p_job_id := NEW.job_id
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur trigger_recruiter_new_application_alert: %', SQLERRM;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION trigger_recruiter_new_application_alert IS
'Envoie un email au recruteur lors d''une nouvelle candidature';

-- -----------------------------------------------------------------------------
-- D. ALERTES EMPLOI (offres correspondantes pour candidats)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION trigger_job_alerts_to_candidates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alert RECORD;
  v_company_name TEXT;
BEGIN
  -- Ne traiter que les nouveaux jobs publiés
  IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
    -- Récupérer le nom de la compagnie
    SELECT name INTO v_company_name
    FROM companies
    WHERE id = NEW.company_id;

    -- Trouver les candidats avec alertes actives correspondantes
    FOR v_alert IN
      SELECT DISTINCT
        ja.user_id,
        p.email,
        p.full_name,
        ja.id as alert_id
      FROM job_alerts ja
      JOIN profiles p ON ja.user_id = p.id
      WHERE ja.is_active = true
      AND (
        ja.keywords IS NULL 
        OR EXISTS (
          SELECT 1 
          FROM unnest(ja.keywords) kw 
          WHERE NEW.title ILIKE '%' || kw || '%'
          OR NEW.description ILIKE '%' || kw || '%'
        )
      )
      AND (ja.location IS NULL OR ja.location = NEW.location)
      AND (ja.job_type IS NULL OR ja.job_type = NEW.job_type)
      AND (ja.experience_level IS NULL OR ja.experience_level = NEW.experience_level)
    LOOP
      -- Ajouter à la queue pour chaque candidat correspondant
      PERFORM enqueue_email(
        p_template_key := 'job_alert_match',
        p_to_email := v_alert.email,
        p_to_name := v_alert.full_name,
        p_variables := jsonb_build_object(
          'candidate_name', v_alert.full_name,
          'job_title', NEW.title,
          'company_name', COALESCE(v_company_name, 'Une entreprise'),
          'location', NEW.location,
          'job_type', NEW.job_type,
          'salary_range', COALESCE(NEW.salary_range, 'Non spécifié'),
          'app_url', 'https://jobguinee-pro.com',
          'job_url', 'https://jobguinee-pro.com/jobs/' || NEW.id
        ),
        p_priority := 5,
        p_scheduled_for := now() + interval '5 minutes', -- Légèrement différé
        p_user_id := v_alert.user_id,
        p_job_id := NEW.id
      );

      -- Mettre à jour la dernière alerte envoyée
      UPDATE job_alerts
      SET last_triggered_at = now()
      WHERE id = v_alert.alert_id;
    END LOOP;
  END IF;

  -- Gérer aussi les mises à jour vers 'published'
  IF TG_OP = 'UPDATE' AND OLD.status != 'published' AND NEW.status = 'published' THEN
    -- Même logique que ci-dessus
    SELECT name INTO v_company_name
    FROM companies
    WHERE id = NEW.company_id;

    FOR v_alert IN
      SELECT DISTINCT
        ja.user_id,
        p.email,
        p.full_name,
        ja.id as alert_id
      FROM job_alerts ja
      JOIN profiles p ON ja.user_id = p.id
      WHERE ja.is_active = true
      AND (
        ja.keywords IS NULL 
        OR EXISTS (
          SELECT 1 
          FROM unnest(ja.keywords) kw 
          WHERE NEW.title ILIKE '%' || kw || '%'
          OR NEW.description ILIKE '%' || kw || '%'
        )
      )
      AND (ja.location IS NULL OR ja.location = NEW.location)
      AND (ja.job_type IS NULL OR ja.job_type = NEW.job_type)
      AND (ja.experience_level IS NULL OR ja.experience_level = NEW.experience_level)
    LOOP
      PERFORM enqueue_email(
        p_template_key := 'job_alert_match',
        p_to_email := v_alert.email,
        p_to_name := v_alert.full_name,
        p_variables := jsonb_build_object(
          'candidate_name', v_alert.full_name,
          'job_title', NEW.title,
          'company_name', COALESCE(v_company_name, 'Une entreprise'),
          'location', NEW.location,
          'job_type', NEW.job_type,
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
      SET last_triggered_at = now()
      WHERE id = v_alert.alert_id;
    END LOOP;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur trigger_job_alerts_to_candidates: %', SQLERRM;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION trigger_job_alerts_to_candidates IS
'Envoie des alertes emploi aux candidats avec alertes actives correspondantes';

-- ============================================================================
-- ÉTAPE 4 : CRÉATION DES TRIGGERS MÉTIER
-- ============================================================================

-- Trigger A : Email de bienvenue (déjà en place, on le laisse)
-- send_welcome_email_trigger existe déjà sur profiles

-- Trigger B : Confirmation candidature (au candidat)
CREATE TRIGGER trigger_send_application_confirmation
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_application_confirmation_email();

-- Trigger C : Alerte recruteur (nouvelle candidature)
CREATE TRIGGER trigger_send_recruiter_application_alert
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recruiter_new_application_alert();

-- Trigger D : Alertes emploi (offres publiées)
CREATE TRIGGER trigger_send_job_alerts
  AFTER INSERT OR UPDATE OF status ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_job_alerts_to_candidates();

-- ============================================================================
-- ÉTAPE 5 : VUE DE MONITORING
-- ============================================================================

CREATE OR REPLACE VIEW v_email_queue_monitoring AS
SELECT
  eq.id,
  eq.to_email,
  eq.to_name,
  et.template_key,
  et.subject as template_subject,
  eq.status,
  eq.priority,
  eq.retry_count,
  eq.error_message,
  eq.scheduled_for,
  eq.created_at,
  eq.processed_at,
  CASE 
    WHEN eq.status = 'pending' AND eq.scheduled_for <= now() THEN 'READY'
    WHEN eq.status = 'pending' THEN 'SCHEDULED'
    WHEN eq.status = 'processing' THEN 'IN_PROGRESS'
    WHEN eq.status = 'sent' THEN 'SUCCESS'
    WHEN eq.status = 'failed' THEN 'ERROR'
    ELSE 'UNKNOWN'
  END as queue_status
FROM email_queue eq
LEFT JOIN email_templates et ON eq.template_id = et.id
ORDER BY eq.created_at DESC;

COMMENT ON VIEW v_email_queue_monitoring IS
'Vue de monitoring pour surveiller l''état de la file d''attente d''emails';

-- ============================================================================
-- ÉTAPE 6 : FONCTION DE DIAGNOSTIC
-- ============================================================================

CREATE OR REPLACE FUNCTION diagnose_email_queue()
RETURNS TABLE(
  metric TEXT,
  count BIGINT,
  details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Total emails en attente'::TEXT,
    COUNT(*)::BIGINT,
    'Emails avec status = pending'::TEXT
  FROM email_queue
  WHERE status = 'pending';

  RETURN QUERY
  SELECT 
    'Emails prêts à envoyer'::TEXT,
    COUNT(*)::BIGINT,
    'Emails pending et scheduled_for <= now()'::TEXT
  FROM email_queue
  WHERE status = 'pending' AND scheduled_for <= now();

  RETURN QUERY
  SELECT 
    'Emails envoyés (dernières 24h)'::TEXT,
    COUNT(*)::BIGINT,
    'Emails sent dans les 24 dernières heures'::TEXT
  FROM email_queue
  WHERE status = 'sent' AND processed_at > now() - interval '24 hours';

  RETURN QUERY
  SELECT 
    'Emails échoués (dernières 24h)'::TEXT,
    COUNT(*)::BIGINT,
    'Emails failed dans les 24 dernières heures'::TEXT
  FROM email_queue
  WHERE status = 'failed' AND processed_at > now() - interval '24 hours';

  RETURN QUERY
  SELECT 
    'Templates actifs'::TEXT,
    COUNT(*)::BIGINT,
    'Templates email avec is_active = true'::TEXT
  FROM email_templates
  WHERE is_active = true;

  RETURN QUERY
  SELECT 
    'Triggers actifs'::TEXT,
    COUNT(*)::BIGINT,
    'Triggers liés aux emails'::TEXT
  FROM pg_trigger
  WHERE tgname LIKE '%email%' OR tgname LIKE '%welcome%' OR tgname LIKE '%application%';
END;
$$;

COMMENT ON FUNCTION diagnose_email_queue IS
'Fonction de diagnostic pour vérifier l''état du système d''emails';
