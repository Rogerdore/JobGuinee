/**
 * VUES ET REQUÊTES DE MONITORING - SYSTÈME DE BADGES
 * À exécuter dans Supabase SQL Editor pour monitoring avancé
 */

-- =====================================================
-- VUE 1: DASHBOARD BADGES EN TEMPS RÉEL
-- =====================================================

CREATE OR REPLACE VIEW badge_dashboard_stats AS
SELECT
  -- Total demandes
  COUNT(*) as total_requests,

  -- Par statut
  COUNT(*) FILTER (WHERE status = 'pending') as pending_requests,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_requests,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_requests,
  COUNT(*) FILTER (WHERE status = 'expired') as expired_requests,

  -- Par type de badge
  COUNT(*) FILTER (WHERE badge_type = 'urgent') as urgent_requests,
  COUNT(*) FILTER (WHERE badge_type = 'featured') as featured_requests,

  -- Badges actifs actuellement
  COUNT(*) FILTER (
    WHERE status = 'approved'
    AND ends_at > now()
    AND badge_type = 'urgent'
  ) as active_urgent_badges,
  COUNT(*) FILTER (
    WHERE status = 'approved'
    AND ends_at > now()
    AND badge_type = 'featured'
  ) as active_featured_badges,

  -- Revenus totaux
  SUM(price_gnf) FILTER (WHERE payment_status = 'completed') as total_revenue_gnf,

  -- Taux d'approbation
  CASE
    WHEN COUNT(*) FILTER (WHERE status IN ('approved', 'rejected')) > 0
    THEN ROUND(
      COUNT(*) FILTER (WHERE status = 'approved')::numeric * 100 /
      COUNT(*) FILTER (WHERE status IN ('approved', 'rejected')),
      1
    )
    ELSE 0
  END as approval_rate_percent,

  -- Temps moyen de traitement (en heures)
  ROUND(
    AVG(
      EXTRACT(EPOCH FROM (
        COALESCE(approved_at, updated_at) - created_at
      )) / 3600
    )::numeric,
    1
  ) FILTER (WHERE status IN ('approved', 'rejected')) as avg_processing_hours

FROM job_badge_requests;

COMMENT ON VIEW badge_dashboard_stats IS
'Vue agrégée pour dashboard admin - statistiques temps réel du système de badges';


-- =====================================================
-- VUE 2: BADGES EN ATTENTE DE VALIDATION
-- =====================================================

CREATE OR REPLACE VIEW badges_pending_validation AS
SELECT
  jbr.id,
  jbr.badge_type,
  jbr.price_gnf,
  jbr.payment_reference,
  jbr.created_at,

  -- Info recruteur
  p.email as recruiter_email,
  p.full_name as recruiter_name,
  p.account_type as recruiter_account_type,

  -- Info entreprise
  c.name as company_name,
  c.industry as company_industry,

  -- Info offre
  j.title as job_title,
  j.location as job_location,
  j.contract_type,

  -- Temps d'attente
  EXTRACT(EPOCH FROM (now() - jbr.created_at)) / 3600 as waiting_hours,

  -- Priorité (SLA: < 24h)
  CASE
    WHEN EXTRACT(EPOCH FROM (now() - jbr.created_at)) / 3600 > 24 THEN 'HIGH'
    WHEN EXTRACT(EPOCH FROM (now() - jbr.created_at)) / 3600 > 12 THEN 'MEDIUM'
    ELSE 'NORMAL'
  END as priority

FROM job_badge_requests jbr
JOIN profiles p ON p.id = jbr.recruiter_id
LEFT JOIN companies c ON c.id = jbr.company_id
JOIN jobs j ON j.id = jbr.job_id

WHERE jbr.status = 'pending'
ORDER BY jbr.created_at ASC;

COMMENT ON VIEW badges_pending_validation IS
'Vue détaillée des badges en attente de validation admin avec priorité SLA';


