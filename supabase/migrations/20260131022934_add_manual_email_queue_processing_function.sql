/*
  # Ajouter fonction de traitement manuel de la queue email

  1. Nouvelle Fonction
    - process_pending_emails() : Traite les emails en attente dans la queue
    - Peut être appelée manuellement ou via cron
    - Limite de 50 emails par exécution pour éviter les timeouts

  2. Utilisation
    - Manuelle : SELECT process_pending_emails();
    - Via cron : Appeler périodiquement (toutes les minutes par exemple)
*/

CREATE OR REPLACE FUNCTION process_pending_emails()
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_processed_count int := 0;
  v_email record;
BEGIN
  -- Traiter les emails en attente (max 50 par exécution)
  FOR v_email IN
    SELECT 
      eq.*,
      et.template_key,
      et.subject,
      et.html_body,
      et.text_body
    FROM email_queue eq
    JOIN email_templates et ON eq.template_id = et.id
    WHERE eq.status = 'pending'
    AND eq.scheduled_for <= now()
    ORDER BY eq.priority DESC, eq.scheduled_for ASC
    LIMIT 50
  LOOP
    -- Marquer comme en traitement
    UPDATE email_queue
    SET status = 'processing'
    WHERE id = v_email.id;

    -- Note: L'envoi réel se fait via l'Edge Function send-email
    -- Ici on marque juste comme "ready" pour être traité par l'Edge Function
    -- L'Edge Function sera appelée par process-email-queue

    v_processed_count := v_processed_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'processed', v_processed_count,
    'message', format('%s emails marqués pour traitement', v_processed_count)
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Créer une vue pour surveiller la queue email
CREATE OR REPLACE VIEW email_queue_stats AS
SELECT
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM email_queue
GROUP BY status;

COMMENT ON FUNCTION process_pending_emails() IS
'Marque les emails en attente pour traitement. Utilisé en conjonction avec l''Edge Function process-email-queue.';

COMMENT ON VIEW email_queue_stats IS
'Statistiques de la queue email pour monitoring';
