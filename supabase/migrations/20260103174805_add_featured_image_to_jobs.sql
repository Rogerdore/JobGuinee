/*
  # Ajouter image de mise en avant pour les offres d'emploi

  1. Nouvelle colonne
    - `featured_image_url` - URL de l'image de mise en avant (optionnel)
    - Si non fournie, le système utilisera `company_logo_url` par défaut

  2. Fonction helper
    - Fonction pour obtenir l'image à afficher (featured ou logo)
*/

-- Ajouter la colonne featured_image_url
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS featured_image_url text;

-- Créer une fonction pour obtenir l'image d'affichage avec fallback
CREATE OR REPLACE FUNCTION get_job_display_image(job_row jobs)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Retourner l'image de mise en avant si disponible, sinon le logo de l'entreprise
  RETURN COALESCE(job_row.featured_image_url, job_row.company_logo_url);
END;
$$;

COMMENT ON FUNCTION get_job_display_image IS 'Retourne l''image de mise en avant si disponible, sinon le logo de l''entreprise';
