/*
  # Système d'historique des actions sur les candidatures
  
  1. Nouvelle table
    - `application_activity_log`
      - `id` (uuid, clé primaire)
      - `application_id` (référence vers applications)
      - `actor_id` (recruteur qui a fait l'action)
      - `action_type` (note_added, shortlisted, rejected, stage_changed, etc.)
      - `metadata` (jsonb pour données additionnelles)
      - `created_at` (timestamp)
  
  2. Sécurité
    - Enable RLS
    - Les recruteurs peuvent voir l'historique de leurs candidatures
    - Les recruteurs peuvent créer des entrées d'historique
  
  3. Index
    - Index sur application_id pour performance
    - Index sur action_type pour filtrage
*/

-- Créer la table d'historique des actions
CREATE TABLE IF NOT EXISTS application_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES auth.users(id),
  action_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_activity_log_application ON application_activity_log(application_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_action_type ON application_activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON application_activity_log(created_at DESC);

-- Enable RLS
ALTER TABLE application_activity_log ENABLE ROW LEVEL SECURITY;

-- Les recruteurs peuvent voir l'historique de leurs candidatures
CREATE POLICY "Recruiters can view application activity for their jobs"
  ON application_activity_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN jobs j ON j.id = a.job_id
      JOIN companies c ON c.id = j.company_id
      JOIN profiles p ON p.id = auth.uid()
      WHERE a.id = application_activity_log.application_id
      AND p.user_type = 'recruiter'
      AND EXISTS (
        SELECT 1 FROM companies comp
        WHERE comp.id = c.id
        AND comp.id IN (
          SELECT company_id FROM companies WHERE id = c.id
        )
      )
    )
  );

-- Les recruteurs peuvent créer des entrées d'historique
CREATE POLICY "Recruiters can create activity log entries"
  ON application_activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN jobs j ON j.id = a.job_id
      JOIN profiles p ON p.id = auth.uid()
      WHERE a.id = application_activity_log.application_id
      AND p.user_type = 'recruiter'
      AND auth.uid() = actor_id
    )
  );

-- Fonction helper pour logger automatiquement certaines actions
CREATE OR REPLACE FUNCTION log_application_action()
RETURNS TRIGGER AS $$
BEGIN
  -- Logger le changement de shortlist
  IF (TG_OP = 'UPDATE') AND (OLD.is_shortlisted IS DISTINCT FROM NEW.is_shortlisted) THEN
    IF NEW.is_shortlisted = true THEN
      INSERT INTO application_activity_log (application_id, actor_id, action_type, metadata)
      VALUES (NEW.id, auth.uid(), 'shortlisted', jsonb_build_object('shortlisted_at', NEW.shortlisted_at));
    ELSE
      INSERT INTO application_activity_log (application_id, actor_id, action_type, metadata)
      VALUES (NEW.id, auth.uid(), 'unshortlisted', jsonb_build_object('timestamp', now()));
    END IF;
  END IF;
  
  -- Logger le rejet
  IF (TG_OP = 'UPDATE') AND (OLD.rejected_reason IS NULL AND NEW.rejected_reason IS NOT NULL) THEN
    INSERT INTO application_activity_log (application_id, actor_id, action_type, metadata)
    VALUES (NEW.id, auth.uid(), 'rejected', jsonb_build_object(
      'reason', NEW.rejected_reason,
      'rejected_at', NEW.rejected_at
    ));
  END IF;
  
  -- Logger le changement de stage
  IF (TG_OP = 'UPDATE') AND (OLD.workflow_stage IS DISTINCT FROM NEW.workflow_stage) THEN
    INSERT INTO application_activity_log (application_id, actor_id, action_type, metadata)
    VALUES (NEW.id, auth.uid(), 'stage_changed', jsonb_build_object(
      'from_stage', OLD.workflow_stage,
      'to_stage', NEW.workflow_stage
    ));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur applications
DROP TRIGGER IF EXISTS trigger_log_application_actions ON applications;
CREATE TRIGGER trigger_log_application_actions
  AFTER UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION log_application_action();
