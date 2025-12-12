import { supabase } from '../lib/supabase';

export interface RecruiterAnalytics {
  company_id: string;
  company_name: string;
  job_id: string;
  job_title: string;
  job_created_at: string;
  total_applications: number;
  ai_analyzed_count: number;
  ai_strong_matches: number;
  ai_medium_matches: number;
  ai_weak_matches: number;
  ai_preselected: number;
  hired_count: number;
  rejected_count: number;
  interviews_scheduled: number;
  interviews_completed: number;
  total_credits_spent: number;
  avg_ai_score: number;
  estimated_time_saved_minutes: number;
  hire_rate_percent: number;
  ai_strong_hire_rate_percent: number;
}

export interface GlobalAnalytics {
  total_credits_spent: number;
  total_candidates_analyzed: number;
  total_hired: number;
  total_time_saved_hours: number;
  avg_cost_per_hire: number;
  total_interviews: number;
  avg_ai_score: number;
  strong_match_conversion_rate: number;
}

export const recruiterAnalyticsService = {
  async getJobAnalytics(jobId: string): Promise<RecruiterAnalytics | null> {
    try {
      const { data, error } = await supabase
        .from('recruiter_ai_analytics_view')
        .select('*')
        .eq('job_id', jobId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching job analytics:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getJobAnalytics:', error);
      return null;
    }
  },

  async getCompanyAnalytics(companyId: string): Promise<RecruiterAnalytics[]> {
    try {
      const { data, error } = await supabase
        .from('recruiter_ai_analytics_view')
        .select('*')
        .eq('company_id', companyId)
        .order('job_created_at', { ascending: false });

      if (error) {
        console.error('Error fetching company analytics:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCompanyAnalytics:', error);
      return [];
    }
  },

  async getGlobalAnalytics(companyId: string): Promise<GlobalAnalytics> {
    try {
      const { data, error } = await supabase
        .from('recruiter_ai_analytics_view')
        .select('*')
        .eq('company_id', companyId);

      if (error || !data || data.length === 0) {
        return this.getEmptyAnalytics();
      }

      const totalCreditsSpent = data.reduce((sum, job) => sum + (Number(job.total_credits_spent) || 0), 0);
      const totalCandidatesAnalyzed = data.reduce((sum, job) => sum + (Number(job.ai_analyzed_count) || 0), 0);
      const totalHired = data.reduce((sum, job) => sum + (Number(job.hired_count) || 0), 0);
      const totalTimeSaved = data.reduce((sum, job) => sum + (Number(job.estimated_time_saved_minutes) || 0), 0);
      const totalInterviews = data.reduce((sum, job) => sum + (Number(job.interviews_scheduled) || 0), 0);

      const avgAiScore = data.reduce((sum, job) => sum + (Number(job.avg_ai_score) || 0), 0) / data.length;

      const totalStrongMatches = data.reduce((sum, job) => sum + (Number(job.ai_strong_matches) || 0), 0);
      const strongHired = data.reduce((sum, job) => {
        const strongCount = Number(job.ai_strong_matches) || 0;
        const hiredRate = Number(job.ai_strong_hire_rate_percent) || 0;
        return sum + (strongCount * hiredRate / 100);
      }, 0);

      return {
        total_credits_spent: totalCreditsSpent,
        total_candidates_analyzed: totalCandidatesAnalyzed,
        total_hired: totalHired,
        total_time_saved_hours: Math.round(totalTimeSaved / 60),
        avg_cost_per_hire: totalHired > 0 ? Math.round(totalCreditsSpent / totalHired) : 0,
        total_interviews: totalInterviews,
        avg_ai_score: Math.round(avgAiScore),
        strong_match_conversion_rate: totalStrongMatches > 0 ? Math.round((strongHired / totalStrongMatches) * 100) : 0
      };
    } catch (error) {
      console.error('Error in getGlobalAnalytics:', error);
      return this.getEmptyAnalytics();
    }
  },

  getEmptyAnalytics(): GlobalAnalytics {
    return {
      total_credits_spent: 0,
      total_candidates_analyzed: 0,
      total_hired: 0,
      total_time_saved_hours: 0,
      avg_cost_per_hire: 0,
      total_interviews: 0,
      avg_ai_score: 0,
      strong_match_conversion_rate: 0
    };
  },

  async getAIUsageHistory(companyId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data: company } = await supabase
        .from('companies')
        .select('profile_id')
        .eq('id', companyId)
        .single();

      if (!company) {
        return [];
      }

      const { data, error } = await supabase
        .from('ai_service_usage_history')
        .select('*')
        .eq('user_id', company.profile_id)
        .eq('service_key', 'ai_recruiter_matching')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching AI usage history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAIUsageHistory:', error);
      return [];
    }
  },

  calculateROI(creditsSpent: number, candidatesAnalyzed: number, hired: number): {
    timeSavedHours: number;
    costPerAnalysis: number;
    costPerHire: number;
    efficiencyGain: number;
  } {
    const timeSavedHours = Math.round((candidatesAnalyzed * 5 * 0.8) / 60);
    const costPerAnalysis = candidatesAnalyzed > 0 ? Math.round(creditsSpent / candidatesAnalyzed) : 0;
    const costPerHire = hired > 0 ? Math.round(creditsSpent / hired) : 0;
    const efficiencyGain = 80;

    return {
      timeSavedHours,
      costPerAnalysis,
      costPerHire,
      efficiencyGain
    };
  },

  formatTimeSaved(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours}h`;
    }

    return `${hours}h${remainingMinutes}`;
  },

  formatCredits(credits: number): string {
    if (credits < 1000) {
      return credits.toString();
    }

    return `${(credits / 1000).toFixed(1)}k`;
  }
};
