/*
  # Complétion de la sécurité RLS pour le suivi candidat

  ## Objectif
  Ajouter les policies RLS manquantes pour garantir que :
  - Les candidats peuvent voir uniquement leurs propres candidatures
  - Les candidats peuvent voir uniquement leurs propres notifications
  - Aucune lecture croisée n'est possible
  - Les recruteurs conservent leurs accès existants

  ## Sécurité
  - Policies restrictives par défaut
  - Séparation stricte candidat/recruteur
  - Protection contre les lectures non autorisées

  ## Impact
  - Aucune régression sur l'existant
  - Amélioration de la sécurité globale
*/

-- ============================================================================
-- 1. POLICY SELECT pour applications (candidats)
-- ============================================================================

-- Supprimer et recréer la policy SELECT pour les candidats
DROP POLICY IF EXISTS "Candidates can view own applications" ON applications;

CREATE POLICY "Candidates can view own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (
    candidate_id = auth.uid()
  );

-- ============================================================================
-- 2. POLICY SELECT pour applications (recruteurs)
-- ============================================================================

-- Les recruteurs peuvent voir les candidatures pour leurs offres
DROP POLICY IF EXISTS "Recruiters can view applications for their jobs" ON applications;

CREATE POLICY "Recruiters can view applications for their jobs"
  ON applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN companies c ON c.id = j.company_id
      WHERE j.id = applications.job_id
        AND c.profile_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. POLICY UPDATE pour applications (recruteurs uniquement)
-- ============================================================================

-- Les recruteurs peuvent modifier les candidatures de leurs offres
DROP POLICY IF EXISTS "Recruiters can update applications for their jobs" ON applications;

CREATE POLICY "Recruiters can update applications for their jobs"
  ON applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN companies c ON c.id = j.company_id
      WHERE j.id = applications.job_id
        AND c.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN companies c ON c.id = j.company_id
      WHERE j.id = applications.job_id
        AND c.profile_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. POLICY SELECT pour notifications (candidats)
-- ============================================================================

-- Les candidats peuvent voir uniquement leurs propres notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 5. POLICY UPDATE pour notifications (candidats)
-- ============================================================================

-- Les candidats peuvent marquer leurs notifications comme lues
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 6. POLICY DELETE pour notifications (candidats)
-- ============================================================================

-- Les candidats peuvent supprimer leurs notifications
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 7. VÉRIFICATION : Enable RLS sur toutes les tables concernées
-- ============================================================================

-- S'assurer que RLS est activé
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_notification_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON POLICY "Candidates can view own applications" ON applications IS
'Les candidats voient uniquement leurs propres candidatures';

COMMENT ON POLICY "Recruiters can view applications for their jobs" ON applications IS
'Les recruteurs voient les candidatures pour leurs offres uniquement';

COMMENT ON POLICY "Recruiters can update applications for their jobs" ON applications IS
'Les recruteurs peuvent modifier uniquement les candidatures de leurs offres';

COMMENT ON POLICY "Users can view own notifications" ON notifications IS
'Les utilisateurs voient uniquement leurs propres notifications';

COMMENT ON POLICY "Users can update own notifications" ON notifications IS
'Les utilisateurs peuvent marquer leurs notifications comme lues';

COMMENT ON POLICY "Users can delete own notifications" ON notifications IS
'Les utilisateurs peuvent supprimer leurs propres notifications';
