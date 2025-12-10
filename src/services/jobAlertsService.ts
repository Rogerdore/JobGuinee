import { supabase } from '../lib/supabase';

export interface JobAlert {
  id: string;
  user_id: string;
  title: string;
  keywords: string[];
  sectors: string[];
  locations: string[];
  experience_level: string[];
  contract_types: string[];
  salary_min: number | null;
  salary_max: number | null;
  is_active: boolean;
  notify_email: boolean;
  matched_jobs_count: number;
  last_check_at: string | null;
  created_at: string;
  updated_at: string;
}

export const jobAlertsService = {
  async createAlert(
    title: string,
    keywords: string[] = [],
    sectors: string[] = [],
    locations: string[] = [],
    experienceLevel: string[] = [],
    contractTypes: string[] = [],
    salaryMin?: number,
    salaryMax?: number
  ): Promise<JobAlert> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('job_alerts')
      .insert({
        user_id: user.id,
        title,
        keywords,
        sectors,
        locations,
        experience_level: experienceLevel,
        contract_types: contractTypes,
        salary_min: salaryMin,
        salary_max: salaryMax,
        is_active: true,
        notify_email: true,
        matched_jobs_count: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAlerts(): Promise<JobAlert[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('job_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getAlert(id: string): Promise<JobAlert> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('job_alerts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  },

  async updateAlert(id: string, updates: Partial<JobAlert>): Promise<JobAlert> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('job_alerts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteAlert(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('job_alerts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  async toggleAlertStatus(id: string): Promise<JobAlert> {
    const alert = await this.getAlert(id);
    return this.updateAlert(id, { is_active: !alert.is_active });
  },

  async toggleEmailNotifications(id: string): Promise<JobAlert> {
    const alert = await this.getAlert(id);
    return this.updateAlert(id, { notify_email: !alert.notify_email });
  },

  getSuggestedKeywords(): string[] {
    return [
      'Développeur',
      'Manager',
      'Ingénieur',
      'Consultant',
      'Analyste',
      'Spécialiste RH',
      'Chef de projet',
      'Community Manager',
      'Data Scientist',
      'Designer',
      'Marketing',
      'Ventes',
      'Support Client',
    ];
  },

  getSuggestedSectors(): string[] {
    return [
      'Technologie',
      'Finance',
      'Santé',
      'Éducation',
      'Retail',
      'Immobilier',
      'Énergie',
      'Télécommunications',
      'Transport',
      'Médias',
      'Manufacturier',
      'Consulting',
    ];
  },

  getSuggestedLocations(): string[] {
    return [
      'Conakry',
      'Kindia',
      'Mamou',
      'Labé',
      'Faranah',
      'Gaoual',
      'Télimélé',
      'Travaux',
      'Remote',
      'Hybride',
    ];
  },
};
