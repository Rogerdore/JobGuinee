/*
  # Système de Badges URGENT et À LA UNE pour Offres d'Emploi

  ## Vue d'ensemble
  Implémente un système professionnel, monétisé et sécurisé de gestion des badges
  "URGENT" et "À LA UNE" sur les offres d'emploi avec validation administrative obligatoire.

  ## 1. Nouvelle Table: job_badge_requests
  
  Gestion des demandes de badges premium avec validation admin obligatoire.

  ## 2. Règles Métier

  ### Badge URGENT 🔴
  - Prix: 500 000 GNF | Durée: 7 jours
  - Affichage: Top 50 offres récentes
  - Validation admin obligatoire

  ### Badge À LA UNE ⚡
  - Prix: 500 000 GNF | Durée: 30 jours
  - Affichage: Top 100 offres récentes
  - Validation admin obligatoire

  ## 3. Sécurité
  - RLS stricte: Recruteurs (propres demandes) | Admins (toutes)
  - Validation obligatoire avant activation
  - Tracking complet paiements et activations
*/

-- ============================================================================
-- 1. CREATE TABLE job_badge_requests
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_badge_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  recruiter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,

  -- Badge details
  badge_type text NOT NULL CHECK (badge_type IN ('urgent', 'featured')),
  price_gnf integer NOT NULL DEFAULT 500000 CHECK (price_gnf > 0),
  duration_days integer NOT NULL CHECK (duration_days > 0),

  -- Status tracking
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'cancelled')),
  starts_at timestamptz,
  ends_at timestamptz,
  auto_renew boolean DEFAULT false,

  -- Approval tracking
  approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  rejection_reason text,

  -- Payment tracking
  payment_method text DEFAULT 'orange_money' CHECK (payment_method IN ('orange_money', 'mtn_money', 'credit_card', 'bank_transfer')),
  payment_reference text UNIQUE,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'waiting_proof', 'completed', 'failed', 'refunded')),
  payment_proof_url text,

  -- Admin management
  admin_notes text,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_job_badge_requests_job_id ON job_badge_requests(job_id);
CREATE INDEX IF NOT EXISTS idx_job_badge_requests_recruiter_id ON job_badge_requests(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_job_badge_requests_status ON job_badge_requests(status);
CREATE INDEX IF NOT EXISTS idx_job_badge_requests_badge_type ON job_badge_requests(badge_type);
CREATE INDEX IF NOT EXISTS idx_job_badge_requests_ends_at ON job_badge_requests(ends_at) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_job_badge_requests_company_id ON job_badge_requests(company_id);

COMMENT ON TABLE job_badge_requests IS 'Gestion des demandes de badges URGENT et À LA UNE avec validation admin obligatoire';

-- ============================================================================
-- 2. ENABLE RLS
-- ============================================================================

ALTER TABLE job_badge_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. RLS POLICIES
-- ============================================================================

CREATE POLICY "Recruiters can view own badge requests"
  ON job_badge_requests FOR SELECT TO authenticated
  USING (recruiter_id = auth.uid());

CREATE POLICY "Admins can view all badge requests"
  ON job_badge_requests FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Recruiters can create badge requests"
  ON job_badge_requests FOR INSERT TO authenticated
  WITH CHECK (
    recruiter_id = auth.uid() AND status = 'pending'
    AND EXISTS (
      SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all badge requests"
  ON job_badge_requests FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Recruiters can cancel pending badge requests"
  ON job_badge_requests FOR UPDATE TO authenticated
  USING (recruiter_id = auth.uid() AND status = 'pending')
  WITH CHECK (recruiter_id = auth.uid() AND status IN ('pending', 'cancelled'));

CREATE POLICY "Admins can delete badge requests"
  ON job_badge_requests FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin'
    )
  );

-- ============================================================================
-- 4. FUNCTION: Check Badge Eligibility
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_badge_eligibility(
  p_recruiter_id uuid,
  p_badge_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_premium boolean := false;
  v_has_enterprise boolean := false;
  v_active_badges_count integer := 0;
  v_max_badges integer := 0;
  v_can_request boolean := false;
  v_reason text := '';
BEGIN
  SELECT COALESCE(is_premium, false) AND COALESCE(premium_expiration > now(), false)
  INTO v_is_premium
  FROM profiles WHERE id = p_recruiter_id;

  SELECT COUNT(*) > 0 INTO v_has_enterprise
  FROM enterprise_subscriptions
  WHERE company_id IN (
    SELECT company_id FROM recruiter_profiles WHERE profile_id = p_recruiter_id
  ) AND status = 'active' AND (expires_at IS NULL OR expires_at > now());

  v_max_badges := CASE
    WHEN v_has_enterprise THEN 10
    WHEN v_is_premium THEN 5
    ELSE 2
  END;

  SELECT COUNT(*) INTO v_active_badges_count
  FROM job_badge_requests
  WHERE recruiter_id = p_recruiter_id
  AND badge_type = p_badge_type
  AND status = 'approved'
  AND ends_at > now();

  IF v_active_badges_count >= v_max_badges THEN
    v_can_request := false;
    v_reason := format('Limite de %s badges %s actifs atteinte (%s/%s)',
                       v_max_badges, p_badge_type, v_active_badges_count, v_max_badges);
  ELSE
    v_can_request := true;
    v_reason := format('Vous pouvez demander encore %s badge(s) %s',
                       v_max_badges - v_active_badges_count, p_badge_type);
  END IF;

  RETURN jsonb_build_object(
    'can_request', v_can_request,
    'reason', v_reason,
    'is_premium', v_is_premium,
    'has_enterprise', v_has_enterprise,
    'active_badges', v_active_badges_count,
    'max_badges', v_max_badges,
    'remaining', v_max_badges - v_active_badges_count
  );
END;
$$;

-- ============================================================================
-- 5. FUNCTION: Activate Job Badge (Admin only)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.activate_job_badge(
  p_request_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request job_badge_requests%ROWTYPE;
  v_start_date timestamptz;
  v_end_date timestamptz;
  v_is_admin boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'message', 'Accès non autorisé - Admin uniquement');
  END IF;

  SELECT * INTO v_request FROM job_badge_requests WHERE id = p_request_id;

  IF v_request.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Demande non trouvée');
  END IF;

  IF v_request.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'message', format('Demande déjà traitée (status: %s)', v_request.status));
  END IF;

  v_start_date := now();
  v_end_date := v_start_date + (v_request.duration_days || ' days')::interval;

  UPDATE job_badge_requests
  SET status = 'approved', starts_at = v_start_date, ends_at = v_end_date,
      approved_by = auth.uid(), approved_at = now(), payment_status = 'completed',
      admin_notes = COALESCE(admin_notes, '') || E'\n' || COALESCE(p_admin_notes, ''),
      updated_at = now()
  WHERE id = p_request_id;

  IF v_request.badge_type = 'urgent' THEN
    UPDATE jobs SET is_urgent = true, updated_at = now() WHERE id = v_request.job_id;
  ELSIF v_request.badge_type = 'featured' THEN
    UPDATE jobs SET is_featured = true, updated_at = now() WHERE id = v_request.job_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', format('Badge %s activé avec succès jusqu''au %s', v_request.badge_type, v_end_date),
    'starts_at', v_start_date, 'ends_at', v_end_date,
    'badge_type', v_request.badge_type, 'job_id', v_request.job_id
  );
