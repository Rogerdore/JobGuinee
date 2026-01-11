import { supabase } from '../lib/supabase';

export interface CandidateStats {
  jobViewsCount: number;
  applicationsCount: number;
  profileViewsCount: number;
  profilePurchasesCount: number;
  formationsCount: number;
  aiScore: number;
  creditsBalance: number;
  isPremium: boolean;
  unreadMessagesCount: number;
  profileStats: {
    profile_views_count: number;
    profile_purchases_count: number;
    this_month_views: number;
    this_month_purchases: number;
  };
}

export const candidateStatsService = {
  /**
   * Get all candidate statistics in a single call
   * Centralizes all stat queries for consistency
   */
  async getAllStats(userId: string, profileId: string): Promise<CandidateStats | null> {
    try {
      const [
        jobViewsData,
        applicationsData,
        formationsData,
        profilesData,
        profileStatsData
      ] = await Promise.all([
        supabase
          .from('job_views')
          .select('job_id')
          .eq('user_id', userId),
        supabase
          .from('applications')
          .select('id, ai_match_score')
          .eq('candidate_id', userId),
        supabase
          .from('formation_enrollments')
          .select('id')
          .eq('user_id', userId)
          .in('status', ['enrolled', 'in_progress', 'completed']),
        supabase
          .from('profiles')
          .select('credits_balance, is_premium, premium_expiration')
          .eq('id', profileId)
          .maybeSingle(),
        supabase.rpc('get_candidate_profile_stats', { p_user_id: userId })
      ]);

      // Count unique job views (one job_id = one unique view)
      const uniqueJobIds = new Set(jobViewsData.data?.map((v: any) => v.job_id) || []);
      const jobViewsCount = uniqueJobIds.size;

      // Count applications
      const applicationsCount = applicationsData.data?.length || 0;

      // Calculate average AI score
      const aiScores = applicationsData.data
        ?.map((app: any) => app.ai_match_score)
        .filter((score: number | null) => score !== null) || [];
      const aiScore = aiScores.length > 0
        ? Math.round(aiScores.reduce((sum: number, score: number) => sum + score, 0) / aiScores.length)
        : 0;

      // Count formations
      const formationsCount = formationsData.data?.length || 0;

      // Profile stats
      const profileStats = {
        profile_views_count: profileStatsData.data?.profile_views_count || 0,
        profile_purchases_count: profileStatsData.data?.profile_purchases_count || 0,
        this_month_views: profileStatsData.data?.this_month_views || 0,
        this_month_purchases: profileStatsData.data?.this_month_purchases || 0
      };

      // Credits and premium status
      const creditsBalance = profilesData.data?.credits_balance || 0;
      const isPremium = profilesData.data?.is_premium || false;

      return {
        jobViewsCount,
        applicationsCount,
        profileViewsCount: profileStats.profile_views_count,
        profilePurchasesCount: profileStats.profile_purchases_count,
        formationsCount,
        aiScore,
        creditsBalance,
        isPremium,
        unreadMessagesCount: 0, // Will be set separately via real-time
        profileStats
      };
    } catch (error) {
      console.error('Error fetching candidate stats:', error);
      return null;
    }
  },

  /**
   * Track a job view (when user opens a job detail page)
   * Uses UPSERT to prevent duplicate entries for same user+job
   */
  async trackJobView(userId: string, jobId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if already viewed
      const { data: existing } = await supabase
        .from('job_views')
        .select('id')
        .eq('user_id', userId)
        .eq('job_id', jobId)
        .maybeSingle();

      // Only insert if not already viewed
      if (!existing) {
        const { error } = await supabase
          .from('job_views')
          .insert({
            user_id: userId,
            job_id: jobId,
            viewed_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error tracking job view:', error);
          return { success: false, error: error.message };
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in trackJobView:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get job views count for a user
   */
  async getJobViewsCount(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('job_views')
        .select('job_id')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching job views count:', error);
        return 0;
      }

      // Count unique job IDs
      const uniqueJobIds = new Set(data?.map((v: any) => v.job_id) || []);
      return uniqueJobIds.size;
    } catch (error) {
      console.error('Error in getJobViewsCount:', error);
      return 0;
    }
  },

  /**
   * Get applications count for a user
   */
  async getApplicationsCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .eq('candidate_id', userId);

      if (error) {
        console.error('Error fetching applications count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getApplicationsCount:', error);
      return 0;
    }
  },

  /**
   * Get formations count for a user
   */
  async getFormationsCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('formation_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', ['enrolled', 'in_progress', 'completed']);

      if (error) {
        console.error('Error fetching formations count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getFormationsCount:', error);
      return 0;
    }
  },

  /**
   * Calculate AI score from applications
   * Returns average of all ai_match_score values
   */
  async getAIScore(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('ai_match_score')
        .eq('candidate_id', userId)
        .not('ai_match_score', 'is', null);

      if (error) {
        console.error('Error fetching AI score:', error);
        return 0;
      }

      if (!data || data.length === 0) {
        return 0;
      }

      const scores = data.map((app: any) => app.ai_match_score);
      const average = scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;

      return Math.round(average);
    } catch (error) {
      console.error('Error in getAIScore:', error);
      return 0;
    }
  },

  /**
   * Get profile stats (views, purchases) via RPC function
   */
  async getProfileStats(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_candidate_profile_stats', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error fetching profile stats:', error);
        return {
          profile_views_count: 0,
          profile_purchases_count: 0,
          this_month_views: 0,
          this_month_purchases: 0
        };
      }

      return data || {
        profile_views_count: 0,
        profile_purchases_count: 0,
        this_month_views: 0,
        this_month_purchases: 0
      };
    } catch (error) {
      console.error('Error in getProfileStats:', error);
      return {
        profile_views_count: 0,
        profile_purchases_count: 0,
        this_month_views: 0,
        this_month_purchases: 0
      };
    }
  },

  /**
   * Enroll user in a formation
   */
  async enrollInFormation(
    userId: string,
    formationId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('formation_enrollments')
        .insert({
          user_id: userId,
          formation_id: formationId,
          status: 'enrolled',
          progress: 0
        });

      if (error) {
        // Check if already enrolled (unique constraint)
        if (error.code === '23505') {
          return { success: false, error: 'Vous êtes déjà inscrit à cette formation' };
        }
        console.error('Error enrolling in formation:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in enrollInFormation:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update formation progress
   */
  async updateFormationProgress(
    userId: string,
    formationId: string,
    progress: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        progress,
        updated_at: new Date().toISOString()
      };

      // If progress is 100%, mark as completed
      if (progress >= 100) {
        updateData.status = 'completed';
        updateData.completed_at = new Date().toISOString();
      } else if (progress > 0) {
        updateData.status = 'in_progress';
      }

      const { error } = await supabase
        .from('formation_enrollments')
        .update(updateData)
        .eq('user_id', userId)
        .eq('formation_id', formationId);

      if (error) {
        console.error('Error updating formation progress:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in updateFormationProgress:', error);
      return { success: false, error: error.message };
    }
  }
};
