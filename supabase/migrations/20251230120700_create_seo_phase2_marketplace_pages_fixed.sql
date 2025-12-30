/*
  # SEO Phase 2 - Marketplace & B2B Tables

  1. New Tables
    - `seo_marketplace_pages` - Pages marketplace (métier, secteur, ville)
    - `seo_cvtheque_teaser_pages` - Pages teaser CVthèque anonymisées
    - `seo_b2b_pages` - Pages B2B orientées conversion
    - `seo_blog_posts` - Articles blog RH
*/

CREATE TABLE IF NOT EXISTS seo_marketplace_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL CHECK (page_type IN ('metier', 'secteur', 'ville', 'niveau', 'combination')),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  keywords TEXT[],
  h1 TEXT NOT NULL,
  intro_text TEXT,
  job_count INTEGER DEFAULT 0,
  metier TEXT,
  secteur TEXT,
  ville TEXT,
  niveau TEXT,
  schema_json JSONB,
  canonical_url TEXT,
  has_pagination BOOLEAN DEFAULT false,
  total_pages INTEGER DEFAULT 1,
  view_count INTEGER DEFAULT 0,
  last_indexed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_cvtheque_teaser_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL CHECK (page_type IN ('metier', 'secteur', 'ville')),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  keywords TEXT[],
  h1 TEXT NOT NULL,
  intro_text TEXT,
  profile_count INTEGER DEFAULT 0,
  metier TEXT,
  secteur TEXT,
  ville TEXT,
  sample_profiles JSONB DEFAULT '[]',
  schema_json JSONB,
  view_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_b2b_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL CHECK (page_type IN ('hub', 'externalisation', 'ats', 'cvtheque_premium', 'cabinets_rh', 'formations_coaching')),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  keywords TEXT[],
  h1 TEXT NOT NULL,
  intro_text TEXT,
  features JSONB DEFAULT '[]',
  benefits JSONB DEFAULT '[]',
  pricing_info JSONB,
  testimonials JSONB DEFAULT '[]',
  faq JSONB DEFAULT '[]',
  primary_cta_text TEXT,
  primary_cta_url TEXT,
  secondary_cta_text TEXT,
  secondary_cta_url TEXT,
  schema_json JSONB,
  view_count INTEGER DEFAULT 0,
  cta_click_count INTEGER DEFAULT 0,
  lead_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  meta_description TEXT,
  keywords TEXT[],
  category TEXT CHECK (category IN ('cv', 'entretien', 'carriere', 'rh', 'entreprise', 'formations')),
  tags TEXT[],
  featured_image_url TEXT,
  author_name TEXT DEFAULT 'JobGuinée',
  author_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  schema_json JSONB,
  related_job_sectors TEXT[],
  related_b2b_pages TEXT[],
  view_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_pages_slug ON seo_marketplace_pages(slug);
CREATE INDEX IF NOT EXISTS idx_cvtheque_teaser_slug ON seo_cvtheque_teaser_pages(slug);
CREATE INDEX IF NOT EXISTS idx_b2b_pages_slug ON seo_b2b_pages(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON seo_blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON seo_blog_posts(published_at DESC) WHERE status = 'published';

ALTER TABLE seo_marketplace_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_cvtheque_teaser_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_b2b_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active marketplace pages"
  ON seo_marketplace_pages FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Public can read active cvtheque teaser pages"
  ON seo_cvtheque_teaser_pages FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Public can read active B2B pages"
  ON seo_b2b_pages FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Public can read published blog posts"
  ON seo_blog_posts FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND is_active = true);

CREATE POLICY "Admins can manage marketplace pages"
  ON seo_marketplace_pages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage cvtheque teaser pages"
  ON seo_cvtheque_teaser_pages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage B2B pages"
  ON seo_b2b_pages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage blog posts"
  ON seo_blog_posts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );