/*
  # Update cron to use service role key

  Purpose: Use service role key for cron job authentication
  This ensures the edge function has proper permissions
*/

SELECT cron.unschedule('process_email_queue_job');

SELECT cron.schedule(
  'process_email_queue_job',
  '* * * * *',
  $$
    SELECT net.http_post(
      url := 'https://cebahbvlhvmdbqazhhru.supabase.co/functions/v1/process-email-queue',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlYmFoYnZsaHZtZGJxYXpoaHJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzAzNTczOCwiZXhwIjoyMDUyNjExNzM4fQ.ppmBUExOwOlSB2Xzj6l2Czi9k1IcZtaHKgMBLrmT3ag'
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 25000
    ) as request_id;
  $$
);
