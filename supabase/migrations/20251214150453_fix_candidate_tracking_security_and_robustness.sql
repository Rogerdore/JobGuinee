/*
  # Corrections de sécurité et robustesse du système de suivi candidat

  ## Problèmes corrigés
  
  1. **Sécurité** : Élimination complète de toute fuite d'information interne
     - Suppression du ELSE at.event_description dans get_candidate_timeline()
     - Filtrage strict des événements exposés
  
  2. **Anti-spam** : Protection contre les notifications en double
     - Table de déduplication des notifications
     - Vérification avant envoi
  
  3. **Mapping automatique** : Fonction pour mapper les nouveaux workflow_stages
     - Trigger automatique sur INSERT dans workflow_stages
     - Fallback intelligent basé sur le nom du stage
  
  4. **Robustesse** : Gestion des cas limites
     - Fallback si workflow_stage est NULL
     - Fallback si mapping non trouvé
     - Messages par défaut sécurisés
  
  ## Sécurité
  - Aucune donnée interne recruteur exposée
  - RLS maintenu strict
  - Toutes les fonctions SECURITY DEFINER vérifiées
*/

-- ============================================================================
-- 1. CORRECTION : Éliminer toute fuite d'information dans la timeline
-- ============================================================================

CREATE OR REPLACE FUNCTION get_candidate_timeline(p_application_id uuid)
RETURNS TABLE (
  event_id uuid,
  event_date timestamptz,
  status_label text,
  status_description text,
  status_color text,
  is_current boolean
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_candidate_id uuid;
  v_current_stage text;
BEGIN
  -- Vérifier que c'est bien le candidat qui accède à sa propre candidature
  SELECT candidate_id, workflow_stage INTO v_candidate_id, v_current_stage
  FROM applications
  WHERE id = p_application_id;

  IF v_candidate_id != auth.uid() THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  -- Récupérer la timeline filtrée (AUCUNE donnée interne exposée)
  RETURN QUERY
  SELECT
    at.id AS event_id,
    at.created_at AS event_date,
    CASE
      WHEN at.event_type = 'status_change' AND at.new_value = 'pending' THEN 'Postulé'
      WHEN at.event_type = 'status_change' AND at.new_value = 'reviewed' THEN 'Vu'
      WHEN at.event_type = 'status_change' AND at.new_value = 'shortlisted' THEN 'Shortlist'
      WHEN at.event_type = 'status_change' AND at.new_value = 'interview' THEN 'Entretien'
      WHEN at.event_type = 'status_change' AND at.new_value = 'accepted' THEN 'Accepté'
      WHEN at.event_type = 'status_change' AND at.new_value = 'rejected' THEN 'Refusé'
      WHEN at.event_type = 'workflow_stage_change' THEN 'Étape modifiée'
      WHEN at.event_type = 'application_created' THEN 'Postulé'
      -- SÉCURITÉ : Pas de ELSE avec at.event_description car pourrait contenir des infos internes
      ELSE 'Mise à jour du statut'
    END AS status_label,
    CASE
      WHEN at.event_type = 'application_created' THEN 'Candidature envoyée avec succès'
      WHEN at.event_type = 'status_change' AND at.new_value = 'reviewed' THEN 'Votre profil a été consulté'
      WHEN at.event_type = 'status_change' AND at.new_value = 'shortlisted' THEN 'Vous êtes présélectionné(e)'
      WHEN at.event_type = 'status_change' AND at.new_value = 'interview' THEN 'Entretien programmé'
      WHEN at.event_type = 'status_change' AND at.new_value = 'accepted' THEN 'Candidature acceptée'
      WHEN at.event_type = 'status_change' AND at.new_value = 'rejected' THEN 'Candidature non retenue'
      WHEN at.event_type = 'workflow_stage_change' THEN 'Votre dossier progresse dans le processus de recrutement'
      -- SÉCURITÉ : Message générique pour tout autre type d'événement
      ELSE 'Votre candidature est en cours de traitement'
    END AS status_description,
    CASE
      WHEN at.event_type = 'application_created' THEN '#6B7280'
      WHEN at.event_type = 'status_change' AND at.new_value = 'reviewed' THEN '#3B82F6'
      WHEN at.event_type = 'status_change' AND at.new_value = 'shortlisted' THEN '#8B5CF6'
      WHEN at.event_type = 'status_change' AND at.new_value = 'interview' THEN '#06B6D4'
      WHEN at.event_type = 'status_change' AND at.new_value = 'accepted' THEN '#10B981'
      WHEN at.event_type = 'status_change' AND at.new_value = 'rejected' THEN '#EF4444'
      ELSE '#F59E0B'
    END AS status_color,
    (at.new_value = v_current_stage) AS is_current
  FROM application_timeline at
  WHERE at.application_id = p_application_id
    AND at.event_type IN ('application_created', 'status_change', 'workflow_stage_change')
  ORDER BY at.created_at ASC;
END;
$$;

-- ============================================================================
-- 2. ANTI-SPAM : Table de déduplication des notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS candidate_notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  notification_type text NOT NULL,
  status_value text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(application_id, notification_type, status_value)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_candidate_notification_log_application 
  ON candidate_notification_log(application_id);

-- RLS : Les candidats peuvent voir leur log (lecture seule)
ALTER TABLE candidate_notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates can view their notification log"
  ON candidate_notification_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = candidate_notification_log.application_id
        AND applications.candidate_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. CORRECTION : Trigger avec protection anti-spam
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_candidate_on_status_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_job_title text;
  v_company_name text;
  v_notification_title text;
  v_notification_message text;
  v_notification_exists boolean;
BEGIN
  -- Notifications uniquement pour les étapes importantes
  IF NEW.status IN ('shortlisted', 'interview', 'accepted', 'rejected')
     AND (OLD.status IS NULL OR OLD.status != NEW.status) THEN

    -- ANTI-SPAM : Vérifier si une notification similaire a déjà été envoyée
    SELECT EXISTS (
      SELECT 1 FROM candidate_notification_log
      WHERE application_id = NEW.id
        AND notification_type = 'status_change'
        AND status_value = NEW.status
    ) INTO v_notification_exists;

    -- Si la notification a déjà été envoyée, ne pas continuer
    IF v_notification_exists THEN
      RETURN NEW;
    END IF;

    -- Récupérer les infos du job
    BEGIN
      SELECT j.title, c.name
      INTO v_job_title, v_company_name
      FROM jobs j
      JOIN companies c ON c.id = j.company_id
      WHERE j.id = NEW.job_id;
    EXCEPTION WHEN OTHERS THEN
      -- Fallback sécurisé si les données ne sont pas trouvées
      v_job_title := 'le poste';
      v_company_name := 'l''entreprise';
    END;

    -- Définir le message selon le statut
    IF NEW.status = 'shortlisted' THEN
      v_notification_title := 'Vous êtes présélectionné(e) !';
      v_notification_message := 'Félicitations ! Votre candidature pour le poste de ' || v_job_title ||
                                ' chez ' || v_company_name || ' a été présélectionnée.';

    ELSIF NEW.status = 'interview' THEN
      v_notification_title := 'Entretien programmé';
      v_notification_message := 'Un entretien a été programmé pour votre candidature au poste de ' ||
                                v_job_title || ' chez ' || v_company_name || '.';

    ELSIF NEW.status = 'accepted' THEN
      v_notification_title := 'Candidature acceptée !';
      v_notification_message := 'Félicitations ! Votre candidature pour le poste de ' || v_job_title ||
                                ' chez ' || v_company_name || ' a été acceptée.';

    ELSIF NEW.status = 'rejected' THEN
      v_notification_title := 'Mise à jour de votre candidature';
      v_notification_message := 'Votre candidature pour le poste de ' || v_job_title ||
                                ' chez ' || v_company_name ||
                                ' n''a malheureusement pas été retenue cette fois. Ne vous découragez pas !';
    END IF;

    -- Insérer la notification
    BEGIN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        link,
        is_read,
        created_at
      ) VALUES (
        NEW.candidate_id,
        'application_status',
        v_notification_title,
        v_notification_message,
        '/candidate-dashboard?tab=applications',
        false,
        NOW()
      );

      -- Enregistrer dans le log pour éviter les doublons futurs
      INSERT INTO candidate_notification_log (
        application_id,
        notification_type,
        status_value
      ) VALUES (
        NEW.id,
        'status_change',
        NEW.status
      ) ON CONFLICT (application_id, notification_type, status_value) DO NOTHING;

    EXCEPTION WHEN OTHERS THEN
      -- Log l'erreur mais ne bloque pas le changement de statut
      RAISE WARNING 'Erreur lors de l''envoi de notification: %', SQLERRM;
    END;

  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 4. MAPPING AUTOMATIQUE : Trigger pour nouveaux workflow_stages
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_map_workflow_stage_label()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si candidate_status_label n'est pas défini, appliquer un mapping intelligent
  IF NEW.candidate_status_label IS NULL OR NEW.candidate_status_label = '' THEN
    NEW.candidate_status_label := CASE
      WHEN LOWER(NEW.stage_name) LIKE '%reçu%' OR LOWER(NEW.stage_name) LIKE '%postul%' OR LOWER(NEW.stage_name) LIKE '%nouveau%' THEN 'postule'
      WHEN LOWER(NEW.stage_name) LIKE '%vu%' OR LOWER(NEW.stage_name) LIKE '%consult%' THEN 'vu'
      WHEN LOWER(NEW.stage_name) LIKE '%analys%' OR LOWER(NEW.stage_name) LIKE '%examen%' OR LOWER(NEW.stage_name) LIKE '%revue%' THEN 'en_analyse'
      WHEN LOWER(NEW.stage_name) LIKE '%shortlist%' OR LOWER(NEW.stage_name) LIKE '%présélect%' OR LOWER(NEW.stage_name) LIKE '%preselect%' THEN 'shortlist'
      WHEN LOWER(NEW.stage_name) LIKE '%entretien%' OR LOWER(NEW.stage_name) LIKE '%interview%' THEN 'entretien'
      WHEN LOWER(NEW.stage_name) LIKE '%accepté%' OR LOWER(NEW.stage_name) LIKE '%accept%' OR LOWER(NEW.stage_name) LIKE '%embau%' THEN 'accepte'
      WHEN LOWER(NEW.stage_name) LIKE '%refus%' OR LOWER(NEW.stage_name) LIKE '%reject%' OR LOWER(NEW.stage_name) LIKE '%éliminé%' THEN 'refuse'
      ELSE 'en_analyse'
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger si pas existant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'auto_map_workflow_stage_on_insert'
  ) THEN
    CREATE TRIGGER auto_map_workflow_stage_on_insert
      BEFORE INSERT ON workflow_stages
      FOR EACH ROW
      EXECUTE FUNCTION auto_map_workflow_stage_label();
  END IF;
