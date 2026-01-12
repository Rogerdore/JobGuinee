/*
  # Système de Tracking des Clics sur Offres d'Emploi

  1. Nouvelle Table
    - `job_clicks` - enregistre les clics sur les offres d'emploi provenant de sources tracées
    - Colonnes: id, job_id, source_network, clicked_at, ip_address, user_agent, user_id, session_id

  2. Sécurité
    - Enable RLS sur `job_clicks`
    - Policy pour permettre les INSERT publics (tracking)
    - Policy pour que les admins et recruteurs voient les stats

  3. Indexes
    - Index sur job_id
    - Index sur source_network
    - Index composite (job_id, source_network)
    - Index sur clicked_at pour les analytics temporelles
*/

CREATE TABLE IF NOT EXISTS job_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  source_network text CHECK (source_network IN ('facebook', 'linkedin', 'twitter', 'whatsapp', 'instagram', 'telegram', 'direct', 'unknown')),
  clicked_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  session_id text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE job_clicks ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut insérer (tracking public)
CREATE POLICY "Anyone can track clicks"
  ON job_clicks
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Les admins peuvent tout voir
CREATE POLICY "Admins can view all clicks"
  ON job_clicks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Policy: Les recruteurs peuvent voir les clics de leurs offres
CREATE POLICY "Recruiters can view clicks of their jobs"
  ON job_clicks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      JOIN companies ON jobs.company_id = companies.id
      JOIN profiles ON companies.profile_id = profiles.id
      WHERE jobs.id = job_clicks.job_id
      AND profiles.id = auth.uid()
      AND profiles.user_type = 'recruiter'
    )
  );

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_job_clicks_job_id
  ON job_clicks(job_id);

CREATE INDEX IF NOT EXISTS idx_job_clicks_source_network
  ON job_clicks(source_network);

CREATE INDEX IF NOT EXISTS idx_job_clicks_clicked_at
  ON job_clicks(clicked_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_clicks_job_network
  ON job_clicks(job_id, source_network);

-- Ajouter compteur de clics à la table jobs si n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'clicks_count'
  ) THEN
    ALTER TABLE jobs ADD COLUMN clicks_count integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Fonction pour mettre à jour le compteur de clics
CREATE OR REPLACE FUNCTION update_job_clicks_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE jobs
    SET clicks_count = COALESCE(clicks_count, 0) + 1
    WHERE id = NEW.job_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE jobs
    SET clicks_count = GREATEST(COALESCE(clicks_count, 0) - 1, 0)
    WHERE id = OLD.job_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger pour mettre à jour automatiquement le compteur
DROP TRIGGER IF EXISTS trigger_update_job_clicks_count ON job_clicks;
CREATE TRIGGER trigger_update_job_clicks_count
  AFTER INSERT OR DELETE ON job_clicks
  FOR EACH ROW
  EXECUTE FUNCTION update_job_clicks_count();

-- Fonction pour obtenir les statistiques de clics d'une offre
CREATE OR REPLACE FUNCTION get_job_click_stats(p_job_id uuid)
RETURNS TABLE (
  source_network text,
  click_count bigint,
  last_clicked_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    job_clicks.source_network,
    COUNT(*)::bigint as click_count,
    MAX(job_clicks.clicked_at) as last_clicked_at
  FROM job_clicks
  WHERE job_clicks.job_id = p_job_id
  GROUP BY job_clicks.source_network
  ORDER BY click_count DESC;
END;
$$;

-- Fonction pour calculer le CTR (Click-Through Rate) global
CREATE OR REPLACE FUNCTION get_global_social_stats(p_limit int DEFAULT 20)
RETURNS TABLE (
  job_id uuid,
  job_title text,
  company_name text,
  total_shares bigint,
  total_clicks bigint,
  ctr numeric,
  facebook_clicks bigint,
  linkedin_clicks bigint,
  twitter_clicks bigint,
  whatsapp_clicks bigint
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
    COALESCE(sss.total_shares, 0)::bigint as total_shares,
    COALESCE(jcs.total_clicks, 0)::bigint as total_clicks,
    CASE 
      WHEN COALESCE(sss.total_shares, 0) > 0 
      THEN ROUND((COALESCE(jcs.total_clicks, 0)::numeric / COALESCE(sss.total_shares, 1)) * 100, 2)
      ELSE 0
    END as ctr,
    COALESCE(jcs.facebook_clicks, 0)::bigint as facebook_clicks,
    COALESCE(jcs.linkedin_clicks, 0)::bigint as linkedin_clicks,
    COALESCE(jcs.twitter_clicks, 0)::bigint as twitter_clicks,
    COALESCE(jcs.whatsapp_clicks, 0)::bigint as whatsapp_clicks
  FROM jobs j
  LEFT JOIN companies c ON j.company_id = c.id
  LEFT JOIN (
    SELECT job_id, COUNT(*)::bigint as total_shares
    FROM social_share_analytics
    GROUP BY job_id
  ) sss ON j.id = sss.job_id
  LEFT JOIN (
    SELECT 
      job_id,
      COUNT(*)::bigint as total_clicks,
      COUNT(*) FILTER (WHERE source_network = 'facebook')::bigint as facebook_clicks,
      COUNT(*) FILTER (WHERE source_network = 'linkedin')::bigint as linkedin_clicks,
      COUNT(*) FILTER (WHERE source_network = 'twitter')::bigint as twitter_clicks,
      COUNT(*) FILTER (WHERE source_network = 'whatsapp')::bigint as whatsapp_clicks
    FROM job_clicks
    GROUP BY job_id
  ) jcs ON j.id = jcs.job_id
  WHERE j.status = 'published'
  ORDER BY COALESCE(jcs.total_clicks, 0) DESC
  LIMIT p_limit;
END;
$$;

-- Commentaires pour la documentation
COMMENT ON TABLE job_clicks IS 'Tracking des clics sur les offres d''emploi provenant de sources tracées';
COMMENT ON COLUMN job_clicks.source_network IS 'Source du clic: facebook, linkedin, twitter, whatsapp, instagram, telegram, direct, unknown';
COMMENT ON COLUMN job_clicks.session_id IS 'ID de session pour tracker les utilisateurs anonymes';
COMMENT ON FUNCTION get_job_click_stats IS 'Obtient les statistiques de clics pour une offre spécifique par source';
COMMENT ON FUNCTION get_global_social_stats IS 'Retourne les stats globales (shares + clicks + CTR) pour les offres les plus engageantes';