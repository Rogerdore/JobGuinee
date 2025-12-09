);

CREATE TABLE IF NOT EXISTS job_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at timestamptz DEFAULT now() NOT NULL,
  ip_address text,
  user_agent text
);

-- ============================================================================
-- 2.6 Newsletter
-- ============================================================================

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  domain text DEFAULT 'all',
  subscribed_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  unsubscribed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 2.7 CMS System
-- ============================================================================

CREATE TABLE IF NOT EXISTS site_settings (
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

CREATE TABLE IF NOT EXISTS cms_pages (
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

CREATE TABLE IF NOT EXISTS cms_sections (
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

CREATE TABLE IF NOT EXISTS cms_media (
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

CREATE TABLE IF NOT EXISTS cms_navigation (
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

CREATE TABLE IF NOT EXISTS cms_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_key TEXT NOT NULL,
  language_code TEXT DEFAULT 'fr' CHECK (language_code IN ('fr', 'en')),
  translation_value TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(translation_key, language_code)
);

CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id) NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 2.8 Premium AI Services System
-- ============================================================================

CREATE TABLE IF NOT EXISTS premium_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  type text NOT NULL CHECK (type IN ('free', 'premium')),
  category text NOT NULL,
  price numeric DEFAULT 0,
  credits_cost INTEGER DEFAULT 0,
  icon text,
  is_active boolean DEFAULT true,
  features jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_premium_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES premium_services(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  purchased_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  payment_method text,
  transaction_id text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_cv_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_data jsonb NOT NULL,
  generated_cv text NOT NULL,
  format text DEFAULT 'html',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_cover_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  tone text DEFAULT 'formal' CHECK (tone IN ('formal', 'creative', 'simple')),
  generated_letter text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_career_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_profile jsonb NOT NULL,
  short_term_plan jsonb DEFAULT '{}'::jsonb,
  mid_term_plan jsonb DEFAULT '{}'::jsonb,
  long_term_plan jsonb DEFAULT '{}'::jsonb,
  recommended_skills jsonb DEFAULT '[]'::jsonb,
  recommended_trainings jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  message text NOT NULL,
  response text,
  message_type text NOT NULL CHECK (message_type IN ('user', 'ai')),
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 2.9 Gold Profile System
-- ============================================================================

CREATE TABLE IF NOT EXISTS coaching_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
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

CREATE TABLE IF NOT EXISTS video_cvs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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
  coach_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profile_visibility_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  first_page_appearances integer DEFAULT 0,
  total_appearances integer DEFAULT 0,
  profile_views integer DEFAULT 0,
  contact_reveals integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- ============================================================================
-- 2.10 Credit System
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_credit_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_code TEXT UNIQUE NOT NULL,
  service_name TEXT NOT NULL,
  service_description TEXT,
  credits_cost INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  credits_amount integer NOT NULL,
  price_gnf bigint NOT NULL,
  payment_method text,
  payment_status text DEFAULT 'pending',
  transaction_id text,
  purchased_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 2.11 Formations System
-- ============================================================================

CREATE TABLE IF NOT EXISTS trainer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid UNIQUE REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_name text,
  organization_type text DEFAULT 'individual' CHECK (organization_type IN ('individual', 'company', 'institute')),
  bio text,
  specializations text[] DEFAULT '{}',
  certifications jsonb DEFAULT '[]',
  experience_years integer DEFAULT 0,
  website text,
  linkedin_url text,
  hourly_rate numeric DEFAULT 0,
  is_verified boolean DEFAULT false,
  rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_students integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS formation_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  formation_id uuid REFERENCES formations(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_method text NOT NULL CHECK (payment_method IN ('orange_money', 'lengopay', 'digitalpay', 'card')),
  amount integer NOT NULL CHECK (amount >= 0),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coaching_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  coaching_type text NOT NULL CHECK (coaching_type IN ('cv_review', 'interview_prep', 'career_orientation')),
  scheduled_date timestamptz NOT NULL,
  duration integer NOT NULL CHECK (duration IN (30, 60, 120)),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_method text NOT NULL CHECK (payment_method IN ('orange_money', 'lengopay', 'digitalpay', 'card')),
  amount integer NOT NULL CHECK (amount >= 0),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trainer_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  linkedin_url text DEFAULT '',
  expertise_domain text NOT NULL,
  experience_years integer NOT NULL CHECK (experience_years >= 0),
  description text NOT NULL,
  cv_url text DEFAULT '',
  portfolio_url text DEFAULT '',
  proposed_formations text NOT NULL,
  availability text NOT NULL,
  motivation text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 2.12 Chatbot System
-- ============================================================================

CREATE TABLE IF NOT EXISTS chatbot_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled boolean DEFAULT true,
  position text DEFAULT 'bottom-right' CHECK (position IN ('bottom-right', 'bottom-left')),
  welcome_message text DEFAULT 'Bonjour! Comment puis-je vous aider aujourd''hui?',
  idle_message text DEFAULT 'Besoin d''aide? Je suis là pour vous!',
  ia_service_code text DEFAULT 'site_chatbot',
  show_quick_actions boolean DEFAULT true,
  max_context_messages int DEFAULT 10 CHECK (max_context_messages >= 0 AND max_context_messages <= 50),
  proactive_mode boolean DEFAULT false,
  proactive_delay int DEFAULT 15000 CHECK (proactive_delay >= 5000 AND proactive_delay <= 60000),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chatbot_styles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  primary_color text DEFAULT '#3B82F6',
  secondary_color text DEFAULT '#1E40AF',
  background_color text DEFAULT '#FFFFFF',
  text_color text DEFAULT '#1F2937',
  bubble_color_user text DEFAULT '#3B82F6',
  bubble_color_bot text DEFAULT '#F3F4F6',
  border_radius int DEFAULT 12 CHECK (border_radius >= 0 AND border_radius <= 50),
  widget_size text DEFAULT 'medium' CHECK (widget_size IN ('small', 'medium', 'large')),
  icon_type text DEFAULT 'default' CHECK (icon_type IN ('default', 'custom')),
  icon_value text,
  enable_dark_mode boolean DEFAULT true,
  shadow_strength text DEFAULT 'soft' CHECK (shadow_strength IN ('none', 'soft', 'strong')),
  animation_type text DEFAULT 'slide' CHECK (animation_type IN ('fade', 'slide', 'scale')),
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chatbot_knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  intent_name text,
  priority_level int DEFAULT 1 CHECK (priority_level >= 1 AND priority_level <= 10),
  tags text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chatbot_quick_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  description text,
  icon text DEFAULT 'MessageCircle',
  action_type text NOT NULL CHECK (action_type IN ('open_route', 'open_modal', 'run_service')),
  action_payload jsonb NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chatbot_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  message_user text NOT NULL,
  message_bot text NOT NULL,
  tokens_used int DEFAULT 0,
  response_time_ms int,
  intent_detected text,
  page_url text,
  session_id text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- SECTION 3: CREATE INDEXES
-- ============================================================================

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;

-- Workflow stages indexes
CREATE INDEX IF NOT EXISTS idx_workflow_stages_company ON workflow_stages(company_id);

-- Application notes and timeline indexes
CREATE INDEX IF NOT EXISTS idx_application_notes_application_id ON application_notes(application_id);
CREATE INDEX IF NOT EXISTS idx_application_notes_recruiter ON application_notes(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_application_timeline_application_id ON application_timeline(application_id);
CREATE INDEX IF NOT EXISTS idx_application_timeline_user ON application_timeline(user_id);

-- Recruiter messages indexes
CREATE INDEX IF NOT EXISTS idx_recruiter_messages_application_id ON recruiter_messages(application_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_messages_sender ON recruiter_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_messages_recipient_id ON recruiter_messages(recipient_id);

-- Talent searches indexes
CREATE INDEX IF NOT EXISTS idx_talent_searches_recruiter ON talent_searches(recruiter_id, created_at);
CREATE INDEX IF NOT EXISTS idx_favorite_candidates_recruiter ON favorite_candidates(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_favorite_candidates_candidate ON favorite_candidates(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_contacts_recruiter ON candidate_contacts(recruiter_id, created_at);
CREATE INDEX IF NOT EXISTS idx_candidate_contacts_candidate ON candidate_contacts(candidate_id, created_at);
CREATE INDEX IF NOT EXISTS idx_cv_downloads_recruiter ON cv_downloads(recruiter_id, downloaded_at);

-- Profile cart and purchases indexes
CREATE INDEX IF NOT EXISTS idx_profile_cart_user_id ON profile_cart(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profile_purchases_payment_status ON profile_purchases(payment_status);

-- Job features indexes
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON saved_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_job_views_job_id ON job_views(job_id);
CREATE INDEX IF NOT EXISTS idx_job_views_user ON job_views(user_id);

-- Newsletter indexes
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON newsletter_subscribers(is_active);
CREATE INDEX IF NOT EXISTS idx_newsletter_domain ON newsletter_subscribers(domain);

-- CMS indexes
CREATE INDEX IF NOT EXISTS idx_cms_media_uploaded_by ON cms_media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_cms_navigation_page_id ON cms_navigation(page_id);
CREATE INDEX IF NOT EXISTS idx_cms_navigation_parent_id ON cms_navigation(parent_id);
CREATE INDEX IF NOT EXISTS idx_cms_pages_author_id ON cms_pages(author_id);
CREATE INDEX IF NOT EXISTS idx_site_settings_updated_by ON site_settings(updated_by);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_activity_logs(admin_id, created_at DESC);

-- Premium services indexes
CREATE INDEX IF NOT EXISTS idx_user_premium_services_user_id ON user_premium_services(user_id);
CREATE INDEX IF NOT EXISTS idx_user_premium_services_service_id ON user_premium_services(service_id);
CREATE INDEX IF NOT EXISTS idx_user_premium_services_status ON user_premium_services(status);
CREATE INDEX IF NOT EXISTS idx_ai_cv_generations_user_id ON ai_cv_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_cover_letters_user_id ON ai_cover_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_career_plans_user_id ON ai_career_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user_id ON ai_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_session_id ON ai_chat_history(session_id);

-- Gold profile indexes
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_user_id ON coaching_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_coach_id ON coaching_sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_scheduled_at ON coaching_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_video_cvs_user_id ON video_cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_video_cvs_status ON video_cvs(status);
CREATE INDEX IF NOT EXISTS idx_video_cvs_is_featured ON video_cvs(is_featured);
CREATE INDEX IF NOT EXISTS idx_profile_visibility_stats_user_id ON profile_visibility_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_visibility_stats_date ON profile_visibility_stats(date);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_priority ON candidate_profiles(priority_ranking);

-- Trainer and formations indexes
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_profile_id ON trainer_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_user_id ON trainer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_is_verified ON trainer_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_formation_enrollments_user ON formation_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_formation_enrollments_formation ON formation_enrollments(formation_id);
CREATE INDEX IF NOT EXISTS idx_formation_enrollments_status ON formation_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_coaching_bookings_user ON coaching_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_bookings_date ON coaching_bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_coaching_bookings_status ON coaching_bookings(status);
CREATE INDEX IF NOT EXISTS idx_trainer_applications_user ON trainer_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_trainer_applications_status ON trainer_applications(status);

-- Chatbot indexes
CREATE INDEX IF NOT EXISTS idx_kb_category ON chatbot_knowledge_base(category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_kb_intent ON chatbot_knowledge_base(intent_name) WHERE is_active = true AND intent_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kb_tags ON chatbot_knowledge_base USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_quick_actions_order ON chatbot_quick_actions(order_index) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_chatbot_logs_user ON chatbot_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chatbot_logs_session ON chatbot_logs(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chatbot_logs_created ON chatbot_logs(created_at DESC);

-- ============================================================================
-- SECTION 4: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_navigation ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_premium_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cv_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_career_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_visibility_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_credit_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE formation_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_quick_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 5: CREATE RLS POLICIES
-- ============================================================================

-- ============================================================================
-- 5.1 Notifications policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Notification preferences policies
DROP POLICY IF EXISTS "Users can view own preferences" ON notification_preferences;
CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own preferences" ON notification_preferences;
CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own preferences" ON notification_preferences;
CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- 5.2 Workflow stages policies
-- ============================================================================
DROP POLICY IF EXISTS "Companies can manage their workflow stages" ON workflow_stages;
CREATE POLICY "Companies can manage their workflow stages"
  ON workflow_stages
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = company_id
      AND companies.profile_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- 5.3 Application notes policies
-- ============================================================================
DROP POLICY IF EXISTS "Recruiters can view notes for their company applications" ON application_notes;
CREATE POLICY "Recruiters can view notes for their company applications"
  ON application_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE a.id = application_id
      AND c.profile_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Recruiters can create notes" ON application_notes;
CREATE POLICY "Recruiters can create notes"
  ON application_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    recruiter_id = (SELECT auth.uid()) AND
    EXISTS (
      SELECT 1 FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      WHERE a.id = application_id
      AND c.profile_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- 5.4 Application timeline policies
-- ============================================================================
DROP POLICY IF EXISTS "Recruiters and candidates can view timeline" ON application_timeline;
CREATE POLICY "Recruiters and candidates can view timeline"
  ON application_timeline FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.id = application_id
      AND (
        a.candidate_id = (SELECT auth.uid()) OR
        EXISTS (
          SELECT 1 FROM jobs j
          JOIN companies c ON j.company_id = c.id
          WHERE j.id = a.job_id
          AND c.profile_id = (SELECT auth.uid())
        )
      )
    )
  );

DROP POLICY IF EXISTS "System can insert timeline events" ON application_timeline;
CREATE POLICY "System can insert timeline events"
  ON application_timeline FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- 5.5 Recruiter messages policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their messages" ON recruiter_messages;
CREATE POLICY "Users can view their messages"
  ON recruiter_messages FOR SELECT
  TO authenticated
  USING (
    sender_id = (SELECT auth.uid()) OR
    recipient_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "Users can send messages" ON recruiter_messages;
CREATE POLICY "Users can send messages"
  ON recruiter_messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their received messages" ON recruiter_messages;
CREATE POLICY "Users can update their received messages"
  ON recruiter_messages FOR UPDATE
  TO authenticated
  USING (recipient_id = (SELECT auth.uid()))
  WITH CHECK (recipient_id = (SELECT auth.uid()));

-- ============================================================================
-- 5.6 Talent search policies
-- ============================================================================
DROP POLICY IF EXISTS "Recruiters can view own searches" ON talent_searches;
CREATE POLICY "Recruiters can view own searches"
  ON talent_searches FOR SELECT
  TO authenticated
  USING (recruiter_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Recruiters can insert own searches" ON talent_searches;
CREATE POLICY "Recruiters can insert own searches"
  ON talent_searches FOR INSERT
  TO authenticated
  WITH CHECK (recruiter_id = (SELECT auth.uid()));

-- ============================================================================
-- 5.7 Favorite candidates policies
-- ============================================================================
DROP POLICY IF EXISTS "Recruiters can view own favorites" ON favorite_candidates;
CREATE POLICY "Recruiters can view own favorites"
  ON favorite_candidates FOR SELECT
  TO authenticated
  USING (recruiter_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Recruiters can manage own favorites" ON favorite_candidates;
CREATE POLICY "Recruiters can manage own favorites"
  ON favorite_candidates FOR ALL
  TO authenticated
  USING (recruiter_id = (SELECT auth.uid()))
  WITH CHECK (recruiter_id = (SELECT auth.uid()));

-- ============================================================================
-- 5.8 Profile cart policies
-- ============================================================================
DROP POLICY IF EXISTS "View cart items" ON profile_cart;
CREATE POLICY "View cart items"
  ON profile_cart
  FOR SELECT
  USING (
    (user_id = (SELECT auth.uid())) OR
    (session_id IS NOT NULL AND user_id IS NULL)
  );

DROP POLICY IF EXISTS "Add to cart" ON profile_cart;
CREATE POLICY "Add to cart"
  ON profile_cart
  FOR INSERT
  WITH CHECK (
    (user_id = (SELECT auth.uid())) OR
    (session_id IS NOT NULL AND user_id IS NULL)
  );

DROP POLICY IF EXISTS "Remove from cart" ON profile_cart;
CREATE POLICY "Remove from cart"
  ON profile_cart
  FOR DELETE
  USING (
    (user_id = (SELECT auth.uid())) OR
    (session_id IS NOT NULL AND user_id IS NULL)
  );

-- ============================================================================
-- 5.9 Profile purchases policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can view purchases" ON profile_purchases;
CREATE POLICY "Users can view purchases"
  ON profile_purchases
  FOR SELECT
  TO authenticated
  USING (buyer_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can create purchases" ON profile_purchases;
CREATE POLICY "Users can create purchases"
  ON profile_purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update purchases" ON profile_purchases;
CREATE POLICY "Users can update purchases"
  ON profile_purchases
  FOR UPDATE
  TO authenticated
  USING (buyer_id = (SELECT auth.uid()))
  WITH CHECK (buyer_id = (SELECT auth.uid()));

-- ============================================================================
-- 5.10 Saved jobs policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own saved jobs" ON saved_jobs;
CREATE POLICY "Users can view own saved jobs"
  ON saved_jobs FOR SELECT
  TO authenticated
  USING (candidate_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can save jobs" ON saved_jobs;
CREATE POLICY "Users can save jobs"
  ON saved_jobs FOR INSERT
  TO authenticated
  WITH CHECK (candidate_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can unsave jobs" ON saved_jobs;
CREATE POLICY "Users can unsave jobs"
  ON saved_jobs FOR DELETE
  TO authenticated
  USING (candidate_id = (SELECT auth.uid()));

-- ============================================================================
-- 5.11 Newsletter policies
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscribers
  FOR INSERT
  TO public
  WITH CHECK (true);

-- ============================================================================
-- 5.12 CMS policies
-- ============================================================================

-- Site settings
DROP POLICY IF EXISTS "Settings are viewable" ON site_settings;
CREATE POLICY "Settings are viewable"
  ON site_settings
  FOR SELECT
  TO authenticated
  USING (
    is_public = true OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid())
      AND user_type = 'admin'
    )
  );

-- CMS pages
DROP POLICY IF EXISTS "Published pages are viewable by everyone" ON cms_pages;
CREATE POLICY "Published pages are viewable by everyone"
  ON cms_pages FOR SELECT
  USING (status = 'published' OR EXISTS (
    SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND user_type = 'admin'
  ));

-- ============================================================================
-- 5.13 Premium services policies
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can view active services" ON premium_services;
CREATE POLICY "Anyone can view active services"
  ON premium_services
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Users can view own services" ON user_premium_services;
CREATE POLICY "Users can view own services"
  ON user_premium_services
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can purchase services" ON user_premium_services;
CREATE POLICY "Users can purchase services"
  ON user_premium_services
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- AI services policies
DROP POLICY IF EXISTS "Users can view own CV generations" ON ai_cv_generations;
CREATE POLICY "Users can view own CV generations"
  ON ai_cv_generations FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can create CV generations" ON ai_cv_generations;
CREATE POLICY "Users can create CV generations"
  ON ai_cv_generations FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own CV generations" ON ai_cv_generations;
CREATE POLICY "Users can delete own CV generations"
  ON ai_cv_generations FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- 5.14 Trainer profiles policies
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can view verified trainer profiles" ON trainer_profiles;
CREATE POLICY "Anyone can view verified trainer profiles"
  ON trainer_profiles FOR SELECT
  USING (is_verified = true);

DROP POLICY IF EXISTS "Trainers can view own profile" ON trainer_profiles;
CREATE POLICY "Trainers can view own profile"
  ON trainer_profiles FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Trainers can create own profile" ON trainer_profiles;
CREATE POLICY "Trainers can create own profile"
  ON trainer_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Trainers can update own profile" ON trainer_profiles;
CREATE POLICY "Trainers can update own profile"
  ON trainer_profiles FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- 5.15 Chatbot policies
-- ============================================================================
DROP POLICY IF EXISTS "Public can read chatbot settings" ON chatbot_settings;
CREATE POLICY "Public can read chatbot settings"
  ON chatbot_settings FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Public can read chatbot styles" ON chatbot_styles;
CREATE POLICY "Public can read chatbot styles"
  ON chatbot_styles FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Public can read active knowledge base" ON chatbot_knowledge_base;
CREATE POLICY "Public can read active knowledge base"
  ON chatbot_knowledge_base FOR SELECT
  TO public
  USING (is_active = true);

DROP POLICY IF EXISTS "Public can read active quick actions" ON chatbot_quick_actions;
CREATE POLICY "Public can read active quick actions"
  ON chatbot_quick_actions FOR SELECT
  TO public
  USING (is_active = true);

DROP POLICY IF EXISTS "Users can read their own logs" ON chatbot_logs;
CREATE POLICY "Users can read their own logs"
  ON chatbot_logs FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can create logs" ON chatbot_logs;
CREATE POLICY "Authenticated users can create logs"
  ON chatbot_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- SECTION 6: CREATE FUNCTIONS AND TRIGGERS
-- ============================================================================

-- ============================================================================
-- 6.1 Profile creation trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, user_type, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'candidate'),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
    user_type = COALESCE(EXCLUDED.user_type, profiles.user_type),
    updated_at = now();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in create_profile_on_signup: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_on_signup();

-- ============================================================================
-- 6.2 Notification preferences trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_preferences ON auth.users;
CREATE TRIGGER on_auth_user_created_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- ============================================================================
-- 6.3 Default workflow stages trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION create_default_workflow_stages()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO workflow_stages (company_id, stage_name, stage_order, stage_color) VALUES
  (NEW.id, 'Nouveau', 1, '#3B82F6'),
  (NEW.id, 'Présélectionné', 2, '#10B981'),
  (NEW.id, 'Entretien', 3, '#F59E0B'),
  (NEW.id, 'Offre', 4, '#8B5CF6'),
  (NEW.id, 'Embauché', 5, '#059669'),
  (NEW.id, 'Rejeté', 6, '#EF4444')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_workflow_stages_on_company_insert ON companies;
CREATE TRIGGER create_workflow_stages_on_company_insert
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION create_default_workflow_stages();

-- ============================================================================
-- 6.4 Application change logging trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION log_application_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_type TEXT;
  v_user_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_event_type := 'application_submitted';
    v_user_id := NEW.candidate_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    v_event_type := 'status_changed';
    v_user_id := auth.uid();
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO application_timeline (
    application_id,
    event_type,
    event_description,
    old_value,
    new_value,
    user_id
  ) VALUES (
    NEW.id,
    v_event_type,
    CASE
      WHEN v_event_type = 'application_submitted' THEN 'Candidature soumise'
      WHEN v_event_type = 'status_changed' THEN 'Statut changé de ' || OLD.status || ' à ' || NEW.status
    END,
    CASE WHEN v_event_type = 'status_changed' THEN OLD.status ELSE NULL END,
    CASE WHEN v_event_type = 'status_changed' THEN NEW.status ELSE NULL END,
    v_user_id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_application_change ON applications;
CREATE TRIGGER on_application_change
  AFTER INSERT OR UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION log_application_change();

-- ============================================================================
-- 6.5 Job view count trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_job_view_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE jobs
  SET views_count = views_count + 1
  WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_job_view_created ON job_views;
CREATE TRIGGER on_job_view_created
  AFTER INSERT ON job_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_job_view_count();

-- ============================================================================
-- 6.6 Applications count trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION update_job_applications_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE jobs
    SET applications_count = applications_count + 1
    WHERE id = NEW.job_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE jobs
    SET applications_count = GREATEST(applications_count - 1, 0)
    WHERE id = OLD.job_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_application_change_count ON applications;
CREATE TRIGGER on_application_change_count
  AFTER INSERT OR DELETE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_job_applications_count();

-- ============================================================================
-- 6.7 Newsletter updated_at trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION update_newsletter_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_newsletter_updated_at_trigger ON newsletter_subscribers;
CREATE TRIGGER update_newsletter_updated_at_trigger
  BEFORE UPDATE ON newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_newsletter_updated_at();

-- ============================================================================
-- 6.8 CMS updated_at triggers
-- ============================================================================
CREATE OR REPLACE FUNCTION update_cms_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_cms_updated_at();

DROP TRIGGER IF EXISTS update_cms_pages_updated_at ON cms_pages;
CREATE TRIGGER update_cms_pages_updated_at
  BEFORE UPDATE ON cms_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_cms_updated_at();

DROP TRIGGER IF EXISTS update_cms_sections_updated_at ON cms_sections;
CREATE TRIGGER update_cms_sections_updated_at
  BEFORE UPDATE ON cms_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_cms_updated_at();

DROP TRIGGER IF EXISTS update_cms_navigation_updated_at ON cms_navigation;
CREATE TRIGGER update_cms_navigation_updated_at
  BEFORE UPDATE ON cms_navigation
  FOR EACH ROW
  EXECUTE FUNCTION update_cms_updated_at();

DROP TRIGGER IF EXISTS update_cms_translations_updated_at ON cms_translations;
CREATE TRIGGER update_cms_translations_updated_at
  BEFORE UPDATE ON cms_translations
  FOR EACH ROW
  EXECUTE FUNCTION update_cms_updated_at();

-- ============================================================================
-- 6.9 Trainer profiles updated_at trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION update_trainer_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_trainer_profiles_updated_at_trigger ON trainer_profiles;
CREATE TRIGGER update_trainer_profiles_updated_at_trigger
  BEFORE UPDATE ON trainer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_trainer_profiles_updated_at();

-- ============================================================================
-- 6.10 Utility functions
-- ============================================================================

-- Check if company has active premium subscription
CREATE OR REPLACE FUNCTION has_active_premium(company_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM companies
    WHERE id = company_id_param
    AND subscription_tier IN ('premium', 'enterprise')
    AND (subscription_end_date IS NULL OR subscription_end_date > now())
  );
END;
$$;

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND user_type = 'admin'
  );
END;
$$;

-- Boost gold profiles visibility
CREATE OR REPLACE FUNCTION boost_gold_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE candidate_profiles
  SET
    priority_ranking = 100,
    visibility_boost = 10
  WHERE is_gold_member = true
    AND gold_member_expires_at > now();

  UPDATE candidate_profiles
  SET
    is_gold_member = false,
    priority_ranking = 0,
    visibility_boost = 0
  WHERE is_gold_member = true
    AND gold_member_expires_at <= now();
END;
$$;

-- Track profile view
CREATE OR REPLACE FUNCTION track_profile_view(
  p_user_id uuid,
  p_is_first_page boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profile_visibility_stats (
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

-- ============================================================================
-- SECTION 7: INSERT DEFAULT DATA
-- ============================================================================

-- Insert site settings
INSERT INTO site_settings (setting_key, setting_value, category, description, is_public) VALUES
  ('site_name', '{"value": "JobGuinée"}', 'general', 'Nom du site', true),
  ('site_tagline', '{"value": "La première plateforme guinéenne de recrutement digital"}', 'general', 'Slogan du site', true),
  ('contact_email', '{"value": "contact@jobguinee.com"}', 'contact', 'Email de contact', true),
  ('primary_color', '{"value": "#0E2F56"}', 'theme', 'Couleur principale', true),
  ('secondary_color', '{"value": "#FF8C00"}', 'theme', 'Couleur secondaire', true)
ON CONFLICT (setting_key) DO NOTHING;

-- Insert premium services
INSERT INTO premium_services (name, description, type, category, price, credits_cost, icon, features) VALUES
  (
    'Analyse & Matching IA',
    'Analyse automatique du profil et matching IA avec les offres d''emploi disponibles',
    'premium',
    'matching',
    25000,
    50,
    'target',
    '["Score de compatibilité 0-100", "Suggestions personnalisées", "Analyse en temps réel"]'::jsonb
  ),
  (
    'Rédaction de CV IA',
    'Génération automatique d''un CV professionnel adapté à votre profil',
    'premium',
    'cv',
    15000,
    30,
    'file-text',
    '["CV professionnel", "Format PDF téléchargeable", "Optimisé ATS"]'::jsonb
  ),
  (
    'Lettre de Motivation IA',
    'Création de lettres de motivation personnalisées',
    'premium',
    'cover_letter',
    10000,
    20,
    'mail',
    '["Personnalisée par offre", "3 tons disponibles", "Éditable"]'::jsonb
  ),
  (
    'JobCoach IA',
    'Assistant virtuel pour conseils emploi et préparation entretien',
    'premium',
    'coaching',
    30000,
    60,
    'message-circle',
    '["Disponible 24/7", "Conseils personnalisés", "Préparation entretien"]'::jsonb
  ),
  (
    'Plan de Carrière IA',
    'Génération d''un plan de carrière complet à 3, 5 et 10 ans',
    'premium',
    'career_plan',
    20000,
    40,
    'trending-up',
    '["Plan 3-5-10 ans", "Compétences à développer", "Formations recommandées"]'::jsonb
  ),
  (
    'Profil Gold',
    'Maximisez votre visibilité avec un profil Gold',
    'premium',
    'gold_profile',
    500000,
    1000,
    'crown',
    '["Visibilité première page", "3 séances coaching", "Vidéo CV pro", "Badge Gold"]'::jsonb
  )
ON CONFLICT DO NOTHING;

-- Insert service credit costs
INSERT INTO service_credit_costs (service_code, service_name, service_description, credits_cost, is_active, category)
VALUES
  ('ai_cv_generation', 'Rédaction de CV IA', 'Génération automatique de CV professionnel', 30, true, 'cv'),
  ('ai_cover_letter_generation', 'Lettre de Motivation IA', 'Génération de lettre de motivation', 20, true, 'cover_letter'),
  ('job_matching', 'Analyse & Matching IA', 'Analyse et matching avec offres d''emploi', 50, true, 'matching'),
  ('interview_coaching', 'JobCoach IA', 'Coaching pour préparation aux entretiens', 60, true, 'coaching'),
  ('career_path_planning', 'Plan de Carrière IA', 'Planification de carrière personnalisée', 40, true, 'career_plan'),
  ('profile_visibility_boost', 'Boost de Visibilité', 'Augmenter la visibilité du profil', 25, true, 'visibility')
ON CONFLICT (service_code) DO NOTHING;

-- Insert chatbot settings
INSERT INTO chatbot_settings (is_enabled, position, welcome_message, idle_message)
VALUES (
  true,
  'bottom-right',
  'Bonjour! Je suis l''assistant virtuel de JobGuinée. Comment puis-je vous aider aujourd''hui?',
  'Besoin d''aide pour naviguer sur JobGuinée? Je suis là!'
)
ON CONFLICT DO NOTHING;

-- Insert default chatbot style
INSERT INTO chatbot_styles (
  name,
  primary_color,
  secondary_color,
  background_color,
  text_color,
  bubble_color_user,
  bubble_color_bot,
  border_radius,
  widget_size,
  shadow_strength,
  animation_type,
  is_default
) VALUES (
  'JobGuinée Default',
  '#3B82F6',
  '#1E40AF',
  '#FFFFFF',
  '#1F2937',
  '#3B82F6',
  '#F3F4F6',
  12,
  'medium',
  'soft',
  'slide',
  true
)
ON CONFLICT (name) DO NOTHING;

-- Insert chatbot knowledge base
INSERT INTO chatbot_knowledge_base (category, question, answer, intent_name, priority_level, tags) VALUES
(
  'Navigation',
  'Comment créer un CV?',
  'Pour créer un CV avec l''IA, rendez-vous dans "Services Premium IA" puis cliquez sur "Génération CV IA".',
  'create_cv',
  9,
  ARRAY['cv', 'création', 'ia']
),
(
  'Navigation',
  'Comment acheter des crédits?',
  'Vous pouvez acheter des crédits IA dans la Boutique de Crédits depuis votre dashboard candidat.',
  'buy_credits',
  9,
  ARRAY['crédits', 'achat']
),
(
  'Services',
  'Quels sont les services IA disponibles?',
  'JobGuinée propose: Génération de CV, Lettres de motivation, Matching intelligent, Coaching IA, et Plan de carrière.',
  'ia_services',
  7,
  ARRAY['services', 'ia']
)
ON CONFLICT DO NOTHING;

-- Insert chatbot quick actions
INSERT INTO chatbot_quick_actions (label, description, icon, action_type, action_payload, order_index) VALUES
('Générer un CV', 'Créer un CV professionnel avec l''IA', 'FileText', 'open_route', '{"page": "premium-ai"}', 1),
('Voir les offres', 'Parcourir les offres d''emploi', 'Briefcase', 'open_route', '{"page": "jobs"}', 2),
('Acheter des crédits', 'Recharger mon compte crédits IA', 'Coins', 'open_route', '{"page": "credit-store"}', 3),
('Mon dashboard', 'Accéder à mon espace personnel', 'LayoutDashboard', 'open_route', '{"page": "candidate-dashboard"}', 4)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- END OF CONSOLIDATED MIGRATION
-- ============================================================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE '
  ============================================================================
  CONSOLIDATED MIGRATION COMPLETED SUCCESSFULLY
  ============================================================================

  All database changes have been applied:
  - Extended existing tables with new columns
  - Created 40+ new tables for all features
  - Set up RLS policies for security
  - Created indexes for performance
  - Added functions and triggers
  - Inserted default data

  Your JobGuinée database is now ready!
  ============================================================================
  ';
END $$;
