import { supabase } from '../lib/supabase';

export interface B2BLead {
  id?: string;
  organization_name: string;
  organization_type: 'entreprise' | 'institution' | 'ong' | 'cabinet_rh' | 'centre_formation' | 'formateur' | 'autre';
  sector: string;
  primary_need: 'externalisation_recrutement' | 'ats_digital' | 'cvtheque' | 'formation' | 'conseil_rh' | 'pack_enterprise' | 'autre';
  urgency: 'immediate' | 'urgent' | 'normale' | 'planifie';
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  message?: string;
  status?: 'nouveau' | 'contacte' | 'qualifie' | 'converti' | 'perdu';
  assigned_to?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface B2BPageConfig {
  id?: string;
  section_name: string;
  is_active: boolean;
  title?: string;
  subtitle?: string;
  content?: any;
  cta_text?: string;
  cta_link?: string;
  display_order: number;
  seo_config?: any;
  updated_at?: string;
}

export const b2bLeadsService = {
  async createLead(lead: Omit<B2BLead, 'id' | 'status' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string; data?: B2BLead }> {
    try {
      const { data, error } = await supabase
        .from('b2b_leads')
        .insert({
          organization_name: lead.organization_name,
          organization_type: lead.organization_type,
          sector: lead.sector,
          primary_need: lead.primary_need,
          urgency: lead.urgency,
          contact_name: lead.contact_name,
          contact_email: lead.contact_email,
          contact_phone: lead.contact_phone,
          message: lead.message,
          status: 'nouveau'
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating B2B lead:', error);
      return { success: false, error: error.message };
    }
  },

  async getAllLeads(): Promise<{ success: boolean; data?: B2BLead[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('b2b_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Error fetching B2B leads:', error);
      return { success: false, error: error.message };
    }
  },

  async updateLeadStatus(
    leadId: string,
    status: B2BLead['status'],
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = { status };
      if (notes !== undefined) {
        updateData.notes = notes;
      }

      const { error } = await supabase
        .from('b2b_leads')
        .update(updateData)
        .eq('id', leadId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error updating lead status:', error);
      return { success: false, error: error.message };
    }
  },

  async assignLead(leadId: string, adminId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('b2b_leads')
        .update({ assigned_to: adminId })
        .eq('id', leadId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error assigning lead:', error);
      return { success: false, error: error.message };
    }
  },

  async getPageConfig(): Promise<{ success: boolean; data?: B2BPageConfig[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('b2b_page_config')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Error fetching page config:', error);
      return { success: false, error: error.message };
    }
  },

  async getAllPageConfig(): Promise<{ success: boolean; data?: B2BPageConfig[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('b2b_page_config')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Error fetching all page config:', error);
      return { success: false, error: error.message };
    }
  },

  async updatePageConfig(
    sectionName: string,
    updates: Partial<B2BPageConfig>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('b2b_page_config')
        .update(updates)
        .eq('section_name', sectionName);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error updating page config:', error);
      return { success: false, error: error.message };
    }
  },

  async toggleSectionVisibility(
    sectionName: string,
    isActive: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('b2b_page_config')
        .update({ is_active: isActive })
        .eq('section_name', sectionName);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error toggling section visibility:', error);
      return { success: false, error: error.message };
    }
  }
};
