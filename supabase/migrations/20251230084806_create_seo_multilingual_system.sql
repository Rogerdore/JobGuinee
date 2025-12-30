/*
  # SEO Multilingual System (Phase 4)

  1. New Tables
    - `seo_page_meta_i18n`
      - Multilingual metadata for pages (FR/EN)
      - Links to base seo_page_meta
    - `seo_config_i18n`
      - Multilingual global SEO config
    - `seo_keywords_i18n`
      - Language-specific keyword tracking
    - `seo_hreflang_config`
      - hreflang alternate URL configuration

  2. Extensions
    - Add language support to existing tables
    - Extend schemas with language metadata

  3. Security
    - Enable RLS on all new tables
    - Public read for active translations
    - Admin-only write access

  4. Features
    - Support for FR (French) and EN (English)
    - Automatic fallback to default language
    - hreflang alternate tags generation
    - Language-specific canonical URLs
*/

-- 1. Create i18n page metadata table
CREATE TABLE IF NOT EXISTS seo_page_meta_i18n (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seo_page_meta_id UUID NOT NULL REFERENCES seo_page_meta(id) ON DELETE CASCADE,
  language_code VARCHAR(2) NOT NULL CHECK (language_code IN ('fr', 'en')),
  title TEXT NOT NULL,
  description TEXT,
  keywords TEXT[],
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  twitter_title TEXT,
  twitter_description TEXT,
  canonical_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(seo_page_meta_id, language_code)
);

-- 2. Create i18n global config table
CREATE TABLE IF NOT EXISTS seo_config_i18n (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code VARCHAR(2) NOT NULL CHECK (language_code IN ('fr', 'en')) UNIQUE,
  site_name TEXT NOT NULL,
  site_tagline TEXT,
  default_title TEXT NOT NULL,
  default_description TEXT NOT NULL,
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  og_image TEXT,
  twitter_site TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create i18n keywords table
CREATE TABLE IF NOT EXISTS seo_keywords_i18n (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seo_keyword_id UUID REFERENCES seo_keywords(id) ON DELETE CASCADE,
  language_code VARCHAR(2) NOT NULL CHECK (language_code IN ('fr', 'en')),
  keyword TEXT NOT NULL,
  keyword_type VARCHAR(50) DEFAULT 'primary',
  search_volume_estimate INT,
  current_rank INT,
  target_rank INT,
  is_tracked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(seo_keyword_id, language_code)
);

-- 4. Create hreflang configuration table
CREATE TABLE IF NOT EXISTS seo_hreflang_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL,
  language_code VARCHAR(2) NOT NULL CHECK (language_code IN ('fr', 'en')),
  alternate_url TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(page_path, language_code)
);

-- 5. Add language field to existing schema table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seo_schemas' AND column_name = 'language_code'
  ) THEN
    ALTER TABLE seo_schemas ADD COLUMN language_code VARCHAR(2) DEFAULT 'fr';
  END IF;
END $$;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_seo_page_meta_i18n_lookup
  ON seo_page_meta_i18n(seo_page_meta_id, language_code, is_active);

CREATE INDEX IF NOT EXISTS idx_seo_page_meta_i18n_language
  ON seo_page_meta_i18n(language_code) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_seo_hreflang_page_path
  ON seo_hreflang_config(page_path) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_seo_keywords_i18n_language
  ON seo_keywords_i18n(language_code, is_tracked);

-- 7. Enable RLS
ALTER TABLE seo_page_meta_i18n ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_config_i18n ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_keywords_i18n ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_hreflang_config ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for seo_page_meta_i18n
CREATE POLICY "Public can view active i18n page meta"
  ON seo_page_meta_i18n FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage i18n page meta"
  ON seo_page_meta_i18n FOR ALL
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

-- 9. RLS Policies for seo_config_i18n
CREATE POLICY "Public can view active i18n config"
  ON seo_config_i18n FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage i18n config"
  ON seo_config_i18n FOR ALL
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

-- 10. RLS Policies for seo_keywords_i18n
CREATE POLICY "Admins can view i18n keywords"
  ON seo_keywords_i18n FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage i18n keywords"
  ON seo_keywords_i18n FOR ALL
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

-- 11. RLS Policies for seo_hreflang_config
CREATE POLICY "Public can view active hreflang config"
  ON seo_hreflang_config FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage hreflang config"
  ON seo_hreflang_config FOR ALL
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

-- 12. Insert default French config
INSERT INTO seo_config_i18n (
  language_code,
  site_name,
  site_tagline,
  default_title,
  default_description,
  keywords,
  is_active
) VALUES (
  'fr',
  'JobGuinée',
  'La plateforme emploi et recrutement #1 en Guinée',
  'JobGuinée - Trouvez votre emploi en Guinée | Offres d''emploi, Formations, CVthèque',
  'JobGuinée est la plateforme leader de recrutement en Guinée. Découvrez des milliers d''offres d''emploi, formez-vous avec nos formations professionnelles, et accédez à notre CVthèque pour recruter les meilleurs talents guinéens.',
  ARRAY['emploi guinée', 'offres emploi conakry', 'recrutement guinée', 'jobs guinée', 'carrière guinée', 'cvthèque', 'formations professionnelles'],
  true
) ON CONFLICT (language_code) DO NOTHING;

