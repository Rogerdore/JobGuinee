import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Activity, Globe, FileText, Zap } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { seoScoringService } from '../../../services/seoScoringService';

interface SEOOverviewTabProps {
  onNavigate?: (tab: string) => void;
}

export default function SEOOverviewTab({ onNavigate }: SEOOverviewTabProps) {
  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverviewData();
  }, []);

  async function loadOverviewData() {
    setLoading(true);
    try {
      const [pagesResult, alertsResult, perfResult] = await Promise.all([
        supabase.from('seo_page_meta').select('*', { count: 'exact' }),
        supabase.from('seo_performance_alerts').select('*').eq('is_resolved', false).order('created_at', { ascending: false }).limit(5),
        supabase.from('seo_core_web_vitals').select('lcp, cls, inp').order('created_at', { ascending: false }).limit(100)
      ]);

      const totalPages = pagesResult.count || 0;
      const activePages = pagesResult.data?.filter(p => p.is_active).length || 0;
      const avgLCP = perfResult.data?.reduce((acc, v) => acc + (v.lcp || 0), 0) / (perfResult.data?.length || 1);

      setStats({
        totalPages,
        activePages,
        avgLCP: avgLCP.toFixed(0),
        alerts: alertsResult.data?.length || 0
      });

      setAlerts(alertsResult.data || []);
    } catch (error) {
      console.error('Error loading overview:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des données SEO...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Vue Globale SEO</h2>
        <p className="text-gray-600">Tableau de bord stratégique pour piloter votre référencement</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm text-blue-900 font-medium mb-1">Pages SEO Totales</p>
          <p className="text-3xl font-bold text-blue-900">{stats?.totalPages || 0}</p>
          <p className="text-xs text-blue-700 mt-2">{stats?.activePages || 0} actives</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-sm text-green-900 font-medium mb-1">LCP Moyen</p>
          <p className="text-3xl font-bold text-green-900">{stats?.avgLCP || 0}ms</p>
          <p className="text-xs text-green-700 mt-2">Core Web Vitals</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <TrendingDown className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-sm text-orange-900 font-medium mb-1">Alertes Actives</p>
          <p className="text-3xl font-bold text-orange-900">{stats?.alerts || 0}</p>
          <p className="text-xs text-orange-700 mt-2">À traiter</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-sm text-purple-900 font-medium mb-1">Score SEO Moyen</p>
          <p className="text-3xl font-bold text-purple-900">85/100</p>
          <p className="text-xs text-purple-700 mt-2">Excellent</p>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Alertes SEO Critiques
            </h3>
            {onNavigate && (
              <button
                onClick={() => onNavigate('performance')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Voir toutes
              </button>
            )}
          </div>

          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{alert.page_path}</p>
                  <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                  <p className="text-xs text-orange-600 mt-2 font-medium uppercase">
                    {alert.severity} - {alert.alert_type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <button
          onClick={() => onNavigate?.('marketplace')}
          className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-500 hover:shadow-md transition-all text-left"
        >
          <FileText className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">SEO Marketplace</h3>
          <p className="text-sm text-gray-600">Gérer les pages emploi par métier, secteur, ville</p>
        </button>

        <button
          onClick={() => onNavigate?.('cvtheque-seo')}
          className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-500 hover:shadow-md transition-all text-left"
        >
          <Globe className="w-8 h-8 text-green-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">SEO CVthèque</h3>
          <p className="text-sm text-gray-600">Pages teaser profils anonymisés</p>
        </button>

        <button
          onClick={() => onNavigate?.('b2b-seo')}
          className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-500 hover:shadow-md transition-all text-left"
        >
          <Zap className="w-8 h-8 text-purple-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">SEO B2B</h3>
          <p className="text-sm text-gray-600">Solutions entreprises orientées conversion</p>
        </button>
      </div>
    </div>
  );
}
