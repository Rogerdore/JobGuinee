import { useEffect, useState } from 'react';
import {
  BookOpen,
  Download,
  Filter,
  Search,
  FileText,
  Laptop,
  Book,
  FileCode,
  FileSpreadsheet,
  DollarSign,
  Upload,
  Share2,
  Users,
  TrendingUp,
  Heart,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sampleResources } from '../utils/sampleResources';
import { sampleSuccessStories } from '../utils/sampleSuccessStories';
import PaidResourceModal from '../components/resources/PaidResourceModal';
import SuccessStoryCard from '../components/resources/SuccessStoryCard';
import SuccessStoryModal from '../components/resources/SuccessStoryModal';
import SubmitStoryModal from '../components/resources/SubmitStoryModal';

interface Resource {
  id: string;
  title: string;
  description?: string;
  category: string;
  file_url: string;
  file_size?: string;
  thumbnail_url?: string;
  author?: string;
  author_email?: string;
  author_phone?: string;
  tags?: string[];
  download_count: number;
  view_count?: number;
  rating?: number;
  is_paid: boolean;
  price?: number;
  published: boolean;
  created_at: string;
}

const categoryIcons: { [key: string]: any } = {
  ebook: Book,
  document: FileText,
  software: Laptop,
  guide: BookOpen,
  template: FileSpreadsheet,
  other: FileCode,
};

