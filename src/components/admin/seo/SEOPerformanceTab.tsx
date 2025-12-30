import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Smartphone } from 'lucide-react';
import { seoCoreWebVitalsService } from '../../../services/seoCoreWebVitalsService';
import { supabase } from '../../../lib/supabase';

export default function SEOPerformanceTab() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [mobileScores, setMobileScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(24);

  useEffect(() => {
    loadPerformanceData();
  }, [selectedPeriod]);

  async function loadPerformanceData() {
    setLoading(true);
    try {
      const [metricsData, alertsData, mobileData] = await Promise.all([
        seoCoreWebVitalsService.getAverages(undefined, undefined, selectedPeriod),
        seoCoreWebVitalsService.getAlerts(false),
        supabase.from('seo_mobile_scores').select('*').order('updated_at', { ascending: false }).limit(10)
      ]);

      setMetrics(metricsData);
      setAlerts(alertsData);
      setMobileScores(mobileData.data || []);
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function resolveAlert(alertId: string) {
    try {
      const { data: profile } = await supabase.auth.getUser();
      await seoCoreWebVitalsService.resolveAlert(alertId, profile?.user?.id || '');
      loadPerformanceData();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  }

  function getScoreColor(score: number) {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  }

  function getMetricStatus(value: number, thresholds: { good: number; needs: number }) {
    if (value <= thresholds.good) return { color: 'green', label: 'Bon' };
    if (value <= thresholds.needs) return { color: 'orange', label: 'Moyen' };
    return { color: 'red', label: 'Mauvais' };
  }

  const avgMetrics = metrics.length > 0 ? {
    lcp: metrics.reduce((acc, m) => acc + (m.avg_lcp || 0), 0) / metrics.length,
    cls: metrics.reduce((acc, m) => acc + (m.avg_cls || 0), 0) / metrics.length,
    inp: metrics.reduce((acc, m) => acc + (m.avg_inp || 0), 0) / metrics.length,
    ttfb: metrics.reduce((acc, m) => acc + (m.avg_ttfb || 0), 0) / metrics.length,
    fcp: metrics.reduce((acc, m) => acc + (m.avg_fcp || 0), 0) / metrics.length
  } : { lcp: 0, cls: 0, inp: 0, ttfb: 0, fcp: 0 };

  const lcpStatus = getMetricStatus(avgMetrics.lcp, { good: 2500, needs: 4000 });
  const clsStatus = getMetricStatus(avgMetrics.cls, { good: 0.1, needs: 0.25 });
  const inpStatus = getMetricStatus(avgMetrics.inp, { good: 200, needs: 500 });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Performance & Core Web Vitals</h2>
          <p className="text-gray-600">Monitoring temps réel des performances de vos pages</p>
        </div>

        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value={1}>Dernière heure</option>
          <option value={24}>Dernières 24h</option>
          <option value={168}>7 derniers jours</option>
          <option value={720}>30 derniers jours</option>
        </select>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className={`bg-white rounded-lg border-2 p-6 ${
          lcpStatus.color === 'green' ? 'border-green-200' : lcpStatus.color === 'orange' ? 'border-orange-200' : 'border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">LCP</h3>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              lcpStatus.color === 'green' ? 'bg-green-100 text-green-700' :
              lcpStatus.color === 'orange' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
            }`}>
              {lcpStatus.label}
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">{avgMetrics.lcp.toFixed(0)}ms</p>
          <p className="text-sm text-gray-600">Largest Contentful Paint</p>
          <p className="text-xs text-gray-500 mt-2">Cible: &lt; 2.5s</p>
        </div>

        <div className={`bg-white rounded-lg border-2 p-6 ${
          clsStatus.color === 'green' ? 'border-green-200' : clsStatus.color === 'orange' ? 'border-orange-200' : 'border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">CLS</h3>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              clsStatus.color === 'green' ? 'bg-green-100 text-green-700' :
              clsStatus.color === 'orange' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
            }`}>
              {clsStatus.label}
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">{avgMetrics.cls.toFixed(3)}</p>
          <p className="text-sm text-gray-600">Cumulative Layout Shift</p>
          <p className="text-xs text-gray-500 mt-2">Cible: &lt; 0.1</p>
        </div>

        <div className={`bg-white rounded-lg border-2 p-6 ${
          inpStatus.color === 'green' ? 'border-green-200' : inpStatus.color === 'orange' ? 'border-orange-200' : 'border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">INP</h3>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              inpStatus.color === 'green' ? 'bg-green-100 text-green-700' :
              inpStatus.color === 'orange' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
            }`}>
              {inpStatus.label}
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">{avgMetrics.inp.toFixed(0)}ms</p>
          <p className="text-sm text-gray-600">Interaction to Next Paint</p>
          <p className="text-xs text-gray-500 mt-2">Cible: &lt; 200ms</p>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Alertes Performance ({alerts.length})
          </h3>

          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{alert.page_path}</p>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      <p className="text-xs text-orange-600 mt-2 font-medium uppercase">
                        {alert.severity} - {alert.alert_type}
                      </p>
                    </div>
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm whitespace-nowrap"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Résoudre
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mobileScores.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-600" />
            Scores Mobile
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            {mobileScores.slice(0, 4).map((score) => (
              <div key={score.page_path} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium text-gray-900 truncate flex-1">{score.page_path}</p>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${getScoreColor(score.mobile_score)}`}>
                    {score.mobile_score}/100
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">Performance</p>
                    <p className={`font-semibold ${getScoreColor(score.performance_score)}`}>
                      {score.performance_score}/100
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Accessibilité</p>
                    <p className={`font-semibold ${getScoreColor(score.accessibility_score)}`}>
                      {score.accessibility_score}/100
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">À propos des Core Web Vitals</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• <strong>LCP (Largest Contentful Paint)</strong>: Temps de chargement du contenu principal - Cible &lt; 2.5s</li>
          <li>• <strong>CLS (Cumulative Layout Shift)</strong>: Stabilité visuelle de la page - Cible &lt; 0.1</li>
          <li>• <strong>INP (Interaction to Next Paint)</strong>: Réactivité aux interactions - Cible &lt; 200ms</li>
          <li>• <strong>TTFB (Time to First Byte)</strong>: Temps de réponse serveur - Cible &lt; 800ms</li>
          <li>• <strong>FCP (First Contentful Paint)</strong>: Temps d'affichage du premier contenu - Cible &lt; 1.8s</li>
        </ul>
      </div>
    </div>
  );
}
