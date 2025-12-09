/*
  # Add Credits Cost Column to Premium Services
  
  1. New Column
    - `credits_cost` (integer) - Number of credits required for each service
  
  2. Changes
    - Add credits_cost column to premium_services table
    - Set default values based on existing price column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'premium_services' AND column_name = 'credits_cost'
  ) THEN
    ALTER TABLE premium_services ADD COLUMN credits_cost INTEGER DEFAULT 0;
  END IF;
END $$;

UPDATE premium_services SET credits_cost = 
  CASE 
    WHEN name = 'Analyse & Matching IA' THEN 50
    WHEN name = 'Rédaction de CV IA' THEN 30
    WHEN name = 'Lettre de Motivation IA' THEN 20
    WHEN name = 'JobCoach IA' THEN 60
    WHEN name = 'Plan de Carrière IA' THEN 40
    ELSE (price::numeric / 500)::integer
  END
WHERE credits_cost = 0;
