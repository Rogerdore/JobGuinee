/*
  # Add Essential Foreign Key Indexes
  
  1. Performance Improvements
    - Add indexes on foreign key columns that are missing them
    - Improves JOIN performance and foreign key constraint checks
    - Speeds up queries with WHERE clauses on these columns
  
  2. Tables Affected (Verified to exist)
    - email_queue, email_logs
    - social_share_analytics
    - B2B system tables
    - CV sections
    - External applications
    - Enterprise tracking
    - Daily digest logs
    - SEO system tables
  
  3. Naming Convention
    - Format: idx_<table>_<column>
    - All indexes use IF NOT EXISTS
*/

-- Email system indexes
CREATE INDEX IF NOT EXISTS idx_email_queue_email_log_id ON email_queue(email_log_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_job_id ON email_queue(job_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_template_id ON email_queue(template_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_user_id ON email_queue(user_id);

CREATE INDEX IF NOT EXISTS idx_email_logs_application_id ON email_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_company_id ON email_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_job_id ON email_logs(job_id);

-- Social sharing system
CREATE INDEX IF NOT EXISTS idx_social_share_analytics_user_id ON social_share_analytics(user_id);

-- B2B system (only verified existing tables)
CREATE INDEX IF NOT EXISTS idx_b2b_contracts_pipeline_id ON b2b_contracts(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_b2b_missions_pipeline_id ON b2b_missions(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_b2b_missions_lead_id ON b2b_missions(lead_id);
CREATE INDEX IF NOT EXISTS idx_b2b_missions_quote_id ON b2b_missions(quote_id);
CREATE INDEX IF NOT EXISTS idx_b2b_missions_project_manager_id ON b2b_missions(project_manager_id);

-- CV system
CREATE INDEX IF NOT EXISTS idx_cv_sections_cv_version_id ON cv_sections(cv_version_id);

-- External applications
CREATE INDEX IF NOT EXISTS idx_external_applications_cv_document_id ON external_applications(cv_document_id);
CREATE INDEX IF NOT EXISTS idx_external_applications_cover_letter_document_id ON external_applications(cover_letter_document_id);
CREATE INDEX IF NOT EXISTS idx_external_applications_email_template_id ON external_applications(email_template_id);

CREATE INDEX IF NOT EXISTS idx_external_application_documents_external_application_id ON external_application_documents(external_application_id);
CREATE INDEX IF NOT EXISTS idx_external_application_documents_document_id ON external_application_documents(document_id);

CREATE INDEX IF NOT EXISTS idx_external_application_relances_external_application_id ON external_application_relances(external_application_id);

CREATE INDEX IF NOT EXISTS idx_external_application_supplementary_docs_external_application_id ON external_application_supplementary_docs(external_application_id);
CREATE INDEX IF NOT EXISTS idx_external_application_supplementary_docs_candidate_id ON external_application_supplementary_docs(candidate_id);

-- Daily digest
CREATE INDEX IF NOT EXISTS idx_daily_digest_log_email_log_id ON daily_digest_log(email_log_id);
CREATE INDEX IF NOT EXISTS idx_daily_digest_log_recruiter_id ON daily_digest_log(recruiter_id);

-- Enterprise subscriptions
CREATE INDEX IF NOT EXISTS idx_enterprise_subscriptions_approved_by ON enterprise_subscriptions(approved_by);
CREATE INDEX IF NOT EXISTS idx_enterprise_subscriptions_company_id ON enterprise_subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_subscriptions_profile_id ON enterprise_subscriptions(profile_id);

CREATE INDEX IF NOT EXISTS idx_enterprise_usage_tracking_subscription_id ON enterprise_usage_tracking(subscription_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_usage_tracking_company_id ON enterprise_usage_tracking(company_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_usage_tracking_job_id ON enterprise_usage_tracking(job_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_usage_tracking_application_id ON enterprise_usage_tracking(application_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_usage_tracking_candidate_profile_id ON enterprise_usage_tracking(candidate_profile_id);

-- SEO system
CREATE INDEX IF NOT EXISTS idx_seo_keywords_i18n_seo_keyword_id ON seo_keywords_i18n(seo_keyword_id);
CREATE INDEX IF NOT EXISTS idx_seo_page_meta_i18n_seo_page_meta_id ON seo_page_meta_i18n(seo_page_meta_id);
CREATE INDEX IF NOT EXISTS idx_seo_keyword_rankings_keyword_id ON seo_keyword_rankings(keyword_id);
CREATE INDEX IF NOT EXISTS idx_seo_generation_logs_triggered_by ON seo_generation_logs(triggered_by);
CREATE INDEX IF NOT EXISTS idx_seo_link_opportunities_assigned_to ON seo_link_opportunities(assigned_to);
CREATE INDEX IF NOT EXISTS idx_seo_link_opportunities_target_domain ON seo_link_opportunities(target_domain);
CREATE INDEX IF NOT EXISTS idx_seo_content_ideas_assigned_to ON seo_content_ideas(assigned_to);
CREATE INDEX IF NOT EXISTS idx_seo_optimization_suggestions_applied_by ON seo_optimization_suggestions(applied_by);
CREATE INDEX IF NOT EXISTS idx_seo_page_scores_audited_by ON seo_page_scores(audited_by);
CREATE INDEX IF NOT EXISTS idx_seo_conversion_tracking_user_id ON seo_conversion_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_seo_conversion_tracking_lead_id ON seo_conversion_tracking(lead_id);
CREATE INDEX IF NOT EXISTS idx_seo_conversion_tracking_pipeline_id ON seo_conversion_tracking(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_seo_conversion_tracking_landing_page_id ON seo_conversion_tracking(landing_page_id);
