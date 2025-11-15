/*
  # Add Job Publication Payment System

  1. New Table
    - `job_publication_payments`
      - `id` (uuid, primary key)
      - `job_id` (uuid, references jobs)
      - `company_id` (uuid, references companies)
      - `amount` (numeric) - Cost of publication
      - `currency` (text) - GNF
      - `payment_status` (text) - 'pending', 'paid', 'failed'
      - `payment_method` (text) - 'subscription', 'one-time', 'free'
      - `paid_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Changes
    - Jobs from non-premium companies need payment approval before publishing
    - Jobs from premium companies (with active subscription) auto-publish
    - Track all publication payments for accounting

  3. Security
    - Enable RLS on job_publication_payments table
    - Recruiters can view their own payments
    - Admins can view and manage all payments
*/

-- Create job_publication_payments table
CREATE TABLE IF NOT EXISTS job_publication_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  amount numeric(10,2) DEFAULT 50000.00,
  currency text DEFAULT 'GNF' NOT NULL,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'waived')),
  payment_method text CHECK (payment_method IN ('subscription', 'one-time', 'free', 'admin_waived')),
  paid_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_job_payments_job_id ON job_publication_payments(job_id);
CREATE INDEX IF NOT EXISTS idx_job_payments_company_id ON job_publication_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_job_payments_status ON job_publication_payments(payment_status);

-- Enable RLS
ALTER TABLE job_publication_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Recruiters can view own company payments"
  ON job_publication_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = job_publication_payments.company_id
      AND companies.profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all payments"
  ON job_publication_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage all payments"
  ON job_publication_payments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Function to check if job publication should auto-approve
CREATE OR REPLACE FUNCTION should_auto_approve_job(p_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_active_subscription boolean;
BEGIN
  -- Check if company has active premium subscription
  SELECT has_active_premium(p_company_id) INTO v_has_active_subscription;

  RETURN v_has_active_subscription;
END;
$$;

-- Function to handle job publication with payment
CREATE OR REPLACE FUNCTION handle_job_publication(p_job_id uuid, p_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_should_auto_approve boolean;
  v_job_status text;
  v_payment_method text;
  v_payment_id uuid;
BEGIN
  -- Check if should auto-approve
  SELECT should_auto_approve_job(p_company_id) INTO v_should_auto_approve;

  IF v_should_auto_approve THEN
    -- Premium company - auto approve
    v_job_status := 'published';
    v_payment_method := 'subscription';

    -- Update job status
    UPDATE jobs
    SET status = v_job_status, updated_at = now()
    WHERE id = p_job_id;

    -- Record payment as paid via subscription
    INSERT INTO job_publication_payments (
      job_id,
      company_id,
      amount,
      payment_status,
      payment_method,
      paid_at,
      notes
    ) VALUES (
      p_job_id,
      p_company_id,
      0.00,
      'paid',
      v_payment_method,
      now(),
      'Auto-approved via active premium subscription'
    ) RETURNING id INTO v_payment_id;

    RETURN jsonb_build_object(
      'success', true,
      'auto_approved', true,
      'status', v_job_status,
      'payment_id', v_payment_id,
      'message', 'Job auto-approved via premium subscription'
    );
  ELSE
    -- Non-premium company - needs payment/approval
    v_job_status := 'draft';
    v_payment_method := 'one-time';

    -- Job stays in draft status
    UPDATE jobs
    SET status = v_job_status, updated_at = now()
    WHERE id = p_job_id;

    -- Record pending payment
    INSERT INTO job_publication_payments (
      job_id,
      company_id,
      payment_status,
      payment_method,
      notes
    ) VALUES (
      p_job_id,
      p_company_id,
      'pending',
      v_payment_method,
      'Awaiting payment or admin approval'
    ) RETURNING id INTO v_payment_id;

    RETURN jsonb_build_object(
      'success', true,
      'auto_approved', false,
      'status', v_job_status,
      'payment_id', v_payment_id,
      'message', 'Job pending payment or admin approval'
    );
  END IF;
END;
$$;

-- Comments
COMMENT ON TABLE job_publication_payments IS 'Tracks payments for job publications - premium companies bypass payment';
COMMENT ON FUNCTION should_auto_approve_job IS 'Checks if company has active premium subscription for auto-approval';
COMMENT ON FUNCTION handle_job_publication IS 'Handles job publication with automatic approval for premium companies';
