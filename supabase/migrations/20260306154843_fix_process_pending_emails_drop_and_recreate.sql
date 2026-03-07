/*
  # Fix process_pending_emails function

  ## Problems fixed
  1. Wrong Supabase project URL (was pointing to old project cebahbvlhvmdbqazhhru instead of current hhhjzgeidjqctuveopso)
  2. Template variables ({{user_name}}, {{confirmation_link}}, etc.) were never substituted before sending

  ## Solution
  - Drop and recreate the function with the correct URL and variable substitution logic
  - Variables from template_variables JSONB are now replaced in subject, html_body, and text_body
*/

DROP FUNCTION IF EXISTS process_pending_emails();

CREATE OR REPLACE FUNCTION process_pending_emails(
  OUT processed integer,
  OUT sent integer,
  OUT failed integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email RECORD;
  v_template RECORD;
  v_subject text;
  v_html_body text;
  v_text_body text;
  v_key text;
  v_value text;
BEGIN
  processed := 0;
  sent := 0;
  failed := 0;

  FOR v_email IN
    SELECT * FROM email_queue
    WHERE status = 'pending'
    AND scheduled_for <= now()
    ORDER BY priority DESC, created_at ASC
    LIMIT 10
  LOOP
    BEGIN
      processed := processed + 1;

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

        failed := failed + 1;
        CONTINUE;
      END IF;

      v_subject   := v_template.subject;
      v_html_body := COALESCE(v_template.html_body, '');
      v_text_body := COALESCE(v_template.text_body, '');

      IF v_email.template_variables IS NOT NULL THEN
        FOR v_key, v_value IN
          SELECT key, value::text
          FROM jsonb_each_text(v_email.template_variables)
        LOOP
          v_subject   := replace(v_subject,   '{{' || v_key || '}}', COALESCE(v_value, ''));
          v_html_body := replace(v_html_body, '{{' || v_key || '}}', COALESCE(v_value, ''));
          v_text_body := replace(v_text_body, '{{' || v_key || '}}', COALESCE(v_value, ''));
        END LOOP;
      END IF;

      IF v_email.to_name IS NOT NULL THEN
        v_subject   := replace(v_subject,   '{{to_name}}', v_email.to_name);
        v_html_body := replace(v_html_body, '{{to_name}}', v_email.to_name);
        v_text_body := replace(v_text_body, '{{to_name}}', v_email.to_name);
      END IF;

      PERFORM net.http_post(
        url := 'https://hhhjzgeidjqctuveopso.supabase.co/functions/v1/send-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
        ),
        body := jsonb_build_object(
          'to', v_email.to_email,
          'toName', v_email.to_name,
          'subject', v_subject,
          'htmlBody', v_html_body,
          'textBody', v_text_body
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
        v_subject,
        v_text_body,
        v_html_body,
        'sendgrid',
        'sent',
        now()
      );

      sent := sent + 1;

    EXCEPTION WHEN OTHERS THEN
      UPDATE email_queue
      SET status = 'failed',
          error_message = SQLERRM,
          retry_count = retry_count + 1,
          processed_at = now()
      WHERE id = v_email.id;

      failed := failed + 1;
    END;
  END LOOP;
END;
$$;
