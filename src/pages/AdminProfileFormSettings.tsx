import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Eye,
  EyeOff,
  Info,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FormSection {
  id: string;
  title: string;
  enabled: boolean;
  order: number;
  required: boolean;
  ai_suggestions?: boolean;
  min_entries?: number;
  fields?: Array<{
    id: string;
    label: string;
    type: string;
    required: boolean;
    enabled: boolean;
  }>;
}

interface FormConfig {
  cv_parsing_enabled: boolean;
  ai_suggestions_enabled: boolean;
  sections: FormSection[];
  messages: {
    welcome: string;
    cv_upload_help: string;
    success_message: string;
  };
}

export default function AdminProfileFormSettings() {
  const { profile } = useAuth();
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profile_form_settings')
        .select('setting_value')
        .eq('setting_key', 'candidate_profile_form_config')
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        setConfig(data.setting_value as FormConfig);
      }
    } catch (err) {
      console.error('Error loading config:', err);
      setError('Erreur lors du chargement de la configuration');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const { error: saveError } = await supabase
        .from('profile_form_settings')
        .update({
          setting_value: config,
          updated_by: profile?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('setting_key', 'candidate_profile_form_config');

      if (saveError) throw saveError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving config:', err);
      setError('Erreur lors de la sauvegarde de la configuration');
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    if (!config) return;

    setConfig({
      ...config,
      sections: config.sections.map((section) =>
        section.id === sectionId ? { ...section, enabled: !section.enabled } : section
      ),
    });
  };

  const toggleGlobalSetting = (setting: 'cv_parsing_enabled' | 'ai_suggestions_enabled') => {
    if (!config) return;
    setConfig({ ...config, [setting]: !config[setting] });
  };

  const updateMessage = (key: keyof FormConfig['messages'], value: string) => {
    if (!config) return;
    setConfig({
      ...config,
      messages: { ...config.messages, [key]: value },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Configuration introuvable</p>
          <button
            onClick={loadConfig}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* En-tête */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Settings className="w-8 h-8 text-blue-600" />
                Configuration du Formulaire de Profil
              </h1>
              <p className="text-gray-600 mt-2">
                Gérez les sections et paramètres du formulaire de profil candidat
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadConfig}
                disabled={loading}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
              <button
                onClick={saveConfig}
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Messages de succès/erreur */}
          {success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
              <CheckCircle2 className="w-5 h-5" />
              Configuration enregistrée avec succès
            </div>
          )}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}
        </div>

        {/* Paramètres globaux */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            Paramètres Globaux
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">Parsing de CV avec IA</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Permet aux candidats de téléverser leur CV pour auto-remplissage du formulaire
                </p>
              </div>
              <button
                onClick={() => toggleGlobalSetting('cv_parsing_enabled')}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  config.cv_parsing_enabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    config.cv_parsing_enabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">Suggestions IA</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Active les suggestions de compétences et textes générés par IA
                </p>
              </div>
              <button
                onClick={() => toggleGlobalSetting('ai_suggestions_enabled')}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  config.ai_suggestions_enabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    config.ai_suggestions_enabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Sections du formulaire */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Sections du Formulaire
          </h2>

          <div className="space-y-3">
            {config.sections
              .sort((a, b) => a.order - b.order)
              .map((section) => (
                <div
                  key={section.id}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                    section.enabled
                      ? 'bg-white border-blue-200'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-sm font-bold text-gray-500 w-8">#{section.order}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{section.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                        {section.required && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                            Requis
                          </span>
                        )}
                        {section.ai_suggestions && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            IA activée
                          </span>
                        )}
                        {section.min_entries && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                            Min: {section.min_entries}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSection(section.id)}
                    disabled={section.required}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                      section.enabled
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {section.enabled ? (
                      <>
                        <Eye className="w-4 h-4" />
                        Activée
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4" />
                        Désactivée
                      </>
                    )}
                  </button>
                </div>
              ))}
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-2">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              Les sections marquées comme "Requis" ne peuvent pas être désactivées. L'ordre des
              sections peut être modifié en base de données si nécessaire.
            </p>
          </div>
        </div>

        {/* Messages personnalisés */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Messages Personnalisés</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message de bienvenue
              </label>
              <input
                type="text"
                value={config.messages.welcome}
                onChange={(e) => updateMessage('welcome', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Complétez votre profil pour maximiser vos chances"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aide pour le téléversement de CV
              </label>
              <input
                type="text"
                value={config.messages.cv_upload_help}
                onChange={(e) => updateMessage('cv_upload_help', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Notre IA analysera votre CV automatiquement"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message de succès
              </label>
              <input
                type="text"
                value={config.messages.success_message}
                onChange={(e) => updateMessage('success_message', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Profil enregistré avec succès!"
              />
            </div>
          </div>
        </div>

        {/* Bouton de sauvegarde en bas */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={saveConfig}
            disabled={saving}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition flex items-center gap-2 disabled:opacity-50 text-lg font-semibold shadow-lg"
          >
            {saving ? (
              <>
                <RefreshCw className="w-6 h-6 animate-spin" />
                Sauvegarde en cours...
              </>
            ) : (
              <>
                <Save className="w-6 h-6" />
                Enregistrer toutes les modifications
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
