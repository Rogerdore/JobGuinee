-- ============================================================
-- Migration: Add newsletter type to admin_communications
-- Date: 2026-03-15
-- Description: Extends the communication system to support
--   admin-curated newsletter campaigns with content selection
-- ============================================================

-- 1. Drop existing CHECK constraint on type
ALTER TABLE admin_communications
  DROP CONSTRAINT IF EXISTS admin_communications_type_check;

-- 2. Recreate with 'newsletter' included
ALTER TABLE admin_communications
  ADD CONSTRAINT admin_communications_type_check
  CHECK (type IN ('system_info', 'important_notice', 'promotion', 'maintenance_alert', 'institutional', 'newsletter'));

-- 3. Add content_items column to store selected newsletter content
--    Array of objects: {type, id, title, slug, excerpt, image_url, url}
ALTER TABLE admin_communications
  ADD COLUMN IF NOT EXISTS content_items jsonb DEFAULT '[]';

-- 4. Add include_newsletter_subscribers flag
ALTER TABLE admin_communications
  ADD COLUMN IF NOT EXISTS include_newsletter_subscribers boolean DEFAULT false;