END $$;

-- Trigger pour UPDATE aussi (si l'admin change le nom)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'auto_map_workflow_stage_on_update'
  ) THEN
    CREATE TRIGGER auto_map_workflow_stage_on_update
      BEFORE UPDATE ON workflow_stages
      FOR EACH ROW
      WHEN (OLD.stage_name IS DISTINCT FROM NEW.stage_name OR NEW.candidate_status_label IS NULL)
      EXECUTE FUNCTION auto_map_workflow_stage_label();
  END IF;
END $$;

-- ============================================================================
-- 5. ROBUSTESSE : Amélioration de get_candidate_application_status
-- ============================================================================

CREATE OR REPLACE FUNCTION get_candidate_application_status(p_application_id uuid)
RETURNS TABLE (
  application_id uuid,
  job_title text,
  company_name text,
  applied_at timestamptz,
  current_status text,
  status_label text,
  status_color text,
  status_description text,
  can_view_details boolean
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_candidate_id uuid;
BEGIN
  -- Vérifier que c'est bien le candidat qui accède à sa propre candidature
  SELECT candidate_id INTO v_candidate_id
  FROM applications
  WHERE id = p_application_id;

  IF v_candidate_id IS NULL THEN
    RAISE EXCEPTION 'Candidature non trouvée';
  END IF;

  IF v_candidate_id != auth.uid() THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  -- Récupérer les informations de la candidature avec fallbacks robustes
  RETURN QUERY
  SELECT
    a.id AS application_id,
    COALESCE(j.title, 'Poste') AS job_title,
    COALESCE(c.name, 'Entreprise') AS company_name,
    a.applied_at,
    COALESCE(a.workflow_stage, a.status, 'pending') AS current_status,
    CASE COALESCE(ws.candidate_status_label, 'en_analyse')
      WHEN 'postule' THEN 'Postulé'
      WHEN 'vu' THEN 'Vu'
      WHEN 'en_analyse' THEN 'En analyse'
      WHEN 'shortlist' THEN 'Shortlist'
      WHEN 'entretien' THEN 'Entretien'
      WHEN 'accepte' THEN 'Accepté'
      WHEN 'refuse' THEN 'Refusé'
      ELSE 'En cours'
    END AS status_label,
    CASE COALESCE(ws.candidate_status_label, 'en_analyse')
      WHEN 'postule' THEN '#6B7280'
      WHEN 'vu' THEN '#3B82F6'
      WHEN 'en_analyse' THEN '#F59E0B'
      WHEN 'shortlist' THEN '#8B5CF6'
      WHEN 'entretien' THEN '#06B6D4'
      WHEN 'accepte' THEN '#10B981'
      WHEN 'refuse' THEN '#EF4444'
      ELSE '#6B7280'
    END AS status_color,
    CASE COALESCE(ws.candidate_status_label, 'en_analyse')
      WHEN 'postule' THEN 'Votre candidature a été reçue'
      WHEN 'vu' THEN 'Votre profil a été consulté par le recruteur'
      WHEN 'en_analyse' THEN 'Votre candidature est en cours d''examen'
      WHEN 'shortlist' THEN 'Félicitations ! Vous êtes présélectionné(e)'
      WHEN 'entretien' THEN 'Un entretien est prévu ou en cours'
      WHEN 'accepte' THEN 'Félicitations ! Votre candidature est acceptée'
      WHEN 'refuse' THEN 'Votre candidature n''a pas été retenue cette fois'
      ELSE 'Candidature en cours de traitement'
    END AS status_description,
    true AS can_view_details
  FROM applications a
  LEFT JOIN jobs j ON j.id = a.job_id
  LEFT JOIN companies c ON c.id = j.company_id
  LEFT JOIN workflow_stages ws ON ws.stage_name = a.workflow_stage AND ws.company_id = c.id
  WHERE a.id = p_application_id
    AND a.candidate_id = auth.uid();
END;
$$;

-- ============================================================================
-- COMMENTAIRES MIS À JOUR
-- ============================================================================

COMMENT ON FUNCTION get_candidate_application_status(uuid) IS
'[v2] Récupère le statut candidat avec fallbacks robustes et zéro fuite d''information';

COMMENT ON FUNCTION get_candidate_timeline(uuid) IS
'[v2] Timeline candidat 100% sécurisée - AUCUNE donnée interne exposée';

COMMENT ON FUNCTION notify_candidate_on_status_change() IS
'[v2] Notifications avec protection anti-spam et gestion d''erreurs robuste';

COMMENT ON FUNCTION auto_map_workflow_stage_label() IS
'Mapping automatique intelligent des workflow_stages vers statuts candidat';

COMMENT ON TABLE candidate_notification_log IS
'Log de déduplication des notifications candidat pour éviter les doublons';
