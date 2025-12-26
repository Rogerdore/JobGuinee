/*
  # Système Solutions B2B JobGuinée

  1. Tables créées
    - `b2b_leads` : Leads B2B générés depuis le formulaire
      - `id` (uuid, primary key)
      - `organization_name` (text) : Nom de l'organisation
      - `organization_type` (text) : Type (entreprise, institution, cabinet, etc.)
      - `sector` (text) : Secteur d'activité
      - `primary_need` (text) : Besoin RH principal
      - `urgency` (text) : Niveau d'urgence
      - `contact_name` (text) : Nom du contact
      - `contact_email` (text) : Email du contact
      - `contact_phone` (text) : Téléphone
      - `message` (text) : Message détaillé
      - `status` (text) : Statut du lead (nouveau, contacté, qualifié, converti, perdu)
      - `assigned_to` (uuid) : Admin assigné au lead
      - `notes` (text) : Notes internes
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `b2b_page_config` : Configuration de la page Solutions B2B
      - `id` (uuid, primary key)
      - `section_name` (text, unique) : Nom de la section
      - `is_active` (boolean) : Section active/inactive
      - `title` (text) : Titre de la section
      - `subtitle` (text) : Sous-titre
      - `content` (jsonb) : Contenu configurable
      - `cta_text` (text) : Texte du CTA
      - `cta_link` (text) : Lien du CTA
      - `display_order` (int) : Ordre d'affichage
      - `seo_config` (jsonb) : Configuration SEO
      - `updated_at` (timestamptz)

  2. Sécurité
    - RLS activé sur toutes les tables
    - Leads : admins seulement
    - Config : lecture publique, écriture admin
*/

