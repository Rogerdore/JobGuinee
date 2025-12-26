/*
  # Create SEO Audit System

  1. New Tables
    - `seo_audit_reports`
      - `id` (uuid, primary key)
      - `overall_score` (int) - Score global SEO (0-100)
      - `technical_score` (int) - Score technique
      - `content_score` (int) - Score contenu
      - `semantic_score` (int) - Score sémantique
      - `performance_score` (int) - Score performance
      - `issues_count` (int) - Nombre de problèmes détectés
      - `opportunities_count` (int) - Nombre d'opportunités
      - `pages_analyzed` (int) - Pages analysées
      - `audit_data` (jsonb) - Données complètes de l'audit
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `seo_audit_reports` table
    - Add policy for admins to read audit reports
    - Add policy for system to create audit reports
*/

CREATE TABLE IF NOT EXISTS seo_audit_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  overall_score int NOT NULL DEFAULT 0,
  technical_score int NOT NULL DEFAULT 0,
  content_score int NOT NULL DEFAULT 0,
  semantic_score int NOT NULL DEFAULT 0,
  performance_score int NOT NULL DEFAULT 0,
  issues_count int NOT NULL DEFAULT 0,
  opportunities_count int NOT NULL DEFAULT 0,
  pages_analyzed int NOT NULL DEFAULT 0,
  audit_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE seo_audit_reports ENABLE ROW LEVEL SECURITY;

-- Policy for admins to read all audit reports
CREATE POLICY "Admins can view audit reports"
  ON seo_audit_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Policy for system to create audit reports
CREATE POLICY "System can create audit reports"
  ON seo_audit_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_seo_audit_reports_created_at
  ON seo_audit_reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_seo_audit_reports_overall_score
  ON seo_audit_reports(overall_score DESC);
