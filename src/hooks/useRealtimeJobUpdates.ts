import { useEffect } from 'react';
import { supabase, Job } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeJobUpdatesProps {
  onJobUpdate: (jobId: string, updates: Partial<Job>) => void;
  enabled?: boolean;
}

export function useRealtimeJobUpdates({ onJobUpdate, enabled = true }: UseRealtimeJobUpdatesProps) {
  useEffect(() => {
    if (!enabled) return;

    let channel: RealtimeChannel;

    const setupRealtimeSubscription = async () => {
      channel = supabase
        .channel('jobs-realtime-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'jobs',
          },
          (payload: any) => {
            const updatedJob = payload.new;

            onJobUpdate(updatedJob.id, {
              saves_count: updatedJob.saves_count,
              comments_count: updatedJob.comments_count,
              views_count: updatedJob.views_count,
              applications_count: updatedJob.applications_count,
              shares_count: updatedJob.shares_count,
            });
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Synchronisation temps réel activée pour les jobs');
          }
        });
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        console.log('🔌 Synchronisation temps réel désactivée');
      }
    };
  }, [enabled, onJobUpdate]);
}
