import { useEffect, useRef, useState, useCallback } from 'react';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions<T> {
  data: T;
  key: string;
  delay?: number;
  enabled?: boolean;
}

export function useAutoSave<T>({ data, key, delay = 3000, enabled = true }: UseAutoSaveOptions<T>) {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const lastDataRef = useRef<string>('');

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const savedData = localStorage.getItem(`autosave_${key}`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.timestamp) {
          setLastSaved(new Date(parsed.timestamp));
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
  }, [key]);

  useEffect(() => {
    if (!enabled) return;

    const currentData = JSON.stringify(data);

    if (currentData === lastDataRef.current) {
      return;
    }

    lastDataRef.current = currentData;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setStatus('idle');

    timeoutRef.current = setTimeout(async () => {
      if (!isMountedRef.current) return;

      setStatus('saving');

      try {
        const saveData = {
          data,
          timestamp: new Date().toISOString(),
          version: 1,
        };

        localStorage.setItem(`autosave_${key}`, JSON.stringify(saveData));

        if (isMountedRef.current) {
          setStatus('saved');
          setLastSaved(new Date());

          setTimeout(() => {
            if (isMountedRef.current) {
              setStatus('idle');
            }
          }, 2000);
        }
      } catch (error) {
        console.error('Auto-save error:', error);
        if (isMountedRef.current) {
          setStatus('error');
          setTimeout(() => {
            if (isMountedRef.current) {
              setStatus('idle');
            }
          }, 3000);
        }
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, key, delay, enabled]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(`autosave_${key}`);
      setLastSaved(null);
      setStatus('idle');
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  }, [key]);

  const loadDraft = useCallback((): T | null => {
    try {
      const savedData = localStorage.getItem(`autosave_${key}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        return parsed.data as T;
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
    return null;
  }, [key]);

  const hasDraft = useCallback((): boolean => {
    try {
      const savedData = localStorage.getItem(`autosave_${key}`);
      return !!savedData;
    } catch {
      return false;
    }
  }, [key]);

  return {
    status,
    lastSaved,
    clearDraft,
    loadDraft,
    hasDraft,
  };
}
