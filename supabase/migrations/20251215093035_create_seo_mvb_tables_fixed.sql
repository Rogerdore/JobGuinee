/*
  # Système SEO MVB (Minimum Viable Base) - JobGuinée
  
  ## Vue d'ensemble
  Structure de base pour le système SEO de JobGuinée.
  Version minimale viable qui sera étendue progressivement.
  
  ## Tables créées
  
  1. **seo_config** - Configuration SEO globale unique
  2. **seo_page_meta** - Meta données par page/URL
  3. **seo_schemas** - Données structurées Schema.org
  4. **seo_keywords** - Mots-clés suivis
  
  ## Sécurité
  - RLS activé sur toutes les tables
  - Lecture publique pour contenu actif
  - Modification admin uniquement
*/

-- ============================================================================
-- 1. SEO CONFIG - Configuration globale (une seule ligne)
-- ============================================================================
CREATE TABLE IF NOT EXISTS seo_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Meta globaux
  site_name TEXT NOT NULL DEFAULT 'JobGuinée',
  site_tagline TEXT DEFAULT 'La plateforme N°1 de l''emploi en Guinée',
  default_title TEXT DEFAULT 'JobGuinée - Emploi, Recrutement et Formation en Guinée',
  default_description TEXT DEFAULT 'Trouvez votre emploi idéal en Guinée. Des milliers d''offres d''emploi, CV en ligne, formations professionnelles. Recruteurs: trouvez vos talents.',
  default_keywords TEXT[] DEFAULT ARRAY['emploi guinée', 'recrutement guinée', 'job conakry', 'cv guinée', 'offre emploi']::TEXT[],
  
  -- URLs et social
  site_url TEXT DEFAULT 'https://jobguinee.com',
  logo_url TEXT,
  og_image TEXT,
  twitter_handle TEXT DEFAULT '@jobguinee',
  facebook_page TEXT,
  linkedin_page TEXT,
  
  -- Configuration technique
  enable_indexation BOOLEAN DEFAULT true,
  robots_txt TEXT DEFAULT 'User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Sitemap: https://jobguinee.com/sitemap.xml',
  
  -- Analytics
  google_analytics_id TEXT,
  google_site_verification TEXT,
  
  -- Timestamps
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 2. SEO PAGE META - Meta données par page
-- ============================================================================
CREATE TABLE IF NOT EXISTS seo_page_meta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification page
  page_path TEXT NOT NULL UNIQUE,
  page_type TEXT NOT NULL CHECK (page_type IN (
    'home', 'jobs_list', 'job_detail', 'job_sector', 'job_city',
    'profile', 'company', 'blog', 'blog_post', 'formations',
    'static', 'generated'
  )),
  
  -- Meta tags
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Open Graph
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  og_type TEXT DEFAULT 'website',
  
  -- Configuration
  canonical_url TEXT,
  robots TEXT DEFAULT 'index, follow',
  priority NUMERIC DEFAULT 0.5 CHECK (priority >= 0 AND priority <= 1),
  change_freq TEXT DEFAULT 'weekly',
  
  -- Relations (optionnel)
  entity_type TEXT,
  entity_id UUID,
  
  -- État
  is_active BOOLEAN DEFAULT true,
  is_generated BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_page_meta_path ON seo_page_meta(page_path);
CREATE INDEX IF NOT EXISTS idx_seo_page_meta_type ON seo_page_meta(page_type);
CREATE INDEX IF NOT EXISTS idx_seo_page_meta_entity ON seo_page_meta(entity_type, entity_id);

