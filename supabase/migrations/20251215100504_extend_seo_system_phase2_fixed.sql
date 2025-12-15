/*
  # Extension Système SEO Phase 2 - JobGuinée
  
  ## Vue d'ensemble
  Extension du système SEO avec monitoring, analytics et tracking.
  
  ## Tables créées/modifiées
  
  1. **seo_keyword_rankings** - Historique des positions
  2. **seo_page_analytics** - Analytics par page
  3. **seo_internal_links** - Maillage interne
  4. **seo_generation_logs** - Logs de génération
  
  ## Fonctionnalités ajoutées
  - Suivi historique des positions Google
  - Analytics par page (impressions, clics, CTR)
  - Système de maillage interne intelligent
  - Logs de génération automatique
*/

-- ============================================================================
-- 1. SEO KEYWORD RANKINGS - Historique des positions
-- ============================================================================
CREATE TABLE IF NOT EXISTS seo_keyword_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Référence mot-clé
  keyword_id UUID REFERENCES seo_keywords(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  
  -- Position
  rank_position INTEGER NOT NULL,
  previous_position INTEGER,
  
  -- Métriques
  search_volume INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  
  -- Métadonnées
  url TEXT,
  page_title TEXT,
  
  -- Date du relevé
  recorded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_keyword_rankings_keyword ON seo_keyword_rankings(keyword_id);
CREATE INDEX IF NOT EXISTS idx_keyword_rankings_date ON seo_keyword_rankings(recorded_at DESC);

-- ============================================================================
-- 2. SEO PAGE ANALYTICS - Analytics par page
-- ============================================================================
CREATE TABLE IF NOT EXISTS seo_page_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Référence page
  page_path TEXT NOT NULL,
  
  -- Métriques SEO
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  average_position NUMERIC DEFAULT 0,
  
  -- Métriques engagement
  bounce_rate NUMERIC DEFAULT 0,
  avg_time_on_page INTEGER DEFAULT 0,
  
  -- Core Web Vitals
  lcp NUMERIC,
  fid NUMERIC,
  cls NUMERIC,
  
  -- Période
  date DATE NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(page_path, date)
);

CREATE INDEX IF NOT EXISTS idx_page_analytics_path ON seo_page_analytics(page_path);
CREATE INDEX IF NOT EXISTS idx_page_analytics_date ON seo_page_analytics(date DESC);

-- ============================================================================
-- 3. SEO INTERNAL LINKS - Maillage interne
-- ============================================================================
CREATE TABLE IF NOT EXISTS seo_internal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Pages source et destination
  source_page TEXT NOT NULL,
  target_page TEXT NOT NULL,
  
  -- Détails du lien
  anchor_text TEXT NOT NULL,
  link_type TEXT DEFAULT 'contextual' CHECK (link_type IN (
    'contextual', 'navigation', 'footer', 'related', 'breadcrumb'
  )),
  
  -- SEO
  is_dofollow BOOLEAN DEFAULT true,
  relevance_score NUMERIC DEFAULT 0.5,
  
  -- État
  is_active BOOLEAN DEFAULT true,
  is_broken BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  last_checked_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_internal_links_source ON seo_internal_links(source_page);
CREATE INDEX IF NOT EXISTS idx_internal_links_target ON seo_internal_links(target_page);
CREATE INDEX IF NOT EXISTS idx_internal_links_active ON seo_internal_links(is_active, is_broken);

-- ============================================================================
-- 4. SEO GENERATION LOGS - Logs de génération
-- ============================================================================
CREATE TABLE IF NOT EXISTS seo_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Type de génération
  generation_type TEXT NOT NULL CHECK (generation_type IN (
    'jobs', 'sectors', 'cities', 'blog', 'formations', 'sitemap', 'all'
  )),
  
  -- Résultats
  pages_created INTEGER DEFAULT 0,
  pages_updated INTEGER DEFAULT 0,
  pages_failed INTEGER DEFAULT 0,
  total_pages INTEGER DEFAULT 0,
  
  -- Détails
  details JSONB,
  errors JSONB,
  
  -- Durée
  duration_ms INTEGER,
  
  -- Utilisateur
  triggered_by UUID REFERENCES profiles(id),
  
  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed')),
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_generation_logs_type ON seo_generation_logs(generation_type);
CREATE INDEX IF NOT EXISTS idx_generation_logs_date ON seo_generation_logs(started_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE seo_keyword_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_page_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_internal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_generation_logs ENABLE ROW LEVEL SECURITY;

-- SEO KEYWORD RANKINGS - Admin only
CREATE POLICY "Admins can read keyword rankings"
  ON seo_keyword_rankings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage keyword rankings"
  ON seo_keyword_rankings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- SEO PAGE ANALYTICS - Admin only
CREATE POLICY "Admins can read page analytics"
  ON seo_page_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage page analytics"
  ON seo_page_analytics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- SEO INTERNAL LINKS - Public read active, admin manage
CREATE POLICY "Anyone can read active internal links"
  ON seo_internal_links FOR SELECT
  USING (is_active = true AND is_broken = false);

CREATE POLICY "Admins can manage internal links"
  ON seo_internal_links FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- SEO GENERATION LOGS - Admin only
CREATE POLICY "Admins can read generation logs"
  ON seo_generation_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage generation logs"
  ON seo_generation_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- ============================================================================
-- FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction pour calculer le CTR
CREATE OR REPLACE FUNCTION calculate_ctr(clicks INTEGER, impressions INTEGER)
RETURNS NUMERIC AS $$
BEGIN
  IF impressions = 0 THEN
    RETURN 0;
  END IF;
  RETURN ROUND((clicks::NUMERIC / impressions::NUMERIC) * 100, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour obtenir les tendances des mots-clés (7 derniers jours)
CREATE OR REPLACE FUNCTION get_keyword_trend(keyword_text TEXT)
RETURNS TABLE (
  date DATE,
  rank_position INTEGER,
  impressions INTEGER,
  clicks INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    recorded_at::DATE as date,
    kr.rank_position,
    kr.impressions,
    kr.clicks
  FROM seo_keyword_rankings kr
  WHERE kr.keyword = keyword_text
    AND kr.recorded_at >= CURRENT_DATE - INTERVAL '7 days'
  ORDER BY kr.recorded_at DESC;
END;
$$ LANGUAGE plpgsql;