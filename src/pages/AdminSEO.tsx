import { useState, useEffect } from 'react';
import {
  Settings, Search, Link, BarChart3, FileText, Globe, Map,
  Save, RefreshCw, Download, TrendingUp, CheckCircle, AlertCircle,
  ArrowUp, ArrowDown, Minus, Activity, Eye, Zap, Brain, Award,
  Lightbulb, Target, Sparkles
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { seoService, SEOConfig, SEOPageMeta } from '../services/seoService';
import { sitemapService } from '../services/sitemapService';
import { seoAutoGeneratorService } from '../services/seoAutoGeneratorService';
import { seoSemanticAIService } from '../services/seoSemanticAIService';
import { seoInternalLinkingService } from '../services/seoInternalLinkingService';
import { seoScoringService } from '../services/seoScoringService';
import { supabase } from '../lib/supabase';

interface AdminSEOProps {
  onNavigate: (page: string) => void;
}

type Tab = 'config' | 'pages' | 'keywords' | 'generator' | 'sitemap' | 'analytics' | 'logs' | 'ai-content' | 'scoring' | 'links' | 'quick-wins';

export default function AdminSEO({ onNavigate }: AdminSEOProps) {
  const [activeTab, setActiveTab] = useState<Tab>('config');
  const [config, setConfig] = useState<SEOConfig | null>(null);
  const [pages, setPages] = useState<SEOPageMeta[]>([]);
  const [keywords, setKeywords] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [sitemapStats, setSitemapStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'config') {
        const data = await seoService.getConfig();
        setConfig(data);
      } else if (activeTab === 'pages') {
        const data = await seoService.getAllPageMeta();
        setPages(data);
      } else if (activeTab === 'keywords') {
        const { data } = await supabase
          .from('seo_keywords')
          .select('*')
          .order('is_tracked', { ascending: false })
          .order('keyword_type');
        setKeywords(data || []);
      } else if (activeTab === 'sitemap') {
        const stats = await sitemapService.getSitemapStats();
        setSitemapStats(stats);
      } else if (activeTab === 'logs') {
        const { data } = await supabase
          .from('seo_generation_logs')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(20);
        setLogs(data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showMessage('error', 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const saveConfig = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const success = await seoService.updateConfig(config);
      if (success) {
        showMessage('success', 'Configuration SEO enregistrée avec succès');
      } else {
        showMessage('error', 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      showMessage('error', 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const generateAll = async () => {
    setSaving(true);
    const startTime = Date.now();
    try {
      const { data: profile } = await supabase.auth.getUser();

      const result = await seoAutoGeneratorService.generateAll();
      const duration = Date.now() - startTime;

      await supabase.from('seo_generation_logs').insert({
        generation_type: 'all',
        pages_created: result.total,
        pages_updated: 0,
        pages_failed: 0,
        total_pages: result.total,
        duration_ms: duration,
        triggered_by: profile?.user?.id,
        status: 'completed',
        completed_at: new Date().toISOString(),
        details: result
      });

      showMessage('success', `${result.total} pages générées avec succès! (Jobs: ${result.jobs.created}, Secteurs: ${result.sectors.created}, Villes: ${result.cities.created})`);
      loadData();
    } catch (error) {
      showMessage('error', 'Erreur lors de la génération');
    } finally {
      setSaving(false);
    }
  };

  const downloadSitemap = async () => {
    try {
      await sitemapService.downloadSitemap();
      showMessage('success', 'Sitemap téléchargé avec succès');
    } catch (error) {
      showMessage('error', 'Erreur lors du téléchargement du sitemap');
    }
  };

  const tabs = [
    { id: 'config' as Tab, label: 'Configuration', icon: Settings },
    { id: 'pages' as Tab, label: 'Pages SEO', icon: FileText },
    { id: 'keywords' as Tab, label: 'Mots-clés', icon: Search },
    { id: 'generator' as Tab, label: 'Générateur', icon: RefreshCw },
    { id: 'sitemap' as Tab, label: 'Sitemap', icon: Map },
    { id: 'ai-content' as Tab, label: 'IA Contenu', icon: Brain, badge: 'Phase 3' },
    { id: 'scoring' as Tab, label: 'Scoring', icon: Award, badge: 'Phase 3' },
    { id: 'links' as Tab, label: 'Maillage', icon: Link, badge: 'Phase 3' },
    { id: 'quick-wins' as Tab, label: 'Quick Wins', icon: Zap, badge: 'Phase 3' },
    { id: 'analytics' as Tab, label: 'Analytics', icon: BarChart3 },
    { id: 'logs' as Tab, label: 'Logs', icon: Activity }
  ];

  return (
    <AdminLayout currentPage="admin-seo" onNavigate={onNavigate}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Globe className="w-8 h-8 text-blue-600" />
              Système SEO - Phase 3
              <span className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 text-sm rounded-full font-semibold">
                IA & Intelligence
              </span>
            </h1>
            <p className="text-gray-600">
              IA sémantique, Scoring avancé, Maillage intelligent et Optimisation continue
            </p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              {message.text}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200 overflow-x-auto">
              <nav className="flex">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap relative ${
                      activeTab === tab.id
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                    {tab.badge && (
                      <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full font-semibold">
                        NEW
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
                  <p className="mt-4 text-gray-600">Chargement...</p>
                </div>
              ) : (
                <>
                  {activeTab === 'config' && config && (
                    <ConfigTab config={config} setConfig={setConfig} onSave={saveConfig} saving={saving} />
                  )}

                  {activeTab === 'pages' && (
                    <PagesTab pages={pages} onRefresh={loadData} />
                  )}

                  {activeTab === 'keywords' && (
                    <KeywordsTab keywords={keywords} onRefresh={loadData} />
                  )}

                  {activeTab === 'generator' && (
                    <GeneratorTab onGenerateAll={generateAll} loading={saving} />
                  )}

                  {activeTab === 'sitemap' && (
                    <SitemapTab stats={sitemapStats} onDownload={downloadSitemap} onRefresh={loadData} />
                  )}

                  {activeTab === 'ai-content' && (
                    <AIContentTab />
                  )}

                  {activeTab === 'scoring' && (
                    <ScoringTab />
                  )}

                  {activeTab === 'links' && (
                    <InternalLinksTab />
                  )}

                  {activeTab === 'quick-wins' && (
                    <QuickWinsTab />
                  )}

                  {activeTab === 'analytics' && (
                    <AnalyticsTab />
                  )}

                  {activeTab === 'logs' && (
                    <LogsTab logs={logs} onRefresh={loadData} />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function ConfigTab({ config, setConfig, onSave, saving }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom du site
          </label>
          <input
            type="text"
            value={config.site_name}
            onChange={(e) => setConfig({ ...config, site_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Slogan
          </label>
          <input
            type="text"
            value={config.site_tagline}
            onChange={(e) => setConfig({ ...config, site_tagline: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Titre par défaut
        </label>
        <input
          type="text"
          value={config.default_title}
          onChange={(e) => setConfig({ ...config, default_title: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description par défaut
        </label>
        <textarea
          value={config.default_description}
          onChange={(e) => setConfig({ ...config, default_description: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL du site
          </label>
          <input
            type="text"
            value={config.site_url}
            onChange={(e) => setConfig({ ...config, site_url: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Twitter Handle
          </label>
          <input
            type="text"
            value={config.twitter_handle || ''}
            onChange={(e) => setConfig({ ...config, twitter_handle: e.target.value })}
            placeholder="@jobguinee"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.enable_indexation}
            onChange={(e) => setConfig({ ...config, enable_indexation: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Activer l'indexation</span>
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}

function PagesTab({ pages, onRefresh }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Pages SEO ({pages.length})
        </h3>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          Actualiser
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Page
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Titre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priorité
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                État
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pages.map((page: SEOPageMeta) => (
              <tr key={page.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">
                  {page.page_path}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                    {page.page_type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {page.title}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {page.priority}
                </td>
                <td className="px-6 py-4 text-sm">
                  {page.is_active ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      Actif
                    </span>
                  ) : (
                    <span className="text-gray-400">Inactif</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KeywordsTab({ keywords, onRefresh }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Mots-clés suivis ({keywords.length})
        </h3>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          Actualiser
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {keywords.map((keyword: any) => (
          <div key={keyword.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900">{keyword.keyword}</h4>
              <span className={`px-2 py-1 rounded text-xs ${
                keyword.keyword_type === 'primary'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {keyword.keyword_type}
              </span>
            </div>

            {keyword.target_url && (
              <p className="text-sm text-gray-600 mb-2">{keyword.target_url}</p>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Position: {keyword.current_rank || 'N/A'}
              </span>
              {keyword.is_tracked && (
                <span className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  Suivi actif
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GeneratorTab({ onGenerateAll, loading }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          Génération complète automatique
        </h3>
        <p className="text-gray-600 mb-4">
          Génère automatiquement toutes les pages SEO: emplois, secteurs, villes, blog et formations.
        </p>

        <button
          onClick={onGenerateAll}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Génération en cours...' : 'Générer toutes les pages'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-gray-900">Pages emplois</h4>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Meta tags et schemas pour toutes les offres
          </p>
          <div className="text-xs text-gray-500">
            ✓ Titre SEO optimisé<br/>
            ✓ Description accrocheuse<br/>
            ✓ Schema JobPosting
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Search className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-gray-900">Pages secteurs</h4>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Pages optimisées par secteur d'activité
          </p>
          <div className="text-xs text-gray-500">
            ✓ URL propre /jobs?sector=XXX<br/>
            ✓ Mots-clés ciblés<br/>
            ✓ Breadcrumb schema
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Map className="w-5 h-5 text-orange-600" />
            <h4 className="font-semibold text-gray-900">Pages villes</h4>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Pages optimisées par ville
          </p>
          <div className="text-xs text-gray-500">
            ✓ URL propre /jobs?location=XXX<br/>
            ✓ SEO local<br/>
            ✓ Breadcrumb schema
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-gray-900">Blog & Formations</h4>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Articles de blog et formations
          </p>
          <div className="text-xs text-gray-500">
            ✓ Schema Article<br/>
            ✓ Schema Course<br/>
            ✓ Meta tags optimisés
          </div>
        </div>
      </div>
    </div>
  );
}

function SitemapTab({ stats, onDownload, onRefresh }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Sitemap XML
        </h3>
        <div className="flex gap-3">
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Actualiser
          </button>
          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Télécharger sitemap.xml
          </button>
        </div>
      </div>

      {stats && (
        <>
          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-700 mb-2">
                {stats.totalURLs}
              </div>
              <div className="text-sm text-gray-600">URLs dans le sitemap</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(stats.byType).map(([type, count]: [string, any]) => (
              <div key={type} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900 mb-1">{count}</div>
                <div className="text-sm text-gray-600">{type}</div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>Dernière génération:</strong> {new Date(stats.lastGenerated).toLocaleString('fr-FR')}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Le sitemap est généré dynamiquement et inclut toutes les pages indexables du site.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-yellow-600" />
          Analytics SEO
        </h3>
        <p className="text-gray-600 mb-4">
          Fonctionnalité en développement. Les analytics SEO permettront de suivre:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
          <li>Positions Google par mot-clé</li>
          <li>Impressions et clics (Search Console)</li>
          <li>Taux de clic (CTR)</li>
          <li>Core Web Vitals par page</li>
          <li>Évolution des performances SEO</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-3xl font-bold text-gray-400 mb-2">--</div>
          <div className="text-sm text-gray-600">Impressions totales</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-3xl font-bold text-gray-400 mb-2">--</div>
          <div className="text-sm text-gray-600">Clics organiques</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-3xl font-bold text-gray-400 mb-2">-- %</div>
          <div className="text-sm text-gray-600">CTR moyen</div>
        </div>
      </div>
    </div>
  );
}

function LogsTab({ logs, onRefresh }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Historique des générations ({logs.length})
        </h3>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          Actualiser
        </button>
      </div>

      <div className="space-y-3">
        {logs.map((log: any) => (
          <div key={log.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-medium text-gray-900">
                  Génération: {log.generation_type}
                </h4>
                <p className="text-sm text-gray-600">
                  {new Date(log.started_at).toLocaleString('fr-FR')}
                </p>
              </div>
              <span className={`px-3 py-1 rounded text-sm ${
                log.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : log.status === 'failed'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {log.status}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Créées</div>
                <div className="font-semibold text-green-600">{log.pages_created}</div>
              </div>
              <div>
                <div className="text-gray-600">Mises à jour</div>
                <div className="font-semibold text-blue-600">{log.pages_updated}</div>
              </div>
              <div>
                <div className="text-gray-600">Erreurs</div>
                <div className="font-semibold text-red-600">{log.pages_failed}</div>
              </div>
              <div>
                <div className="text-gray-600">Durée</div>
                <div className="font-semibold text-gray-900">
                  {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIContentTab() {
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState<'job' | 'sector' | 'city' | 'blog' | 'formation'>('blog');
  const [suggestion, setSuggestion] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [contentIdeas, setContentIdeas] = useState<string[]>([]);

  const generateContent = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const result = await seoSemanticAIService.generateOptimizedContent(topic, contentType);
      setSuggestion(result);
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateIdeas = async () => {
    setLoading(true);
    try {
      const ideas = await seoSemanticAIService.generateContentIdeas(topic || 'emploi', 5);
      setContentIdeas(ideas);
    } catch (error) {
      console.error('Error generating ideas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          Génération de Contenu par IA Sémantique
        </h3>
        <p className="text-gray-600 mb-4">
          Générez automatiquement du contenu SEO optimisé avec des titres, descriptions et mots-clés intelligents.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex: Développeur Python, Finance, Conakry..."
            className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="job">Offre d'emploi</option>
            <option value="sector">Page secteur</option>
            <option value="city">Page ville</option>
            <option value="blog">Article de blog</option>
            <option value="formation">Formation</option>
          </select>
        </div>

        <div className="flex gap-3">
          <button
            onClick={generateContent}
            disabled={loading || !topic}
            className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <Sparkles className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Génération...' : 'Générer du contenu'}
          </button>
          <button
            onClick={generateIdeas}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50"
          >
            <Lightbulb className="w-5 h-5" />
            Idées de contenu
          </button>
        </div>
      </div>

      {suggestion && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Contenu Généré</h4>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Score SEO:</span>
              <span className={`px-3 py-1 rounded-full font-semibold ${
                suggestion.score >= 80 ? 'bg-green-100 text-green-800' :
                suggestion.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {suggestion.score}/100
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Titre optimisé</label>
              <div className="p-3 bg-gray-50 rounded border border-gray-200 text-gray-900">
                {suggestion.title}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <div className="p-3 bg-gray-50 rounded border border-gray-200 text-gray-900">
                {suggestion.description}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mots-clés ({suggestion.keywords.length})</label>
              <div className="flex flex-wrap gap-2">
                {suggestion.keywords.map((kw: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Structure H2 suggérée</label>
              <ul className="space-y-2">
                {suggestion.h2Suggestions.map((h2: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-gray-400">#{i + 1}</span>
                    <span className="text-gray-900">{h2}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {contentIdeas.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Idées de Contenu</h4>
          <div className="space-y-2">
            {contentIdeas.map((idea, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-900">{idea}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoringTab() {
  const [pagePath, setPagePath] = useState('');
  const [audit, setAudit] = useState<any>(null);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGlobalStats();
  }, []);

  const loadGlobalStats = async () => {
    try {
      const stats = await seoScoringService.auditAllPages(50);
      setGlobalStats(stats);
    } catch (error) {
      console.error('Error loading global stats:', error);
    }
  };

  const auditPage = async () => {
    if (!pagePath) return;
    setLoading(true);
    try {
      const result = await seoScoringService.auditPage(pagePath);
      setAudit(result);
    } catch (error) {
      console.error('Error auditing page:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-600" />
          Scoring SEO Avancé
        </h3>
        <p className="text-gray-600 mb-4">
          Analysez vos pages et obtenez un score détaillé (0-100) avec des recommandations concrètes.
        </p>

        <div className="flex gap-3">
          <input
            type="text"
            value={pagePath}
            onChange={(e) => setPagePath(e.target.value)}
            placeholder="Ex: /job-detail/123 ou /jobs?sector=IT"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
          <button
            onClick={auditPage}
            disabled={loading || !pagePath}
            className="flex items-center gap-2 px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
          >
            <Target className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Analyse...' : 'Analyser'}
          </button>
        </div>
      </div>

      {globalStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-3xl font-bold text-gray-900 mb-1">{globalStats.totalPages}</div>
            <div className="text-sm text-gray-600">Pages analysées</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-3xl font-bold text-green-600 mb-1">{globalStats.averageScore}</div>
            <div className="text-sm text-gray-600">Score moyen</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-3xl font-bold text-red-600 mb-1">{globalStats.criticalIssues}</div>
            <div className="text-sm text-gray-600">Erreurs critiques</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-3xl font-bold text-yellow-600 mb-1">{globalStats.warnings}</div>
            <div className="text-sm text-gray-600">Avertissements</div>
          </div>
        </div>
      )}

      {audit && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">{audit.pagePath}</h4>
              <div className="text-right">
                <div className="text-4xl font-bold text-gray-900 mb-1">{audit.score.overall}</div>
                <div className="text-sm text-gray-600">Score Global</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">{audit.score.technical}</div>
                <div className="text-xs text-gray-600">Technique</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">{audit.score.content}</div>
                <div className="text-xs text-gray-600">Contenu</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">{audit.score.onPage}</div>
                <div className="text-xs text-gray-600">On-Page</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">{audit.score.offPage}</div>
                <div className="text-xs text-gray-600">Off-Page</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Forces ({audit.score.details.strengths.length})
                </h5>
                <ul className="space-y-1">
                  {audit.score.details.strengths.map((s: string, i: number) => (
                    <li key={i} className="text-sm text-gray-700">✓ {s}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h5 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Faiblesses ({audit.score.details.weaknesses.length})
                </h5>
                <ul className="space-y-1">
                  {audit.score.details.weaknesses.map((w: string, i: number) => (
                    <li key={i} className="text-sm text-gray-700">✗ {w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {audit.score.details.actionItems.length > 0 && (
            <div className="border-t pt-4">
              <h5 className="font-semibold text-gray-900 mb-3">Actions Prioritaires</h5>
              <div className="space-y-2">
                {audit.score.details.actionItems.slice(0, 5).map((item: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      item.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      item.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.priority.toUpperCase()}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.title}</div>
                      <div className="text-sm text-gray-600">{item.description}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Impact: {item.impact}/10 • Effort: {item.effort}/10
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InternalLinksTab() {
  const [pagePath, setPagePath] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [linkAnalysis, setLinkAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLinkAnalysis();
  }, []);

  const loadLinkAnalysis = async () => {
    try {
      const analysis = await seoInternalLinkingService.analyzeInternalLinking();
      setLinkAnalysis(analysis);
    } catch (error) {
      console.error('Error loading link analysis:', error);
    }
  };

  const generateLinks = async () => {
    if (!pagePath) return;
    setLoading(true);
    try {
      const links = await seoInternalLinkingService.generateLinkSuggestions(pagePath, 10);
      setSuggestions(links);
    } catch (error) {
      console.error('Error generating links:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildNetwork = async () => {
    setLoading(true);
    try {
      await seoInternalLinkingService.buildLinkNetwork();
      await loadLinkAnalysis();
    } catch (error) {
      console.error('Error building network:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Link className="w-5 h-5 text-blue-600" />
          Maillage Interne Intelligent
        </h3>
        <p className="text-gray-600 mb-4">
          Générez automatiquement des suggestions de liens internes pertinents pour améliorer votre SEO.
        </p>

        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={pagePath}
            onChange={(e) => setPagePath(e.target.value)}
            placeholder="Ex: /job-detail/123"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={generateLinks}
            disabled={loading || !pagePath}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Link className="w-5 h-5" />
            {loading ? 'Génération...' : 'Générer'}
          </button>
        </div>

        <button
          onClick={buildNetwork}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-colors disabled:opacity-50"
        >
          <Zap className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Construction du réseau...' : 'Construire le réseau complet'}
        </button>
      </div>

      {linkAnalysis && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-3xl font-bold text-gray-900 mb-1">{linkAnalysis.totalLinks}</div>
            <div className="text-sm text-gray-600">Liens totaux</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-3xl font-bold text-green-600 mb-1">{linkAnalysis.internalLinks}</div>
            <div className="text-sm text-gray-600">Liens actifs</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-3xl font-bold text-red-600 mb-1">{linkAnalysis.orphanPages}</div>
            <div className="text-sm text-gray-600">Pages orphelines</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-3xl font-bold text-blue-600 mb-1">{linkAnalysis.pageRankScore}</div>
            <div className="text-sm text-gray-600">Score PageRank</div>
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Suggestions de Liens ({suggestions.length})
          </h4>
          <div className="space-y-3">
            {suggestions.map((link, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className={`px-2 py-1 rounded text-xs font-semibold ${
                  link.relevanceScore >= 80 ? 'bg-green-100 text-green-800' :
                  link.relevanceScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {link.relevanceScore}%
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{link.anchorText}</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                      {link.linkType}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    → {link.targetPage}
                  </div>
                  <div className="text-xs text-gray-500">{link.reason}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuickWinsTab() {
  const [quickWins, setQuickWins] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadQuickWins();
  }, []);

  const loadQuickWins = async () => {
    setLoading(true);
    try {
      const wins = await seoScoringService.getQuickWins();
      setQuickWins(wins);
    } catch (error) {
      console.error('Error loading quick wins:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Zap className="w-5 h-5 text-green-600" />
          Quick Wins SEO - ROI Maximal
        </h3>
        <p className="text-gray-600 mb-4">
          Actions à fort impact et faible effort. Priorisez ces optimisations pour des résultats rapides.
        </p>
        <button
          onClick={loadQuickWins}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-green-600"></div>
          <p className="mt-4 text-gray-600">Analyse en cours...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quickWins.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Excellent travail!
              </h4>
              <p className="text-gray-600">
                Aucun quick win détecté. Votre SEO est bien optimisé.
              </p>
            </div>
          ) : (
            quickWins.map((win, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                      <div className="text-2xl font-bold text-green-700">
                        {Math.round((win.impact / win.effort) * 10) / 10}
                      </div>
                    </div>
                    <div className="text-xs text-center text-gray-500 mt-1">ROI</div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{win.title}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        win.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        win.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        win.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {win.priority.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{win.description}</p>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-gray-600">Impact:</span>
                        <span className="font-semibold text-gray-900">{win.impact}/10</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-600">Effort:</span>
                        <span className="font-semibold text-gray-900">{win.effort}/10</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
