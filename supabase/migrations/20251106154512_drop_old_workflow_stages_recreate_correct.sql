/*
  # Drop and Recreate Workflow Stages Table with Correct Schema

  1. Problem
    - Old migration created workflow_stages with job_id (one workflow per job)
    - New design uses company_id (one workflow per company, shared across all jobs)
    - This caused conflicts with RLS policies and the trigger function
    
  2. Changes
    - Drop old workflow_stages table completely
    - Drop old index on job_id
    - Drop old RLS policies
    - Recreate table with correct schema (company_id instead of job_id)
    - Create new RLS policies
    - Ensure trigger function works with new schema
    
  3. Impact
    - Any existing workflow stages will be lost
    - New companies will get default stages automatically via trigger
    - Existing companies can recreate their stages
*/

-- Drop old policies first
DROP POLICY IF EXISTS "Recruiters can manage workflow stages for their jobs" ON workflow_stages;
DROP POLICY IF EXISTS "Companies can manage their workflow stages" ON workflow_stages;

-- Drop old index
DROP INDEX IF EXISTS idx_workflow_stages_job;

-- Drop old table (CASCADE will drop any dependent objects)
DROP TABLE IF EXISTS workflow_stages CASCADE;

-- Recreate table with correct schema
CREATE TABLE IF NOT EXISTS workflow_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  stage_name text NOT NULL,
  stage_order integer NOT NULL,
  stage_color text DEFAULT '#3B82F6',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create index on company_id
CREATE INDEX IF NOT EXISTS idx_workflow_stages_company ON workflow_stages(company_id);

-- Enable RLS
ALTER TABLE workflow_stages ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Companies can manage their workflow stages"
  ON workflow_stages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = workflow_stages.company_id
      AND companies.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = workflow_stages.company_id
      AND companies.profile_id = auth.uid()
    )
  );

-- Ensure the trigger function exists and is correct
CREATE OR REPLACE FUNCTION public.create_default_workflow_stages()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.workflow_stages (company_id, stage_name, stage_order, stage_color, is_default)
  VALUES
    (NEW.id, 'Nouveau', 1, '#3B82F6', true),
    (NEW.id, 'Présélectionné', 2, '#10B981', true),
    (NEW.id, 'Entretien', 3, '#F59E0B', true),
    (NEW.id, 'Offre', 4, '#8B5CF6', true),
    (NEW.id, 'Embauché', 5, '#059669', true),
    (NEW.id, 'Rejeté', 6, '#EF4444', true)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS create_workflow_stages_on_company_insert ON companies;
CREATE TRIGGER create_workflow_stages_on_company_insert
AFTER INSERT ON companies
FOR EACH ROW
EXECUTE FUNCTION create_default_workflow_stages();

-- Create default workflow stages for existing companies that don't have any
INSERT INTO workflow_stages (company_id, stage_name, stage_order, stage_color, is_default)
SELECT 
  c.id,
  stage.name,
  stage.order_num,
  stage.color,
  true
FROM companies c
CROSS JOIN (
  VALUES 
    ('Nouveau', 1, '#3B82F6'),
    ('Présélectionné', 2, '#10B981'),
    ('Entretien', 3, '#F59E0B'),
    ('Offre', 4, '#8B5CF6'),
    ('Embauché', 5, '#059669'),
    ('Rejeté', 6, '#EF4444')
) AS stage(name, order_num, color)
WHERE NOT EXISTS (
  SELECT 1 FROM workflow_stages ws 
  WHERE ws.company_id = c.id
)
ON CONFLICT DO NOTHING;
