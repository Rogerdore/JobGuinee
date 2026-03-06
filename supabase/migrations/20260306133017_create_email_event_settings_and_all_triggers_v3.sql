/*
  # Système de gestion des événements email avec activation/désactivation (v3)

  ## Adapté au schéma réel
  - email_queue: template_id + template_variables + scheduled_for + user_id + job_id
  - interview_reminders: déjà existante, utilise scheduled_at (pas scheduled_for)
  - daily_digest_log: déjà existante
  - Crée uniquement email_event_settings (nouvelle table)

  ## Ce que ce fichier crée
  1. Table email_event_settings avec données initiales pour 20 événements
  2. Fonction is_email_event_enabled()
  3. Fonction queue_email_for_event() — insère en queue conditionnellement
  4. Trigger interviews → email planifié/annulé/reprogrammé
  5. Trigger interviews → programmation des rappels (table interview_reminders existante)
  6. Fonction process_interview_reminders() — traite les rappels dus
  7. Trigger jobs → email clôture offre
  8. Trigger credit_purchases → email validation/rejet crédits
  9. Cron pour les rappels d'entretiens (toutes les 15 min)
*/

-- ============================================================
-- TABLE: email_event_settings (nouvelle)
-- ============================================================
CREATE TABLE IF NOT EXISTS email_event_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text UNIQUE NOT NULL,
  event_name text NOT NULL,
  event_description text,
  category text NOT NULL DEFAULT 'system',
  is_enabled boolean NOT NULL DEFAULT true,
  channels text[] NOT NULL DEFAULT ARRAY['email'],
  delay_minutes integer NOT NULL DEFAULT 0,
  priority integer NOT NULL DEFAULT 5,
  template_key text,
  max_retries integer NOT NULL DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_event_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select email event settings"
  ON email_event_settings FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin'
  ));

CREATE POLICY "Admins can update email event settings"
  ON email_event_settings FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin'
  ));

-- ============================================================
-- DONNÉES INITIALES: 20 événements email
-- ============================================================
INSERT INTO email_event_settings
  (event_key, event_name, event_description, category, is_enabled, channels, priority, delay_minutes, template_key)
