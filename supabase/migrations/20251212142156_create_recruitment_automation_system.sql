/*
  # Système d'Automations Avancées de Recrutement (V3)

  ## Description
  Ce système automatise les tâches répétitives du recrutement : relances automatiques,
  rappels d'entretiens, et gestion de la fermeture d'offres.

  ## Nouvelles Tables

  ### automation_rules
  Configuration des règles d'automation par entreprise
  - id (uuid, clé primaire)
  - company_id (uuid, référence vers companies)
  - rule_type (text) - Type d'automation
  - is_enabled (boolean) - Actif ou non
  - configuration (jsonb) - Configuration spécifique
  - created_at (timestamp)
  - updated_at (timestamp)

  ### automation_execution_log
  Journal d'exécution des automations
  - id (uuid, clé primaire)
  - rule_id (uuid, référence vers automation_rules)
  - target_type (text) - Type de cible (application, interview, etc.)
  - target_id (uuid) - ID de la cible
  - execution_status (text) - success, failed, skipped
  - execution_details (jsonb) - Détails d'exécution
  - executed_at (timestamp)

  ### interview_reminders
  Rappels d'entretiens programmés
  - id (uuid, clé primaire)
  - interview_id (uuid, référence vers interviews)
  - reminder_type (text) - j_moins_1, deux_heures_avant
  - scheduled_at (timestamp) - Quand envoyer le rappel
  - sent_at (timestamp) - Quand envoyé
  - status (text) - pending, sent, failed
  - created_at (timestamp)

  ## Sécurité
  - RLS activé sur toutes les tables
  - Seuls les recruteurs de l'entreprise peuvent gérer les règles
  - Les logs sont accessibles uniquement aux entreprises concernées

  ## Features Automation
  - auto_candidate_followup: Relances candidats
  - auto_interview_reminders: Rappels entretiens
  - auto_job_closure_notifications: Notifications fermeture offres
*/

-- Table des règles d'automation
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN (
    'auto_candidate_followup',
    'auto_interview_reminders',
    'auto_job_closure_notifications'
  )),
  is_enabled BOOLEAN DEFAULT true,
  configuration JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(company_id, rule_type)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_automation_rules_company ON automation_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_enabled ON automation_rules(is_enabled) WHERE is_enabled = true;

