/*
  # Ajouter les triggers automatiques pour tous les événements

  1. Nouveaux Triggers
    - Confirmation candidature (candidat)
    - Alerte nouvelle candidature (recruteur)
    - Alertes emploi (candidats avec alertes actives)
    - Notification changement statut candidature

  2. Fonctionnement
    - Tous les emails sont ajoutés à email_queue automatiquement
    - La fonction process-email-queue les traite ensuite
    - Utilise les templates email_templates existants
*/

-- Fonction : Envoyer email de confirmation au candidat après candidature
CREATE OR REPLACE FUNCTION send_application_confirmation_email()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_candidate_email text;
  v_candidate_name text;
  v_job_title text;
  v_company_name text;
  v_template_id uuid;
BEGIN
  -- Récupérer les infos du candidat
  SELECT p.email, p.full_name
  INTO v_candidate_email, v_candidate_name
  FROM profiles p
  WHERE p.id = NEW.candidate_id;

  -- Récupérer les infos du job
  SELECT j.title, c.name
  INTO v_job_title, v_company_name
  FROM jobs j
  LEFT JOIN companies c ON j.company_id = c.id
  WHERE j.id = NEW.job_id;

  -- Trouver le template
  SELECT id INTO v_template_id
  FROM email_templates
  WHERE template_key = 'application_confirmation'
  AND is_active = true
  LIMIT 1;

  -- Ajouter à la queue si template existe
  IF v_template_id IS NOT NULL AND v_candidate_email IS NOT NULL THEN
    INSERT INTO email_queue (
      template_id,
      to_email,
      to_name,
      template_variables,
      priority,
      scheduled_for,
      user_id,
      job_id
    ) VALUES (
      v_template_id,
      v_candidate_email,
      v_candidate_name,
      jsonb_build_object(
        'candidate_name', v_candidate_name,
        'job_title', v_job_title,
        'company_name', COALESCE(v_company_name, 'l''entreprise'),
        'application_reference', NEW.reference_number,
        'app_url', 'https://jobguinee-pro.com'
      ),
      8,
      now(),
      NEW.candidate_id,
      NEW.job_id
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur email confirmation candidature: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Fonction : Alerter le recruteur d'une nouvelle candidature
CREATE OR REPLACE FUNCTION send_new_application_alert_to_recruiter()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_recruiter_email text;
  v_recruiter_name text;
  v_candidate_name text;
  v_job_title text;
  v_template_id uuid;
BEGIN
  -- Récupérer les infos du recruteur via le job
  SELECT p.email, p.full_name
  INTO v_recruiter_email, v_recruiter_name
  FROM jobs j
  JOIN profiles p ON j.recruiter_id = p.id
  WHERE j.id = NEW.job_id;

  -- Récupérer les infos du candidat
  SELECT p.full_name
  INTO v_candidate_name
  FROM profiles p
  WHERE p.id = NEW.candidate_id;

  -- Récupérer le titre du job
  SELECT title
  INTO v_job_title
  FROM jobs
  WHERE id = NEW.job_id;

  -- Trouver le template
  SELECT id INTO v_template_id
  FROM email_templates
  WHERE template_key = 'new_application_alert'
  AND is_active = true
  LIMIT 1;

  -- Ajouter à la queue si template existe
  IF v_template_id IS NOT NULL AND v_recruiter_email IS NOT NULL THEN
    INSERT INTO email_queue (
      template_id,
      to_email,
      to_name,
      template_variables,
      priority,
      scheduled_for,
      user_id,
      job_id
    ) VALUES (
      v_template_id,
      v_recruiter_email,
      v_recruiter_name,
      jsonb_build_object(
        'recruiter_name', v_recruiter_name,
        'candidate_name', v_candidate_name,
        'job_title', v_job_title,
        'application_reference', NEW.reference_number,
        'app_url', 'https://jobguinee-pro.com'
      ),
      7,
      now(),
      NULL,
      NEW.job_id
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur email alerte recruteur: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Fonction : Envoyer alertes emploi aux candidats avec alertes actives
CREATE OR REPLACE FUNCTION send_job_alerts_to_matching_candidates()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_alert record;
  v_template_id uuid;
  v_company_name text;
BEGIN
  -- Ne traiter que les nouveaux jobs publiés (status=published)
  IF NEW.status != 'published' THEN
    RETURN NEW;
  END IF;

  -- Récupérer le nom de la compagnie
  SELECT name INTO v_company_name
  FROM companies
  WHERE id = NEW.company_id;

  -- Trouver le template
  SELECT id INTO v_template_id
  FROM email_templates
  WHERE template_key = 'job_alert_match'
  AND is_active = true
  LIMIT 1;

  -- Trouver les candidats avec alertes actives qui correspondent
  IF v_template_id IS NOT NULL THEN
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
      -- Ajouter à la queue pour chaque candidat
      INSERT INTO email_queue (
        template_id,
        to_email,
        to_name,
        template_variables,
        priority,
        scheduled_for,
        user_id,
        job_id
      ) VALUES (
        v_template_id,
        v_alert.email,
        v_alert.full_name,
        jsonb_build_object(
          'candidate_name', v_alert.full_name,
          'job_title', NEW.title,
          'company_name', COALESCE(v_company_name, 'l''entreprise'),
          'location', NEW.location,
          'job_type', NEW.job_type,
          'salary_range', COALESCE(NEW.salary_range, 'Non spécifié'),
          'app_url', 'https://jobguinee-pro.com',
          'job_url', 'https://jobguinee-pro.com/jobs/' || NEW.id
        ),
        5,
        now() + interval '5 minutes',
        v_alert.user_id,
        NEW.id
      );

      -- Mettre à jour la dernière alerte envoyée
      UPDATE job_alerts
      SET last_triggered_at = now()
      WHERE id = v_alert.alert_id;
    END LOOP;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur envoi alertes emploi: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Créer les triggers

-- 1. Email confirmation candidature (au candidat)
DROP TRIGGER IF EXISTS send_application_confirmation_trigger ON applications;
CREATE TRIGGER send_application_confirmation_trigger
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION send_application_confirmation_email();

-- 2. Email alerte nouvelle candidature (au recruteur)
DROP TRIGGER IF EXISTS send_recruiter_alert_trigger ON applications;
CREATE TRIGGER send_recruiter_alert_trigger
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION send_new_application_alert_to_recruiter();

-- 3. Alertes emploi (aux candidats avec alertes actives)
DROP TRIGGER IF EXISTS send_job_alerts_trigger ON jobs;
CREATE TRIGGER send_job_alerts_trigger
  AFTER INSERT OR UPDATE OF status ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION send_job_alerts_to_matching_candidates();

-- Commentaires
COMMENT ON FUNCTION send_application_confirmation_email() IS
'Envoie automatiquement un email de confirmation au candidat après une candidature';

COMMENT ON FUNCTION send_new_application_alert_to_recruiter() IS
'Envoie automatiquement un email d''alerte au recruteur lors d''une nouvelle candidature';

COMMENT ON FUNCTION send_job_alerts_to_matching_candidates() IS
'Envoie automatiquement des alertes emploi aux candidats avec alertes actives correspondantes';
