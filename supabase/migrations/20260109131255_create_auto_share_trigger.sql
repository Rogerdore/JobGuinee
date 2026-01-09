/*
  # Auto-Share Trigger for Job Publications

  1. Enable pg_net Extension
    - Required for HTTP requests from PostgreSQL

  2. Trigger Function
    - Detects when a job is published with auto_share = true
    - Calls Edge Function to handle auto-sharing

  3. Trigger
    - Fires on INSERT or UPDATE of jobs table
    - Only when status changes to 'published' and auto_share is true
*/

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to trigger auto-share
CREATE OR REPLACE FUNCTION trigger_auto_share_job()
RETURNS TRIGGER AS $$
DECLARE
  v_platforms_enabled boolean;
  v_function_url text;
BEGIN
  IF NEW.auto_share = true
     AND NEW.status = 'published'
     AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != 'published')) THEN

    SELECT EXISTS (
      SELECT 1 FROM social_platforms_config
      WHERE is_enabled = true AND auto_share_enabled = true
    ) INTO v_platforms_enabled;

    IF v_platforms_enabled THEN
      v_function_url := current_setting('app.supabase_url', true) || '/functions/v1/auto-share-job';
      
      IF v_function_url IS NULL OR v_function_url = '/functions/v1/auto-share-job' THEN
        v_function_url := 'https://' || current_setting('app.settings.project_ref', true) || '.supabase.co/functions/v1/auto-share-job';
      END IF;

      PERFORM net.http_post(
        url := v_function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true)
        ),
        body := jsonb_build_object(
          'job_id', NEW.id
        ),
        timeout_milliseconds := 30000
      );

      RAISE NOTICE 'Auto-share triggered for job_id: %', NEW.id;
    ELSE
      RAISE NOTICE 'Auto-share skipped: no platforms enabled for job_id: %', NEW.id;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in auto-share trigger for job_id %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS auto_share_job_on_publish ON jobs;
CREATE TRIGGER auto_share_job_on_publish
  AFTER INSERT OR UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_share_job();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA extensions TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Comment
COMMENT ON FUNCTION trigger_auto_share_job() IS 'Automatically triggers social media sharing when a job is published with auto_share enabled';
COMMENT ON TRIGGER auto_share_job_on_publish ON jobs IS 'Fires when a job is published with auto_share=true to initiate social media posting';