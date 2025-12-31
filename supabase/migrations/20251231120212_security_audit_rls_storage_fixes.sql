/*
  # Audit de Sécurité JobGuinée V6 - Étape 1/6
  
  ## Vue d'ensemble
  Cette migration corrige tous les problèmes de sécurité identifiés lors de l'audit complet:
  - Activation RLS sur tables manquantes
  - Ajout de policies admin manquantes
  - Amélioration des policies Storage
  - Création de la table de traçabilité download_logs
  - Correction des policies pour candidate_documents
  
  ## Tables modifiées
  1. **ia_service_templates** - Activation RLS + policies
  2. **ia_service_templates_history** - Activation RLS + policies
  3. **download_logs** (nouvelle) - Traçabilité des téléchargements
  4. **candidate_documents** - Ajout policies admin et recruteur
  5. **Storage policies** - Amélioration accès recruteurs
  
  ## Sécurité
  - RLS activé sur toutes les tables sensibles
  - Admins ont accès complet en lecture/écriture
  - Recruteurs accèdent aux documents via applications
  - Candidats accèdent uniquement à leurs documents
  - Traçabilité complète des téléchargements
*/

-- =====================================================
-- 1. ACTIVER RLS SUR LES TABLES MANQUANTES
-- =====================================================

-- Activer RLS sur ia_service_templates
ALTER TABLE ia_service_templates ENABLE ROW LEVEL SECURITY;

-- Activer RLS sur ia_service_templates_history
ALTER TABLE ia_service_templates_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. CRÉER LA TABLE DOWNLOAD_LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS download_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE,
  candidate_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  file_path text NOT NULL,
  bucket_name text NOT NULL,
  action text NOT NULL CHECK (action IN ('download', 'view', 'preview')),
  user_type text,
  ip_address inet,
  user_agent text,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_download_logs_user_id ON download_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_application_id ON download_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_candidate_id ON download_logs(candidate_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_created_at ON download_logs(created_at DESC);

-- Activer RLS
ALTER TABLE download_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins voient tous les logs
CREATE POLICY "Admins can view all download logs"
  ON download_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Policy: Users voient leurs propres logs
CREATE POLICY "Users can view own download logs"
  ON download_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: System peut insérer (service backend)
CREATE POLICY "Authenticated users can create download logs"
  ON download_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 3. POLICIES POUR IA_SERVICE_TEMPLATES
-- =====================================================

-- Admins peuvent tout voir
CREATE POLICY "Admins can view all IA templates"
  ON ia_service_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Tous peuvent voir les templates actifs
CREATE POLICY "Users can view active IA templates"
  ON ia_service_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins peuvent créer
CREATE POLICY "Admins can insert IA templates"
  ON ia_service_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Admins peuvent modifier
CREATE POLICY "Admins can update IA templates"
  ON ia_service_templates FOR UPDATE
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

-- Admins peuvent supprimer
CREATE POLICY "Admins can delete IA templates"
  ON ia_service_templates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- 4. POLICIES POUR IA_SERVICE_TEMPLATES_HISTORY
-- =====================================================

-- Admins seulement peuvent voir l'historique
CREATE POLICY "Admins can view IA templates history"
  ON ia_service_templates_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- System peut insérer dans l'historique
CREATE POLICY "System can insert IA templates history"
  ON ia_service_templates_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- 5. AMÉLIORER LES POLICIES CANDIDATE_DOCUMENTS
-- =====================================================

-- Admins peuvent voir tous les documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'candidate_documents'
    AND policyname = 'Admins can view all documents'
  ) THEN
    CREATE POLICY "Admins can view all documents"
      ON candidate_documents FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.user_type = 'admin'
        )
      );
  END IF;
END $$;

-- Recruteurs peuvent voir documents des candidatures reçues
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'candidate_documents'
    AND policyname = 'Recruiters can view documents from applications'
  ) THEN
    CREATE POLICY "Recruiters can view documents from applications"
      ON candidate_documents FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM applications app
          JOIN jobs j ON j.id = app.job_id
          JOIN companies c ON c.id = j.company_id
          WHERE app.candidate_id = candidate_documents.candidate_id
          AND c.profile_id = auth.uid()
        )
      );
  END IF;
END $$;

