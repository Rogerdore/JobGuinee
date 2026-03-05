/*
  # Disable RLS for email system tables

  Purpose: Allow service role to manage email queue and logs
  These are internal system tables that should not have RLS restrictions
*/

ALTER TABLE email_queue DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_provider_config DISABLE ROW LEVEL SECURITY;
