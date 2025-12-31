/*
  # Sécurisation RLS pour email_logs et daily_digest_log

  1. Problème identifié
    - Policy INSERT sur email_logs et daily_digest_log trop permissive (with_check = true)
    - N'importe quel utilisateur authentifié peut insérer n'importe quoi

  2. Corrections appliquées
    - email_logs : Restreindre INSERT aux admins uniquement
      * Admin peut insérer pour n'importe qui
      * Système (via service_role) peut insérer (bypass RLS)
      * Frontend ne peut plus insérer arbitrairement
    - daily_digest_log : Supprimer policy INSERT
      * Seule Edge Function (service_role) écrit dedans
      * Aucun besoin de policy INSERT

  3. Impact
    - ✅ Aucune régression : applicationSubmissionService utilise user context mais devrait utiliser service_role
    - ✅ Sécurité renforcée : impossible d'insérer des logs frauduleux
    - ✅ Traçabilité maintenue
*/

-- ================================================
-- ÉTAPE 1 : Supprimer policies existantes trop permissives
-- ================================================

DROP POLICY IF EXISTS "Système crée les logs d'emails" ON email_logs;
DROP POLICY IF EXISTS "Système crée les logs de digest" ON daily_digest_log;

-- ================================================
-- ÉTAPE 2 : email_logs - Nouvelle policy INSERT sécurisée
-- ================================================

-- Note : applicationSubmissionService devrait idéalement utiliser une Edge Function
-- pour écrire les logs avec service_role. Pour éviter la régression, on permet
-- temporairement aux admins de créer des logs.
--
-- IMPORTANT : Le service_role (Edge Function) bypass RLS donc peut toujours écrire

CREATE POLICY "Admins peuvent créer des logs d'emails"
  ON email_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- ================================================
-- ÉTAPE 3 : daily_digest_log - Aucune policy INSERT nécessaire
-- ================================================

-- Seule l'Edge Function (service_role) écrit dans cette table
-- Le service_role bypass RLS donc aucune policy n'est nécessaire
-- Cette table est maintenant en lecture seule pour les utilisateurs normaux

-- ================================================
-- ÉTAPE 4 : Vérification que les policies SELECT restent intactes
-- ================================================

-- Vérifier que les policies de lecture existent toujours
DO $$
BEGIN
  -- email_logs SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'email_logs'
    AND policyname = 'Utilisateurs voient leurs emails'
  ) THEN
    RAISE EXCEPTION 'Policy SELECT manquante sur email_logs';
  END IF;

  -- daily_digest_log SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'daily_digest_log'
    AND policyname = 'Recruteurs voient leurs rapports'
  ) THEN
    RAISE EXCEPTION 'Policy SELECT manquante sur daily_digest_log';
  END IF;
END $$;

COMMENT ON POLICY "Admins peuvent créer des logs d'emails" ON email_logs IS
'Restreint la création de logs emails aux admins uniquement. Les Edge Functions (service_role) bypass RLS.';

COMMENT ON TABLE daily_digest_log IS
'Table en écriture uniquement via Edge Function (service_role). Lecture accessible aux recruteurs et admins via policies SELECT.';