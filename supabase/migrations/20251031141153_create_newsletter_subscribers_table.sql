/*
  # Create Newsletter Subscribers Table

  ## Description
  Table pour gérer les abonnés aux alertes emploi par email

  ## Tables créées
  - `newsletter_subscribers`
    - `id` (uuid, clé primaire)
    - `email` (text, unique, email de l'abonné)
    - `domain` (text, secteur d'activité pour les alertes ciblées)
    - `subscribed_at` (timestamptz, date d'inscription)
    - `is_active` (boolean, statut de l'abonnement)
    - `unsubscribed_at` (timestamptz, date de désabonnement)

  ## Sécurité
  - RLS activé sur la table
  - Politique : Tout le monde peut s'inscrire (INSERT public)
*/

-- Créer la table des abonnés newsletter
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

-- Activer RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Politique : Permettre les inscriptions publiques
CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscribers
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON newsletter_subscribers(is_active);
CREATE INDEX IF NOT EXISTS idx_newsletter_domain ON newsletter_subscribers(domain);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_newsletter_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_newsletter_updated_at_trigger ON newsletter_subscribers;
CREATE TRIGGER update_newsletter_updated_at_trigger
  BEFORE UPDATE ON newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_newsletter_updated_at();
