/*
  # Extension Système SEO Phase 3 - IA & Intelligence - JobGuinée
  
  ## Vue d'ensemble
  Phase 3 avec IA sémantique, A/B testing, scoring avancé et optimisation continue.
  
  ## Tables créées/modifiées
  
  1. **seo_ab_tests** - Tests A/B des meta tags
  2. **seo_ab_variants** - Variantes testées
  3. **seo_ab_results** - Résultats des tests
  4. **seo_page_scores** - Scores SEO par page
  5. **seo_optimization_suggestions** - Suggestions d'amélioration
  6. **seo_content_ideas** - Idées de contenu générées par IA
  
  ## Fonctionnalités ajoutées
  - A/B testing automatique des meta tags
  - Scoring SEO complet (0-100)
  - Suggestions d'optimisation par IA
  - Génération d'idées de contenu
  - Analytics avancés
*/

-- ============================================================================
-- 1. SEO A/B TESTS - Tests A/B des meta tags
-- ============================================================================
CREATE TABLE IF NOT EXISTS seo_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Test info
  test_name TEXT NOT NULL,
  page_path TEXT NOT NULL,
  
  -- Type de test
  test_type TEXT NOT NULL CHECK (test_type IN (
    'title', 'description', 'keywords', 'full_meta'
  )),
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'running', 'completed', 'paused', 'cancelled'
  )),
  
  -- Configuration
  traffic_split INTEGER DEFAULT 50 CHECK (traffic_split BETWEEN 0 AND 100),
  duration_days INTEGER DEFAULT 14,
  min_sample_size INTEGER DEFAULT 100,
  
  -- Résultats
  winner_variant UUID,
  confidence_level NUMERIC DEFAULT 0,
  
  -- Métadonnées
  created_by UUID REFERENCES profiles(id),
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ab_tests_page ON seo_ab_tests(page_path);
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON seo_ab_tests(status);

-- ============================================================================
-- 2. SEO A/B VARIANTS - Variantes testées
-- ============================================================================
CREATE TABLE IF NOT EXISTS seo_ab_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Référence test
  test_id UUID REFERENCES seo_ab_tests(id) ON DELETE CASCADE,
  
  -- Variante
  variant_name TEXT NOT NULL,
  is_control BOOLEAN DEFAULT false,
  
  -- Contenu
  title TEXT,
  description TEXT,
  keywords TEXT[],
  
  -- Métriques
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ab_variants_test ON seo_ab_variants(test_id);

-- ============================================================================
-- 3. SEO A/B RESULTS - Résultats des tests
-- ============================================================================
CREATE TABLE IF NOT EXISTS seo_ab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Référence
  test_id UUID REFERENCES seo_ab_tests(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES seo_ab_variants(id) ON DELETE CASCADE,
  
  -- Métriques journalières
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  avg_position NUMERIC DEFAULT 0,
  
  -- Engagement
  bounce_rate NUMERIC DEFAULT 0,
  time_on_page INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(test_id, variant_id, date)
);

