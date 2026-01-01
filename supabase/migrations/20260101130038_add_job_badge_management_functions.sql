/*
  # Fonctions de Gestion des Badges d'Offres

  ## Résumé
  Ajoute des fonctions pour gérer les badges "URGENT" et "À LA UNE" directement depuis la modération

  ## Nouvelles Fonctions
  - `update_job_badges` - Met à jour les badges d'une offre
  - `approve_job_with_badges` - Approuve une offre avec badges configurés
  - `get_badge_stats` - Statistiques des badges actifs

  ## Avantages
  - Gestion centralisée des badges
  - Configuration lors de l'approbation
  - Traçabilité dans l'historique
*/

-- Fonction pour mettre à jour les badges d'une offre
CREATE OR REPLACE FUNCTION update_job_badges(
  p_job_id uuid,
  p_is_urgent boolean DEFAULT false,
  p_is_featured boolean DEFAULT false,
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
  v_changes text[];
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

  -- Préparer le message de changement
  v_changes := ARRAY[]::text[];
  
  IF v_job_record.is_urgent != p_is_urgent THEN
    v_changes := array_append(v_changes, 
      CASE WHEN p_is_urgent THEN 'Badge URGENT activé' ELSE 'Badge URGENT désactivé' END
    );
  END IF;
  
  IF v_job_record.is_featured != p_is_featured THEN
    v_changes := array_append(v_changes, 
      CASE WHEN p_is_featured THEN 'Badge À LA UNE activé' ELSE 'Badge À LA UNE désactivé' END
    );
  END IF;

  -- Mettre à jour les badges
  UPDATE jobs
  SET
    is_urgent = p_is_urgent,
    is_featured = p_is_featured,
    updated_at = now()
  WHERE id = p_job_id;

  -- Ajouter à l'historique si des changements ont été effectués
  IF array_length(v_changes, 1) > 0 THEN
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
      'badges_updated',
      v_job_record.status,
      v_job_record.status,
      array_to_string(v_changes, ', ') || COALESCE('. ' || p_notes, '')
    );

    -- Notifier le recruteur si l'offre est publiée
    IF v_job_record.status = 'published' THEN
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
        'job_badges_updated',
        'Badges mis à jour',
        'Les badges de votre offre "' || v_job_record.title || '" ont été mis à jour: ' || array_to_string(v_changes, ', '),
        '/recruiter-dashboard?tab=jobs',
        now()
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'job_id', p_job_id,
    'is_urgent', p_is_urgent,
    'is_featured', p_is_featured,
    'changes', v_changes
  );
END;
$$;

-- Fonction pour approuver avec badges et durée en une seule action
CREATE OR REPLACE FUNCTION approve_job_with_badges_and_validity(
  p_job_id uuid,
  p_validity_days integer DEFAULT 30,
  p_is_urgent boolean DEFAULT false,
  p_is_featured boolean DEFAULT false,
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
  v_badges text[];
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

  -- Préparer la liste des badges
  v_badges := ARRAY[]::text[];
  IF p_is_urgent THEN
    v_badges := array_append(v_badges, 'URGENT');
  END IF;
  IF p_is_featured THEN
    v_badges := array_append(v_badges, 'À LA UNE');
  END IF;

  -- Mettre à jour l'offre avec badges
  UPDATE jobs
  SET
    status = 'published',
    published_at = now(),
    expires_at = v_expires_at,
    validity_days = p_validity_days,
    is_urgent = p_is_urgent,
    is_featured = p_is_featured,
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
    COALESCE(p_notes, '') || 
    ' (Validité: ' || p_validity_days || ' jours, expire le ' || to_char(v_expires_at, 'DD/MM/YYYY') || ')' ||
    CASE WHEN array_length(v_badges, 1) > 0 THEN ' - Badges: ' || array_to_string(v_badges, ', ') ELSE '' END
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
    'Votre offre "' || v_job_record.title || '" a été approuvée et est maintenant visible publiquement. Elle sera active pendant ' || p_validity_days || ' jours (jusqu''au ' || to_char(v_expires_at, 'DD/MM/YYYY') || ').' ||
    CASE WHEN array_length(v_badges, 1) > 0 THEN ' Badges activés: ' || array_to_string(v_badges, ', ') || '.' ELSE '' END,
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
    'is_urgent', p_is_urgent,
    'is_featured', p_is_featured,
    'recruiter_email', v_recruiter_email
  );
END;
$$;

-- Fonction pour obtenir les statistiques des badges
CREATE OR REPLACE FUNCTION get_badge_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'urgent_count', COUNT(*) FILTER (WHERE is_urgent AND status = 'published'),
    'featured_count', COUNT(*) FILTER (WHERE is_featured AND status = 'published'),
    'both_count', COUNT(*) FILTER (WHERE is_urgent AND is_featured AND status = 'published'),
    'total_published', COUNT(*) FILTER (WHERE status = 'published')
  )
  INTO v_result
  FROM jobs;

  RETURN v_result;
END;
$$;

-- Ajouter l'action 'badges_updated' dans la contrainte de l'historique
ALTER TABLE job_moderation_history DROP CONSTRAINT IF EXISTS job_moderation_history_action_check;
ALTER TABLE job_moderation_history ADD CONSTRAINT job_moderation_history_action_check
  CHECK (action IN ('submitted', 'approved', 'rejected', 'republished', 'badges_updated'));
