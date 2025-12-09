import React, { useState, useEffect } from 'react';
import { MessageCircle, Settings, Palette, Book, Zap, MessageSquare, Save, Plus, Trash2, Edit2, Eye } from 'lucide-react';
import {
  ChatbotService,
  ChatbotSettings,
  ChatbotStyle,
  KnowledgeBaseEntry,
  QuickAction
} from '../services/chatbotService';

type Tab = 'general' | 'styles' | 'knowledge' | 'actions' | 'logs';

export default function AdminChatbot() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [settings, setSettings] = useState<ChatbotSettings | null>(null);
  const [styles, setStyles] = useState<ChatbotStyle[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseEntry[]>([]);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'general') {
        const settingsData = await ChatbotService.getSettings();
        setSettings(settingsData);
      } else if (activeTab === 'styles') {
        const stylesData = await ChatbotService.getAllStyles();
        setStyles(stylesData);
      } else if (activeTab === 'knowledge') {
        const kbData = await ChatbotService.getAllKnowledgeBase();
        setKnowledgeBase(kbData);
      } else if (activeTab === 'actions') {
        const actionsData = await ChatbotService.getAllQuickActions();
        setQuickActions(actionsData);
      } else if (activeTab === 'logs') {
        const logsData = await ChatbotService.getChatLogs(100);
        setLogs(logsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const success = await ChatbotService.updateSettings(settings);
      if (success) {
        alert('Paramètres sauvegardés avec succès!');
      } else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general' as Tab, label: 'Général', icon: Settings },
    { id: 'styles' as Tab, label: 'Styles', icon: Palette },
    { id: 'knowledge' as Tab, label: 'Base de connaissances', icon: Book },
    { id: 'actions' as Tab, label: 'Actions rapides', icon: Zap },
    { id: 'logs' as Tab, label: 'Historique', icon: MessageSquare }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Gestion du Chatbot IA</h1>
                <p className="text-blue-100">Configuration et personnalisation de l'assistant virtuel</p>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {activeTab === 'general' && settings && (
                  <GeneralTab settings={settings} setSettings={setSettings} onSave={handleSaveSettings} saving={saving} />
                )}
                {activeTab === 'styles' && (
                  <StylesTab styles={styles} onReload={loadData} />
                )}
                {activeTab === 'knowledge' && (
                  <KnowledgeTab knowledgeBase={knowledgeBase} onReload={loadData} />
                )}
                {activeTab === 'actions' && (
                  <ActionsTab quickActions={quickActions} onReload={loadData} />
                )}
                {activeTab === 'logs' && (
                  <LogsTab logs={logs} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GeneralTab({ settings, setSettings, onSave, saving }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={settings.is_enabled}
              onChange={(e) => setSettings({ ...settings, is_enabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="font-medium text-gray-700">Activer le chatbot</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
          <select
            value={settings.position}
            onChange={(e) => setSettings({ ...settings, position: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="bottom-right">Bas droit</option>
            <option value="bottom-left">Bas gauche</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Message de bienvenue</label>
        <textarea
          value={settings.welcome_message}
          onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Message en attente</label>
        <textarea
          value={settings.idle_message}
          onChange={(e) => setSettings({ ...settings, idle_message: e.target.value })}
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={settings.show_quick_actions}
              onChange={(e) => setSettings({ ...settings, show_quick_actions: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="font-medium text-gray-700">Afficher les actions rapides</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Messages contexte max</label>
          <input
            type="number"
            value={settings.max_context_messages}
            onChange={(e) => setSettings({ ...settings, max_context_messages: parseInt(e.target.value) })}
            min="0"
            max="50"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}

function StylesTab({ styles, onReload }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">Thèmes disponibles</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Nouveau thème
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {styles.map((style) => (
          <div key={style.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg"
                  style={{ backgroundColor: style.primary_color }}
                />
                <div>
                  <h4 className="font-semibold text-gray-900">{style.name}</h4>
                  {style.is_default && (
                    <span className="text-xs text-green-600 font-medium">Par défaut</span>
                  )}
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Edit2 className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-gray-500">Taille</p>
                <p className="font-medium">{style.widget_size}</p>
              </div>
              <div>
                <p className="text-gray-500">Ombre</p>
                <p className="font-medium">{style.shadow_strength}</p>
              </div>
              <div>
                <p className="text-gray-500">Animation</p>
                <p className="font-medium">{style.animation_type}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KnowledgeTab({ knowledgeBase, onReload }: any) {
  const [search, setSearch] = useState('');

  const filtered = knowledgeBase.filter((kb: KnowledgeBaseEntry) =>
    kb.question.toLowerCase().includes(search.toLowerCase()) ||
    kb.answer.toLowerCase().includes(search.toLowerCase()) ||
    kb.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">Base de connaissances ({knowledgeBase.length})</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Nouvelle entrée
        </button>
      </div>

      <input
        type="text"
        placeholder="Rechercher..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      />

      <div className="space-y-3">
        {filtered.map((kb) => (
          <div key={kb.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    {kb.category}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    Priorité: {kb.priority_level}
                  </span>
                  {!kb.is_active && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Inactif</span>
                  )}
                </div>
                <p className="font-semibold text-gray-900 mb-1">{kb.question}</p>
                <p className="text-sm text-gray-600">{kb.answer}</p>
                {kb.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {kb.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionsTab({ quickActions, onReload }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">Actions rapides ({quickActions.length})</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Nouvelle action
        </button>
      </div>

      <div className="space-y-3">
        {quickActions.map((action) => (
          <div key={action.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{action.label}</h4>
                  <p className="text-sm text-gray-600">{action.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      {action.action_type}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      Ordre: {action.order_index}
                    </span>
                    {!action.is_active && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">Inactif</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LogsTab({ logs }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">Historique des conversations ({logs.length})</h3>
      </div>

      <div className="space-y-3">
        {logs.map((log: any) => (
          <div key={log.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-500">
                    {new Date(log.created_at).toLocaleString('fr-FR')}
                  </span>
                  {log.intent_detected && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                      {log.intent_detected}
                    </span>
                  )}
                  {log.response_time_ms && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      {log.response_time_ms}ms
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-semibold text-gray-500 mt-1">User:</span>
                    <p className="text-sm text-gray-900">{log.message_user}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-semibold text-gray-500 mt-1">Bot:</span>
                    <p className="text-sm text-gray-600">{log.message_bot}</p>
                  </div>
                </div>
                {log.page_url && (
                  <p className="text-xs text-gray-400 mt-2">Page: {log.page_url}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