-- ============================================================================
-- 3. SEO SCHEMAS - Données structurées
-- ============================================================================
CREATE TABLE IF NOT EXISTS seo_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Type de schema
  schema_type TEXT NOT NULL CHECK (schema_type IN (
    'Organization', 'JobPosting', 'Person', 'Article',
    'Course', 'BreadcrumbList', 'FAQPage', 'WebSite'
  )),
  
  -- Relations
  entity_type TEXT NOT NULL,
  entity_id UUID,
  
  -- Schema JSON-LD
  schema_json JSONB NOT NULL,
  
  -- État
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(schema_type, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_seo_schemas_type ON seo_schemas(schema_type);
CREATE INDEX IF NOT EXISTS idx_seo_schemas_entity ON seo_schemas(entity_type, entity_id);

-- ============================================================================
-- 4. SEO KEYWORDS - Mots-clés suivis
-- ============================================================================
CREATE TABLE IF NOT EXISTS seo_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Mot-clé
  keyword TEXT NOT NULL UNIQUE,
  keyword_type TEXT DEFAULT 'secondary' CHECK (keyword_type IN ('primary', 'secondary', 'long_tail')),
  
  -- Métrique
  search_volume INTEGER DEFAULT 0,
  current_rank INTEGER DEFAULT 0,
  target_rank INTEGER DEFAULT 10,
  
  -- Relations
  target_url TEXT,
  related_pages TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- État
  is_tracked BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_keywords_tracked ON seo_keywords(is_tracked);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE seo_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_page_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_keywords ENABLE ROW LEVEL SECURITY;

-- SEO CONFIG
CREATE POLICY "Anyone can read SEO config"
  ON seo_config FOR SELECT
  USING (true);

CREATE POLICY "Admins can update SEO config"
  ON seo_config FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can insert SEO config"
  ON seo_config FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- SEO PAGE META
CREATE POLICY "Anyone can read active page meta"
  ON seo_page_meta FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage page meta"
  ON seo_page_meta FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- SEO SCHEMAS
CREATE POLICY "Anyone can read active schemas"
  ON seo_schemas FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage schemas"
  ON seo_schemas FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- SEO KEYWORDS
CREATE POLICY "Admins can read keywords"
  ON seo_keywords FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage keywords"
  ON seo_keywords FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- ============================================================================
-- DONNÉES INITIALES
-- ============================================================================

-- Configuration SEO par défaut
INSERT INTO seo_config (
  site_name,
  site_tagline,
  default_title,
  default_description,
  default_keywords,
  site_url
) VALUES (
  'JobGuinée',
  'La plateforme N°1 de l''emploi en Guinée',
  'JobGuinée - Emploi, Recrutement et Formation en Guinée',
  'Trouvez votre emploi idéal en Guinée. Des milliers d''offres d''emploi, CV en ligne, formations professionnelles. Recruteurs: trouvez vos talents en Guinée et en Afrique de l''Ouest.',
  ARRAY['emploi guinée', 'recrutement guinée', 'job conakry', 'offre emploi guinée', 'cv guinée', 'formation guinée']::TEXT[],
  'https://jobguinee.com'
)
ON CONFLICT DO NOTHING;

-- Schema Organization pour le site
INSERT INTO seo_schemas (schema_type, entity_type, entity_id, schema_json) VALUES (
  'Organization',
  'site',
  NULL,
  '{
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "JobGuinée",
    "description": "La plateforme N°1 de l''emploi en Guinée",
    "url": "https://jobguinee.com",
    "logo": "https://jobguinee.com/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "availableLanguage": ["French", "English"]
    },
    "sameAs": [
      "https://facebook.com/jobguinee",
      "https://twitter.com/jobguinee",
      "https://linkedin.com/company/jobguinee"
    ]
  }'::JSONB
)
ON CONFLICT (schema_type, entity_type, entity_id) DO NOTHING;

-- Schema WebSite
INSERT INTO seo_schemas (schema_type, entity_type, entity_id, schema_json) VALUES (
  'WebSite',
  'site',
  NULL,
  '{
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "JobGuinée",
    "url": "https://jobguinee.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://jobguinee.com/jobs?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }'::JSONB
)
ON CONFLICT (schema_type, entity_type, entity_id) DO NOTHING;

-- Meta pour pages principales
INSERT INTO seo_page_meta (page_path, page_type, title, description, priority, change_freq) VALUES
('/', 'home', 'JobGuinée - Emploi, Recrutement et Formation en Guinée', 'La plateforme N°1 de l''emploi en Guinée. Trouvez votre emploi idéal, publiez des offres, recrutez les meilleurs talents. Des milliers d''opportunités vous attendent.', 1.0, 'daily'),
('/jobs', 'jobs_list', 'Offres d''Emploi en Guinée - Trouvez votre Job | JobGuinée', 'Consultez des milliers d''offres d''emploi en Guinée. CDI, CDD, Stage, Freelance. Tous secteurs: IT, Commerce, Ingénierie, Finance, Santé. Postulez en ligne.', 0.9, 'hourly'),
('/formations', 'formations', 'Formations Professionnelles en Guinée | JobGuinée', 'Découvrez les meilleures formations professionnelles en Guinée. Développez vos compétences, boostez votre carrière. Formations certifiantes en ligne et en présentiel.', 0.8, 'weekly')
ON CONFLICT (page_path) DO NOTHING;

-- Mots-clés principaux
INSERT INTO seo_keywords (keyword, keyword_type, target_url, is_tracked) VALUES
('emploi guinée', 'primary', '/jobs', true),
('recrutement guinée', 'primary', '/jobs', true),
('offre emploi conakry', 'primary', '/jobs', true),
('job guinée', 'primary', '/jobs', true),
('cv guinée', 'secondary', '/premium-ai', true),
('formation professionnelle guinée', 'secondary', '/formations', true)
ON CONFLICT (keyword) DO NOTHING;