/*
  # Fix CMS Missing Structures
  
  1. Modifications
    - Add missing `category` column to `site_settings` table
    - Add missing `updated_by` column to `site_settings` table
    - Create `resources` table with complete structure
    
  2. Security
    - Enable RLS on resources table
    - Add policies for public read and admin management
*/

-- ============================================
-- 1. FIX SITE_SETTINGS TABLE
-- ============================================

-- Add missing category column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'site_settings' 
    AND column_name = 'category'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN category TEXT DEFAULT 'general' NOT NULL;
  END IF;
END $$;

-- Add missing updated_by column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'site_settings' 
    AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN updated_by UUID REFERENCES profiles(id);
  END IF;
END $$;

-- Create index on category if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_site_settings_category ON site_settings(category);

-- ============================================
-- 2. CREATE RESOURCES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,
  file_size TEXT,
  thumbnail_url TEXT,
  author TEXT,
  download_count INTEGER DEFAULT 0 NOT NULL,
  tags TEXT[] DEFAULT '{}',
  published BOOLEAN DEFAULT false NOT NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Allow public to read published resources
CREATE POLICY "Public can view published resources"
  ON resources
  FOR SELECT
  TO public
  USING (published = true);

-- Allow admins to manage resources
CREATE POLICY "Admins can insert resources"
  ON resources
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

CREATE POLICY "Admins can update resources"
  ON resources
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

CREATE POLICY "Admins can delete resources"
  ON resources
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_published ON resources(published);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resources_tags ON resources USING gin(tags);

-- ============================================
-- 3. CREATE STORAGE BUCKETS
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('resource-files', 'resource-files', true),
  ('resource-thumbnails', 'resource-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. FUNCTIONS
-- ============================================

-- Function to increment download count
CREATE OR REPLACE FUNCTION increment_resource_downloads(resource_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE resources
  SET download_count = download_count + 1
  WHERE id = resource_id;
END;
$$;

-- Function to update resources updated_at
CREATE OR REPLACE FUNCTION update_resources_updated_at()
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

-- Create trigger for resources
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_resources_updated_at'
  ) THEN
    CREATE TRIGGER update_resources_updated_at
      BEFORE UPDATE ON resources
      FOR EACH ROW
      EXECUTE FUNCTION update_resources_updated_at();
  END IF;
END $$;
