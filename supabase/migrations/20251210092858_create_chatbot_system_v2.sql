/*
  # Système Chatbot IA Intelligent V2

  1. Nouvelles Tables
    - `chatbot_settings` - Configuration générale du chatbot
    - `chatbot_styles` - Styles et thèmes personnalisables
    - `chatbot_knowledge_base` - Base de connaissances et réponses pré-définies
    - `chatbot_quick_actions` - Actions rapides configurables
    - `chatbot_logs` - Historique des conversations

  2. Sécurité
    - RLS activé sur toutes les tables
    - Lecture publique pour settings, styles, knowledge_base, quick_actions
    - Modification réservée aux administrateurs
    - Logs visibles uniquement par les administrateurs
*/

-- Table chatbot_settings (configuration générale)
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

-- Table chatbot_styles (personnalisation visuelle)
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

-- Table chatbot_knowledge_base (base de connaissances)
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

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_kb_category ON chatbot_knowledge_base(category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_kb_intent ON chatbot_knowledge_base(intent_name) WHERE is_active = true AND intent_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_kb_tags ON chatbot_knowledge_base USING gin(tags);

-- Table chatbot_quick_actions (actions rapides)
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

-- Index pour tri
CREATE INDEX IF NOT EXISTS idx_quick_actions_order ON chatbot_quick_actions(order_index) WHERE is_active = true;

-- Table chatbot_logs (historique des conversations)
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

-- Index pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_chatbot_logs_user ON chatbot_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chatbot_logs_session ON chatbot_logs(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chatbot_logs_created ON chatbot_logs(created_at DESC);

-- RLS Policies

-- chatbot_settings
ALTER TABLE chatbot_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read chatbot settings"
  ON chatbot_settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage chatbot settings"
  ON chatbot_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- chatbot_styles
ALTER TABLE chatbot_styles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read chatbot styles"
  ON chatbot_styles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage chatbot styles"
  ON chatbot_styles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- chatbot_knowledge_base
ALTER TABLE chatbot_knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active knowledge base"
  ON chatbot_knowledge_base FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage knowledge base"
  ON chatbot_knowledge_base FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- chatbot_quick_actions
ALTER TABLE chatbot_quick_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active quick actions"
  ON chatbot_quick_actions FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage quick actions"
  ON chatbot_quick_actions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- chatbot_logs
ALTER TABLE chatbot_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own logs"
  ON chatbot_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all logs"
  ON chatbot_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Authenticated users can create logs"
  ON chatbot_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Insérer la configuration par défaut
INSERT INTO chatbot_settings (is_enabled, position, welcome_message, idle_message)
VALUES (
  true,
  'bottom-right',
  'Bonjour! Je suis l''assistant virtuel de JobGuinée. Comment puis-je vous aider aujourd''hui?',
  'Besoin d''aide pour naviguer sur JobGuinée? Je suis là!'
)
ON CONFLICT DO NOTHING;

-- Insérer le style par défaut
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

-- Insérer des connaissances de base
INSERT INTO chatbot_knowledge_base (category, question, answer, intent_name, priority_level, tags) VALUES
(
  'Navigation',
  'Comment créer un CV?',
  'Pour créer un CV avec l''IA, rendez-vous dans "Services Premium IA" puis cliquez sur "Génération CV IA". Vous pourrez créer, améliorer ou adapter votre CV selon vos besoins.',
  'create_cv',
  9,
  ARRAY['cv', 'création', 'ia', 'services']
),
(
  'Navigation',
  'Comment acheter des crédits?',
  'Vous pouvez acheter des crédits IA dans la Boutique de Crédits. Accédez-y depuis votre dashboard candidat ou directement depuis les services premium.',
  'buy_credits',
  9,
  ARRAY['crédits', 'achat', 'paiement']
),
(
  'Navigation',
  'Comment postuler à une offre?',
  'Consultez les offres d''emploi dans la section "Offres d''emploi", cliquez sur une offre qui vous intéresse, puis utilisez le bouton "Postuler" pour soumettre votre candidature.',
  'apply_job',
  8,
  ARRAY['postuler', 'candidature', 'emploi']
),
(
  'Services',
  'Quels sont les services IA disponibles?',
  'JobGuinée propose plusieurs services IA: Génération de CV, Amélioration de CV, Adaptation de CV à une offre, Génération de lettres de motivation, Matching intelligent, Coaching IA, et Plan de carrière personnalisé.',
  'ia_services',
  7,
  ARRAY['services', 'ia', 'premium']
),
(
  'Compte',
  'Comment compléter mon profil?',
  'Accédez à votre dashboard, puis à la section "Mon Profil". Remplissez toutes les informations: expériences, formations, compétences, langues. Un profil complet améliore vos chances d''être recruté!',
  'complete_profile',
  8,
  ARRAY['profil', 'compte', 'candidat']
)
ON CONFLICT DO NOTHING;

-- Insérer des actions rapides par défaut
INSERT INTO chatbot_quick_actions (label, description, icon, action_type, action_payload, order_index) VALUES
(
  'Générer un CV',
  'Créer un CV professionnel avec l''IA',
  'FileText',
  'open_route',
  '{"page": "premium-ai"}',
  1
),
(
  'Voir les offres',
  'Parcourir les offres d''emploi',
  'Briefcase',
  'open_route',
  '{"page": "jobs"}',
  2
),
(
  'Acheter des crédits',
  'Recharger mon compte crédits IA',
  'Coins',
  'open_route',
  '{"page": "credit-store"}',
  3
),
(
  'Mon dashboard',
  'Accéder à mon espace personnel',
  'LayoutDashboard',
  'open_route',
  '{"page": "candidate-dashboard"}',
  4
)
ON CONFLICT DO NOTHING;