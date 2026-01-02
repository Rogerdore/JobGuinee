import React, { useState, useEffect } from 'react';
import { FileText, Settings, Palette, Wand2, Save, AlertCircle, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CVTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  is_premium: boolean;
  is_active: boolean;
  preview_url?: string;
}

interface CVBuilderConfig {
  id?: string;
  enable_cv_builder: boolean;
  enable_ai_suggestions: boolean;
  enable_cv_parsing: boolean;
  enable_cv_templates: boolean;
  max_cv_versions_per_user: number;
  allow_custom_templates: boolean;
  require_profile_completion: boolean;
  min_profile_completion_percentage: number;
  enable_cv_export_pdf: boolean;
  enable_cv_export_docx: boolean;
  enable_cv_watermark: boolean;
  watermark_text: string;
  default_cv_language: string;
  enable_multi_language_cv: boolean;
  ai_suggestion_credit_cost: number;
  cv_improvement_credit_cost: number;
  cv_targeted_credit_cost: number;
  enable_cv_analytics: boolean;
  enable_cv_versioning: boolean;
  max_file_size_mb: number;
  allowed_file_types: string[];
  updated_at?: string;
}

export default function AdminCVBuilderConfig() {
  const [activeTab, setActiveTab] = useState<'general' | 'templates' | 'ai' | 'export'>('general');
  const [config, setConfig] = useState<CVBuilderConfig>({
    enable_cv_builder: true,
    enable_ai_suggestions: true,
    enable_cv_parsing: true,
    enable_cv_templates: true,
    max_cv_versions_per_user: 5,
    allow_custom_templates: false,
    require_profile_completion: true,
    min_profile_completion_percentage: 50,
    enable_cv_export_pdf: true,
    enable_cv_export_docx: true,
    enable_cv_watermark: false,
    watermark_text: 'Généré par JobGuinee',
    default_cv_language: 'fr',
    enable_multi_language_cv: true,
    ai_suggestion_credit_cost: 10,
    cv_improvement_credit_cost: 20,
    cv_targeted_credit_cost: 30,
    enable_cv_analytics: true,
    enable_cv_versioning: true,
    max_file_size_mb: 5,
    allowed_file_types: ['pdf', 'docx', 'doc']
  });
  const [templates, setTemplates] = useState<CVTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
    loadTemplates();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cv_builder_config')
        .select('*')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading CV builder config:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement de la configuration' });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('cv_templates')
        .select('*')
        .order('name');

      if (error) throw error;
      if (data) setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const configData = {
        ...config,
        updated_at: new Date().toISOString()
      };

      if (config.id) {
        const { error } = await supabase
          .from('cv_builder_config')
          .update(configData)
          .eq('id', config.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('cv_builder_config')
          .insert([configData])
          .select()
          .single();

        if (error) throw error;
        if (data) setConfig(data);
      }

      setMessage({ type: 'success', text: 'Configuration enregistrée avec succès' });
    } catch (error) {
      console.error('Error saving CV builder config:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' });
    } finally {
      setSaving(false);
    }
  };

  const toggleTemplateStatus = async (templateId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('cv_templates')
        .update({ is_active: !currentStatus })
        .eq('id', templateId);

      if (error) throw error;
      await loadTemplates();
      setMessage({ type: 'success', text: 'Statut du template mis à jour' });
    } catch (error) {
      console.error('Error updating template:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour' });
    }
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'ai', label: 'IA & Suggestions', icon: Wand2 },
    { id: 'export', label: 'Export & Fichiers', icon: Palette }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Configuration du CV Builder</h1>
        <p className="mt-2 text-gray-600">
          Gérez les paramètres du système de création et gestion de CV
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fonctionnalités Principales</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Activer le CV Builder</p>
                      <p className="text-sm text-gray-600">Permettre aux utilisateurs de créer des CV</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_cv_builder}
                        onChange={(e) => setConfig({ ...config, enable_cv_builder: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Parsing automatique de CV</p>
                      <p className="text-sm text-gray-600">Extraire automatiquement les informations des CV uploadés</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_cv_parsing}
                        onChange={(e) => setConfig({ ...config, enable_cv_parsing: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Gestion des versions</p>
                      <p className="text-sm text-gray-600">Permettre la sauvegarde de plusieurs versions de CV</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_cv_versioning}
                        onChange={(e) => setConfig({ ...config, enable_cv_versioning: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Profil obligatoire</p>
                      <p className="text-sm text-gray-600">Exiger un profil complété avant de créer un CV</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.require_profile_completion}
                        onChange={(e) => setConfig({ ...config, require_profile_completion: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Limites</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Versions de CV par utilisateur
                    </label>
                    <input
                      type="number"
                      value={config.max_cv_versions_per_user}
                      onChange={(e) => setConfig({ ...config, max_cv_versions_per_user: Number(e.target.value) })}
                      min="1"
                      max="20"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Taille maximale des fichiers (MB)
                    </label>
                    <input
                      type="number"
                      value={config.max_file_size_mb}
                      onChange={(e) => setConfig({ ...config, max_file_size_mb: Number(e.target.value) })}
                      min="1"
                      max="50"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pourcentage minimum de profil (%)
                    </label>
                    <input
                      type="number"
                      value={config.min_profile_completion_percentage}
                      onChange={(e) => setConfig({ ...config, min_profile_completion_percentage: Number(e.target.value) })}
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Langue par défaut
                    </label>
                    <select
                      value={config.default_cv_language}
                      onChange={(e) => setConfig({ ...config, default_cv_language: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Templates de CV</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus className="w-5 h-5" />
                  Nouveau Template
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-6">
                <div>
                  <p className="font-medium text-gray-900">Activer les templates</p>
                  <p className="text-sm text-gray-600">Permettre l'utilisation de templates prédéfinis</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enable_cv_templates}
                    onChange={(e) => setConfig({ ...config, enable_cv_templates: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {templates.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun template disponible</p>
                  <p className="text-sm text-gray-500 mt-2">Créez votre premier template de CV</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{template.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        </div>
                        {template.is_premium && (
                          <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Premium</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className={`px-2 py-1 text-xs rounded ${
                          template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {template.is_active ? 'Actif' : 'Inactif'}
                        </span>
                        <button
                          onClick={() => toggleTemplateStatus(template.id, template.is_active)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          {template.is_active ? 'Désactiver' : 'Activer'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Services IA</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Suggestions IA</p>
                      <p className="text-sm text-gray-600">Suggérer du contenu avec l'IA</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_ai_suggestions}
                        onChange={(e) => setConfig({ ...config, enable_ai_suggestions: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Analyses de CV</p>
                      <p className="text-sm text-gray-600">Analyser et suivre les performances des CV</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_cv_analytics}
                        onChange={(e) => setConfig({ ...config, enable_cv_analytics: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Coûts en Crédits IA</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Suggestions IA
                    </label>
                    <input
                      type="number"
                      value={config.ai_suggestion_credit_cost}
                      onChange={(e) => setConfig({ ...config, ai_suggestion_credit_cost: Number(e.target.value) })}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Crédits par suggestion</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amélioration de CV
                    </label>
                    <input
                      type="number"
                      value={config.cv_improvement_credit_cost}
                      onChange={(e) => setConfig({ ...config, cv_improvement_credit_cost: Number(e.target.value) })}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Crédits par amélioration</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CV Ciblé
                    </label>
                    <input
                      type="number"
                      value={config.cv_targeted_credit_cost}
                      onChange={(e) => setConfig({ ...config, cv_targeted_credit_cost: Number(e.target.value) })}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Crédits par CV ciblé</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Formats d'Export</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Export PDF</p>
                      <p className="text-sm text-gray-600">Permettre l'export en format PDF</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_cv_export_pdf}
                        onChange={(e) => setConfig({ ...config, enable_cv_export_pdf: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Export DOCX</p>
                      <p className="text-sm text-gray-600">Permettre l'export en format Word</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_cv_export_docx}
                        onChange={(e) => setConfig({ ...config, enable_cv_export_docx: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Watermark</p>
                      <p className="text-sm text-gray-600">Ajouter un filigrane sur les CV exportés</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_cv_watermark}
                        onChange={(e) => setConfig({ ...config, enable_cv_watermark: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">CV Multilingue</p>
                      <p className="text-sm text-gray-600">Permettre la création de CV en plusieurs langues</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_multi_language_cv}
                        onChange={(e) => setConfig({ ...config, enable_multi_language_cv: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {config.enable_cv_watermark && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration du Watermark</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Texte du watermark
                    </label>
                    <input
                      type="text"
                      value={config.watermark_text}
                      onChange={(e) => setConfig({ ...config, watermark_text: e.target.value })}
                      placeholder="Généré par JobGuinee"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t px-6 py-4 bg-gray-50 flex justify-end">
          <button
            onClick={saveConfig}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </div>
  );
}