const categoryLabels: { [key: string]: string } = {
  ebook: 'Livre électronique',
  document: 'Document',
  software: 'Logiciel',
  guide: 'Guide',
  template: 'Modèle',
  other: 'Autre',
};

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [selectedPaidResource, setSelectedPaidResource] = useState<Resource | null>(null);
  const [showPaidModal, setShowPaidModal] = useState(false);

  const [successStories, setSuccessStories] = useState<any[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showSubmitStoryModal, setShowSubmitStoryModal] = useState(false);

  useEffect(() => {
    loadResources();
    loadSuccessStories();
  }, []);

  const loadResources = async () => {
    const { data } = await supabase
      .from('resources')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      setResources(data);
    } else {
      setResources(sampleResources as any);
    }
    setLoading(false);
  };

  const loadSuccessStories = async () => {
    const { data } = await supabase
      .from('success_stories')
      .select('*')
      .eq('published', true)
      .order('view_count', { ascending: false })
      .limit(6);

    if (data && data.length > 0) {
      setSuccessStories(data);
    } else {
      setSuccessStories(sampleSuccessStories as any);
    }
    setStoriesLoading(false);
  };

  const handleStoryClick = (story: any) => {
    setSelectedStory(story);
    setShowStoryModal(true);
  };

  const handleResourceDownload = async (resource: Resource) => {
    if (resource.is_paid) {
      setSelectedPaidResource(resource);
      setShowPaidModal(true);
      return;
    }

    await supabase.rpc('increment_resource_downloads', { resource_id: resource.id });
    window.open(resource.file_url, '_blank');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const filteredResources = resources
    .filter((resource) => {
      const matchesSearch =
        !searchQuery ||
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.author?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || resource.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'popular') {
        return b.download_count - a.download_count;
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

  const categories = [
    { id: 'all', name: 'Toutes les catégories', icon: Filter },
    { id: 'ebook', name: 'Livres électroniques', icon: Book },
    { id: 'document', name: 'Documents', icon: FileText },
    { id: 'software', name: 'Logiciels', icon: Laptop },
    { id: 'guide', name: 'Guides', icon: BookOpen },
    { id: 'template', name: 'Modèles', icon: FileSpreadsheet },
    { id: 'other', name: 'Autres', icon: FileCode },
  ];

  const stats = {
    total: resources.length,
    downloads: resources.reduce((sum, r) => sum + (r.download_count || 0), 0),
    categories: new Set(resources.map(r => r.category)).size,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-[#0E2F56] via-blue-800 to-[#0E2F56] text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Centre de Ressources</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Livres, documents, guides et outils pour booster votre carrière
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-blue-200" />
              <div className="text-3xl font-bold mb-1">{stats.total}</div>
              <div className="text-blue-200">Ressources disponibles</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <Download className="w-12 h-12 mx-auto mb-3 text-blue-200" />
              <div className="text-3xl font-bold mb-1">{stats.downloads}</div>
              <div className="text-blue-200">Téléchargements totaux</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <Filter className="w-12 h-12 mx-auto mb-3 text-blue-200" />
              <div className="text-3xl font-bold mb-1">{stats.categories}</div>
              <div className="text-blue-200">Catégories</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une ressource..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent"
            >
              <option value="recent">Plus récentes</option>
              <option value="popular">Plus populaires</option>
              <option value="title">Par titre (A-Z)</option>
            </select>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#0E2F56] via-blue-700 to-[#0E2F56] rounded-2xl shadow-xl overflow-hidden mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] gap-6 p-6 lg:p-10">
            <div className="text-white">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
                <Heart className="w-4 h-4" />
                Partagez vos connaissances
              </div>

              <h2 className="text-2xl lg:text-3xl font-bold mb-3">
                Contribuez à l'Écosystème Professionnel Guinéen
              </h2>

              <p className="text-base text-blue-100 mb-5 leading-relaxed">
                En partageant vos ressources, vous participez activement à l'enrichissement du monde du travail en Guinée.
                Votre contribution aide des milliers de professionnels à monter en compétences et à réussir leur carrière.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#FF8C00] rounded-lg flex items-center justify-center">
                    <Share2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm mb-0.5">Partagez vos savoirs</h3>
                    <p className="text-xs text-blue-200">Livres, guides, modèles et outils qui ont fait leurs preuves</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#FF8C00] rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm mb-0.5">Aidez la communauté</h3>
                    <p className="text-xs text-blue-200">Contribuez au développement professionnel de vos pairs</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#FF8C00] rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm mb-0.5">Valorisez votre expertise</h3>
                    <p className="text-xs text-blue-200">Proposez des ressources gratuites ou générez des revenus avec vos contenus premium</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF8C00] hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-sm"
              >
                <Upload className="w-4 h-4" />
                Publier une ressource
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="hidden lg:block relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl backdrop-blur-sm"></div>
              <div className="relative z-10 space-y-3 p-4">
                <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                      <Book className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 font-medium">Ressources partagées</div>
                      <div className="text-xl font-bold text-gray-900">{stats.total}+</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">Et ce nombre ne cesse de croître grâce à vous!</p>
                </div>

                <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg flex items-center justify-center">
                      <Download className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 font-medium">Téléchargements</div>
                      <div className="text-xl font-bold text-gray-900">{stats.downloads.toLocaleString()}+</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">Des professionnels ont déjà bénéficié de ces ressources</p>
                </div>

                <div className="bg-gradient-to-br from-[#FF8C00] to-orange-600 rounded-lg p-4 shadow-lg">
                  <p className="text-white text-xs italic leading-relaxed mb-2">
                    "Le partage de connaissances est la clé du développement professionnel collectif. Ensemble, construisons un écosystème RH guinéen plus fort et plus compétent."
                  </p>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-white" />
                    <span className="text-white font-bold text-xs">JobGuinée</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Catégories
              </h3>
              <div className="space-y-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const count = category.id === 'all'
                    ? resources.length
                    : resources.filter(r => r.category === category.id).length;

                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition ${
                        selectedCategory === category.id
                          ? 'bg-[#0E2F56] text-white'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span className="font-medium text-sm">{category.name}</span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        selectedCategory === category.id
                          ? 'bg-white/20'
                          : 'bg-gray-200'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <main className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500">Chargement des ressources...</p>
              </div>
            ) : filteredResources.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">Aucune ressource trouvée</p>
                <p className="text-gray-400 text-sm">Essayez de modifier vos critères de recherche</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredResources.map((resource) => {
                  const Icon = categoryIcons[resource.category] || FileCode;

                  return (
                    <div
                      key={resource.id}
                      className="bg-white rounded-xl border border-gray-200 hover:shadow-xl transition-all overflow-hidden group"
                    >
                      {resource.thumbnail_url ? (
                        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700">
                          <img
                            src={resource.thumbnail_url}
                            alt={resource.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute top-3 left-3 flex gap-2">
                            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-[#0E2F56] text-xs font-bold rounded-full">
                              {categoryLabels[resource.category]}
                            </span>
                            {resource.is_paid && (
                              <span className="px-3 py-1 bg-[#FF8C00]/90 backdrop-blur-sm text-white text-xs font-bold rounded-full flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                Payant
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="relative h-48 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                          <Icon className="w-20 h-20 text-white/30" />
                          <div className="absolute top-3 left-3 flex gap-2">
                            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-[#0E2F56] text-xs font-bold rounded-full">
                              {categoryLabels[resource.category]}
                            </span>
                            {resource.is_paid && (
                              <span className="px-3 py-1 bg-[#FF8C00]/90 backdrop-blur-sm text-white text-xs font-bold rounded-full flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                Payant
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="p-6">
                        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-[#0E2F56] transition">
                          {resource.title}
                        </h3>

                        {resource.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {resource.description}
                          </p>
                        )}

                        {resource.author && (
                          <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                            <span>Par</span>
                            <span className="font-medium">{resource.author}</span>
                          </p>
                        )}

                        {resource.tags && resource.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {resource.tags.slice(0, 3).map((tag: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded font-medium"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {resource.is_paid && resource.price && (
                          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-3 mb-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700 font-medium">Prix:</span>
                              <span className="text-xl font-bold text-[#FF8C00]">
                                {formatPrice(resource.price)}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Download className="w-3 h-3" />
                              <span>{resource.download_count} téléchargements</span>
                            </div>
                            {resource.file_size && (
                              <div className="text-xs text-gray-400">{resource.file_size}</div>
                            )}
                          </div>
                          <button
                            onClick={() => handleResourceDownload(resource)}
                            className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition font-medium text-sm ${
                              resource.is_paid
                                ? 'bg-[#FF8C00] hover:bg-orange-600'
                                : 'bg-[#0E2F56] hover:bg-blue-800'
                            }`}
                          >
                            {resource.is_paid ? (
                              <>
                                <DollarSign className="w-4 h-4" />
                                Acheter
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4" />
                                Télécharger
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>

        <section className="mt-16 mb-12">
          <div className="bg-gradient-to-br from-orange-50 via-white to-blue-50 rounded-2xl p-8 lg:p-12 border-2 border-orange-100">
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF8C00]/10 rounded-full text-sm font-bold text-[#FF8C00] mb-4">
                  <Heart className="w-4 h-4" />
                  Histoires Inspirantes
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
                  Success Stories & Autobiographies
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl">
                  Découvrez les parcours inspirants de professionnels guinéens qui ont marqué leur domaine.
                  Leurs histoires de réussite, défis surmontés et leçons apprises pour inspirer votre propre trajectoire.
                </p>
              </div>

              <button
                onClick={() => setShowSubmitStoryModal(true)}
                className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FF8C00] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Upload className="w-5 h-5" />
                Partager mon histoire
              </button>
            </div>

            {storiesLoading ? (
              <div className="text-center py-12">
                <div className="inline-block w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500">Chargement des histoires...</p>
              </div>
            ) : successStories.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">Aucune histoire publiée pour le moment</p>
                <p className="text-gray-400 text-sm">Soyez le premier à partager votre parcours inspirant!</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {successStories.map((story) => (
                    <SuccessStoryCard
                      key={story.id}
                      story={story}
                      onClick={() => handleStoryClick(story)}
                    />
                  ))}
                </div>

                <div className="bg-gradient-to-r from-[#0E2F56] to-blue-700 rounded-xl p-8 text-center">
                  <h3 className="text-2xl font-bold text-white mb-3">
                    Votre histoire peut inspirer des milliers de personnes
                  </h3>
                  <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                    Partagez votre parcours, vos défis surmontés et vos réussites. Devenez un modèle pour la prochaine génération
                    de professionnels guinéens et contribuez à créer un réseau d'inspiration et de mentorat.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white">
                      <Users className="w-5 h-5" />
                      <span className="font-medium">Inspirez la communauté</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white">
                      <TrendingUp className="w-5 h-5" />
                      <span className="font-medium">Créez des opportunités</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white">
                      <Share2 className="w-5 h-5" />
                      <span className="font-medium">Construisez votre réseau</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {selectedPaidResource && (
        <PaidResourceModal
          isOpen={showPaidModal}
          onClose={() => {
            setShowPaidModal(false);
            setSelectedPaidResource(null);
          }}
          resource={{
            title: selectedPaidResource.title,
            price: selectedPaidResource.price || 0,
            author: selectedPaidResource.author || 'Auteur',
            author_email: selectedPaidResource.author_email,
            author_phone: selectedPaidResource.author_phone,
          }}
        />
      )}

      {selectedStory && (
        <SuccessStoryModal
          isOpen={showStoryModal}
          onClose={() => {
            setShowStoryModal(false);
            setSelectedStory(null);
          }}
          story={selectedStory}
        />
      )}

      <SubmitStoryModal
        isOpen={showSubmitStoryModal}
        onClose={() => setShowSubmitStoryModal(false)}
        onSuccess={() => {
          loadSuccessStories();
        }}
      />
    </div>
  );
}
