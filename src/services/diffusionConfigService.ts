import { supabase } from '../lib/supabase';

export interface DiffusionSettings {
  id: string;
  module_enabled: boolean;
  jobs_enabled: boolean;
  trainings_enabled: boolean;
  posts_enabled: boolean;
  test_mode: boolean;
  admin_info_message?: string;
  min_profile_completion: number;
  max_inactive_days: number;
  allow_multi_channels: boolean;
  max_recipients_per_campaign: number;
  max_sends_per_24h: number;
  max_sends_per_7d: number;
  orange_money_number: string;
  orange_money_recipient_name: string;
  payment_instructions?: string;
  require_payment_validation: boolean;
  whatsapp_admin_number?: string;
  whatsapp_api_enabled: boolean;
  whatsapp_manual_mode: boolean;
  shortlink_domain: string;
  enable_click_tracking: boolean;
  show_b2b_marketing: boolean;
  b2b_cta_text: string;
  default_job_image_url?: string;
  default_training_image_url?: string;
  default_post_image_url?: string;
  default_logo_url?: string;
  default_cta_job: string;
  default_cta_training: string;
  default_cta_post: string;
}

export interface ChannelPricing {
  id: string;
  channel_type: 'email' | 'sms' | 'whatsapp';
  enabled: boolean;
  unit_cost: number;
  currency: string;
  min_quantity: number;
  max_quantity: number;
  display_name: string;
  description?: string;
  icon_name?: string;
  display_order: number;
}

export interface MessageTemplate {
  id: string;
  template_type: 'email' | 'sms' | 'whatsapp' | 'admin_whatsapp';
  template_name: string;
  description?: string;
  subject?: string;
  body: string;
  available_variables: string[];
  is_active: boolean;
  is_default: boolean;
  language: string;
}

export interface AuditLog {
  id: string;
  created_at: string;
  action_type: string;
  entity_type?: string;
  entity_id?: string;
  description: string;
  old_value?: any;
  new_value?: any;
  performed_by: string;
}

class DiffusionConfigService {
  private settingsCache: DiffusionSettings | null = null;
  private pricingCache: ChannelPricing[] | null = null;
  private cacheExpiry: number = 5 * 60 * 1000;
  private lastCacheTime: number = 0;

  async getSettings(forceRefresh = false): Promise<DiffusionSettings | null> {
    const now = Date.now();

    if (!forceRefresh && this.settingsCache && (now - this.lastCacheTime < this.cacheExpiry)) {
      return this.settingsCache;
    }

    try {
      const { data, error } = await supabase
        .from('diffusion_settings')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single();

      if (error) throw error;

      this.settingsCache = data;
      this.lastCacheTime = now;
      return data;
    } catch (error) {
      console.error('Error fetching diffusion settings:', error);
      return null;
    }
  }

  async updateSettings(settings: Partial<DiffusionSettings>): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const oldSettings = await this.getSettings();

      const { error } = await supabase
        .from('diffusion_settings')
        .update({
          ...settings,
          last_updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', '00000000-0000-0000-0000-000000000001');

      if (error) throw error;

      await this.logAction(
        'settings_updated',
        'Paramètres de diffusion mis à jour',
        'diffusion_settings',
        '00000000-0000-0000-0000-000000000001',
        oldSettings,
        settings
      );

      this.settingsCache = null;
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  }

  async getChannelPricing(forceRefresh = false): Promise<ChannelPricing[]> {
    const now = Date.now();

    if (!forceRefresh && this.pricingCache && (now - this.lastCacheTime < this.cacheExpiry)) {
      return this.pricingCache;
    }

    try {
      const { data, error } = await supabase
        .from('channel_pricing')
        .select('*')
        .order('display_order');

      if (error) throw error;

      this.pricingCache = data || [];
      this.lastCacheTime = now;
      return data || [];
    } catch (error) {
      console.error('Error fetching channel pricing:', error);
      return [];
    }
  }

  async updateChannelPricing(
    channelType: string,
    updates: Partial<ChannelPricing>
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('channel_pricing')
        .update({
          ...updates,
          last_updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('channel_type', channelType);

      if (error) throw error;

      await this.logAction(
        'pricing_updated',
        `Tarification ${channelType} mise à jour`,
        'channel_pricing',
        undefined,
        undefined,
        updates
      );

      this.pricingCache = null;
      return true;
    } catch (error) {
      console.error('Error updating channel pricing:', error);
      return false;
    }
  }

  async getMessageTemplates(
    templateType?: string,
    activeOnly = false
  ): Promise<MessageTemplate[]> {
    try {
      let query = supabase
        .from('message_templates')
        .select('*')
        .order('template_name');

      if (templateType) {
        query = query.eq('template_type', templateType);
      }

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching message templates:', error);
      return [];
    }
  }

  async getDefaultTemplate(templateType: string): Promise<MessageTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('template_type', templateType)
        .eq('is_default', true)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching default template:', error);
      return null;
    }
  }

  async createTemplate(template: Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('message_templates')
        .insert({
          ...template,
          created_by: user.id,
          last_updated_by: user.id,
        });

      if (error) throw error;

      await this.logAction(
        'template_created',
        `Template ${template.template_name} créé`,
        'message_templates'
      );

      return true;
    } catch (error) {
      console.error('Error creating template:', error);
      return false;
    }
  }

  async updateTemplate(
    templateId: string,
    updates: Partial<MessageTemplate>
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('message_templates')
        .update({
          ...updates,
          last_updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', templateId);

      if (error) throw error;

      await this.logAction(
        'template_updated',
        'Template mis à jour',
        'message_templates',
        templateId
      );

      return true;
    } catch (error) {
      console.error('Error updating template:', error);
      return false;
    }
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      await this.logAction(
        'template_deleted',
        'Template supprimé',
        'message_templates',
        templateId
      );

      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      return false;
    }
  }

  async getAuditLogs(
    actionType?: string,
    limit = 50,
    offset = 0
  ): Promise<AuditLog[]> {
    try {
      let query = supabase
        .from('diffusion_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (actionType) {
        query = query.eq('action_type', actionType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  }

  async logAction(
    actionType: string,
    description: string,
    entityType?: string,
    entityId?: string,
    oldValue?: any,
    newValue?: any
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('log_diffusion_action', {
        p_action_type: actionType,
        p_description: description,
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_old_value: oldValue ? JSON.stringify(oldValue) : null,
        p_new_value: newValue ? JSON.stringify(newValue) : null,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging action:', error);
    }
  }

  async isModuleEnabled(entityType: 'job' | 'training' | 'post'): Promise<boolean> {
    const settings = await this.getSettings();
    if (!settings || !settings.module_enabled) return false;

    switch (entityType) {
      case 'job':
        return settings.jobs_enabled;
      case 'training':
        return settings.trainings_enabled;
      case 'post':
        return settings.posts_enabled;
      default:
        return false;
    }
  }

  async getActiveChannels(): Promise<ChannelPricing[]> {
    const allChannels = await this.getChannelPricing();
    return allChannels.filter(ch => ch.enabled);
  }

  clearCache(): void {
    this.settingsCache = null;
    this.pricingCache = null;
    this.lastCacheTime = 0;
  }

  formatCurrency(amount: number, currency = 'GNF'): string {
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
}

export const diffusionConfigService = new DiffusionConfigService();
