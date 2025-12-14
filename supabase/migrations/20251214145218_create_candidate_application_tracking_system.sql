/*
  # Système de Suivi de Candidature pour Candidats

  ## Objectif
  Créer un système transparent de suivi de candidature côté candidat avec :
  - Statuts clairs et lisibles (Postulé → Vu → En analyse → Shortlist → Entretien → Décision)
  - Timeline visuelle pour chaque candidature
  - Notifications automatiques intelligentes (Shortlist, Entretien, Décision)
  - Aucune donnée interne recruteur exposée

  ## 1. Mapping des statuts candidat
    Ajouter un champ `candidate_status_label` dans workflow_stages pour mapper
    les étapes internes aux statuts candidat visibles

  ## 2. Fonctions backend
    - get_candidate_application_status() : Récupère le statut complet d'une candidature
    - get_candidate_timeline() : Récupère l'historique visible par le candidat

  ## 3. Triggers pour notifications automatiques
    - Notification lors du passage en Shortlist
    - Notification lors de la planification d'entretien
    - Notification lors de la décision finale (Accepté/Refusé)

  ## 4. Sécurité
    - RLS strict : les candidats ne voient que leurs propres données
    - Aucune note interne ou score IA détaillé exposé
    - Accès lecture seule
*/

-- ============================================================================
-- 1. AJOUT DU MAPPING STATUTS CANDIDAT
-- ============================================================================

-- Ajouter le champ candidate_status_label dans workflow_stages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workflow_stages' AND column_name = 'candidate_status_label'
  ) THEN
    ALTER TABLE workflow_stages
    ADD COLUMN candidate_status_label text DEFAULT 'en_analyse';
  END IF;
END $$;

-- Ajouter des valeurs par défaut pour les étapes existantes
UPDATE workflow_stages
SET candidate_status_label = CASE
  WHEN LOWER(stage_name) LIKE '%reçu%' OR LOWER(stage_name) LIKE '%postul%' OR LOWER(stage_name) LIKE '%nouveau%' THEN 'postule'
  WHEN LOWER(stage_name) LIKE '%vu%' OR LOWER(stage_name) LIKE '%consult%' THEN 'vu'
  WHEN LOWER(stage_name) LIKE '%analys%' OR LOWER(stage_name) LIKE '%examen%' OR LOWER(stage_name) LIKE '%revue%' THEN 'en_analyse'
  WHEN LOWER(stage_name) LIKE '%shortlist%' OR LOWER(stage_name) LIKE '%présélect%' OR LOWER(stage_name) LIKE '%preselect%' THEN 'shortlist'
  WHEN LOWER(stage_name) LIKE '%entretien%' OR LOWER(stage_name) LIKE '%interview%' THEN 'entretien'
  WHEN LOWER(stage_name) LIKE '%accepté%' OR LOWER(stage_name) LIKE '%accept%' OR LOWER(stage_name) LIKE '%embau%' THEN 'accepte'
  WHEN LOWER(stage_name) LIKE '%refus%' OR LOWER(stage_name) LIKE '%reject%' OR LOWER(stage_name) LIKE '%éliminé%' THEN 'refuse'
  ELSE 'en_analyse'
END
WHERE candidate_status_label IS NULL OR candidate_status_label = 'en_analyse';

-- ============================================================================
-- 2. FONCTION : Récupérer le statut candidat d'une candidature
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
  v_current_stage text;
  v_status_label text;
  v_status_color text;
BEGIN
  -- Vérifier que c'est bien le candidat qui accède à sa propre candidature
  SELECT candidate_id INTO v_candidate_id
  FROM applications
  WHERE id = p_application_id;

  IF v_candidate_id != auth.uid() THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  -- Récupérer les informations de la candidature
  RETURN QUERY
  SELECT
    a.id AS application_id,
    j.title AS job_title,
    c.name AS company_name,
    a.applied_at,
    COALESCE(a.workflow_stage, a.status) AS current_status,
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
  JOIN jobs j ON j.id = a.job_id
  JOIN companies c ON c.id = j.company_id
  LEFT JOIN workflow_stages ws ON ws.stage_name = a.workflow_stage AND ws.company_id = c.id
  WHERE a.id = p_application_id
    AND a.candidate_id = auth.uid();
