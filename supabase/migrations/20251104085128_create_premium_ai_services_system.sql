/*
  # Create Premium AI Services System

  ## New Tables

  ### 1. premium_services
  Stores available premium AI services with their details and pricing.
  - `id` (uuid, primary key)
  - `name` (text) - Service name
  - `description` (text) - Service description
  - `type` (text) - 'free' or 'premium'
  - `category` (text) - Service category (cv, matching, coaching, etc.)
  - `price` (numeric) - Price in local currency
  - `icon` (text) - Icon name/path
  - `is_active` (boolean) - Whether service is currently available
  - `features` (jsonb) - List of features included
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. user_premium_services
  Tracks which users have access to which premium services.
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `service_id` (uuid, references premium_services)
  - `status` (text) - 'active', 'expired', 'cancelled'
  - `purchased_at` (timestamptz)
  - `expires_at` (timestamptz)
  - `payment_method` (text) - 'lengopay', 'digitalpay', 'orange_money', etc.
  - `transaction_id` (text)
  - `created_at` (timestamptz)

  ### 3. ai_cv_generations
  Stores AI-generated CVs for users.
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `profile_data` (jsonb) - Input data used
  - `generated_cv` (text) - Generated CV content
  - `format` (text) - 'pdf', 'docx', 'html'
  - `created_at` (timestamptz)

  ### 4. ai_cover_letters
  Stores AI-generated cover letters.
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `job_id` (uuid, references jobs)
  - `tone` (text) - 'formal', 'creative', 'simple'
  - `generated_letter` (text)
  - `created_at` (timestamptz)

  ### 5. ai_career_plans
  Stores AI-generated career plans.
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `current_profile` (jsonb)
  - `short_term_plan` (jsonb) - 3 years
  - `mid_term_plan` (jsonb) - 5 years
  - `long_term_plan` (jsonb) - 10 years
  - `recommended_skills` (jsonb)
  - `recommended_trainings` (jsonb)
  - `created_at` (timestamptz)

  ### 6. ai_chat_history
  Stores JobCoach IA chat conversations.
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `session_id` (uuid)
  - `message` (text)
  - `response` (text)
  - `message_type` (text) - 'user' or 'ai'
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage their own data
*/

-- Create premium_services table
CREATE TABLE IF NOT EXISTS public.premium_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  type text NOT NULL CHECK (type IN ('free', 'premium')),
  category text NOT NULL,
  price numeric DEFAULT 0,
  icon text,
  is_active boolean DEFAULT true,
  features jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_premium_services table
CREATE TABLE IF NOT EXISTS public.user_premium_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.premium_services(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  purchased_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  payment_method text,
  transaction_id text,
  created_at timestamptz DEFAULT now()
);

-- Create ai_cv_generations table
CREATE TABLE IF NOT EXISTS public.ai_cv_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_data jsonb NOT NULL,
  generated_cv text NOT NULL,
  format text DEFAULT 'html',
  created_at timestamptz DEFAULT now()
);

-- Create ai_cover_letters table
CREATE TABLE IF NOT EXISTS public.ai_cover_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  tone text DEFAULT 'formal' CHECK (tone IN ('formal', 'creative', 'simple')),
  generated_letter text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create ai_career_plans table
CREATE TABLE IF NOT EXISTS public.ai_career_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_profile jsonb NOT NULL,
  short_term_plan jsonb DEFAULT '{}'::jsonb,
  mid_term_plan jsonb DEFAULT '{}'::jsonb,
  long_term_plan jsonb DEFAULT '{}'::jsonb,
  recommended_skills jsonb DEFAULT '[]'::jsonb,
  recommended_trainings jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create ai_chat_history table
CREATE TABLE IF NOT EXISTS public.ai_chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  message text NOT NULL,
  response text,
  message_type text NOT NULL CHECK (message_type IN ('user', 'ai')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.premium_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_premium_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_cv_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_career_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

-- Policies for premium_services (public read, admin write)
CREATE POLICY "Anyone can view active services"
  ON public.premium_services
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage services"
  ON public.premium_services
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND user_type = 'admin'
    )
  );

