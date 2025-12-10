/*
  # Create Interview Simulations Tables

  1. New Tables
    - `interview_simulations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `title` (text) - Interview title/job position
      - `job_description` (text) - Job description provided by user
      - `difficulty_level` (text) - easy, medium, hard
      - `question_count` (integer) - Number of questions in simulation
      - `status` (text) - in_progress, completed
      - `started_at` (timestamp)
      - `completed_at` (timestamp)
      - `score` (integer) - 0-100
      - `feedback` (jsonb) - AI-generated feedback
      - `questions_responses` (jsonb) - Questions and answers

  2. Security
    - Enable RLS on both tables
    - Add policies for user access
*/

CREATE TABLE IF NOT EXISTS interview_simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  job_description text NOT NULL,
  difficulty_level text NOT NULL DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  question_count integer NOT NULL DEFAULT 5 CHECK (question_count > 0 AND question_count <= 20),
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  score integer CHECK (score >= 0 AND score <= 100),
  feedback jsonb DEFAULT '[]'::jsonb,
  questions_responses jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE interview_simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own simulations"
  ON interview_simulations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create simulations"
  ON interview_simulations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own simulations"
  ON interview_simulations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_interview_simulations_user_id ON interview_simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_simulations_status ON interview_simulations(status);
CREATE INDEX IF NOT EXISTS idx_interview_simulations_created_at ON interview_simulations(created_at DESC);