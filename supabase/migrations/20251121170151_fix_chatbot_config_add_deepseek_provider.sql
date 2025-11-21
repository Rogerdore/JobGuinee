/*
  # Fix chatbot_config API provider constraint

  1. Changes
    - Drop existing api_provider check constraint
    - Add new constraint that includes 'deepseek' provider
    - Allows: openai, anthropic, gemini, deepseek, custom

  2. Security
    - No changes to RLS policies
    - Maintains data integrity with updated constraint
*/

-- Drop the old constraint
ALTER TABLE chatbot_config 
  DROP CONSTRAINT IF EXISTS chatbot_config_api_provider_check;

-- Add new constraint with deepseek support
ALTER TABLE chatbot_config 
  ADD CONSTRAINT chatbot_config_api_provider_check 
  CHECK (api_provider IN ('openai', 'anthropic', 'gemini', 'deepseek', 'custom'));