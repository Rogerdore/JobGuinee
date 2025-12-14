/*
  # Correction des politiques RLS pour applications
  
  ## Problème
  Les politiques RLS vérifient `auth.uid() = candidate_id` mais candidate_id référence profiles.id, pas auth.users.id
  
  ## Solution
  - Supprimer les anciennes politiques INSERT
  - Créer de nouvelles politiques qui vérifient correctement l'ownership via la table profiles
  
  ## Sécurité
  - Les candidats peuvent uniquement créer des candidatures sous leur propre identité
  - Les recruteurs peuvent voir et modifier les candidatures pour leurs offres
*/

-- Supprimer l'ancienne politique INSERT
DROP POLICY IF EXISTS "Candidates can insert own applications" ON applications;

-- Nouvelle politique INSERT : Les candidats peuvent créer leurs propres candidatures
CREATE POLICY "Candidates can insert own applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (
    candidate_id IN (
      SELECT id FROM profiles WHERE id = auth.uid()
    )
  );