-- =====================================================
-- VUE 3: PERFORMANCE BADGES PAR RECRUTEUR
-- =====================================================

CREATE OR REPLACE VIEW recruiter_badge_performance AS
SELECT
  p.id as recruiter_id,
  p.email,
  p.full_name,
  p.account_type,
  c.name as company_name,

  -- Statistiques demandes
  COUNT(jbr.id) as total_requests,
  COUNT(jbr.id) FILTER (WHERE jbr.status = 'approved') as approved_count,
  COUNT(jbr.id) FILTER (WHERE jbr.status = 'rejected') as rejected_count,
  COUNT(jbr.id) FILTER (WHERE jbr.status = 'expired') as expired_count,

  -- Badges actifs actuellement
  COUNT(jbr.id) FILTER (
    WHERE jbr.status = 'approved' AND jbr.ends_at > now()
  ) as active_badges,

  -- Dépenses totales
  SUM(jbr.price_gnf) FILTER (WHERE jbr.payment_status = 'completed') as total_spent_gnf,

  -- Taux d'approbation personnel
  CASE
    WHEN COUNT(jbr.id) FILTER (WHERE jbr.status IN ('approved', 'rejected')) > 0
    THEN ROUND(
      COUNT(jbr.id) FILTER (WHERE jbr.status = 'approved')::numeric * 100 /
      COUNT(jbr.id) FILTER (WHERE jbr.status IN ('approved', 'rejected')),
      1
    )
    ELSE 0
  END as personal_approval_rate,

  -- Dernière demande
  MAX(jbr.created_at) as last_request_date

FROM profiles p
LEFT JOIN companies c ON c.id = p.company_id
LEFT JOIN job_badge_requests jbr ON jbr.recruiter_id = p.id

WHERE p.user_type = 'recruiter'
GROUP BY p.id, p.email, p.full_name, p.account_type, c.name
HAVING COUNT(jbr.id) > 0

ORDER BY total_spent_gnf DESC NULLS LAST;

COMMENT ON VIEW recruiter_badge_performance IS
'Performance et statistiques badges par recruteur - pour analyses business';


-- =====================================================
-- VUE 4: REVENUS BADGES PAR PÉRIODE
-- =====================================================

CREATE OR REPLACE VIEW badge_revenue_analytics AS
SELECT
  DATE_TRUNC('month', created_at) as month,
  badge_type,

  COUNT(*) as requests_count,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_count,

  SUM(price_gnf) FILTER (WHERE payment_status = 'completed') as revenue_gnf,

  AVG(price_gnf) FILTER (WHERE payment_status = 'completed') as avg_price_gnf,

  -- Évolution MoM
  SUM(price_gnf) FILTER (WHERE payment_status = 'completed') -
  LAG(SUM(price_gnf) FILTER (WHERE payment_status = 'completed'))
    OVER (PARTITION BY badge_type ORDER BY DATE_TRUNC('month', created_at))
  as revenue_growth_gnf

FROM job_badge_requests
WHERE created_at >= DATE_TRUNC('month', now() - INTERVAL '6 months')
GROUP BY DATE_TRUNC('month', created_at), badge_type
ORDER BY month DESC, badge_type;

COMMENT ON VIEW badge_revenue_analytics IS
'Analyse revenus badges par mois et type - pour reporting financier';


-- =====================================================
-- VUE 5: BADGES EXPIRANT BIENTÔT
-- =====================================================

