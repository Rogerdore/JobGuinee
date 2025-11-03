/*
  # Fix Workflow Stages Trigger

  1. Changes
    - Drop and recreate the trigger function with correct column name
    - Change 'color' to 'stage_color' to match actual table schema
*/

-- Drop existing function
DROP FUNCTION IF EXISTS create_default_workflow_stages() CASCADE;

-- Recreate with correct column name
CREATE OR REPLACE FUNCTION create_default_workflow_stages()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO workflow_stages (company_id, stage_name, stage_order, stage_color) VALUES
  (NEW.id, 'Nouveau', 1, '#3B82F6'),
  (NEW.id, 'Présélectionné', 2, '#10B981'),
  (NEW.id, 'Entretien', 3, '#F59E0B'),
  (NEW.id, 'Offre', 4, '#8B5CF6'),
  (NEW.id, 'Embauché', 5, '#059669'),
  (NEW.id, 'Rejeté', 6, '#EF4444')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER create_workflow_stages_on_company_insert
AFTER INSERT ON companies
FOR EACH ROW
EXECUTE FUNCTION create_default_workflow_stages();
