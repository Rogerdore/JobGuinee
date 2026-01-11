/*
  # Upgrade External Applications Pipeline

  1. New Columns
    - `external_application_url`: URL where candidates must apply externally
    - Draft system for data persistence

  2. New Table
    - `external_application_supplementary_docs`: Supplementary documents management

  3. Changes
    - Make CV and cover letter tracking more robust
    - Add draft state for work-in-progress applications
    - Add validation requirements

  4. Security
    - RLS policies maintained
    - User can only access their own drafts and applications
*/

-- Add external_application_url field (required)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'external_applications'
    AND column_name = 'external_application_url'
  ) THEN
    ALTER TABLE external_applications
    ADD COLUMN external_application_url text;
  END IF;
END $$;

-- Add draft state fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'external_applications'
    AND column_name = 'is_draft'
  ) THEN
    ALTER TABLE external_applications
    ADD COLUMN is_draft boolean DEFAULT true,
    ADD COLUMN draft_step text,
    ADD COLUMN draft_data jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add validation flags
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'external_applications'
    AND column_name = 'cv_validated'
  ) THEN
    ALTER TABLE external_applications
    ADD COLUMN cv_validated boolean DEFAULT false,
    ADD COLUMN cover_letter_validated boolean DEFAULT false,
    ADD COLUMN has_supplementary_docs boolean DEFAULT false;
  END IF;
END $$;

-- Create supplementary documents table
CREATE TABLE IF NOT EXISTS external_application_supplementary_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_application_id uuid REFERENCES external_applications(id) ON DELETE CASCADE NOT NULL,
  candidate_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Document info
  document_name text NOT NULL,
  original_filename text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  storage_path text NOT NULL,

  -- Display
  display_order integer DEFAULT 0,
  custom_label text,

  -- Metadata
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ext_app_supp_docs_application
  ON external_application_supplementary_docs(external_application_id);

CREATE INDEX IF NOT EXISTS idx_ext_app_supp_docs_candidate
  ON external_application_supplementary_docs(candidate_id);

CREATE INDEX IF NOT EXISTS idx_ext_app_draft_candidate
  ON external_applications(candidate_id)
  WHERE is_draft = true;

-- RLS for supplementary documents
ALTER TABLE external_application_supplementary_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own supplementary docs"
  ON external_application_supplementary_docs FOR SELECT
  TO authenticated
  USING (candidate_id = auth.uid());

CREATE POLICY "Users can insert own supplementary docs"
  ON external_application_supplementary_docs FOR INSERT
  TO authenticated
  WITH CHECK (candidate_id = auth.uid());

CREATE POLICY "Users can update own supplementary docs"
  ON external_application_supplementary_docs FOR UPDATE
  TO authenticated
  USING (candidate_id = auth.uid())
  WITH CHECK (candidate_id = auth.uid());

CREATE POLICY "Users can delete own supplementary docs"
  ON external_application_supplementary_docs FOR DELETE
  TO authenticated
  USING (candidate_id = auth.uid());

-- Function to get or create draft application
CREATE OR REPLACE FUNCTION get_or_create_draft_application(
  p_candidate_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_draft_id uuid;
BEGIN
  -- Try to find existing draft
  SELECT id INTO v_draft_id
  FROM external_applications
  WHERE candidate_id = p_candidate_id
    AND is_draft = true
  ORDER BY created_at DESC
  LIMIT 1;

  -- If no draft exists, create one
  IF v_draft_id IS NULL THEN
    INSERT INTO external_applications (
      candidate_id,
      job_title,
      company_name,
      recruiter_email,
      is_draft,
      draft_step,
      status
    ) VALUES (
      p_candidate_id,
      '',
      '',
      '',
      true,
      'import',
      'draft'
    )
    RETURNING id INTO v_draft_id;
  END IF;

  RETURN v_draft_id;
END;
$$;

-- Function to save draft data
CREATE OR REPLACE FUNCTION save_draft_application_data(
  p_application_id uuid,
  p_candidate_id uuid,
  p_step text,
  p_data jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM external_applications
    WHERE id = p_application_id
      AND candidate_id = p_candidate_id
      AND is_draft = true
  ) THEN
    RAISE EXCEPTION 'Application not found or not a draft';
  END IF;

  -- Update draft
  UPDATE external_applications
  SET
    draft_step = p_step,
    draft_data = p_data,
    updated_at = now()
  WHERE id = p_application_id
    AND candidate_id = p_candidate_id;

  RETURN true;
END;
$$;

-- Function to finalize application (convert draft to submitted)
CREATE OR REPLACE FUNCTION finalize_external_application(
  p_application_id uuid,
  p_candidate_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cv_valid boolean;
  v_letter_valid boolean;
BEGIN
  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM external_applications
    WHERE id = p_application_id
      AND candidate_id = p_candidate_id
      AND is_draft = true
  ) THEN
    RAISE EXCEPTION 'Application not found or not a draft';
  END IF;

  -- Check CV is present
  SELECT
    (cv_document_id IS NOT NULL OR cv_source = 'profile'),
    (cover_letter_document_id IS NOT NULL)
  INTO v_cv_valid, v_letter_valid
  FROM external_applications
  WHERE id = p_application_id;

  IF NOT v_cv_valid THEN
    RAISE EXCEPTION 'CV is required to finalize application';
  END IF;

  IF NOT v_letter_valid THEN
    RAISE EXCEPTION 'Cover letter is required to finalize application';
  END IF;

  -- Finalize
  UPDATE external_applications
  SET
    is_draft = false,
    status = 'sent',
    sent_at = now(),
    cv_validated = v_cv_valid,
    cover_letter_validated = v_letter_valid,
    updated_at = now()
  WHERE id = p_application_id
    AND candidate_id = p_candidate_id;

  RETURN true;
END;
$$;

-- Update status constraint to include draft
DO $$
BEGIN
  ALTER TABLE external_applications
  DROP CONSTRAINT IF EXISTS external_applications_status_check;

  ALTER TABLE external_applications
  ADD CONSTRAINT external_applications_status_check
  CHECK (status IN (
    'draft', 'sent', 'in_progress', 'relance_sent', 'rejected',
    'accepted', 'no_response', 'cancelled'
  ));
END $$;

-- Create storage bucket for supplementary documents if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('external-application-supplements', 'external-application-supplements', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for supplementary documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can upload own supplementary docs'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can upload own supplementary docs"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = ''external-application-supplements'' AND
        (storage.foldername(name))[1] = auth.uid()::text
      )';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can view own supplementary docs'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view own supplementary docs"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = ''external-application-supplements'' AND
        (storage.foldername(name))[1] = auth.uid()::text
      )';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can delete own supplementary docs'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete own supplementary docs"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = ''external-application-supplements'' AND
        (storage.foldername(name))[1] = auth.uid()::text
      )';
  END IF;
END $$;
