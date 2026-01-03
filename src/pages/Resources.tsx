import { useState, useEffect } from 'react';
import { Download, Search, Filter, FileText, Book, Package, FileCode, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sampleResources } from '../utils/sampleResources';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  file_url: string;
  file_type: string;
  file_size: string;
  thumbnail_url: string;
  author: string;
  download_count: number;
  tags: string[];
  published: boolean;
  created_at: string;
}

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'all', name: 'Toutes les ressources', icon: Package },
    { id: 'guide', name: 'Guides', icon: Book },
    { id: 'document', name: 'Documents', icon: FileText },
    { id: 'template', name: 'Modèles', icon: FileCode },
    { id: 'ebook', name: 'E-books', icon: Book },
    { id: 'software', name: 'Logiciels', icon: Package }
  ];

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    filterResources();
  }, [searchQuery, selectedCategory, resources]);

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setResources(data);
      } else {
        setResources(sampleResources as Resource[]);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      setResources(sampleResources as Resource[]);
    } finally {
      setLoading(false);
    }
  };

  const filterResources = () => {
    let filtered = resources;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(r => r.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        r.tags.some(tag => tag.toLowerCase().includes(query)) ||
        r.author.toLowerCase().includes(query)
      );
    }

    setFilteredResources(filtered);
  };

  const handleDownload = async (resource: Resource) => {
    try {
      const { error } = await supabase
        .from('resources')
        .update({ download_count: resource.download_count + 1 })
        .eq('id', resource.id);

      if (error) throw error;

      if (resource.file_url && resource.file_url !== '#') {
        window.open(resource.file_url, '_blank');
      }

      const updatedResources = resources.map(r =>
        r.id === resource.id ? { ...r, download_count: r.download_count + 1 } : r
      );
      setResources(updatedResources);
    } catch (error) {
      console.error('Error updating download count:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.icon : FileText;
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return '📄';
    if (type.includes('doc')) return '📝';
    if (type.includes('xls')) return '📊';
    if (type.includes('zip')) return '🗂️';
    if (type.includes('exe') || type.includes('app')) return '💻';
    if (type.includes('epub')) return '📚';
    return '📁';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Chargement des ressources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-primary-600 to-purple-600 text-white mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Centre de Ressources
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez nos guides, documents, modèles et outils pour booster votre carrière en Guinée
          </p>
        </div>

        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher une ressource..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl neo-clay border-none focus:ring-2 focus:ring-primary-500 text-lg"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition ${
                    selectedCategory === category.id
                      ? 'neo-clay-pressed text-primary-700'
                      : 'neo-clay text-gray-700 hover:shadow-md'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {filteredResources.length === 0 ? (
          <div className="text-center py-16 neo-clay-card rounded-2xl">
            <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucune ressource trouvée
            </h3>
            <p className="text-gray-600">
              Essayez de modifier vos filtres ou votre recherche
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map(resource => {
              const CategoryIcon = getCategoryIcon(resource.category);
              return (
                <div
                  key={resource.id}
                  className="neo-clay-card rounded-2xl overflow-hidden hover:shadow-xl transition group"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={resource.thumbnail_url}
                      alt={resource.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium text-gray-700 flex items-center space-x-1">
                      <CategoryIcon className="w-4 h-4" />
                      <span className="capitalize">{resource.category}</span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">{getFileIcon(resource.file_type)}</span>
                      <span className="text-sm text-gray-500">{resource.file_size}</span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {resource.title}
                    </h3>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {resource.description}
                    </p>

                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <span>Par {resource.author}</span>
                      <span className="mx-2">•</span>
                      <span>{resource.download_count} téléchargements</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {resource.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium"
                        >
                          <Tag className="w-3 h-3" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => handleDownload(resource)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-medium hover:from-primary-700 hover:to-primary-800 transition shadow-lg hover:shadow-xl"
                    >
                      <Download className="w-5 h-5" />
                      <span>Télécharger</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-16 neo-clay-card rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Vous avez une ressource à partager ?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Vous êtes expert dans votre domaine ? Partagez vos connaissances avec la communauté JobGuinée
            et aidez les autres à progresser dans leur carrière.
          </p>
          <button
            onClick={() => window.location.href = 'mailto:contact@jobguinee.com?subject=Proposition de ressource'}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-primary-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-primary-700 transition shadow-lg"
          >
            <Package className="w-5 h-5" />
            <span>Proposer une ressource</span>
          </button>
        </div>
      </div>
    </div>
  );
}
