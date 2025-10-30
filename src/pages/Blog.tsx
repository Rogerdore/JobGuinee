import { useEffect, useState } from 'react';
import { FileText, Calendar, User, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  cover_image?: string;
  category?: string;
  views_count: number;
  created_at: string;
  author_id?: string;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (data) setPosts(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog & Actualités</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Conseils carrière, tendances RH et actualités du marché de l'emploi en Guinée
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-900"></div>
            <p className="mt-4 text-gray-600">Chargement des articles...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">Aucun article publié pour le moment</p>
            <p className="text-gray-400">Revenez bientôt pour découvrir nos contenus</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-xl border border-gray-200 hover:shadow-xl transition overflow-hidden cursor-pointer"
              >
                {post.cover_image ? (
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
                    <FileText className="w-16 h-16 text-white opacity-50" />
                  </div>
                )}

                <div className="p-6">
                  {post.category && (
                    <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full mb-3">
                      {post.category}
                    </span>
                  )}

                  <h2 className="font-bold text-xl text-gray-900 mb-3 line-clamp-2">
                    {post.title}
                  </h2>

                  {post.excerpt && (
                    <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(post.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Eye className="w-4 h-4" />
                      <span>{post.views_count}</span>
                    </div>
                  </div>

                  <button className="mt-4 w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 font-medium rounded-lg transition">
                    Lire l'article
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <section className="mt-16 bg-white rounded-2xl p-8 md:p-12 border border-gray-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Thématiques populaires
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Conseils carrière', icon: '🎯' },
              { name: 'Rédaction CV', icon: '📝' },
              { name: 'Entretiens', icon: '💼' },
              { name: 'Marché emploi', icon: '📊' },
              { name: 'Digitalisation RH', icon: '💻' },
              { name: 'Compétences', icon: '🎓' },
              { name: 'Leadership', icon: '👔' },
              { name: 'Entrepreneuriat', icon: '🚀' },
            ].map((theme) => (
              <button
                key={theme.name}
                className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition"
              >
                <div className="text-2xl mb-2">{theme.icon}</div>
                <div className="font-medium text-gray-900 text-sm">{theme.name}</div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
