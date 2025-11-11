import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit2, Check, X, MessageCircle, Settings, HelpCircle, Key, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ChatBotConfig {
  id: string;
  enabled: boolean;
  name: string;
  welcome_message: string;
  avatar_url: string | null;
  primary_color: string;
  position: 'bottom-right' | 'bottom-left';
  ai_model: string;
  system_prompt: string;
  max_messages_per_session: number;
  api_key: string | null;
  api_provider: 'openai' | 'anthropic' | 'custom';
  api_endpoint: string | null;
  temperature: number;
  max_tokens: number;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  active: boolean;
  priority: number;
}

export default function ChatBotAdmin() {
  const { profile } = useAuth();
  const [config, setConfig] = useState<ChatBotConfig | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [showAddFaq, setShowAddFaq] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'faqs' | 'api'>('config');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (profile?.user_type === 'admin') {
      loadData();
    }
  }, [profile]);

  const loadData = async () => {
    setLoading(true);

    const { data: configData } = await supabase
      .from('chatbot_config')
      .select('*')
      .single();

    const { data: faqsData } = await supabase
      .from('chatbot_faqs')
      .select('*')
      .order('priority', { ascending: false });

    if (configData) setConfig(configData);
    if (faqsData) setFaqs(faqsData);

    setLoading(false);
  };

  const handleSaveConfig = async () => {
    if (!config) return;

    setSaving(true);
    const { error } = await supabase
      .from('chatbot_config')
      .update({
        enabled: config.enabled,
        name: config.name,
        welcome_message: config.welcome_message,
        avatar_url: config.avatar_url,
        primary_color: config.primary_color,
        position: config.position,
        ai_model: config.ai_model,
        system_prompt: config.system_prompt,
        max_messages_per_session: config.max_messages_per_session,
        api_key: config.api_key,
        api_provider: config.api_provider,
        api_endpoint: config.api_endpoint,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
      })
      .eq('id', config.id);

    if (!error) {
      alert('Configuration sauvegardée avec succès!');
    } else {
      alert('Erreur lors de la sauvegarde: ' + error.message);
    }
    setSaving(false);
  };

  const handleSaveFaq = async (faq: FAQ) => {
    if (faq.id) {
      await supabase
        .from('chatbot_faqs')
        .update(faq)
        .eq('id', faq.id);
    } else {
      await supabase
        .from('chatbot_faqs')
        .insert(faq);
    }

    setEditingFaq(null);
    setShowAddFaq(false);
    loadData();
  };

  const handleDeleteFaq = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette FAQ?')) {
      await supabase
        .from('chatbot_faqs')
        .delete()
        .eq('id', id);
      loadData();
    }
  };

  if (profile?.user_type !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès Réservé</h2>
          <p className="text-gray-600">Cette page est réservée aux administrateurs.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0E2F56] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <MessageCircle className="w-8 h-8 text-[#0E2F56]" />
                Configuration du Chatbot IA
              </h1>
              <p className="text-gray-600 mt-2">Personnalisez votre assistant virtuel</p>
            </div>
            {config && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">Statut:</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {config.enabled ? 'Activé' : 'Désactivé'}
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('config')}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === 'config'
                  ? 'text-[#0E2F56] border-b-2 border-[#0E2F56] bg-blue-50/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Settings className="w-5 h-5 inline mr-2" />
              Configuration
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === 'api'
                  ? 'text-[#0E2F56] border-b-2 border-[#0E2F56] bg-blue-50/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Key className="w-5 h-5 inline mr-2" />
              Configuration API
            </button>
            <button
              onClick={() => setActiveTab('faqs')}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === 'faqs'
                  ? 'text-[#0E2F56] border-b-2 border-[#0E2F56] bg-blue-50/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <HelpCircle className="w-5 h-5 inline mr-2" />
              Base de connaissances ({faqs.length} FAQs)
            </button>
          </div>
        </div>

        {/* Configuration Tab */}
        {activeTab === 'config' && config && (
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du chatbot
                </label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Couleur principale
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.primary_color}
                    onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                    className="w-16 h-12 rounded-xl cursor-pointer border-2 border-gray-200"
                  />
                  <input
                    type="text"
                    value={config.primary_color}
                    onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent outline-none transition font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position
                </label>
                <select
                  value={config.position}
                  onChange={(e) => setConfig({ ...config, position: e.target.value as 'bottom-right' | 'bottom-left' })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent outline-none transition"
                >
                  <option value="bottom-right">Bas à droite</option>
                  <option value="bottom-left">Bas à gauche</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Messages max par session
                </label>
                <input
                  type="number"
                  value={config.max_messages_per_session}
                  onChange={(e) => setConfig({ ...config, max_messages_per_session: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent outline-none transition"
                  min="10"
                  max="200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message de bienvenue
              </label>
              <textarea
                value={config.welcome_message}
                onChange={(e) => setConfig({ ...config, welcome_message: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent outline-none transition resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prompt système pour l'IA
              </label>
              <textarea
                value={config.system_prompt}
                onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
                rows={5}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent outline-none transition resize-none font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                Ce prompt définit le comportement et la personnalité de l'IA
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-[#0E2F56] to-blue-700 text-white font-semibold rounded-xl hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder la configuration'}
              </button>
            </div>
          </div>
        )}

        {/* API Tab */}
        {activeTab === 'api' && config && (
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Configuration de l'API IA</h3>
                  <p className="text-sm text-blue-800">
                    Configurez votre clé API pour activer les réponses intelligentes du chatbot.
                    Les clés API sont sensibles et doivent être gardées confidentielles.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fournisseur d'API
                </label>
                <select
                  value={config.api_provider}
                  onChange={(e) => setConfig({ ...config, api_provider: e.target.value as 'openai' | 'anthropic' | 'custom' })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent outline-none transition"
                >
                  <option value="openai">OpenAI (GPT-3.5, GPT-4)</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="custom">API Personnalisée</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Key className="w-4 h-4 inline mr-1" />
                  Clé API
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={config.api_key || ''}
                    onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                    placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent outline-none transition font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 transition"
                  >
                    {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {config.api_provider === 'openai' && 'Obtenez votre clé sur: https://platform.openai.com/api-keys'}
                  {config.api_provider === 'anthropic' && 'Obtenez votre clé sur: https://console.anthropic.com/'}
                  {config.api_provider === 'custom' && 'Entrez la clé API fournie par votre service'}
                </p>
              </div>

              {config.api_provider === 'custom' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endpoint API personnalisé
                  </label>
                  <input
                    type="url"
                    value={config.api_endpoint || ''}
                    onChange={(e) => setConfig({ ...config, api_endpoint: e.target.value })}
                    placeholder="https://api.example.com/v1/chat/completions"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent outline-none transition"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modèle IA
                </label>
                <select
                  value={config.ai_model}
                  onChange={(e) => setConfig({ ...config, ai_model: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent outline-none transition"
                >
                  {config.api_provider === 'openai' && (
                    <>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Rapide & Économique)</option>
                      <option value="gpt-4">GPT-4 (Plus précis)</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo (Équilibré)</option>
                    </>
                  )}
                  {config.api_provider === 'anthropic' && (
                    <>
                      <option value="claude-3-haiku">Claude 3 Haiku (Rapide)</option>
                      <option value="claude-3-sonnet">Claude 3 Sonnet (Équilibré)</option>
                      <option value="claude-3-opus">Claude 3 Opus (Plus puissant)</option>
                    </>
                  )}
                  {config.api_provider === 'custom' && (
                    <option value="custom">Modèle personnalisé</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Température (Créativité)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={config.temperature}
                    onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="w-12 text-center font-mono text-sm bg-gray-100 px-3 py-2 rounded-lg">
                    {config.temperature.toFixed(1)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  0 = Précis et déterministe, 2 = Créatif et varié
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tokens maximum
                </label>
                <input
                  type="number"
                  value={config.max_tokens}
                  onChange={(e) => setConfig({ ...config, max_tokens: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent outline-none transition"
                  min="50"
                  max="4000"
                  step="50"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Longueur maximale de la réponse (50-4000 tokens)
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-1">Sécurité</h3>
                  <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                    <li>Ne partagez jamais votre clé API</li>
                    <li>Surveillez votre utilisation pour éviter les coûts imprévus</li>
                    <li>Révoquezla clé immédiatement en cas de compromission</li>
                    <li>Utilisez des limites de dépenses sur votre compte API</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-[#0E2F56] to-blue-700 text-white font-semibold rounded-xl hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder la configuration API'}
              </button>
            </div>
          </div>
        )}

        {/* FAQs Tab */}
        {activeTab === 'faqs' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Questions fréquentes</h2>
                <button
                  onClick={() => {
                    setEditingFaq({
                      id: '',
                      question: '',
                      answer: '',
                      category: 'Général',
                      keywords: [],
                      active: true,
                      priority: 5
                    });
                    setShowAddFaq(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-[#0E2F56] to-blue-700 text-white font-semibold rounded-xl hover:shadow-lg transition flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Ajouter une FAQ
                </button>
              </div>

              <div className="space-y-3">
                {faqs.map((faq) => (
                  <div
                    key={faq.id}
                    className="border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 transition"
                  >
                    {editingFaq?.id === faq.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editingFaq.question}
                          onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                          placeholder="Question"
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent outline-none"
                        />
                        <textarea
                          value={editingFaq.answer}
                          onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                          placeholder="Réponse"
                          rows={3}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent outline-none resize-none"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editingFaq.category}
                            onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value })}
                            placeholder="Catégorie"
                            className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent outline-none"
                          />
                          <input
                            type="number"
                            value={editingFaq.priority}
                            onChange={(e) => setEditingFaq({ ...editingFaq, priority: parseInt(e.target.value) })}
                            placeholder="Priorité"
                            className="w-24 px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent outline-none"
                          />
                        </div>
                        <input
                          type="text"
                          value={editingFaq.keywords.join(', ')}
                          onChange={(e) => setEditingFaq({ ...editingFaq, keywords: e.target.value.split(',').map(k => k.trim()) })}
                          placeholder="Mots-clés (séparés par des virgules)"
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent outline-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingFaq(null)}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Annuler
                          </button>
                          <button
                            onClick={() => handleSaveFaq(editingFaq)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Sauvegarder
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {faq.category}
                              </span>
                              {!faq.active && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{faq.answer}</p>
                            {faq.keywords && faq.keywords.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {faq.keywords.map((keyword, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => setEditingFaq(faq)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteFaq(faq.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {showAddFaq && editingFaq && !editingFaq.id && (
                  <div className="border-2 border-blue-300 rounded-xl p-4 bg-blue-50/50 space-y-3">
                    <h3 className="font-semibold text-gray-900 mb-3">Nouvelle FAQ</h3>
                    <input
                      type="text"
                      value={editingFaq.question}
                      onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                      placeholder="Question"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent outline-none"
                    />
                    <textarea
                      value={editingFaq.answer}
                      onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                      placeholder="Réponse"
                      rows={3}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent outline-none resize-none"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingFaq.category}
                        onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value })}
                        placeholder="Catégorie"
                        className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent outline-none"
                      />
                      <input
                        type="number"
                        value={editingFaq.priority}
                        onChange={(e) => setEditingFaq({ ...editingFaq, priority: parseInt(e.target.value) })}
                        placeholder="Priorité"
                        className="w-24 px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent outline-none"
                      />
                    </div>
                    <input
                      type="text"
                      value={editingFaq.keywords.join(', ')}
                      onChange={(e) => setEditingFaq({ ...editingFaq, keywords: e.target.value.split(',').map(k => k.trim()) })}
                      placeholder="Mots-clés (séparés par des virgules)"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingFaq(null);
                          setShowAddFaq(false);
                        }}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Annuler
                      </button>
                      <button
                        onClick={() => handleSaveFaq(editingFaq)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Ajouter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