-- Table du journal d'exécution
CREATE TABLE IF NOT EXISTS automation_execution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  execution_status TEXT NOT NULL CHECK (execution_status IN ('success', 'failed', 'skipped')),
  execution_details JSONB DEFAULT '{}',
  executed_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_automation_log_company ON automation_execution_log(company_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_log_rule ON automation_execution_log(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_log_target ON automation_execution_log(target_type, target_id);

-- Table des rappels d'entretiens
CREATE TABLE IF NOT EXISTS interview_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('j_moins_1', 'deux_heures_avant')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(interview_id, reminder_type)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_interview_reminders_scheduled ON interview_reminders(scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_interview_reminders_interview ON interview_reminders(interview_id);

-- Function pour créer automatiquement les rappels d'entretiens
CREATE OR REPLACE FUNCTION create_interview_reminders()
RETURNS TRIGGER AS $$
DECLARE
  reminder_j_moins_1 TIMESTAMPTZ;
  reminder_2h TIMESTAMPTZ;
  company_has_automation BOOLEAN;
BEGIN
  -- Vérifier si l'entreprise a activé les rappels automatiques
  SELECT EXISTS (
    SELECT 1 FROM automation_rules ar
    JOIN interviews i ON i.company_id = ar.company_id
    WHERE i.id = NEW.id
      AND ar.rule_type = 'auto_interview_reminders'
      AND ar.is_enabled = true
  ) INTO company_has_automation;

  IF NOT company_has_automation THEN
    RETURN NEW;
  END IF;

  -- Calculer les dates de rappel
  reminder_j_moins_1 = (NEW.scheduled_at - INTERVAL '1 day');
  reminder_2h = (NEW.scheduled_at - INTERVAL '2 hours');

  -- Créer rappel J-1 (seulement si l'entretien est dans plus de 1 jour)
  IF NEW.scheduled_at > (now() + INTERVAL '1 day') THEN
    INSERT INTO interview_reminders (interview_id, reminder_type, scheduled_at)
    VALUES (NEW.id, 'j_moins_1', reminder_j_moins_1)
    ON CONFLICT (interview_id, reminder_type) DO NOTHING;
  END IF;

  -- Créer rappel 2h avant (seulement si l'entretien est dans plus de 2 heures)
  IF NEW.scheduled_at > (now() + INTERVAL '2 hours') THEN
    INSERT INTO interview_reminders (interview_id, reminder_type, scheduled_at)
    VALUES (NEW.id, 'deux_heures_avant', reminder_2h)
    ON CONFLICT (interview_id, reminder_type) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_interview_reminders_trigger ON interviews;
CREATE TRIGGER create_interview_reminders_trigger
  AFTER INSERT ON interviews
  FOR EACH ROW
  WHEN (NEW.status IN ('planned', 'confirmed'))
  EXECUTE FUNCTION create_interview_reminders();

-- Function pour annuler les rappels si entretien annulé
CREATE OR REPLACE FUNCTION cancel_interview_reminders()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('cancelled', 'no_show', 'completed') AND OLD.status IN ('planned', 'confirmed') THEN
    UPDATE interview_reminders
    SET status = 'cancelled'
    WHERE interview_id = NEW.id
      AND status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cancel_interview_reminders_trigger ON interviews;
CREATE TRIGGER cancel_interview_reminders_trigger
  AFTER UPDATE ON interviews
  FOR EACH ROW
  EXECUTE FUNCTION cancel_interview_reminders();

-- Function pour créer des règles d'automation par défaut pour nouvelle entreprise
CREATE OR REPLACE FUNCTION create_default_automation_rules()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer les règles par défaut pour les nouvelles entreprises
  INSERT INTO automation_rules (company_id, rule_type, is_enabled, configuration)
  VALUES 
    (NEW.id, 'auto_candidate_followup', true, '{
      "delay_days_reminder_1": 2,
      "delay_days_reminder_2": 5,
      "max_reminders": 2
    }'::jsonb),
    (NEW.id, 'auto_interview_reminders', true, '{
      "send_j_minus_1": true,
      "send_2h_before": true,
      "send_candidate_notification": true,
      "send_recruiter_notification": true
    }'::jsonb),
    (NEW.id, 'auto_job_closure_notifications', true, '{
      "notify_pending_candidates": true,
      "auto_archive_applications": true
    }'::jsonb)
  ON CONFLICT (company_id, rule_type) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_default_automation_rules_trigger ON companies;
CREATE TRIGGER create_default_automation_rules_trigger
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION create_default_automation_rules();

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_automation_rules_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS automation_rules_updated ON automation_rules;
CREATE TRIGGER automation_rules_updated
  BEFORE UPDATE ON automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_automation_rules_timestamp();

-- RLS Policies pour automation_rules
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Recruiters can view their company automation rules" ON automation_rules;
DROP POLICY IF EXISTS "Recruiters can manage their company automation rules" ON automation_rules;

CREATE POLICY "Recruiters can view their company automation rules"
  ON automation_rules
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT c.id FROM companies c WHERE c.profile_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can manage their company automation rules"
  ON automation_rules
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT c.id FROM companies c WHERE c.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT c.id FROM companies c WHERE c.profile_id = auth.uid()
    )
  );

-- RLS Policies pour automation_execution_log
ALTER TABLE automation_execution_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Recruiters can view their company automation logs" ON automation_execution_log;

CREATE POLICY "Recruiters can view their company automation logs"
  ON automation_execution_log
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT c.id FROM companies c WHERE c.profile_id = auth.uid()
    )
  );

-- RLS Policies pour interview_reminders
ALTER TABLE interview_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Recruiters can view their company interview reminders" ON interview_reminders;

CREATE POLICY "Recruiters can view their company interview reminders"
  ON interview_reminders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM interviews i
      JOIN companies c ON c.id = i.company_id
      WHERE i.id = interview_reminders.interview_id
        AND c.profile_id = auth.uid()
    )
  );

-- Créer les règles d'automation pour les entreprises existantes
INSERT INTO automation_rules (company_id, rule_type, is_enabled, configuration)
SELECT 
  c.id,
  rule_type,
  true,
  CASE rule_type
    WHEN 'auto_candidate_followup' THEN '{
      "delay_days_reminder_1": 2,
      "delay_days_reminder_2": 5,
      "max_reminders": 2
    }'::jsonb
    WHEN 'auto_interview_reminders' THEN '{
      "send_j_minus_1": true,
      "send_2h_before": true,
      "send_candidate_notification": true,
      "send_recruiter_notification": true
    }'::jsonb
    WHEN 'auto_job_closure_notifications' THEN '{
      "notify_pending_candidates": true,
      "auto_archive_applications": true
    }'::jsonb
  END as configuration
FROM companies c
CROSS JOIN (
  VALUES 
    ('auto_candidate_followup'),
    ('auto_interview_reminders'),
    ('auto_job_closure_notifications')
) AS rules(rule_type)
ON CONFLICT (company_id, rule_type) DO NOTHING;
