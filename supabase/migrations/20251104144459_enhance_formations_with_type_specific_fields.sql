/*
  # Enhance Formations Table with Type-Specific Fields

  ## Overview
  This migration adds type-specific fields to the formations table to support different
  types of training programs offered by different organization types.

  ## 1. New Fields

  ### Common Fields (already exist)
  - `title` - Formation title
  - `description` - Formation description
  - `price` - Price in GNF
  - `duration` - Duration text
  - `level` - Difficulty level
  - `category` - Category
  - `status` - Status (draft, published, archived)
  - `trainer_id` - Reference to trainer_profile

  ### New Common Fields
  - `format` - Format type: 'presential', 'online', 'hybrid'
  - `max_participants` - Maximum number of participants
  - `language` - Training language (default: French)
  - `prerequisites` - Prerequisites (text)
  - `objectives` - Learning objectives (text[])
  - `program_outline` - Program outline/syllabus (jsonb)
  - `certification` - Certificate provided (boolean)
  - `certification_details` - Certification details (text)

  ### Individual Trainer Fields
  - `individual_location` - Training location for presential
  - `individual_schedule` - Available schedule/dates (text)
  - `individual_materials_included` - Materials provided (boolean)
  - `individual_materials_list` - List of materials (text[])

  ### Company Fields
  - `company_location` - Company training center location
  - `company_custom_program` - Custom programs available (boolean)
  - `company_group_discount` - Group discount available (boolean)
  - `company_corporate_training` - Corporate training available (boolean)
  - `company_trainer_team` - Team of trainers (text[])

  ### Institute Fields
  - `institute_campus_location` - Campus location
  - `institute_accredited` - Accredited program (boolean)
  - `institute_diploma_level` - Diploma level (text)
  - `institute_admission_requirements` - Admission requirements (text)
  - `institute_semester_dates` - Semester dates (jsonb)
  - `institute_scholarships_available` - Scholarships available (boolean)

  ## 2. Important Notes
  - Fields are nullable to accommodate different formation types
  - Only relevant fields should be filled based on trainer's organization_type
  - Validation will be handled at application level
*/

-- Add format and common new fields
ALTER TABLE formations
  ADD COLUMN IF NOT EXISTS format text DEFAULT 'presential' CHECK (format IN ('presential', 'online', 'hybrid')),
  ADD COLUMN IF NOT EXISTS max_participants integer,
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'Français',
  ADD COLUMN IF NOT EXISTS prerequisites text,
  ADD COLUMN IF NOT EXISTS objectives text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS program_outline jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS certification boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS certification_details text,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS start_date timestamptz,
  ADD COLUMN IF NOT EXISTS end_date timestamptz;

-- Add Individual trainer specific fields
ALTER TABLE formations
  ADD COLUMN IF NOT EXISTS individual_location text,
  ADD COLUMN IF NOT EXISTS individual_schedule text,
  ADD COLUMN IF NOT EXISTS individual_materials_included boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS individual_materials_list text[] DEFAULT '{}';

-- Add Company specific fields
ALTER TABLE formations
  ADD COLUMN IF NOT EXISTS company_location text,
  ADD COLUMN IF NOT EXISTS company_custom_program boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS company_group_discount boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS company_corporate_training boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS company_trainer_team text[] DEFAULT '{}';

-- Add Institute specific fields
ALTER TABLE formations
  ADD COLUMN IF NOT EXISTS institute_campus_location text,
  ADD COLUMN IF NOT EXISTS institute_accredited boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS institute_diploma_level text,
  ADD COLUMN IF NOT EXISTS institute_admission_requirements text,
  ADD COLUMN IF NOT EXISTS institute_semester_dates jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS institute_scholarships_available boolean DEFAULT false;

-- Add updated_at field if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'formations' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE formations ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create index on format for filtering
CREATE INDEX IF NOT EXISTS idx_formations_format ON formations(format);
CREATE INDEX IF NOT EXISTS idx_formations_start_date ON formations(start_date);
CREATE INDEX IF NOT EXISTS idx_formations_trainer_id ON formations(trainer_id);

-- Create or replace trigger to update updated_at
CREATE OR REPLACE FUNCTION update_formations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_formations_updated_at_trigger ON formations;
CREATE TRIGGER update_formations_updated_at_trigger
  BEFORE UPDATE ON formations
  FOR EACH ROW
  EXECUTE FUNCTION update_formations_updated_at();