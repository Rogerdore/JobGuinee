import { supabase } from '../lib/supabase';

/**
 * Service for tracking candidate profile views in the CVthèque
 */
export const profileViewsService = {
  /**
   * Record a profile view when a recruiter views a candidate profile
   * @param candidateId - The ID of the candidate profile being viewed
   * @param sessionId - Optional session identifier to prevent duplicate counts
   * @returns Success status
   */
  async recordProfileView(candidateId: string, sessionId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Call the database function to increment profile views
      const { error } = await supabase.rpc('increment_profile_views', {
        p_candidate_id: candidateId,
        p_viewer_id: user.id,
        p_session_id: sessionId || null
      });

      if (error) {
        console.error('Error recording profile view:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in recordProfileView:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get profile view statistics for a candidate
   * @param userId - The user ID of the candidate
   * @returns Profile view statistics
   */
  async getProfileStats(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_candidate_profile_stats', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error getting profile stats:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getProfileStats:', error);
      return null;
    }
  },

  /**
   * Get recent profile viewers for a candidate
   * @param candidateId - The ID of the candidate profile
   * @param limit - Number of recent viewers to return
   * @returns List of recent viewers
   */
  async getRecentViewers(candidateId: string, limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('profile_views')
        .select(`
          id,
          viewed_at,
          viewer_id,
          profiles:viewer_id (
            full_name,
            user_type,
            avatar_url
          )
        `)
        .eq('candidate_id', candidateId)
        .order('viewed_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting recent viewers:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRecentViewers:', error);
      return [];
    }
  },

  /**
   * Check if a profile has been viewed by the current user
   * @param candidateId - The ID of the candidate profile
   * @returns Whether the profile has been viewed
   */
  async hasViewedProfile(candidateId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return false;
      }

      const { data, error } = await supabase
        .from('profile_views')
        .select('id')
        .eq('candidate_id', candidateId)
        .eq('viewer_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking profile view:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in hasViewedProfile:', error);
      return false;
    }
  }
};
