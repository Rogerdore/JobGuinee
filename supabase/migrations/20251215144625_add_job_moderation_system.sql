/*
  # Système de Modération des Offres d'Emploi

  ## Résumé
  Implémente un système complet de modération pour les offres d'emploi avec validation manuelle par les administrateurs.

  ## Modifications de la Table `jobs`

  1. **Statut 'pending' ajouté**
     - Les nouvelles offres sont créées avec status = 'pending'
     - Statuts disponibles: 'draft', 'pending', 'published', 'rejected', 'closed'

  2. **Nouveaux champs de modération**
     - `submitted_at` - Date de soumission pour modération
     - `moderated_at` - Date de la décision de modération
     - `moderated_by` - Admin qui a modéré l'offre
     - `rejection_reason` - Raison du rejet si applicable
     - `moderation_notes` - Notes internes de l'admin

  ## Nouvelle Table: `job_moderation_history`

  Historique complet de toutes les actions de modération:
  - Actions d'approbation/rejet
  - Changements de statut
  - Traçabilité complète pour audit

  ## Politiques de Sécurité (RLS)

  - Seuls les admins peuvent voir les offres 'pending' et 'rejected'
  - Seuls les admins peuvent approuver/rejeter des offres
  - Les recruteurs voient leurs offres (tous statuts)
  - Le public voit uniquement les offres 'published'

  ## Fonctions

  - `approve_job(job_id, admin_id, notes)` - Approuve une offre
  - `reject_job(job_id, admin_id, reason, notes)` - Rejette une offre
  - `submit_job_for_moderation(job_id)` - Soumet une offre draft pour modération
*/

-- Étape 1: Modifier la contrainte CHECK sur jobs.status
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check
  CHECK (status IN ('draft', 'pending', 'published', 'rejected', 'closed'));

-- Étape 2: Ajouter les colonnes de modération
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS submitted_at timestamptz;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS moderated_at timestamptz;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES profiles(id);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS moderation_notes text;

-- Étape 3: Créer la table d'historique de modération
CREATE TABLE IF NOT EXISTS job_moderation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  moderator_id uuid REFERENCES profiles(id) ON DELETE SET NULL,

  action text NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected', 'republished')),
  previous_status text,
  new_status text NOT NULL,

  reason text,
  notes text,

  created_at timestamptz DEFAULT now() NOT NULL
);

-- Créer les index pour performance
CREATE INDEX IF NOT EXISTS idx_jobs_status_pending ON jobs(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_jobs_submitted_at ON jobs(submitted_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_job_moderation_history_job_id ON job_moderation_history(job_id);
CREATE INDEX IF NOT EXISTS idx_job_moderation_history_moderator_id ON job_moderation_history(moderator_id);

-- Étape 4: Activer RLS sur la table d'historique
ALTER TABLE job_moderation_history ENABLE ROW LEVEL SECURITY;

-- Étape 5: Politiques RLS pour job_moderation_history

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all moderation history"
  ON job_moderation_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Les recruteurs voient l'historique de leurs offres
CREATE POLICY "Recruiters can view own job moderation history"
  ON job_moderation_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_moderation_history.job_id
      AND jobs.user_id = auth.uid()
    )
  );

-- Seuls les admins peuvent insérer dans l'historique
CREATE POLICY "Admins can insert moderation history"
  ON job_moderation_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Étape 6: Mettre à jour les politiques RLS de la table jobs

-- Supprimer l'ancienne politique de lecture publique
DROP POLICY IF EXISTS "Anyone can view published jobs" ON jobs;

-- Nouvelle politique: le public voit uniquement les offres published
CREATE POLICY "Public can view published jobs"
  ON jobs FOR SELECT
  USING (status = 'published');

-- Les admins voient toutes les offres
DROP POLICY IF EXISTS "Admins can view all jobs" ON jobs;
CREATE POLICY "Admins can view all jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Les recruteurs voient leurs propres offres (tous statuts)
DROP POLICY IF EXISTS "Recruiters can view own jobs" ON jobs;
CREATE POLICY "Recruiters can view own jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Les recruteurs peuvent créer des offres (automatiquement en pending)
DROP POLICY IF EXISTS "Recruiters can create jobs" ON jobs;
CREATE POLICY "Recruiters can create jobs"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type IN ('recruiter', 'admin')
    )
  );

-- Les recruteurs peuvent modifier leurs offres draft ou rejected
DROP POLICY IF EXISTS "Recruiters can update own draft jobs" ON jobs;
CREATE POLICY "Recruiters can update own draft or rejected jobs"
  ON jobs FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND status IN ('draft', 'rejected')
  )
  WITH CHECK (user_id = auth.uid());

