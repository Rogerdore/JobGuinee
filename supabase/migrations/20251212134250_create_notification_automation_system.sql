/*
  # Create Notification and Communication Automation System

  ## Overview
  Système complet d'automation pour:
  - Envoyer des notifications automatiques lors des changements d'étape pipeline
  - Générer des communications automatiques (templates)
  - Tracker toutes les communications

  ## 1. Functions

  ### `send_automatic_communication`
  Envoie automatiquement une communication basée sur un template lors d'un événement

  ### `trigger_interview_notifications`
  Fonction trigger qui envoie des notifications lors de la création/modification d'entretien

  ### `trigger_pipeline_communications`
  Fonction trigger qui envoie des communications lors des changements d'étape pipeline

  ## 2. Tables Extensions
  
  Ajoute champs automation aux tables existantes

  ## 3. Security
  Toutes les fonctions utilisent SECURITY DEFINER pour fonctionner en arrière-plan
*/

-- ============================================================================
-- 1. FUNCTION: Send Automatic Communication
-- ============================================================================

CREATE OR REPLACE FUNCTION public.send_automatic_communication(
  p_application_id uuid,
  p_recipient_id uuid,
  p_template_type text,
  p_variables jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template communication_templates%ROWTYPE;
  v_sender_id uuid;
  v_subject text;
  v_body text;
  v_key text;
  v_value text;
BEGIN
  -- Get system template
  SELECT * INTO v_template
  FROM communication_templates
  WHERE template_type = p_template_type
    AND is_system = true
    AND is_active = true
  LIMIT 1;

  IF v_template.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Template not found'
    );
  END IF;

  -- Get recruiter/sender from application
  SELECT j.company_id INTO v_sender_id
  FROM applications a
  JOIN jobs j ON j.id = a.job_id
  JOIN companies c ON c.id = j.company_id
  WHERE a.id = p_application_id;

  -- Process template with variables
  v_subject := v_template.subject;
  v_body := v_template.body;

  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_variables)
  LOOP
    v_subject := REPLACE(v_subject, '{{' || v_key || '}}', v_value);
    v_body := REPLACE(v_body, '{{' || v_key || '}}', v_value);
  END LOOP;

  -- Insert communication log
  INSERT INTO communications_log (
    application_id,
    sender_id,
    recipient_id,
    communication_type,
    channel,
    subject,
    message,
    status,
    metadata
  ) VALUES (
    p_application_id,
    COALESCE(v_sender_id, p_recipient_id),
    p_recipient_id,
    p_template_type,
    'notification',
    v_subject,
    v_body,
    'sent',
    jsonb_build_object('auto_generated', true, 'template_id', v_template.id)
  );

  -- Create notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    link
  ) VALUES (
    p_recipient_id,
    CASE 
      WHEN p_template_type = 'rejection' THEN 'warning'
      WHEN p_template_type = 'selection' THEN 'success'
      ELSE 'info'
    END,
    v_subject,
    LEFT(v_body, 200),
    '/candidate-dashboard'
  );

  RETURN jsonb_build_object(
    'success', true,
    'subject', v_subject
  );
END;
$$;

-- ============================================================================
-- 2. TRIGGER: Interview Notifications
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_interview_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_title text;
  v_candidate_name text;
  v_company_name text;