VALUES
  ('welcome_candidate',        'Bienvenue candidat',            'Email envoyé lors de l''inscription d''un candidat',                'onboarding',   true,  ARRAY['email'],                       8,  0, 'welcome_candidate'),
  ('welcome_recruiter',        'Bienvenue recruteur',           'Email envoyé lors de l''inscription d''un recruteur',               'onboarding',   true,  ARRAY['email'],                       8,  0, 'welcome_recruiter'),
  ('email_confirmation',       'Confirmation email',            'Email de confirmation d''adresse email',                            'onboarding',   true,  ARRAY['email'],                       10, 0, 'email_confirmation'),
  ('application_confirmation', 'Confirmation candidature',      'Email au candidat après soumission d''une candidature',             'applications', true,  ARRAY['email','notification'],        8,  0, 'application_confirmation'),
  ('new_application_alert',    'Alerte nouvelle candidature',   'Email au recruteur lors d''une nouvelle candidature',               'applications', true,  ARRAY['email','notification'],        7,  0, 'new_application_alert'),
  ('application_status_update','Mise à jour statut candidature','Email au candidat lors d''un changement de statut de candidature',  'applications', true,  ARRAY['email','notification'],        6,  0, 'application_status_update'),
  ('job_alert_match',          'Alerte emploi match',           'Email aux candidats dont les alertes correspondent à une offre',    'alerts',       true,  ARRAY['email'],                       5,  0, 'job_alert_match'),
  ('interview_scheduled',      'Entretien planifié',            'Email au candidat lors de la planification d''un entretien',        'interviews',   true,  ARRAY['email','notification'],        8,  0, 'interview_scheduled'),
  ('interview_reminder_24h',   'Rappel entretien 24h',          'Rappel envoyé 24h avant l''entretien',                             'interviews',   true,  ARRAY['email','notification','sms'],  7,  0, 'interview_reminder_24h'),
  ('interview_reminder_2h',    'Rappel entretien 2h',           'Rappel envoyé 2h avant l''entretien',                              'interviews',   true,  ARRAY['notification','sms'],          7,  0, 'interview_reminder_2h'),
  ('interview_cancelled',      'Entretien annulé',              'Email au candidat lors de l''annulation d''un entretien',           'interviews',   true,  ARRAY['email','notification'],        8,  0, 'interview_cancelled'),
  ('interview_rescheduled',    'Entretien reprogrammé',         'Email lors de la reprogrammation d''un entretien',                 'interviews',   true,  ARRAY['email','notification','sms'],  7,  0, 'interview_rescheduled'),
  ('job_closed',               'Offre clôturée',                'Email aux candidats actifs quand l''offre est clôturée ou expirée', 'jobs',         true,  ARRAY['email','notification'],        5,  0, 'job_closed'),
  ('credits_validated',        'Crédits validés',               'Email quand un paiement de crédits est validé par l''admin',        'payments',     true,  ARRAY['email','notification'],        9,  0, 'credits_validated'),
  ('credits_rejected',         'Crédits rejetés',               'Email quand un paiement de crédits est refusé par l''admin',        'payments',     true,  ARRAY['email','notification'],        9,  0, 'credits_rejected'),
  ('premium_subscribed',       'Abonnement premium activé',     'Email lors de l''activation d''un abonnement premium',             'payments',     true,  ARRAY['email','notification'],        8,  0, 'premium_subscribed'),
  ('premium_expiring',         'Abonnement expirant',           'Rappel 7 jours avant expiration de l''abonnement premium',         'payments',     true,  ARRAY['email','notification'],        6,  0, 'premium_expiring'),
  ('recruiter_daily_digest',   'Digest quotidien recruteur',    'Résumé quotidien des candidatures envoyé au recruteur',            'digest',       true,  ARRAY['email'],                       4,  0, 'recruiter_daily_digest'),
  ('message_received',         'Message reçu',                  'Notification quand un message est reçu via la messagerie',         'messaging',    true,  ARRAY['email','notification'],        7,  0, 'message_received'),
  ('profile_viewed',           'Profil consulté (CVthèque)',    'Notification quand un profil est consulté dans la CVthèque',       'cvtheque',     false, ARRAY['notification'],                3,  0, 'profile_viewed')
ON CONFLICT (event_key) DO NOTHING;

-- ============================================================
-- FONCTION: Vérifier si un événement est actif
-- ============================================================
CREATE OR REPLACE FUNCTION is_email_event_enabled(p_event_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_enabled boolean;
BEGIN
  SELECT is_enabled INTO v_enabled
  FROM email_event_settings
  WHERE event_key = p_event_key;
  RETURN COALESCE(v_enabled, true);
END;
$$;

-- ============================================================
-- FONCTION: Insérer en queue email conditionnellement
-- Respecte le schéma réel: template_id (FK) + template_variables (jsonb)
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
BEGIN
  -- Vérifier que l'événement est actif
  SELECT * INTO v_event
  FROM email_event_settings
  WHERE event_key = p_event_key;

  IF NOT FOUND OR NOT v_event.is_enabled THEN
    RETURN NULL;
  END IF;

  -- Trouver le template actif
  SELECT id INTO v_template_id
  FROM email_templates
  WHERE template_key = p_template_key
    AND is_active = true
  LIMIT 1;

  IF v_template_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Insérer en queue avec les bonnes colonnes
  INSERT INTO email_queue (
    template_id,
    to_email,
    to_name,
    template_variables,
    priority,
    scheduled_for,
    status,
    user_id,
    job_id
  ) VALUES (
    v_template_id,
    p_to_email,
    p_to_name,
    p_variables,
    v_event.priority,
    now() + (v_event.delay_minutes * INTERVAL '1 minute'),
    'pending',
    p_user_id,
    p_job_id
  )
  RETURNING id INTO v_queue_id;

  RETURN v_queue_id;
END;
$$;

-- ============================================================
-- TRIGGER: Entretiens — planifié, annulé, reprogrammé
-- ============================================================
CREATE OR REPLACE FUNCTION send_interview_email_trigger_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_candidate    profiles%ROWTYPE;
  v_job          jobs%ROWTYPE;
  v_company_name text;
  v_event_key    text;
  v_vars         jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_event_key := 'interview_scheduled';
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
      v_event_key := 'interview_cancelled';
    ELSIF NEW.scheduled_at IS DISTINCT FROM OLD.scheduled_at AND NEW.status = 'scheduled' THEN
      v_event_key := 'interview_rescheduled';
    ELSE
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  IF NOT is_email_event_enabled(v_event_key) THEN RETURN NEW; END IF;

  SELECT * INTO v_candidate FROM profiles WHERE id = NEW.candidate_id;
  SELECT * INTO v_job FROM jobs WHERE id = NEW.job_id;

  BEGIN
    SELECT c.name INTO v_company_name FROM companies c WHERE c.id = NEW.company_id;
  EXCEPTION WHEN OTHERS THEN
    v_company_name := 'JobGuinée';
  END;

  v_vars := jsonb_build_object(
    'candidate_name',     COALESCE(v_candidate.full_name, 'Candidat'),
    'job_title',          COALESCE(v_job.title, 'Poste'),
    'company_name',       COALESCE(v_company_name, 'JobGuinée'),
    'interview_date',     to_char(NEW.scheduled_at AT TIME ZONE 'UTC', 'DD/MM/YYYY'),
    'interview_time',     to_char(NEW.scheduled_at AT TIME ZONE 'UTC', 'HH24:MI'),
    'interview_type',     COALESCE(NEW.interview_type, 'presentiel'),
    'interview_link',     COALESCE(NEW.location_or_link, ''),
    'interview_location', COALESCE(NEW.location_or_link, ''),
    'interview_notes',    COALESCE(NEW.notes, ''),
    'candidate_phone',    COALESCE(v_candidate.phone, ''),
    'if_visio',           (NEW.interview_type = 'visio'),
    'if_presentiel',      (NEW.interview_type = 'presentiel'),
    'if_telephone',       (NEW.interview_type = 'telephone'),
    'if_notes',           (NEW.notes IS NOT NULL AND NEW.notes != '')
  );

  IF v_candidate.email IS NOT NULL THEN
    PERFORM queue_email_for_event(
      v_event_key, v_event_key,
      v_candidate.email,
      COALESCE(v_candidate.full_name, ''),
      v_vars,
      v_candidate.id,
      NEW.job_id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS interview_email_trigger ON interviews;
CREATE TRIGGER interview_email_trigger
  AFTER INSERT OR UPDATE OF status, scheduled_at ON interviews
  FOR EACH ROW
  EXECUTE FUNCTION send_interview_email_trigger_fn();

-- ============================================================
-- TRIGGER: Programmer les rappels — utilise la colonne scheduled_at
-- de la table interview_reminders existante
-- ============================================================
CREATE OR REPLACE FUNCTION schedule_interview_reminders_trigger_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Supprimer les anciens rappels pour cet entretien
  DELETE FROM interview_reminders WHERE interview_id = NEW.id;

  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  -- Rappel 24h avant (colonne scheduled_at dans interview_reminders)
  IF (NEW.scheduled_at - INTERVAL '24 hours') > now() THEN
    INSERT INTO interview_reminders (interview_id, reminder_type, scheduled_at, status)
    VALUES (NEW.id, 'j_moins_1', NEW.scheduled_at - INTERVAL '24 hours', 'pending');
  END IF;

  -- Rappel 2h avant
  IF (NEW.scheduled_at - INTERVAL '2 hours') > now() THEN
    INSERT INTO interview_reminders (interview_id, reminder_type, scheduled_at, status)
    VALUES (NEW.id, 'deux_heures_avant', NEW.scheduled_at - INTERVAL '2 hours', 'pending');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS schedule_reminders_trigger ON interviews;
CREATE TRIGGER schedule_reminders_trigger
  AFTER INSERT OR UPDATE OF scheduled_at, status ON interviews
  FOR EACH ROW
  EXECUTE FUNCTION schedule_interview_reminders_trigger_fn();

-- ============================================================
-- FONCTION: Traitement des rappels d'entretiens (appelée par cron)
-- ============================================================
CREATE OR REPLACE FUNCTION process_interview_reminders()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reminder   RECORD;
  v_interview  RECORD;
  v_candidate  profiles%ROWTYPE;
  v_job        jobs%ROWTYPE;
  v_event_key  text;
  v_vars       jsonb;
  v_processed  integer := 0;
  v_failed     integer := 0;
BEGIN
  FOR v_reminder IN
    SELECT *
    FROM interview_reminders
    WHERE status = 'pending'
      AND scheduled_at <= now()
    LIMIT 50
  LOOP
    BEGIN
      SELECT * INTO v_interview FROM interviews WHERE id = v_reminder.interview_id;

      IF NOT FOUND OR v_interview.status = 'cancelled' THEN
        UPDATE interview_reminders SET status = 'cancelled' WHERE id = v_reminder.id;
        CONTINUE;
      END IF;

      v_event_key := CASE v_reminder.reminder_type
        WHEN 'j_moins_1' THEN 'interview_reminder_24h'
        ELSE 'interview_reminder_2h'
      END;

      IF NOT is_email_event_enabled(v_event_key) THEN
        UPDATE interview_reminders SET status = 'cancelled' WHERE id = v_reminder.id;
        CONTINUE;
      END IF;

      SELECT * INTO v_candidate FROM profiles WHERE id = v_interview.candidate_id;
      SELECT * INTO v_job FROM jobs WHERE id = v_interview.job_id;

      v_vars := jsonb_build_object(
        'candidate_name',     COALESCE(v_candidate.full_name, 'Candidat'),
        'job_title',          COALESCE(v_job.title, 'Poste'),
        'interview_date',     to_char(v_interview.scheduled_at AT TIME ZONE 'UTC', 'DD/MM/YYYY'),
        'interview_time',     to_char(v_interview.scheduled_at AT TIME ZONE 'UTC', 'HH24:MI'),
        'interview_type',     COALESCE(v_interview.interview_type, 'presentiel'),
        'interview_link',     COALESCE(v_interview.location_or_link, ''),
        'interview_location', COALESCE(v_interview.location_or_link, ''),
        'if_visio',           (v_interview.interview_type = 'visio'),
        'if_presentiel',      (v_interview.interview_type = 'presentiel')
      );

      IF v_candidate.email IS NOT NULL THEN
        PERFORM queue_email_for_event(
          v_event_key, v_event_key,
          v_candidate.email,
          COALESCE(v_candidate.full_name, ''),
          v_vars,
          v_candidate.id,
          v_interview.job_id
        );

        UPDATE interview_reminders
        SET status = 'sent', sent_at = now()
        WHERE id = v_reminder.id;

        v_processed := v_processed + 1;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      UPDATE interview_reminders
      SET status = 'failed', error_message = SQLERRM
      WHERE id = v_reminder.id;
      v_failed := v_failed + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object('processed', v_processed, 'failed', v_failed);
END;
$$;

-- ============================================================
-- CRON: Rappels entretiens toutes les 15 minutes
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('process_interview_reminders_job');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    PERFORM cron.schedule(
      'process_interview_reminders_job',
      '*/15 * * * *',
      'SELECT process_interview_reminders()'
    );
  END IF;
END $$;

-- ============================================================
-- TRIGGER: Offre clôturée → email aux candidats actifs
-- ============================================================
CREATE OR REPLACE FUNCTION send_job_closed_email_trigger_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_candidate    RECORD;
  v_company_name text;
BEGIN
  IF NOT (NEW.status IN ('closed', 'expired') AND OLD.status NOT IN ('closed', 'expired')) THEN
    RETURN NEW;
  END IF;

  IF NOT is_email_event_enabled('job_closed') THEN RETURN NEW; END IF;

  BEGIN
    SELECT c.name INTO v_company_name FROM companies c WHERE c.id = NEW.company_id;
  EXCEPTION WHEN OTHERS THEN
    v_company_name := '';
  END;

  FOR v_candidate IN
    SELECT DISTINCT p.id, p.email, p.full_name
    FROM applications a
    JOIN profiles p ON p.id = a.candidate_id
    WHERE a.job_id = NEW.id
      AND a.status NOT IN ('rejected', 'withdrawn')
      AND p.email IS NOT NULL
  LOOP
    PERFORM queue_email_for_event(
      'job_closed', 'job_closed',
      v_candidate.email,
      COALESCE(v_candidate.full_name, ''),
      jsonb_build_object(
        'candidate_name', COALESCE(v_candidate.full_name, 'Candidat'),
        'job_title',      COALESCE(NEW.title, 'Poste'),
        'company_name',   COALESCE(v_company_name, 'JobGuinée')
      ),
      v_candidate.id,
      NEW.id
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS job_closed_email_trigger ON jobs;
CREATE TRIGGER job_closed_email_trigger
  AFTER UPDATE OF status ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION send_job_closed_email_trigger_fn();

-- ============================================================
-- TRIGGER: Crédits validés / rejetés
-- Utilise purchase_status (pas status) et failed_reason (pas rejection_reason)
-- ============================================================
CREATE OR REPLACE FUNCTION send_credits_notification_trigger_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile     profiles%ROWTYPE;
  v_event_key   text;
  v_new_balance integer;
BEGIN
  IF NEW.purchase_status = 'completed' AND OLD.purchase_status IS DISTINCT FROM 'completed' THEN
    v_event_key := 'credits_validated';
  ELSIF NEW.purchase_status = 'rejected' AND OLD.purchase_status IS DISTINCT FROM 'rejected' THEN
    v_event_key := 'credits_rejected';
  ELSE
    RETURN NEW;
  END IF;

  IF NOT is_email_event_enabled(v_event_key) THEN RETURN NEW; END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = NEW.user_id;
  IF NOT FOUND OR v_profile.email IS NULL THEN RETURN NEW; END IF;

  IF v_event_key = 'credits_validated' THEN
    SELECT COALESCE(credits_balance, 0) INTO v_new_balance
    FROM profiles WHERE id = NEW.user_id;

    PERFORM queue_email_for_event(
      'credits_validated', 'credits_validated',
      v_profile.email,
      COALESCE(v_profile.full_name, ''),
      jsonb_build_object(
        'payment_reference', COALESCE(NEW.payment_reference, ''),
        'price_amount',      COALESCE(NEW.price_amount::text, ''),
        'credits_amount',    NEW.credits_amount::text,
        'new_balance',       COALESCE(v_new_balance::text, '0'),
        'admin_notes',       COALESCE(NEW.admin_notes, ''),
        'if_notes',          (NEW.admin_notes IS NOT NULL AND NEW.admin_notes != '')
      ),
      NEW.user_id,
      NULL
    );

  ELSIF v_event_key = 'credits_rejected' THEN
    PERFORM queue_email_for_event(
      'credits_rejected', 'credits_rejected',
      v_profile.email,
      COALESCE(v_profile.full_name, ''),
      jsonb_build_object(
        'payment_reference', COALESCE(NEW.payment_reference, ''),
        'price_amount',      COALESCE(NEW.price_amount::text, ''),
        'credits_amount',    NEW.credits_amount::text,
        'rejection_reason',  COALESCE(NEW.failed_reason, ''),
        'if_reason',         (NEW.failed_reason IS NOT NULL AND NEW.failed_reason != '')
      ),
      NEW.user_id,
      NULL
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS credits_notification_trigger ON credit_purchases;
CREATE TRIGGER credits_notification_trigger
  AFTER UPDATE OF purchase_status ON credit_purchases
  FOR EACH ROW
  EXECUTE FUNCTION send_credits_notification_trigger_fn();

-- ============================================================
-- INDEX de performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_email_event_settings_key      ON email_event_settings(event_key);
CREATE INDEX IF NOT EXISTS idx_email_event_settings_category ON email_event_settings(category);
CREATE INDEX IF NOT EXISTS idx_email_event_settings_enabled  ON email_event_settings(is_enabled);
