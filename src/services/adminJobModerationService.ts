import { supabase } from '../lib/supabase';

export interface JobModerationStats {
  pending_count: number;
  published_count: number;
  rejected_count: number;
  closed_count: number;
  expiring_soon_count: number;
  expiring_urgent_count: number;
  avg_moderation_hours: number;
  moderated_today: number;
}

export interface BadgeStats {
  urgent_count: number;
  featured_count: number;
  both_count: number;
  total_published: number;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  contract_type: string;
  sector: string;
  salary_range: string;
  department: string;
  submitted_at: string;
  published_at?: string;
  expires_at?: string;
  validity_days?: number;
  renewal_count: number;
  user_id: string;
  company_id: string;
  category: string;
  position_count: number;
  experience_level: string;
  education_level: string;
  status: string;
  is_urgent: boolean;
  is_featured: boolean;
  rejection_reason?: string;
  moderation_notes?: string;
  moderated_by?: string;
  moderated_at?: string;
}

export interface ModerationHistoryEntry {
  id: string;
  job_id: string;
  moderator_id: string;
  action: string;
  previous_status: string;
  new_status: string;
  reason?: string;
  notes?: string;
  created_at: string;
  moderator_name: string;
}

export interface ApprovalOptions {
  validityDays: number;
  isUrgent?: boolean;
  isFeatured?: boolean;
  notes?: string;
}

export interface RepublishOptions {
  validityDays: number;
  isUrgent?: boolean;
  isFeatured?: boolean;
  notes?: string;
}

export interface BadgeUpdateOptions {
  isUrgent: boolean;
  isFeatured: boolean;
  notes?: string;
}