-- Table des leads B2B
CREATE TABLE IF NOT EXISTS b2b_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name text NOT NULL,
  organization_type text NOT NULL CHECK (organization_type IN (
    'entreprise',
    'institution',
    'ong',
    'cabinet_rh',
    'centre_formation',
    'formateur',
    'autre'
  )),
  sector text NOT NULL,
  primary_need text NOT NULL CHECK (primary_need IN (
    'externalisation_recrutement',
    'ats_digital',
    'cvtheque',
    'formation',
    'conseil_rh',
    'pack_enterprise',
    'autre'
  )),
  urgency text NOT NULL DEFAULT 'normale' CHECK (urgency IN (
    'immediate',
    'urgent',
    'normale',
    'planifie'
  )),
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  message text,
  status text NOT NULL DEFAULT 'nouveau' CHECK (status IN (
    'nouveau',
    'contacte',
    'qualifie',
    'converti',
    'perdu'
  )),
  assigned_to uuid REFERENCES profiles(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table de configuration de la page B2B
CREATE TABLE IF NOT EXISTS b2b_page_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_name text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  title text,
  subtitle text,
  content jsonb DEFAULT '{}'::jsonb,
  cta_text text,
  cta_link text,
  display_order int DEFAULT 0,
  seo_config jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Activation RLS
ALTER TABLE b2b_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_page_config ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour b2b_leads
CREATE POLICY "Admins can view all B2B leads"
  ON b2b_leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can insert B2B leads"
  ON b2b_leads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Anyone can create B2B lead"
  ON b2b_leads FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Admins can update B2B leads"
  ON b2b_leads FOR UPDATE
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

-- Politiques RLS pour b2b_page_config
CREATE POLICY "Anyone can view B2B page config"
  ON b2b_page_config FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can view all B2B page config"
  ON b2b_page_config FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage B2B page config"
  ON b2b_page_config FOR ALL
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

-- Trigger pour updated_at sur b2b_leads
CREATE OR REPLACE FUNCTION update_b2b_leads_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_b2b_leads_timestamp
  BEFORE UPDATE ON b2b_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_b2b_leads_timestamp();

-- Trigger pour updated_at sur b2b_page_config
CREATE OR REPLACE FUNCTION update_b2b_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_b2b_config_timestamp
  BEFORE UPDATE ON b2b_page_config
  FOR EACH ROW
  EXECUTE FUNCTION update_b2b_config_timestamp();

-- Insertion de la configuration par défaut
INSERT INTO b2b_page_config (section_name, is_active, title, subtitle, content, display_order, seo_config)
VALUES
  (
    'hero',
    true,
    'Solutions B2B – JobGuinée',
    'Des solutions RH complètes, digitales et humaines pour les entreprises, institutions, cabinets et acteurs de la formation.',
    '{
      "points": [
        "Externalisation du recrutement",
        "Solutions digitales & IA RH",
        "Formation & coaching",
        "Conseil RH & accompagnement"
      ],
      "cta_primary": "Confier un recrutement",
      "cta_secondary": "Parler à un expert"
    }'::jsonb,
    1,
    '{
      "title": "Solutions B2B pour Entreprises et Institutions | JobGuinée",
      "description": "Solutions RH complètes pour entreprises : externalisation recrutement, ATS digital, CVthèque, formation et conseil RH en Guinée."
    }'::jsonb
  ),
  (
    'target_audience',
    true,
    'À qui s''adressent nos solutions',
    'Des solutions adaptées à chaque type d''organisation',
    '{
      "audiences": [
        {"name": "Entreprises & PME", "icon": "building", "link": "/enterprise-subscribe"},
        {"name": "Mines & grands projets", "icon": "hammer", "link": "/enterprise-subscribe"},
        {"name": "Institutions & ONG", "icon": "landmark", "link": "/enterprise-subscribe"},
        {"name": "Cabinets RH & agences", "icon": "users", "link": "/cvtheque"},
        {"name": "Centres de formation", "icon": "school", "link": "/formations"},
        {"name": "Formateurs / coachs", "icon": "user", "link": "/formations"}
      ]
    }'::jsonb,
    2,
    '{}'::jsonb
  ),
  (
    'outsourcing',
    true,
    'Externalisation du recrutement',
    'Confiez-nous votre recrutement de A à Z',
    '{
      "description": "JobGuinée propose un service d''externalisation du recrutement assuré par des équipes RH professionnelles.",
      "steps": [
        "Analyse du besoin et cadrage du poste",
        "Rédaction et diffusion des offres",
        "Réception et tri des candidatures",
        "Pré-sélection structurée (CV, matching, scoring)",
        "Tests de sélection (si requis)",
        "Entretiens RH / techniques",
        "Production d''une shortlist professionnelle"
      ]
    }'::jsonb,
    3,
    '{}'::jsonb
  ),
  (
    'digital_solutions',
    true,
    'Solutions digitales & IA RH',
    'Technologie au service de votre recrutement',
    '{
      "solutions": [
        {"name": "ATS & pipeline recruteur", "description": "Gestion complète des candidatures", "link": "/recruiter-dashboard"},
        {"name": "Matching IA recruteur", "description": "Aide à la présélection et au tri", "link": "/premium-ai-services"},
        {"name": "CVthèque intelligente", "description": "Recherche structurée de profils", "link": "/cvtheque"},
        {"name": "Exports professionnels", "description": "PDF direction, Excel RH, CSV", "link": "/recruiter-dashboard"},
        {"name": "Tableaux de bord RH", "description": "Pilotage et suivi des recrutements", "link": "/recruiter-dashboard"}
      ]
    }'::jsonb,
    4,
    '{}'::jsonb
  ),
  (
    'training',
    true,
    'Formation & Coaching',
    'Développement des compétences',
    '{
      "description": "Solutions pour personnes physiques et morales",
      "services": [
        "Publication d''annonces de formation",
        "Mise en avant premium",
        "Accès à des profils ciblés",
        "Programmes de formation sur mesure"
      ]
    }'::jsonb,
    5,
    '{}'::jsonb
  ),
  (
    'consulting',
    true,
    'Conseil RH & Accompagnement',
    'Expertise stratégique à votre service',
    '{
      "services": [
        "Diagnostic RH",
        "Structuration des processus RH",
        "Organisation du recrutement",
        "Externalisation paie & rémunération",
        "Conseil performance & management",
        "Appui conformité RH"
      ]
    }'::jsonb,
    6,
    '{}'::jsonb
  ),
  (
    'offers',
    true,
    'Offres & Packs B2B',
    'Des formules adaptées à vos besoins',
    '{
      "packs": [
        {"name": "Pack BASIC", "type": "enterprise", "link": "/enterprise-subscribe"},
        {"name": "Pack PRO", "type": "enterprise", "link": "/enterprise-subscribe"},
        {"name": "Pack GOLD", "type": "enterprise", "link": "/enterprise-subscribe"},
        {"name": "Pack Cabinet RH", "type": "cabinet", "link": "/cvtheque"}
      ]
    }'::jsonb,
    7,
    '{}'::jsonb
  ),
  (
    'why_choose',
    true,
    'Pourquoi choisir JobGuinée',
    'L''excellence RH à la guinéenne',
    '{
      "reasons": [
        {"title": "Expertise terrain locale", "description": "Connaissance approfondie du marché guinéen"},
        {"title": "Équipes RH professionnelles", "description": "Consultants formés et expérimentés"},
        {"title": "Outils modernes & IA", "description": "Technologie de pointe pour plus d''efficacité"},
        {"title": "Données fiables & reporting", "description": "Transparence et suivi en temps réel"},
        {"title": "Solutions flexibles", "description": "Adaptées à vos besoins spécifiques"}
      ]
    }'::jsonb,
    8,
    '{}'::jsonb
  )
ON CONFLICT (section_name) DO NOTHING;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_b2b_leads_status ON b2b_leads(status);
CREATE INDEX IF NOT EXISTS idx_b2b_leads_created_at ON b2b_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_b2b_leads_organization_type ON b2b_leads(organization_type);
CREATE INDEX IF NOT EXISTS idx_b2b_page_config_section ON b2b_page_config(section_name);
CREATE INDEX IF NOT EXISTS idx_b2b_page_config_active ON b2b_page_config(is_active);
