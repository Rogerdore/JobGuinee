-- Create formations_enrollment table
CREATE TABLE IF NOT EXISTS formations_enrollment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id uuid REFERENCES formations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  enrollment_date timestamptz DEFAULT now(),
  status text DEFAULT 'enrolled',
  progress_percentage integer DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(formation_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_formations_enrollment_user ON formations_enrollment(user_id);
CREATE INDEX IF NOT EXISTS idx_formations_enrollment_formation ON formations_enrollment(formation_id);
CREATE INDEX IF NOT EXISTS idx_formations_enrollment_status ON formations_enrollment(status);

-- Enable RLS
ALTER TABLE formations_enrollment ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own enrollments"
  ON formations_enrollment FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll in formations"
  ON formations_enrollment FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments"
  ON formations_enrollment FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);