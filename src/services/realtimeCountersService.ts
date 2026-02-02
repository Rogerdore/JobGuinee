import { supabase } from '../lib/supabase';

export interface JobStats {
  views_count: number;
  saves_count: number;
  comments_count: number;
  shares_count: number;
  applications_count: number;
  is_saved: boolean;
}

class RealtimeCountersService {
  async getJobStats(jobId: string): Promise<JobStats> {
    try {
      const { data, error } = await supabase.rpc('get_job_stats', {
        p_job_id: jobId
      });

      if (error) throw error;

      return data as JobStats;
    } catch (error) {
      console.error('Error fetching job stats:', error);
      return {
        views_count: 0,
        saves_count: 0,
        comments_count: 0,
        shares_count: 0,
        applications_count: 0,
        is_saved: false
      };
    }
  }

  async trackSave(jobId: string, action: 'save' | 'unsave'): Promise<{
    success: boolean;
    status: string;
    message: string;
  }> {
    try {
      const { data, error } = await supabase.rpc('track_job_save', {
        p_job_id: jobId,
        p_action: action
      });

      if (error) throw error;

      return data as { success: boolean; status: string; message: string };
    } catch (error) {
      console.error('Error tracking save:', error);
      return {
        success: false,
        status: 'error',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  async trackShare(
    jobId: string,
    platform: 'facebook' | 'linkedin' | 'twitter' | 'whatsapp',
    shareType: 'manual' | 'auto' | 'scheduled' = 'manual'
  ): Promise<{
    success: boolean;
    status: string;
    message: string;
    platform?: string;
  }> {
    try {
      const sessionId = this.getSessionId();

      const { data, error } = await supabase.rpc('track_job_share', {
        p_job_id: jobId,
        p_platform: platform,
        p_share_type: shareType,
        p_session_id: sessionId
      });

      if (error) throw error;

      return data as { success: boolean; status: string; message: string; platform?: string };
    } catch (error) {
      console.error('Error tracking share:', error);
      return {
        success: false,
        status: 'error',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  private getSessionId(): string {
    let sessionId = localStorage.getItem('session_id');

    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('session_id', sessionId);
    }

    return sessionId;
  }

  subscribeToJobStats(jobId: string, callback: (stats: Partial<JobStats>) => void) {
    const channel = supabase
      .channel(`job_stats:${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'jobs',
          filter: `id=eq.${jobId}`
        },
        (payload) => {
          callback({
            views_count: payload.new.views_count,
            saves_count: payload.new.saves_count,
            comments_count: payload.new.comments_count,
            shares_count: payload.new.shares_count,
            applications_count: payload.new.applications_count
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }
}

export const realtimeCountersService = new RealtimeCountersService();
