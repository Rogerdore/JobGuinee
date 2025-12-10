/*
  # Table de configuration du formulaire de profil candidat

  1. Nouvelle table
    - `profile_form_settings`
      - Configuration globale du formulaire de profil
      - Permet aux admins de configurer les sections et champs
      - Structure JSON pour flexibilité maximale

  2. Sécurité
    - Enable RLS
    - Policies pour admins uniquement

  3. Données initiales
    - Configuration par défaut du formulaire
*/

-- Table de configuration
CREATE TABLE IF NOT EXISTS profile_form_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_by uuid REFERENCES profiles(id),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_profile_form_settings_key ON profile_form_settings(setting_key);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_profile_form_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profile_form_settings_updated_at
  BEFORE UPDATE ON profile_form_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_form_settings_updated_at();

-- Enable RLS
ALTER TABLE profile_form_settings ENABLE ROW LEVEL SECURITY;

-- Policies: Admins uniquement
CREATE POLICY "Admins can read form settings"
  ON profile_form_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can insert form settings"
  ON profile_form_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update form settings"
  ON profile_form_settings
  FOR UPDATE
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

-- Données initiales: Configuration par défaut du formulaire
INSERT INTO profile_form_settings (setting_key, setting_value, description)
VALUES (
  'candidate_profile_form_config',
  '{
    "cv_parsing_enabled": true,
    "ai_suggestions_enabled": true,
    "sections": [
      {
        "id": "cv_upload",
        "title": "Téléversement de CV",
        "enabled": true,
        "order": 1,
        "required": false
      },
      {
        "id": "identity",
        "title": "Identité & Contact",
        "enabled": true,
        "order": 2,
        "required": true,
        "fields": [
          {"id": "fullName", "label": "Nom complet", "type": "text", "required": true, "enabled": true},
          {"id": "email", "label": "Email", "type": "email", "required": true, "enabled": true},
          {"id": "phone", "label": "Téléphone", "type": "tel", "required": true, "enabled": true},
          {"id": "birthDate", "label": "Date de naissance", "type": "date", "required": false, "enabled": true},
          {"id": "gender", "label": "Genre", "type": "select", "required": false, "enabled": true},
          {"id": "nationality", "label": "Nationalité", "type": "autocomplete", "required": false, "enabled": true}
        ]
      },
      {
        "id": "professional_summary",
        "title": "Résumé Professionnel",
        "enabled": true,
        "order": 3,
        "required": false,
        "ai_suggestions": true
      },
      {
        "id": "desired_position",
        "title": "Poste recherché",
        "enabled": true,
        "order": 4,
        "required": false
      },
      {
        "id": "experiences",
        "title": "Expériences Professionnelles",
        "enabled": true,
        "order": 5,
        "required": false,
        "min_entries": 1
      },
      {
        "id": "education",
        "title": "Formations & Diplômes",
        "enabled": true,
        "order": 6,
        "required": false,
        "min_entries": 1
      },
      {
        "id": "skills",
        "title": "Compétences & Langues",
        "enabled": true,
        "order": 7,
        "required": false,
        "ai_suggestions": true
      },
      {
        "id": "location",
        "title": "Localisation & Mobilité",
        "enabled": true,
        "order": 8,
        "required": false
      },
      {
        "id": "salary",
        "title": "Rémunération",
        "enabled": true,
        "order": 9,
        "required": false
      },
      {
        "id": "links",
        "title": "Liens & Documents",
        "enabled": true,
        "order": 10,
        "required": false
      },
      {
        "id": "validation",
        "title": "Validation",
        "enabled": true,
        "order": 11,
        "required": true
      }
    ],
    "messages": {
      "welcome": "Complétez votre profil pour maximiser vos chances d''être recruté",
      "cv_upload_help": "Notre IA analysera votre CV et remplira automatiquement le formulaire",
      "success_message": "Profil enregistré avec succès!"
    }
  }'::jsonb,
  'Configuration du formulaire de profil candidat'
)
ON CONFLICT (setting_key) DO NOTHING;