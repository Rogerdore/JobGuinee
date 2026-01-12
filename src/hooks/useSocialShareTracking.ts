import React, { useEffect } from 'react';
import { jobClickTrackingService } from '../services/jobClickTrackingService';

/**
 * Hook pour tracker automatiquement les clics provenant de sources sociales
 * Utilise le paramètre ?src= pour identifier la source
 */
export function useSocialShareTracking(jobId: string | null) {
  useEffect(() => {
    if (!jobId) return;

    // Récupérer les paramètres de l'URL
    const params = new URLSearchParams(window.location.search);
    const srcNetwork = params.get('src');

    // Si une source est fournie, tracker le clic
    if (srcNetwork) {
      const validNetworks = ['facebook', 'linkedin', 'twitter', 'whatsapp', 'instagram', 'telegram', 'direct'];
      const network = validNetworks.includes(srcNetwork) ? srcNetwork : 'unknown';

      jobClickTrackingService.trackJobClick({
        jobId,
        sourceNetwork: network as any
      });
    }
  }, [jobId]);
}

/**
 * Hook pour obtenir les statistiques sociales globales
 */
export function useGlobalSocialStats(limit: number = 20) {
  const [stats, setStats] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await jobClickTrackingService.getGlobalSocialStats(limit);
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch stats'));
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [limit]);

  return { stats, loading, error };
}
