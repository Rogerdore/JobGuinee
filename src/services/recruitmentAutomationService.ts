import { supabase } from '../lib/supabase';

export interface AutomationRule {
  id: string;
  company_id: string;
  rule_type: 'auto_candidate_followup' | 'auto_interview_reminders' | 'auto_job_closure_notifications';
  is_enabled: boolean;
  configuration: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AutomationExecutionLog {
  id: string;
  rule_id?: string;
  company_id: string;
  target_type: string;
  target_id: string;
  execution_status: 'success' | 'failed' | 'skipped';
  execution_details: Record<string, any>;
  executed_at: string;
}

export interface InterviewReminder {
  id: string;
  interview_id: string;
  reminder_type: 'j_moins_1' | 'deux_heures_avant';
  scheduled_at: string;
  sent_at?: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  error_message?: string;
  created_at: string;
}

export const recruitmentAutomationService = {
  async getAutomationRules(companyId: string): Promise<AutomationRule[]> {
    try {
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('company_id', companyId)
        .order('rule_type');

      if (error) {
        console.error('Error fetching automation rules:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAutomationRules:', error);
      return [];
    }
  },

  async updateAutomationRule(
    ruleId: string,
    updates: { is_enabled?: boolean; configuration?: Record<string, any> }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('automation_rules')
        .update(updates)
        .eq('id', ruleId);

      if (error) {
        console.error('Error updating automation rule:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in updateAutomationRule:', error);
      return { success: false, error: error.message };
    }
  },

  async getExecutionLogs(companyId: string, limit: number = 100): Promise<AutomationExecutionLog[]> {
    try {
      const { data, error } = await supabase
        .from('automation_execution_log')
        .select('*')
        .eq('company_id', companyId)
        .order('executed_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching execution logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getExecutionLogs:', error);
      return [];
    }
  },

  async getInterviewReminders(interviewId: string): Promise<InterviewReminder[]> {
    try {
      const { data, error } = await supabase
        .from('interview_reminders')
        .select('*')
        .eq('interview_id', interviewId)
        .order('scheduled_at');

      if (error) {
        console.error('Error fetching interview reminders:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getInterviewReminders:', error);
      return [];
    }
  },

  async getPendingReminders(): Promise<InterviewReminder[]> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('interview_reminders')
        .select(`
          *,
          interview:interviews(
            id,
            application_id,
            candidate_id,
            recruiter_id,
            job_id,
            scheduled_at,
            interview_type,
            location_or_link
          )
        `)
        .eq('status', 'pending')
        .lte('scheduled_at', now)
        .limit(100);

      if (error) {
        console.error('Error fetching pending reminders:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPendingReminders:', error);
      return [];
    }
  },

  async markReminderSent(reminderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('interview_reminders')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', reminderId);

      if (error) {
        console.error('Error marking reminder sent:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in markReminderSent:', error);
      return { success: false, error: error.message };
    }
  },

  async markReminderFailed(reminderId: string, errorMessage: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('interview_reminders')
        .update({
          status: 'failed',
          error_message: errorMessage
        })
        .eq('id', reminderId);

      if (error) {
        console.error('Error marking reminder failed:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in markReminderFailed:', error);
      return { success: false, error: error.message };
    }
  },

  async logExecution(
    companyId: string,
    targetType: string,
    targetId: string,
    status: 'success' | 'failed' | 'skipped',
    details: Record<string, any>,
    ruleId?: string
  ): Promise<void> {
    try {
      await supabase
        .from('automation_execution_log')
        .insert({
          rule_id: ruleId,
          company_id: companyId,
          target_type: targetType,
          target_id: targetId,
          execution_status: status,
          execution_details: details
        });
    } catch (error) {
      console.error('Error logging execution:', error);
    }
  },

  async processJobClosure(jobId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('company_id, title')
        .eq('id', jobId)
        .single();

      if (jobError || !job) {
        return { success: false, error: 'Offre non trouvée' };
      }

      const { data: rule } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('company_id', job.company_id)
        .eq('rule_type', 'auto_job_closure_notifications')
        .eq('is_enabled', true)
        .maybeSingle();

      if (!rule) {
        return { success: true };
      }

      const config = rule.configuration as any;

      if (config.notify_pending_candidates) {
        const { data: pendingApplications } = await supabase
          .from('applications')
          .select('id, candidate_id')
          .eq('job_id', jobId)
          .not('workflow_stage', 'in', '(rejected,accepted,withdrawn)');

        if (pendingApplications && pendingApplications.length > 0) {
          const notifications = pendingApplications.map(app => ({
            user_id: app.candidate_id,
            type: 'info',
            title: 'Offre clôturée',
            message: `L'offre "${job.title}" a été clôturée. Merci de votre intérêt.`,
            link: '/candidate-dashboard'
          }));

          await supabase
            .from('notifications')
            .insert(notifications);
        }

        if (config.auto_archive_applications && pendingApplications && pendingApplications.length > 0) {
          await supabase
            .from('applications')
            .update({ workflow_stage: 'archived' })
            .eq('job_id', jobId)
            .not('workflow_stage', 'in', '(rejected,accepted,withdrawn)');
        }

        await this.logExecution(
          job.company_id,
          'job',
          jobId,
          'success',
          {
            notified_candidates: pendingApplications?.length || 0,
            archived: config.auto_archive_applications
          },
          rule.id
        );
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error processing job closure:', error);
      return { success: false, error: error.message };
    }
  },

  getRuleTypeLabel(ruleType: string): string {
    const labels: Record<string, string> = {
      auto_candidate_followup: 'Relances automatiques',
      auto_interview_reminders: 'Rappels d\'entretien',
      auto_job_closure_notifications: 'Notifications de clôture'
    };
    return labels[ruleType] || ruleType;
  },

  getReminderTypeLabel(reminderType: string): string {
    const labels: Record<string, string> = {
      j_moins_1: 'Rappel J-1',
      deux_heures_avant: 'Rappel 2h avant'
    };
    return labels[reminderType] || reminderType;
  }
};
