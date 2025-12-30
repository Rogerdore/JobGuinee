import { supabase } from '../lib/supabase';

export interface B2BPipelineEntry {
  id?: string;
  lead_id?: string;
  status: 'new_lead' | 'contacted' | 'qualified' | 'quote_sent' | 'negotiation' | 'won' | 'lost' | 'mission_active' | 'mission_completed' | 'invoiced' | 'paid';
  lead_score?: number;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  estimated_value?: number;
  probability_percentage?: number;
  source_page?: string;
  source_type?: 'seo' | 'direct' | 'referral' | 'paid' | 'other';
  landing_page_id?: string;
  utm_params?: any;
  assigned_to?: string;
  internal_notes?: string;
  qualification_notes?: string;
  next_follow_up_date?: string;
  expected_close_date?: string;
  lost_reason?: string;
  lost_details?: string;
}

export interface B2BQuote {
  id?: string;
  pipeline_id?: string;
  lead_id?: string;
  quote_number?: string;
  quote_title: string;
  quote_description?: string;
  services: Array<{
    name: string;
    description?: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  subtotal: number;
  discount_percentage?: number;
  discount_amount?: number;
  tax_percentage?: number;
  tax_amount?: number;
  total_amount: number;
  currency?: string;
  validity_days?: number;
  payment_terms?: string;
  delivery_timeline?: string;
  terms_and_conditions?: string;
  status?: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'revised';
  created_by?: string;
}

export interface B2BMission {
  id?: string;
  pipeline_id?: string;
  quote_id?: string;
  lead_id?: string;
  mission_number?: string;
  mission_name: string;
  mission_type: 'externalisation_recrutement' | 'cvtheque_access' | 'formation' | 'conseil_rh' | 'pack_enterprise' | 'autre';
  client_company: string;
  client_contact_name: string;
  client_contact_email: string;
  client_contact_phone?: string;
  job_title?: string;
  job_description?: string;
  positions_count?: number;
  status?: 'pending' | 'active' | 'paused' | 'completed' | 'cancelled' | 'archived';
  project_manager_id?: string;
  contract_value?: number;
  start_date?: string;
  expected_end_date?: string;
}

export const b2bPipelineService = {
  // Create pipeline entry from lead
  async createFromLead(leadId: string, sourceData: {
    source_page?: string;
    source_type?: string;
    landing_page_id?: string;
    utm_params?: any;
  }): Promise<{ success: boolean; data?: B2BPipelineEntry; error?: string }> {
    try {
      const pipelineEntry: Partial<B2BPipelineEntry> = {
        lead_id: leadId,
        status: 'new_lead',
        source_page: sourceData.source_page,
        source_type: sourceData.source_type as any || 'seo',
        landing_page_id: sourceData.landing_page_id,
        utm_params: sourceData.utm_params,
        lead_score: 50,
        priority: 'normal',
        probability_percentage: 30
      };

      const { data, error } = await supabase
        .from('b2b_pipeline')
        .insert(pipelineEntry)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating pipeline entry:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all pipeline entries
  async getAll(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('b2b_pipeline')
        .select(`
          *,
          lead:b2b_leads(*),
          landing_page:seo_landing_pages(slug, title),
          assigned:profiles(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Error fetching pipeline:', error);
      return { success: false, error: error.message };
    }
  },

  // Update pipeline status
  async updateStatus(id: string, status: B2BPipelineEntry['status'], notes?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const updates: any = { status };
      const now = new Date().toISOString();

      // Set appropriate timestamp based on status
      switch (status) {
        case 'contacted':
          updates.contacted_at = now;
          break;
        case 'qualified':
          updates.qualified_at = now;
          break;
        case 'quote_sent':
          updates.quote_sent_at = now;
          break;
        case 'won':
          updates.won_at = now;
          break;
        case 'lost':
          updates.lost_at = now;
          break;
      }

      if (notes) {
        updates.internal_notes = notes;
      }

      const { error } = await supabase
        .from('b2b_pipeline')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error updating pipeline status:', error);
      return { success: false, error: error.message };
    }
  },

  // Assign pipeline entry
  async assign(id: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('b2b_pipeline')
        .update({
          assigned_to: userId,
          assigned_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error assigning pipeline:', error);
      return { success: false, error: error.message };
    }
  },

  // Create quote
  async createQuote(quote: B2BQuote): Promise<{ success: boolean; data?: B2BQuote; error?: string }> {
    try {
      // Generate quote number
      const { data: quoteNumber } = await supabase.rpc('generate_quote_number');

      const quoteData = {
        ...quote,
        quote_number: quoteNumber || `DV-${Date.now()}`,
        status: quote.status || 'draft'
      };

      const { data, error } = await supabase
        .from('b2b_quotes')
        .insert(quoteData)
        .select()
        .single();

      if (error) throw error;

      // Update pipeline status if applicable
      if (quote.pipeline_id) {
        await this.updateStatus(quote.pipeline_id, 'quote_sent');
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating quote:', error);
      return { success: false, error: error.message };
    }
  },

  // Get quotes for pipeline
  async getQuotes(pipelineId: string): Promise<{ success: boolean; data?: B2BQuote[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('b2b_quotes')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Error fetching quotes:', error);
      return { success: false, error: error.message };
    }
  },

  // Create mission
  async createMission(mission: B2BMission): Promise<{ success: boolean; data?: B2BMission; error?: string }> {
    try {
      // Generate mission number
      const { data: missionNumber } = await supabase.rpc('generate_mission_number');

      const missionData = {
        ...mission,
        mission_number: missionNumber || `MIS-${Date.now()}`,
        status: mission.status || 'pending'
      };

      const { data, error } = await supabase
        .from('b2b_missions')
        .insert(missionData)
        .select()
        .single();

      if (error) throw error;

      // Update pipeline status if applicable
      if (mission.pipeline_id) {
        await this.updateStatus(mission.pipeline_id, 'mission_active');
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating mission:', error);
      return { success: false, error: error.message };
    }
  },

  // Get missions
  async getMissions(filters?: {
    pipelineId?: string;
    status?: string;
  }): Promise<{ success: boolean; data?: B2BMission[]; error?: string }> {
    try {
      let query = supabase
        .from('b2b_missions')
        .select('*');

      if (filters?.pipelineId) {
        query = query.eq('pipeline_id', filters.pipelineId);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Error fetching missions:', error);
      return { success: false, error: error.message };
    }
  },

  // Get pipeline statistics
  async getStatistics(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data: pipeline, error } = await supabase
        .from('b2b_pipeline')
        .select('status, estimated_value, source_type, created_at');

      if (error) throw error;

      const stats = {
        total_leads: pipeline?.length || 0,
        by_status: {} as Record<string, number>,
        by_source: {} as Record<string, number>,
        total_value: 0,
        avg_value: 0,
        conversion_rate: 0,
        this_month: 0,
        won_count: 0
      };

      pipeline?.forEach(p => {
        stats.by_status[p.status] = (stats.by_status[p.status] || 0) + 1;
        stats.by_source[p.source_type || 'unknown'] = (stats.by_source[p.source_type || 'unknown'] || 0) + 1;

        if (p.estimated_value) {
          stats.total_value += parseFloat(p.estimated_value);
        }

        if (p.status === 'won' || p.status === 'mission_active' || p.status === 'mission_completed') {
          stats.won_count++;
        }

        // Count this month
        const created = new Date(p.created_at);
        const now = new Date();
        if (created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()) {
          stats.this_month++;
        }
      });

      if (stats.total_leads > 0) {
        stats.avg_value = stats.total_value / stats.total_leads;
        stats.conversion_rate = (stats.won_count / stats.total_leads) * 100;
      }

      return { success: true, data: stats };
    } catch (error: any) {
      console.error('Error getting statistics:', error);
      return { success: false, error: error.message };
    }
  }
};
