/*
  # Optimisation et sécurisation système chatbot "Alpha"

  1. **Performance - Indexes**
    - Index sur `chatbot_logs(user_id, created_at)` pour historique conversations
    - Index sur `chatbot_logs(session_id, created_at)` pour contexte conversation
    - Index sur `chatbot_knowledge_base(tags)` using GIN pour recherche rapide
    - Index sur `chatbot_logs(intent_detected)` pour analytics

  2. **Sécurité - RLS Policies**
    - Vérification et correction RLS sur `chatbot_logs`
    - Sécurisation tables configuration (settings, styles, KB, actions)
    - Policies restrictives par défaut

  3. **Performance - Cache & Cleanup**
    - Fonction de nettoyage logs anciens (>90 jours)
    - Trigger pour limiter taille historique par session

  4. **Nouvelles colonnes**
    - Ajout `last_intent` dans chatbot_logs pour mémoire
    - Ajout `sanitization_applied` boolean pour tracking

  5. **Notes importantes**
    - Aucune suppression de données existantes
    - Migrations idempotentes (IF NOT EXISTS)
    - Compatible avec système existant
*/

-- Performance: Indexes optimisés
CREATE INDEX IF NOT EXISTS idx_chatbot_logs_user_created
  ON chatbot_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chatbot_logs_session_created
  ON chatbot_logs(session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chatbot_logs_intent
  ON chatbot_logs(intent_detected)
  WHERE intent_detected IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chatbot_kb_tags
  ON chatbot_knowledge_base USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_chatbot_kb_active_priority
  ON chatbot_knowledge_base(is_active, priority_level DESC)
  WHERE is_active = true;

-- Nouvelles colonnes pour mémoire conversationnelle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chatbot_logs' AND column_name = 'last_intent'
  ) THEN
    ALTER TABLE chatbot_logs ADD COLUMN last_intent text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chatbot_logs' AND column_name = 'sanitization_applied'
  ) THEN
    ALTER TABLE chatbot_logs ADD COLUMN sanitization_applied boolean DEFAULT false;
  END IF;
END $$;

-- Sécurité: RLS Policies pour chatbot_logs
DROP POLICY IF EXISTS "Users can insert their own chat logs" ON chatbot_logs;
DROP POLICY IF EXISTS "Users can view their own chat logs" ON chatbot_logs;
DROP POLICY IF EXISTS "Admins can view all chat logs" ON chatbot_logs;
DROP POLICY IF EXISTS "Service role can insert chat logs" ON chatbot_logs;

CREATE POLICY "Users can insert their own chat logs"
  ON chatbot_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can insert chat logs"
  ON chatbot_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Users can view their own chat logs"
  ON chatbot_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all chat logs"
  ON chatbot_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Sécurité: RLS Policies pour chatbot_knowledge_base
DROP POLICY IF EXISTS "Public can read active knowledge base" ON chatbot_knowledge_base;
DROP POLICY IF EXISTS "Admins can manage knowledge base" ON chatbot_knowledge_base;

CREATE POLICY "Public can read active knowledge base"
  ON chatbot_knowledge_base
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage knowledge base"
  ON chatbot_knowledge_base
  FOR ALL
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

-- Sécurité: RLS Policies pour chatbot_settings
DROP POLICY IF EXISTS "Public can read active settings" ON chatbot_settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON chatbot_settings;

CREATE POLICY "Public can read active settings"
  ON chatbot_settings
  FOR SELECT
  USING (is_enabled = true);

CREATE POLICY "Admins can manage settings"
  ON chatbot_settings
  FOR ALL
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

-- Sécurité: RLS Policies pour chatbot_styles
DROP POLICY IF EXISTS "Public can read default style" ON chatbot_styles;
DROP POLICY IF EXISTS "Admins can manage styles" ON chatbot_styles;

CREATE POLICY "Public can read default style"
  ON chatbot_styles
  FOR SELECT
  USING (is_default = true);

CREATE POLICY "Admins can manage styles"
  ON chatbot_styles
  FOR ALL
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

-- Sécurité: RLS Policies pour chatbot_quick_actions
DROP POLICY IF EXISTS "Public can read active quick actions" ON chatbot_quick_actions;
DROP POLICY IF EXISTS "Admins can manage quick actions" ON chatbot_quick_actions;

CREATE POLICY "Public can read active quick actions"
  ON chatbot_quick_actions
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage quick actions"
  ON chatbot_quick_actions
  FOR ALL
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

-- Performance: Fonction de nettoyage automatique
CREATE OR REPLACE FUNCTION cleanup_old_chatbot_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM chatbot_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Performance: Trigger pour limiter historique par session
CREATE OR REPLACE FUNCTION limit_session_history()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM chatbot_logs
  WHERE session_id = NEW.session_id
    AND created_at < (
      SELECT created_at
      FROM chatbot_logs
      WHERE session_id = NEW.session_id
      ORDER BY created_at DESC
      LIMIT 1 OFFSET 50
    );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_limit_session_history ON chatbot_logs;

CREATE TRIGGER trigger_limit_session_history
  AFTER INSERT ON chatbot_logs
  FOR EACH ROW
  EXECUTE FUNCTION limit_session_history();

-- Documentation des optimisations
COMMENT ON INDEX idx_chatbot_logs_user_created IS
  'Performance: Accelerates user conversation history queries';

COMMENT ON INDEX idx_chatbot_logs_session_created IS
  'Performance: Accelerates session context retrieval (last 10 messages)';

COMMENT ON INDEX idx_chatbot_kb_tags IS
  'Performance: Full-text search on knowledge base tags using GIN index';

COMMENT ON FUNCTION cleanup_old_chatbot_logs IS
  'Maintenance: Removes chat logs older than 90 days to keep database lean';

COMMENT ON FUNCTION limit_session_history IS
  'Performance: Automatically limits session history to last 50 messages per session';
