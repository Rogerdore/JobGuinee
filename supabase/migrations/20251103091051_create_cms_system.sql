/*
  # Create Content Management System

  ## 1. New Tables
    - `site_settings` - General site configuration
    - `cms_pages` - Custom pages content
    - `cms_sections` - Reusable content sections
    - `cms_media` - Media library management
    - `cms_navigation` - Navigation menu configuration
    - `cms_translations` - Multi-language support

  ## 2. Security
    - Enable RLS on all CMS tables
    - Only admins can manage CMS content
    - Public read access for published content

  ## 3. Features
    - Site-wide settings (logo, colors, contact info)
    - Dynamic page management
    - Reusable content sections
    - Media library
    - Navigation menu builder
    - Translation support
*/

-- ============================================
-- 1. SITE SETTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public settings are viewable by everyone"
  ON public.site_settings FOR SELECT
  USING (is_public = true);

CREATE POLICY "Admins can manage site settings"
  ON public.site_settings
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND user_type = 'recruiter'
    )
  );

-- ============================================
-- 2. CMS PAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  meta_description TEXT,
  meta_keywords TEXT[],
  content JSONB NOT NULL,
  template TEXT DEFAULT 'default',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  author_id UUID REFERENCES profiles(id),
  featured_image TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published pages are viewable by everyone"
  ON public.cms_pages FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins can manage pages"
  ON public.cms_pages
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND user_type = 'recruiter'
    )
  );

-- ============================================
-- 3. CMS SECTIONS TABLE (Reusable Content)
-- ============================================

CREATE TABLE IF NOT EXISTS public.cms_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT UNIQUE NOT NULL,
  section_name TEXT NOT NULL,
  content JSONB NOT NULL,
  section_type TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.cms_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active sections are viewable by everyone"
  ON public.cms_sections FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can manage sections"
  ON public.cms_sections
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND user_type = 'recruiter'
    )
  );

-- ============================================
-- 4. CMS MEDIA TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.cms_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  alt_text TEXT,
  caption TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  folder TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.cms_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Media is viewable by everyone"
  ON public.cms_media FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage media"
  ON public.cms_media
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND user_type = 'recruiter'
    )
  );

-- ============================================
-- 5. CMS NAVIGATION TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.cms_navigation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_location TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT,
  page_id UUID REFERENCES cms_pages(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES cms_navigation(id) ON DELETE CASCADE,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  open_in_new_tab BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.cms_navigation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active navigation is viewable by everyone"
  ON public.cms_navigation FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage navigation"
  ON public.cms_navigation
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND user_type = 'recruiter'
    )
  );

-- ============================================
-- 6. CMS TRANSLATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.cms_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_key TEXT NOT NULL,
  language_code TEXT DEFAULT 'fr' CHECK (language_code IN ('fr', 'en')),
  translation_value TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(translation_key, language_code)
);

ALTER TABLE public.cms_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Translations are viewable by everyone"
  ON public.cms_translations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage translations"
  ON public.cms_translations
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) AND user_type = 'recruiter'
    )
  );

-- ============================================
-- 7. CREATE INDEXES
-- ============================================

CREATE INDEX idx_site_settings_key ON public.site_settings(setting_key);
CREATE INDEX idx_site_settings_category ON public.site_settings(category);
CREATE INDEX idx_cms_pages_slug ON public.cms_pages(slug);
CREATE INDEX idx_cms_pages_status ON public.cms_pages(status, published_at DESC);
CREATE INDEX idx_cms_sections_key ON public.cms_sections(section_key);
CREATE INDEX idx_cms_sections_type ON public.cms_sections(section_type, display_order);
CREATE INDEX idx_cms_media_folder ON public.cms_media(folder);
CREATE INDEX idx_cms_navigation_menu ON public.cms_navigation(menu_location, display_order);
CREATE INDEX idx_cms_translations_key ON public.cms_translations(translation_key, language_code);

-- ============================================
-- 8. INSERT DEFAULT SETTINGS
-- ============================================