class AdminJobModerationService {
  /**
   * Load all jobs with optional status filter
   */
  async loadJobs(statusFilter?: 'pending' | 'published' | 'closed' | 'rejected' | 'all'): Promise<Job[]> {
    try {
      let query = supabase
        .from('jobs')
        .select(`
          id,
          title,
          description,
          location,
          contract_type,
          sector,
          salary_range,
          department,
          submitted_at,
          published_at,
          expires_at,
          validity_days,
          renewal_count,
          user_id,
          company_id,
          category,
          position_count,
          experience_level,
          education_level,
          status,
          is_urgent,
          is_featured,
          rejection_reason,
          moderation_notes,
          moderated_by,
          moderated_at
        `)
        .order('submitted_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      } else if (statusFilter === 'all') {
        query = query.in('status', ['pending', 'published', 'rejected', 'closed']);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error loading jobs:', error);
      throw error;
    }
  }

  /**
   * Get job with recruiter information
   */
  async getJobWithRecruiter(jobId: string): Promise<Job & { recruiter_name: string; recruiter_email: string }> {
    try {
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', job.user_id)
        .single();

      if (profileError) throw profileError;

      return {
        ...job,
        recruiter_name: profile?.full_name || 'Inconnu',
        recruiter_email: profile?.email || 'N/A'
      };
    } catch (error) {
      console.error('Error getting job with recruiter:', error);
      throw error;
    }
  }

  /**
   * Load moderation statistics
   */
  async loadStats(): Promise<JobModerationStats> {
    try {
      const { data, error } = await supabase
        .from('admin_moderation_stats')
        .select('*')
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error loading stats:', error);
      throw error;
    }
  }

  /**
   * Load badge statistics
   */
  async loadBadgeStats(): Promise<BadgeStats> {
    try {
      const { data, error } = await supabase.rpc('get_badge_stats');

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error loading badge stats:', error);
      throw error;
    }
  }

  /**
   * Quick approve job with default 30 days validity
   */
  async quickApprove(jobId: string, days: number = 30): Promise<void> {
    try {
      const { data, error } = await supabase.rpc('approve_job_with_validity', {
        p_job_id: jobId,
        p_validity_days: days,
        p_notes: `Approbation rapide - ${days} jours`
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Erreur lors de l\'approbation');
      }
    } catch (error) {
      console.error('Error quick approving job:', error);
      throw error;
    }
  }

  /**
   * Approve job with custom validity and badges
   */
  async approveWithBadges(jobId: string, options: ApprovalOptions): Promise<void> {
    try {
      const { data, error } = await supabase.rpc('approve_job_with_badges_and_validity', {
        p_job_id: jobId,
        p_validity_days: options.validityDays,
        p_is_urgent: options.isUrgent || false,
        p_is_featured: options.isFeatured || false,
        p_notes: options.notes || null
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Erreur lors de l\'approbation');
      }
    } catch (error) {
      console.error('Error approving job with badges:', error);
      throw error;
    }
  }

  /**
   * Reject job with reason
   */
  async rejectJob(jobId: string, reason: string, notes?: string): Promise<void> {
    try {
      if (!reason || !reason.trim()) {
        throw new Error('La raison du rejet est requise');
      }

      const { data, error } = await supabase.rpc('reject_job', {
        p_job_id: jobId,
        p_reason: reason,
        p_notes: notes || null
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Erreur lors du rejet');
      }
    } catch (error) {
      console.error('Error rejecting job:', error);
      throw error;
    }
  }

  /**
   * Republish job with new validity
   */
  async republishJob(jobId: string, options: RepublishOptions): Promise<void> {
    try {
      const { data, error } = await supabase.rpc('republish_job', {
        p_job_id: jobId,
        p_validity_days: options.validityDays,
        p_notes: options.notes || 'Republication'
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Erreur lors de la republication');
      }
    } catch (error) {
      console.error('Error republishing job:', error);
      throw error;
    }
  }

  /**
   * Update job badges
   */
  async updateBadges(jobId: string, options: BadgeUpdateOptions): Promise<void> {
    try {
      const { data, error } = await supabase.rpc('update_job_badges', {
        p_job_id: jobId,
        p_is_urgent: options.isUrgent,
        p_is_featured: options.isFeatured,
        p_notes: options.notes || null
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Erreur lors de la mise à jour des badges');
      }
    } catch (error) {
      console.error('Error updating badges:', error);
      throw error;
    }
  }

  /**
   * Bulk approve jobs
   */
  async bulkApprove(jobIds: string[], validityDays: number = 30): Promise<{ success: number; errors: number }> {
    let successCount = 0;
    let errorCount = 0;

    for (const jobId of jobIds) {
      try {
        await this.quickApprove(jobId, validityDays);
        successCount++;
      } catch (error) {
        console.error(`Error approving job ${jobId}:`, error);
        errorCount++;
      }
    }

    return { success: successCount, errors: errorCount };
  }

  /**
   * Load moderation history for a job
   */
  async loadModerationHistory(jobId: string): Promise<ModerationHistoryEntry[]> {
    try {
      const { data, error } = await supabase
        .from('job_moderation_history')
        .select(`
          *,
          profiles:moderator_id (full_name)
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        moderator_name: item.profiles?.full_name || 'Système'
      }));
    } catch (error) {
      console.error('Error loading moderation history:', error);
      throw error;
    }
  }

  /**
   * Get expiring jobs
   */
  async getExpiringJobs(daysBefore: number = 7): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_expiring_jobs', {
        p_days_before: daysBefore
      });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting expiring jobs:', error);
      throw error;
    }
  }

  /**
   * Mark expired jobs (for cron)
   */
  async markExpiredJobs(): Promise<{ expired_count: number }> {
    try {
      const { data, error } = await supabase.rpc('mark_expired_jobs');

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error marking expired jobs:', error);
      throw error;
    }
  }

  /**
   * Search jobs
   */
  async searchJobs(query: string, statusFilter?: string): Promise<Job[]> {
    try {
      let supabaseQuery = supabase
        .from('jobs')
        .select('*')
        .or(`title.ilike.%${query}%,department.ilike.%${query}%,location.ilike.%${query}%`)
        .order('submitted_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        supabaseQuery = supabaseQuery.eq('status', statusFilter);
      }

      const { data, error } = await supabaseQuery;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error searching jobs:', error);
      throw error;
    }
  }

  /**
   * Calculate expiration date
   */
  calculateExpirationDate(validityDays: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + validityDays);
    return date;
  }

  /**
   * Check if job is expiring soon
   */
  isExpiringSoon(expiresAt: string, days: number = 7): boolean {
    if (!expiresAt) return false;
    const expirationDate = new Date(expiresAt);
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + days);
    return expirationDate <= warningDate && expirationDate > new Date();
  }

  /**
   * Get badge display info
   */
  getBadgeInfo(job: Job): { hasUrgent: boolean; hasFeatured: boolean; badges: string[] } {
    const badges: string[] = [];
    if (job.is_urgent) badges.push('URGENT');
    if (job.is_featured) badges.push('À LA UNE');

    return {
      hasUrgent: job.is_urgent,
      hasFeatured: job.is_featured,
      badges
    };
  }

  /**
   * Validate approval options
   */
  validateApprovalOptions(options: ApprovalOptions): { valid: boolean; error?: string } {
    if (!options.validityDays || options.validityDays < 1 || options.validityDays > 365) {
      return { valid: false, error: 'La durée de validité doit être entre 1 et 365 jours' };
    }
    return { valid: true };
  }

  /**
   * Format date for display
   */
  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Format datetime for display
   */
  formatDateTime(date: string | Date): string {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get status badge class
   */
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  /**
   * Get status label
   */
  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'published':
        return 'Publiée';
      case 'rejected':
        return 'Rejetée';
      case 'closed':
        return 'Fermée';
      case 'draft':
        return 'Brouillon';
      default:
        return status;
    }
  }
}

export const adminJobModerationService = new AdminJobModerationService();
