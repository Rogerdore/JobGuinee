import { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Eye, EyeOff, Globe, FileText, ArrowLeft } from 'lucide-react';
import cmsService, { CMSPage } from '../../services/cmsService';
import RichTextEditor from '../forms/RichTextEditor';

interface PageManagerProps {
  pages: CMSPage[];
  onRefresh: () => void;
}

export default function PageManager({ pages, onRefresh }: PageManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingPage, setEditingPage] = useState<CMSPage | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    template: 'default',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const keywords = formData.meta_keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k);

      const pageData = {
        title: formData.title,
        slug: formData.slug,
        content: { html: formData.content },
        meta_title: formData.meta_title || formData.title,
        meta_description: formData.meta_description,
        meta_keywords: keywords,
        status: formData.status,
        template: formData.template,
        ...(formData.status === 'published' && !editingPage?.published_at
          ? { published_at: new Date().toISOString() }
          : {}),
      };

      if (editingPage) {
        await cmsService.updatePage(editingPage.id, pageData);
      } else {
        await cmsService.createPage(pageData);
      }

      setShowForm(false);
      resetForm();
      onRefresh();
      alert(editingPage ? 'Page mise à jour!' : 'Page créée!');
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (page: CMSPage) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content?.html || JSON.stringify(page.content, null, 2),
      meta_title: page.meta_title || '',
      meta_description: page.meta_description || '',
      meta_keywords: page.meta_keywords?.join(', ') || '',
      status: page.status,
      template: page.template || 'default',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette page ?')) return;

    try {
      await cmsService.deletePage(id);
      onRefresh();
      alert('Page supprimée!');
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const handleToggleStatus = async (page: CMSPage) => {
    try {
      const newStatus = page.status === 'published' ? 'draft' : 'published';
      await cmsService.updatePage(page.id, {
        status: newStatus,
        ...(newStatus === 'published' && !page.published_at
          ? { published_at: new Date().toISOString() }
          : {}),
      });
      onRefresh();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const resetForm = () => {
    setEditingPage(null);
    setFormData({
      title: '',
      slug: '',
      content: '',
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      status: 'draft',
      template: 'default',
    });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: formData.slug || generateSlug(title),
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      published: 'bg-green-100 text-green-700',
      draft: 'bg-yellow-100 text-yellow-700',
      archived: 'bg-gray-100 text-gray-600',
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      published: 'Publiée',
      draft: 'Brouillon',
      archived: 'Archivée',
    };
    return labels[status as keyof typeof labels] || status;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Gestion des pages</h2>
          <p className="text-sm text-gray-600 mt-1">Créez et gérez vos pages personnalisées</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
        >
          <Plus className="w-4 h-4" />
          Nouvelle page
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map((page) => (
          <div key={page.id} className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{page.title}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <Globe className="w-3 h-3" />
                  <code className="bg-gray-100 px-2 py-0.5 rounded">/{page.slug}</code>
                </div>
                <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(page.status)}`}>
                  {getStatusLabel(page.status)}
                </span>
              </div>
            </div>

            {page.meta_description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{page.meta_description}</p>
            )}

            <div className="flex gap-2 pt-4 border-t border-gray-100">
              <button
                onClick={() => handleToggleStatus(page)}
                className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                title={page.status === 'published' ? 'Dépublier' : 'Publier'}
              >
                {page.status === 'published' ? (
                  <><EyeOff className="w-4 h-4 inline mr-1" /> Masquer</>
                ) : (
                  <><Eye className="w-4 h-4 inline mr-1" /> Publier</>
                )}
              </button>
              <button
                onClick={() => handleEdit(page)}
                className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(page.id)}
                className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {pages.length === 0 && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune page pour le moment</p>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Créer votre première page
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition group"
                    title="Retour à la liste"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:-translate-x-1 transition-transform" />
                  </button>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {editingPage ? 'Modifier la page' : 'Nouvelle page'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {editingPage ? 'Modifiez le contenu et les paramètres de la page' : 'Créez une nouvelle page personnalisée'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-red-100 rounded-lg transition text-gray-600 hover:text-red-600"
                  title="Fermer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre de la page *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug (URL) *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="mon-url-page"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">URL: /{formData.slug || 'mon-url-page'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenu de la page *
                </label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(value) => setFormData({ ...formData, content: value })}
                  placeholder="Écrivez le contenu de votre page..."
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO & Métadonnées</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Titre SEO
                    </label>
                    <input
                      type="text"
                      value={formData.meta_title}
                      onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder={formData.title || "Titre pour les moteurs de recherche"}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description SEO
                    </label>
                    <textarea
                      value={formData.meta_description}
                      onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Description de la page (150-160 caractères recommandés)"
                    />
                    <p className="mt-1 text-xs text-gray-500">{formData.meta_description.length} / 160 caractères</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mots-clés SEO
                    </label>
                    <input
                      type="text"
                      value={formData.meta_keywords}
                      onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="mot-clé1, mot-clé2, mot-clé3"
                    />
                    <p className="mt-1 text-xs text-gray-500">Séparés par des virgules</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut de publication
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Brouillon</option>
                    <option value="published">Publiée</option>
                    <option value="archived">Archivée</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template
                  </label>
                  <select
                    value={formData.template}
                    onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="default">Par défaut</option>
                    <option value="full-width">Pleine largeur</option>
                    <option value="sidebar">Avec sidebar</option>
                    <option value="landing">Landing page</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Enregistrement...' : editingPage ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
