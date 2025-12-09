-- Add type-specific fields to formations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'formations' AND column_name = 'certification_included'
  ) THEN
    ALTER TABLE formations ADD COLUMN certification_included boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'formations' AND column_name = 'max_participants'
  ) THEN
    ALTER TABLE formations ADD COLUMN max_participants integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'formations' AND column_name = 'prerequisites'
  ) THEN
    ALTER TABLE formations ADD COLUMN prerequisites text;
  END IF;
END $$;