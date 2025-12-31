import { useState, useEffect, useCallback } from 'react';

export type AuthRedirectIntent = {
  type: 'apply_job' | 'save_job' | 'view_profile' | 'access_cvtheque' | 'purchase' | 'general';
  jobId?: string;
  profileId?: string;
  returnPath?: string;
  returnPage?: string;
  autoAction?: boolean;
  timestamp: number;
  metadata?: Record<string, any>;
};

const STORAGE_KEY = 'jobguinee_auth_redirect_intent';
const INTENT_EXPIRY_MS = 15 * 60 * 1000;

export function useAuthRedirect() {
  const [intent, setIntent] = useState<AuthRedirectIntent | null>(null);

  useEffect(() => {
    loadIntent();
  }, []);

  const loadIntent = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthRedirectIntent;

        if (Date.now() - parsed.timestamp < INTENT_EXPIRY_MS) {
          setIntent(parsed);
        } else {
          clearIntent();
        }
      }
    } catch (error) {
      console.error('Error loading auth redirect intent:', error);
      clearIntent();
    }
  }, []);

  const saveIntent = useCallback((newIntent: Omit<AuthRedirectIntent, 'timestamp'>) => {
    try {
      const intentWithTimestamp: AuthRedirectIntent = {
        ...newIntent,
        timestamp: Date.now()
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(intentWithTimestamp));
      setIntent(intentWithTimestamp);

      return true;
    } catch (error) {
      console.error('Error saving auth redirect intent:', error);
      return false;
    }
  }, []);

  const clearIntent = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setIntent(null);
    } catch (error) {
      console.error('Error clearing auth redirect intent:', error);
    }
  }, []);

  const getIntent = useCallback((): AuthRedirectIntent | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthRedirectIntent;

        if (Date.now() - parsed.timestamp < INTENT_EXPIRY_MS) {
          return parsed;
        } else {
          clearIntent();
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting auth redirect intent:', error);
      return null;
    }
  }, [clearIntent]);

  const hasIntent = useCallback(() => {
    return getIntent() !== null;
  }, [getIntent]);

  const createApplyJobIntent = useCallback((jobId: string, jobTitle?: string) => {
    return saveIntent({
      type: 'apply_job',
      jobId,
      returnPage: 'job-detail',
      autoAction: true,
      metadata: { jobTitle }
    });
  }, [saveIntent]);

  const createSaveJobIntent = useCallback((jobId: string) => {
    return saveIntent({
      type: 'save_job',
      jobId,
      returnPage: 'job-detail',
      autoAction: true
    });
  }, [saveIntent]);

  const createViewProfileIntent = useCallback((profileId: string) => {
    return saveIntent({
      type: 'view_profile',
      profileId,
      returnPage: 'public-profile',
      autoAction: false
    });
  }, [saveIntent]);

  const createCVThequeIntent = useCallback(() => {
    return saveIntent({
      type: 'access_cvtheque',
      returnPage: 'cvtheque',
      autoAction: false
    });
  }, [saveIntent]);

  return {
    intent,
    saveIntent,
    clearIntent,
    getIntent,
    hasIntent,
    loadIntent,
    createApplyJobIntent,
    createSaveJobIntent,
    createViewProfileIntent,
    createCVThequeIntent
  };
}

export function saveAuthRedirectIntent(intent: Omit<AuthRedirectIntent, 'timestamp'>): boolean {
  try {
    const intentWithTimestamp: AuthRedirectIntent = {
      ...intent,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(intentWithTimestamp));
    return true;
  } catch (error) {
    console.error('Error saving auth redirect intent:', error);
    return false;
  }
}

export function getAuthRedirectIntent(): AuthRedirectIntent | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AuthRedirectIntent;

      if (Date.now() - parsed.timestamp < INTENT_EXPIRY_MS) {
        return parsed;
      } else {
        clearAuthRedirectIntent();
        return null;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting auth redirect intent:', error);
    return null;
  }
}

export function clearAuthRedirectIntent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing auth redirect intent:', error);
  }
}

export function hasAuthRedirectIntent(): boolean {
  return getAuthRedirectIntent() !== null;
}
