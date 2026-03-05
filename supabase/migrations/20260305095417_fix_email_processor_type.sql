/*
  # Fix email processor to use correct email type

  Purpose: Change email_type from 'welcome' to 'custom' to match constraint
*/

DROP FUNCTION IF EXISTS process_pending_emails();

CREATE OR REPLACE FUNCTION process_pending_emails()
RETURNS TABLE (
  processed_count integer,
  sent_count integer,
  failed_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email RECORD;
  v_template RECORD;
  v_processed integer := 0;
  v_sent integer := 0;
  v_failed integer := 0;
BEGIN
  FOR v_email IN 
    SELECT * FROM email_queue
    WHERE status = 'pending'
    AND scheduled_for <= now()
    ORDER BY priority DESC, created_at ASC
    LIMIT 10
  LOOP
    BEGIN
      v_processed := v_processed + 1;
      
      SELECT * INTO v_template
      FROM email_templates
      WHERE id = v_email.template_id;
      
      IF v_template.id IS NULL THEN
        UPDATE email_queue
        SET status = 'failed',
            error_message = 'Template not found',
            retry_count = retry_count + 1,
            processed_at = now()
        WHERE id = v_email.id;
        
        v_failed := v_failed + 1;
        CONTINUE;
      END IF;
      
      PERFORM net.http_post(
        url := 'https://cebahbvlhvmdbqazhhru.supabase.co/functions/v1/send-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlYmFoYnZsaHZtZGJxYXpoaHJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzAzNTczOCwiZXhwIjoyMDUyNjExNzM4fQ.ppmBUExOwOlSB2Xzj6l2Czi9k1IcZtaHKgMBLrmT3ag'
        ),
        body := jsonb_build_object(
          'to', v_email.to_email,
          'toName', v_email.to_name,
          'subject', v_template.subject,
          'htmlBody', v_template.html_body,
          'textBody', v_template.text_body
        )
      );
      
      UPDATE email_queue
      SET status = 'sent',
          processed_at = now()
      WHERE id = v_email.id;
      
      INSERT INTO email_logs (
        recipient_email,
        recipient_id,
        email_type,
        template_code,
        subject,
        body_text,
        body_html,
        provider,
        status,
        sent_at
      ) VALUES (
        v_email.to_email,
        v_email.user_id,
        'custom',
        v_template.template_key,
        v_template.subject,
        v_template.text_body,
        v_template.html_body,
        'hostinger',
        'sent',
        now()
      );
      
      v_sent := v_sent + 1;
      
    EXCEPTION WHEN OTHERS THEN
      UPDATE email_queue
      SET status = 'failed',
          error_message = SQLERRM,
          retry_count = retry_count + 1,
          processed_at = now()
      WHERE id = v_email.id;
      
      v_failed := v_failed + 1;
    END;
  END LOOP;
  
  RETURN QUERY SELECT v_processed, v_sent, v_failed;
END;
$$;

-- Reset failed emails to pending for retry
UPDATE email_queue
SET status = 'pending',
    retry_count = 0,
    error_message = NULL,
    processed_at = NULL
WHERE status = 'failed'
AND retry_count < 3;
