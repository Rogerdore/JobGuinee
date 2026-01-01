import React, { useEffect, useState } from 'react';
import { Activity, TrendingUp, Database, RefreshCw } from 'lucide-react';
import { IAConfigCacheService } from '../../services/iaConfigCacheService';

export function CacheStatsPanel() {
  const [stats, setStats] = useState(IAConfigCacheService.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(IAConfigCacheService.getStats());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleClearCache = () => {
    if (confirm('Vider tout le cache ? Les configurations seront rechargées depuis la base de données.')) {
      IAConfigCacheService.clearCache();
      setStats(IAConfigCacheService.getStats());
    }
  };

  const handleResetStats = () => {
    IAConfigCacheService.resetStats();
    setStats(IAConfigCacheService.getStats());
  };

  const getHitRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getHitRateBg = (rate: number) => {
    if (rate >= 80) return 'bg-green-100';
    if (rate >= 60) return 'bg-yellow-100';
    return 'bg-orange-100';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Statistiques Cache</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleResetStats}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            Réinitialiser Stats
          </button>
          <button
            onClick={handleClearCache}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Vider Cache
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">Cache Hits</span>
          </div>
          <div className="text-2xl font-bold text-green-700">
            {stats.hits.toLocaleString()}
          </div>
          <div className="text-xs text-green-600 mt-1">
            Requêtes servies depuis le cache
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">Cache Misses</span>
          </div>
          <div className="text-2xl font-bold text-orange-700">
            {stats.misses.toLocaleString()}
          </div>
          <div className="text-xs text-orange-600 mt-1">
            Requêtes vers la base de données
          </div>
        </div>

        <div className={`border rounded-lg p-3 ${getHitRateBg(stats.hitRate)}`}>
          <div className="flex items-center gap-2 mb-1">
            <Activity className={`w-4 h-4 ${getHitRateColor(stats.hitRate)}`} />
            <span className={`text-sm font-medium ${getHitRateColor(stats.hitRate)}`}>
              Taux de Succès
            </span>
          </div>
          <div className={`text-2xl font-bold ${getHitRateColor(stats.hitRate)}`}>
            {stats.hitRate.toFixed(1)}%
          </div>
          <div className={`text-xs ${getHitRateColor(stats.hitRate)} mt-1`}>
            {stats.hitRate >= 80 ? 'Excellent' : stats.hitRate >= 60 ? 'Bon' : 'À améliorer'}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Entrées</span>
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {stats.size}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Configurations en cache
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Impact du Cache</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-blue-700 font-medium">Réduction Latence</div>
            <div className="text-blue-600">~50-100ms par appel</div>
          </div>
          <div>
            <div className="text-blue-700 font-medium">Économie DB</div>
            <div className="text-blue-600">
              {stats.hits > 0 ? `${stats.hits} requêtes évitées` : 'Aucune pour le moment'}
            </div>
          </div>
          <div>
            <div className="text-blue-700 font-medium">TTL Cache</div>
            <div className="text-blue-600">5 minutes</div>
          </div>
        </div>
      </div>
    </div>
  );
}
