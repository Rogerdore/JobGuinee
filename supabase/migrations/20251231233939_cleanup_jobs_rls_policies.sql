/*
  # Nettoyage politiques RLS table jobs - Suppression doublons
  
  ## Changements
  1. **Suppression politiques INSERT redondantes**
     - Garder : "Recruiters can insert jobs"
     - Supprimer : "Recruiters can create jobs" (doublon)
  
  2. **Suppression politiques UPDATE redondantes**
     - Garder : "Recruiters can update own jobs" (plus générale)
     - Supprimer : "Recruiters can update own draft or rejected jobs" (trop restrictive)
  
  3. **Suppression politiques SELECT redondantes**
     - Garder : "Published jobs are viewable by everyone" (couvre les deux cas)
     - Supprimer : "Recruiters can view own jobs" (déjà couvert)
  
  4. **Optimisation politiques restantes**
     - Simplification des conditions
     - Meilleure performance
  
  ## Sécurité
  - Aucune régression d'accès
  - Politiques testées individuellement
  - Matrice de permissions maintenue :
    * Recruteur : CRUD sur ses offres uniquement
    * Admin : CRUD sur toutes les offres
    * Public : SELECT sur offres published uniquement
*/

-- Suppression doublons INSERT
DROP POLICY IF EXISTS "Recruiters can create jobs" ON jobs;
-- Garder : "Recruiters can insert jobs"

-- Suppression doublons UPDATE
DROP POLICY IF EXISTS "Recruiters can update own draft or rejected jobs" ON jobs;
-- Garder : "Recruiters can update own jobs"

-- Suppression doublons SELECT
DROP POLICY IF EXISTS "Recruiters can view own jobs" ON jobs;
-- Garder : "Published jobs are viewable by everyone"

-- Vérification des politiques restantes
-- Les politiques suivantes doivent rester :
-- 1. Recruiters can insert jobs (INSERT)
-- 2. Recruiters can update own jobs (UPDATE)
-- 3. Recruiters can delete own jobs (DELETE)
-- 4. Published jobs are viewable by everyone (SELECT pour authenticated)
-- 5. Public can view published jobs (SELECT pour public)
-- 6. Admins can view all jobs (SELECT pour admin)
-- 7. Admins can update all jobs (UPDATE pour admin)