-- Policies for user_premium_services
CREATE POLICY "Users can view own services"
  ON public.user_premium_services
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can purchase services"
  ON public.user_premium_services
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Policies for ai_cv_generations
CREATE POLICY "Users can view own CV generations"
  ON public.ai_cv_generations
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create CV generations"
  ON public.ai_cv_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own CV generations"
  ON public.ai_cv_generations
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Policies for ai_cover_letters
CREATE POLICY "Users can view own cover letters"
  ON public.ai_cover_letters
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create cover letters"
  ON public.ai_cover_letters
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own cover letters"
  ON public.ai_cover_letters
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Policies for ai_career_plans
CREATE POLICY "Users can view own career plans"
  ON public.ai_career_plans
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create career plans"
  ON public.ai_career_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own career plans"
  ON public.ai_career_plans
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Policies for ai_chat_history
CREATE POLICY "Users can view own chat history"
  ON public.ai_chat_history
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create chat messages"
  ON public.ai_chat_history
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_premium_services_user_id 
  ON public.user_premium_services(user_id);
CREATE INDEX IF NOT EXISTS idx_user_premium_services_service_id 
  ON public.user_premium_services(service_id);
CREATE INDEX IF NOT EXISTS idx_user_premium_services_status 
  ON public.user_premium_services(status);

CREATE INDEX IF NOT EXISTS idx_ai_cv_generations_user_id 
  ON public.ai_cv_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_cover_letters_user_id 
  ON public.ai_cover_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_career_plans_user_id 
  ON public.ai_career_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user_id 
  ON public.ai_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_session_id 
  ON public.ai_chat_history(session_id);

-- Insert default premium services
INSERT INTO public.premium_services (name, description, type, category, price, icon, features) VALUES
  (
    'Analyse & Matching IA',
    'Analyse automatique du profil et matching IA avec les offres d''emploi disponibles',
    'premium',
    'matching',
    25000,
    'target',
    '["Score de compatibilité 0-100", "Suggestions personnalisées", "Analyse en temps réel", "Recommandations d''amélioration"]'::jsonb
  ),
  (
    'Rédaction de CV IA',
    'Génération automatique d''un CV professionnel adapté à votre profil et secteur',
    'premium',
    'cv',
    15000,
    'file-text',
    '["CV professionnel", "Format PDF téléchargeable", "Optimisé ATS", "Multiples modèles"]'::jsonb
  ),
  (
    'Lettre de Motivation IA',
    'Création de lettres de motivation personnalisées pour chaque offre',
    'premium',
    'cover_letter',
    10000,
    'mail',
    '["Personnalisée par offre", "3 tons disponibles", "Optimisée recrutement", "Éditable"]'::jsonb
  ),
  (
    'JobCoach IA',
    'Assistant virtuel pour conseils emploi, préparation entretien et développement de carrière',
    'premium',
    'coaching',
    30000,
    'message-circle',
    '["Disponible 24/7", "Conseils personnalisés", "Préparation entretien", "Stratégie carrière"]'::jsonb
  ),
  (
    'Plan de Carrière IA',
    'Génération d''un plan de carrière complet à 3, 5 et 10 ans',
    'premium',
    'career_plan',
    20000,
    'trending-up',
    '["Plan 3-5-10 ans", "Compétences à développer", "Formations recommandées", "Opportunités identifiées"]'::jsonb
  ),
  (
    'Simulation d''Entretien IA',
    'Entraînez-vous avec des simulations d''entretien réalistes',
    'premium',
    'interview',
    15000,
    'video',
    '["Questions personnalisées", "Feedback détaillé", "Analyse de réponses", "Conseils d''amélioration"]'::jsonb
  )
ON CONFLICT DO NOTHING;