/*
  # Fix Remaining Functions with Triggers

  ## Changes
    - Drop triggers before dropping functions
    - Recreate with proper search_path
*/

-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_increment_applications_count ON applications;
DROP TRIGGER IF EXISTS trigger_decrement_applications_count ON applications;
DROP TRIGGER IF EXISTS trigger_notify_job_alerts ON jobs;
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
DROP TRIGGER IF EXISTS trigger_create_conversation_participants ON conversations;

-- Drop and recreate functions
DROP FUNCTION IF EXISTS public.increment_job_applications_count() CASCADE;
CREATE FUNCTION public.increment_job_applications_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE jobs
  SET applications_count = COALESCE(applications_count, 0) + 1
  WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.decrement_job_applications_count() CASCADE;
CREATE FUNCTION public.decrement_job_applications_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE jobs
  SET applications_count = GREATEST(COALESCE(applications_count, 0) - 1, 0)
  WHERE id = OLD.job_id;
  RETURN OLD;
END;
$$;

DROP FUNCTION IF EXISTS public.update_conversation_last_message() CASCADE;
CREATE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100)
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.create_conversation_participants() CASCADE;
CREATE FUNCTION public.create_conversation_participants()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES 
    (NEW.id, NEW.participant_one_id),
    (NEW.id, NEW.participant_two_id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.notify_job_alerts() CASCADE;
CREATE FUNCTION public.notify_job_alerts()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'published' THEN
    PERFORM match_jobs_to_alerts(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER trigger_increment_applications_count
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION increment_job_applications_count();

CREATE TRIGGER trigger_decrement_applications_count
  AFTER DELETE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION decrement_job_applications_count();

CREATE TRIGGER trigger_notify_job_alerts
  AFTER INSERT OR UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION notify_job_alerts();

CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

CREATE TRIGGER trigger_create_conversation_participants
  AFTER INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION create_conversation_participants();

-- Fix other functions without triggers
DROP FUNCTION IF EXISTS public.recalculate_all_job_counters();
CREATE FUNCTION public.recalculate_all_job_counters()
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE jobs j
  SET applications_count = (
    SELECT COUNT(*)
    FROM applications a
    WHERE a.job_id = j.id
  );
END;
$$;

DROP FUNCTION IF EXISTS public.match_jobs_to_alerts(uuid);
CREATE FUNCTION public.match_jobs_to_alerts(p_job_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_job record;
  v_alert record;
BEGIN
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id;
  
  FOR v_alert IN
    SELECT DISTINCT ja.*
    FROM job_alerts ja
    WHERE ja.is_active = true
      AND (
        (ja.keywords IS NULL OR ja.keywords = '{}') OR
        (v_job.title ILIKE '%' || ANY(ja.keywords) || '%' OR
         v_job.description ILIKE '%' || ANY(ja.keywords) || '%')
      )
      AND (ja.location IS NULL OR v_job.location ILIKE '%' || ja.location || '%')
      AND (ja.contract_type IS NULL OR v_job.contract_type = ja.contract_type)
  LOOP
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      link
    ) VALUES (
      v_alert.user_id,
      'job_alert',
      'Nouvelle offre correspondante',
      'Une nouvelle offre correspond à vos alertes: ' || v_job.title,
      '/jobs/' || v_job.id
    );
    
    INSERT INTO job_alert_history (
      alert_id,
      job_id
    ) VALUES (
      v_alert.id,
      p_job_id
    );
  END LOOP;
END;
$$;

DROP FUNCTION IF EXISTS public.generate_cv_with_ai(uuid, jsonb);
CREATE FUNCTION public.generate_cv_with_ai(
  p_user_id uuid,
  p_profile_data jsonb
)
RETURNS uuid
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_doc_id uuid;
  v_cost bigint;
BEGIN
  SELECT credit_cost INTO v_cost
  FROM service_credit_costs
  WHERE service_type = 'cv_generation' AND is_active = true
  LIMIT 1;
  
  IF NOT use_credits_for_service(p_user_id, 'cv_generation', COALESCE(v_cost, 10000)) THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  INSERT INTO ai_generated_documents (
    user_id,
    document_type,
    title,
    status
  ) VALUES (
    p_user_id,
    'cv',
    'CV Généré par IA',
    'pending'
  ) RETURNING id INTO v_doc_id;
  
  RETURN v_doc_id;
END;
$$;

DROP FUNCTION IF EXISTS public.generate_cover_letter_with_ai(uuid, uuid, jsonb);
CREATE FUNCTION public.generate_cover_letter_with_ai(
  p_user_id uuid,
  p_job_id uuid,
  p_profile_data jsonb
)
RETURNS uuid
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_doc_id uuid;
  v_cost bigint;
BEGIN
  SELECT credit_cost INTO v_cost
  FROM service_credit_costs
  WHERE service_type = 'cover_letter_generation' AND is_active = true
  LIMIT 1;
  
  IF NOT use_credits_for_service(p_user_id, 'cover_letter_generation', COALESCE(v_cost, 5000)) THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  INSERT INTO ai_generated_documents (
    user_id,
    document_type,
    title,
    target_job_id,
    status
  ) VALUES (
    p_user_id,
    'cover_letter',
    'Lettre de Motivation Générée par IA',
    p_job_id,
    'pending'
  ) RETURNING id INTO v_doc_id;
  
  RETURN v_doc_id;
END;
$$;