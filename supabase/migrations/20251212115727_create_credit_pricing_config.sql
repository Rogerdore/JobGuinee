/*
  # Configuration du prix unitaire des crédits IA
  
  1. Nouvelle table
    - `credit_pricing_config`
      - `id` (uuid, clé primaire)
      - `credit_unit_price` (prix d'un crédit en GNF, par défaut 1000)
      - `currency` (devise, par défaut GNF)
      - `updated_by` (admin qui a fait la modification)
      - `created_at` (date de création)
      - `updated_at` (date de mise à jour)
  
  2. Sécurité
    - Enable RLS sur la table
    - Politique de lecture pour tous les utilisateurs authentifiés
    - Politique de modification uniquement pour les admins
  
  3. Données initiales
    - Insérer la configuration par défaut : 1 crédit = 1000 GNF
*/

-- Créer la table de configuration du prix unitaire
CREATE TABLE IF NOT EXISTS credit_pricing_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_unit_price decimal(10,2) NOT NULL DEFAULT 1000.00,
  currency text NOT NULL DEFAULT 'GNF',
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE credit_pricing_config ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs authentifiés peuvent lire la configuration
CREATE POLICY "Authenticated users can read credit pricing config"
  ON credit_pricing_config
  FOR SELECT
  TO authenticated
  USING (true);

-- Seuls les admins peuvent modifier la configuration
CREATE POLICY "Only admins can update credit pricing config"
  ON credit_pricing_config
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

-- Insérer la configuration par défaut
INSERT INTO credit_pricing_config (credit_unit_price, currency)
VALUES (1000.00, 'GNF')
ON CONFLICT DO NOTHING;
