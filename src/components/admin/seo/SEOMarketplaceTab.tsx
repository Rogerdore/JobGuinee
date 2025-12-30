import React, { useState, useEffect } from 'react';
import { RefreshCw, Eye, EyeOff, TrendingUp, Plus, Search } from 'lucide-react';
import { seoMarketplaceService, MarketplacePage } from '../../../services/seoMarketplaceService';
import { supabase } from '../../../lib/supabase';

export default function SEOMarketplaceTab() {
  const [pages, setPages] = useState<MarketplacePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadPages();
  }, []);

  async function loadPages() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('seo_marketplace_pages')
        .select('*')
        .order('view_count', { ascending: false });

      if (!error && data) {
        setPages(data);
      }
    } catch (error) {
      console.error('Error loading marketplace pages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generatePages() {
    setGenerating(true);
    try {
      const result = await seoMarketplaceService.generateMarketplacePages();
      setMessage({
        type: 'success',
        text: `${result.created} pages créées, ${result.updated} mises à jour`
      });
      loadPages();
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la génération' });
    } finally {
      setGenerating(false);
      setTimeout(() => setMessage(null), 5000);
    }
  }

  async function togglePageStatus(slug: string, currentStatus: boolean) {
    try {
      await supabase
        .from('seo_marketplace_pages')
        .update({ is_active: !currentStatus })
        .eq('slug', slug);

      setPages(pages.map(p => p.slug === slug ? { ...p, is_active: !currentStatus } : p));
      setMessage({ type: 'success', text: 'Statut mis à jour' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour' });
    }
  }

  const filteredPages = pages.filter(page => {
    if (filter !== 'all' && page.page_type !== filter) return false;
    if (searchQuery && !page.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">SEO Marketplace Emploi</h2>
          <p className="text-gray-600">Pages SEO par métier, secteur, ville et niveau d'expérience</p>
        </div>

        <button
          onClick={generatePages}
          disabled={generating}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Génération...' : 'Générer les pages'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une page..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2">
            {['all', 'metier', 'secteur', 'ville', 'niveau'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type === 'all' ? 'Tous' : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
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
                    Offres
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vues
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPages.map((page) => (
                  <tr key={page.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{page.title}</p>
                        <p className="text-sm text-gray-500">/emplois/{page.slug}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium uppercase">
                        {page.page_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {page.job_count || 0}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-gray-900">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        {page.view_count || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        page.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {page.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => togglePageStatus(page.slug, page.is_active || false)}
                        className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        {page.is_active ? (
                          <>
                            <EyeOff className="w-4 h-4" />
                            <span className="text-sm">Désactiver</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            <span className="text-sm">Activer</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucune page trouvée</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Comment ça marche ?</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• Cliquez sur "Générer les pages" pour créer automatiquement les landing pages SEO</li>
          <li>• Les pages sont générées pour les métiers, secteurs et villes les plus populaires</li>
          <li>• Chaque page est optimisée avec meta tags, schema.org et canonical URL</li>
          <li>• Vous pouvez activer/désactiver chaque page individuellement</li>
        </ul>
      </div>
    </div>
  );
}
