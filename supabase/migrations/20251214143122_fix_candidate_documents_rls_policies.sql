/*
  # Correction des politiques RLS pour candidate_documents
  
  ## Problème
  Les politiques RLS vérifient `candidate_id = auth.uid()` mais candidate_id référence profiles.id, pas auth.users.id
  
  ## Solution
  - Supprimer les anciennes politiques
  - Créer de nouvelles politiques qui vérifient correctement l'ownership via la table profiles
  
  ## Sécurité
  - Les candidats peuvent uniquement gérer leurs propres documents
  - Les admins et recruteurs peuvent voir les documents selon leurs permissions
*/

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Candidates can view own documents" ON candidate_documents;
DROP POLICY IF EXISTS "Candidates can insert own documents" ON candidate_documents;
DROP POLICY IF EXISTS "Candidates can update own documents" ON candidate_documents;
DROP POLICY IF EXISTS "Candidates can delete own documents" ON candidate_documents;

-- Politique SELECT : Les candidats voient leurs propres documents
CREATE POLICY "Candidates can view own documents"
  ON candidate_documents FOR SELECT
  TO authenticated
  USING (
    candidate_id IN (
      SELECT id FROM profiles WHERE id = auth.uid()
    )
  );

-- Politique INSERT : Les candidats peuvent créer leurs propres documents
CREATE POLICY "Candidates can insert own documents"
  ON candidate_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    candidate_id IN (
      SELECT id FROM profiles WHERE id = auth.uid()
    )
  );

-- Politique UPDATE : Les candidats peuvent modifier leurs propres documents
CREATE POLICY "Candidates can update own documents"
  ON candidate_documents FOR UPDATE
  TO authenticated
  USING (
    candidate_id IN (
      SELECT id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    candidate_id IN (
      SELECT id FROM profiles WHERE id = auth.uid()
    )
  );

-- Politique DELETE : Les candidats peuvent supprimer leurs propres documents
CREATE POLICY "Candidates can delete own documents"
  ON candidate_documents FOR DELETE
  TO authenticated
  USING (
    candidate_id IN (
      SELECT id FROM profiles WHERE id = auth.uid()
    )
  );
