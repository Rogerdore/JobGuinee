import { supabase } from '../lib/supabase';
import { diffusionConfigService } from './diffusionConfigService';

export interface Campaign {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  company_id?: string;
  entity_type: 'job' | 'training' | 'post';
  entity_id: string;
  campaign_name: string;
  audience_filters: AudienceFilters;
  audience_available: number;
  total_cost: number;
  status: 'draft' | 'pending_payment' | 'payment_approved' | 'in_progress' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'waiting_proof' | 'approved' | 'rejected';
  admin_validated_by?: string;
  admin_validated_at?: string;
  admin_notes?: string;
  total_sent: number;
  total_clicks: number;
  launched_at?: string;
  completed_at?: string;
}

export interface AudienceFilters {
  job_title?: string;
  sector?: string;
  location?: string;
  min_experience?: number;
  max_experience?: number;
  active_within_days?: number;
  min_completion?: number;
}

export interface CampaignChannel {
  id: string;
  campaign_id: string;
  channel_type: 'email' | 'sms' | 'whatsapp';
  quantity: number;
  unit_cost: number;
  total_cost: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  click_count: number;
}

export interface CampaignStats {
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  total_clicks: number;
  click_rate: number;
  delivery_rate: number;
}

class TargetedDiffusionService {
  async getChannelCosts() {
    const channels = await diffusionConfigService.getChannelPricing();
    const costs: Record<string, number> = {};
    channels.forEach(ch => {
      costs[ch.channel_type] = ch.unit_cost;
    });
    return costs;
  }

  async getOrangeMoneyNumber(): Promise<string> {
    const settings = await diffusionConfigService.getSettings();
    return settings?.orange_money_number || '+224 622 00 00 00';
  }

  formatCurrency(amount: number): string {
    return diffusionConfigService.formatCurrency(amount);
  }

  async calculateAvailableAudience(filters: AudienceFilters): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('calculate_available_audience', {
        p_filters: filters,
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error calculating audience:', error);
      throw error;
    }
  }

  async createCampaign(
    entityType: 'job' | 'training' | 'post',
    entityId: string,
    campaignName: string,
    audienceFilters: AudienceFilters,
    channels: Array<{
      channel_type: 'email' | 'sms' | 'whatsapp';
      quantity: number;
    }>
  ): Promise<Campaign> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const channelCosts = await this.getChannelCosts();

      const audienceAvailable = await this.calculateAvailableAudience(audienceFilters);

      for (const channel of channels) {
        if (channel.quantity > audienceAvailable) {
          throw new Error(`Quantité pour ${channel.channel_type} dépasse l'audience disponible (${audienceAvailable})`);
        }
      }

      const totalCost = channels.reduce(
        (sum, channel) => sum + channel.quantity * (channelCosts[channel.channel_type] || 0),
        0
      );

      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          created_by: user.id,
          entity_type: entityType,
          entity_id: entityId,
          campaign_name: campaignName,
          audience_filters: audienceFilters,
          audience_available: audienceAvailable,
          total_cost: totalCost,
          status: 'draft',
          payment_status: 'pending',
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      const channelsData = channels.map((channel) => ({
        campaign_id: campaign.id,
        channel_type: channel.channel_type,
        quantity: channel.quantity,
        unit_cost: channelCosts[channel.channel_type] || 0,
        total_cost: channel.quantity * (channelCosts[channel.channel_type] || 0),
      }));

      const { error: channelsError } = await supabase
        .from('campaign_channels')
        .insert(channelsData);

      if (channelsError) throw channelsError;

