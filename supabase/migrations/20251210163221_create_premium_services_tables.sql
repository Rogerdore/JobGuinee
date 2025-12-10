/*
  # Create Premium AI Services Tables

  1. New Tables
    - `premium_services`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `category` (text)
      - `type` (text: free or premium)
      - `price` (numeric)
      - `credits_cost` (integer)
      - `icon` (text)
      - `features` (jsonb array)
      - `is_active` (boolean)

    - `user_premium_services`
      - `id` (uuid, primary key)
      - `user_id` (uuid)
      - `service_id` (uuid)
      - `status` (text: active, expired, cancelled)
      - `expires_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for user access
*/

CREATE TABLE IF NOT EXISTS premium_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  type text NOT NULL CHECK (type = ANY(ARRAY['free'::text, 'premium'::text])),
  price numeric DEFAULT 0,
  credits_cost integer DEFAULT 0,
  icon text DEFAULT 'Sparkles',
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_premium_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES premium_services(id) ON DELETE CASCADE,
  status text DEFAULT 'active' CHECK (status = ANY(ARRAY['active'::text, 'expired'::text, 'cancelled'::text])),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, service_id)
);

ALTER TABLE premium_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_premium_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active premium services"
  ON premium_services FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can view their own premium services"
  ON user_premium_services FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

INSERT INTO premium_services (name, description, category, type, price, credits_cost, icon, features, is_active)
VALUES
  (
    'Analyse IA de profil',
    'Score CV vs offre + suggestions formations',
    'matching',
    'free',
    0,
    0,
    'Brain',
    '["Score de compatibilité (0-100) entre votre profil et les offres", "Analyse détaillée des compétences requises vs vos compétences", "Suggestions de formations pour combler les lacunes", "Recommandations personnalisées d''amélioration", "Mise à jour en temps réel du matching", "Top 10 des meilleures offres correspondantes"]'::jsonb,
    true
  ),
  (
    'Création CV / Lettre IA',
    'Génération automatique design professionnel',
    'cv',
    'premium',
    100000,
    50,
    'FileText',
    '["Génération de CV au format HTML téléchargeable", "Design moderne et professionnel", "Optimisé pour les systèmes ATS (Applicant Tracking System)", "Lettres de motivation personnalisées par offre", "Choix entre 3 tons : formel, créatif, simple", "Import automatique depuis votre profil", "Modifications et ajustements illimités"]'::jsonb,
    true
  ),
  (
    'Alertes IA ciblées',
    'Détection auto d''offres correspondantes',
    'alerts',
    'free',
    0,
    0,
    'Bell',
    '["Notifications instantanées par email et SMS", "Analyse automatique de toutes les nouvelles offres", "Filtrage intelligent basé sur vos critères", "Alertes personnalisées par secteur et compétences", "Résumé hebdomadaire des opportunités", "Désactivation/réactivation flexible"]'::jsonb,
    true
  ),
  (
    'Chatbot Travail & Emploi',
    'Réponses Code du Travail guinéen',
    'chatbot',
    'free',
    0,
    0,
    'MessageCircle',
    '["Réponses instantanées et personnalisées", "Base de connaissances sur le Code du Travail guinéen", "Conseils sur la préparation d''entretiens", "Stratégies de recherche d''emploi", "Aide à la négociation salariale", "Conseils de développement de carrière", "Historique des conversations sauvegardé"]'::jsonb,
    true
  ),
  (
    'Coaching IA personnalisé',
    'Coach virtuel 24/7 pour votre carrière',
    'coaching',
    'premium',
    150000,
    75,
    'MessageCircle',
    '["Plans de développement personnalisés", "Simulations d''entretiens avec feedback IA", "Conseil sur évolution de carrière", "Analyse de marché du travail", "Stratégies de négociation salariale", "Support continu et adaptable"]'::jsonb,
    true
  ),
  (
    'Simulation d''entretiens',
    'Entraînement avec IA généraliste',
    'interview',
    'premium',
    75000,
    40,
    'Video',
    '["Questions-réponses personnalisées", "Feedback détaillé sur votre performance", "Suggestion d''améliorations", "Historique des simulations", "Recommandations ciblées", "Préparation par secteur d''activité"]'::jsonb,
    true
  ),
  (
    'Plan de carrière IA',
    'Trajectoire professionnelle suggérée',
    'career_plan',
    'premium',
    125000,
    60,
    'TrendingUp',
    '["Analyse de vos compétences actuelles", "Identification des lacunes de compétences", "Suggestions de formations certifiantes", "Parcours de développement progressif", "Estimations de salaire potentiel", "Timeline réaliste d''évolution"]'::jsonb,
    true
  ),
  (
    'Gold Profile - Profil Premium',
    'Profil visible uniquement aux recruteurs premium',
    'gold_profile',
    'premium',
    200000,
    100,
    'Crown',
    '["Badge Profil Premium visible", "Priorité dans les recherches recruteurs", "Accès aux offres exclusives", "Analytiques détaillés de votre profil", "Support prioritaire", "Actualisation de visibilité automatique"]'::jsonb,
    true
  );
