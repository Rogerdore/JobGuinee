import { useState, useEffect } from 'react';
import { FileText, Check, Star, Crown, Search, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CVTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  preview_url?: string;
  is_premium: boolean;
  is_popular: boolean;
  color_schemes: string[];
  format: string;
}

interface CVTemplateMarketplaceProps {
  onSelectTemplate: (templateId: string) => void;
  selectedTemplateId?: string;
}

const DEFAULT_TEMPLATES: CVTemplate[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Design épuré et professionnel, idéal pour tous secteurs',
    category: 'Professionnel',
    is_premium: false,
    is_popular: true,
    color_schemes: ['blue', 'green', 'gray'],
    format: 'html'
  },
  {
    id: 'classic',
    name: 'Classique',
    description: 'Format traditionnel, sobre et formel',
    category: 'Professionnel',
    is_premium: false,
    is_popular: false,
    color_schemes: ['blue', 'gray', 'black'],
    format: 'html'
  },
  {
    id: 'creative',
    name: 'Créatif',
    description: 'Design innovant pour secteurs créatifs',
    category: 'Créatif',
    is_premium: true,
    is_popular: true,
    color_schemes: ['orange', 'purple', 'red'],
    format: 'html'
  },
  {
    id: 'executive',
    name: 'Exécutif',
    description: 'Élégant et raffiné pour postes de direction',
    category: 'Cadre',
    is_premium: true,
    is_popular: false,
    color_schemes: ['navy', 'burgundy', 'gold'],
    format: 'html'
  },
  {
    id: 'minimalist',
    name: 'Minimaliste',
    description: 'Simplicité maximale, impact optimal',
    category: 'Professionnel',
    is_premium: false,
    is_popular: true,
    color_schemes: ['gray', 'black', 'blue'],
    format: 'html'
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Parfait pour développeurs et profils IT',
    category: 'Technique',
    is_premium: true,
    is_popular: true,
    color_schemes: ['cyan', 'green', 'purple'],
    format: 'html'
  }
];

export default function CVTemplateMarketplace({ onSelectTemplate, selectedTemplateId }: CVTemplateMarketplaceProps) {
  const [templates, setTemplates] = useState<CVTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('ia_service_templates')
        .select('*')
        .eq('service_code', 'ai_cv_generation')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading templates:', error);
        setTemplates(DEFAULT_TEMPLATES);
      } else if (data && data.length > 0) {
        const mappedTemplates = data.map(t => ({
          id: t.id,
          name: t.name,
          description: t.description || '',
          category: t.category || 'Général',
          preview_url: t.preview_url,
          is_premium: t.is_premium || false,
          is_popular: false,
          color_schemes: ['blue', 'green', 'gray'],
          format: t.format || 'html'
        }));
        setTemplates(mappedTemplates);
      } else {
        setTemplates(DEFAULT_TEMPLATES);
      }
    } catch (error) {
      console.error('Error in loadTemplates:', error);
      setTemplates(DEFAULT_TEMPLATES);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];

  const filteredTemplates = templates.filter(template => {
    if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !template.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    if (selectedCategory !== 'all' && template.category !== selectedCategory) {
      return false;
    }

    if (showPremiumOnly && !template.is_premium) {
      return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
        <p className="mt-4 text-gray-600">Chargement des templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Templates de CV</h2>
          <p className="text-gray-600 mt-1">
            {filteredTemplates.length} template{filteredTemplates.length > 1 ? 's' : ''} disponible{filteredTemplates.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
            >
              <option value="all">Toutes catégories</option>
              {categories.filter(c => c !== 'all').map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showPremiumOnly}
              onChange={(e) => setShowPremiumOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Premium uniquement</span>
          </label>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const isSelected = selectedTemplateId === template.id;

          return (
            <div
              key={template.id}
              onClick={() => onSelectTemplate(template.id)}
              className={`relative bg-white rounded-xl border-2 p-6 cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              {template.is_premium && (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                    <Crown className="w-3 h-3" />
                    Premium
                  </span>
                </div>
              )}

              {template.is_popular && !template.is_premium && (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    <Star className="w-3 h-3" />
                    Populaire
                  </span>
                </div>
              )}

              {isSelected && (
                <div className="absolute top-3 left-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              <div className="mt-2 mb-4">
                <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 flex items-center justify-center">
                  <FileText className="w-16 h-16 text-gray-400" />
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {template.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                    {template.category}
                  </span>

                  <div className="flex items-center gap-1">
                    {template.color_schemes.slice(0, 3).map((color, index) => (
                      <div
                        key={index}
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{
                          backgroundColor: color === 'blue' ? '#3B82F6' :
                                         color === 'green' ? '#10B981' :
                                         color === 'gray' ? '#6B7280' :
                                         color === 'orange' ? '#F59E0B' :
                                         color === 'purple' ? '#8B5CF6' :
                                         color === 'red' ? '#EF4444' :
                                         color === 'cyan' ? '#06B6D4' :
                                         '#6B7280'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {isSelected && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                    <Check className="w-4 h-4" />
                    Template sélectionné
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun template trouvé
          </h3>
          <p className="text-gray-600">
            Essayez de modifier vos critères de recherche
          </p>
        </div>
      )}
    </div>
  );
}
