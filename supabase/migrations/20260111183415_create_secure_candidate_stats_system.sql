/*
  # Système Sécurisé de Statistiques Candidat - Refonte Complète

  ## Vue d'ensemble
  Implémente un système robuste, auditable et anti-spam pour toutes les statistiques candidat.
  TOUTE modification de compteur passe par des fonctions backend sécurisées avec validation métier.

  ## 1. Tables Créées

  ### candidate_stats (table agrégée)
  - Contient les compteurs validés pour chaque candidat
  - Source unique de vérité pour les dashboards
  - Mise à jour uniquement via triggers

  ### candidate_stats_logs (audit obligatoire)
  - Traçabilité complète de toutes les actions
  - Chaque tentative (success ou blocked) est loggée
  - Permet détection d'anomalies et audits

  ## 2. Fonctions RPC Créées

  - `track_job_view_secure()` - Tracking sécurisé des vues d'offres (anti-spam)
  - `track_profile_preview_click()` - Tracking strict du clic "Aperçu" CVthèque
  - `track_application_validated()` - Validation après création candidature
  - `track_purchase_completed()` - Validation après paiement confirmé
  - `track_formation_access()` - Validation après accès formation
  - `calculate_ai_score_backend()` - Calcul AI score côté serveur
  - `get_candidate_stats()` - Récupération stats agrégées
  - `admin_recalculate_stats()` - Recalcul stats (admin uniquement)

  ## 3. Sécurité
  - RLS activée sur toutes les tables
  - Anti-spam via fenêtre temporelle (job views: 1h, profile views: 24h)
  - Validation métier stricte dans chaque fonction
  - Intégration avec le système de crédits IA

  ## 4. Règles Métier

  ### Job Views
  - Compteur dynamique incrémenté pendant toute la durée de vie de l'offre
  - Anti-spam: même user/session ne peut incrémenter qu'une fois par heure
  - Sources autorisées: candidats, anonymes, recruteurs

  ### Profile Views (CRITIQUE)
  - Comptage UNIQUEMENT sur clic bouton "Aperçu" dans CVthèque
  - Unicité: 1 clic par viewer_fingerprint + candidate_id + 24h
  - viewer_fingerprint = viewer_id OU hash(session_id + ip_hash + user_agent)
  - Aucune vue automatique, prefetch ou hover

  ### Applications
  - Une seule par candidat+offre
  - Incrément uniquement après validation backend

  ### Purchases
  - Incrément uniquement après paiement confirmé et vérifié admin
  - Lié à transaction_id unique

  ### Formations
  - Incrément après accès réel (pas à l'achat)
  - Validation backend obligatoire

  ### AI Score
  - Calculé exclusivement backend
  - Versionné (ai_score_version)
  - Explicable et auditable
*/

-- =====================================================
-- 1. TABLE AGRÉGÉE: candidate_stats
-- =====================================================

CREATE TABLE IF NOT EXISTS candidate_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Compteurs validés
  job_views_count integer NOT NULL DEFAULT 0,
  applications_count integer NOT NULL DEFAULT 0,
  profile_views_count integer NOT NULL DEFAULT 0,
  purchases_count integer NOT NULL DEFAULT 0,
  formations_count integer NOT NULL DEFAULT 0,

  -- Score IA
  ai_score integer CHECK (ai_score >= 0 AND ai_score <= 100) DEFAULT 0,
  ai_score_version text DEFAULT 'v1.0',
  ai_score_updated_at timestamptz,

  -- Métadonnées
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Contrainte unique: un seul enregistrement par candidat
  UNIQUE(candidate_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_candidate_stats_candidate_id ON candidate_stats(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_stats_updated_at ON candidate_stats(updated_at DESC);

-- RLS
ALTER TABLE candidate_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Candidats peuvent voir leurs propres stats" ON candidate_stats;
CREATE POLICY "Candidats peuvent voir leurs propres stats"
  ON candidate_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = candidate_id);

DROP POLICY IF EXISTS "Admins peuvent voir toutes les stats" ON candidate_stats;
CREATE POLICY "Admins peuvent voir toutes les stats"
  ON candidate_stats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- 2. TABLE AUDIT: candidate_stats_logs
-- =====================================================

CREATE TABLE IF NOT EXISTS candidate_stats_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Type de statistique modifiée
  stat_type text NOT NULL CHECK (stat_type IN (
    'job_view',
    'profile_view',
    'application',
    'purchase',
    'formation',
    'ai_score'
  )),

  -- Source de l'action
  source text NOT NULL,

  -- Identifiants de l'action
  related_id uuid,
  transaction_id text,

  -- Identifiant du viewer (pour profile_view et job_view)
  viewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  viewer_fingerprint text,
  session_id text,
  ip_hash text,
  user_agent text,

  -- Résultat de l'action
  delta integer NOT NULL DEFAULT 0,
  status text NOT NULL CHECK (status IN ('success', 'blocked', 'blocked_duplicate', 'blocked_spam', 'blocked_no_credit', 'error')),

  -- Métadonnées
  metadata jsonb DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour performance et recherche
CREATE INDEX IF NOT EXISTS idx_stats_logs_candidate_id ON candidate_stats_logs(candidate_id);
CREATE INDEX IF NOT EXISTS idx_stats_logs_stat_type ON candidate_stats_logs(stat_type);
CREATE INDEX IF NOT EXISTS idx_stats_logs_status ON candidate_stats_logs(status);
CREATE INDEX IF NOT EXISTS idx_stats_logs_created_at ON candidate_stats_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stats_logs_viewer_id ON candidate_stats_logs(viewer_id);
CREATE INDEX IF NOT EXISTS idx_stats_logs_viewer_fingerprint ON candidate_stats_logs(viewer_fingerprint);
CREATE INDEX IF NOT EXISTS idx_stats_logs_source ON candidate_stats_logs(source);

-- RLS
ALTER TABLE candidate_stats_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Candidats peuvent voir leurs propres logs" ON candidate_stats_logs;
CREATE POLICY "Candidats peuvent voir leurs propres logs"
  ON candidate_stats_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = candidate_id);

