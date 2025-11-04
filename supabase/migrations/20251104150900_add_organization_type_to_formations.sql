/*
  # Add organization_type field to formations table

  ## Overview
  This migration adds an organization_type field to the formations table to track
  which type of organization is offering each formation.

  ## Changes
  - Add `organization_type` column to track if formation is from individual, company, or institute
  - This allows a trainer to publish different types of formations regardless of their profile type

  ## Important Notes
  - Field is nullable for backward compatibility
  - Default value matches the trainer's profile organization_type if available
*/

-- Add organization_type field to formations
ALTER TABLE formations
  ADD COLUMN IF NOT EXISTS organization_type text CHECK (organization_type IN ('individual', 'company', 'institute'));

-- Create index for better filtering performance
CREATE INDEX IF NOT EXISTS idx_formations_organization_type ON formations(organization_type);