INSERT INTO public.site_settings (setting_key, setting_value, category, description, is_public) VALUES
  ('site_name', '{"value": "JobGuinée"}', 'general', 'Nom du site', true),
  ('site_tagline', '{"value": "La première plateforme guinéenne de recrutement digital"}', 'general', 'Slogan du site', true),
  ('site_description', '{"value": "Connectez talents et opportunités en Guinée"}', 'general', 'Description du site', true),
  ('site_logo', '{"url": "", "alt": "JobGuinée"}', 'branding', 'Logo du site', true),
  ('site_favicon', '{"url": ""}', 'branding', 'Favicon du site', true),
  ('primary_color', '{"value": "#0E2F56"}', 'theme', 'Couleur principale', true),
  ('secondary_color', '{"value": "#FF8C00"}', 'theme', 'Couleur secondaire', true),
  ('contact_email', '{"value": "contact@jobguinee.com"}', 'contact', 'Email de contact', true),
  ('contact_phone', '{"value": "+224 XXX XX XX XX"}', 'contact', 'Téléphone', true),
  ('contact_address', '{"value": "Conakry, Guinée"}', 'contact', 'Adresse', true),
  ('social_facebook', '{"url": ""}', 'social', 'Page Facebook', true),
  ('social_linkedin', '{"url": ""}', 'social', 'Page LinkedIn', true),
  ('social_twitter', '{"url": ""}', 'social', 'Compte Twitter', true),
  ('social_instagram', '{"url": ""}', 'social', 'Compte Instagram', true),
  ('homepage_hero_title', '{"value": "Simplifiez votre recrutement, trouvez votre emploi"}', 'homepage', 'Titre hero homepage', true),
  ('homepage_hero_subtitle', '{"value": "La première plateforme guinéenne de recrutement digital connectant talents et opportunités"}', 'homepage', 'Sous-titre hero', true),
  ('enable_blog', '{"value": true}', 'features', 'Activer le blog', true),
  ('enable_formations', '{"value": true}', 'features', 'Activer les formations', true),
  ('enable_cvtheque', '{"value": true}', 'features', 'Activer la CVthèque', true),
  ('maintenance_mode', '{"value": false, "message": ""}', 'system', 'Mode maintenance', false)
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- 9. INSERT DEFAULT SECTIONS
-- ============================================

INSERT INTO public.cms_sections (section_key, section_name, content, section_type, status, display_order) VALUES
  (
    'home_features',
    'Fonctionnalités Accueil',
    '{
      "items": [
        {
          "icon": "briefcase",
          "title": "Offres d''emploi ciblées",
          "description": "Accédez aux meilleures opportunités adaptées à votre profil"
        },
        {
          "icon": "users",
          "title": "CVthèque qualifiée",
          "description": "Recrutez les meilleurs talents guinéens"
        },
        {
          "icon": "award",
          "title": "Formations certifiantes",
          "description": "Développez vos compétences avec nos partenaires"
        }
      ]
    }',
    'features',
    'active',
    1
  ),
  (
    'home_stats',
    'Statistiques Accueil',
    '{
      "items": [
        {"label": "Offres d''emploi", "value": "1250+"},
        {"label": "Entreprises partenaires", "value": "150+"},
        {"label": "Candidats inscrits", "value": "5000+"},
        {"label": "Recrutements réussis", "value": "800+"}
      ]
    }',
    'stats',
    'active',
    2
  ),
  (
    'footer_about',
    'À propos - Footer',
    '{
      "content": "JobGuinée est la première plateforme de recrutement digital en Guinée, connectant les talents locaux avec les meilleures opportunités professionnelles."
    }',
    'text',
    'active',
    3
  )
ON CONFLICT (section_key) DO NOTHING;

-- ============================================
-- 10. CREATE TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_cms_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_cms_updated_at();

CREATE TRIGGER update_cms_pages_updated_at
  BEFORE UPDATE ON public.cms_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_cms_updated_at();

CREATE TRIGGER update_cms_sections_updated_at
  BEFORE UPDATE ON public.cms_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_cms_updated_at();

CREATE TRIGGER update_cms_navigation_updated_at
  BEFORE UPDATE ON public.cms_navigation
  FOR EACH ROW
  EXECUTE FUNCTION update_cms_updated_at();

CREATE TRIGGER update_cms_translations_updated_at
  BEFORE UPDATE ON public.cms_translations
  FOR EACH ROW
  EXECUTE FUNCTION update_cms_updated_at();