-- Add subscription columns to companies table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE companies ADD COLUMN subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'enterprise'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'subscription_start_date'
  ) THEN
    ALTER TABLE companies ADD COLUMN subscription_start_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' AND column_name = 'subscription_end_date'
  ) THEN
    ALTER TABLE companies ADD COLUMN subscription_end_date timestamptz;
  END IF;
END $$;

-- Add index for subscription queries
CREATE INDEX IF NOT EXISTS idx_companies_subscription_tier ON companies(subscription_tier);

-- Add helper function to check if company has active premium subscription
CREATE OR REPLACE FUNCTION public.has_active_premium(company_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM companies 
    WHERE id = company_id_param 
    AND subscription_tier IN ('premium', 'enterprise')
    AND (subscription_end_date IS NULL OR subscription_end_date > now())
  );
END;
$$;