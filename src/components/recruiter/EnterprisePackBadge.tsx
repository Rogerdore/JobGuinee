import React from 'react';
import { Shield, TrendingUp, AlertTriangle } from 'lucide-react';
import { useEnterpriseSubscription } from '../../hooks/useEnterpriseSubscription';

interface EnterprisePackBadgeProps {
  companyId: string | null | undefined;
  showLimits?: boolean;
  showROI?: boolean;
}

export function EnterprisePackBadge({ companyId, showLimits = true, showROI = false }: EnterprisePackBadgeProps) {
  const {
    subscription,
    loading,
    getPackBadge,
    getLimits,
    isNearLimit,
    hasActiveSubscription
  } = useEnterpriseSubscription(companyId);

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-48"></div>
      </div>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <Shield className="w-5 h-5 text-blue-600 mr-2" />
          <span className="font-semibold text-blue-900">Aucun pack actif</span>
        </div>
        <p className="text-sm text-blue-700 mb-3">
          Souscrivez à un pack Enterprise pour débloquer toutes les fonctionnalités
        </p>
        <a
          href="/enterprise-subscribe"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Voir les packs
        </a>
      </div>
    );
  }

  const badge = getPackBadge();
  const limits = getLimits();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Shield className="w-6 h-6 text-green-600 mr-2" />
          <div>
            <span className={`px-3 py-1 rounded-full text-sm font-bold text-white ${badge?.color}`}>
              {badge?.label}
            </span>
          </div>
        </div>
        {subscription.status === 'active' && (
          <span className="text-xs text-green-600 font-medium">Actif</span>
        )}
      </div>

      {showLimits && limits && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Limites mensuelles</h4>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Offres actives</span>
              <span className="font-medium">
                {limits.activeJobs.current} / {limits.activeJobs.max}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  (limits.activeJobs.current / limits.activeJobs.max) > 0.8
                    ? 'bg-red-500'
                    : 'bg-green-500'
                }`}
                style={{
                  width: `${Math.min(100, (limits.activeJobs.current / limits.activeJobs.max) * 100)}%`
                }}
              />
            </div>
          </div>

          {!limits.cvViews.unlimited && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">CV consultés</span>
                <span className="font-medium">
                  {limits.cvViews.current} / {limits.cvViews.max}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    isNearLimit('cv') ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (limits.cvViews.current / (limits.cvViews.max || 1)) * 100)}%`
                  }}
                />
              </div>
              {isNearLimit('cv') && (
                <div className="flex items-center mt-1 text-xs text-orange-600">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Limite bientôt atteinte
                </div>
              )}
            </div>
          )}

          {limits.cvViews.unlimited && (
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm text-green-800 font-medium">
                ✨ CV illimités
              </p>
            </div>
          )}

          {!limits.matchingAI.unlimited && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Matching IA</span>
                <span className="font-medium">
                  {limits.matchingAI.current} / {limits.matchingAI.max}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    isNearLimit('matching') ? 'bg-red-500' : 'bg-purple-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (limits.matchingAI.current / (limits.matchingAI.max || 1)) * 100)}%`
                  }}
                />
              </div>
              {isNearLimit('matching') && (
                <div className="flex items-center mt-1 text-xs text-orange-600">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Limite bientôt atteinte
                </div>
              )}
            </div>
          )}

          {limits.matchingAI.unlimited && (
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-sm text-purple-800 font-medium">
                ✨ Matching IA illimité (sous conditions)
              </p>
              {subscription.daily_matching_limit && (
                <p className="text-xs text-purple-600 mt-1">
                  Limite journalière: {subscription.matching_consumed_today || 0} / {subscription.daily_matching_limit}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {showROI && (
        <div className="border-t pt-4">
          <div className="flex items-center mb-2">
            <TrendingUp className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-sm font-semibold text-gray-700">ROI Estimé</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-600">Temps gagné</p>
              <p className="font-semibold text-gray-900">~45h</p>
            </div>
            <div>
              <p className="text-gray-600">Économies</p>
              <p className="font-semibold text-green-600">~2.2M GNF</p>
            </div>
          </div>
        </div>
      )}

      {subscription.end_date && (
        <div className="border-t pt-3">
          <p className="text-xs text-gray-500">
            Expire le {new Date(subscription.end_date).toLocaleDateString('fr-FR')}
          </p>
        </div>
      )}
    </div>
  );
}
