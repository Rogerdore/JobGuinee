-- ============================================================
-- Migration: Fix RPC parameter gaps + add event_id to all paths
-- Safe, additive — all functions use CREATE OR REPLACE
-- ============================================================


-- ============================================================
-- 1. queue_email: add p_event_id + p_entity_id support
-- ============================================================

CREATE OR REPLACE FUNCTION queue_email(
  p_template_key text,
  p_to_email text,
  p_to_name text DEFAULT NULL,
  p_variables jsonb DEFAULT '{}'::jsonb,
  p_priority integer DEFAULT 5,
  p_scheduled_for timestamptz DEFAULT now(),
  p_user_id uuid DEFAULT NULL,
  p_job_id uuid DEFAULT NULL,
  p_event_id text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template_id uuid;
  v_queue_id uuid;
BEGIN
  SELECT id INTO v_template_id
  FROM email_templates
  WHERE template_key = p_template_key
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Template not found: ' || p_template_key
    );
  END IF;

  INSERT INTO email_queue (
    template_id, to_email, to_name, template_variables,
    priority, scheduled_for, user_id, job_id,
    event_id, entity_id
  ) VALUES (
    v_template_id, p_to_email, p_to_name, p_variables,
    p_priority, p_scheduled_for,
    COALESCE(p_user_id, auth.uid()), p_job_id,
    p_event_id, p_entity_id
  )
  ON CONFLICT (event_id, to_email) WHERE event_id IS NOT NULL AND status IN ('pending', 'processing', 'sent')
  DO NOTHING
  RETURNING id INTO v_queue_id;

  IF v_queue_id IS NULL AND p_event_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'deduplicated');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'queue_id', v_queue_id
  );
END;
$$;


-- ============================================================
-- 2. enqueue_email: add p_event_id + p_entity_id support
-- ============================================================

