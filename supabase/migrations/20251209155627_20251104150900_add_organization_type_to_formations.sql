-- Add organization_type column to formations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'formations' AND column_name = 'organization_type'
  ) THEN
    ALTER TABLE formations ADD COLUMN organization_type text DEFAULT 'individual';
  END IF;
END $$;