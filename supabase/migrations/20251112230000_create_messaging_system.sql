/*
  # Système de Messagerie Candidat-Recruteur

  1. Nouvelles Tables
    - `conversations`
      - `id` (uuid, primary key) - Identifiant unique
      - `candidate_id` (uuid, foreign key) - Référence au candidat
      - `recruiter_id` (uuid, foreign key) - Référence au recruteur
      - `job_id` (uuid, foreign key, nullable) - Offre liée (optionnel)
      - `last_message_at` (timestamptz) - Date du dernier message
      - `candidate_unread_count` (integer) - Messages non lus par le candidat
      - `recruiter_unread_count` (integer) - Messages non lus par le recruteur
      - `created_at` (timestamptz) - Date de création
      - `updated_at` (timestamptz) - Date de modification

    - `messages`
      - `id` (uuid, primary key) - Identifiant unique
      - `conversation_id` (uuid, foreign key) - Référence à la conversation
      - `sender_id` (uuid, foreign key) - Expéditeur
      - `content` (text) - Contenu du message
      - `is_read` (boolean) - Message lu
      - `read_at` (timestamptz) - Date de lecture
      - `attachment_url` (text) - URL du fichier joint (optionnel)
      - `attachment_name` (text) - Nom du fichier joint
      - `created_at` (timestamptz) - Date d'envoi

  2. Sécurité
    - Enable RLS sur les deux tables
    - Candidats et recruteurs peuvent voir leurs conversations
    - Seuls les participants peuvent envoyer des messages
*/

-- Créer la table des conversations
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recruiter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  last_message_at timestamptz DEFAULT now(),
  candidate_unread_count integer DEFAULT 0,
  recruiter_unread_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(candidate_id, recruiter_id, job_id)
);

-- Créer la table des messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  attachment_url text,
  attachment_name text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies pour conversations
CREATE POLICY "Candidats peuvent voir leurs conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = candidate_id);

CREATE POLICY "Recruteurs peuvent voir leurs conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = recruiter_id);

CREATE POLICY "Candidats peuvent créer des conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Recruteurs peuvent créer des conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = recruiter_id);

CREATE POLICY "Participants peuvent mettre à jour la conversation"
  ON conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = candidate_id OR auth.uid() = recruiter_id)
  WITH CHECK (auth.uid() = candidate_id OR auth.uid() = recruiter_id);

-- Policies pour messages
CREATE POLICY "Participants peuvent lire les messages de leur conversation"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.candidate_id = auth.uid() OR conversations.recruiter_id = auth.uid())
    )
  );

CREATE POLICY "Participants peuvent envoyer des messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.candidate_id = auth.uid() OR conversations.recruiter_id = auth.uid())
    )
  );

CREATE POLICY "Participants peuvent mettre à jour leurs messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.candidate_id = auth.uid() OR conversations.recruiter_id = auth.uid())
    )
  );

-- Trigger pour mettre à jour updated_at sur conversations
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversations_updated_at_trigger
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversations_updated_at();

-- Trigger pour mettre à jour last_message_at et unread_count
CREATE OR REPLACE FUNCTION update_conversation_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
  conv conversations%ROWTYPE;
BEGIN
  -- Récupérer la conversation
  SELECT * INTO conv FROM conversations WHERE id = NEW.conversation_id;

  -- Mettre à jour la conversation
  IF conv.candidate_id = NEW.sender_id THEN
    -- Le candidat envoie un message, incrémenter le compteur du recruteur
    UPDATE conversations
    SET
      last_message_at = NEW.created_at,
      recruiter_unread_count = recruiter_unread_count + 1
    WHERE id = NEW.conversation_id;
  ELSE
    -- Le recruteur envoie un message, incrémenter le compteur du candidat
    UPDATE conversations
    SET
      last_message_at = NEW.created_at,
      candidate_unread_count = candidate_unread_count + 1
    WHERE id = NEW.conversation_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_conversation_on_new_message_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_new_message();

-- Fonction pour marquer les messages comme lus
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_conversation_id uuid,
  p_user_id uuid
)
RETURNS void AS $$
DECLARE
  conv conversations%ROWTYPE;
BEGIN
  -- Récupérer la conversation
  SELECT * INTO conv FROM conversations WHERE id = p_conversation_id;

  -- Marquer les messages comme lus
  UPDATE messages
  SET
    is_read = true,
    read_at = now()
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND is_read = false;

  -- Réinitialiser le compteur de messages non lus
  IF conv.candidate_id = p_user_id THEN
    UPDATE conversations
    SET candidate_unread_count = 0
    WHERE id = p_conversation_id;
  ELSIF conv.recruiter_id = p_user_id THEN
    UPDATE conversations
    SET recruiter_unread_count = 0
    WHERE id = p_conversation_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_conversations_candidate_id
  ON conversations(candidate_id);

CREATE INDEX IF NOT EXISTS idx_conversations_recruiter_id
  ON conversations(recruiter_id);

CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at
  ON conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
  ON messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_created_at
  ON messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id
  ON messages(sender_id);

-- Fonction pour obtenir ou créer une conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_candidate_id uuid,
  p_recruiter_id uuid,
  p_job_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  conversation_id uuid;
BEGIN
  -- Chercher une conversation existante
  SELECT id INTO conversation_id
  FROM conversations
  WHERE candidate_id = p_candidate_id
    AND recruiter_id = p_recruiter_id
    AND (job_id = p_job_id OR (job_id IS NULL AND p_job_id IS NULL));

  -- Si elle n'existe pas, la créer
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (candidate_id, recruiter_id, job_id)
    VALUES (p_candidate_id, p_recruiter_id, p_job_id)
    RETURNING id INTO conversation_id;
  END IF;

  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Configurer le storage pour les pièces jointes
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Policies pour le storage des pièces jointes
CREATE POLICY "Utilisateurs authentifiés peuvent uploader des pièces jointes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'message-attachments');

CREATE POLICY "Utilisateurs peuvent lire leurs pièces jointes"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'message-attachments');

CREATE POLICY "Utilisateurs peuvent supprimer leurs pièces jointes"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'message-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
