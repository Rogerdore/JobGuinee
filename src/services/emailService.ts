import { supabase } from '../lib/supabase';

export interface SendEmailParams {
  template_key?: string;
  to_email: string;
  to_name?: string;
  subject?: string;
  html_body?: string;
  text_body?: string;
  variables?: Record<string, string>;
  user_id?: string;
  job_id?: string;
  priority?: number;
}

export interface QueueEmailParams {
  template_key: string;
  to_email: string;
  to_name?: string;
  variables?: Record<string, string>;
  priority?: number;
  scheduled_for?: string;
  user_id?: string;
  job_id?: string;
}

class EmailService {
  private supabaseUrl: string;
  private supabaseAnonKey: string;

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    this.supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      console.error('Supabase configuration missing');
    }
  }

  async sendEmail(params: SendEmailParams): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseAnonKey}`,
        },
        body: JSON.stringify(params),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to send email',
        };
      }

      return {
        success: true,
        message: result.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }

  async queueEmail(params: QueueEmailParams): Promise<{ success: boolean; queue_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('queue_email', {
        p_template_key: params.template_key,
        p_to_email: params.to_email,
        p_to_name: params.to_name,
        p_variables: params.variables || {},
        p_priority: params.priority || 5,
        p_scheduled_for: params.scheduled_for || new Date().toISOString(),
        p_user_id: params.user_id,
        p_job_id: params.job_id,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: data.success,
        queue_id: data.queue_id,
        error: data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendWelcomeEmail(candidateName: string, candidateEmail: string): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      template_key: 'welcome_candidate',
      to_email: candidateEmail,
      to_name: candidateName,
      variables: {
        candidate_name: candidateName,
        candidate_email: candidateEmail,
        app_url: window.location.origin,
      },
    });
  }

  async sendRecruiterWelcomeEmail(
    recruiterName: string,
    recruiterEmail: string,
    companyName: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      template_key: 'welcome_recruiter',
      to_email: recruiterEmail,
      to_name: recruiterName,
      variables: {
        recruiter_name: recruiterName,
        recruiter_email: recruiterEmail,
        company_name: companyName,
        app_url: window.location.origin,
      },
    });
  }

  async sendApplicationConfirmation(
    candidateName: string,
    candidateEmail: string,
    jobTitle: string,
    companyName: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      template_key: 'application_confirmation',
      to_email: candidateEmail,
      to_name: candidateName,
      variables: {
        candidate_name: candidateName,
        job_title: jobTitle,
        company_name: companyName,
        app_url: window.location.origin,
      },
    });
  }

  async sendNewApplicationAlert(
    recruiterEmail: string,
    jobTitle: string,
    candidateName: string,
    applicationId: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      template_key: 'new_application_alert',
      to_email: recruiterEmail,
      variables: {
        job_title: jobTitle,
        candidate_name: candidateName,
        application_id: applicationId,
        app_url: window.location.origin,
      },
    });
  }

  async sendJobAlert(
    candidateName: string,
    candidateEmail: string,
    jobTitle: string,
    companyName: string,
    jobLocation: string,
    jobId: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      template_key: 'job_alert_match',
      to_email: candidateEmail,
      to_name: candidateName,
      variables: {
        candidate_name: candidateName,
        job_title: jobTitle,
        company_name: companyName,
        job_location: jobLocation,
        job_id: jobId,
        app_url: window.location.origin,
      },
    });
  }

  async getEmailStats(days: number = 30): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_email_stats', {
        p_days: days,
      });

      if (error) {
        console.error('Error getting email stats:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting email stats:', error);
      return null;
    }
  }

  async getEmailLogs(limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting email logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting email logs:', error);
      return [];
    }
  }

  async getEmailTemplates(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) {
        console.error('Error getting email templates:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting email templates:', error);
      return [];
    }
  }
}

export const emailService = new EmailService();
export default emailService;