BEGIN
  -- Get related info
  SELECT j.title, p.full_name, c.name
  INTO v_job_title, v_candidate_name, v_company_name
  FROM jobs j
  JOIN applications a ON a.job_id = j.id
  JOIN profiles p ON p.id = NEW.candidate_id
  JOIN companies c ON c.id = NEW.company_id
  WHERE j.id = NEW.job_id
  LIMIT 1;

  -- On INSERT: Interview invitation
  IF TG_OP = 'INSERT' THEN
    PERFORM send_automatic_communication(
      NEW.application_id,
      NEW.candidate_id,
      'interview_invitation',
      jsonb_build_object(
        'candidate_name', v_candidate_name,
        'job_title', v_job_title,
        'interview_date', TO_CHAR(NEW.scheduled_at, 'DD/MM/YYYY'),
        'interview_time', TO_CHAR(NEW.scheduled_at, 'HH24:MI'),
        'interview_type', NEW.interview_type,
        'interview_link', CASE WHEN NEW.interview_type = 'visio' THEN NEW.location_or_link ELSE '' END,
        'interview_location', CASE WHEN NEW.interview_type = 'presentiel' THEN NEW.location_or_link ELSE '' END,
        'company_name', v_company_name
      )
    );
  END IF;

  -- On UPDATE: Status changes
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    IF NEW.status = 'cancelled' THEN
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (
        NEW.candidate_id,
        'warning',
        'Entretien annulé',
        'Votre entretien pour ' || v_job_title || ' a été annulé. Le recruteur vous contactera.',
        '/candidate-dashboard'
      );
    ELSIF NEW.status = 'confirmed' THEN
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (
        NEW.candidate_id,
        'success',
        'Entretien confirmé',
        'Votre entretien pour ' || v_job_title || ' est confirmé le ' || TO_CHAR(NEW.scheduled_at, 'DD/MM/YYYY à HH24:MI'),
        '/candidate-dashboard'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_interview_notifications_insert ON interviews;
DROP TRIGGER IF EXISTS trigger_interview_notifications_update ON interviews;

-- Create triggers
CREATE TRIGGER trigger_interview_notifications_insert
  AFTER INSERT ON interviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_interview_notifications();

CREATE TRIGGER trigger_interview_notifications_update
  AFTER UPDATE ON interviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_interview_notifications();

-- ============================================================================
-- 3. TRIGGER: Pipeline Stage Communications
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_pipeline_communications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_title text;
  v_candidate_name text;
  v_candidate_id uuid;
BEGIN
  -- Only trigger on stage change
  IF TG_OP = 'UPDATE' AND OLD.workflow_stage != NEW.workflow_stage THEN
    -- Get related info
    SELECT j.title, p.full_name, a.candidate_id
    INTO v_job_title, v_candidate_name, v_candidate_id
    FROM jobs j
    JOIN applications a ON a.id = NEW.id
    JOIN candidate_profiles cp ON cp.profile_id = a.candidate_id
    JOIN profiles p ON p.id = cp.profile_id
    WHERE j.id = NEW.job_id
    LIMIT 1;

    -- Send communication based on stage
    CASE NEW.workflow_stage
      WHEN 'Rejetées' THEN
        PERFORM send_automatic_communication(
          NEW.id,
          v_candidate_id,
          'rejection',
          jsonb_build_object(
            'candidate_name', v_candidate_name,
            'job_title', v_job_title
          )
        );

      WHEN 'Acceptées' THEN
        PERFORM send_automatic_communication(
          NEW.id,
          v_candidate_id,
          'selection',
          jsonb_build_object(
            'candidate_name', v_candidate_name,
            'job_title', v_job_title
          )
        );

      WHEN 'En attente' THEN
        PERFORM send_automatic_communication(
          NEW.id,
          v_candidate_id,
          'on_hold',
          jsonb_build_object(
            'candidate_name', v_candidate_name,
            'job_title', v_job_title
          )
        );

      ELSE
        -- For other stages, just notify without template
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (
          v_candidate_id,
          'info',
          'Mise à jour de votre candidature',
          'Votre candidature pour ' || v_job_title || ' a été mise à jour: ' || NEW.workflow_stage,
          '/candidate-dashboard'
        );
    END CASE;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_pipeline_communications_update ON applications;

-- Create trigger
CREATE TRIGGER trigger_pipeline_communications_update
  AFTER UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_pipeline_communications();

-- ============================================================================
-- 4. ADD INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_communications_log_auto_generated 
ON communications_log ((metadata->>'auto_generated'));

-- ============================================================================
-- 5. GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION send_automatic_communication TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_interview_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_pipeline_communications TO authenticated;