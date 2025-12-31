/*
  # Update Chatbot Welcome Message

  1. Changes
    - Updates the welcome_message in chatbot_settings to new greeting format
    - Changes to "Bonjour! Je suis Alpha, l'assistant virtuel JobGuinee. Besoin d'aide? Je suis là pour vous."
*/

-- Update welcome message in chatbot_settings
UPDATE chatbot_settings
SET welcome_message = 'Bonjour! Je suis Alpha, l''assistant virtuel JobGuinee. Besoin d''aide? Je suis là pour vous.'
WHERE welcome_message IS NOT NULL;