-- =====================================================
-- 6. AMÉLIORER LES POLICIES STORAGE
-- =====================================================

-- Recruteurs peuvent lire les CVs des candidats qui ont postulé
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Recruiters can read CVs from applications'
  ) THEN
    CREATE POLICY "Recruiters can read CVs from applications"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'candidate-cvs'
        AND EXISTS (
          SELECT 1
          FROM applications app
          JOIN jobs j ON j.id = app.job_id
          JOIN companies c ON c.id = j.company_id
          JOIN profiles p ON p.id = c.profile_id
          WHERE p.id = auth.uid()
          AND (storage.foldername(name))[1] = app.candidate_id::text
        )
      );
  END IF;
END $$;

-- Recruteurs peuvent lire les lettres de motivation des candidats qui ont postulé
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Recruiters can read cover letters from applications'
  ) THEN
    CREATE POLICY "Recruiters can read cover letters from applications"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'candidate-cover-letters'
        AND EXISTS (
          SELECT 1
          FROM applications app
          JOIN jobs j ON j.id = app.job_id
          JOIN companies c ON c.id = j.company_id
          JOIN profiles p ON p.id = c.profile_id
          WHERE p.id = auth.uid()
          AND (storage.foldername(name))[1] = app.candidate_id::text
        )
      );
  END IF;
END $$;

-- Recruteurs peuvent lire les certificats des candidats qui ont postulé
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Recruiters can read certificates from applications'
  ) THEN
    CREATE POLICY "Recruiters can read certificates from applications"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'candidate-certificates'
        AND EXISTS (
          SELECT 1
          FROM applications app
          JOIN jobs j ON j.id = app.job_id
          JOIN companies c ON c.id = j.company_id
          JOIN profiles p ON p.id = c.profile_id
          WHERE p.id = auth.uid()
          AND (storage.foldername(name))[1] = app.candidate_id::text
        )
      );
  END IF;
END $$;

-- Admins peuvent lire tous les documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Admins can read all candidate documents'
  ) THEN
    CREATE POLICY "Admins can read all candidate documents"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id IN ('candidate-cvs', 'candidate-cover-letters', 'candidate-certificates')
        AND EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.user_type = 'admin'
        )
      );
  END IF;
END $$;

-- =====================================================
-- 7. FONCTION HELPER POUR SIGNED URLS
-- =====================================================

-- Fonction pour vérifier si un utilisateur peut accéder à un document
CREATE OR REPLACE FUNCTION can_access_candidate_document(
  p_bucket_name text,
  p_file_path text,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_candidate_id uuid;
  v_user_type text;
  v_can_access boolean := false;
BEGIN
  -- Récupérer le type d'utilisateur
  SELECT user_type INTO v_user_type
  FROM profiles
  WHERE id = p_user_id;
  
  -- Admin a toujours accès
  IF v_user_type = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Extraire l'ID du candidat du chemin du fichier
  v_candidate_id := (string_to_array(p_file_path, '/'))[1]::uuid;
  
  -- Le candidat a accès à ses propres documents
  IF v_candidate_id = p_user_id THEN
    RETURN true;
  END IF;
  
  -- Vérifier si le recruteur a accès via une application
  IF v_user_type = 'recruiter' THEN
    SELECT EXISTS (
      SELECT 1
      FROM applications app
      JOIN jobs j ON j.id = app.job_id
      JOIN companies c ON c.id = j.company_id
      WHERE app.candidate_id = v_candidate_id
      AND c.profile_id = p_user_id
    ) INTO v_can_access;
    
    RETURN v_can_access;
  END IF;
  
  RETURN false;
END;
$$;

-- =====================================================
-- 8. COMMENTAIRES ET DOCUMENTATION
-- =====================================================

COMMENT ON TABLE download_logs IS 'Traçabilité complète de tous les téléchargements et consultations de documents candidats';
COMMENT ON COLUMN download_logs.action IS 'Type d''action: download (téléchargement), view (consultation en ligne), preview (prévisualisation)';
COMMENT ON COLUMN download_logs.success IS 'Indique si l''action s''est déroulée avec succès';
COMMENT ON FUNCTION can_access_candidate_document IS 'Vérifie si un utilisateur a le droit d''accéder à un document candidat spécifique';
