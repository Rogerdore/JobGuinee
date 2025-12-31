/*
  # Ajout des colonnes Core Web Vitals manquantes

  ## Modifications
  - Ajout des colonnes FCP (First Contentful Paint) et TTFB (Time To First Byte) à la table seo_page_analytics

  ## Notes
  Ces métriques sont importantes pour le suivi complet des performances web
*/

-- Ajouter les colonnes FCP et TTFB si elles n'existent pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seo_page_analytics' AND column_name = 'fcp'
  ) THEN
    ALTER TABLE seo_page_analytics ADD COLUMN fcp NUMERIC;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seo_page_analytics' AND column_name = 'ttfb'
  ) THEN
    ALTER TABLE seo_page_analytics ADD COLUMN ttfb NUMERIC;
  END IF;
END $$;

-- Ajouter des commentaires pour documenter les colonnes
COMMENT ON COLUMN seo_page_analytics.fcp IS 'First Contentful Paint - Temps avant le premier élément de contenu visible (ms)';
COMMENT ON COLUMN seo_page_analytics.ttfb IS 'Time To First Byte - Temps de réponse du serveur (ms)';