      return campaign;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  async getCampaign(campaignId: string): Promise<Campaign | null> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching campaign:', error);
      return null;
    }
  }

  async getCampaignChannels(campaignId: string): Promise<CampaignChannel[]> {
    try {
      const { data, error } = await supabase
        .from('campaign_channels')
        .select('*')
        .eq('campaign_id', campaignId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching campaign channels:', error);
      return [];
    }
  }

  async getUserCampaigns(userId: string): Promise<Campaign[]> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user campaigns:', error);
      return [];
    }
  }

  async getCampaignsByEntity(
    entityType: 'job' | 'training' | 'post',
    entityId: string
  ): Promise<Campaign[]> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching campaigns by entity:', error);
      return [];
    }
  }

  async submitCampaignForPayment(campaignId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({
          status: 'pending_payment',
          payment_status: 'waiting_proof',
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId);

      if (error) throw error;
    } catch (error) {
      console.error('Error submitting campaign for payment:', error);
      throw error;
    }
  }

  async getPendingPaymentCampaigns(): Promise<Campaign[]> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('payment_status', 'waiting_proof')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending payment campaigns:', error);
      return [];
    }
  }

  async validateCampaignPayment(
    campaignId: string,
    adminNotes?: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('campaigns')
        .update({
          payment_status: 'approved',
          status: 'payment_approved',
          admin_validated_by: user.id,
          admin_validated_at: new Date().toISOString(),
          admin_notes: adminNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId);

      if (error) throw error;
    } catch (error) {
      console.error('Error validating campaign payment:', error);
      throw error;
    }
  }

  async rejectCampaignPayment(
    campaignId: string,
    adminNotes: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('campaigns')
        .update({
          payment_status: 'rejected',
          status: 'cancelled',
          admin_validated_by: user.id,
          admin_validated_at: new Date().toISOString(),
          admin_notes: adminNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId);

      if (error) throw error;
    } catch (error) {
      console.error('Error rejecting campaign payment:', error);
      throw error;
    }
  }

  async getCampaignStats(campaignId: string): Promise<CampaignStats> {
    try {
      const channels = await this.getCampaignChannels(campaignId);

      const totalSent = channels.reduce((sum, ch) => sum + ch.sent_count, 0);
      const totalDelivered = channels.reduce((sum, ch) => sum + ch.delivered_count, 0);
      const totalFailed = channels.reduce((sum, ch) => sum + ch.failed_count, 0);
      const totalClicks = channels.reduce((sum, ch) => sum + ch.click_count, 0);

      const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
      const clickRate = totalDelivered > 0 ? (totalClicks / totalDelivered) * 100 : 0;

      return {
        total_sent: totalSent,
        total_delivered: totalDelivered,
        total_failed: totalFailed,
        total_clicks: totalClicks,
        click_rate: Math.round(clickRate * 10) / 10,
        delivery_rate: Math.round(deliveryRate * 10) / 10,
      };
    } catch (error) {
      console.error('Error fetching campaign stats:', error);
      return {
        total_sent: 0,
        total_delivered: 0,
        total_failed: 0,
        total_clicks: 0,
        click_rate: 0,
        delivery_rate: 0,
      };
    }
  }

  async checkEntityApproved(
    entityType: 'job' | 'training' | 'post',
    entityId: string
  ): Promise<boolean> {
    try {
      let tableName = 'jobs';
      if (entityType === 'training') tableName = 'formations';
      if (entityType === 'post') tableName = 'blog_posts';

      const { data, error } = await supabase
        .from(tableName)
        .select('status')
        .eq('id', entityId)
        .single();

      if (error) throw error;
      return data?.status === 'approved';
    } catch (error) {
      console.error('Error checking entity status:', error);
      return false;
    }
  }

  async getEntityDetails(
    entityType: 'job' | 'training' | 'post',
    entityId: string
  ): Promise<any> {
    try {
      let tableName = 'jobs';
      if (entityType === 'training') tableName = 'formations';
      if (entityType === 'post') tableName = 'blog_posts';

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', entityId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching entity details:', error);
      return null;
    }
  }

  async generateShortlink(
    campaignId: string,
    channelType: 'email' | 'sms' | 'whatsapp',
    originalUrl: string
  ): Promise<string> {
    try {
      const { data: shortCode, error: codeError } = await supabase
        .rpc('generate_shortcode');

      if (codeError) throw codeError;

      const { error: insertError } = await supabase
        .from('shortlinks')
        .insert({
          campaign_id: campaignId,
          channel_type: channelType,
          original_url: originalUrl,
          short_code: shortCode,
        });

      if (insertError) throw insertError;

      return `${window.location.origin}/s/${shortCode}`;
    } catch (error) {
      console.error('Error generating shortlink:', error);
      return originalUrl;
    }
  }

  getChannelLabel(channelType: 'email' | 'sms' | 'whatsapp'): string {
    const labels = {
      email: 'Email',
      sms: 'SMS',
      whatsapp: 'WhatsApp',
    };
    return labels[channelType];
  }

  getStatusLabel(status: Campaign['status']): string {
    const labels = {
      draft: 'Brouillon',
      pending_payment: 'En attente de paiement',
      payment_approved: 'Paiement validé',
      in_progress: 'En cours',
      completed: 'Terminée',
      cancelled: 'Annulée',
    };
    return labels[status];
  }

  getPaymentStatusLabel(status: Campaign['payment_status']): string {
    const labels = {
      pending: 'En attente',
      waiting_proof: 'En attente de preuve',
      approved: 'Approuvé',
      rejected: 'Rejeté',
    };
    return labels[status];
  }
}

export const targetedDiffusionService = new TargetedDiffusionService();
