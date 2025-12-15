/*
  # Système de Gestion des Liens Externes - JobGuinée
  
  ## Vue d'ensemble
  Système complet pour gérer, monitorer et analyser les liens externes (backlinks et liens sortants).
  
  ## Tables créées
  
  1. **seo_external_links** - Backlinks entrants vers le site
  2. **seo_outbound_links** - Liens sortants vers des sites externes
  3. **seo_domains** - Domaines référents avec métriques d'autorité
  4. **seo_link_opportunities** - Opportunités de netlinking
  5. **seo_toxic_links** - Liens toxiques à désavouer
  
  ## Fonctionnalités
  - Monitoring automatique des backlinks
  - Analyse de la qualité des domaines (DA/PA)
  - Détection de liens toxiques
  - Opportunités de netlinking
  - Suivi des liens perdus/gagnés
  - Analyse des ancres de liens
  - Rapports de backlink profile
*/

-- ============================================================================
-- 1. SEO DOMAINS - Domaines référents avec métriques
-- ============================================================================
CREATE TABLE IF NOT EXISTS seo_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Domain info
  domain TEXT UNIQUE NOT NULL,
  domain_url TEXT NOT NULL,
  
  -- Métriques d'autorité
  domain_authority INTEGER DEFAULT 0 CHECK (domain_authority BETWEEN 0 AND 100),
  page_authority INTEGER DEFAULT 0 CHECK (page_authority BETWEEN 0 AND 100),
  spam_score INTEGER DEFAULT 0 CHECK (spam_score BETWEEN 0 AND 100),
  trust_flow INTEGER DEFAULT 0 CHECK (trust_flow BETWEEN 0 AND 100),
  citation_flow INTEGER DEFAULT 0 CHECK (citation_flow BETWEEN 0 AND 100),
  
  -- Statistiques
  total_backlinks INTEGER DEFAULT 0,
  referring_domains INTEGER DEFAULT 0,
  
  -- Classement
  category TEXT CHECK (category IN (
    'excellent', 'good', 'average', 'poor', 'toxic'
  )),
  
  -- Statut
  is_whitelisted BOOLEAN DEFAULT false,
  is_blacklisted BOOLEAN DEFAULT false,
  
  -- Métadonnées
  last_checked_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_domains_domain ON seo_domains(domain);
CREATE INDEX IF NOT EXISTS idx_domains_authority ON seo_domains(domain_authority DESC);
CREATE INDEX IF NOT EXISTS idx_domains_category ON seo_domains(category);

-- ============================================================================
-- 2. SEO EXTERNAL LINKS - Backlinks entrants
-- ============================================================================
CREATE TABLE IF NOT EXISTS seo_external_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Lien source (externe)
  source_url TEXT NOT NULL,
  source_domain UUID REFERENCES seo_domains(id) ON DELETE CASCADE,
  
  -- Lien cible (notre site)
  target_url TEXT NOT NULL,
  target_page TEXT NOT NULL,
  
  -- Détails du lien
  anchor_text TEXT,
  anchor_type TEXT CHECK (anchor_type IN (
    'exact_match', 'partial_match', 'branded', 'generic', 'naked_url', 'image'
  )),
  
  -- Attributs
  is_dofollow BOOLEAN DEFAULT true,
  is_nofollow BOOLEAN DEFAULT false,
  link_position TEXT CHECK (link_position IN (
    'content', 'sidebar', 'footer', 'header', 'comment', 'unknown'
  )),
  
  -- Statut
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active', 'lost', 'broken', 'redirected', 'noindex'
  )),
  
  -- Qualité
  quality_score INTEGER DEFAULT 50 CHECK (quality_score BETWEEN 0 AND 100),
  is_toxic BOOLEAN DEFAULT false,
  
  -- Détection
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  lost_at TIMESTAMPTZ,
  
  -- Métadonnées
  page_title TEXT,
  context_snippet TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_external_links_source ON seo_external_links(source_domain);
CREATE INDEX IF NOT EXISTS idx_external_links_target ON seo_external_links(target_page);
CREATE INDEX IF NOT EXISTS idx_external_links_status ON seo_external_links(status);
CREATE INDEX IF NOT EXISTS idx_external_links_quality ON seo_external_links(quality_score DESC);

