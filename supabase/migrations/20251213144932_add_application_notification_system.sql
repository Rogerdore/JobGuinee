/*
  # Système complet de notifications et emails pour candidatures

  ## Vue d'ensemble
  Cette migration crée un système complet de notifications et d'emails
  pour gérer les candidatures :
  - Numéro de référence unique pour chaque candidature
  - Paramètres de notification pour les recruteurs
  - Log des emails envoyés
  - Support pour le rapport quotidien des recruteurs

  ## 1. Modifications de tables existantes

  ### applications
  - Ajout de `application_reference` (text unique) - Numéro de candidature (ex: APP-20251213-0001)
  - Index pour recherche rapide

  ## 2. Nouvelles tables

  ### recruiter_notification_settings
  - Configuration des notifications pour chaque recruteur
  - Paramètres du rapport quotidien (heure, timezone, activation)
  - Options d'envoi (email immédiat, rapport quotidien, SMS)

  ### email_logs
  - Traçabilité complète des emails envoyés
  - Statuts d'envoi (sent, delivered, failed)
  - Référence aux entités liées (application, job, user)

  ### daily_digest_log
  - Log des rapports quotidiens envoyés
  - Prévention des doubles envois
  - Statistiques des candidatures incluses

  ## 3. Fonctions

  ### generate_application_reference()
  - Génère un numéro de référence unique au format APP-YYYYMMDD-XXXX
  - Appelée automatiquement lors de l'insertion d'une candidature

  ## 4. Triggers

  ### set_application_reference
  - Trigger BEFORE INSERT sur applications
  - Génère automatiquement application_reference si null

  ## 5. Sécurité (RLS)
  - Recruteurs voient uniquement leurs paramètres
  - Recruteurs voient uniquement leurs logs d'emails
  - Admin voit tout
  - Candidats n'ont pas accès aux logs internes

  ## 6. Notes importantes
  - Le numéro de candidature est visible par le candidat
  - Les emails sont tracés dans email_logs
  - Le rapport quotidien est configurable par recruteur
  - Protection anti-doublon sur daily_digest_log (recruiter_id + date)
*/

-- 1. Ajouter application_reference à applications
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'applications' AND column_name = 'application_reference'
  ) THEN
    ALTER TABLE applications ADD COLUMN application_reference text UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_applications_reference ON applications(application_reference);
  END IF;
END $$;

-- 2. Fonction de génération de référence de candidature
CREATE OR REPLACE FUNCTION generate_application_reference()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_date text;
  v_sequence int;
  v_reference text;
BEGIN
  -- Format : APP-YYYYMMDD-XXXX
  v_date := to_char(now(), 'YYYYMMDD');
  
  -- Compter les candidatures du jour
  SELECT COUNT(*) + 1
  INTO v_sequence
  FROM applications
  WHERE application_reference LIKE 'APP-' || v_date || '-%';
  
  -- Générer la référence
  v_reference := 'APP-' || v_date || '-' || LPAD(v_sequence::text, 4, '0');
  
  -- Vérifier l'unicité (au cas où)
  WHILE EXISTS (SELECT 1 FROM applications WHERE application_reference = v_reference) LOOP
    v_sequence := v_sequence + 1;
    v_reference := 'APP-' || v_date || '-' || LPAD(v_sequence::text, 4, '0');
  END LOOP;
  
  RETURN v_reference;
END;
$$;

-- 3. Trigger pour générer automatiquement application_reference
CREATE OR REPLACE FUNCTION set_application_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.application_reference IS NULL THEN
    NEW.application_reference := generate_application_reference();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_application_reference ON applications;
CREATE TRIGGER trigger_set_application_reference
  BEFORE INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION set_application_reference();

-- 4. Table recruiter_notification_settings
CREATE TABLE IF NOT EXISTS recruiter_notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Notifications immédiates
  instant_email_enabled boolean DEFAULT true,
  instant_sms_enabled boolean DEFAULT false,
  instant_whatsapp_enabled boolean DEFAULT false,
  
  -- Rapport quotidien
  daily_digest_enabled boolean DEFAULT true,
  daily_digest_hour integer DEFAULT 18 CHECK (daily_digest_hour >= 0 AND daily_digest_hour <= 23),
  daily_digest_timezone text DEFAULT 'Africa/Conakry',
  include_zero_applications boolean DEFAULT false,
  
  -- Format du rapport
  digest_format text DEFAULT 'detailed' CHECK (digest_format IN ('summary', 'detailed')),
  include_candidate_scores boolean DEFAULT true,
  include_direct_links boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(recruiter_id)
);

-- 5. Table email_logs
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Destinataire
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  
  -- Type et template
  email_type text NOT NULL CHECK (email_type IN (
    'application_confirmation',
    'recruiter_new_application',
    'recruiter_daily_digest',
    'interview_scheduled',
    'application_status_update',
    'custom'
  )),
  template_code text,
  
  -- Contenu
  subject text NOT NULL,
  body_text text NOT NULL,
  body_html text,
  
  -- Entités liées
  application_id uuid REFERENCES applications(id) ON DELETE SET NULL,
  job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  
  -- Statut
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  error_message text,
  
  -- Métadonnées
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  
  -- Tracking
  provider text DEFAULT 'internal',
  provider_message_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_application ON email_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);

-- 6. Table daily_digest_log
CREATE TABLE IF NOT EXISTS daily_digest_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  recruiter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  digest_date date NOT NULL,
  
  -- Statistiques
  applications_count integer DEFAULT 0 CHECK (applications_count >= 0),
  applications_ids uuid[] DEFAULT '{}',
  
  -- Statut d'envoi
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  email_log_id uuid REFERENCES email_logs(id) ON DELETE SET NULL,
  error_message text,
  
  -- Timestamps
  generated_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  
  -- Métadonnées
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  
  -- Anti-doublon : 1 seul digest par recruteur par jour
  UNIQUE(recruiter_id, digest_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_digest_recruiter ON daily_digest_log(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_daily_digest_date ON daily_digest_log(digest_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_digest_status ON daily_digest_log(status);

-- 7. RLS sur recruiter_notification_settings
ALTER TABLE recruiter_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruteurs gèrent leurs paramètres"
  ON recruiter_notification_settings
  FOR ALL
  TO authenticated
  USING (
    recruiter_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  )
  WITH CHECK (
    recruiter_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- 8. RLS sur email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs voient leurs emails"
  ON email_logs
  FOR SELECT
  TO authenticated
  USING (
    recipient_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Système crée les logs d'emails"
  ON email_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 9. RLS sur daily_digest_log
ALTER TABLE daily_digest_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruteurs voient leurs rapports"
  ON daily_digest_log
  FOR SELECT
  TO authenticated
  USING (
    recruiter_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Système crée les logs de digest"
  ON daily_digest_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 10. Mettre à jour les candidatures existantes avec des références
DO $$
DECLARE
  v_app RECORD;
BEGIN
  FOR v_app IN (
    SELECT id FROM applications WHERE application_reference IS NULL ORDER BY applied_at
  ) LOOP
    UPDATE applications 
    SET application_reference = generate_application_reference()
    WHERE id = v_app.id;
  END LOOP;
END $$;

-- 11. Initialiser les paramètres pour les recruteurs existants
INSERT INTO recruiter_notification_settings (recruiter_id)
SELECT DISTINCT p.id
FROM profiles p
WHERE p.user_type = 'recruiter'
AND NOT EXISTS (
  SELECT 1 FROM recruiter_notification_settings rns
  WHERE rns.recruiter_id = p.id
)
ON CONFLICT (recruiter_id) DO NOTHING;
