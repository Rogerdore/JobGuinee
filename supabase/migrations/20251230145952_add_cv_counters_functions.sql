/*
  # Fonctions pour compteurs CV

  1. Fonctions créées
    - increment_cv_view_count: Incrémenter compteur de vues
    - increment_cv_download_count: Incrémenter compteur de téléchargements

  2. Fonctionnalités
    - Mise à jour atomique des compteurs
    - Mise à jour du timestamp correspondant
    - Sécurisé via RLS existant
*/

-- Fonction pour incrémenter le compteur de vues
CREATE OR REPLACE FUNCTION increment_cv_view_count(cv_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE cv_versions
  SET
    view_count = view_count + 1,
    last_viewed_at = now()
  WHERE id = cv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour incrémenter le compteur de téléchargements
CREATE OR REPLACE FUNCTION increment_cv_download_count(cv_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE cv_versions
  SET
    download_count = download_count + 1,
    last_downloaded_at = now()
  WHERE id = cv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;