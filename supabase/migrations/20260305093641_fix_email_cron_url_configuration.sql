/*
  # Fix email queue cron job URL configuration

  Purpose: Fix the cron job to use a proper method for calling the edge function
  The current implementation fails because app.supabase_url is not a valid config parameter
*/

-- Remove the old job
SELECT cron.unschedule('process_email_queue_job');

-- Get the project reference to build the URL
-- For Supabase, we need to use the project's actual URL
-- We'll use a direct approach with the edge function URL

SELECT cron.schedule(
  'process_email_queue_job',
  '* * * * *',
  $$
    SELECT net.http_post(
      url := 'https://cebahbvlhvmdbqazhhru.supabase.co/functions/v1/process-email-queue',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlYmFoYnZsaHZtZGJxYXpoaHJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwMzU3MzgsImV4cCI6MjA1MjYxMTczOH0.nIdOE2bx7M-5Rm8WVWX6vEzGw8FVfqEY-mSqZSPVPeg'
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 25000
    ) as request_id;
  $$
);
