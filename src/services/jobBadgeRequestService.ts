import { supabase } from '../lib/supabase';

export interface JobBadgeRequest {
  id: string;
  job_id: string;
  recruiter_id: string;
  company_id: string | null;
  badge_type: 'urgent' | 'featured';
  price_gnf: number;
  duration_days: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';
  starts_at: string | null;
  ends_at: string | null;
  auto_renew: boolean;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  payment_method: 'orange_money' | 'mtn_money' | 'credit_card' | 'bank_transfer';
  payment_reference: string | null;
  payment_status: 'pending' | 'waiting_proof' | 'completed' | 'failed' | 'refunded';
  payment_proof_url: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BadgeEligibility {
  can_request: boolean;
  reason: string;
  is_premium: boolean;
  has_enterprise: boolean;
  active_badges: number;
  max_badges: number;
  remaining: number;
}

export interface CreateBadgeRequestParams {
  job_id: string;
  badge_type: 'urgent' | 'featured';
  payment_method?: 'orange_money' | 'mtn_money' | 'credit_card' | 'bank_transfer';
  auto_renew?: boolean;
}

export const jobBadgeRequestService = {
  async checkEligibility(badge_type: 'urgent' | 'featured'): Promise<BadgeEligibility> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const { data, error } = await supabase.rpc('check_badge_eligibility', {
      p_recruiter_id: user.id,
      p_badge_type: badge_type
    });

    if (error) throw error;
    return data as BadgeEligibility;
  },

  async createRequest(params: CreateBadgeRequestParams): Promise<JobBadgeRequest> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    const duration_days = params.badge_type === 'urgent' ? 7 : 30;
    const payment_reference = `BADGE-${params.badge_type.toUpperCase()}-${Date.now()}-${user.id.substring(0, 8)}`;

    const requestData = {
      job_id: params.job_id,
      recruiter_id: user.id,
      badge_type: params.badge_type,
      price_gnf: 500000,
      duration_days,
      payment_method: params.payment_method || 'orange_money',
      payment_reference,
      auto_renew: params.auto_renew || false,
      status: 'pending',
      payment_status: 'pending'
    };

    const { data, error } = await supabase
      .from('job_badge_requests')
      .insert(requestData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getMyRequests(filters?: {
    badge_type?: 'urgent' | 'featured';
    status?: JobBadgeRequest['status'];
  }): Promise<JobBadgeRequest[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Non authentifié');

    let query = supabase
      .from('job_badge_requests')
      .select('*')
      .eq('recruiter_id', user.id)
      .order('created_at', { ascending: false });

    if (filters?.badge_type) {
      query = query.eq('badge_type', filters.badge_type);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getRequestById(request_id: string): Promise<JobBadgeRequest | null> {
    const { data, error } = await supabase
      .from('job_badge_requests')
      .select('*')
      .eq('id', request_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async getRequestsForJob(job_id: string): Promise<JobBadgeRequest[]> {
    const { data, error } = await supabase
      .from('job_badge_requests')
      .select('*')
      .eq('job_id', job_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async cancelRequest(request_id: string): Promise<void> {
    const { error } = await supabase
      .from('job_badge_requests')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', request_id)
      .eq('status', 'pending');

    if (error) throw error;
  },

  async getAllRequests(filters?: {
    badge_type?: 'urgent' | 'featured';
    status?: JobBadgeRequest['status'];
    company_id?: string;
  }): Promise<JobBadgeRequest[]> {
    let query = supabase
      .from('job_badge_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.badge_type) {
      query = query.eq('badge_type', filters.badge_type);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.company_id) {
      query = query.eq('company_id', filters.company_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async approveRequest(request_id: string, admin_notes?: string): Promise<any> {
    const { data, error } = await supabase.rpc('activate_job_badge', {
      p_request_id: request_id,
      p_admin_notes: admin_notes || null
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.message);
    return data;
  },

  async rejectRequest(request_id: string, rejection_reason: string): Promise<any> {
    const { data, error } = await supabase.rpc('reject_badge_request', {
      p_request_id: request_id,
      p_rejection_reason: rejection_reason
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.message);
    return data;
  },

  async updatePaymentProof(request_id: string, proof_url: string): Promise<void> {
    const { error } = await supabase
      .from('job_badge_requests')
      .update({
        payment_proof_url: proof_url,
        payment_status: 'waiting_proof',
        updated_at: new Date().toISOString()
      })
      .eq('id', request_id);

    if (error) throw error;
  },

  async getActiveRequestsCount(recruiter_id: string, badge_type?: 'urgent' | 'featured'): Promise<number> {
    let query = supabase
      .from('job_badge_requests')
      .select('id', { count: 'exact', head: true })
      .eq('recruiter_id', recruiter_id)
      .eq('status', 'approved')
      .gt('ends_at', new Date().toISOString());

    if (badge_type) {
      query = query.eq('badge_type', badge_type);
    }

    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  },

  getBadgeConfig(badge_type: 'urgent' | 'featured') {
    return {
      urgent: {
        name: 'URGENT',
        price: 500000,
        duration: 7,
        color: 'red',
        icon: '🔴',
        description: 'Badge rouge animé pour attirer l\'attention immédiate',
        benefits: [
          'Affichage dans les 50 offres les plus récentes',
          'Badge rouge animé visible',
          '+85% de clics',
          'Durée: 7 jours'
        ]
      },
      featured: {
        name: 'À LA UNE',
        price: 500000,
        duration: 30,
        color: 'orange',
        icon: '⚡',
        description: 'Badge premium pour une visibilité maximale',
        benefits: [
          'Affichage dans les 100 offres les plus récentes',
          'Badge orange premium',
          '+200% de visibilité',
          'Durée: 30 jours'
        ]
      }
    }[badge_type];
  },

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  },

  getStatusLabel(status: JobBadgeRequest['status']): string {
    const labels = {
      pending: 'En attente de validation',
      approved: 'Actif',
      rejected: 'Refusé',
      expired: 'Expiré',
      cancelled: 'Annulé'
    };
    return labels[status] || status;
  },

  getStatusColor(status: JobBadgeRequest['status']): string {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-gray-100 text-gray-600'
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  },

  getRemainingDays(ends_at: string | null): number | null {
    if (!ends_at) return null;
    const endDate = new Date(ends_at);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  },

  isActive(request: JobBadgeRequest): boolean {
    return request.status === 'approved' &&
           request.ends_at !== null &&
           new Date(request.ends_at) > new Date();
  }
};
