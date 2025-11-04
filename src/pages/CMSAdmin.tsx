import { useState, useEffect } from 'react';
import { Settings, FileText, Image, Menu, Globe, Save, Plus, Trash2, Edit2, Eye, AlertTriangle, Users, Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCMS } from '../contexts/CMSContext';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';

interface CMSAdminProps {
  onNavigate: (page: string) => void;
}

export default function CMSAdmin({ onNavigate }: CMSAdminProps) {
  const { settings, sections, refreshSettings } = useCMS();
  const { isAdmin, profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'sections' | 'pages' | 'navigation' | 'blog'>('general');
  const [editingSettings, setEditingSettings] = useState<Record<string, any>>({});
  const [allSettings, setAllSettings] = useState<any[]>([]);
  const [allSections, setAllSections] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [editingBlogPost, setEditingBlogPost] = useState<any>(null);
  const [blogFormData, setBlogFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    published: false
  });
  const [blogCoverImage, setBlogCoverImage] = useState<File | null>(null);
  const [blogCoverPreview, setBlogCoverPreview] = useState<string>('');
  const [uploadingBlogImage, setUploadingBlogImage] = useState(false);

  useEffect(() => {
    loadAllSettings();
    loadAllSections();
    loadBlogPosts();
  }, []);

  const loadAllSettings = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('*')
      .order('category, setting_key');

    if (data) {
      setAllSettings(data);
      const initialSettings: Record<string, any> = {};
      data.forEach(setting => {
        initialSettings[setting.setting_key] = setting.setting_value.value || setting.setting_value;
      });
      setEditingSettings(initialSettings);
    }
  };

  const loadAllSections = async () => {
    const { data } = await supabase
      .from('cms_sections')
      .select('*')
      .order('display_order');

    if (data) setAllSections(data);
  };

  const loadBlogPosts = async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setBlogPosts(data);
  };

  const uploadBlogCoverImage = async (): Promise<string | null> => {
    if (!blogCoverImage || !user) return null;

    try {
      const fileExt = blogCoverImage.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(fileName, blogCoverImage);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('blog-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading blog image:', error);
      return null;
    }
  };

  const handleBlogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setUploadingBlogImage(true);

    try {
      let imageUrl = editingBlogPost?.image_url || '';

      if (blogCoverImage) {
        const uploadedUrl = await uploadBlogCoverImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const postData = {
        ...blogFormData,
        image_url: imageUrl,
        author_id: profile?.id,
        published_at: blogFormData.published ? new Date().toISOString() : null
      };

      setUploadingBlogImage(false);

      if (editingBlogPost) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', editingBlogPost.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert(postData);

        if (error) throw error;
      }

      await loadBlogPosts();
      setShowBlogForm(false);
      resetBlogForm();
      alert(editingBlogPost ? 'Article mis à jour!' : 'Article créé!');
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlogPost = async (postId: string) => {
    if (!confirm('Supprimer cet article?')) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      await loadBlogPosts();
      alert('Article supprimé!');
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const handleEditBlogPost = (post: any) => {
    setEditingBlogPost(post);
    setBlogFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content || '',
      category: post.category || '',
      published: post.published
    });
    setBlogCoverPreview(post.image_url || '');
    setShowBlogForm(true);
  };

  const resetBlogForm = () => {
    setEditingBlogPost(null);
    setBlogFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: '',
      published: false
    });
    setBlogCoverImage(null);
    setBlogCoverPreview('');
  };

  const handleBlogCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setBlogCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBlogCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Veuillez sélectionner une image');
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(editingSettings).map(([key, value]) => ({
        setting_key: key,
        setting_value: { value },
        updated_at: new Date().toISOString(),
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('site_settings')
          .update({ setting_value: update.setting_value })
          .eq('setting_key', update.setting_key);

        if (error) throw error;
      }

      await refreshSettings();
      alert('Paramètres enregistrés avec succès');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSetting = (key: string, value: any) => {
    setEditingSettings(prev => ({ ...prev, [key]: value }));
  };

  const groupedSettings = allSettings.reduce((acc, setting) => {
    if (!acc[setting.category]) acc[setting.category] = [];
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, any[]>);

  const tabs = [
    { id: 'general', name: 'Paramètres généraux', icon: Settings },
    { id: 'sections', name: 'Sections', icon: FileText },
    { id: 'pages', name: 'Pages', icon: Eye },
    { id: 'navigation', name: 'Navigation', icon: Menu },
    { id: 'blog', name: 'Blog & Actualités', icon: FileText },
  ];

  const handleNavigateToUserManagement = () => {
    onNavigate('user-management');
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="neo-clay-card rounded-2xl p-8">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h2>
            <p className="text-gray-600 mb-6">
              Vous devez être administrateur pour accéder au CMS.
            </p>
            <button
              onClick={() => onNavigate('home')}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout onNavigate={onNavigate}>
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Administration CMS</h1>
              <p className="text-gray-600">Gérez le contenu et les paramètres de votre site</p>
            </div>
            <button
              onClick={handleNavigateToUserManagement}
              className="flex items-center gap-2 px-6 py-3 neo-clay-button rounded-xl font-medium text-primary-700 hover:shadow-lg transition"
            >
              <Users className="w-5 h-5" />
              <span>Gérer les utilisateurs</span>
            </button>
          </div>

        <div className="neo-clay-card rounded-2xl overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-1 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition ${
                      activeTab === tab.id
                        ? 'neo-clay-pressed text-primary-700'
                        : 'text-gray-600 hover:neo-clay'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'general' && (
              <div className="space-y-8">
                {Object.entries(groupedSettings).map(([category, categorySettings]) => (
                  <div key={category}>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 capitalize">
                      {category}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {categorySettings.map((setting) => (
                        <div key={setting.setting_key} className="neo-clay-pressed rounded-xl p-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {setting.description || setting.setting_key}
                          </label>
                          {typeof editingSettings[setting.setting_key] === 'boolean' ? (
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editingSettings[setting.setting_key] || false}
                                onChange={(e) => handleUpdateSetting(setting.setting_key, e.target.checked)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="text-sm text-gray-600">Activé</span>
                            </label>
                          ) : (
                            <input
                              type="text"
                              value={editingSettings[setting.setting_key] || ''}
                              onChange={(e) => handleUpdateSetting(setting.setting_key, e.target.value)}
                              className="w-full px-4 py-2 rounded-xl neo-clay-input focus:outline-none"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex justify-end pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-700 to-primary-600 hover:from-primary-800 hover:to-primary-700 text-white font-semibold rounded-xl transition shadow-lg disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'sections' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Sections de contenu</h2>
                  <button
                    onClick={() => alert('Fonctionnalité de création de section disponible prochainement')}
                    className="flex items-center gap-2 px-4 py-2 neo-clay-button rounded-xl text-primary-700 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Nouvelle section
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {allSections.map((section) => (
                    <div key={section.id} className="neo-clay-card rounded-xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{section.section_name}</h3>
                          <p className="text-sm text-gray-500">Clé: {section.section_key}</p>
                          <span className={`inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full ${
                            section.status === 'active' ? 'soft-gradient-green text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {section.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => alert('Fonctionnalité d\'édition disponible prochainement')}
                            className="p-2 neo-clay-button rounded-lg text-gray-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Voulez-vous vraiment supprimer cette section ?')) {
                                alert('Fonctionnalité de suppression disponible prochainement');
                              }
                            }}
                            className="p-2 neo-clay-button rounded-lg text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                        <pre className="whitespace-pre-wrap overflow-auto max-h-40">
                          {JSON.stringify(section.content, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'pages' && (
              <div className="text-center py-12">
                <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestion des pages</h3>
                <p className="text-gray-600 mb-6">Créez et gérez vos pages personnalisées</p>
                <button
                  onClick={() => alert('Fonctionnalité de création de page disponible prochainement')}
                  className="neo-clay-button px-6 py-3 rounded-xl font-medium text-primary-700"
                >
                  Créer une nouvelle page
                </button>
              </div>
            )}

            {activeTab === 'navigation' && (
              <div className="text-center py-12">
                <Menu className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestion de la navigation</h3>
                <p className="text-gray-600 mb-6">Configurez les menus de votre site</p>
                <button
                  onClick={() => alert('Fonctionnalité de gestion des menus disponible prochainement')}
                  className="neo-clay-button px-6 py-3 rounded-xl font-medium text-primary-700"
                >
                  Gérer les menus
                </button>
              </div>
            )}

            {activeTab === 'blog' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Articles de Blog</h2>
                  <button
                    onClick={() => {
                      resetBlogForm();
                      setShowBlogForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0E2F56] text-white rounded-lg hover:bg-blue-800 transition"
                  >
                    <Plus className="w-5 h-5" />
                    Nouvel article
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {blogPosts.map((post) => (
                    <div key={post.id} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition">
                      {post.image_url && (
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="w-32 h-32 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-gray-900">{post.title}</h3>
                            <p className="text-sm text-gray-600">{post.category}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${post.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {post.published ? 'Publié' : 'Brouillon'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{post.excerpt}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditBlogPost(post)}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
                          >
                            <Edit2 className="w-4 h-4 inline mr-1" />
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteBlogPost(post.id)}
                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                          >
                            <Trash2 className="w-4 h-4 inline mr-1" />
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {blogPosts.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Aucun article pour le moment</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {showBlogForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingBlogPost ? 'Modifier l\'article' : 'Nouvel article'}
              </h2>
              <button
                onClick={() => {
                  setShowBlogForm(false);
                  resetBlogForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleBlogSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image de Couverture *
                </label>
                <div className="space-y-4">
                  {blogCoverPreview && (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-200">
                      <img
                        src={blogCoverPreview}
                        alt="Couverture"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setBlogCoverImage(null);
                          setBlogCoverPreview('');
                        }}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Image className="w-10 h-10 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Cliquez pour uploader</span> l'image de couverture
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG ou JPEG</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleBlogCoverChange}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
                <input
                  type="text"
                  value={blogFormData.title}
                  onChange={(e) => setBlogFormData({ ...blogFormData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Slug *</label>
                <input
                  type="text"
                  value={blogFormData.slug}
                  onChange={(e) => setBlogFormData({ ...blogFormData, slug: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
                <select
                  value={blogFormData.category}
                  onChange={(e) => setBlogFormData({ ...blogFormData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Sélectionnez</option>
                  <option value="Conseils Carrière">Conseils Carrière</option>
                  <option value="Droit du Travail">Droit du Travail</option>
                  <option value="Éducation">Éducation</option>
                  <option value="Technologie">Technologie</option>
                  <option value="Économie">Économie</option>
                  <option value="Société">Société</option>
                  <option value="Actualités RH">Actualités RH</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Extrait</label>
                <textarea
                  value={blogFormData.excerpt}
                  onChange={(e) => setBlogFormData({ ...blogFormData, excerpt: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Court résumé de l'article..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contenu *</label>
                <textarea
                  value={blogFormData.content}
                  onChange={(e) => setBlogFormData({ ...blogFormData, content: e.target.value })}
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={blogFormData.published}
                  onChange={(e) => setBlogFormData({ ...blogFormData, published: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="published" className="text-sm font-medium text-gray-700">
                  Publier immédiatement
                </label>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowBlogForm(false);
                    resetBlogForm();
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingBlogImage}
                  className="flex items-center gap-2 px-6 py-3 bg-[#0E2F56] text-white rounded-lg hover:bg-blue-800 transition font-medium disabled:bg-gray-400"
                >
                  <Save className="w-5 h-5" />
                  {uploadingBlogImage ? 'Upload...' : saving ? 'Enregistrement...' : editingBlogPost ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
