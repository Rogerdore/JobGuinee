/*
  # Système de Tracking des Partages Sociaux

  1. Nouvelle Table
    - `social_share_analytics`
      - `id` (uuid, primary key)
      - `job_id` (uuid, référence jobs)
      - `user_id` (uuid, référence profiles - nullable pour partages anonymes)
      - `platform` (text) - facebook, linkedin, twitter, whatsapp
      - `shared_at` (timestamptz)
      - `ip_address` (text, nullable)
      - `user_agent` (text, nullable)
      - `created_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur `social_share_analytics`
    - Policies pour permettre les INSERT publics
    - Policies pour les stats (admin et recruteurs)

  3. Indexes
    - Index sur job_id pour requêtes rapides
    - Index sur platform pour analytics
    - Index composite sur (job_id, platform)
*/

-- Créer la table social_share_analytics
CREATE TABLE IF NOT EXISTS social_share_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  platform text NOT NULL CHECK (platform IN ('facebook', 'linkedin', 'twitter', 'whatsapp')),
  shared_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE social_share_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut insérer (tracking public)
CREATE POLICY "Anyone can track shares"
  ON social_share_analytics
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Les utilisateurs peuvent voir leurs propres partages
CREATE POLICY "Users can view own shares"
  ON social_share_analytics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Les admins peuvent tout voir
CREATE POLICY "Admins can view all shares"
  ON social_share_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Policy: Les recruteurs peuvent voir les partages de leurs offres
CREATE POLICY "Recruiters can view shares of their jobs"
  ON social_share_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      JOIN companies ON jobs.company_id = companies.id
      JOIN profiles ON companies.profile_id = profiles.id
      WHERE jobs.id = social_share_analytics.job_id
      AND profiles.id = auth.uid()
      AND profiles.user_type = 'recruiter'
    )
  );

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_social_share_analytics_job_id
  ON social_share_analytics(job_id);

CREATE INDEX IF NOT EXISTS idx_social_share_analytics_platform
  ON social_share_analytics(platform);

CREATE INDEX IF NOT EXISTS idx_social_share_analytics_shared_at
  ON social_share_analytics(shared_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_share_analytics_job_platform
  ON social_share_analytics(job_id, platform);

-- Fonction pour obtenir les statistiques de partage d'une offre
CREATE OR REPLACE FUNCTION get_job_share_stats(p_job_id uuid)
RETURNS TABLE (
  platform text,
  share_count bigint,
  last_shared_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    social_share_analytics.platform,
    COUNT(*)::bigint as share_count,
    MAX(social_share_analytics.shared_at) as last_shared_at
  FROM social_share_analytics
  WHERE social_share_analytics.job_id = p_job_id
  GROUP BY social_share_analytics.platform
  ORDER BY share_count DESC;
END;
$$;

-- Fonction pour obtenir les offres les plus partagées
CREATE OR REPLACE FUNCTION get_most_shared_jobs(p_limit int DEFAULT 10)
RETURNS TABLE (
  job_id uuid,
  job_title text,
  company_name text,
  total_shares bigint,
  facebook_shares bigint,
  linkedin_shares bigint,
  twitter_shares bigint,
  whatsapp_shares bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.id as job_id,
    j.title as job_title,
    COALESCE(c.name, j.company_name) as company_name,
    COUNT(*)::bigint as total_shares,
    COUNT(*) FILTER (WHERE s.platform = 'facebook')::bigint as facebook_shares,
    COUNT(*) FILTER (WHERE s.platform = 'linkedin')::bigint as linkedin_shares,
    COUNT(*) FILTER (WHERE s.platform = 'twitter')::bigint as twitter_shares,
    COUNT(*) FILTER (WHERE s.platform = 'whatsapp')::bigint as whatsapp_shares
  FROM social_share_analytics s
  JOIN jobs j ON s.job_id = j.id
  LEFT JOIN companies c ON j.company_id = c.id
  WHERE j.status = 'published'
  GROUP BY j.id, j.title, c.name, j.company_name
  ORDER BY total_shares DESC
  LIMIT p_limit;
END;
$$;

-- Ajouter un compteur de partages à la table jobs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'shares_count'
  ) THEN
    ALTER TABLE jobs ADD COLUMN shares_count integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Fonction pour mettre à jour le compteur de partages
CREATE OR REPLACE FUNCTION update_job_shares_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE jobs
    SET shares_count = COALESCE(shares_count, 0) + 1
    WHERE id = NEW.job_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE jobs
    SET shares_count = GREATEST(COALESCE(shares_count, 0) - 1, 0)
    WHERE id = OLD.job_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger pour mettre à jour automatiquement le compteur
DROP TRIGGER IF EXISTS trigger_update_job_shares_count ON social_share_analytics;
CREATE TRIGGER trigger_update_job_shares_count
  AFTER INSERT OR DELETE ON social_share_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_job_shares_count();

-- Commentaires pour la documentation
COMMENT ON TABLE social_share_analytics IS 'Tracking des partages sociaux des offres d''emploi';
COMMENT ON COLUMN social_share_analytics.platform IS 'Plateforme de partage: facebook, linkedin, twitter, whatsapp';
COMMENT ON COLUMN social_share_analytics.user_id IS 'ID utilisateur (nullable pour partages anonymes)';
COMMENT ON COLUMN social_share_analytics.ip_address IS 'Adresse IP pour prévenir le spam (optionnel)';
COMMENT ON FUNCTION get_job_share_stats IS 'Obtient les statistiques de partage pour une offre spécifique';
COMMENT ON FUNCTION get_most_shared_jobs IS 'Retourne les offres les plus partagées';