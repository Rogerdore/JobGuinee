import { useState, useEffect } from 'react';
import { Save, Edit2, Eye, EyeOff, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CTAConfig {
  id: string;
  component_name: string;
  cta_type: 'primary' | 'secondary' | 'tertiary';
  text_content: string;
  description?: string;
  is_active: boolean;
  target_url?: string;
  display_order: number;
  button_style: Record<string, any>;
  modal_config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export default function AdminCTAConfiguration() {
  const [configs, setConfigs] = useState<CTAConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<Partial<CTAConfig>>({
    component_name: '',
    cta_type: 'primary',
    text_content: '',
    description: '',
    is_active: true,
    target_url: '',
    display_order: 0,
    button_style: {},
    modal_config: {},
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('cta_configurations')
        .select('*')
        .order('component_name')
        .order('display_order');

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Error loading CTA configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config: CTAConfig) => {
    setEditingId(config.id);
    setFormData(config);
    setShowAddForm(false);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        const { error } = await supabase
          .from('cta_configurations')
          .update({
            text_content: formData.text_content,
            description: formData.description,
            is_active: formData.is_active,
            target_url: formData.target_url,
            display_order: formData.display_order,
            button_style: formData.button_style,
            modal_config: formData.modal_config,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;
        setSaveMessage({ type: 'success', text: 'Configuration mise à jour avec succès' });
      } else {
        const { error } = await supabase
          .from('cta_configurations')
          .insert({
            component_name: formData.component_name,
            cta_type: formData.cta_type,
            text_content: formData.text_content,
            description: formData.description,
            is_active: formData.is_active,
            target_url: formData.target_url,
            display_order: formData.display_order,
            button_style: formData.button_style,
            modal_config: formData.modal_config,
          });

        if (error) throw error;
        setSaveMessage({ type: 'success', text: 'Configuration créée avec succès' });
      }

      await loadConfigs();
      setEditingId(null);
      setShowAddForm(false);
      resetForm();

      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      console.error('Error saving CTA config:', error);
      setSaveMessage({ type: 'error', text: error.message || 'Erreur lors de la sauvegarde' });
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('cta_configurations')
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await loadConfigs();
    } catch (error) {
      console.error('Error toggling active status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette configuration ?')) return;

    try {
      const { error } = await supabase
        .from('cta_configurations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadConfigs();
      setSaveMessage({ type: 'success', text: 'Configuration supprimée' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      console.error('Error deleting CTA config:', error);
      setSaveMessage({ type: 'error', text: error.message || 'Erreur lors de la suppression' });
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  const resetForm = () => {
    setFormData({
      component_name: '',
      cta_type: 'primary',
      text_content: '',
      description: '',
      is_active: true,
      target_url: '',
      display_order: 0,
      button_style: {},
      modal_config: {},
    });
  };

  const componentNames = [
    'auth_required_modal',
    'application_success_modal',
    'diffusion_proposal_modal',
    'profile_completion_bar',
    'premium_upgrade_modal',
  ];

  const groupedConfigs = configs.reduce((acc, config) => {
    if (!acc[config.component_name]) {
      acc[config.component_name] = [];
    }
    acc[config.component_name].push(config);
    return acc;
  }, {} as Record<string, CTAConfig[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuration des CTA</h1>
          <p className="text-gray-600">
            Gérez les textes et comportements des appels à l'action sur toute la plateforme
          </p>
        </div>

        {saveMessage && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            saveMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {saveMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{saveMessage.text}</span>
          </div>
        )}

        <div className="mb-6">
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingId(null);
              resetForm();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Ajouter une configuration
          </button>
        </div>

        {(showAddForm || editingId) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">
              {editingId ? 'Modifier la configuration' : 'Nouvelle configuration'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Composant
                </label>
                <select
                  value={formData.component_name}
                  onChange={(e) => setFormData({ ...formData, component_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!!editingId}
                >
                  <option value="">Sélectionner un composant</option>
                  {componentNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de CTA
                </label>
                <select
                  value={formData.cta_type}
                  onChange={(e) => setFormData({ ...formData, cta_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!!editingId}
                >
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="tertiary">Tertiary</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texte du bouton
                </label>
                <input
                  type="text"
                  value={formData.text_content}
                  onChange={(e) => setFormData({ ...formData, text_content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Créer mon compte"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Description interne pour documentation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL cible (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.target_url}
                  onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="/page-cible"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordre d'affichage
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Actif</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Sauvegarder
              </button>
              <button
                onClick={() => {
                  setEditingId(null);
                  setShowAddForm(false);
                  resetForm();
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {Object.entries(groupedConfigs).map(([componentName, componentConfigs]) => (
            <div key={componentName} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {componentName.replace(/_/g, ' ').toUpperCase()}
              </h2>

              <div className="space-y-3">
                {componentConfigs.map((config) => (
                  <div
                    key={config.id}
                    className={`p-4 border-2 rounded-lg ${
                      config.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            config.cta_type === 'primary'
                              ? 'bg-blue-100 text-blue-700'
                              : config.cta_type === 'secondary'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {config.cta_type}
                          </span>
                          {config.is_active ? (
                            <span className="flex items-center gap-1 text-green-600 text-sm">
                              <Eye className="w-4 h-4" />
                              Actif
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-gray-500 text-sm">
                              <EyeOff className="w-4 h-4" />
                              Inactif
                            </span>
                          )}
                        </div>

                        <p className="text-lg font-semibold text-gray-900 mb-1">
                          {config.text_content}
                        </p>

                        {config.description && (
                          <p className="text-sm text-gray-600 mb-2">{config.description}</p>
                        )}

                        {config.target_url && (
                          <p className="text-sm text-blue-600">→ {config.target_url}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(config.id, config.is_active)}
                          className="p-2 hover:bg-gray-200 rounded-lg transition"
                          title={config.is_active ? 'Désactiver' : 'Activer'}
                        >
                          {config.is_active ? (
                            <EyeOff className="w-5 h-5 text-gray-600" />
                          ) : (
                            <Eye className="w-5 h-5 text-gray-600" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(config)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition"
                          title="Modifier"
                        >
                          <Edit2 className="w-5 h-5 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(config.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