END;
$$;

-- ============================================================================
-- 6. FUNCTION: Deactivate Job Badge
-- ============================================================================

CREATE OR REPLACE FUNCTION public.deactivate_job_badge(
  p_request_id uuid,
  p_reason text DEFAULT 'Expiration naturelle'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request job_badge_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_request FROM job_badge_requests WHERE id = p_request_id;

  IF v_request.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Demande non trouvée');
  END IF;

  IF v_request.status != 'approved' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Badge non actif');
  END IF;

  UPDATE job_badge_requests
  SET status = 'expired',
      admin_notes = COALESCE(admin_notes, '') || E'\n[' || to_char(now(), 'YYYY-MM-DD HH24:MI') || '] Badge désactivé: ' || p_reason,
      updated_at = now()
  WHERE id = p_request_id;

  IF NOT EXISTS (
    SELECT 1 FROM job_badge_requests
    WHERE job_id = v_request.job_id AND badge_type = v_request.badge_type
    AND status = 'approved' AND ends_at > now() AND id != p_request_id
  ) THEN
    IF v_request.badge_type = 'urgent' THEN
      UPDATE jobs SET is_urgent = false, updated_at = now() WHERE id = v_request.job_id;
    ELSIF v_request.badge_type = 'featured' THEN
      UPDATE jobs SET is_featured = false, updated_at = now() WHERE id = v_request.job_id;
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Badge désactivé avec succès',
                           'badge_type', v_request.badge_type, 'job_id', v_request.job_id);
END;
$$;

-- ============================================================================
-- 7. FUNCTION: Expire Job Badges (Cron)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.expire_job_badges()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expired_count integer := 0;
  v_request_record RECORD;
BEGIN
  FOR v_request_record IN
    SELECT id FROM job_badge_requests
    WHERE status = 'approved' AND ends_at <= now()
  LOOP
    PERFORM deactivate_job_badge(v_request_record.id, 'Expiration automatique');
    v_expired_count := v_expired_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', format('%s badge(s) expiré(s) désactivé(s)', v_expired_count),
    'expired_count', v_expired_count,
    'processed_at', now()
  );
END;
$$;

-- ============================================================================
-- 8. FUNCTION: Reject Badge Request (Admin only)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reject_badge_request(
  p_request_id uuid,
  p_rejection_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request job_badge_requests%ROWTYPE;
  v_is_admin boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'message', 'Accès non autorisé - Admin uniquement');
  END IF;

  SELECT * INTO v_request FROM job_badge_requests WHERE id = p_request_id;

  IF v_request.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Demande non trouvée');
  END IF;

  IF v_request.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'message', format('Demande déjà traitée (status: %s)', v_request.status));
  END IF;

  UPDATE job_badge_requests
  SET status = 'rejected', rejection_reason = p_rejection_reason,
      approved_by = auth.uid(), approved_at = now(), payment_status = 'refunded',
      admin_notes = COALESCE(admin_notes, '') || E'\n[' || to_char(now(), 'YYYY-MM-DD HH24:MI') || '] Demande rejetée: ' || p_rejection_reason,
      updated_at = now()
  WHERE id = p_request_id;

  RETURN jsonb_build_object('success', true, 'message', 'Demande rejetée avec succès',
                           'request_id', p_request_id, 'rejection_reason', p_rejection_reason);
END;
$$;

-- ============================================================================
-- 9. TRIGGER: Update timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_job_badge_requests_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_job_badge_requests_updated_at
  BEFORE UPDATE ON job_badge_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_job_badge_requests_updated_at();
