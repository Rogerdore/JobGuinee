/*
  # Correction des Types de Notifications pour les Fonctions de Modération

  ## Problème
  Les fonctions `approve_job_with_validity`, `republish_job` et `mark_expired_jobs`
  utilisaient des types de notifications invalides qui violaient la contrainte
  `notifications_type_check`.

  ## Solution
  Mise à jour des fonctions pour utiliser les types valides:
  - 'success' pour les approbations et republications
  - 'info' pour les expirations

  ## Modifications
  - Correction de `approve_job_with_validity`
  - Correction de `republish_job`
  - Correction de `mark_expired_jobs`
*/

-- Fonction approve_job_with_validity corrigée
CREATE OR REPLACE FUNCTION approve_job_with_validity(
  p_job_id uuid,
  p_validity_days integer DEFAULT 30,
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
  v_expires_at timestamptz;
BEGIN
  v_admin_id := auth.uid();

  -- Vérifier que l'utilisateur est admin
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

  -- Valider la durée de validité
  IF p_validity_days IS NULL OR p_validity_days < 1 OR p_validity_days > 365 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'DUREE_INVALIDE',
      'message', 'La durée de validité doit être entre 1 et 365 jours'
    );
  END IF;

  -- Récupérer l'offre
  SELECT * INTO v_job_record
  FROM jobs
  WHERE id = p_job_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'OFFRE_NON_TROUVEE'
    );
  END IF;

  -- Récupérer l'email du recruteur
  SELECT email INTO v_recruiter_email
  FROM profiles
  WHERE id = v_job_record.user_id;

  -- Vérifier que l'offre est en attente
  IF v_job_record.status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'STATUT_INVALIDE',
      'message', 'Seules les offres en attente peuvent être approuvées'
    );
  END IF;

  -- Calculer la date d'expiration
  v_expires_at := now() + (p_validity_days || ' days')::interval;

  -- Mettre à jour l'offre
  UPDATE jobs
  SET
    status = 'published',
    published_at = now(),
    expires_at = v_expires_at,
    validity_days = p_validity_days,
    moderated_at = now(),
    moderated_by = v_admin_id,
    moderation_notes = p_notes,
    rejection_reason = NULL,
    updated_at = now()
  WHERE id = p_job_id;

  -- Ajouter à l'historique
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
    COALESCE(p_notes, '') || ' (Validité: ' || p_validity_days || ' jours, expire le ' || to_char(v_expires_at, 'DD/MM/YYYY') || ')'
  );

  -- Notifier le recruteur (type corrigé: 'success' au lieu de 'job_approved')
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
    'success',
    'Offre approuvée',
    'Votre offre "' || v_job_record.title || '" a été approuvée et est maintenant visible publiquement. Elle sera active pendant ' || p_validity_days || ' jours (jusqu''au ' || to_char(v_expires_at, 'DD/MM/YYYY') || ').',
    '/recruiter-dashboard?tab=jobs',
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'job_id', p_job_id,
    'status', 'published',
    'published_at', now(),
    'expires_at', v_expires_at,
    'validity_days', p_validity_days,
    'recruiter_email', v_recruiter_email
  );
END;
$$;

-- Fonction republish_job corrigée
CREATE OR REPLACE FUNCTION republish_job(
  p_job_id uuid,
  p_validity_days integer DEFAULT 30,
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
  v_expires_at timestamptz;
BEGIN
  v_admin_id := auth.uid();

  -- Vérifier que l'utilisateur est admin
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

  -- Valider la durée de validité
  IF p_validity_days IS NULL OR p_validity_days < 1 OR p_validity_days > 365 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'DUREE_INVALIDE',
      'message', 'La durée de validité doit être entre 1 et 365 jours'
    );
  END IF;

  -- Récupérer l'offre
  SELECT * INTO v_job_record
  FROM jobs
  WHERE id = p_job_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'OFFRE_NON_TROUVEE'
    );
  END IF;

  -- Récupérer l'email du recruteur
  SELECT email INTO v_recruiter_email
  FROM profiles
  WHERE id = v_job_record.user_id;

  -- Vérifier que l'offre peut être republiée (published ou closed)
  IF v_job_record.status NOT IN ('published', 'closed') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'STATUT_INVALIDE',
      'message', 'Seules les offres publiées ou fermées peuvent être republiées'
    );
  END IF;

  -- Calculer la nouvelle date d'expiration
  v_expires_at := now() + (p_validity_days || ' days')::interval;

  -- Mettre à jour l'offre
  UPDATE jobs
  SET
    status = 'published',
    published_at = now(),
    expires_at = v_expires_at,
    validity_days = p_validity_days,
    renewal_count = COALESCE(renewal_count, 0) + 1,
    moderated_at = now(),
    moderated_by = v_admin_id,
    moderation_notes = COALESCE(moderation_notes || ' | ', '') || COALESCE(p_notes, 'Republication'),
    updated_at = now()
  WHERE id = p_job_id;

  -- Ajouter à l'historique
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
    'republished',
    v_job_record.status,
    'published',
    COALESCE(p_notes, '') || ' (Renouvellement #' || (COALESCE(v_job_record.renewal_count, 0) + 1) || ', Validité: ' || p_validity_days || ' jours, expire le ' || to_char(v_expires_at, 'DD/MM/YYYY') || ')'
  );

  -- Notifier le recruteur (type corrigé: 'success' au lieu de 'job_republished')
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
    'success',
    'Offre republiée',
    'Votre offre "' || v_job_record.title || '" a été republiée et est à nouveau visible. Elle sera active pendant ' || p_validity_days || ' jours (jusqu''au ' || to_char(v_expires_at, 'DD/MM/YYYY') || ').',
    '/recruiter-dashboard?tab=jobs',
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'job_id', p_job_id,
    'status', 'published',
    'published_at', now(),
    'expires_at', v_expires_at,
    'validity_days', p_validity_days,
    'renewal_count', COALESCE(v_job_record.renewal_count, 0) + 1,
    'recruiter_email', v_recruiter_email
  );
END;
$$;

-- Fonction mark_expired_jobs corrigée
CREATE OR REPLACE FUNCTION mark_expired_jobs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expired_count integer;
BEGIN
  -- Marquer les offres expirées
  UPDATE jobs
  SET
    status = 'closed',
    updated_at = now()
  WHERE status = 'published'
    AND expires_at IS NOT NULL
    AND expires_at < now();

  GET DIAGNOSTICS v_expired_count = ROW_COUNT;

  -- Notifier les recruteurs des offres expirées (type corrigé: 'info' au lieu de 'job_expired')
  INSERT INTO notifications (user_id, type, title, message, link, created_at)
  SELECT
    j.user_id,
    'info',
    'Offre expirée',
    'Votre offre "' || j.title || '" a expiré et n''est plus visible publiquement. Contactez un administrateur pour la republier.',
    '/recruiter-dashboard?tab=jobs',
    now()
  FROM jobs j
  WHERE j.status = 'closed'
    AND j.updated_at >= now() - interval '1 minute';

  RETURN jsonb_build_object(
    'success', true,
    'expired_count', v_expired_count
  );
END;
$$;