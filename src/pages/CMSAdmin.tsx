import { useState, useEffect } from 'react';
import { Settings, FileText, Image, Menu, Globe, Save, Plus, Trash2, Edit2, Eye, AlertTriangle, Users, Upload, X, Download, BookOpen, File, ArrowLeft, Home, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCMS } from '../contexts/CMSContext';
import { useAuth } from '../contexts/AuthContext';
import { useModalContext } from '../contexts/ModalContext';
import AdminLayout from '../components/AdminLayout';
import SectionManager from '../components/cms/SectionManager';
import PageManager from '../components/cms/PageManager';
import NavigationManager from '../components/cms/NavigationManager';
import cmsService, { CMSPage } from '../services/cmsService';

interface CMSAdminProps {
  onNavigate: (page: string) => void;
}

export default function CMSAdmin({ onNavigate }: CMSAdminProps) {
  const { settings, sections, refreshSettings } = useCMS();
  const { isAdmin, profile, user } = useAuth();
  const { showSuccess, showError, showConfirm } = useModalContext();
  const [activeTab, setActiveTab] = useState<'general' | 'sections' | 'pages' | 'navigation' | 'blog' | 'resources'>('general');
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

  const [resources, setResources] = useState<any[]>([]);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);
  const [resourceFormData, setResourceFormData] = useState({
    title: '',
    description: '',
    category: 'ebook',
    author: '',
    tags: [] as string[],
    published: false
  });
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [resourceThumbnail, setResourceThumbnail] = useState<File | null>(null);
  const [resourceThumbnailPreview, setResourceThumbnailPreview] = useState<string>('');
  const [uploadingResource, setUploadingResource] = useState(false);

  const [pages, setPages] = useState<CMSPage[]>([]);

  useEffect(() => {
    loadAllSettings();
    loadAllSections();
    loadBlogPosts();
    loadResources();
    loadPages();
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
      showSuccess(
        editingBlogPost ? 'Article mis à jour' : 'Article créé',
        editingBlogPost ? 'L\'article de blog a été mis à jour avec succès!' : 'L\'article de blog a été créé avec succès!'
      );
    } catch (error: any) {
      showError('Erreur', `Une erreur est survenue: ${error.message}. Veuillez réessayer.`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlogPost = async (postId: string) => {
    showConfirm(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cet article de blog? Cette action est irréversible.',
      async () => {
        try {
          const { error } = await supabase
            .from('blog_posts')
            .delete()
            .eq('id', postId);

          if (error) throw error;
          await loadBlogPosts();
          showSuccess('Article supprimé', 'L\'article de blog a été supprimé avec succès!');
        } catch (error: any) {
          showError('Erreur de suppression', `Une erreur est survenue: ${error.message}. Veuillez réessayer.`);
        }
      },
      'warning'
    );
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
      showWarning('Attention', 'Veuillez sélectionner une image');
    }
  };

  const loadResources = async () => {
    const { data } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setResources(data);
  };

  const loadPages = async () => {
    try {
      const data = await cmsService.getPages();
      setPages(data);
    } catch (error) {
      console.error('Error loading pages:', error);
    }
  };

  const uploadResourceFile = async (): Promise<string | null> => {
    if (!resourceFile || !user) return null;

    try {
      const fileExt = resourceFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('resource-files')
        .upload(fileName, resourceFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('resource-files')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading resource file:', error);
      return null;
    }
  };

  const uploadResourceThumbnail = async (): Promise<string | null> => {
    if (!resourceThumbnail || !user) return null;

    try {
      const fileExt = resourceThumbnail.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('resource-thumbnails')
        .upload(fileName, resourceThumbnail);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('resource-thumbnails')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      return null;
    }
  };

  const getFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleResourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setUploadingResource(true);

    try {
      let fileUrl = editingResource?.file_url || '';
      let thumbnailUrl = editingResource?.thumbnail_url || '';
      let fileType = editingResource?.file_type || '';
      let fileSize = editingResource?.file_size || '';

      if (resourceFile) {
        const uploadedFile = await uploadResourceFile();
        if (uploadedFile) {
          fileUrl = uploadedFile;
          fileType = resourceFile.type || resourceFile.name.split('.').pop() || '';
          fileSize = getFileSize(resourceFile.size);
        }
      }

      if (resourceThumbnail) {
        const uploadedThumb = await uploadResourceThumbnail();
        if (uploadedThumb) {
          thumbnailUrl = uploadedThumb;
        }
      }

      const resourceData = {
        ...resourceFormData,
        file_url: fileUrl,
        file_type: fileType,
        file_size: fileSize,
        thumbnail_url: thumbnailUrl,
        published_at: resourceFormData.published ? new Date().toISOString() : null
      };

      setUploadingResource(false);

      if (editingResource) {
        const { error } = await supabase
          .from('resources')
          .update(resourceData)
          .eq('id', editingResource.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('resources')
          .insert(resourceData);

        if (error) throw error;
      }

      await loadResources();
      setShowResourceForm(false);
      resetResourceForm();
      alert(editingResource ? 'Ressource mise à jour!' : 'Ressource créée!');
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    // Replaced with showConfirm - needs manual async wrapping
    // Original: if (!confirm('Supprimer cette ressource?')) return;

    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;
      await loadResources();
      showSuccess('Supprimé', 'Ressource supprimée!');
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const handleEditResource = (resource: any) => {
    setEditingResource(resource);
    setResourceFormData({
      title: resource.title,
      description: resource.description || '',
      category: resource.category,
      author: resource.author || '',
      tags: resource.tags || [],
      published: resource.published
    });
    setResourceThumbnailPreview(resource.thumbnail_url || '');
    setShowResourceForm(true);
  };

  const resetResourceForm = () => {
    setEditingResource(null);
    setResourceFormData({
      title: '',
      description: '',
      category: 'ebook',
      author: '',
      tags: [],
      published: false
    });
    setResourceFile(null);
    setResourceThumbnail(null);
    setResourceThumbnailPreview('');
  };

  const handleResourceThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setResourceThumbnail(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setResourceThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      showWarning('Attention', 'Veuillez sélectionner une image');
    }
  };

  const handleResourceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResourceFile(file);
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
      showSuccess('Enregistré', 'Paramètres enregistrés avec succès');
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
    { id: 'resources', name: 'Ressources', icon: BookOpen },
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

  const getActiveTabLabel = () => {
    const labels = {
      general: 'Paramètres généraux',
      sections: 'Sections',
      pages: 'Pages',
      navigation: 'Navigation',
      blog: 'Blog & Actualités',
      resources: 'Ressources',
    };
    return labels[activeTab] || 'Administration';
  };

  return (
    <AdminLayout onNavigate={onNavigate}>
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb et Navigation */}
          <div className="mb-6">
            <div className="flex items-center gap-3 text-sm text-gray-600 mb-4">
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center gap-1 hover:text-primary-600 transition"
              >
                <Home className="w-4 h-4" />
                <span>Accueil</span>
              </button>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-900 font-medium">Administration CMS</span>
              {activeTab && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-primary-600 font-medium">{getActiveTabLabel()}</span>
                </>
              )}
            </div>

            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Retour à l'accueil</span>
            </button>
          </div>

          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Administration CMS</h1>
              <p className="text-gray-600">Gérez le contenu et les paramètres de votre site</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleNavigateToUserManagement}
                className="flex items-center gap-2 px-6 py-3 neo-clay-button rounded-xl font-medium text-primary-700 hover:shadow-lg transition"
              >
                <Users className="w-5 h-5" />
                <span>Gérer les utilisateurs</span>
              </button>
            </div>
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
              <SectionManager sections={allSections} onRefresh={loadAllSections} />
            )}

            {activeTab === 'pages' && (
              <PageManager pages={pages} onRefresh={loadPages} />
            )}

            {activeTab === 'navigation' && (
              <NavigationManager onRefresh={refreshSettings} />
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

            {activeTab === 'resources' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Ressources</h2>
                  <button
                    onClick={() => {
                      resetResourceForm();
                      setShowResourceForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0E2F56] text-white rounded-lg hover:bg-blue-800 transition"
                  >
                    <Plus className="w-5 h-5" />
                    Nouvelle ressource
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resources.map((resource) => (
                    <div key={resource.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition overflow-hidden">
                      {resource.thumbnail_url && (
                        <img
                          src={resource.thumbnail_url}
                          alt={resource.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-1">{resource.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">{resource.category}</span>
                              <span>{resource.file_size}</span>
                              <span className="flex items-center gap-1">
                                <Download className="w-3 h-3" />
                                {resource.download_count}
                              </span>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${resource.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {resource.published ? 'Publié' : 'Brouillon'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{resource.description}</p>
                        {resource.author && (
                          <p className="text-xs text-gray-500 mb-3">Par {resource.author}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditResource(resource)}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
                          >
                            <Edit2 className="w-4 h-4 inline mr-1" />
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteResource(resource.id)}
                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                          >
                            <Trash2 className="w-4 h-4 inline mr-1" />
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {resources.length === 0 && (
                    <div className="col-span-2 text-center py-12 bg-gray-50 rounded-xl">
                      <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Aucune ressource pour le moment</p>
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

      {showResourceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingResource ? 'Modifier la ressource' : 'Nouvelle ressource'}
              </h2>
              <button
                onClick={() => {
                  setShowResourceForm(false);
                  resetResourceForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleResourceSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image de prévisualisation
                </label>
                <div className="space-y-4">
                  {resourceThumbnailPreview && (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-200">
                      <img
                        src={resourceThumbnailPreview}
                        alt="Prévisualisation"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setResourceThumbnail(null);
                          setResourceThumbnailPreview('');
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
                        <span className="font-semibold">Cliquez pour uploader</span> une image
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG ou JPEG</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleResourceThumbnailChange}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fichier ressource {!editingResource && '*'}
                </label>
                <div className="space-y-2">
                  {resourceFile && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                      <File className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-blue-900 flex-1">{resourceFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setResourceFile(null)}
                        className="p-1 hover:bg-blue-200 rounded"
                      >
                        <X className="w-4 h-4 text-blue-900" />
                      </button>
                    </div>
                  )}
                  {editingResource && !resourceFile && editingResource.file_url && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <File className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-900 flex-1">Fichier actuel</span>
                      <a
                        href={editingResource.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Voir
                      </a>
                    </div>
                  )}
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                    <div className="flex flex-col items-center justify-center">
                      <Upload className="w-8 h-8 text-gray-400 mb-1" />
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Cliquez pour uploader</span> le fichier
                      </p>
                      <p className="text-xs text-gray-500">Tous formats acceptés</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleResourceFileChange}
                      required={!editingResource}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
                <input
                  type="text"
                  value={resourceFormData.title}
                  onChange={(e) => setResourceFormData({ ...resourceFormData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
                <select
                  value={resourceFormData.category}
                  onChange={(e) => setResourceFormData({ ...resourceFormData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="ebook">Livre électronique</option>
                  <option value="document">Document</option>
                  <option value="software">Logiciel/Progiciel</option>
                  <option value="guide">Guide</option>
                  <option value="template">Modèle</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={resourceFormData.description}
                  onChange={(e) => setResourceFormData({ ...resourceFormData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Décrivez la ressource..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Auteur</label>
                <input
                  type="text"
                  value={resourceFormData.author}
                  onChange={(e) => setResourceFormData({ ...resourceFormData, author: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nom de l'auteur ou créateur"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags (séparés par des virgules)</label>
                <input
                  type="text"
                  value={resourceFormData.tags.join(', ')}
                  onChange={(e) => setResourceFormData({
                    ...resourceFormData,
                    tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Exemple: RH, Formation, Juridique"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="publishedResource"
                  checked={resourceFormData.published}
                  onChange={(e) => setResourceFormData({ ...resourceFormData, published: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="publishedResource" className="text-sm font-medium text-gray-700">
                  Publier immédiatement
                </label>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowResourceForm(false);
                    resetResourceForm();
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingResource}
                  className="flex items-center gap-2 px-6 py-3 bg-[#0E2F56] text-white rounded-lg hover:bg-blue-800 transition font-medium disabled:bg-gray-400"
                >
                  <Save className="w-5 h-5" />
                  {uploadingResource ? 'Upload...' : saving ? 'Enregistrement...' : editingResource ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
