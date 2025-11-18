import { useState, useEffect } from 'react';
import { Save, RefreshCw, Eye, EyeOff, ChevronUp, ChevronDown, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';

interface FormSection {
  id: string;
  section_key: string;
  section_title: string;
  section_order: number;
  title_style: {
    fontSize: string;
    fontWeight: string;
    textTransform: string;
    color: string;
  };
  is_active: boolean;
  icon_name: string;
  description: string;
}

const fontSizeOptions = [
  { value: 'xs', label: 'Très petit (xs)' },
  { value: 'sm', label: 'Petit (sm)' },
  { value: 'base', label: 'Normal (base)' },
  { value: 'lg', label: 'Grand (lg)' },
  { value: 'xl', label: 'Très grand (xl)' },
  { value: '2xl', label: 'Extra grand (2xl)' },
  { value: '3xl', label: 'XXL (3xl)' }
];

const fontWeightOptions = [
  { value: 'normal', label: 'Normal' },
  { value: 'medium', label: 'Moyen' },
  { value: 'semibold', label: 'Semi-gras' },
  { value: 'bold', label: 'Gras' },
  { value: 'extrabold', label: 'Extra-gras' }
];

const textTransformOptions = [
  { value: 'none', label: 'Normal' },
  { value: 'uppercase', label: 'MAJUSCULES' },
  { value: 'lowercase', label: 'minuscules' },
  { value: 'capitalize', label: 'Première Lettre En Majuscule' }
];

const colorOptions = [
  { value: 'gray-800', label: 'Gris foncé', bg: 'bg-gray-800' },
  { value: 'black', label: 'Noir', bg: 'bg-black' },
  { value: 'blue-600', label: 'Bleu', bg: 'bg-blue-600' },
  { value: '[#0E2F56]', label: 'Bleu marine', bg: 'bg-[#0E2F56]' },
  { value: '[#FF8C00]', label: 'Orange', bg: 'bg-[#FF8C00]' },
  { value: 'green-600', label: 'Vert', bg: 'bg-green-600' },
  { value: 'red-600', label: 'Rouge', bg: 'bg-red-600' },
  { value: 'purple-600', label: 'Violet', bg: 'bg-purple-600' }
];

export default function JobFormConfiguration() {
  const { profile } = useAuth();
  const [sections, setSections] = useState<FormSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('job_form_configuration')
        .select('*')
        .order('section_order');

      if (error) throw error;

      if (data) {
        setSections(data);
      }
    } catch (error) {
      console.error('Error loading sections:', error);
      alert('Erreur lors du chargement des sections');
    } finally {
      setLoading(false);
    }
  };

  const updateSection = async (sectionId: string, updates: Partial<FormSection>) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('job_form_configuration')
        .update(updates)
        .eq('id', sectionId);

      if (error) throw error;

      setSections(sections.map(s => s.id === sectionId ? { ...s, ...updates } : s));
      alert('Section mise à jour avec succès');
    } catch (error) {
      console.error('Error updating section:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const moveSection = async (sectionId: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === sectionId);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === sections.length - 1)) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newSections = [...sections];
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];

    try {
      setSaving(true);
      for (let i = 0; i < newSections.length; i++) {
        await supabase
          .from('job_form_configuration')
          .update({ section_order: i + 1 })
          .eq('id', newSections[i].id);
      }
      setSections(newSections);
    } catch (error) {
      console.error('Error reordering sections:', error);
      alert('Erreur lors du réordonnancement');
    } finally {
      setSaving(false);
    }
  };

  const getTitleStyle = (style: FormSection['title_style']) => {
    return `text-${style.fontSize} font-${style.fontWeight} ${style.textTransform} text-${style.color}`;
  };

  if (profile?.user_type !== 'admin') {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Accès réservé aux administrateurs</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Settings className="w-8 h-8 text-[#FF8C00]" />
                  Configuration du Formulaire d'Offre
                </h1>
                <p className="text-gray-600 mt-2">
                  Personnalisez les titres et l'apparence des sections du formulaire
                </p>
              </div>
              <button
                onClick={loadSections}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF8C00] mx-auto"></div>
              <p className="text-gray-600 mt-4">Chargement...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map((section, index) => (
                <div key={section.id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-sm font-medium text-gray-500">#{section.section_order}</span>
                        <h3 className={getTitleStyle(section.title_style)}>
                          {section.section_title}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600">{section.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Clé: {section.section_key}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => moveSection(section.id, 'up')}
                        disabled={index === 0 || saving}
                        className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-30"
                      >
                        <ChevronUp className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => moveSection(section.id, 'down')}
                        disabled={index === sections.length - 1 || saving}
                        className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-30"
                      >
                        <ChevronDown className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => updateSection(section.id, { is_active: !section.is_active })}
                        className={`p-2 rounded-lg transition ${
                          section.is_active
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                        }`}
                      >
                        {section.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => setEditingSection(editingSection === section.id ? null : section.id)}
                        className="px-4 py-2 bg-[#FF8C00] hover:bg-orange-600 text-white rounded-lg transition"
                      >
                        {editingSection === section.id ? 'Fermer' : 'Modifier'}
                      </button>
                    </div>
                  </div>

                  {editingSection === section.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Titre de la section
                          </label>
                          <input
                            type="text"
                            value={section.section_title}
                            onChange={(e) => setSections(sections.map(s =>
                              s.id === section.id ? { ...s, section_title: e.target.value } : s
                            ))}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00]"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <input
                            type="text"
                            value={section.description}
                            onChange={(e) => setSections(sections.map(s =>
                              s.id === section.id ? { ...s, description: e.target.value } : s
                            ))}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00]"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Taille de police
                          </label>
                          <select
                            value={section.title_style.fontSize}
                            onChange={(e) => setSections(sections.map(s =>
                              s.id === section.id
                                ? { ...s, title_style: { ...s.title_style, fontSize: e.target.value } }
                                : s
                            ))}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00]"
                          >
                            {fontSizeOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Épaisseur de police
                          </label>
                          <select
                            value={section.title_style.fontWeight}
                            onChange={(e) => setSections(sections.map(s =>
                              s.id === section.id
                                ? { ...s, title_style: { ...s.title_style, fontWeight: e.target.value } }
                                : s
                            ))}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00]"
                          >
                            {fontWeightOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Transformation du texte
                          </label>
                          <select
                            value={section.title_style.textTransform}
                            onChange={(e) => setSections(sections.map(s =>
                              s.id === section.id
                                ? { ...s, title_style: { ...s.title_style, textTransform: e.target.value } }
                                : s
                            ))}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00]"
                          >
                            {textTransformOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Couleur
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {colorOptions.map(opt => (
                              <button
                                key={opt.value}
                                onClick={() => setSections(sections.map(s =>
                                  s.id === section.id
                                    ? { ...s, title_style: { ...s.title_style, color: opt.value } }
                                    : s
                                ))}
                                className={`p-3 rounded-lg border-2 transition ${
                                  section.title_style.color === opt.value
                                    ? 'border-[#FF8C00] ring-2 ring-[#FF8C00]'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                title={opt.label}
                              >
                                <div className={`w-full h-6 rounded ${opt.bg}`}></div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={() => {
                            updateSection(section.id, {
                              section_title: section.section_title,
                              description: section.description,
                              title_style: section.title_style
                            });
                            setEditingSection(null);
                          }}
                          disabled={saving}
                          className="px-6 py-3 bg-[#0E2F56] hover:bg-blue-900 text-white font-semibold rounded-lg transition flex items-center gap-2 disabled:opacity-50"
                        >
                          <Save className="w-5 h-5" />
                          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