CREATE INDEX IF NOT EXISTS idx_ab_results_test ON seo_ab_results(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_results_date ON seo_ab_results(date DESC);

-- ============================================================================
-- 4. SEO PAGE SCORES - Scores SEO par page
-- ============================================================================
CREATE TABLE IF NOT EXISTS seo_page_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Page
  page_path TEXT NOT NULL,
  
  -- Scores (0-100)
  overall_score INTEGER DEFAULT 0,
  technical_score INTEGER DEFAULT 0,
  content_score INTEGER DEFAULT 0,
  onpage_score INTEGER DEFAULT 0,
  offpage_score INTEGER DEFAULT 0,
  
  -- Détails
  strengths TEXT[],
  weaknesses TEXT[],
  opportunities TEXT[],
  threats TEXT[],
  
  -- Issues
  critical_issues INTEGER DEFAULT 0,
  warnings INTEGER DEFAULT 0,
  suggestions INTEGER DEFAULT 0,
  
  -- Audit info
  last_audited_at TIMESTAMPTZ DEFAULT now(),
  audited_by UUID REFERENCES profiles(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(page_path, last_audited_at)
);

CREATE INDEX IF NOT EXISTS idx_page_scores_path ON seo_page_scores(page_path);
CREATE INDEX IF NOT EXISTS idx_page_scores_overall ON seo_page_scores(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_page_scores_date ON seo_page_scores(last_audited_at DESC);

-- ============================================================================
-- 5. SEO OPTIMIZATION SUGGESTIONS - Suggestions d'amélioration
-- ============================================================================
CREATE TABLE IF NOT EXISTS seo_optimization_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Page concernée
  page_path TEXT NOT NULL,
  
  -- Suggestion
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Impact et effort
  impact_score INTEGER DEFAULT 5 CHECK (impact_score BETWEEN 1 AND 10),
  effort_score INTEGER DEFAULT 5 CHECK (effort_score BETWEEN 1 AND 10),
  roi_score NUMERIC GENERATED ALWAYS AS (impact_score::NUMERIC / effort_score::NUMERIC) STORED,
  
  -- Catégorie
  category TEXT CHECK (category IN (
    'technical', 'content', 'performance', 'security', 'ux', 'other'
  )),
  
  -- État
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'dismissed'
  )),
  
  -- Métadonnées
  generated_by TEXT DEFAULT 'ai',
  applied_at TIMESTAMPTZ,
  applied_by UUID REFERENCES profiles(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_opt_suggestions_page ON seo_optimization_suggestions(page_path);
CREATE INDEX IF NOT EXISTS idx_opt_suggestions_priority ON seo_optimization_suggestions(priority);
CREATE INDEX IF NOT EXISTS idx_opt_suggestions_roi ON seo_optimization_suggestions(roi_score DESC);
CREATE INDEX IF NOT EXISTS idx_opt_suggestions_status ON seo_optimization_suggestions(status);

-- ============================================================================
-- 6. SEO CONTENT IDEAS - Idées de contenu générées par IA
-- ============================================================================
CREATE TABLE IF NOT EXISTS seo_content_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Idée
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT CHECK (content_type IN (
    'blog', 'job', 'formation', 'guide', 'faq', 'landing_page'
  )),
  
  -- Mots-clés ciblés
  target_keywords TEXT[],
  estimated_volume INTEGER DEFAULT 0,
  estimated_difficulty INTEGER DEFAULT 50,
  
  -- Potentiel
  opportunity_score INTEGER DEFAULT 50 CHECK (opportunity_score BETWEEN 0 AND 100),
  
  -- Outline
  suggested_h2 TEXT[],
  content_outline TEXT[],
  
  -- État
  status TEXT DEFAULT 'idea' CHECK (status IN (
    'idea', 'planned', 'in_progress', 'published', 'rejected'
  )),
  
  -- Liens
  published_url TEXT,
  
  -- Métadonnées
  generated_by TEXT DEFAULT 'ai',
  assigned_to UUID REFERENCES profiles(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_ideas_status ON seo_content_ideas(status);
CREATE INDEX IF NOT EXISTS idx_content_ideas_score ON seo_content_ideas(opportunity_score DESC);
CREATE INDEX IF NOT EXISTS idx_content_ideas_type ON seo_content_ideas(content_type);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE seo_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_ab_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_ab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_page_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_optimization_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_content_ideas ENABLE ROW LEVEL SECURITY;

-- Admins can manage everything
CREATE POLICY "Admins can manage ab tests"
  ON seo_ab_tests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage ab variants"
  ON seo_ab_variants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage ab results"
  ON seo_ab_results FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage page scores"
  ON seo_page_scores FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage optimization suggestions"
  ON seo_optimization_suggestions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage content ideas"
  ON seo_content_ideas FOR ALL
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

-- Fonction pour calculer le CTR d'une variante
CREATE OR REPLACE FUNCTION calculate_variant_ctr(variant_id_param UUID)
RETURNS NUMERIC AS $$
DECLARE
  total_impressions INTEGER;
  total_clicks INTEGER;
BEGIN
  SELECT 
    COALESCE(SUM(impressions), 0),
    COALESCE(SUM(clicks), 0)
  INTO total_impressions, total_clicks
  FROM seo_ab_results
  WHERE variant_id = variant_id_param;
  
  IF total_impressions = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((total_clicks::NUMERIC / total_impressions::NUMERIC) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour déterminer le gagnant d'un test A/B
CREATE OR REPLACE FUNCTION determine_ab_winner(test_id_param UUID)
RETURNS UUID AS $$
DECLARE
  winner_id UUID;
BEGIN
  SELECT variant_id INTO winner_id
  FROM seo_ab_results
  WHERE test_id = test_id_param
  GROUP BY variant_id
  ORDER BY 
    SUM(clicks)::NUMERIC / NULLIF(SUM(impressions), 0) DESC,
    SUM(clicks) DESC
  LIMIT 1;
  
  RETURN winner_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les quick wins (ROI élevé)
CREATE OR REPLACE FUNCTION get_seo_quick_wins(limit_param INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  page_path TEXT,
  title TEXT,
  description TEXT,
  priority TEXT,
  roi_score NUMERIC,
  impact_score INTEGER,
  effort_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.page_path,
    s.title,
    s.description,
    s.priority,
    s.roi_score,
    s.impact_score,
    s.effort_score
  FROM seo_optimization_suggestions s
  WHERE s.status = 'pending'
    AND s.priority IN ('critical', 'high')
  ORDER BY s.roi_score DESC, s.priority
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le CTR automatiquement
CREATE OR REPLACE FUNCTION update_variant_ctr()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE seo_ab_variants
  SET 
    impressions = (
      SELECT COALESCE(SUM(impressions), 0)
      FROM seo_ab_results
      WHERE variant_id = NEW.variant_id
    ),
    clicks = (
      SELECT COALESCE(SUM(clicks), 0)
      FROM seo_ab_results
      WHERE variant_id = NEW.variant_id
    ),
    ctr = calculate_variant_ctr(NEW.variant_id),
    updated_at = now()
  WHERE id = NEW.variant_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_variant_ctr
  AFTER INSERT OR UPDATE ON seo_ab_results
  FOR EACH ROW
  EXECUTE FUNCTION update_variant_ctr();