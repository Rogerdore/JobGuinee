import { useState, useEffect } from 'react';
import { Settings, FileText, Image, Menu, Globe, Save, Plus, Trash2, Edit2, Eye, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCMS } from '../contexts/CMSContext';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';

interface CMSAdminProps {
  onNavigate: (page: string) => void;
}

export default function CMSAdmin({ onNavigate }: CMSAdminProps) {
  const { settings, sections, refreshSettings } = useCMS();
  const { isAdmin, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'sections' | 'pages' | 'navigation'>('general');
  const [editingSettings, setEditingSettings] = useState<Record<string, any>>({});
  const [allSettings, setAllSettings] = useState<any[]>([]);
  const [allSections, setAllSections] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAllSettings();
    loadAllSections();
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
  ];

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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Administration CMS</h1>
            <p className="text-gray-600">Gérez le contenu et les paramètres de votre site</p>
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
                  <button className="flex items-center gap-2 px-4 py-2 neo-clay-button rounded-xl text-primary-700 font-medium">
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
                          <button className="p-2 neo-clay-button rounded-lg text-gray-600">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button className="p-2 neo-clay-button rounded-lg text-red-600">
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
                <button className="neo-clay-button px-6 py-3 rounded-xl font-medium text-primary-700">
                  Créer une nouvelle page
                </button>
              </div>
            )}

            {activeTab === 'navigation' && (
              <div className="text-center py-12">
                <Menu className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestion de la navigation</h3>
                <p className="text-gray-600 mb-6">Configurez les menus de votre site</p>
                <button className="neo-clay-button px-6 py-3 rounded-xl font-medium text-primary-700">
                  Gérer les menus
                </button>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </AdminLayout>
  );
}
