import { useEffect, useState } from 'react';
import {
  Globe, TrendingUp, Eye, MousePointerClick, ToggleLeft, ToggleRight,
  Plus, RefreshCw, BarChart3, AlertCircle, CheckCircle2, Zap
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { seoLandingPagesService, SEOLandingPage } from '../services/seoLandingPagesService';
import { b2bPipelineService } from '../services/b2bPipelineService';
import { supabase } from '../lib/supabase';

export default function AdminSEOLandingPages() {
  const [pages, setPages] = useState<SEOLandingPage[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [pagesResult, statsResult] = await Promise.all([
      seoLandingPagesService.getAll(),
      b2bPipelineService.getStatistics()
    ]);

    if (pagesResult.success) {
      setPages(pagesResult.data || []);
    }

    if (statsResult.success) {
      setStats(statsResult.data);
    }

    setIsLoading(false);
  };

  const handleInitialize = async () => {
    if (!confirm('Initialiser les 30 landing pages SEO pour la Guinée ? (Ceci va créer/mettre à jour les pages par défaut)')) {
      return;
    }

    setIsInitializing(true);

    try {
      // Call SQL function to initialize pages
      const { error } = await supabase.rpc('initialize_default_landing_pages');

      if (error) {
        throw error;
      }

      alert('Landing pages initialisées avec succès !');
      await loadData();
    } catch (error: any) {
      console.error('Error initializing:', error);
      alert('Erreur: ' + error.message);
    }

    setIsInitializing(false);
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    await seoLandingPagesService.toggleActive(id, !currentStatus);
    await loadData();
  };

  const filteredPages = filterType === 'all'
    ? pages
    : pages.filter(p => p.page_type === filterType);

  const pageTypes = [
    { value: 'all', label: 'Toutes les pages', count: pages.length },
    { value: 'job_by_profession', label: 'Par métier', count: pages.filter(p => p.page_type === 'job_by_profession').length },
    { value: 'job_by_sector', label: 'Par secteur', count: pages.filter(p => p.page_type === 'job_by_sector').length },
    { value: 'job_by_city', label: 'Par ville', count: pages.filter(p => p.page_type === 'job_by_city').length },
    { value: 'job_by_level', label: 'Par niveau', count: pages.filter(p => p.page_type === 'job_by_level').length }
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF8C00] border-t-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Globe className="w-8 h-8 text-[#FF8C00]" />
                  Landing Pages SEO Guinée
                </h1>
                <p className="text-gray-600 mt-1">
                  Gestion des 30 pages prioritaires pour la Guinée + Pipeline B2B
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={loadData}
                  className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Actualiser
                </button>
                <button
                  onClick={handleInitialize}
                  disabled={isInitializing}
                  className="px-4 py-2 bg-[#FF8C00] hover:bg-[#FF8C00]/90 text-white font-bold rounded-lg transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isInitializing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Initialisation...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Initialiser 30 pages
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Stats Pipeline B2B */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-100">Leads SEO Total</span>
                  <BarChart3 className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold">{stats.total_leads}</p>
                <p className="text-sm text-blue-100 mt-1">Ce mois: {stats.this_month}</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-100">Taux Conversion</span>
                  <TrendingUp className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold">{stats.conversion_rate.toFixed(1)}%</p>
                <p className="text-sm text-green-100 mt-1">Won: {stats.won_count}</p>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-orange-100">Valeur Totale</span>
                  <MousePointerClick className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold">{(stats.total_value / 1000).toFixed(0)}K</p>
                <p className="text-sm text-orange-100 mt-1">GNF</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-purple-100">Landing Pages</span>
                  <Globe className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold">{pages.length}</p>
                <p className="text-sm text-purple-100 mt-1">
                  Actives: {pages.filter(p => p.is_active).length}
                </p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {pageTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => setFilterType(type.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filterType === type.value
                      ? 'bg-[#0E2F56] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.label} ({type.count})
                </button>
              ))}
            </div>
          </div>

          {/* Landing Pages List */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Pages SEO ({filteredPages.length})
              </h2>
            </div>

            {filteredPages.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Aucune landing page trouvée. Cliquez sur "Initialiser 30 pages" pour commencer.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredPages.map(page => (
                  <div key={page.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">
                            {page.h1}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            page.page_type === 'job_by_profession' ? 'bg-blue-100 text-blue-700' :
                            page.page_type === 'job_by_sector' ? 'bg-green-100 text-green-700' :
                            page.page_type === 'job_by_city' ? 'bg-purple-100 text-purple-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {page.page_type.replace('job_by_', '').replace('_', ' ')}
                          </span>
                        </div>

                        <p className="text-gray-600 text-sm mb-3">
                          /{page.slug}
                        </p>

                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            {page.views_count || 0} vues
                          </div>
                          <div className="flex items-center gap-2">
                            <MousePointerClick className="w-4 h-4" />
                            {page.conversions_count || 0} conversions
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            {(page.conversion_rate || 0).toFixed(1)}% taux
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggle(page.id!, page.is_active!)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                            page.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {page.is_active ? (
                            <>
                              <ToggleRight className="w-5 h-5" />
                              Activée
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-5 h-5" />
                              Désactivée
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