CREATE OR REPLACE VIEW badges_expiring_soon AS
SELECT
  jbr.id,
  jbr.badge_type,
  jbr.ends_at,

  -- Temps restant
  EXTRACT(EPOCH FROM (jbr.ends_at - now())) / 3600 as hours_remaining,
  EXTRACT(EPOCH FROM (jbr.ends_at - now())) / 86400 as days_remaining,

  -- Info recruteur
  p.email as recruiter_email,
  p.full_name as recruiter_name,

  -- Info offre
  j.id as job_id,
  j.title as job_title,
  j.is_urgent,
  j.is_featured,

  -- Option renouvellement
  jbr.auto_renew,

  -- Alerte niveau
  CASE
    WHEN EXTRACT(EPOCH FROM (jbr.ends_at - now())) / 3600 < 24 THEN 'URGENT'
    WHEN EXTRACT(EPOCH FROM (jbr.ends_at - now())) / 86400 < 3 THEN 'WARNING'
    ELSE 'INFO'
  END as alert_level

FROM job_badge_requests jbr
JOIN profiles p ON p.id = jbr.recruiter_id
JOIN jobs j ON j.id = jbr.job_id

WHERE jbr.status = 'approved'
  AND jbr.ends_at > now()
  AND jbr.ends_at <= now() + INTERVAL '7 days'

ORDER BY jbr.ends_at ASC;

COMMENT ON VIEW badges_expiring_soon IS
'Badges expirant dans les 7 prochains jours - pour notifications proactives';


-- =====================================================
-- REQUÊTES UTILES POUR MONITORING
-- =====================================================

-- Requête 1: Top 10 recruteurs par dépenses badges
COMMENT ON QUERY IS 'Top 10 recruteurs par dépenses badges';
/*
SELECT
  recruiter_email,
  recruiter_name,
  company_name,
  total_spent_gnf,
  total_requests,
  approved_count,
  personal_approval_rate
FROM recruiter_badge_performance
ORDER BY total_spent_gnf DESC
LIMIT 10;
*/


-- Requête 2: Performance badges par type (dernier mois)
COMMENT ON QUERY IS 'Performance badges par type (dernier mois)';
/*
SELECT
  badge_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'approved') as approved,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'approved')::numeric * 100 /
    NULLIF(COUNT(*), 0),
    1
  ) as approval_rate,
  SUM(price_gnf) FILTER (WHERE payment_status = 'completed') as revenue
FROM job_badge_requests
WHERE created_at >= now() - INTERVAL '30 days'
GROUP BY badge_type;
*/


-- Requête 3: Demandes nécessitant attention urgente (> 24h)
COMMENT ON QUERY IS 'Demandes nécessitant attention urgente (> 24h)';
/*
SELECT
  id,
  badge_type,
  recruiter_email,
  company_name,
  job_title,
  ROUND(waiting_hours::numeric, 1) as hours_waiting,
  priority
FROM badges_pending_validation
WHERE waiting_hours > 24
ORDER BY waiting_hours DESC;
*/


-- Requête 4: Analyse SLA temps de traitement
COMMENT ON QUERY IS 'Analyse SLA temps de traitement';
/*
SELECT
  DATE(created_at) as date,
  COUNT(*) as requests,
  COUNT(*) FILTER (
    WHERE approved_at IS NOT NULL
    AND EXTRACT(EPOCH FROM (approved_at - created_at)) / 3600 <= 24
  ) as within_sla,
  ROUND(
    COUNT(*) FILTER (
      WHERE approved_at IS NOT NULL
      AND EXTRACT(EPOCH FROM (approved_at - created_at)) / 3600 <= 24
    )::numeric * 100 / NULLIF(COUNT(*), 0),
    1
  ) as sla_compliance_rate
FROM job_badge_requests
WHERE created_at >= now() - INTERVAL '7 days'
  AND status IN ('approved', 'rejected')
GROUP BY DATE(created_at)
ORDER BY date DESC;
*/


