import { useState, useEffect } from 'react';
import {
  Settings, Search, Link, BarChart3, FileText, Globe,
  Save, RefreshCw, Plus, Trash2, Edit, Eye, TrendingUp,
  CheckCircle, AlertCircle
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { seoService, SEOConfig, SEOPageMeta } from '../services/seoService';
import { supabase } from '../lib/supabase';

interface AdminSEOProps {
  onNavigate: (page: string) => void;
}

type Tab = 'config' | 'pages' | 'keywords' | 'generator';

export default function AdminSEO({ onNavigate }: AdminSEOProps) {
  const [activeTab, setActiveTab] = useState<Tab>('config');
  const [config, setConfig] = useState<SEOConfig | null>(null);
  const [pages, setPages] = useState<SEOPageMeta[]>([]);
  const [keywords, setKeywords] = useState<any[]>([]);
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

  const generateJobPages = async () => {
    setSaving(true);
    try {
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*, companies(*)')
        .eq('status', 'published')
        .limit(100);

      if (jobs) {
        let created = 0;
        for (const job of jobs) {
          const meta = await seoService.generateJobMeta(job);
          const success = await seoService.setPageMeta(meta);
          if (success) created++;
        }
        showMessage('success', `${created} pages d'emploi générées avec succès`);
        loadData();
      }
    } catch (error) {
      showMessage('error', 'Erreur lors de la génération des pages');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'config' as Tab, label: 'Configuration', icon: Settings },
    { id: 'pages' as Tab, label: 'Pages SEO', icon: FileText },
    { id: 'keywords' as Tab, label: 'Mots-clés', icon: Search },
    { id: 'generator' as Tab, label: 'Générateur', icon: RefreshCw }
  ];

  return (
    <AdminLayout currentPage="admin-seo" onNavigate={onNavigate}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Globe className="w-8 h-8 text-blue-600" />
              Système SEO
            </h1>
            <p className="text-gray-600">
              Gérez le référencement naturel de JobGuinée
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
            <div className="border-b border-gray-200">
              <nav className="flex">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
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
                    <GeneratorTab onGenerate={generateJobPages} loading={saving} />
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

function GeneratorTab({ onGenerate, loading }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-blue-600" />
          Générateur de pages SEO
        </h3>
        <p className="text-gray-600 mb-4">
          Génère automatiquement les meta données SEO pour toutes les offres d'emploi publiées.
        </p>

        <button
          onClick={onGenerate}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Génération en cours...' : 'Générer les pages emplois'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Pages secteurs</h4>
          <p className="text-sm text-gray-600 mb-4">
            Génère des pages optimisées SEO par secteur d'activité.
          </p>
          <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Générer
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Pages villes</h4>
          <p className="text-sm text-gray-600 mb-4">
            Génère des pages optimisées SEO par ville.
          </p>
          <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Générer
          </button>
        </div>
      </div>
    </div>
  );
}
