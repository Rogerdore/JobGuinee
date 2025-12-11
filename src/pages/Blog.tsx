import { useEffect, useState } from 'react';
import {
  FileText,
  Calendar,
  User,
  Eye,
  Search,
  TrendingUp,
  Briefcase,
  GraduationCap,
  Scale,
  Bot,
  Globe,
  Users,
  Building,
  Heart,
  MessageCircle,
  Share2,
  BookOpen,
  Clock,
  Tag,
  Filter,
  ChevronRight,
  Mail,
  Sparkles,
  X,
  Facebook,
  Linkedin,
  Send,
  Download,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sampleBlogPosts, blogCategories } from '../utils/sampleBlogData';
import { sampleResources } from '../utils/sampleResources';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  thumbnail_url?: string;
  category: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

const categories = [
  { name: 'Conseils Carrière', icon: Briefcase, color: 'bg-blue-100 text-blue-700', description: 'Astuces pour réussir votre carrière' },
  { name: 'Droit du Travail', icon: Scale, color: 'bg-purple-100 text-purple-700', description: 'Législation et réglementations' },
  { name: 'Technologies', icon: Bot, color: 'bg-indigo-100 text-indigo-700', description: 'IA et transformation digitale' },
  { name: 'Secteurs d\'Activité', icon: Building, color: 'bg-green-100 text-green-700', description: 'Opportunités par secteur' },
  { name: 'Entrepreneuriat', icon: TrendingUp, color: 'bg-orange-100 text-orange-700', description: 'Créer et développer son entreprise' },
  { name: 'Diversité & Inclusion', icon: Users, color: 'bg-pink-100 text-pink-700', description: 'Égalité et inclusion professionnelle' },
  { name: 'Tendances RH', icon: Globe, color: 'bg-teal-100 text-teal-700', description: 'Actualités RH en Guinée' },
  { name: 'Ressources Humaines', icon: Heart, color: 'bg-red-100 text-red-700', description: 'Gestion des talents' },
];

interface BlogProps {
  onNavigate: (page: string) => void;
}