CREATE OR REPLACE FUNCTION enqueue_email(
  p_template_key TEXT,
  p_to_email TEXT,
  p_to_name TEXT DEFAULT NULL,
  p_variables JSONB DEFAULT '{}'::jsonb,
  p_priority INTEGER DEFAULT 5,
  p_scheduled_for TIMESTAMPTZ DEFAULT now(),
  p_user_id UUID DEFAULT NULL,
  p_job_id UUID DEFAULT NULL,
  p_event_id TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL
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
  SELECT id INTO v_template_id
  FROM email_templates
  WHERE template_key = p_template_key
    AND is_active = true
  LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE WARNING 'Template email introuvable ou inactif: %', p_template_key;
    RETURN NULL;
  END IF;

  IF p_to_email IS NULL OR p_to_email = '' THEN
    RAISE WARNING 'Email destinataire vide pour template: %', p_template_key;
    RETURN NULL;
  END IF;

  INSERT INTO email_queue (
    template_id, to_email, to_name, template_variables,
    priority, scheduled_for, status, retry_count,
    user_id, job_id, event_id, entity_id
  ) VALUES (
    v_template_id, p_to_email, p_to_name, p_variables,
    p_priority, p_scheduled_for, 'pending', 0,
    p_user_id, p_job_id, p_event_id, p_entity_id
  )
  ON CONFLICT (event_id, to_email) WHERE event_id IS NOT NULL AND status IN ('pending', 'processing', 'sent')
  DO NOTHING
  RETURNING id INTO v_queue_id;

  RETURN v_queue_id;

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur enqueue_email: template=%, email=%, erreur=%',
    p_template_key, p_to_email, SQLERRM;
  RETURN NULL;
END;
$$;


-- ============================================================
-- 3. queue_email_for_event: auto-generate event_id
-- ============================================================

CREATE OR REPLACE FUNCTION queue_email_for_event(
  p_event_key    text,
  p_template_key text,
  p_to_email     text,
  p_to_name      text,
  p_variables    jsonb    DEFAULT '{}',
  p_user_id      uuid     DEFAULT NULL,
  p_job_id       uuid     DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template_id uuid;
  v_queue_id    uuid;
  v_event       email_event_settings%ROWTYPE;
  v_event_id    text;
BEGIN
  SELECT * INTO v_event
  FROM email_event_settings
  WHERE event_key = p_event_key;

  IF NOT FOUND OR NOT v_event.is_enabled THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_template_id
  FROM email_templates
  WHERE template_key = p_template_key
    AND is_active = true
  LIMIT 1;

  IF v_template_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Auto-generate deterministic event_id for deduplication
  -- Format: event_key + user_id (or email hash) + job_id + date
  v_event_id := p_event_key || '_' || COALESCE(p_user_id::text, md5(p_to_email));
  IF p_job_id IS NOT NULL THEN
    v_event_id := v_event_id || '_' || p_job_id::text;
  END IF;
  -- Add date component to allow re-sending on different days
  v_event_id := v_event_id || '_' || to_char(now(), 'YYYYMMDD');

  INSERT INTO email_queue (
    template_id, to_email, to_name, template_variables,
    priority, scheduled_for, status,
    user_id, job_id, event_id, entity_id
  ) VALUES (
    v_template_id, p_to_email, p_to_name, p_variables,
    v_event.priority,
    now() + (v_event.delay_minutes * INTERVAL '1 minute'),
    'pending',
    p_user_id, p_job_id, v_event_id, COALESCE(p_job_id, p_user_id)
  )
  ON CONFLICT (event_id, to_email) WHERE event_id IS NOT NULL AND status IN ('pending', 'processing', 'sent')
  DO NOTHING
  RETURNING id INTO v_queue_id;

  RETURN v_queue_id;
END;
$$;


-- ============================================================
-- 4. queue_raw_email: for TS services that send raw HTML
--    (notificationService, communicationService)
--    Inserts without template_id — process-email-queue reads
--    _raw_* keys from template_variables
-- ============================================================

CREATE OR REPLACE FUNCTION queue_raw_email(
  p_to_email TEXT,
  p_to_name TEXT DEFAULT NULL,
  p_subject TEXT DEFAULT '',
  p_html_body TEXT DEFAULT '',
  p_text_body TEXT DEFAULT '',
  p_template_key TEXT DEFAULT 'raw_email',
  p_priority INTEGER DEFAULT 5,
  p_scheduled_for TIMESTAMPTZ DEFAULT now(),
  p_user_id UUID DEFAULT NULL,
  p_job_id UUID DEFAULT NULL,
  p_event_id TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_queue_id UUID;
  v_rate_limited BOOLEAN;
BEGIN
  -- Rate limit check
  v_rate_limited := public.check_email_rate_limit(p_to_email, p_template_key);
  IF v_rate_limited THEN
    INSERT INTO email_events (event_type, recipient_email, template_key, status, metadata)
    VALUES ('rate_limited', p_to_email, p_template_key, 'blocked',
            jsonb_build_object('reason', 'rate_limit_exceeded', 'event_id', p_event_id));
    RETURN jsonb_build_object('success', false, 'reason', 'rate_limited');
  END IF;

  INSERT INTO email_queue (
    template_id, to_email, to_name,
    template_variables, priority, scheduled_for,
    status, user_id, job_id, event_id, entity_id
  ) VALUES (
    NULL, -- no template — process-email-queue reads _raw_* keys
    p_to_email, p_to_name,
    jsonb_build_object(
      '_raw_subject', p_subject,
      '_raw_html_body', p_html_body,
      '_raw_text_body', p_text_body,
      '_template_key', p_template_key
    ),
    p_priority, p_scheduled_for,
    'pending', p_user_id, p_job_id, p_event_id, p_entity_id
  )
  ON CONFLICT (event_id, to_email) WHERE event_id IS NOT NULL AND status IN ('pending', 'processing', 'sent')
  DO NOTHING
  RETURNING id INTO v_queue_id;

  IF v_queue_id IS NULL AND p_event_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'deduplicated');
  END IF;

  RETURN jsonb_build_object('success', true, 'queue_id', v_queue_id);
END;
$$;

REVOKE ALL ON FUNCTION public.queue_raw_email FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.queue_raw_email TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_raw_email TO authenticated;


-- ============================================================
-- 5. Update trigger_application_confirmation_email with event_id
-- ============================================================

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
  SELECT p.email, p.full_name
  INTO v_candidate_email, v_candidate_name
  FROM profiles p
  WHERE p.id = NEW.candidate_id;

  SELECT j.title, c.name
  INTO v_job_title, v_company_name
  FROM jobs j
  LEFT JOIN companies c ON j.company_id = c.id
  WHERE j.id = NEW.job_id;

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
    p_priority := 2,
    p_user_id := NEW.candidate_id,
    p_job_id := NEW.job_id,
    p_event_id := 'application_confirmation_' || NEW.id::text,
    p_entity_id := NEW.id
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur trigger_application_confirmation_email: %', SQLERRM;
  RETURN NEW;
END;
$$;


-- ============================================================
-- 6. Update trigger_recruiter_new_application_alert with event_id
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_recruiter_new_application_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_application_email TEXT;
  v_recruiter_email TEXT;
  v_recruiter_name TEXT;
  v_candidate_name TEXT;
  v_job_title TEXT;
  v_final_email TEXT;
BEGIN
  -- Get application_email from job + recruiter profile info
  SELECT j.application_email, p.email, p.full_name
  INTO v_application_email, v_recruiter_email, v_recruiter_name
  FROM jobs j
  JOIN profiles p ON j.recruiter_id = p.id
  WHERE j.id = NEW.job_id;

  -- Priority: application_email (set by recruiter in job form) > profiles.email (account email)
  v_final_email := COALESCE(NULLIF(TRIM(v_application_email), ''), v_recruiter_email);

  SELECT p.full_name
  INTO v_candidate_name
  FROM profiles p
  WHERE p.id = NEW.candidate_id;

  SELECT title INTO v_job_title FROM jobs WHERE id = NEW.job_id;

  PERFORM enqueue_email(
    p_template_key := 'new_application_alert',
    p_to_email := v_final_email,
    p_to_name := v_recruiter_name,
    p_variables := jsonb_build_object(
      'recruiter_name', v_recruiter_name,
      'candidate_name', v_candidate_name,
      'job_title', v_job_title,
      'application_reference', NEW.reference_number,
      'app_url', 'https://jobguinee-pro.com'
    ),
    p_priority := 3,
    p_job_id := NEW.job_id,
    p_event_id := 'recruiter_alert_' || NEW.id::text,
    p_entity_id := NEW.id
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur trigger_recruiter_new_application_alert: %', SQLERRM;
  RETURN NEW;
END;
$$;


-- ============================================================
-- 7. Update send_interview_email_trigger_fn with event_id
--    Uses queue_email_for_event (which auto-generates event_id now)
--    No code change needed — the updated queue_email_for_event handles it
-- ============================================================
-- (Already handled by the updated queue_email_for_event above)


-- ============================================================
-- 8. Fix priorities: lower = more urgent (1=critical, 5=default)
--    Update existing triggers that used inverted priority scale
-- ============================================================
-- application_confirmation: 8 → 2 (important transactional)
-- recruiter_alert: 7 → 3 (important but not critical)
-- These are already fixed in the trigger functions above.
-- email_event_settings priorities are managed by admins via UI.
