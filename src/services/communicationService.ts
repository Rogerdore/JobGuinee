import { supabase } from '../lib/supabase';

export interface CommunicationTemplate {
  id: string;
  company_id?: string;
  template_type: 'interview_invitation' | 'rejection' | 'on_hold' | 'selection' | 'reminder' | 'custom';
  template_name: string;
  subject: string;
  body: string;
  is_system: boolean;
  is_active: boolean;
}

export interface SendCommunicationParams {
  applicationId: string;
  recipientId: string;
  templateId?: string;
  subject: string;
  message: string;
  channel?: 'notification' | 'email' | 'sms' | 'whatsapp';
  metadata?: any;
}

export const communicationService = {
  async getTemplates(companyId?: string): Promise<CommunicationTemplate[]> {
    try {
      let query = supabase
        .from('communication_templates')
        .select('*')
        .eq('is_active', true)
        .order('is_system', { ascending: false })
        .order('template_name', { ascending: true });

      if (companyId) {
        query = query.or(`is_system.eq.true,company_id.eq.${companyId}`);
      } else {
        query = query.eq('is_system', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching templates:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTemplates:', error);
      return [];
    }
  },

  async getTemplate(templateId: string): Promise<CommunicationTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('communication_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) {
        console.error('Error fetching template:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getTemplate:', error);
      return null;
    }
  },

  async sendCommunication(params: SendCommunicationParams): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Non authentifié' };
      }

      const { data: commLog, error: logError } = await supabase
        .from('communications_log')
        .insert({
          application_id: params.applicationId,
          sender_id: user.id,
          recipient_id: params.recipientId,
          communication_type: params.templateId || 'custom',
          channel: params.channel || 'notification',
          subject: params.subject,
          message: params.message,
          status: 'sent',
          metadata: params.metadata || {}
        })
        .select()
        .single();

      if (logError) {
        console.error('Error logging communication:', logError);
        return { success: false, error: logError.message };
      }

      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: params.recipientId,
          type: 'message',
          title: params.subject,
          message: params.message,
          link: '/candidate-dashboard'
        });

      if (notifError) {
        console.error('Error creating notification:', notifError);
      }

      await supabase
        .from('application_activity_log')
        .insert({
          application_id: params.applicationId,
          actor_id: user.id,
          action_type: 'communication_sent',
          metadata: {
            communication_id: commLog.id,
            subject: params.subject,
            channel: params.channel || 'notification'
          }
        });

      return { success: true };
    } catch (error: any) {
      console.error('Error in sendCommunication:', error);
      return { success: false, error: error.message };
    }
  },

  async sendBulkCommunication(
    applications: Array<{ id: string; candidate_id: string }>,
    subject: string,
    message: string,
    channel: 'notification' | 'email' = 'notification'
  ): Promise<{ success: boolean; sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const app of applications) {
      const result = await this.sendCommunication({
        applicationId: app.id,
        recipientId: app.candidate_id,
        subject,
        message,
        channel
      });

      if (result.success) {
        sent++;
      } else {
        failed++;
      }
    }

    return { success: sent > 0, sent, failed };
  },

  processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, value || '');
    });

    const ifVideoRegex = /{{#if_video}}(.*?){{\/if_video}}/gs;
    if (variables.interview_type === 'visio') {
      processed = processed.replace(ifVideoRegex, '$1');
    } else {
      processed = processed.replace(ifVideoRegex, '');
    }

    const ifPhysicalRegex = /{{#if_physical}}(.*?){{\/if_physical}}/gs;
    if (variables.interview_type === 'presentiel') {
      processed = processed.replace(ifPhysicalRegex, '$1');
    } else {
      processed = processed.replace(ifPhysicalRegex, '');
    }

    return processed;
  },

  async getCommunicationsLog(applicationId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('communications_log')
        .select(`
          *,
          sender:profiles!communications_log_sender_id_fkey(full_name),
          recipient:profiles!communications_log_recipient_id_fkey(full_name)
        `)
        .eq('application_id', applicationId)
        .order('sent_at', { ascending: false });

      if (error) {
        console.error('Error fetching communications log:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCommunicationsLog:', error);
      return [];
    }
  },

  getChannelLabel(channel: string): string {
    const labels: Record<string, string> = {
      notification: 'Notification interne',
      email: 'Email',
      sms: 'SMS',
      whatsapp: 'WhatsApp'
    };
    return labels[channel] || channel;
  },

  getTemplateTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      interview_invitation: 'Invitation entretien',
      rejection: 'Rejet candidature',
      on_hold: 'Mise en attente',
      selection: 'Sélection finale',
      reminder: 'Rappel',
      custom: 'Personnalisé'
    };
    return labels[type] || type;
  }
};
