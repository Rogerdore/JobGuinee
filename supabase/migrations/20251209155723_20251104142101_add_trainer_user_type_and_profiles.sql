-- Add trainer user type to profiles constraint
DO $$
BEGIN
  -- Check if constraint exists and modify it
  ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_user_type_check;
  
  ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_user_type_check 
  CHECK (user_type IN ('candidate', 'recruiter', 'admin', 'trainer'));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Create trainer_profiles table
CREATE TABLE IF NOT EXISTS trainer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  expertise text[],
  bio text,
  experience_years integer,
  hourly_rate numeric,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_profile ON trainer_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_verified ON trainer_profiles(is_verified);

-- Enable RLS
ALTER TABLE trainer_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view verified trainer profiles"
  ON trainer_profiles FOR SELECT
  USING (is_verified = true);

CREATE POLICY "Users can view their own profile"
  ON trainer_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = profile_id);

CREATE POLICY "Trainers can update their own profile"
  ON trainer_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);