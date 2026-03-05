import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface JobCounters {
  views_count: number;
  applications_count: number;
  saves_count: number;
  comments_count: number;
  shares_count: number;
}

interface AnimatedCounter {
  value: number;
  animating: boolean;
}

export interface AnimatedJobCounters {
  views: AnimatedCounter;
  applications: AnimatedCounter;
  saves: AnimatedCounter;
  comments: AnimatedCounter;
  shares: AnimatedCounter;
}

const ANIMATION_DURATION = 600;

export function useJobCounters(jobId: string, initialCounters?: Partial<JobCounters>) {
  const [counters, setCounters] = useState<JobCounters>({
    views_count: initialCounters?.views_count ?? 0,
    applications_count: initialCounters?.applications_count ?? 0,
    saves_count: initialCounters?.saves_count ?? 0,
    comments_count: initialCounters?.comments_count ?? 0,
    shares_count: initialCounters?.shares_count ?? 0,
  });

  const [animated, setAnimated] = useState<AnimatedJobCounters>({
    views: { value: initialCounters?.views_count ?? 0, animating: false },
    applications: { value: initialCounters?.applications_count ?? 0, animating: false },
    saves: { value: initialCounters?.saves_count ?? 0, animating: false },
    comments: { value: initialCounters?.comments_count ?? 0, animating: false },
    shares: { value: initialCounters?.shares_count ?? 0, animating: false },
  });

  const animationTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const prevCounters = useRef<JobCounters>(counters);

  const triggerAnimation = useCallback((key: keyof AnimatedJobCounters, newValue: number) => {
    if (animationTimers.current[key]) {
      clearTimeout(animationTimers.current[key]);
    }
    setAnimated(prev => ({
      ...prev,
      [key]: { value: newValue, animating: true },
    }));
    animationTimers.current[key] = setTimeout(() => {
      setAnimated(prev => ({
        ...prev,
        [key]: { value: newValue, animating: false },
      }));
    }, ANIMATION_DURATION);
  }, []);

  const applyUpdate = useCallback((updates: Partial<JobCounters>) => {
    setCounters(prev => {
      const next = { ...prev, ...updates };

      const map: Array<[keyof AnimatedJobCounters, keyof JobCounters]> = [
        ['views', 'views_count'],
        ['applications', 'applications_count'],
        ['saves', 'saves_count'],
        ['comments', 'comments_count'],
        ['shares', 'shares_count'],
      ];

      map.forEach(([animKey, counterKey]) => {
        const newVal = next[counterKey] ?? 0;
        const oldVal = prevCounters.current[counterKey] ?? 0;
        if (newVal !== oldVal) {
          triggerAnimation(animKey, newVal);
        }
      });

      prevCounters.current = next;
      return next;
    });
  }, [triggerAnimation]);

  useEffect(() => {
    if (!jobId || jobId.startsWith('sample-')) return;

    const channel = supabase
      .channel(`job-counters:${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          const row = payload.new as Partial<JobCounters>;
          applyUpdate({
            views_count: row.views_count,
            applications_count: row.applications_count,
            saves_count: row.saves_count,
            comments_count: row.comments_count,
            shares_count: row.shares_count,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      Object.values(animationTimers.current).forEach(clearTimeout);
    };
  }, [jobId, applyUpdate]);

  useEffect(() => {
    applyUpdate({
      views_count: initialCounters?.views_count ?? 0,
      applications_count: initialCounters?.applications_count ?? 0,
      saves_count: initialCounters?.saves_count ?? 0,
      comments_count: initialCounters?.comments_count ?? 0,
      shares_count: initialCounters?.shares_count ?? 0,
    });
  }, [
    initialCounters?.views_count,
    initialCounters?.applications_count,
    initialCounters?.saves_count,
    initialCounters?.comments_count,
    initialCounters?.shares_count,
  ]);

  return { counters, animated };
}
