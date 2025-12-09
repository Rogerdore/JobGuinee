/*
  # Add Gold Profile Premium Service

  ## New Features

  ### 1. Gold Profile System
  Add gold profile status to candidate profiles with enhanced visibility features:
  - Profile visibility boost (appears on first page)
  - Professional coaching support
  - Video CV creation assistance
  - Priority support from JobGuinée team

  ### 2. Coaching Sessions Table
  Track coaching sessions booked by Gold members with professional coaches.

  ### 3. Video CV Table
  Store video CV metadata and URLs for Gold members.

  ### 4. Profile Visibility Tracking
  Track how many times a Gold profile appears in search results and first pages.

  ## Changes

  1. Add `is_gold_member` and gold-related fields to candidate_profiles
  2. Create coaching_sessions table
  3. Create video_cvs table
  4. Create profile_visibility_stats table
  5. Insert Gold Profile service into premium_services
  6. Add policies for new tables
*/

-- Add Gold member fields to candidate_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'candidate_profiles' AND column_name = 'is_gold_member'
  ) THEN
    ALTER TABLE public.candidate_profiles
      ADD COLUMN is_gold_member boolean DEFAULT false,
      ADD COLUMN gold_member_since timestamptz,
      ADD COLUMN gold_member_expires_at timestamptz,
      ADD COLUMN visibility_boost integer DEFAULT 0,
      ADD COLUMN priority_ranking integer DEFAULT 0;
  END IF;
END $$;

-- Create coaching_sessions table
CREATE TABLE IF NOT EXISTS public.coaching_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coach_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_type text NOT NULL CHECK (session_type IN ('cv_review', 'interview_prep', 'career_planning', 'salary_negotiation', 'general_coaching')),
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes text,
  coach_feedback text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create video_cvs table
CREATE TABLE IF NOT EXISTS public.video_cvs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  video_url text,
  thumbnail_url text,
  duration_seconds integer,
  file_size_mb numeric,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'published', 'archived')),
  view_count integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  created_by_coach boolean DEFAULT false,
  coach_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create profile_visibility_stats table
CREATE TABLE IF NOT EXISTS public.profile_visibility_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  first_page_appearances integer DEFAULT 0,
  total_appearances integer DEFAULT 0,
  profile_views integer DEFAULT 0,
  contact_reveals integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_visibility_stats ENABLE ROW LEVEL SECURITY;

-- Policies for coaching_sessions
CREATE POLICY "Users can view own coaching sessions"
  ON public.coaching_sessions
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR 
    coach_id = (SELECT auth.uid())
  );

CREATE POLICY "Users can create own coaching sessions"
  ON public.coaching_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own coaching sessions"
  ON public.coaching_sessions
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR 
    coach_id = (SELECT auth.uid())
  )
  WITH CHECK (
    user_id = (SELECT auth.uid()) OR 
    coach_id = (SELECT auth.uid())
  );

-- Policies for video_cvs
CREATE POLICY "Users can view own video CVs"
  ON public.video_cvs
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR
    status = 'published'
  );

CREATE POLICY "Users can create own video CVs"
  ON public.video_cvs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own video CVs"
  ON public.video_cvs
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own video CVs"
  ON public.video_cvs
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Policies for profile_visibility_stats
CREATE POLICY "Users can view own visibility stats"
  ON public.profile_visibility_stats
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_user_id 
  ON public.coaching_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_coach_id 
  ON public.coaching_sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_scheduled_at 
  ON public.coaching_sessions(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_video_cvs_user_id 
  ON public.video_cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_video_cvs_status 
  ON public.video_cvs(status);
CREATE INDEX IF NOT EXISTS idx_video_cvs_is_featured 
  ON public.video_cvs(is_featured);

CREATE INDEX IF NOT EXISTS idx_profile_visibility_stats_user_id 
  ON public.profile_visibility_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_visibility_stats_date 
  ON public.profile_visibility_stats(date);

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_is_gold 
  ON public.candidate_profiles(is_gold_member);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_priority 
  ON public.candidate_profiles(priority_ranking);

-- Insert Gold Profile service
INSERT INTO public.premium_services (name, description, type, category, price, icon, features, is_active)
VALUES (
  'Profil Gold',
  'Maximisez votre visibilité avec un profil Gold : apparition en première page, coaching personnalisé et vidéo CV professionnelle',
  'premium',
  'gold_profile',
  500000,
  'crown',
  '["Visibilité en première page", "3 séances de coaching personnalisé", "Création de vidéo CV professionnelle", "Support prioritaire cabinet JobGuinée", "Badge Gold sur votre profil", "Statistiques de visibilité détaillées", "Mise en avant auprès des recruteurs"]'::jsonb,
  true
)
ON CONFLICT DO NOTHING;

-- Function to boost gold profile visibility
CREATE OR REPLACE FUNCTION public.boost_gold_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.candidate_profiles
  SET 
    priority_ranking = 100,
    visibility_boost = 10
  WHERE is_gold_member = true
    AND gold_member_expires_at > now();
    
  UPDATE public.candidate_profiles
  SET 
    is_gold_member = false,
    priority_ranking = 0,
    visibility_boost = 0
  WHERE is_gold_member = true
    AND gold_member_expires_at <= now();
END;
$$;

-- Function to track profile visibility
CREATE OR REPLACE FUNCTION public.track_profile_view(
  p_user_id uuid,
  p_is_first_page boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profile_visibility_stats (
    user_id,
    date,
    first_page_appearances,
    total_appearances,
    profile_views
  )
  VALUES (
    p_user_id,
    CURRENT_DATE,
    CASE WHEN p_is_first_page THEN 1 ELSE 0 END,
    1,
    0
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    first_page_appearances = profile_visibility_stats.first_page_appearances + CASE WHEN p_is_first_page THEN 1 ELSE 0 END,
    total_appearances = profile_visibility_stats.total_appearances + 1;
END;
$$;