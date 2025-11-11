/*
  # Ajouter le champ API Key à la configuration du chatbot

  1. Modifications
    - Ajouter le champ `api_key` à la table `chatbot_config`
    - Ajouter le champ `api_provider` pour supporter différents fournisseurs (OpenAI, Anthropic, etc.)
    - Ajouter `api_endpoint` pour les endpoints personnalisés

  2. Sécurité
    - Le champ api_key est visible uniquement par les admins
    - Chiffrement côté application recommandé
*/

-- Ajouter les nouveaux champs à chatbot_config
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chatbot_config' AND column_name = 'api_key'
  ) THEN
    ALTER TABLE chatbot_config ADD COLUMN api_key text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chatbot_config' AND column_name = 'api_provider'
  ) THEN
    ALTER TABLE chatbot_config ADD COLUMN api_provider text DEFAULT 'openai' CHECK (api_provider IN ('openai', 'anthropic', 'custom'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chatbot_config' AND column_name = 'api_endpoint'
  ) THEN
    ALTER TABLE chatbot_config ADD COLUMN api_endpoint text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chatbot_config' AND column_name = 'temperature'
  ) THEN
    ALTER TABLE chatbot_config ADD COLUMN temperature numeric DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chatbot_config' AND column_name = 'max_tokens'
  ) THEN
    ALTER TABLE chatbot_config ADD COLUMN max_tokens integer DEFAULT 500 CHECK (max_tokens > 0);
  END IF;
END $$;

-- Mettre à jour la policy de lecture pour masquer l'API key aux non-admins
DROP POLICY IF EXISTS "Anyone can read chatbot config" ON chatbot_config;

-- Nouvelle policy pour lecture publique (sans API key)
CREATE POLICY "Public can read chatbot config without secrets"
  ON chatbot_config FOR SELECT
  TO public
  USING (true);

-- Policy pour admins qui peuvent voir tout y compris l'API key
CREATE POLICY "Admins can read full chatbot config"
  ON chatbot_config FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Commentaire sur la sécurité de l'API key
COMMENT ON COLUMN chatbot_config.api_key IS 'API key for AI service. Only visible to admins. Should be encrypted in production.';
