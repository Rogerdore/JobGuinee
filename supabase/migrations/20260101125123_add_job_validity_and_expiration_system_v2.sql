/*
  # Système de Validité et Expiration des Offres d'Emploi

  ## Résumé
  Ajoute un système complet de gestion de la validité des offres avec:
  - Configuration de la durée de validité lors de l'approbation
  - Gestion automatique des expirations
  - Système de republication simplifié
  - Alertes d'expiration

  ## Modifications de la Table `jobs`

  1. **Nouveaux champs de validité**
     - `published_at` - Date de publication effective
     - `expires_at` - Date d'expiration calculée
     - `validity_days` - Durée de validité en jours (30 par défaut)
     - `auto_renewed` - Indique si l'offre a été renouvelée automatiquement

  ## Nouvelles Fonctions

  - `approve_job_with_validity` - Approuve avec durée personnalisée
  - `republish_job` - Republie une offre expirée
  - `get_expiring_jobs` - Liste des offres arrivant à expiration

  ## Avantages

  - Configuration flexible de la durée de validité
  - Republication en un clic pour les offres expirées
  - Traçabilité complète des renouvellements
  - Alertes automatiques avant expiration
*/

-- Étape 1: Ajouter les colonnes de validité et expiration
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS validity_days integer DEFAULT 30 CHECK (validity_days > 0 AND validity_days <= 365);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS auto_renewed boolean DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS renewal_count integer DEFAULT 0;

-- Créer un index pour les offres expirées
CREATE INDEX IF NOT EXISTS idx_jobs_expires_at ON jobs(expires_at) WHERE status = 'published';

-- Étape 2: Mettre à jour les offres existantes
UPDATE jobs
SET 
  published_at = updated_at,
  validity_days = 30,
  expires_at = updated_at + interval '30 days'
WHERE status = 'published' AND published_at IS NULL;

-- Étape 3: Fonction améliorée pour approuver avec durée de validité
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

  -- Notifier le recruteur
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

-- Étape 4: Fonction pour republier une offre
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

  -- Notifier le recruteur
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
    'job_republished',
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

-- Étape 5: Fonction pour obtenir les offres arrivant à expiration
CREATE OR REPLACE FUNCTION get_expiring_jobs(p_days_before integer DEFAULT 7)
RETURNS TABLE (
  job_id uuid,
  title text,
  expires_at timestamptz,
  days_remaining integer,
  recruiter_id uuid,
  recruiter_name text,
  recruiter_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.id AS job_id,
    j.title,
    j.expires_at,
    EXTRACT(days FROM (j.expires_at - now()))::integer AS days_remaining,
    j.user_id AS recruiter_id,
    p.full_name AS recruiter_name,
    p.email AS recruiter_email
  FROM jobs j
  INNER JOIN profiles p ON j.user_id = p.id
  WHERE j.status = 'published'
    AND j.expires_at IS NOT NULL
    AND j.expires_at <= now() + (p_days_before || ' days')::interval
    AND j.expires_at > now()
  ORDER BY j.expires_at ASC;
END;
$$;

-- Étape 6: Fonction pour marquer automatiquement les offres expirées
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

  -- Notifier les recruteurs des offres expirées
  INSERT INTO notifications (user_id, type, title, message, link, created_at)
  SELECT 
    j.user_id,
    'job_expired',
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

-- Étape 7: Mettre à jour la fonction approve_job pour qu'elle utilise la nouvelle fonction
CREATE OR REPLACE FUNCTION approve_job(
  p_job_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Appeler la nouvelle fonction avec la durée par défaut de 30 jours
  RETURN approve_job_with_validity(p_job_id, 30, p_notes);
END;
$$;