export default function Blog({ onNavigate }: BlogProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [email, setEmail] = useState('');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [resourceCategory, setResourceCategory] = useState('all');

  useEffect(() => {
    loadPosts();
    loadResources();
  }, []);

  const loadPosts = async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      setPosts(data);
    } else {
      setPosts(sampleBlogPosts as any);
    }
    setLoading(false);
  };

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
    setResourcesLoading(false);
  };

  const handleResourceDownload = async (resourceId: string, fileUrl: string) => {
    await supabase.rpc('increment_resource_downloads', { resource_id: resourceId });
    window.open(fileUrl, '_blank');
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || post.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const featuredPosts = posts.slice(0, 3);
  const recentPosts = posts.slice(3, 9);

  const filteredResources = resources.filter((resource) => {
    return resourceCategory === 'all' || resource.category === resourceCategory;
  });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Merci ${email}! Vous recevrez bientôt nos meilleurs articles RH.`);
    setEmail('');
  };

  const handleShare = (platform: string, post: BlogPost) => {
    const url = `https://jobguinee.com/blog/${post.slug}`;
    const text = post.title;

    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`);
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Retour à l'accueil
          </button>
        </div>
      </div>
      <div
        className="relative bg-gradient-to-br from-[#0E2F56] via-blue-900 to-blue-800 text-white py-20"
        style={{
          backgroundImage:
            'url("https://images.pexels.com/photos/3184398/pexels-photo-3184398.jpeg?auto=compress&cs=tinysrgb&w=1920")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'multiply',
        }}
      >
        <div className="absolute inset-0 bg-[#0E2F56] opacity-90"></div>
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF8C00] rounded-full text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              Le média RH de référence en Guinée
            </div>
            <h1 className="text-5xl font-bold mb-4">Blog & Actualités</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Conseils carrière, tendances RH, droit du travail et actualités du marché de l'emploi en Guinée
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Rechercher un article, thème ou auteur..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-medium rounded-lg transition"
                >
                  <Filter className="w-5 h-5" />
                  Catégories
                </button>
              </div>

              {showFilters && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                        selectedCategory === 'all'
                          ? 'bg-[#0E2F56] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Tous les articles
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => setSelectedCategory(cat.name)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                          selectedCategory === cat.name
                            ? 'bg-[#0E2F56] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {featuredPosts.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Articles à la Une</h2>
                <p className="text-gray-600">Les articles les plus populaires et récents</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <article
                onClick={() => setSelectedPost(featuredPosts[0])}
                className="lg:row-span-2 bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer group border border-gray-200"
              >
                <div className="relative h-96 overflow-hidden">
                  {featuredPosts[0].thumbnail_url ? (
                    <img
                      src={featuredPosts[0].thumbnail_url}
                      alt={featuredPosts[0].title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#0E2F56] to-blue-700 flex items-center justify-center">
                      <FileText className="w-20 h-20 text-white opacity-50" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="px-4 py-2 bg-[#FF8C00] text-white text-xs font-bold rounded-full">
                      {featuredPosts[0].category}
                    </span>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-[#0E2F56] transition">
                    {featuredPosts[0].title}
                  </h3>
                  <p className="text-gray-600 mb-6 line-clamp-3">{featuredPosts[0].excerpt}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="font-medium">{featuredPosts[0].author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(featuredPosts[0].created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
              </article>

              <div className="space-y-6">
                {featuredPosts.slice(1, 3).map((post) => (
                  <article
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer group border border-gray-200"
                  >
                    <div className="flex gap-4">
                      <div className="relative w-48 h-48 flex-shrink-0 overflow-hidden">
                        {post.thumbnail_url ? (
                          <img
                            src={post.thumbnail_url}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#0E2F56] to-blue-700 flex items-center justify-center">
                            <FileText className="w-12 h-12 text-white opacity-50" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-6">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-[#0E2F56] text-xs font-bold rounded-full mb-3">
                          {post.category}
                        </span>
                        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-[#0E2F56] transition">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.excerpt}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{post.author}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(post.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Explorer par Catégorie</h2>
          <p className="text-gray-600 mb-8">Trouvez rapidement les articles qui vous intéressent</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((category) => {
              const Icon = category.icon;
              const categoryPosts = posts.filter((p) => p.category === category.name);
              return (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`p-6 rounded-xl border-2 transition-all hover:shadow-lg text-left group ${
                    selectedCategory === category.name
                      ? 'border-[#0E2F56] bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-[#0E2F56]'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{category.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{categoryPosts.length} articles</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#0E2F56] transition" />
                  </div>
                </button>
              );
            })}
          </div>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="mt-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <X className="w-4 h-4" />
              Voir tous les articles
            </button>
          )}
        </section>

        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Tous les Articles</h2>
              <p className="text-gray-600">
                {filteredPosts.length} article{filteredPosts.length > 1 ? 's' : ''} disponible{filteredPosts.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[#0E2F56]"></div>
              <p className="mt-4 text-gray-600">Chargement des articles...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-semibold">Aucun article trouvé</p>
              <p className="text-gray-400 mt-2">Essayez de modifier vos critères de recherche</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-4 px-6 py-2 bg-[#0E2F56] text-white rounded-lg hover:bg-blue-800 transition"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <article
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="bg-white rounded-xl border border-gray-200 hover:shadow-2xl hover:border-[#0E2F56] transition-all overflow-hidden cursor-pointer group"
                >
                  <div className="relative h-48 overflow-hidden">
                    {post.thumbnail_url ? (
                      <img
                        src={post.thumbnail_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#0E2F56] to-blue-700 flex items-center justify-center">
                        <FileText className="w-16 h-16 text-white opacity-50" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-white bg-opacity-95 text-[#0E2F56] text-xs font-bold rounded-full">
                        {post.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="font-bold text-xl text-gray-900 mb-3 line-clamp-2 group-hover:text-[#0E2F56] transition">
                      {post.title}
                    </h3>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{post.excerpt}</p>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[#FF8C00]" />
                        <span className="font-medium">{post.author}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#FF8C00]" />
                        <span>{new Date(post.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setSelectedPost(post)}
                        className="text-[#0E2F56] font-semibold text-sm hover:text-blue-800 transition flex items-center gap-1"
                      >
                        Lire l'article
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare('whatsapp', post);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                          title="Partager sur WhatsApp"
                        >
                          <Send className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare('linkedin', post);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                          title="Partager sur LinkedIn"
                        >
                          <Linkedin className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mb-16 bg-gradient-to-br from-[#0E2F56] to-blue-800 rounded-2xl p-12 text-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FF8C00] rounded-full mb-6">
                <Mail className="w-8 h-8" />
              </div>
              <h2 className="text-4xl font-bold mb-4">Restez Informé</h2>
              <p className="text-xl text-blue-100">
                Recevez chaque semaine les meilleurs articles RH, conseils carrière et actualités emploi directement dans votre boîte mail
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre adresse email"
                  required
                  className="flex-1 px-6 py-4 rounded-lg text-gray-900 focus:ring-2 focus:ring-[#FF8C00] focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-8 py-4 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-semibold rounded-lg transition whitespace-nowrap"
                >
                  S'abonner gratuitement
                </button>
              </div>
              <p className="text-sm text-blue-200 text-center mt-4">
                Rejoignez plus de 5 000 professionnels guinéens déjà abonnés
              </p>
            </form>
          </div>
        </section>

        <section className="mb-16">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Ressources Téléchargeables</h2>
              <p className="text-gray-600">Livres, documents, logiciels et autres ressources utiles pour votre carrière</p>
            </div>
            <div className="flex gap-2 items-center">
              <select
                value={resourceCategory}
                onChange={(e) => setResourceCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Toutes les catégories</option>
                <option value="ebook">Livres électroniques</option>
                <option value="document">Documents</option>
                <option value="software">Logiciels</option>
                <option value="guide">Guides</option>
                <option value="template">Modèles</option>
                <option value="other">Autres</option>
              </select>
            </div>
          </div>

          {resourcesLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Chargement des ressources...</p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune ressource disponible pour le moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource) => (
                <div key={resource.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-xl transition-all overflow-hidden group">
                  {resource.thumbnail_url && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={resource.thumbnail_url}
                        alt={resource.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-blue-100 text-[#0E2F56] text-xs font-bold rounded-full">
                        {resource.category === 'ebook' ? 'Livre électronique' :
                         resource.category === 'document' ? 'Document' :
                         resource.category === 'software' ? 'Logiciel' :
                         resource.category === 'guide' ? 'Guide' :
                         resource.category === 'template' ? 'Modèle' : 'Autre'}
                      </span>
                      <span className="text-xs text-gray-500">{resource.file_size}</span>
                    </div>

                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{resource.title}</h3>

                    {resource.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{resource.description}</p>
                    )}

                    {resource.author && (
                      <p className="text-xs text-gray-500 mb-3">Par {resource.author}</p>
                    )}

                    {resource.tags && resource.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {resource.tags.slice(0, 3).map((tag: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Download className="w-4 h-4" />
                        <span>{resource.download_count} téléchargements</span>
                      </div>
                      <button
                        onClick={() => handleResourceDownload(resource.id, resource.file_url)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#0E2F56] hover:bg-blue-800 text-white rounded-lg transition font-medium"
                      >
                        <Download className="w-4 h-4" />
                        Télécharger
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 p-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Écrivez pour JobGuinée</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Vous êtes expert RH, recruteur, coach ou professionnel ? Partagez votre expertise avec notre communauté
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-[#0E2F56]" />
              </div>
              <h3 className="font-bold text-lg mb-2">Partagez votre savoir</h3>
              <p className="text-gray-600 text-sm">Rédigez des articles sur votre domaine d'expertise</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[#FF8C00]" />
              </div>
              <h3 className="font-bold text-lg mb-2">Touchez des milliers de lecteurs</h3>
              <p className="text-gray-600 text-sm">Accédez à une large audience de professionnels</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Développez votre notoriété</h3>
              <p className="text-gray-600 text-sm">Positionnez-vous comme expert reconnu</p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => alert('Formulaire de soumission d\'article disponible prochainement')}
              className="px-8 py-3 bg-[#0E2F56] hover:bg-blue-800 text-white font-semibold rounded-lg transition inline-flex items-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Proposer un article
            </button>
          </div>
        </section>
      </div>

      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{selectedPost.title}</h3>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8">
              {selectedPost.thumbnail_url && (
                <img
                  src={selectedPost.thumbnail_url}
                  alt={selectedPost.title}
                  className="w-full h-96 object-cover rounded-xl mb-8"
                />
              )}

              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                <span className="px-4 py-2 bg-[#FF8C00] text-white text-sm font-bold rounded-full">
                  {selectedPost.category}
                </span>
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{selectedPost.author}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(selectedPost.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>

              <div className="prose prose-lg max-w-none mb-8">
                <p className="text-xl text-gray-700 leading-relaxed whitespace-pre-line">{selectedPost.content}</p>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <p className="text-sm text-gray-600 mb-4">Partager cet article :</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleShare('whatsapp', selectedPost)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
                  >
                    <Send className="w-4 h-4" />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => handleShare('linkedin', selectedPost)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </button>
                  <button
                    onClick={() => handleShare('facebook', selectedPost)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
                  >
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
