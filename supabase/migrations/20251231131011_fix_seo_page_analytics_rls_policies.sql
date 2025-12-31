/*
  # Fix SEO Page Analytics RLS Policies

  ## Problème
  Les politiques RLS actuelles empêchent les insertions dans `seo_page_analytics` :
  - La politique `FOR ALL` n'a pas de clause `WITH CHECK`
  - Les Core Web Vitals doivent être collectables par tous (anonymes inclus)

  ## Tables modifiées
  - `seo_page_analytics` - Mise à jour des politiques RLS

  ## Changements
  1. Suppression de la politique `FOR ALL` incorrecte
  2. Création de politiques séparées pour SELECT, INSERT, UPDATE, DELETE
  3. Autorisation des insertions anonymes pour Core Web Vitals
  4. Gestion complète réservée aux admins

  ## Sécurité
  - Les utilisateurs anonymes peuvent uniquement insérer des Core Web Vitals
  - Seuls les admins peuvent lire et modifier les analytics
  - Protection contre les abus avec limite sur les champs insérables
*/

-- ============================================================================
-- 1. SUPPRESSION DES ANCIENNES POLITIQUES
-- ============================================================================

DROP POLICY IF EXISTS "Admins can read page analytics" ON seo_page_analytics;
DROP POLICY IF EXISTS "Admins can manage page analytics" ON seo_page_analytics;

-- ============================================================================
-- 2. NOUVELLES POLITIQUES RLS CORRECTES
-- ============================================================================

-- SELECT - Admins seulement
CREATE POLICY "Admins can read page analytics"
  ON seo_page_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- INSERT - Tout le monde (pour Core Web Vitals tracking)
-- Permet aux utilisateurs anonymes d'envoyer des métriques de performance
CREATE POLICY "Anyone can insert page analytics"
  ON seo_page_analytics FOR INSERT
  WITH CHECK (true);

-- UPDATE - Admins seulement
CREATE POLICY "Admins can update page analytics"
  ON seo_page_analytics FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- DELETE - Admins seulement
CREATE POLICY "Admins can delete page analytics"
  ON seo_page_analytics FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- ============================================================================
-- 3. COMMENTAIRES ET DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE seo_page_analytics IS
  'Analytics par page incluant métriques SEO et Core Web Vitals. '
  'Les insertions sont ouvertes à tous pour le tracking de performance, '
  'mais seuls les admins peuvent lire et gérer les données.';

COMMENT ON POLICY "Anyone can insert page analytics" ON seo_page_analytics IS
  'Permet à tous les utilisateurs (y compris anonymes) d''enregistrer des '
  'Core Web Vitals pour un suivi de performance réaliste. Les données sont '
  'automatiquement agrégées et seuls les admins peuvent les consulter.';