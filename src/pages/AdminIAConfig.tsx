import { useState, useEffect } from 'react';
import { Settings, Plus, Edit, History, Eye, EyeOff, Save, X, Code, FileText, Sparkles, ArrowLeft } from 'lucide-react';
import { IAConfigService, IAServiceConfig, IAConfigHistory } from '../services/iaConfigService';
import { PromptValidationPanel } from '../components/admin/PromptValidationPanel';
import { CacheStatsPanel } from '../components/admin/CacheStatsPanel';
import { ConfigHistoryWithRollback } from '../components/admin/ConfigHistoryWithRollback';
import { IAConfigCacheService } from '../services/iaConfigCacheService';
import { useModalContext } from '../contexts/ModalContext';

interface ConfigEditorProps {
  config: IAServiceConfig | null;
  onClose: () => void;
  onSave: () => void;
}

function ConfigEditor({ config, onClose, onSave }: ConfigEditorProps) {
  const [formData, setFormData] = useState<Partial<IAServiceConfig>>({});
  const [changeReason, setChangeReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'prompts' | 'schemas' | 'params'>('prompts');

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const result = await IAConfigService.updateConfig(
        config.service_code,
        formData,
        changeReason
      );

      if (result.success) {
        IAConfigCacheService.clearCache(config.service_code);
        alert(`Configuration mise a jour! Nouvelle version: ${result.newVersion}`);
        onSave();
        onClose();
      } else {
        alert('Erreur: ' + result.message);
      }
    } catch (error) {
      showError('Erreur', 'Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  if (!config) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{config.service_name}</h2>
            <p className="text-blue-100 text-sm">Version {config.version} - {config.service_code}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('prompts')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'prompts'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-5 h-5 inline mr-2" />
            Prompts
          </button>
          <button
            onClick={() => setActiveTab('schemas')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'schemas'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Code className="w-5 h-5 inline mr-2" />
            Schemas
          </button>
          <button
            onClick={() => setActiveTab('params')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'params'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Settings className="w-5 h-5 inline mr-2" />
            Parametres
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'prompts' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Prompt de Base
                </label>
                <textarea
                  value={formData.base_prompt || ''}
                  onChange={(e) => setFormData({ ...formData, base_prompt: e.target.value })}
                  className="w-full h-40 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-mono text-sm"
                  placeholder="Prompt principal du service IA..."
                />
              </div>

              <PromptValidationPanel prompt={formData.base_prompt || ''} />

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Instructions
                </label>
                <textarea
                  value={formData.instructions || ''}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full h-32 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-mono text-sm"
                  placeholder="Instructions supplementaires..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Message Systeme (optionnel)
                </label>
                <textarea
                  value={formData.system_message || ''}
                  onChange={(e) => setFormData({ ...formData, system_message: e.target.value })}
                  className="w-full h-24 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-mono text-sm"
                  placeholder="Message systeme personnalise (remplace base_prompt + instructions)..."
                />
              </div>
            </div>
          )}

          {activeTab === 'schemas' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Input Schema (JSON)
                </label>
                <textarea
                  value={JSON.stringify(formData.input_schema, null, 2)}
                  onChange={(e) => {
                    try {
                      setFormData({ ...formData, input_schema: JSON.parse(e.target.value) });
                    } catch (err) {}
                  }}
                  className="w-full h-64 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-mono text-sm"
                />
                <p className="text-xs text-gray-600 mt-2">
                  Schema JSON pour valider les entrees utilisateur
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Output Schema (JSON)
                </label>
                <textarea
                  value={JSON.stringify(formData.output_schema, null, 2)}
                  onChange={(e) => {
                    try {
                      setFormData({ ...formData, output_schema: JSON.parse(e.target.value) });
                    } catch (err) {}
                  }}
                  className="w-full h-64 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-mono text-sm"
                />
                <p className="text-xs text-gray-600 mt-2">
                  Schema JSON pour la reponse attendue
                </p>
              </div>
            </div>
          )}

          {activeTab === 'params' && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Modele
                </label>
                <select
                  value={formData.model || 'gpt-4'}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                >
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="claude-3-opus">Claude 3 Opus</option>
                  <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                  <option value="gemini-pro">Gemini Pro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Temperature ({formData.temperature})
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature || 0.7}
                  onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-gray-600 mt-1">0 = deterministe, 2 = creatif</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={formData.max_tokens || 2000}
                  onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500"
                  min="100"
                  max="8000"
                  step="100"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Top P ({formData.top_p})
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.top_p || 1.0}
                  onChange={(e) => setFormData({ ...formData, top_p: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Frequency Penalty ({formData.frequency_penalty})
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.frequency_penalty || 0}
                  onChange={(e) => setFormData({ ...formData, frequency_penalty: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Presence Penalty ({formData.presence_penalty})
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.presence_penalty || 0}
                  onChange={(e) => setFormData({ ...formData, presence_penalty: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Raison du changement (optionnel)
            </label>
            <input
              type="text"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500"
              placeholder="Ex: Amelioration de la qualite des reponses..."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg transition"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Sauvegarder
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


interface PageProps {
  onNavigate: (page: string) => void;
}

export default function AdminIAConfig({ onNavigate }: PageProps) {
  const { showSuccess, showError, showWarning, showConfirm } = useModalContext();
  const [configs, setConfigs] = useState<IAServiceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConfig, setSelectedConfig] = useState<IAServiceConfig | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const data = await IAConfigService.getAllConfigs(false);
      setConfigs(data);
    } catch (error) {
      console.error('Error loading configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config: IAServiceConfig) => {
    setSelectedConfig(config);
    setShowEditor(true);
  };

  const handleHistory = (config: IAServiceConfig) => {
    setSelectedConfig(config);
    setShowHistory(true);
  };

  const handleToggleActive = async (config: IAServiceConfig) => {
    const success = await IAConfigService.toggleActive(config.service_code, !config.is_active);
    if (success) {
      loadConfigs();
    }
  };

  const filteredConfigs = filterCategory === 'all'
    ? configs
    : configs.filter(c => c.category === filterCategory);

  const categories = IAConfigService.getServiceCategories();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement configurations IA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <button
          onClick={() => onNavigate('home')}
          className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Retour à l'accueil
        </button>

        <div className="mb-6">
          <CacheStatsPanel />
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Configuration Services IA</h1>
              <p className="text-gray-600 text-lg">Gerez les prompts, parametres et schemas des services IA</p>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filterCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Tous ({configs.length})
            </button>
            {categories.map(cat => {
              const count = configs.filter(c => c.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    filterCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {IAConfigService.getCategoryLabel(cat)} ({count})
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredConfigs.map((config) => (
            <div
              key={config.id}
              className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden hover:shadow-xl transition"
            >
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{config.service_name}</h3>
                    <p className="text-blue-100 text-sm">{config.service_code}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-bold">
                      v{config.version}
                    </span>
                    {config.is_active ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-red-300" />
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6">
                {config.service_description && (
                  <p className="text-gray-600 mb-4">{config.service_description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Modele:</span>
                    <span className="ml-2 text-gray-600">{config.model}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Temperature:</span>
                    <span className="ml-2 text-gray-600">{config.temperature}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Max Tokens:</span>
                    <span className="ml-2 text-gray-600">{config.max_tokens}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Categorie:</span>
                    <span className="ml-2 text-gray-600">{IAConfigService.getCategoryLabel(config.category)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(config)}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleHistory(config)}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <History className="w-4 h-4" />
                    Historique
                  </button>
                  <button
                    onClick={() => handleToggleActive(config)}
                    className={`px-4 py-2 font-bold rounded-lg transition ${
                      config.is_active
                        ? 'bg-red-100 hover:bg-red-200 text-red-700'
                        : 'bg-green-100 hover:bg-green-200 text-green-700'
                    }`}
                  >
                    {config.is_active ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredConfigs.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <Settings className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p>Aucune configuration dans cette categorie</p>
          </div>
        )}
      </div>

      {showEditor && (
        <ConfigEditor
          config={selectedConfig}
          onClose={() => {
            setShowEditor(false);
            setSelectedConfig(null);
          }}
          onSave={loadConfigs}
        />
      )}

      {showHistory && selectedConfig && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Historique des Versions</h2>
                <p className="text-purple-100 text-sm">{selectedConfig.service_name}</p>
              </div>
              <button
                onClick={() => {
                  setShowHistory(false);
                  setSelectedConfig(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <ConfigHistoryWithRollback
                serviceCode={selectedConfig.service_code}
                onRollbackSuccess={() => {
                  loadConfigs();
                  setShowHistory(false);
                  setSelectedConfig(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
