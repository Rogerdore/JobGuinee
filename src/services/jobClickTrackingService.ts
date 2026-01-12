import { supabase } from '../lib/supabase';

export interface JobClickTrackData {
  jobId: string;
  sourceNetwork: 'facebook' | 'linkedin' | 'twitter' | 'whatsapp' | 'instagram' | 'telegram' | 'direct' | 'unknown';
  sessionId?: string;
}

export interface JobClickStats {
  sourceNetwork: string;
  clickCount: number;
  lastClickedAt: string;
}

export const jobClickTrackingService = {
  /**
   * Enregistre un clic sur une offre d'emploi
   */
  async trackJobClick(data: JobClickTrackData): Promise<void> {
    try {
      const ipAddress = await this.getClientIP();
      const userAgent = navigator.userAgent;

      await supabase
        .from('job_clicks')
        .insert({
          job_id: data.jobId,
          source_network: data.sourceNetwork,
          ip_address: ipAddress,
          user_agent: userAgent,
          session_id: data.sessionId || this.getOrCreateSessionId()
        });
    } catch (error) {
      console.error('Error tracking job click:', error);
    }
  },

  /**
   * Obtient les statistiques de clics pour une offre
   */
  async getJobClickStats(jobId: string): Promise<JobClickStats[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_job_click_stats', { p_job_id: jobId });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching click stats:', error);
      return [];
    }
  },

  /**
   * Obtient les stats sociales globales (shares + clicks + CTR)
   */
  async getGlobalSocialStats(limit: number = 20) {
    try {
      const { data, error } = await supabase
        .rpc('get_global_social_stats', { p_limit: limit });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching global social stats:', error);
      return [];
    }
  },

  /**
   * Récupère l'adresse IP du client
   */
  async getClientIP(): Promise<string> {
    try {
      // Essayer d'utiliser une API publique
      const response = await fetch('https://api.ipify.org?format=json', {
        method: 'GET',
        mode: 'cors'
      });
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
    }
  },

  /**
   * Gère l'ID de session pour tracker les utilisateurs anonymes
   */
  getOrCreateSessionId(): string {
    let sessionId = localStorage.getItem('jobguinee_session_id');

    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('jobguinee_session_id', sessionId);
    }

    return sessionId;
  },

  /**
   * Calcule le CTR (Click-Through Rate) entre shares et clicks
   */
  calculateCTR(shares: number, clicks: number): number {
    if (shares === 0) return 0;
    return Math.round((clicks / shares) * 100 * 100) / 100;
  },

  /**
   * Obtient le réseau avec le meilleur engagement
   */
  getTopPerformingNetwork(stats: JobClickStats[]): string | null {
    if (stats.length === 0) return null;
    return stats.reduce((prev, current) =>
      (prev.clickCount || 0) > (current.clickCount || 0) ? prev : current
    ).sourceNetwork;
  }
};
