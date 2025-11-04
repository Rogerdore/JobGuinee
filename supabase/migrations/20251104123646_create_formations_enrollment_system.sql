/*
  # Create Formations Enrollment System

  1. New Tables
    - `formation_enrollments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `formation_id` (uuid, foreign key to formations)
      - `status` (text: pending, confirmed, completed, cancelled)
      - `payment_method` (text: orange_money, lengopay, digitalpay, card)
      - `amount` (integer, in GNF)
      - `full_name` (text)
      - `email` (text)
      - `phone` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `coaching_bookings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles, nullable)
      - `coaching_type` (text: cv_review, interview_prep, career_orientation)
      - `scheduled_date` (timestamp)
      - `duration` (integer, in minutes)
      - `status` (text: pending, confirmed, completed, cancelled)
      - `payment_method` (text)
      - `amount` (integer, in GNF)
      - `full_name` (text)
      - `email` (text)
      - `phone` (text)
      - `notes` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `trainer_applications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles, nullable)
      - `full_name` (text)
      - `email` (text)
      - `phone` (text)
      - `linkedin_url` (text, optional)
      - `expertise_domain` (text)
      - `experience_years` (integer)
      - `description` (text)
      - `cv_url` (text, optional)
      - `portfolio_url` (text, optional)
      - `proposed_formations` (text)
      - `availability` (text)
      - `motivation` (text)
      - `status` (text: pending, reviewed, approved, rejected)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Users can view their own enrollments/bookings/applications
    - Authenticated users can create enrollments/bookings/applications
    - Admins can view and manage all records
*/

-- Formation Enrollments Table
CREATE TABLE IF NOT EXISTS formation_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  formation_id uuid REFERENCES formations(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_method text NOT NULL CHECK (payment_method IN ('orange_money', 'lengopay', 'digitalpay', 'card')),
  amount integer NOT NULL CHECK (amount >= 0),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE formation_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own enrollments"
  ON formation_enrollments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create enrollments"
  ON formation_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all enrollments"
  ON formation_enrollments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update enrollments"
  ON formation_enrollments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_formation_enrollments_user ON formation_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_formation_enrollments_formation ON formation_enrollments(formation_id);
CREATE INDEX IF NOT EXISTS idx_formation_enrollments_status ON formation_enrollments(status);

-- Coaching Bookings Table
CREATE TABLE IF NOT EXISTS coaching_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  coaching_type text NOT NULL CHECK (coaching_type IN ('cv_review', 'interview_prep', 'career_orientation')),
  scheduled_date timestamptz NOT NULL,
  duration integer NOT NULL CHECK (duration IN (30, 60, 120)),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_method text NOT NULL CHECK (payment_method IN ('orange_money', 'lengopay', 'digitalpay', 'card')),
  amount integer NOT NULL CHECK (amount >= 0),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE coaching_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON coaching_bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings"
  ON coaching_bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all bookings"
  ON coaching_bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update bookings"
  ON coaching_bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_coaching_bookings_user ON coaching_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_bookings_date ON coaching_bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_coaching_bookings_status ON coaching_bookings(status);

-- Trainer Applications Table
CREATE TABLE IF NOT EXISTS trainer_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  linkedin_url text DEFAULT '',
  expertise_domain text NOT NULL,
  experience_years integer NOT NULL CHECK (experience_years >= 0),
  description text NOT NULL,
  cv_url text DEFAULT '',
  portfolio_url text DEFAULT '',
  proposed_formations text NOT NULL,
  availability text NOT NULL,
  motivation text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trainer_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications"
  ON trainer_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create applications"
  ON trainer_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all applications"
  ON trainer_applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update applications"
  ON trainer_applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_trainer_applications_user ON trainer_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_trainer_applications_status ON trainer_applications(status);