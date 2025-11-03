/*
  # Add Admin Role and Update CMS Policies

  ## 1. Changes
    - Add admin role to profiles table
    - Update all CMS policies to require admin role
    - Create function to check if user is admin

  ## 2. Security
    - Only admins can access and modify CMS
    - Admins have full control over site settings
    - Public content remains viewable by everyone

  ## 3. Admin Setup
    - Admin role is separate from recruiter/candidate
    - Future: Add admin dashboard and user management
*/

-- ============================================
-- 1. ADD ADMIN ROLE CHECK FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND user_type = 'admin'
  );
END;
$$;

-- ============================================
-- 2. UPDATE SITE SETTINGS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Public settings are viewable by everyone" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;

CREATE POLICY "Public settings are viewable by everyone"
  ON public.site_settings FOR SELECT
  USING (is_public = true);

CREATE POLICY "Admins can view all settings"
  ON public.site_settings FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert settings"
  ON public.site_settings FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update settings"
  ON public.site_settings FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete settings"
  ON public.site_settings FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================
-- 3. UPDATE CMS PAGES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Published pages are viewable by everyone" ON public.cms_pages;
DROP POLICY IF EXISTS "Admins can manage pages" ON public.cms_pages;

CREATE POLICY "Published pages are viewable by everyone"
  ON public.cms_pages FOR SELECT
  USING (status = 'published' OR is_admin());

CREATE POLICY "Admins can insert pages"
  ON public.cms_pages FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update pages"
  ON public.cms_pages FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete pages"
  ON public.cms_pages FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================
-- 4. UPDATE CMS SECTIONS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Active sections are viewable by everyone" ON public.cms_sections;
DROP POLICY IF EXISTS "Admins can manage sections" ON public.cms_sections;

CREATE POLICY "Active sections are viewable by everyone"
  ON public.cms_sections FOR SELECT
  USING (status = 'active' OR is_admin());

CREATE POLICY "Admins can insert sections"
  ON public.cms_sections FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update sections"
  ON public.cms_sections FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete sections"
  ON public.cms_sections FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================
-- 5. UPDATE CMS MEDIA POLICIES
-- ============================================

DROP POLICY IF EXISTS "Media is viewable by everyone" ON public.cms_media;
DROP POLICY IF EXISTS "Admins can manage media" ON public.cms_media;

CREATE POLICY "Media is viewable by everyone"
  ON public.cms_media FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert media"
  ON public.cms_media FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update media"
  ON public.cms_media FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete media"
  ON public.cms_media FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================
-- 6. UPDATE CMS NAVIGATION POLICIES
-- ============================================

DROP POLICY IF EXISTS "Active navigation is viewable by everyone" ON public.cms_navigation;
DROP POLICY IF EXISTS "Admins can manage navigation" ON public.cms_navigation;

CREATE POLICY "Active navigation is viewable by everyone"
  ON public.cms_navigation FOR SELECT
  USING (is_active = true OR is_admin());

CREATE POLICY "Admins can insert navigation"
  ON public.cms_navigation FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update navigation"
  ON public.cms_navigation FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete navigation"
  ON public.cms_navigation FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================
-- 7. UPDATE CMS TRANSLATIONS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Translations are viewable by everyone" ON public.cms_translations;
DROP POLICY IF EXISTS "Admins can manage translations" ON public.cms_translations;

CREATE POLICY "Translations are viewable by everyone"
  ON public.cms_translations FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert translations"
  ON public.cms_translations FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update translations"
  ON public.cms_translations FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete translations"
  ON public.cms_translations FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================
-- 8. CREATE ADMIN_USERS TABLE (for audit logs)
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id) NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity logs"
  ON public.admin_activity_logs FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "System can insert activity logs"
  ON public.admin_activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE INDEX idx_admin_logs_admin ON public.admin_activity_logs(admin_id, created_at DESC);
CREATE INDEX idx_admin_logs_resource ON public.admin_activity_logs(resource_type, resource_id);