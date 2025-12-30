/*
  # SEO Phase 2 - Core Web Vitals Monitoring

  1. New Tables
    - `seo_core_web_vitals` - Stocke les métriques de performance
    - `seo_mobile_scores` - Scores mobile par page
    - `seo_performance_alerts` - Alertes de performance

  2. Security
    - Enable RLS on all tables
    - Admin-only access for data
*/

CREATE TABLE IF NOT EXISTS seo_core_web_vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('mobile', 'desktop', 'tablet')),
  lcp NUMERIC,
  fid NUMERIC,
  cls NUMERIC,
  inp NUMERIC,
  ttfb NUMERIC,
  fcp NUMERIC,
  connection_type TEXT,
  effective_type TEXT,
  country_code TEXT,
  city TEXT,
  session_id TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_mobile_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL UNIQUE,
  mobile_score INTEGER DEFAULT 0 CHECK (mobile_score >= 0 AND mobile_score <= 100),
  performance_score INTEGER,
  accessibility_score INTEGER,
  best_practices_score INTEGER,
  seo_score INTEGER,
  issues JSONB DEFAULT '[]',
  opportunities JSONB DEFAULT '[]',
  viewport_configured BOOLEAN DEFAULT false,
  font_size_adequate BOOLEAN DEFAULT false,
  tap_targets_sized BOOLEAN DEFAULT false,
  content_sized_correctly BOOLEAN DEFAULT false,
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_performance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('lcp_threshold', 'cls_threshold', 'inp_threshold', 'mobile_score', 'critical')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  details JSONB,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cwv_page_path ON seo_core_web_vitals(page_path);
CREATE INDEX IF NOT EXISTS idx_cwv_device_type ON seo_core_web_vitals(device_type);
CREATE INDEX IF NOT EXISTS idx_cwv_created_at ON seo_core_web_vitals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mobile_scores_page ON seo_mobile_scores(page_path);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_page ON seo_performance_alerts(page_path);

ALTER TABLE seo_core_web_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_mobile_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_performance_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts for metrics collection"
  ON seo_core_web_vitals FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read all metrics"
  ON seo_core_web_vitals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage mobile scores"
  ON seo_mobile_scores FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage performance alerts"
  ON seo_performance_alerts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );