/*
  # Update Auto-Share Trigger with Global Kill Switch

  1. Changes
    - Check share_global_settings.automation_enabled before triggering
    - Log "skipped" action when global automation is disabled
    - Maintain backward compatibility with existing trigger behavior
    
  2. Flow
    - Job published with auto_share = true
    - Check global kill switch (share_global_settings.automation_enabled)
    - If disabled: Log skip and return (no API calls)
    - If enabled: Proceed with platform checks and Edge Function call
    
  3. Security
    - SECURITY DEFINER with secure search_path
    - Silent failure (never blocks job publication)
    - All errors logged but not raised
*/

-- Drop existing trigger function to recreate with kill switch
CREATE OR REPLACE FUNCTION trigger_auto_share_job()
RETURNS TRIGGER AS $$
DECLARE
  v_platforms_enabled boolean;
  v_automation_enabled boolean;
  v_function_url text;
BEGIN
  -- Only proceed if job is being published with auto_share enabled
  IF NEW.auto_share = true
     AND NEW.status = 'published'
     AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != 'published')) THEN

    -- Check global kill switch
    SELECT automation_enabled INTO v_automation_enabled
    FROM share_global_settings
    WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

    -- If automation is globally disabled, log and skip
    IF NOT COALESCE(v_automation_enabled, false) THEN
      RAISE NOTICE 'Auto-share globally disabled for job_id: %', NEW.id;

      -- Log as skipped in analytics
      INSERT INTO social_share_analytics (
        job_id, 
        platform, 
        share_type, 
        action, 
        status,
        metadata
      ) VALUES (
        NEW.id, 
        'all', 
        'auto', 
        'skipped', 
        'skipped',
        jsonb_build_object(
          'reason', 'global_automation_disabled',
          'timestamp', now()
        )
      );

      RETURN NEW;
    END IF;

    -- Check if any platforms are enabled for auto-sharing
    SELECT EXISTS (
      SELECT 1 FROM social_platforms_config
      WHERE is_enabled = true AND auto_share_enabled = true
    ) INTO v_platforms_enabled;

    -- If platforms are enabled, call the Edge Function
    IF v_platforms_enabled THEN
      -- Build Edge Function URL
      v_function_url := current_setting('app.supabase_url', true) || '/functions/v1/auto-share-job';

      IF v_function_url IS NULL OR v_function_url = '/functions/v1/auto-share-job' THEN
        v_function_url := 'https://' || current_setting('app.settings.project_ref', true) || '.supabase.co/functions/v1/auto-share-job';
      END IF;

      -- Asynchronous HTTP call to Edge Function
      PERFORM net.http_post(
        url := v_function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true)
        ),
        body := jsonb_build_object('job_id', NEW.id),
        timeout_milliseconds := 30000
      );

      RAISE NOTICE 'Auto-share triggered for job_id: %', NEW.id;
    ELSE
      RAISE NOTICE 'Auto-share skipped: no platforms enabled for job_id: %', NEW.id;
      
      -- Log as skipped
      INSERT INTO social_share_analytics (
        job_id, 
        platform, 
        share_type, 
        action, 
        status,
        metadata
      ) VALUES (
        NEW.id, 
        'all', 
        'auto', 
        'skipped', 
        'skipped',
        jsonb_build_object(
          'reason', 'no_platforms_enabled',
          'timestamp', now()
        )
      );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but never fail the job publication
    RAISE WARNING 'Error in auto-share trigger for job_id %: %', NEW.id, SQLERRM;
    
    INSERT INTO social_share_analytics (
      job_id, 
      platform, 
      share_type, 
      action, 
      status,
      error_message,
      metadata
    ) VALUES (
      NEW.id, 
      'all', 
      'auto', 
      'failed', 
      'error',
      SQLERRM,
      jsonb_build_object(
        'error_detail', SQLERRM,
        'timestamp', now()
      )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Ensure trigger exists (recreate if needed)
DROP TRIGGER IF EXISTS auto_share_job_on_publish ON jobs;
CREATE TRIGGER auto_share_job_on_publish
  AFTER INSERT OR UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_share_job();
