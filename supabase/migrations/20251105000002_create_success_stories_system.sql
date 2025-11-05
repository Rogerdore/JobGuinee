/*
  # Create Success Stories System

  ## Description
  System for sharing autobiographies, success stories and career journeys to inspire
  professionals in Guinea. Helps create a network of role models and success examples.

  ## Changes Made

  1. New Tables
    - `success_stories` - Main table for success stories and autobiographies
      - `id` (uuid, primary key)
      - `author_name` (text) - Full name of the person
      - `profile_photo_url` (text) - Profile picture URL
      - `job_title` (text) - Current or main job title
      - `company` (text) - Current or main company
      - `industry` (text) - Industry sector
      - `location` (text) - City/region in Guinea
      - `summary` (text) - Short professional profile summary
      - `story_title` (text) - Title of the success story
      - `story_excerpt` (text) - Brief excerpt (200-300 chars)
      - `story_content` (text) - Full story/biography content
      - `achievements` (text[]) - Key achievements list
      - `linkedin_url` (text) - LinkedIn profile
      - `email` (text) - Contact email
      - `phone` (text) - Contact phone
      - `years_experience` (integer) - Years of professional experience
      - `published` (boolean) - Publication status
      - `featured` (boolean) - Featured on homepage
      - `view_count` (integer) - Number of views
      - `created_by` (uuid) - User who created the story
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `story_media` - Gallery for photos and videos
      - `id` (uuid, primary key)
      - `story_id` (uuid) - Reference to success_stories
      - `media_type` (text) - 'image' or 'video'
      - `media_url` (text) - URL to the media
      - `caption` (text) - Description
      - `display_order` (integer) - Order in gallery
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Public can view published stories
    - Authenticated users can submit stories
    - Admins can manage all stories

  3. Indexes
    - Index on published status for filtering
    - Index on featured for homepage
    - Index on created_by for user stories
    - Index on story_id for media lookups

  ## Important Notes
  - Stories are moderated before publication
  - Featured stories appear on homepage and special sections
  - Media gallery supports photos and videos with captions
  - View count tracks story popularity
*/

-- Create success_stories table
CREATE TABLE IF NOT EXISTS success_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  profile_photo_url text,
  job_title text NOT NULL,
  company text,
  industry text NOT NULL,
  location text,
  summary text NOT NULL,
  story_title text NOT NULL,
  story_excerpt text NOT NULL,
  story_content text NOT NULL,
  achievements text[] DEFAULT '{}',
  linkedin_url text,
  email text,
  phone text,
  years_experience integer DEFAULT 0,
  published boolean DEFAULT false NOT NULL,
  featured boolean DEFAULT false NOT NULL,
  view_count integer DEFAULT 0 NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  CONSTRAINT story_excerpt_length CHECK (char_length(story_excerpt) >= 50),
  CONSTRAINT story_content_length CHECK (char_length(story_content) >= 100)
);

-- Create story_media table for gallery
CREATE TABLE IF NOT EXISTS story_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES success_stories(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  media_url text NOT NULL,
  caption text,
  display_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies for success_stories

-- Public can view published stories
CREATE POLICY "Public can view published stories"
  ON success_stories
  FOR SELECT
  TO public
  USING (published = true);

-- Authenticated users can create stories
CREATE POLICY "Authenticated users can create stories"
  ON success_stories
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Users can update their own unpublished stories
CREATE POLICY "Authors can update own stories"
  ON success_stories
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Authors can delete their own unpublished stories
CREATE POLICY "Authors can delete own unpublished stories"
  ON success_stories
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() AND published = false);

-- Admins can manage all stories
CREATE POLICY "Admins can manage all stories"
  ON success_stories
  FOR ALL
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

-- RLS Policies for story_media

-- Public can view media of published stories
CREATE POLICY "Public can view published story media"
  ON story_media
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM success_stories
      WHERE success_stories.id = story_media.story_id
      AND success_stories.published = true
    )
  );

-- Story authors can manage their story media
CREATE POLICY "Authors can manage own story media"
  ON story_media
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM success_stories
      WHERE success_stories.id = story_media.story_id
      AND success_stories.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM success_stories
      WHERE success_stories.id = story_media.story_id
      AND success_stories.created_by = auth.uid()
    )
  );

-- Admins can manage all media
CREATE POLICY "Admins can manage all story media"
  ON story_media
  FOR ALL
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_success_stories_published ON success_stories(published);
CREATE INDEX IF NOT EXISTS idx_success_stories_featured ON success_stories(featured, published);
CREATE INDEX IF NOT EXISTS idx_success_stories_created_by ON success_stories(created_by);
CREATE INDEX IF NOT EXISTS idx_success_stories_industry ON success_stories(industry, published);
CREATE INDEX IF NOT EXISTS idx_success_stories_view_count ON success_stories(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_story_media_story_id ON story_media(story_id, display_order);

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_story_views(story_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE success_stories
  SET view_count = view_count + 1
  WHERE id = story_id;
END;
$$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_success_story_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS success_stories_updated_at ON success_stories;
CREATE TRIGGER success_stories_updated_at
  BEFORE UPDATE ON success_stories
  FOR EACH ROW
  EXECUTE FUNCTION update_success_story_updated_at();

-- Add comments
COMMENT ON TABLE success_stories IS 'Success stories and autobiographies to inspire professionals';
COMMENT ON TABLE story_media IS 'Photo and video gallery for success stories';
COMMENT ON COLUMN success_stories.featured IS 'Featured stories shown prominently on homepage';
COMMENT ON COLUMN success_stories.view_count IS 'Number of times the story has been viewed';
COMMENT ON COLUMN story_media.display_order IS 'Order in which media appears in the gallery';