END;
$$;

-- ============================================================================
-- 3. FONCTION : Récupérer la timeline candidat
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

  -- Récupérer la timeline filtrée (sans infos internes)
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
      ELSE 'Mise à jour'
    END AS status_label,
    CASE
      WHEN at.event_type = 'application_created' THEN 'Candidature envoyée avec succès'
      WHEN at.event_type = 'status_change' AND at.new_value = 'reviewed' THEN 'Votre profil a été consulté'
      WHEN at.event_type = 'status_change' AND at.new_value = 'shortlisted' THEN 'Vous êtes présélectionné(e)'
      WHEN at.event_type = 'status_change' AND at.new_value = 'interview' THEN 'Entretien programmé'
      WHEN at.event_type = 'status_change' AND at.new_value = 'accepted' THEN 'Candidature acceptée'
      WHEN at.event_type = 'status_change' AND at.new_value = 'rejected' THEN 'Candidature non retenue'
      WHEN at.event_type = 'workflow_stage_change' THEN 'Changement d''étape de traitement'
      ELSE at.event_description
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
-- 4. TRIGGER : Créer événement timeline lors d'une candidature
-- ============================================================================

CREATE OR REPLACE FUNCTION track_application_created()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Créer un événement dans la timeline
  INSERT INTO application_timeline (
    application_id,
    event_type,
    event_description,
    new_value,
    user_id
  ) VALUES (
    NEW.id,
    'application_created',
    'Candidature envoyée',
    'pending',
    NEW.candidate_id
  );

  RETURN NEW;
END;
$$;

-- Créer le trigger si pas existant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_application_created_track'
  ) THEN
    CREATE TRIGGER on_application_created_track
      AFTER INSERT ON applications
      FOR EACH ROW
      EXECUTE FUNCTION track_application_created();
  END IF;
END $$;

-- ============================================================================
-- 5. TRIGGER : Notifications automatiques intelligentes
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
BEGIN
  -- Récupérer les infos du job
  SELECT j.title, c.name
  INTO v_job_title, v_company_name
  FROM jobs j
  JOIN companies c ON c.id = j.company_id
  WHERE j.id = NEW.job_id;

  -- Notifications uniquement pour les étapes importantes
  IF NEW.status IN ('shortlisted', 'interview', 'accepted', 'rejected')
     AND (OLD.status IS NULL OR OLD.status != NEW.status) THEN

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

  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger si pas existant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_application_status_notify_candidate'
  ) THEN
    CREATE TRIGGER on_application_status_notify_candidate
      AFTER UPDATE ON applications
      FOR EACH ROW
      WHEN (OLD.status IS DISTINCT FROM NEW.status)
      EXECUTE FUNCTION notify_candidate_on_status_change();
  END IF;
END $$;

-- ============================================================================
-- 6. RLS POLICIES
-- ============================================================================

-- Policy pour la fonction get_candidate_application_status
-- (déjà géré par SECURITY DEFINER + vérification auth.uid() dans la fonction)

-- Policy sur application_timeline pour lecture candidat
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'application_timeline'
    AND policyname = 'Candidates can view their own application timeline'
  ) THEN
    CREATE POLICY "Candidates can view their own application timeline"
      ON application_timeline FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM applications
          WHERE applications.id = application_timeline.application_id
            AND applications.candidate_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON FUNCTION get_candidate_application_status(uuid) IS
'Récupère le statut complet d''une candidature du point de vue candidat (sans données internes)';

COMMENT ON FUNCTION get_candidate_timeline(uuid) IS
'Récupère la timeline visible d''une candidature pour le candidat (filtrée)';

COMMENT ON FUNCTION notify_candidate_on_status_change() IS
'Envoie des notifications automatiques au candidat lors des changements de statut importants';

COMMENT ON FUNCTION track_application_created() IS
'Crée automatiquement un événement timeline lors de la création d''une candidature';