-- Les admins peuvent modifier toutes les offres
DROP POLICY IF EXISTS "Admins can update all jobs" ON jobs;
CREATE POLICY "Admins can update all jobs"
  ON jobs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Étape 7: Fonction pour soumettre une offre à la modération
CREATE OR REPLACE FUNCTION submit_job_for_moderation(p_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_record jobs;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'NON_AUTHENTIFIE'
    );
  END IF;

  SELECT * INTO v_job_record
  FROM jobs
  WHERE id = p_job_id
    AND user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'OFFRE_NON_TROUVEE'
    );
  END IF;

  IF v_job_record.status NOT IN ('draft', 'rejected') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'STATUT_INVALIDE',
      'message', 'Seules les offres en brouillon ou rejetées peuvent être soumises'
    );
  END IF;

  UPDATE jobs
  SET
    status = 'pending',
    submitted_at = now(),
    updated_at = now()
  WHERE id = p_job_id;

  INSERT INTO job_moderation_history (job_id, moderator_id, action, previous_status, new_status)
  VALUES (p_job_id, NULL, 'submitted', v_job_record.status, 'pending');

  RETURN jsonb_build_object(
    'success', true,
    'job_id', p_job_id,
    'status', 'pending'
  );
END;
$$;

-- Étape 8: Fonction pour approuver une offre
CREATE OR REPLACE FUNCTION approve_job(
  p_job_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid;
  v_job_record jobs;
  v_recruiter_email text;
BEGIN
  v_admin_id := auth.uid();

  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = v_admin_id
    AND user_type = 'admin'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'NON_AUTORISE'
    );
  END IF;

  SELECT * INTO v_job_record
  FROM jobs
  WHERE id = p_job_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'OFFRE_NON_TROUVEE'
    );
  END IF;

  SELECT email INTO v_recruiter_email
  FROM profiles
  WHERE id = v_job_record.user_id;

  IF v_job_record.status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'STATUT_INVALIDE',
      'message', 'Seules les offres en attente peuvent être approuvées'
    );
  END IF;

  UPDATE jobs
  SET
    status = 'published',
    moderated_at = now(),
    moderated_by = v_admin_id,
    moderation_notes = p_notes,
    rejection_reason = NULL,
    updated_at = now()
  WHERE id = p_job_id;

  INSERT INTO job_moderation_history (
    job_id,
    moderator_id,
    action,
    previous_status,
    new_status,
    notes
  )
  VALUES (
    p_job_id,
    v_admin_id,
    'approved',
    'pending',
    'published',
    p_notes
  );

  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    link,
    created_at
  )
  VALUES (
    v_job_record.user_id,
    'job_approved',
    'Offre approuvée',
    'Votre offre "' || v_job_record.title || '" a été approuvée et est maintenant visible publiquement.',
    '/recruiter-dashboard?tab=jobs',
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'job_id', p_job_id,
    'status', 'published',
    'recruiter_email', v_recruiter_email
  );
END;
$$;

-- Étape 9: Fonction pour rejeter une offre
CREATE OR REPLACE FUNCTION reject_job(
  p_job_id uuid,
  p_reason text,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid;
  v_job_record jobs;
  v_recruiter_email text;
BEGIN
  v_admin_id := auth.uid();

  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = v_admin_id
    AND user_type = 'admin'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'NON_AUTORISE'
    );
  END IF;

  IF p_reason IS NULL OR p_reason = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'RAISON_REQUISE',
      'message', 'Une raison de rejet est requise'
    );
  END IF;

  SELECT * INTO v_job_record
  FROM jobs
  WHERE id = p_job_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'OFFRE_NON_TROUVEE'
    );
  END IF;

  SELECT email INTO v_recruiter_email
  FROM profiles
  WHERE id = v_job_record.user_id;

  IF v_job_record.status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'STATUT_INVALIDE',
      'message', 'Seules les offres en attente peuvent être rejetées'
    );
  END IF;

  UPDATE jobs
  SET
    status = 'rejected',
    moderated_at = now(),
    moderated_by = v_admin_id,
    rejection_reason = p_reason,
    moderation_notes = p_notes,
    updated_at = now()
  WHERE id = p_job_id;

  INSERT INTO job_moderation_history (
    job_id,
    moderator_id,
    action,
    previous_status,
    new_status,
    reason,
    notes
  )
  VALUES (
    p_job_id,
    v_admin_id,
    'rejected',
    'pending',
    'rejected',
    p_reason,
    p_notes
  );

  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    link,
    created_at
  )
  VALUES (
    v_job_record.user_id,
    'job_rejected',
    'Offre rejetée',
    'Votre offre "' || v_job_record.title || '" a été rejetée. Raison: ' || p_reason,
    '/recruiter-dashboard?tab=jobs',
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'job_id', p_job_id,
    'status', 'rejected',
    'recruiter_email', v_recruiter_email
  );
END;
$$;