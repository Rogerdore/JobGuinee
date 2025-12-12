import { useState, useEffect, useCallback } from 'react';
import { EnterpriseSubscriptionService } from '../services/enterpriseSubscriptionService';

export function useEnterpriseSubscription(companyId: string | null | undefined) {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubscription = useCallback(async () => {
    if (!companyId) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await EnterpriseSubscriptionService.getActiveSubscription(companyId);
      setSubscription(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const checkFeatureAccess = useCallback(
    async (featureType: 'cv_view' | 'matching_ai' | 'job_post', count: number = 1) => {
      if (!companyId) {
        return {
          allowed: false,
          reason: 'no_company',
          message: 'Profil entreprise requis'
        };
      }

      try {
        const result = await EnterpriseSubscriptionService.checkFeatureAccess(
          companyId,
          featureType,
          count
        );
        return result;
      } catch (err: any) {
        return {
          allowed: false,
          reason: 'error',
          message: err.message
        };
      }
    },
    [companyId]
  );

  const trackUsage = useCallback(
    async (
      usageType: 'cv_view' | 'matching_ai' | 'export' | 'communication' | 'job_post' | 'interview_schedule',
      metadata: Record<string, any> = {}
    ) => {
      if (!companyId) return;

      try {
        await EnterpriseSubscriptionService.trackUsage(companyId, usageType, metadata);
        await loadSubscription();
      } catch (err: any) {
        console.error('Failed to track usage:', err);
      }
    },
    [companyId, loadSubscription]
  );

  const hasFeature = useCallback(
    (featureName: string) => {
      if (!subscription || !subscription.features) return false;
      return subscription.features.some((f: string) =>
        f.toLowerCase().includes(featureName.toLowerCase())
      );
    },
    [subscription]
  );

  const getPackBadge = () => {
    if (!subscription) return null;

    const badges: Record<string, { color: string; label: string }> = {
      enterprise_basic: { color: 'bg-blue-500', label: 'BASIC' },
      enterprise_pro: { color: 'bg-yellow-500', label: 'PRO' },
      enterprise_gold: { color: 'bg-orange-500', label: 'GOLD' },
      cabinet_rh: { color: 'bg-purple-500', label: 'CABINET RH' }
    };

    return badges[subscription.subscription_type] || null;
  };

  const getLimits = () => {
    if (!subscription) return null;

    return {
      activeJobs: {
        current: subscription.jobs_count || 0,
        max: subscription.max_active_jobs
      },
      cvViews: {
        current: subscription.cv_consumed || 0,
        max: subscription.monthly_cv_quota,
        unlimited: subscription.monthly_cv_quota === null
      },
      matchingAI: {
        current: subscription.matching_consumed || 0,
        max: subscription.max_monthly_matching,
        unlimited: subscription.max_monthly_matching === null
      }
    };
  };

  const isNearLimit = (limitType: 'cv' | 'matching' | 'jobs') => {
    if (!subscription) return false;

    if (limitType === 'cv') {
      if (!subscription.monthly_cv_quota) return false;
      const percentage = (subscription.cv_consumed / subscription.monthly_cv_quota) * 100;
      return percentage >= 80;
    }

    if (limitType === 'matching') {
      if (!subscription.max_monthly_matching) return false;
      const percentage = (subscription.matching_consumed / subscription.max_monthly_matching) * 100;
      return percentage >= 80;
    }

    return false;
  };

  return {
    subscription,
    loading,
    error,
    reload: loadSubscription,
    checkFeatureAccess,
    trackUsage,
    hasFeature,
    getPackBadge,
    getLimits,
    isNearLimit,
    hasActiveSubscription: !!subscription
  };
}