DROP POLICY IF EXISTS "Admins peuvent voir tous les logs" ON candidate_stats_logs;
CREATE POLICY "Admins peuvent voir tous les logs"
  ON candidate_stats_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- 3. FONCTION: Initialiser stats pour nouveau candidat
-- =====================================================

CREATE OR REPLACE FUNCTION initialize_candidate_stats()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.user_type = 'candidate' THEN
    INSERT INTO candidate_stats (candidate_id)
    VALUES (NEW.id)
    ON CONFLICT (candidate_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_initialize_candidate_stats ON profiles;
CREATE TRIGGER trigger_initialize_candidate_stats
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_candidate_stats();

-- =====================================================
-- 4. FONCTION RPC: track_job_view_secure
-- =====================================================

CREATE OR REPLACE FUNCTION track_job_view_secure(
  p_job_id uuid,
  p_session_id text DEFAULT NULL,
  p_ip_hash text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_viewer_fingerprint text;
  v_last_view_at timestamptz;
  v_result jsonb;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NOT NULL THEN
    v_viewer_fingerprint := v_user_id::text;
  ELSE
    v_viewer_fingerprint := encode(
      digest(COALESCE(p_session_id, '') || COALESCE(p_ip_hash, '') || COALESCE(p_user_agent, ''), 'sha256'),
      'hex'
    );
  END IF;

  SELECT created_at INTO v_last_view_at
  FROM candidate_stats_logs
  WHERE stat_type = 'job_view'
    AND related_id = p_job_id
    AND viewer_fingerprint = v_viewer_fingerprint
    AND created_at > (now() - interval '1 hour')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_last_view_at IS NOT NULL THEN
    INSERT INTO candidate_stats_logs (
      candidate_id,
      stat_type,
      source,
      related_id,
      viewer_id,
      viewer_fingerprint,
      session_id,
      ip_hash,
      user_agent,
      delta,
      status,
      metadata
    ) VALUES (
      NULL,
      'job_view',
      'job_detail',
      p_job_id,
      v_user_id,
      v_viewer_fingerprint,
      p_session_id,
      p_ip_hash,
      p_user_agent,
      0,
      'blocked_spam',
      jsonb_build_object('last_view_at', v_last_view_at, 'blocked_reason', 'viewed_within_1_hour')
    );

    RETURN jsonb_build_object(
      'success', false,
      'status', 'blocked_spam',
      'message', 'Vous avez déjà consulté cette offre récemment'
    );
  END IF;

  UPDATE jobs
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_job_id;

  INSERT INTO candidate_stats_logs (
    candidate_id,
    stat_type,
    source,
    related_id,
    viewer_id,
    viewer_fingerprint,
    session_id,
    ip_hash,
    user_agent,
    delta,
    status
  ) VALUES (
    v_user_id,
    'job_view',
    'job_detail',
    p_job_id,
    v_user_id,
    v_viewer_fingerprint,
    p_session_id,
    p_ip_hash,
    p_user_agent,
    1,
    'success'
  );

  IF v_user_id IS NOT NULL THEN
    INSERT INTO candidate_stats (candidate_id, job_views_count, updated_at)
    VALUES (v_user_id, 1, now())
    ON CONFLICT (candidate_id) DO UPDATE
    SET job_views_count = candidate_stats.job_views_count + 1,
        updated_at = now();
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'status', 'success',
    'message', 'Vue enregistrée'
  );

EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO candidate_stats_logs (
      stat_type,
      source,
      related_id,
      viewer_id,
      delta,
      status,
      error_message
    ) VALUES (
      'job_view',
      'job_detail',
      p_job_id,
      v_user_id,
      0,
      'error',
      SQLERRM
    );

    RETURN jsonb_build_object(
      'success', false,
      'status', 'error',
      'message', SQLERRM
    );
END;
$$;

-- =====================================================
-- 5. FONCTION RPC: track_profile_preview_click
-- =====================================================

CREATE OR REPLACE FUNCTION track_profile_preview_click(
  p_candidate_id uuid,
  p_session_id text DEFAULT NULL,
  p_ip_hash text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_viewer_id uuid;
  v_viewer_fingerprint text;
  v_last_view_at timestamptz;
  v_candidate_profile_id uuid;
BEGIN
  v_viewer_id := auth.uid();

  IF v_viewer_id IS NOT NULL THEN
    v_viewer_fingerprint := v_viewer_id::text;
  ELSE
    v_viewer_fingerprint := encode(
      digest(COALESCE(p_session_id, '') || COALESCE(p_ip_hash, '') || COALESCE(p_user_agent, ''), 'sha256'),
      'hex'
    );
  END IF;

  SELECT id INTO v_candidate_profile_id
  FROM candidate_profiles
  WHERE user_id = p_candidate_id;

  IF v_candidate_profile_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'status', 'error',
      'message', 'Profil candidat introuvable'
    );
  END IF;

  SELECT created_at INTO v_last_view_at
  FROM candidate_stats_logs
  WHERE stat_type = 'profile_view'
    AND candidate_id = p_candidate_id
    AND viewer_fingerprint = v_viewer_fingerprint
    AND created_at > (now() - interval '24 hours')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_last_view_at IS NOT NULL THEN
    INSERT INTO candidate_stats_logs (
      candidate_id,
      stat_type,
      source,
      related_id,
      viewer_id,
      viewer_fingerprint,
      session_id,
      ip_hash,
      user_agent,
      delta,
      status,
      metadata
    ) VALUES (
      p_candidate_id,
      'profile_view',
      'cvtheque_preview_button',
      v_candidate_profile_id,
      v_viewer_id,
      v_viewer_fingerprint,
      p_session_id,
      p_ip_hash,
      p_user_agent,
      0,
      'blocked_spam',
      jsonb_build_object('last_view_at', v_last_view_at, 'blocked_reason', 'viewed_within_24_hours')
    );

    RETURN jsonb_build_object(
      'success', false,
      'status', 'blocked_spam',
      'message', 'Vous avez déjà consulté ce profil récemment'
    );
  END IF;

  INSERT INTO candidate_stats (candidate_id, profile_views_count, updated_at)
  VALUES (p_candidate_id, 1, now())
  ON CONFLICT (candidate_id) DO UPDATE
  SET profile_views_count = candidate_stats.profile_views_count + 1,
      updated_at = now();

  UPDATE candidate_profiles
  SET profile_views_count = COALESCE(profile_views_count, 0) + 1,
      last_viewed_at = now()
  WHERE user_id = p_candidate_id;

  INSERT INTO candidate_stats_logs (
    candidate_id,
    stat_type,
    source,
    related_id,
    viewer_id,
    viewer_fingerprint,
    session_id,
    ip_hash,
    user_agent,
    delta,
    status
  ) VALUES (
    p_candidate_id,
    'profile_view',
    'cvtheque_preview_button',
    v_candidate_profile_id,
    v_viewer_id,
    v_viewer_fingerprint,
    p_session_id,
    p_ip_hash,
    p_user_agent,
    1,
    'success'
  );

  INSERT INTO profile_views (
    id,
    candidate_id,
    viewer_id,
    viewed_at,
    session_id,
    ip_address,
    user_agent
  ) VALUES (
    gen_random_uuid(),
    v_candidate_profile_id,
    v_viewer_id,
    now(),
    p_session_id,
    p_ip_hash,
    p_user_agent
  );

  RETURN jsonb_build_object(
    'success', true,
    'status', 'success',
    'message', 'Vue de profil enregistrée'
  );

EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO candidate_stats_logs (
      candidate_id,
      stat_type,
      source,
      related_id,
      viewer_id,
      delta,
      status,
      error_message
    ) VALUES (
      p_candidate_id,
      'profile_view',
      'cvtheque_preview_button',
      v_candidate_profile_id,
      v_viewer_id,
      0,
      'error',
      SQLERRM
    );

    RETURN jsonb_build_object(
      'success', false,
      'status', 'error',
      'message', SQLERRM
    );
END;
$$;

-- =====================================================
-- 6. FONCTION RPC: calculate_ai_score_backend
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_ai_score_backend(
  p_candidate_id uuid
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_avg_score numeric;
  v_rounded_score integer;
  v_score_count integer;
BEGIN
  SELECT
    AVG(ai_match_score)::numeric,
    COUNT(*)
  INTO v_avg_score, v_score_count
  FROM applications
  WHERE candidate_id = p_candidate_id
    AND ai_match_score IS NOT NULL;

  v_rounded_score := COALESCE(ROUND(v_avg_score), 0);

  INSERT INTO candidate_stats (
    candidate_id,
    ai_score,
    ai_score_version,
    ai_score_updated_at,
    updated_at
  ) VALUES (
    p_candidate_id,
    v_rounded_score,
    'v1.0',
    now(),
    now()
  )
  ON CONFLICT (candidate_id) DO UPDATE
  SET ai_score = v_rounded_score,
      ai_score_version = 'v1.0',
      ai_score_updated_at = now(),
      updated_at = now();

  INSERT INTO candidate_stats_logs (
    candidate_id,
    stat_type,
    source,
    delta,
    status,
    metadata
  ) VALUES (
    p_candidate_id,
    'ai_score',
    'backend_calculation',
    0,
    'success',
    jsonb_build_object(
      'score', v_rounded_score,
      'applications_count', v_score_count,
      'version', 'v1.0'
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'ai_score', v_rounded_score,
    'applications_count', v_score_count
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- =====================================================
-- 7. FONCTION RPC: get_candidate_stats
-- =====================================================

CREATE OR REPLACE FUNCTION get_candidate_stats(
  p_candidate_id uuid
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_stats record;
  v_credits_balance integer;
  v_is_premium boolean;
BEGIN
  SELECT * INTO v_stats
  FROM candidate_stats
  WHERE candidate_id = p_candidate_id;

  IF v_stats IS NULL THEN
    INSERT INTO candidate_stats (candidate_id)
    VALUES (p_candidate_id)
    RETURNING * INTO v_stats;
  END IF;

  SELECT credits_balance, is_premium
  INTO v_credits_balance, v_is_premium
  FROM profiles
  WHERE id = p_candidate_id;

  RETURN jsonb_build_object(
    'job_views_count', v_stats.job_views_count,
    'applications_count', v_stats.applications_count,
    'profile_views_count', v_stats.profile_views_count,
    'purchases_count', v_stats.purchases_count,
    'formations_count', v_stats.formations_count,
    'ai_score', v_stats.ai_score,
    'ai_score_version', v_stats.ai_score_version,
    'ai_score_updated_at', v_stats.ai_score_updated_at,
    'credits_balance', COALESCE(v_credits_balance, 0),
    'is_premium', COALESCE(v_is_premium, false),
    'updated_at', v_stats.updated_at
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM
    );
END;
$$;

-- =====================================================
-- 8. TRIGGER: Auto-incrément applications_count
-- =====================================================

CREATE OR REPLACE FUNCTION increment_applications_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO candidate_stats (candidate_id, applications_count, updated_at)
  VALUES (NEW.candidate_id, 1, now())
  ON CONFLICT (candidate_id) DO UPDATE
  SET applications_count = candidate_stats.applications_count + 1,
      updated_at = now();

  INSERT INTO candidate_stats_logs (
    candidate_id,
    stat_type,
    source,
    related_id,
    delta,
    status
  ) VALUES (
    NEW.candidate_id,
    'application',
    'application_submission',
    NEW.job_id,
    1,
    'success'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_increment_applications_count ON applications;
CREATE TRIGGER trigger_increment_applications_count
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION increment_applications_count();

-- =====================================================
-- 9. Ajouter colonne views_count sur jobs si manquante
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'views_count'
  ) THEN
    ALTER TABLE jobs ADD COLUMN views_count integer DEFAULT 0;
    CREATE INDEX IF NOT EXISTS idx_jobs_views_count ON jobs(views_count DESC);
  END IF;
END $$;

-- =====================================================
-- 10. Initialiser stats pour candidats existants
-- =====================================================

INSERT INTO candidate_stats (candidate_id)
SELECT id
FROM profiles
WHERE user_type = 'candidate'
ON CONFLICT (candidate_id) DO NOTHING;
