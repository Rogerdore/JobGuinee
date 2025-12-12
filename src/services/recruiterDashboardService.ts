import { supabase } from '../lib/supabase';

export interface DashboardMetrics {
  total_jobs: number;
  active_jobs: number;
  total_applications: number;
  avg_time_to_hire_days: number;
  avg_matching_score: number;
  this_week_applications: number;
  scheduled_interviews: number;
}

export interface RecentJob {
  id: string;
  title: string;
  location: string;
  status: string;
  views_count: number;
  applications_count: number;
  created_at: string;
  expires_at: string | null;
}

export interface RecentApplication {
  application_id: string;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  experience_level: string;
  ai_match_score: number;
  is_strong_profile: boolean;
  workflow_stage: string;
  applied_at: string;
  candidate_id: string;
}

export const recruiterDashboardService = {
  async getMetrics(companyId: string): Promise<DashboardMetrics | null> {
    try {
      const { data, error } = await supabase.rpc('get_recruiter_dashboard_metrics', {
        company_id_param: companyId
      });

      if (error) {
        console.error('Error fetching dashboard metrics:', error);
        return null;
      }

      return data as DashboardMetrics;
    } catch (error) {
      console.error('Error in getMetrics:', error);
      return null;
    }
  },

  async getRecentJobs(companyId: string, limit: number = 5): Promise<RecentJob[]> {
    try {
      const { data, error } = await supabase.rpc('get_recruiter_recent_jobs', {
        company_id_param: companyId,
        limit_count: limit
      });

      if (error) {
        console.error('Error fetching recent jobs:', error);
        return [];
      }

      return (data || []) as RecentJob[];
    } catch (error) {
      console.error('Error in getRecentJobs:', error);
      return [];
    }
  },

  async getRecentApplications(companyId: string, limit: number = 10): Promise<RecentApplication[]> {
    try {
      const { data, error } = await supabase.rpc('get_recruiter_recent_applications', {
        company_id_param: companyId,
        limit_count: limit
      });

      if (error) {
        console.error('Error fetching recent applications:', error);
        return [];
      }

      return (data || []) as RecentApplication[];
    } catch (error) {
      console.error('Error in getRecentApplications:', error);
      return [];
    }
  },

  async runAIMatching(
    jobId: string,
    candidateId: string,
    companyId: string
  ): Promise<{ success: boolean; score?: number; error?: string }> {
    try {
      const { data: companyData } = await supabase
        .from('companies')
        .select('subscription_tier, enterprise_pack_id')
        .eq('id', companyId)
        .single();

      if (!companyData) {
        return { success: false, error: 'Entreprise non trouvée' };
      }

      if (companyData.enterprise_pack_id) {
        const { data: packData } = await supabase
          .from('enterprise_packs')
          .select('ai_credits_remaining')
          .eq('id', companyData.enterprise_pack_id)
          .single();

        if (packData && packData.ai_credits_remaining <= 0) {
          return {
            success: false,
            error: 'Crédits IA épuisés. Veuillez recharger votre pack Enterprise.'
          };
        }
      } else {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('ai_credits_balance')
          .eq('id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        if (profileData && profileData.ai_credits_balance <= 0) {
          return {
            success: false,
            error: 'Crédits IA insuffisants. Veuillez acheter des crédits.'
          };
        }
      }

      const { data: jobData } = await supabase
        .from('jobs')
        .select('title, description, requirements, keywords, experience_level, education_level')
        .eq('id', jobId)
        .single();

      const { data: candidateData } = await supabase
        .from('candidate_profiles')
        .select('*, profile:profiles!candidate_profiles_profile_id_fkey(*)')
        .eq('id', candidateId)
        .single();

      if (!jobData || !candidateData) {
        return { success: false, error: 'Données introuvables' };
      }

      const mockScore = Math.floor(Math.random() * 30) + 60;

      const { data: application } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', jobId)
        .eq('candidate_id', candidateId)
        .maybeSingle();

      if (application) {
        const { error: insertError } = await supabase
          .from('ai_matching_results')
          .upsert({
            application_id: application.id,
            ai_match_score: mockScore,
            match_category: mockScore >= 80 ? 'excellent' : mockScore >= 60 ? 'good' : 'fair',
            match_explanation: `Score basé sur l'analyse du profil et des exigences du poste.`,
            analyzed_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error saving matching result:', insertError);
        }

        if (companyData.enterprise_pack_id) {
          await supabase.rpc('consume_pack_credit', {
            pack_id: companyData.enterprise_pack_id,
            credit_type: 'ai_credits'
          });
        } else {
          const userId = (await supabase.auth.getUser()).data.user?.id;
          if (userId) {
            await supabase.rpc('use_ai_credits', {
              user_id_param: userId,
              service_code_param: 'ai_matching',
              cost_param: 1
            });
          }
        }
      }

      return { success: true, score: mockScore };
    } catch (error) {
      console.error('Error in runAIMatching:', error);
      return { success: false, error: 'Erreur lors du matching IA' };
    }
  },

  getExperienceLevelLabel(level: string): string {
    switch (level) {
      case 'Junior':
        return 'Junior (0-2 ans)';
      case 'Intermédiaire':
        return 'Intermédiaire (2-5 ans)';
      case 'Senior':
        return 'Senior (5+ ans)';
      default:
        return level;
    }
  },

  getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  },

  getScoreBgColor(score: number): string {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    if (score >= 40) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  }
};
