/*
  # Enhance Trainer Profiles with Organization-Specific Fields

  ## Overview
  This migration adds specific fields for each type of organization (individual, company, institute)
  in the trainer_profiles table.

  ## 1. New Fields for All Types
  
  ### Common Fields (already exist)
  - `organization_name` - Name of organization or individual
  - `organization_type` - Type: 'individual', 'company', 'institute'
  - `bio` - Biography
  - `specializations` - Areas of expertise
  - `certifications` - Professional certifications
  - `experience_years` - Years of experience
  - `website` - Website URL
  - `linkedin_url` - LinkedIn profile
  - `hourly_rate` - Hourly rate
  
  ### Individual-Specific Fields (when organization_type = 'individual')
  - `individual_phone` - Phone number
  - `individual_address` - Address
  - `individual_skills` - Skills and competencies (text[])
  
  ### Company-Specific Fields (when organization_type = 'company')
  - `company_name` - Official company name
  - `company_registration_number` - Registration/SIRET number
  - `company_contact_person` - Name of person registering
  - `company_contact_position` - Position of contact person
  - `company_email` - Official company email
  - `company_phone` - Company phone number
  - `company_address` - Company address
  - `company_city` - City
  - `company_country` - Country
  - `company_sector` - Business sector
  - `company_size` - Company size (number of employees)
  - `company_description` - Company description
  
  ### Institute-Specific Fields (when organization_type = 'institute')
  - `institute_name` - Official institute name
  - `institute_registration_number` - Official registration number
  - `institute_contact_person` - Name of person registering
  - `institute_contact_position` - Position of contact person
  - `institute_email` - Official institute email
  - `institute_phone` - Institute phone number
  - `institute_address` - Institute address
  - `institute_city` - City
  - `institute_country` - Country
  - `institute_type` - Type (public, private, university, etc.)
  - `institute_accreditation` - Accreditation details (jsonb)
  - `institute_description` - Institute description

  ## 2. Important Notes
  - Fields are nullable to accommodate different organization types
  - Only relevant fields should be filled based on organization_type
  - Validation will be handled at application level
*/

-- Add Individual-specific fields
ALTER TABLE trainer_profiles
  ADD COLUMN IF NOT EXISTS individual_phone text,
  ADD COLUMN IF NOT EXISTS individual_address text,
  ADD COLUMN IF NOT EXISTS individual_skills text[] DEFAULT '{}';

-- Add Company-specific fields
ALTER TABLE trainer_profiles
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS company_registration_number text,
  ADD COLUMN IF NOT EXISTS company_contact_person text,
  ADD COLUMN IF NOT EXISTS company_contact_position text,
  ADD COLUMN IF NOT EXISTS company_email text,
  ADD COLUMN IF NOT EXISTS company_phone text,
  ADD COLUMN IF NOT EXISTS company_address text,
  ADD COLUMN IF NOT EXISTS company_city text,
  ADD COLUMN IF NOT EXISTS company_country text DEFAULT 'Guinée',
  ADD COLUMN IF NOT EXISTS company_sector text,
  ADD COLUMN IF NOT EXISTS company_size text,
  ADD COLUMN IF NOT EXISTS company_description text;

-- Add Institute-specific fields
ALTER TABLE trainer_profiles
  ADD COLUMN IF NOT EXISTS institute_name text,
  ADD COLUMN IF NOT EXISTS institute_registration_number text,
  ADD COLUMN IF NOT EXISTS institute_contact_person text,
  ADD COLUMN IF NOT EXISTS institute_contact_position text,
  ADD COLUMN IF NOT EXISTS institute_email text,
  ADD COLUMN IF NOT EXISTS institute_phone text,
  ADD COLUMN IF NOT EXISTS institute_address text,
  ADD COLUMN IF NOT EXISTS institute_city text,
  ADD COLUMN IF NOT EXISTS institute_country text DEFAULT 'Guinée',
  ADD COLUMN IF NOT EXISTS institute_type text,
  ADD COLUMN IF NOT EXISTS institute_accreditation jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS institute_description text;

-- Create indexes for better performance on email and phone lookups
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_company_email ON trainer_profiles(company_email);
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_institute_email ON trainer_profiles(institute_email);
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_organization_type ON trainer_profiles(organization_type);