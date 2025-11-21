/*
  # Add Gemini Provider Support to ChatBot Configuration

  1. Changes
    - Drop existing CHECK constraint on api_provider column
    - Add new CHECK constraint that includes 'gemini' as valid provider
    - This allows users to select Google Gemini as their AI provider

  2. Security
    - No RLS changes needed (existing policies remain)
*/

ALTER TABLE chatbot_config 
DROP CONSTRAINT IF EXISTS chatbot_config_api_provider_check;

ALTER TABLE chatbot_config 
ADD CONSTRAINT chatbot_config_api_provider_check 
CHECK (api_provider IN ('openai', 'anthropic', 'gemini', 'custom'));