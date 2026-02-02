/*
  # Politique RLS pour permettre aux candidats de voir leurs propres clics

  1. Modifications
    - Ajoute une politique SELECT sur job_clicks
    - Permet aux candidats de voir uniquement leurs propres clics
    - Nécessaire pour le Realtime subscription

  2. Sécurité
    - Les candidats ne voient que leurs propres données (user_id = auth.uid())
    - Les recruteurs et admins ont déjà leurs politiques
*/

-- Ajouter une politique pour que les candidats voient leurs propres clics
CREATE POLICY "Candidates can view their own clicks"
  ON job_clicks
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Activer Realtime pour la table job_clicks
ALTER PUBLICATION supabase_realtime ADD TABLE job_clicks;

-- Commentaire
COMMENT ON POLICY "Candidates can view their own clicks" ON job_clicks IS 
'Permet aux candidats authentifiés de voir leurs propres clics sur les offres pour le Realtime tracking';
