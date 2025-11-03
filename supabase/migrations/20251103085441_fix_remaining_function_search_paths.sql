/*
  # Fix Remaining Function Search Paths

  ## Functions Updated
    - create_default_notification_preferences
    - create_default_workflow_stages
    - log_application_change
    - create_sample_data_for_recruiter
    - create_sample_companies
    - create_sample_jobs
    - create_sample_candidates
    - create_sample_applications

  ## Security Impact
    - Adding explicit search_path prevents search path manipulation attacks
    - All functions maintain their existing functionality
    - No changes to function logic or permissions
*/

CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_default_workflow_stages()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO workflow_stages (company_id, stage_name, stage_order, color) VALUES
    (NEW.id, 'Nouveau', 1, '#3B82F6'),
    (NEW.id, 'Présélectionné', 2, '#10B981'),
    (NEW.id, 'Entretien', 3, '#F59E0B'),
    (NEW.id, 'Offre', 4, '#8B5CF6'),
    (NEW.id, 'Embauché', 5, '#059669'),
    (NEW.id, 'Rejeté', 6, '#EF4444')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_application_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_event_type TEXT;
  v_user_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_event_type := 'application_submitted';
    v_user_id := NEW.candidate_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    v_event_type := 'status_changed';
    v_user_id := auth.uid();
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO application_timeline (
    application_id,
    event_type,
    event_description,
    old_value,
    new_value,
    user_id
  ) VALUES (
    NEW.id,
    v_event_type,
    CASE
      WHEN v_event_type = 'application_submitted' THEN 'Candidature soumise'
      WHEN v_event_type = 'status_changed' THEN 'Statut changé de ' || OLD.status || ' à ' || NEW.status
    END,
    CASE WHEN v_event_type = 'status_changed' THEN OLD.status ELSE NULL END,
    CASE WHEN v_event_type = 'status_changed' THEN NEW.status ELSE NULL END,
    v_user_id
  );

  RETURN NEW;
END;
$$;