-- 13. Insert default English config
INSERT INTO seo_config_i18n (
  language_code,
  site_name,
  site_tagline,
  default_title,
  default_description,
  keywords,
  is_active
) VALUES (
  'en',
  'JobGuinée',
  'Guinea''s #1 Job & Recruitment Platform',
  'JobGuinée - Find Jobs in Guinea | Job Listings, Training, Talent Pool',
  'JobGuinée is Guinea''s leading recruitment platform. Discover thousands of job opportunities, access professional training programs, and use our talent pool to hire the best Guinean professionals.',
  ARRAY['guinea jobs', 'conakry employment', 'guinea recruitment', 'jobs guinea', 'career guinea', 'talent pool', 'professional training'],
  true
) ON CONFLICT (language_code) DO NOTHING;

-- 14. Create function to get page meta with i18n fallback
CREATE OR REPLACE FUNCTION get_page_meta_with_i18n(
  p_page_path TEXT,
  p_language_code VARCHAR(2) DEFAULT 'fr'
)
RETURNS TABLE (
  title TEXT,
  description TEXT,
  keywords TEXT[],
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  canonical_url TEXT,
  language_code VARCHAR(2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH base_meta AS (
    SELECT * FROM seo_page_meta
    WHERE page_path = p_page_path AND is_active = true
    LIMIT 1
  ),
  i18n_meta AS (
    SELECT i.*
    FROM seo_page_meta_i18n i
    JOIN base_meta b ON b.id = i.seo_page_meta_id
    WHERE i.language_code = p_language_code AND i.is_active = true
    LIMIT 1
  )
  SELECT
    COALESCE(i18n_meta.title, base_meta.title) as title,
    COALESCE(i18n_meta.description, base_meta.description) as description,
    COALESCE(i18n_meta.keywords, base_meta.keywords) as keywords,
    COALESCE(i18n_meta.og_title, base_meta.og_title) as og_title,
    COALESCE(i18n_meta.og_description, base_meta.og_description) as og_description,
    COALESCE(i18n_meta.og_image, base_meta.og_image) as og_image,
    COALESCE(i18n_meta.canonical_url, base_meta.canonical_url) as canonical_url,
    COALESCE(i18n_meta.language_code, p_language_code) as language_code
  FROM base_meta
  LEFT JOIN i18n_meta ON true;
END;
$$;

-- 15. Create function to get hreflang alternates
CREATE OR REPLACE FUNCTION get_hreflang_alternates(p_page_path TEXT)
RETURNS TABLE (
  language_code VARCHAR(2),
  alternate_url TEXT,
  is_default BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    language_code,
    alternate_url,
    is_default
  FROM seo_hreflang_config
  WHERE page_path = p_page_path AND is_active = true
  ORDER BY is_default DESC, language_code;
$$;

-- 16. Create function to sync base page meta with default language
CREATE OR REPLACE FUNCTION sync_base_page_meta_to_i18n()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO seo_page_meta_i18n (
      seo_page_meta_id,
      language_code,
      title,
      description,
      keywords,
      og_title,
      og_description,
      og_image,
      canonical_url,
      is_active
    ) VALUES (
      NEW.id,
      'fr',
      NEW.title,
      NEW.description,
      NEW.keywords,
      NEW.og_title,
      NEW.og_description,
      NEW.og_image,
      NEW.canonical_url,
      NEW.is_active
    ) ON CONFLICT (seo_page_meta_id, language_code) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- 17. Create trigger for auto-sync
DROP TRIGGER IF EXISTS sync_base_to_i18n_trigger ON seo_page_meta;
CREATE TRIGGER sync_base_to_i18n_trigger
  AFTER INSERT ON seo_page_meta
  FOR EACH ROW
  EXECUTE FUNCTION sync_base_page_meta_to_i18n();

COMMENT ON TABLE seo_page_meta_i18n IS 'Multilingual SEO metadata for pages (FR/EN)';
COMMENT ON TABLE seo_config_i18n IS 'Multilingual global SEO configuration';
COMMENT ON TABLE seo_keywords_i18n IS 'Language-specific keyword tracking';
COMMENT ON TABLE seo_hreflang_config IS 'hreflang alternate URL configuration for multilingual SEO';
COMMENT ON FUNCTION get_page_meta_with_i18n IS 'Retrieve page metadata with i18n support and fallback to default language';
COMMENT ON FUNCTION get_hreflang_alternates IS 'Get all hreflang alternate URLs for a page';
