-- Create CMS tables
CREATE TABLE IF NOT EXISTS public.cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  author_id UUID REFERENCES profiles(id),
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cms_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES cms_pages(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON public.cms_pages(slug);
CREATE INDEX IF NOT EXISTS idx_cms_pages_published ON public.cms_pages(published);
CREATE INDEX IF NOT EXISTS idx_cms_sections_page ON public.cms_sections(page_id);

-- Enable RLS
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Published pages are viewable by everyone"
  ON public.cms_pages FOR SELECT
  USING (published = true);

CREATE POLICY "Authors can manage their pages"
  ON public.cms_pages FOR ALL
  TO authenticated
  USING (author_id = (select auth.uid()))
  WITH CHECK (author_id = (select auth.uid()));

CREATE POLICY "Can view sections of published pages"
  ON public.cms_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cms_pages
      WHERE cms_pages.id = cms_sections.page_id
      AND cms_pages.published = true
    )
  );