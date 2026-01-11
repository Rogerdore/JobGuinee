/*
  # Corriger l'accès aux documents des candidats

  1. Problème
    - Les candidats ne peuvent pas télécharger/lire leurs propres fichiers depuis le storage
    - Les politiques RLS manquantes empêchent l'accès aux buckets de storage

  2. Solution
    - Ajouter des politiques SELECT pour que les candidats puissent accéder à leurs propres fichiers
    - Couvre les 3 buckets: candidate-cvs, candidate-cover-letters, candidate-certificates

  3. Sécurité
    - Les candidats ne peuvent accéder qu'aux fichiers dans leur propre dossier (user_id)
    - Les recruteurs et admins conservent leurs accès existants
*/

-- Candidats peuvent lire leurs propres CVs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Candidates can read their own CVs'
  ) THEN
    CREATE POLICY "Candidates can read their own CVs"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'candidate-cvs'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- Candidats peuvent lire leurs propres lettres de motivation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Candidates can read their own cover letters'
  ) THEN
    CREATE POLICY "Candidates can read their own cover letters"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'candidate-cover-letters'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- Candidats peuvent lire leurs propres certificats
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Candidates can read their own certificates'
  ) THEN
    CREATE POLICY "Candidates can read their own certificates"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'candidate-certificates'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;
