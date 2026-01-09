import { supabase } from '../lib/supabase';

export interface ShareStats {
  share_type: 'manual' | 'auto' | 'scheduled';
  platform: string;
  count: number;
}

export interface TopSharedJob {
  job_id: string;
  title: string;
  company: string;
  total_shares: number;
  facebook: number;
  linkedin: number;
  twitter: number;
  whatsapp: number;
}

export interface AutoShareSuccessRate {
  platform: string;
  total_attempts: number;
  successful: number;
  failed: number;
  success_rate: number;
}

export interface ShareTrend {
  date: string;
  platform: string;
  count: number;
}

export const socialShareAnalyticsService = {
  async getGlobalStats(): Promise<ShareStats[]> {
    const { data, error } = await supabase.rpc('get_share_stats_by_type');

    if (error) {
      console.error('Error fetching global stats:', error);
      throw error;
    }

    return data || [];
  },

  async getJobStats(jobId: string): Promise<ShareStats[]> {
    const { data, error } = await supabase.rpc('get_share_stats_by_type', {
      p_job_id: jobId,
    });

    if (error) {
      console.error('Error fetching job stats:', error);
      throw error;
    }

    return data || [];
  },

  async getTopSharedJobs(limit = 10): Promise<TopSharedJob[]> {
    const { data, error } = await supabase.rpc('get_most_shared_jobs', {
      limit,
    });

    if (error) {
      console.error('Error fetching top shared jobs:', error);
      throw error;
    }

    return data || [];
  },

  async getAutoShareSuccessRate(): Promise<AutoShareSuccessRate[]> {
    const { data, error } = await supabase.rpc('get_auto_share_success_rate');

    if (error) {
      console.error('Error fetching auto-share success rate:', error);
      throw error;
    }

    return data || [];
  },

  async getJobShareHistory(jobId: string) {
    const { data, error } = await supabase
      .from('social_share_analytics')
      .select('*')
      .eq('job_id', jobId)
      .order('shared_at', { ascending: false });

    if (error) {
      console.error('Error fetching job share history:', error);
      throw error;
    }

    return data || [];
  },

  async getShareTrends(days = 30): Promise<ShareTrend[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('social_share_analytics')
      .select('platform, shared_at')
      .gte('shared_at', startDate.toISOString())
      .order('shared_at');

    if (error) {
      console.error('Error fetching share trends:', error);
      throw error;
    }

    const trends: { [key: string]: { [key: string]: number } } = {};
    (data || []).forEach(share => {
      const date = new Date(share.shared_at).toISOString().split('T')[0];
      if (!trends[date]) trends[date] = {};
      if (!trends[date][share.platform]) trends[date][share.platform] = 0;
      trends[date][share.platform]++;
    });

    const result: ShareTrend[] = [];
    Object.keys(trends).forEach(date => {
      Object.keys(trends[date]).forEach(platform => {
        result.push({
          date,
          platform,
          count: trends[date][platform],
        });
      });
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
  },

  async getTotalSharesByPlatform(): Promise<{
    [key: string]: { manual: number; auto: number; total: number };
  }> {
    const stats = await this.getGlobalStats();
    const result: any = {};

    stats.forEach(stat => {
      if (!result[stat.platform]) {
        result[stat.platform] = { manual: 0, auto: 0, total: 0 };
      }
      if (stat.share_type === 'manual') {
        result[stat.platform].manual = stat.count;
      } else if (stat.share_type === 'auto') {
        result[stat.platform].auto = stat.count;
      }
      result[stat.platform].total += stat.count;
    });

    return result;
  },

  async getSharesByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<{
    total: number;
    by_platform: { [key: string]: number };
    by_type: { [key: string]: number };
  }> {
    const { data, error } = await supabase
      .from('social_share_analytics')
      .select('platform, share_type')
      .gte('shared_at', startDate.toISOString())
      .lte('shared_at', endDate.toISOString());

    if (error) {
      console.error('Error fetching shares by date range:', error);
      throw error;
    }

    const shares = data || [];
    const by_platform: { [key: string]: number } = {};
    const by_type: { [key: string]: number } = {};

    shares.forEach(share => {
      by_platform[share.platform] = (by_platform[share.platform] || 0) + 1;
      by_type[share.share_type] = (by_type[share.share_type] || 0) + 1;
    });

    return {
      total: shares.length,
      by_platform,
      by_type,
    };
  },

  async getRecentShares(limit = 50) {
    const { data, error } = await supabase
      .from('social_share_analytics')
      .select(
        `
        *,
        jobs:job_id (
          id,
          title,
          company,
          status
        )
      `
      )
      .order('shared_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent shares:', error);
      throw error;
    }

    return data || [];
  },

  async getShareSuccessRate(): Promise<{
    total: number;
    successful: number;
    failed: number;
    success_rate: number;
  }> {
    const { data, error } = await supabase
      .from('social_share_analytics')
      .select('metadata')
      .eq('share_type', 'auto');

    if (error) {
      console.error('Error fetching share success rate:', error);
      throw error;
    }

    const shares = data || [];
    let successful = 0;
    let failed = 0;

    shares.forEach(share => {
      if (share.metadata && share.metadata.success === true) {
        successful++;
      } else if (share.metadata && share.metadata.success === false) {
        failed++;
      }
    });

    const total = successful + failed;
    const success_rate = total > 0 ? (successful / total) * 100 : 0;

    return {
      total,
      successful,
      failed,
      success_rate: Math.round(success_rate * 100) / 100,
    };
  },
};
