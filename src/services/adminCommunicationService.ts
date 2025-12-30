import { supabase } from '../lib/supabase';

export interface CommunicationFilters {
  user_types?: string[];
  account_status?: string[];
  min_completion?: number;
  country?: string;
  region?: string;
  city?: string;
  date_from?: string;
  date_to?: string;
  language?: string;
}

export interface ChannelContent {
  enabled: boolean;
  subject?: string;
  content: string;
  template_id?: string;
}

export interface ChannelsConfig {
  email?: ChannelContent;
  sms?: ChannelContent;
  whatsapp?: ChannelContent;
  notification?: ChannelContent;
}

export interface AdminCommunication {
  id: string;
  title: string;
  type: 'system_info' | 'important_notice' | 'promotion' | 'maintenance_alert' | 'institutional';
  description?: string;
  filters_json: CommunicationFilters;
  estimated_audience_count: number;
  channels_json: ChannelsConfig;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'canceled' | 'failed';
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  total_recipients: number;
  total_sent: number;
  total_failed: number;
  total_excluded: number;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  description?: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'notification';
  subject?: string;
  content: string;
  variables: string[];
  is_active: boolean;
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface CommunicationMessage {
  id: string;
  communication_id: string;
  user_id: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'notification';
  content_rendered: string;
  subject?: string;
  status: 'pending' | 'sent' | 'failed' | 'excluded';
  exclusion_reason?: string;
  retry_count: number;
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

export interface CommunicationLog {
  id: string;
  communication_id?: string;
  action: 'create' | 'update' | 'send' | 'cancel' | 'schedule' | 'complete' | 'fail';
  details: any;
  admin_id?: string;
  admin_email?: string;
  created_at: string;
}

export const adminCommunicationService = {
  async getCommunications(filters?: { status?: string; limit?: number }) {
    let query = supabase
      .from('admin_communications')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as AdminCommunication[];
  },

  async getCommunicationById(id: string) {
    const { data, error } = await supabase
      .from('admin_communications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as AdminCommunication;
  },

  async createCommunication(communication: Partial<AdminCommunication>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('admin_communications')
      .insert({
        ...communication,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as AdminCommunication;
  },

  async updateCommunication(id: string, updates: Partial<AdminCommunication>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('admin_communications')
      .update({
        ...updates,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AdminCommunication;
  },

  async deleteCommunication(id: string) {
    const { error } = await supabase
      .from('admin_communications')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async calculateAudienceCount(filters: CommunicationFilters): Promise<number> {
    const { data, error } = await supabase
      .rpc('calculate_communication_audience', {
        p_filters: filters
      });

    if (error) throw error;
    return data || 0;
  },

  async getTargetedUsers(filters: CommunicationFilters, limit?: number) {
    let query = supabase
      .from('profiles')
      .select('id, full_name, email, user_type, profile_completion_percentage');

    if (filters.user_types && filters.user_types.length > 0) {
      query = query.in('user_type', filters.user_types);
    }

    if (filters.min_completion) {
      query = query.gte('profile_completion_percentage', filters.min_completion);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async sendCommunication(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('admin_communications')
      .update({
        status: 'sending',
        started_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AdminCommunication;
  },

  async scheduleCommunication(id: string, scheduledAt: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('admin_communications')
      .update({
        status: 'scheduled',
        scheduled_at: scheduledAt,
        updated_by: user.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AdminCommunication;
  },

  async cancelCommunication(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('admin_communications')
      .update({
        status: 'canceled',
        updated_by: user.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AdminCommunication;
  },

  async getMessages(communicationId: string, filters?: { status?: string; channel?: string }) {
    let query = supabase
      .from('admin_communication_messages')
      .select('*')
      .eq('communication_id', communicationId);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.channel) {
      query = query.eq('channel', filters.channel);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as CommunicationMessage[];
  },

  async getMessageStats(communicationId: string) {
    const { data, error } = await supabase
      .from('admin_communication_messages')
      .select('channel, status')
      .eq('communication_id', communicationId);

    if (error) throw error;

    const stats = {
      total: data.length,
      by_channel: {} as Record<string, number>,
      by_status: {} as Record<string, number>,
    };

    data.forEach((msg) => {
      stats.by_channel[msg.channel] = (stats.by_channel[msg.channel] || 0) + 1;
      stats.by_status[msg.status] = (stats.by_status[msg.status] || 0) + 1;
    });

    return stats;
  },

  async getTemplates(channel?: string) {
    let query = supabase
      .from('admin_communication_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (channel) {
      query = query.eq('channel', channel);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as CommunicationTemplate[];
  },

  async getAllTemplates() {
    const { data, error } = await supabase
      .from('admin_communication_templates')
      .select('*')
      .order('channel', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data as CommunicationTemplate[];
  },

  async getTemplateById(id: string) {
    const { data, error } = await supabase
      .from('admin_communication_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as CommunicationTemplate;
  },

  async createTemplate(template: Partial<CommunicationTemplate>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('admin_communication_templates')
      .insert({
        ...template,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as CommunicationTemplate;
  },

  async updateTemplate(id: string, updates: Partial<CommunicationTemplate>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('admin_communication_templates')
      .update({
        ...updates,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as CommunicationTemplate;
  },

  async deleteTemplate(id: string) {
    const { error } = await supabase
      .from('admin_communication_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getLogs(filters?: { communication_id?: string; admin_id?: string; limit?: number }) {
    let query = supabase
      .from('admin_communication_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.communication_id) {
      query = query.eq('communication_id', filters.communication_id);
    }

    if (filters?.admin_id) {
      query = query.eq('admin_id', filters.admin_id);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as CommunicationLog[];
  },

  async getStats() {
    const { data: communications, error } = await supabase
      .from('admin_communications')
      .select('status, type, created_at');

    if (error) throw error;

    const stats = {
      total: communications.length,
      by_status: {} as Record<string, number>,
      by_type: {} as Record<string, number>,
      last_30_days: 0,
    };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    communications.forEach((comm) => {
      stats.by_status[comm.status] = (stats.by_status[comm.status] || 0) + 1;
      stats.by_type[comm.type] = (stats.by_type[comm.type] || 0) + 1;

      if (new Date(comm.created_at) > thirtyDaysAgo) {
        stats.last_30_days++;
      }
    });

    return stats;
  },

  renderTemplate(content: string, variables: Record<string, string>): string {
    let rendered = content;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, value);
    });
    return rendered;
  },

  validateContent(content: string, channel: 'email' | 'sms' | 'whatsapp' | 'notification'): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!content || content.trim().length === 0) {
      errors.push('Le contenu ne peut pas être vide');
    }

    if (channel === 'sms') {
      if (content.length > 160) {
        errors.push('Le SMS ne peut pas dépasser 160 caractères');
      }
    }

    if (channel === 'email') {
      if (content.length < 10) {
        errors.push('L\'email doit contenir au moins 10 caractères');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};
