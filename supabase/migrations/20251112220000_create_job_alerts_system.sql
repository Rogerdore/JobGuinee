/*
  # Système d'Alertes Emploi

  1. Nouvelle Table
    - `job_alerts`
      - `id` (uuid, primary key) - Identifiant unique
      - `user_id` (uuid, foreign key) - Référence au candidat
      - `alert_name` (text) - Nom de l'alerte
      - `keywords` (text[]) - Mots-clés de recherche
      - `job_type` (text[]) - Types de contrat (CDI, CDD, etc.)
      - `location` (text[]) - Localités souhaitées
      - `salary_min` (integer) - Salaire minimum
      - `sector` (text[]) - Secteurs d'activité
      - `experience_level` (text[]) - Niveaux d'expérience
      - `notification_email` (boolean) - Recevoir par email
      - `notification_sms` (boolean) - Recevoir par SMS
      - `notification_whatsapp` (boolean) - Recevoir par WhatsApp
      - `phone_number` (text) - Numéro pour SMS/WhatsApp
      - `frequency` (text) - Fréquence des alertes (instant, daily, weekly)
      - `is_active` (boolean) - Alerte active/inactive
      - `last_sent_at` (timestamptz) - Dernière notification envoyée
      - `created_at` (timestamptz) - Date de création
      - `updated_at` (timestamptz) - Date de modification

  2. Sécurité
    - Enable RLS sur `job_alerts`
    - Les utilisateurs ne peuvent gérer que leurs propres alertes
*/

-- Créer la table des alertes emploi
CREATE TABLE IF NOT EXISTS job_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  alert_name text NOT NULL,
  keywords text[] DEFAULT '{}',
  job_type text[] DEFAULT '{}',
  location text[] DEFAULT '{}',
  salary_min integer,
  sector text[] DEFAULT '{}',
  experience_level text[] DEFAULT '{}',
  notification_email boolean DEFAULT true,
  notification_sms boolean DEFAULT false,
  notification_whatsapp boolean DEFAULT false,
  phone_number text,
  frequency text DEFAULT 'instant' CHECK (frequency IN ('instant', 'daily', 'weekly')),
  is_active boolean DEFAULT true,
  last_sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE job_alerts ENABLE ROW LEVEL SECURITY;

-- Policies pour job_alerts
CREATE POLICY "Utilisateurs peuvent lire leurs propres alertes"
  ON job_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent créer leurs propres alertes"
  ON job_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent modifier leurs propres alertes"
  ON job_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent supprimer leurs propres alertes"
  ON job_alerts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_job_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_alerts_updated_at_trigger
  BEFORE UPDATE ON job_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_job_alerts_updated_at();

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_job_alerts_user_id
  ON job_alerts(user_id);

CREATE INDEX IF NOT EXISTS idx_job_alerts_is_active
  ON job_alerts(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_job_alerts_created_at
  ON job_alerts(created_at DESC);

-- Fonction pour trouver les offres correspondant aux alertes
CREATE OR REPLACE FUNCTION find_matching_jobs_for_alert(alert_id uuid)
RETURNS TABLE (
  job_id uuid,
  job_title text,
  company_name text,
  location text,
  job_type text,
  salary_range text,
  created_at timestamptz
) AS $$
DECLARE
  alert_record job_alerts%ROWTYPE;
BEGIN
  -- Récupérer l'alerte
  SELECT * INTO alert_record FROM job_alerts WHERE id = alert_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Rechercher les offres correspondantes
  RETURN QUERY
  SELECT
    j.id,
    j.title,
    j.company_name,
    j.location,
    j.type,
    j.salary_range,
    j.created_at
  FROM jobs j
  WHERE j.status = 'published'
    AND j.created_at > COALESCE(alert_record.last_sent_at, '1970-01-01'::timestamptz)
    AND (
      -- Correspondance avec les mots-clés
      (
        array_length(alert_record.keywords, 1) IS NULL
        OR EXISTS (
          SELECT 1 FROM unnest(alert_record.keywords) AS keyword
          WHERE j.title ILIKE '%' || keyword || '%'
            OR j.description ILIKE '%' || keyword || '%'
        )
      )
      -- Correspondance avec le type de contrat
      AND (
        array_length(alert_record.job_type, 1) IS NULL
        OR j.type = ANY(alert_record.job_type)
      )
      -- Correspondance avec la localisation
      AND (
        array_length(alert_record.location, 1) IS NULL
        OR j.location = ANY(alert_record.location)
      )
      -- Correspondance avec le salaire minimum
      AND (
        alert_record.salary_min IS NULL
        OR j.salary_min >= alert_record.salary_min
      )
      -- Correspondance avec le secteur
      AND (
        array_length(alert_record.sector, 1) IS NULL
        OR j.sector = ANY(alert_record.sector)
      )
      -- Correspondance avec le niveau d'expérience
      AND (
        array_length(alert_record.experience_level, 1) IS NULL
        OR j.experience_level = ANY(alert_record.experience_level)
      )
    )
  ORDER BY j.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour marquer une alerte comme envoyée
CREATE OR REPLACE FUNCTION mark_alert_as_sent(alert_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE job_alerts
  SET last_sent_at = now()
  WHERE id = alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
