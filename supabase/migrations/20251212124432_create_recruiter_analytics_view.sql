/*
  # Create Recruiter Analytics View for ROI IA

  1. New View
    - `recruiter_ai_analytics_view` - Aggregates AI usage and ROI metrics per company/job

  2. Functionality
    - Credits consumed
    - Candidates analyzed
    - Candidates shortlisted
    - Candidates hired
    - Time saved estimate
    - Cost per hire
*/

-- Create view for recruiter AI analytics
CREATE OR REPLACE VIEW recruiter_ai_analytics_view AS
SELECT
  c.id AS company_id,
  c.name AS company_name,
  j.id AS job_id,
  j.title AS job_title,
  j.created_at AS job_created_at,
  
  -- AI Usage Metrics
  COUNT(DISTINCT a.id) AS total_applications,
  COUNT(DISTINCT CASE WHEN a.ai_score > 0 THEN a.id END) AS ai_analyzed_count,
  COUNT(DISTINCT CASE WHEN a.ai_score >= 75 THEN a.id END) AS ai_strong_matches,
  COUNT(DISTINCT CASE WHEN a.ai_score >= 50 AND a.ai_score < 75 THEN a.id END) AS ai_medium_matches,
  COUNT(DISTINCT CASE WHEN a.ai_score < 50 AND a.ai_score > 0 THEN a.id END) AS ai_weak_matches,
  
  -- Pipeline Metrics
  COUNT(DISTINCT CASE WHEN a.workflow_stage = 'Présélection IA' THEN a.id END) AS ai_preselected,
  COUNT(DISTINCT CASE WHEN a.workflow_stage = 'Acceptées' THEN a.id END) AS hired_count,
  COUNT(DISTINCT CASE WHEN a.workflow_stage = 'Rejetées' THEN a.id END) AS rejected_count,
  
  -- Interview Metrics
  COUNT(DISTINCT i.id) AS interviews_scheduled,
  COUNT(DISTINCT CASE WHEN i.status = 'completed' THEN i.id END) AS interviews_completed,
  
  -- AI Costs (estimated from service usage)
  COALESCE((
    SELECT SUM(scc.credits_cost)
    FROM ai_service_usage_history asuh
    JOIN service_credit_costs scc ON scc.service_code = asuh.service_key
    WHERE asuh.user_id = c.profile_id
    AND asuh.service_key = 'ai_recruiter_matching'
    AND asuh.created_at >= j.created_at
  ), 0) AS total_credits_spent,
  
  -- Average Scores
  ROUND(AVG(CASE WHEN a.ai_score > 0 THEN a.ai_score END)) AS avg_ai_score,
  
  -- Time Estimates (5 min per manual review, AI saves 80%)
  ROUND(COUNT(DISTINCT CASE WHEN a.ai_score > 0 THEN a.id END) * 5 * 0.8) AS estimated_time_saved_minutes,
  
  -- Conversion Rates
  CASE 
    WHEN COUNT(DISTINCT a.id) > 0 THEN
      ROUND(
        (COUNT(DISTINCT CASE WHEN a.workflow_stage = 'Acceptées' THEN a.id END)::numeric / COUNT(DISTINCT a.id)::numeric) * 100,
        2
      )
    ELSE 0
  END AS hire_rate_percent,
  
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN a.ai_score >= 75 THEN a.id END) > 0 THEN
      ROUND(
        (COUNT(DISTINCT CASE WHEN a.ai_score >= 75 AND a.workflow_stage = 'Acceptées' THEN a.id END)::numeric / 
         COUNT(DISTINCT CASE WHEN a.ai_score >= 75 THEN a.id END)::numeric) * 100,
        2
      )
    ELSE 0
  END AS ai_strong_hire_rate_percent

FROM companies c
LEFT JOIN jobs j ON j.company_id = c.id
LEFT JOIN applications a ON a.job_id = j.id
LEFT JOIN interviews i ON i.job_id = j.id
GROUP BY c.id, c.name, c.profile_id, j.id, j.title, j.created_at;