/*
  # Create Chatbot Conversations Table

  1. New Tables
    - `chatbot_conversations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key, nullable for anonymous users)
      - `session_id` (text) - Session identifier
      - `messages` (jsonb) - Array of messages
      - `topic` (text) - Conversation topic
      - `is_archived` (boolean)
      - `total_messages` (integer)
      - `last_message_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for user access
*/

CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  title text DEFAULT 'Nouvelle conversation'::text,
  messages jsonb DEFAULT '[]'::jsonb,
  topic text,
  is_archived boolean NOT NULL DEFAULT false,
  total_messages integer NOT NULL DEFAULT 0,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON chatbot_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create conversations"
  ON chatbot_conversations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update own conversations"
  ON chatbot_conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete own conversations"
  ON chatbot_conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_id ON chatbot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_session_id ON chatbot_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_created_at ON chatbot_conversations(created_at DESC);