-- ============================================================================
-- 3. SEO OUTBOUND LINKS - Liens sortants
-- ============================================================================
CREATE TABLE IF NOT EXISTS seo_outbound_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source (notre site)
  source_page TEXT NOT NULL,
  
  -- Destination (externe)
  target_url TEXT NOT NULL,
  target_domain TEXT NOT NULL,
  
  -- Détails du lien
  anchor_text TEXT NOT NULL,
  is_dofollow BOOLEAN DEFAULT true,
  is_sponsored BOOLEAN DEFAULT false,
  is_ugc BOOLEAN DEFAULT false,
  
  -- Statut
  is_broken BOOLEAN DEFAULT false,
  http_status INTEGER,
  
  -- Vérification
  last_checked_at TIMESTAMPTZ DEFAULT now(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outbound_links_source ON seo_outbound_links(source_page);
CREATE INDEX IF NOT EXISTS idx_outbound_links_domain ON seo_outbound_links(target_domain);
CREATE INDEX IF NOT EXISTS idx_outbound_links_broken ON seo_outbound_links(is_broken);

-- ============================================================================
-- 4. SEO LINK OPPORTUNITIES - Opportunités de netlinking
-- ============================================================================
CREATE TABLE IF NOT EXISTS seo_link_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Opportunité
  opportunity_type TEXT CHECK (opportunity_type IN (
    'broken_link', 'unlinked_mention', 'competitor_backlink', 'guest_post', 
    'resource_page', 'partnership', 'directory', 'forum', 'other'
  )),
  
  -- Détails
  target_site TEXT NOT NULL,
  target_url TEXT NOT NULL,
  target_domain UUID REFERENCES seo_domains(id),
  
  -- Contenu suggéré
  suggested_anchor TEXT,
  suggested_page TEXT,
  pitch_template TEXT,
  
  -- Priorité et scoring
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  opportunity_score INTEGER DEFAULT 50 CHECK (opportunity_score BETWEEN 0 AND 100),
  difficulty INTEGER DEFAULT 5 CHECK (difficulty BETWEEN 1 AND 10),
  
  -- Statut de suivi
  status TEXT DEFAULT 'identified' CHECK (status IN (
    'identified', 'contacted', 'negotiating', 'accepted', 'rejected', 'acquired', 'abandoned'
  )),
  
  -- Contact
  contact_name TEXT,
  contact_email TEXT,
  contacted_at TIMESTAMPTZ,
  followed_up_at TIMESTAMPTZ,
  
  -- Résultat
  acquired_at TIMESTAMPTZ,
  acquired_url TEXT,
  
  -- Notes
  notes TEXT,
  
  -- Métadonnées
  assigned_to UUID REFERENCES profiles(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_link_opportunities_type ON seo_link_opportunities(opportunity_type);
CREATE INDEX IF NOT EXISTS idx_link_opportunities_status ON seo_link_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_link_opportunities_priority ON seo_link_opportunities(priority);
CREATE INDEX IF NOT EXISTS idx_link_opportunities_score ON seo_link_opportunities(opportunity_score DESC);

-- ============================================================================
-- 5. SEO TOXIC LINKS - Liens toxiques à désavouer
-- ============================================================================
CREATE TABLE IF NOT EXISTS seo_toxic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Référence au backlink
  external_link_id UUID REFERENCES seo_external_links(id) ON DELETE CASCADE,
  
  -- Détails du lien toxique
  source_url TEXT NOT NULL,
  source_domain TEXT NOT NULL,
  
  -- Raisons de toxicité
  toxicity_reasons TEXT[],
  toxicity_score INTEGER DEFAULT 0 CHECK (toxicity_score BETWEEN 0 AND 100),
  
  -- Facteurs de risque
  is_spam BOOLEAN DEFAULT false,
  is_low_quality BOOLEAN DEFAULT false,
  is_penalized BOOLEAN DEFAULT false,
  has_malware BOOLEAN DEFAULT false,
  is_pbn BOOLEAN DEFAULT false,
  
  -- Action
  action TEXT DEFAULT 'review' CHECK (action IN (
    'review', 'monitor', 'disavow', 'contact_webmaster', 'ignore'
  )),
  
  -- Désaveu
  disavowed_at TIMESTAMPTZ,
  disavow_file_included BOOLEAN DEFAULT false,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  detected_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_toxic_links_domain ON seo_toxic_links(source_domain);
CREATE INDEX IF NOT EXISTS idx_toxic_links_score ON seo_toxic_links(toxicity_score DESC);
CREATE INDEX IF NOT EXISTS idx_toxic_links_action ON seo_toxic_links(action);

-- ============================================================================
-- 6. SEO BACKLINK CHANGES - Historique des changements
-- ============================================================================
CREATE TABLE IF NOT EXISTS seo_backlink_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Type de changement
  change_type TEXT NOT NULL CHECK (change_type IN (
    'new_link', 'lost_link', 'link_modified', 'domain_authority_change'
  )),
  
  -- Référence
  external_link_id UUID REFERENCES seo_external_links(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES seo_domains(id),
  
  -- Détails
  old_value TEXT,
  new_value TEXT,
  
  -- Impact
  impact_score INTEGER DEFAULT 0,
  
  -- Timestamp
  detected_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_backlink_changes_type ON seo_backlink_changes(change_type);
CREATE INDEX IF NOT EXISTS idx_backlink_changes_date ON seo_backlink_changes(detected_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE seo_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_external_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_outbound_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_link_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_toxic_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_backlink_changes ENABLE ROW LEVEL SECURITY;

-- Admins peuvent tout gérer
CREATE POLICY "Admins can manage domains"
  ON seo_domains FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage external links"
  ON seo_external_links FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage outbound links"
  ON seo_outbound_links FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage link opportunities"
  ON seo_link_opportunities FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage toxic links"
  ON seo_toxic_links FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can view backlink changes"
  ON seo_backlink_changes FOR SELECT
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

-- Calculer le score de qualité d'un backlink
CREATE OR REPLACE FUNCTION calculate_backlink_quality(
  domain_authority_param INTEGER,
  is_dofollow_param BOOLEAN,
  anchor_type_param TEXT,
  link_position_param TEXT
)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Base sur DA
  score := domain_authority_param;
  
  -- Bonus dofollow
  IF is_dofollow_param THEN
    score := score + 10;
  END IF;
  
  -- Bonus type d'ancre
  CASE anchor_type_param
    WHEN 'exact_match' THEN score := score + 15;
    WHEN 'partial_match' THEN score := score + 10;
    WHEN 'branded' THEN score := score + 5;
    ELSE score := score + 0;
  END CASE;
  
  -- Bonus position
  CASE link_position_param
    WHEN 'content' THEN score := score + 15;
    WHEN 'sidebar' THEN score := score + 5;
    WHEN 'footer' THEN score := score - 5;
    ELSE score := score + 0;
  END CASE;
  
  -- Limiter entre 0 et 100
  RETURN GREATEST(0, LEAST(100, score));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Obtenir le profil de backlinks
CREATE OR REPLACE FUNCTION get_backlink_profile()
RETURNS TABLE (
  total_backlinks BIGINT,
  active_backlinks BIGINT,
  lost_backlinks BIGINT,
  dofollow_backlinks BIGINT,
  unique_domains BIGINT,
  avg_domain_authority NUMERIC,
  toxic_links_count BIGINT,
  quality_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_backlinks,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT as active_backlinks,
    COUNT(*) FILTER (WHERE status = 'lost')::BIGINT as lost_backlinks,
    COUNT(*) FILTER (WHERE is_dofollow = true)::BIGINT as dofollow_backlinks,
    COUNT(DISTINCT source_domain)::BIGINT as unique_domains,
    ROUND(AVG(
      CASE WHEN d.domain_authority IS NOT NULL 
      THEN d.domain_authority 
      ELSE 0 END
    )::NUMERIC, 2) as avg_domain_authority,
    COUNT(*) FILTER (WHERE is_toxic = true)::BIGINT as toxic_links_count,
    ROUND(AVG(quality_score)::NUMERIC, 2) as quality_score
  FROM seo_external_links el
  LEFT JOIN seo_domains d ON el.source_domain = d.id;
END;
$$ LANGUAGE plpgsql;

-- Obtenir les top domaines référents
CREATE OR REPLACE FUNCTION get_top_referring_domains(limit_param INTEGER DEFAULT 10)
RETURNS TABLE (
  domain TEXT,
  backlinks_count BIGINT,
  domain_authority INTEGER,
  quality_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.domain,
    COUNT(el.id)::BIGINT as backlinks_count,
    d.domain_authority,
    ROUND(AVG(el.quality_score)::NUMERIC, 2) as quality_score
  FROM seo_domains d
  JOIN seo_external_links el ON d.id = el.source_domain
  WHERE el.status = 'active'
  GROUP BY d.id, d.domain, d.domain_authority
  ORDER BY backlinks_count DESC, d.domain_authority DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- Obtenir les nouveaux backlinks (7 derniers jours)
CREATE OR REPLACE FUNCTION get_recent_backlinks(days_param INTEGER DEFAULT 7)
RETURNS TABLE (
  source_url TEXT,
  target_url TEXT,
  anchor_text TEXT,
  domain_authority INTEGER,
  quality_score INTEGER,
  first_seen_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    el.source_url,
    el.target_url,
    el.anchor_text,
    d.domain_authority,
    el.quality_score,
    el.first_seen_at
  FROM seo_external_links el
  LEFT JOIN seo_domains d ON el.source_domain = d.id
  WHERE el.first_seen_at >= CURRENT_TIMESTAMP - (days_param || ' days')::INTERVAL
  ORDER BY el.first_seen_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Détecter les liens perdus récents
CREATE OR REPLACE FUNCTION get_lost_backlinks(days_param INTEGER DEFAULT 30)
RETURNS TABLE (
  source_url TEXT,
  target_url TEXT,
  anchor_text TEXT,
  domain_authority INTEGER,
  lost_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    el.source_url,
    el.target_url,
    el.anchor_text,
    d.domain_authority,
    el.lost_at
  FROM seo_external_links el
  LEFT JOIN seo_domains d ON el.source_domain = d.id
  WHERE el.status = 'lost'
    AND el.lost_at >= CURRENT_TIMESTAMP - (days_param || ' days')::INTERVAL
  ORDER BY el.lost_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Distribution des types d'ancres
CREATE OR REPLACE FUNCTION get_anchor_distribution()
RETURNS TABLE (
  anchor_type TEXT,
  count BIGINT,
  percentage NUMERIC
) AS $$
DECLARE
  total_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO total_count FROM seo_external_links WHERE status = 'active';
  
  RETURN QUERY
  SELECT
    el.anchor_type,
    COUNT(*)::BIGINT as count,
    ROUND((COUNT(*)::NUMERIC / NULLIF(total_count, 0) * 100), 2) as percentage
  FROM seo_external_links el
  WHERE el.status = 'active'
  GROUP BY el.anchor_type
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour quality_score automatiquement
CREATE OR REPLACE FUNCTION update_backlink_quality_score()
RETURNS TRIGGER AS $$
DECLARE
  domain_auth INTEGER;
BEGIN
  -- Récupérer le DA du domaine
  SELECT domain_authority INTO domain_auth
  FROM seo_domains
  WHERE id = NEW.source_domain;
  
  -- Calculer le score
  NEW.quality_score := calculate_backlink_quality(
    COALESCE(domain_auth, 0),
    NEW.is_dofollow,
    NEW.anchor_type,
    NEW.link_position
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_backlink_quality
  BEFORE INSERT OR UPDATE ON seo_external_links
  FOR EACH ROW
  EXECUTE FUNCTION update_backlink_quality_score();

-- Trigger pour logger les changements
CREATE OR REPLACE FUNCTION log_backlink_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO seo_backlink_changes (change_type, external_link_id, new_value)
    VALUES ('new_link', NEW.id, NEW.source_url);
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    IF NEW.status = 'lost' THEN
      INSERT INTO seo_backlink_changes (change_type, external_link_id, old_value, new_value)
      VALUES ('lost_link', NEW.id, OLD.status, NEW.status);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_backlink_change
  AFTER INSERT OR UPDATE ON seo_external_links
  FOR EACH ROW
  EXECUTE FUNCTION log_backlink_change();
