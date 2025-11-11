/*
  # Système de Configuration du Chatbot IA

  1. Nouvelles Tables
    - `chatbot_config` - Configuration globale du chatbot
      - `id` (uuid, primary key)
      - `enabled` (boolean) - Activer/désactiver le chatbot
      - `name` (text) - Nom du chatbot
      - `welcome_message` (text) - Message d'accueil
      - `avatar_url` (text) - URL de l'avatar du chatbot
      - `primary_color` (text) - Couleur principale
      - `position` (text) - Position sur la page (bottom-right, bottom-left)
      - `ai_model` (text) - Modèle IA à utiliser
      - `system_prompt` (text) - Instructions système pour l'IA
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `chatbot_conversations` - Historique des conversations
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Référence à profiles
      - `session_id` (text) - ID de session pour les visiteurs anonymes
      - `messages` (jsonb) - Array des messages [{role, content, timestamp}]
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `chatbot_faqs` - Base de connaissances FAQ
      - `id` (uuid, primary key)
      - `question` (text) - Question fréquente
      - `answer` (text) - Réponse
      - `category` (text) - Catégorie
      - `keywords` (text[]) - Mots-clés pour le matching
      - `active` (boolean) - Active/inactive
      - `priority` (integer) - Priorité d'affichage
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - RLS activé sur toutes les tables
    - Admins peuvent tout gérer
    - Utilisateurs peuvent voir leur propre historique
    - Configuration visible par tous (lecture seule)
*/

-- Table de configuration du chatbot
CREATE TABLE IF NOT EXISTS chatbot_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean DEFAULT true,
  name text DEFAULT 'Assistant IA' NOT NULL,
  welcome_message text DEFAULT 'Bonjour! 👋 Comment puis-je vous aider aujourd''hui?' NOT NULL,
  avatar_url text,
  primary_color text DEFAULT '#0E2F56' NOT NULL,
  position text DEFAULT 'bottom-right' CHECK (position IN ('bottom-right', 'bottom-left')),
  ai_model text DEFAULT 'gpt-3.5-turbo',
  system_prompt text DEFAULT 'Vous êtes un assistant IA serviable pour une plateforme de recrutement. Aidez les utilisateurs avec leurs questions sur les offres d''emploi, les candidatures et la recherche de talents.' NOT NULL,
  max_messages_per_session integer DEFAULT 50,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des conversations
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  messages jsonb DEFAULT '[]'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des FAQs
CREATE TABLE IF NOT EXISTS chatbot_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT 'Général',
  keywords text[] DEFAULT ARRAY[]::text[],
  active boolean DEFAULT true,
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_id ON chatbot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_session_id ON chatbot_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_faqs_active ON chatbot_faqs(active);
CREATE INDEX IF NOT EXISTS idx_chatbot_faqs_category ON chatbot_faqs(category);

-- Enable RLS
ALTER TABLE chatbot_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_faqs ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour chatbot_config
CREATE POLICY "Anyone can read chatbot config"
  ON chatbot_config FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can update chatbot config"
  ON chatbot_config FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Only admins can insert chatbot config"
  ON chatbot_config FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- RLS Policies pour chatbot_conversations
CREATE POLICY "Users can view own conversations"
  ON chatbot_conversations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own conversations"
  ON chatbot_conversations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own conversations"
  ON chatbot_conversations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all conversations"
  ON chatbot_conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- RLS Policies pour chatbot_faqs
CREATE POLICY "Anyone can read active FAQs"
  ON chatbot_faqs FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Admins can read all FAQs"
  ON chatbot_faqs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Only admins can manage FAQs"
  ON chatbot_faqs FOR ALL
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

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_chatbot_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_chatbot_config_updated_at ON chatbot_config;
CREATE TRIGGER update_chatbot_config_updated_at
  BEFORE UPDATE ON chatbot_config
  FOR EACH ROW
  EXECUTE FUNCTION update_chatbot_updated_at();

DROP TRIGGER IF EXISTS update_chatbot_conversations_updated_at ON chatbot_conversations;
CREATE TRIGGER update_chatbot_conversations_updated_at
  BEFORE UPDATE ON chatbot_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_chatbot_updated_at();

DROP TRIGGER IF EXISTS update_chatbot_faqs_updated_at ON chatbot_faqs;
CREATE TRIGGER update_chatbot_faqs_updated_at
  BEFORE UPDATE ON chatbot_faqs
  FOR EACH ROW
  EXECUTE FUNCTION update_chatbot_updated_at();

-- Insérer la configuration par défaut
INSERT INTO chatbot_config (
  enabled,
  name,
  welcome_message,
  primary_color,
  position,
  system_prompt
) VALUES (
  true,
  'Assistant RH',
  'Bonjour! 👋 Je suis votre assistant virtuel. Comment puis-je vous aider aujourd''hui?',
  '#0E2F56',
  'bottom-right',
  'Vous êtes un assistant IA professionnel et serviable pour une plateforme de recrutement guinéenne. Vous aidez les candidats à trouver des emplois, les recruteurs à publier des offres et gérer leurs candidatures, et les formateurs à proposer des formations. Soyez courtois, précis et donnez des réponses claires en français.'
)
ON CONFLICT DO NOTHING;

-- Insérer quelques FAQs par défaut
INSERT INTO chatbot_faqs (question, answer, category, keywords, priority) VALUES
(
  'Comment créer un compte?',
  'Pour créer un compte, cliquez sur "Connexion" en haut à droite, puis sur "S''inscrire". Choisissez votre type de compte (Candidat, Recruteur ou Formateur) et remplissez le formulaire d''inscription.',
  'Compte',
  ARRAY['compte', 'inscription', 'créer', 's''inscrire'],
  10
),
(
  'Comment postuler à une offre?',
  'Pour postuler: 1) Consultez les offres dans l''onglet "Offres d''emploi", 2) Cliquez sur l''offre qui vous intéresse, 3) Cliquez sur "Postuler maintenant", 4) Remplissez le formulaire et téléchargez votre CV.',
  'Candidature',
  ARRAY['postuler', 'candidature', 'emploi', 'offre'],
  10
),
(
  'Comment publier une offre d''emploi?',
  'En tant que recruteur: 1) Connectez-vous à votre compte, 2) Accédez à votre tableau de bord, 3) Cliquez sur "Publier une offre", 4) Remplissez les détails de l''offre et publiez.',
  'Recrutement',
  ARRAY['publier', 'offre', 'recruteur', 'emploi'],
  9
),
(
  'Qu''est-ce que le profil Gold?',
  'Le profil Gold est un service premium qui optimise votre CV avec l''IA, améliore votre visibilité auprès des recruteurs et vous donne accès à des fonctionnalités exclusives comme le matching IA avancé.',
  'Services Premium',
  ARRAY['gold', 'premium', 'profil', 'abonnement'],
  8
),
(
  'Comment contacter le support?',
  'Vous pouvez nous contacter via ce chat, ou par email à support@plateforme-rh.gn. Notre équipe répond sous 24h en jours ouvrés.',
  'Support',
  ARRAY['contact', 'support', 'aide', 'assistance'],
  7
)
ON CONFLICT DO NOTHING;