-- Requête 5: Impact badges sur candidatures (nécessite join avec applications)
COMMENT ON QUERY IS 'Impact badges sur candidatures';
/*
SELECT
  j.id,
  j.title,
  CASE
    WHEN j.is_urgent THEN 'URGENT'
    WHEN j.is_featured THEN 'FEATURED'
    ELSE 'NONE'
  END as badge_status,
  COUNT(DISTINCT a.id) as total_applications,
  COUNT(DISTINCT a.id) FILTER (
    WHERE a.created_at >= jbr.starts_at
  ) as applications_after_badge
FROM jobs j
LEFT JOIN job_badge_requests jbr ON jbr.job_id = j.id AND jbr.status = 'approved'
LEFT JOIN applications a ON a.job_id = j.id
WHERE j.created_at >= now() - INTERVAL '30 days'
GROUP BY j.id, j.title, j.is_urgent, j.is_featured
ORDER BY total_applications DESC;
*/


-- =====================================================
-- FONCTION: Rapport hebdomadaire automatique
-- =====================================================

CREATE OR REPLACE FUNCTION get_weekly_badge_report()
RETURNS TABLE(
  metric text,
  value numeric,
  comparison_last_week numeric,
  change_percent numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH this_week AS (
    SELECT
      COUNT(*) as total_requests,
      COUNT(*) FILTER (WHERE status = 'approved') as approved,
      SUM(price_gnf) FILTER (WHERE payment_status = 'completed') as revenue
    FROM job_badge_requests
    WHERE created_at >= DATE_TRUNC('week', now())
  ),
  last_week AS (
    SELECT
      COUNT(*) as total_requests,
      COUNT(*) FILTER (WHERE status = 'approved') as approved,
      SUM(price_gnf) FILTER (WHERE payment_status = 'completed') as revenue
    FROM job_badge_requests
    WHERE created_at >= DATE_TRUNC('week', now() - INTERVAL '1 week')
      AND created_at < DATE_TRUNC('week', now())
  )
  SELECT 'Total Requests'::text,
         tw.total_requests::numeric,
         lw.total_requests::numeric,
         ROUND((tw.total_requests - lw.total_requests)::numeric * 100 / NULLIF(lw.total_requests, 0), 1)
  FROM this_week tw, last_week lw
  UNION ALL
  SELECT 'Approved',
         tw.approved::numeric,
         lw.approved::numeric,
         ROUND((tw.approved - lw.approved)::numeric * 100 / NULLIF(lw.approved, 0), 1)
  FROM this_week tw, last_week lw
  UNION ALL
  SELECT 'Revenue (GNF)',
         COALESCE(tw.revenue, 0)::numeric,
         COALESCE(lw.revenue, 0)::numeric,
         ROUND((COALESCE(tw.revenue, 0) - COALESCE(lw.revenue, 0))::numeric * 100 / NULLIF(lw.revenue, 0), 1)
  FROM this_week tw, last_week lw;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_weekly_badge_report IS
'Génère un rapport hebdomadaire comparatif pour monitoring badges';


-- =====================================================
-- INDEXES POUR OPTIMISER LES VUES
-- =====================================================

-- Index pour améliorer performance des vues
CREATE INDEX IF NOT EXISTS idx_job_badge_requests_status_ends_at
ON job_badge_requests(status, ends_at)
WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_job_badge_requests_created_at_status
ON job_badge_requests(created_at DESC, status);

CREATE INDEX IF NOT EXISTS idx_job_badge_requests_recruiter_status
ON job_badge_requests(recruiter_id, status);

CREATE INDEX IF NOT EXISTS idx_job_badge_requests_badge_type_status
ON job_badge_requests(badge_type, status);


-- =====================================================
-- EXEMPLE D'UTILISATION
-- =====================================================

/*
-- Dashboard stats
SELECT * FROM badge_dashboard_stats;

-- Demandes en attente
SELECT * FROM badges_pending_validation;

-- Performance recruteurs
SELECT * FROM recruiter_badge_performance LIMIT 20;

-- Revenus mensuels
SELECT * FROM badge_revenue_analytics;

-- Badges expirant bientôt
SELECT * FROM badges_expiring_soon;

-- Rapport hebdomadaire
SELECT * FROM get_weekly_badge_report();
*/
