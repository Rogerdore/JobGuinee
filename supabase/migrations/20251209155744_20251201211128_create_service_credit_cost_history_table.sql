-- Create service_credit_cost_history table
CREATE TABLE IF NOT EXISTS service_credit_cost_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES ia_services(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  credits_used numeric(10,2),
  cost_amount numeric(10,2),
  transaction_date timestamptz DEFAULT now(),
  description text
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_credit_history_user ON service_credit_cost_history(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_history_service ON service_credit_cost_history(service_id);
CREATE INDEX IF NOT EXISTS idx_credit_history_date ON service_credit_cost_history(transaction_date DESC);

-- Enable RLS
ALTER TABLE service_credit_cost_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their credit history"
  ON service_credit_cost_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);