import { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, GripVertical, Eye, EyeOff, ArrowLeft, List } from 'lucide-react';
import cmsService, { CMSSection } from '../../services/cmsService';

interface SectionManagerProps {
  sections: CMSSection[];
  onRefresh: () => void;
}

export default function SectionManager({ sections, onRefresh }: SectionManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingSection, setEditingSection] = useState<CMSSection | null>(null);
  const [formData, setFormData] = useState({
    section_key: '',
    section_name: '',
    content: '',
    status: 'active' as 'active' | 'inactive',
    display_order: 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let contentJson;
      try {
        contentJson = JSON.parse(formData.content);
      } catch {
        contentJson = { text: formData.content };
      }

      if (editingSection) {
        await cmsService.updateSection(editingSection.id, {
          section_key: formData.section_key,
          section_name: formData.section_name,
          content: contentJson,
          status: formData.status,
          display_order: formData.display_order,
        });
      } else {
        await cmsService.createSection({
          section_key: formData.section_key,
          section_name: formData.section_name,
          content: contentJson,
          status: formData.status,
          display_order: formData.display_order,
        });
      }

      setShowForm(false);
      resetForm();
      onRefresh();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (section: CMSSection) => {
    setEditingSection(section);
    setFormData({
      section_key: section.section_key,
      section_name: section.section_name,
      content: JSON.stringify(section.content, null, 2),
      status: section.status,
      display_order: section.display_order,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette section ?')) return;

    try {
      await cmsService.deleteSection(id);
      onRefresh();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const handleToggleStatus = async (section: CMSSection) => {
    try {
      await cmsService.updateSection(section.id, {
        status: section.status === 'active' ? 'inactive' : 'active',
      });
      onRefresh();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const resetForm = () => {
    setEditingSection(null);
    setFormData({
      section_key: '',
      section_name: '',
      content: '',
      status: 'active',
      display_order: sections.length,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Sections de contenu</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
        >
          <Plus className="w-4 h-4" />
          Nouvelle section
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sections.map((section) => (
          <div key={section.id} className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:shadow-lg transition">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3 flex-1">
                <GripVertical className="w-5 h-5 text-gray-400 mt-1 cursor-move" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{section.section_name}</h3>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      section.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {section.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Clé: <code className="bg-gray-100 px-2 py-0.5 rounded">{section.section_key}</code></p>
                  <p className="text-sm text-gray-500">Ordre d'affichage: {section.display_order}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleStatus(section)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition"
                  title={section.status === 'active' ? 'Désactiver' : 'Activer'}
                >
                  {section.status === 'active' ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleEdit(section)}
                  className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(section.id)}
                  className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <pre className="whitespace-pre-wrap overflow-auto max-h-40 font-mono text-xs">
                {JSON.stringify(section.content, null, 2)}
              </pre>
            </div>
          </div>
        ))}

        {sections.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-500">Aucune section pour le moment</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                      {editingSection ? 'Modifier la section' : 'Nouvelle section'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {editingSection ? 'Modifiez les informations de la section' : 'Créez une nouvelle section de contenu'}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clé de la section *
                </label>
                <input
                  type="text"
                  value={formData.section_key}
                  onChange={(e) => setFormData({ ...formData, section_key: e.target.value })}
                  placeholder="ex: hero_section, features_section"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Utilisée pour identifier la section (sans espaces)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom d'affichage *
                </label>
                <input
                  type="text"
                  value={formData.section_name}
                  onChange={(e) => setFormData({ ...formData, section_name: e.target.value })}
                  placeholder="ex: Section Hero, Fonctionnalités"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenu (JSON) *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={12}
                  placeholder='{"title": "Mon titre", "description": "Ma description"}'
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Format JSON valide requis</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
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
                  {saving ? 'Enregistrement...' : editingSection ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
