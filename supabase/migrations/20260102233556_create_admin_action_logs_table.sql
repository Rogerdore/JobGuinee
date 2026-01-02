/*
  # Créer la table des logs d'actions admin

  1. Nouvelle table
    - `admin_action_logs`
      - `id` (uuid, primary key)
      - `admin_id` (uuid, référence vers profiles)
      - `action_type` (text, type d'action: credit_purchase, job_moderation, etc.)
      - `action` (text, action spécifique: validate, cancel, approve, reject)
      - `reference_id` (uuid, ID de l'entité concernée)
      - `details` (jsonb, détails supplémentaires)
      - `ip_address` (text, adresse IP de l'admin)
      - `user_agent` (text, navigateur utilisé)
      - `created_at` (timestamptz, date de l'action)

  2. Index
    - Index sur admin_id pour requêtes par admin
    - Index sur action_type pour filtrage
    - Index sur created_at pour tri chronologique
    - Index sur reference_id pour retrouver logs d'une entité

  3. Sécurité
    - RLS activé
    - Admins peuvent voir tous les logs
    - Système peut insérer des logs
    - AUCUNE suppression ou modification autorisée (immutabilité)
*/

-- Créer la table
CREATE TABLE IF NOT EXISTS admin_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action TEXT NOT NULL,
  reference_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin 
ON admin_action_logs(admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_logs_type 
ON admin_action_logs(action_type);

CREATE INDEX IF NOT EXISTS idx_admin_logs_date 
ON admin_action_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_logs_reference 
ON admin_action_logs(reference_id) 
WHERE reference_id IS NOT NULL;

-- Index composé pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_admin_logs_type_date 
ON admin_action_logs(action_type, created_at DESC);

-- Activer RLS
ALTER TABLE admin_action_logs ENABLE ROW LEVEL SECURITY;

-- Politique SELECT: Seuls les admins peuvent voir les logs
CREATE POLICY "Admins can view all logs"
  ON admin_action_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- Politique INSERT: Le système peut insérer des logs
CREATE POLICY "System can insert logs"
  ON admin_action_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- AUCUNE politique UPDATE/DELETE = immutabilité garantie

-- Commentaires pour documentation
COMMENT ON TABLE admin_action_logs IS 'Logs immuables de toutes les actions administratives pour audit et traçabilité';
COMMENT ON COLUMN admin_action_logs.action_type IS 'Type d''action: credit_purchase, job_moderation, user_management, etc.';
COMMENT ON COLUMN admin_action_logs.action IS 'Action spécifique: validate, cancel, approve, reject, create, update, delete';
COMMENT ON COLUMN admin_action_logs.reference_id IS 'UUID de l''entité concernée (credit_purchase.id, job.id, etc.)';
COMMENT ON COLUMN admin_action_logs.details IS 'Détails JSON: notes, ancien statut, nouveau statut, etc.';
