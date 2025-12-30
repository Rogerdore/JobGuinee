import React, { useState, useEffect } from 'react';
import {
  Settings, DollarSign, Users, MessageSquare, Image as ImageIcon,
  CreditCard, Shield, Send, TrendingUp, Clock, Save, RefreshCw,
  Mail, Phone, CheckCircle, XCircle, Eye, Plus, Edit2, Trash2,
  ToggleRight, ToggleLeft
} from 'lucide-react';
import { diffusionConfigService, DiffusionSettings, ChannelPricing, MessageTemplate, AuditLog } from '../services/diffusionConfigService';

type TabType = 'general' | 'channels' | 'audience' | 'templates' | 'images' | 'payment' | 'antispam' | 'whatsapp' | 'marketing' | 'logs';

export default function AdminDiffusionSettings() {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<DiffusionSettings | null>(null);
  const [channels, setChannels] = useState<ChannelPricing[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsData, channelsData, templatesData, logsData] = await Promise.all([
        diffusionConfigService.getSettings(true),
        diffusionConfigService.getChannelPricing(true),
        diffusionConfigService.getMessageTemplates(),
        diffusionConfigService.getAuditLogs(),
      ]);

      setSettings(settingsData);
      setChannels(channelsData);
      setTemplates(templatesData);
      setLogs(logsData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      alert('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (updates: Partial<DiffusionSettings>) => {
    setSaving(true);
    try {
      const success = await diffusionConfigService.updateSettings(updates);
      if (success) {
        await loadData();
      } else {
        alert('Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateChannel = async (channelType: string, updates: Partial<ChannelPricing>) => {
    try {
      const success = await diffusionConfigService.updateChannelPricing(channelType, updates);
      if (success) {
        await loadData();
      } else {
        alert('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const tabs = [
    { id: 'general' as TabType, label: 'Général', icon: Settings },
    { id: 'channels' as TabType, label: 'Canaux & Tarifs', icon: DollarSign },
    { id: 'audience' as TabType, label: 'Audience & Règles', icon: Users },
    { id: 'templates' as TabType, label: 'Templates', icon: MessageSquare },
    { id: 'images' as TabType, label: 'Images & CTA', icon: ImageIcon },
    { id: 'payment' as TabType, label: 'Paiement', icon: CreditCard },
    { id: 'antispam' as TabType, label: 'Anti-spam', icon: Shield },
    { id: 'whatsapp' as TabType, label: 'WhatsApp', icon: Send },
    { id: 'marketing' as TabType, label: 'Marketing B2B', icon: TrendingUp },
    { id: 'logs' as TabType, label: 'Audit', icon: Clock },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Erreur lors du chargement des paramètres</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configuration Diffusion Ciblée</h1>
              <p className="mt-1 text-sm text-gray-500">
                Pilotage complet du système de diffusion multicanal
              </p>
            </div>
            <button
              onClick={() => loadData()}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Actualiser</span>
            </button>
          </div>

          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center space-x-2 py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap
                      ${activeTab === tab.id
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'general' && (
          <GeneralTab settings={settings} onSave={handleSaveSettings} saving={saving} />
        )}
        {activeTab === 'channels' && (
          <ChannelsTab channels={channels} onUpdate={handleUpdateChannel} />
        )}
        {activeTab === 'audience' && (
          <AudienceTab settings={settings} onSave={handleSaveSettings} saving={saving} />
        )}
        {activeTab === 'templates' && (
          <TemplatesTab templates={templates} onRefresh={loadData} />
        )}
        {activeTab === 'images' && (
          <ImagesTab settings={settings} onSave={handleSaveSettings} saving={saving} />
        )}
        {activeTab === 'payment' && (
          <PaymentTab settings={settings} onSave={handleSaveSettings} saving={saving} />
        )}
        {activeTab === 'antispam' && (
          <AntiSpamTab settings={settings} onSave={handleSaveSettings} saving={saving} />
        )}
        {activeTab === 'whatsapp' && (
          <WhatsAppTab settings={settings} onSave={handleSaveSettings} saving={saving} />
        )}
        {activeTab === 'marketing' && (
          <MarketingTab settings={settings} onSave={handleSaveSettings} saving={saving} />
        )}
        {activeTab === 'logs' && (
          <LogsTab logs={logs} />
        )}
      </div>
    </div>
  );
}

function GeneralTab({ settings, onSave, saving }: { settings: DiffusionSettings; onSave: (updates: Partial<DiffusionSettings>) => void; saving: boolean }) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleToggle = (field: keyof DiffusionSettings) => {
    const newValue = !localSettings[field];
    setLocalSettings({ ...localSettings, [field]: newValue });
    onSave({ [field]: newValue });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Activation du Module</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Module Global</h4>
              <p className="text-sm text-gray-500">Active ou désactive le système complet</p>
            </div>
            <button
              onClick={() => handleToggle('module_enabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localSettings.module_enabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localSettings.module_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Offres d'emploi</h4>
              <p className="text-sm text-gray-500">Diffusion ciblée pour les jobs</p>
            </div>
            <button
              onClick={() => handleToggle('jobs_enabled')}
              disabled={!localSettings.module_enabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localSettings.jobs_enabled && localSettings.module_enabled ? 'bg-green-500' : 'bg-gray-300'
              } ${!localSettings.module_enabled && 'opacity-50 cursor-not-allowed'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localSettings.jobs_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Formations</h4>
              <p className="text-sm text-gray-500">Diffusion ciblée pour les formations</p>
            </div>
            <button
              onClick={() => handleToggle('trainings_enabled')}
              disabled={!localSettings.module_enabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localSettings.trainings_enabled && localSettings.module_enabled ? 'bg-green-500' : 'bg-gray-300'
              } ${!localSettings.module_enabled && 'opacity-50 cursor-not-allowed'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localSettings.trainings_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Publications</h4>
              <p className="text-sm text-gray-500">Diffusion ciblée pour les posts</p>
            </div>
            <button
              onClick={() => handleToggle('posts_enabled')}
              disabled={!localSettings.module_enabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localSettings.posts_enabled && localSettings.module_enabled ? 'bg-green-500' : 'bg-gray-300'
              } ${!localSettings.module_enabled && 'opacity-50 cursor-not-allowed'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localSettings.posts_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Mode de Fonctionnement</h3>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Mode Test</h4>
            <p className="text-sm text-gray-500">Les diffusions ne sont pas réellement envoyées</p>
          </div>
          <button
            onClick={() => handleToggle('test_mode')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              localSettings.test_mode ? 'bg-yellow-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                localSettings.test_mode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message informatif Admin
          </label>
          <textarea
            value={localSettings.admin_info_message || ''}
            onChange={(e) => setLocalSettings({ ...localSettings, admin_info_message: e.target.value })}
            onBlur={() => onSave({ admin_info_message: localSettings.admin_info_message })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Message affiché aux administrateurs..."
          />
        </div>
      </div>
    </div>
  );
}

function ChannelsTab({ channels, onUpdate }: { channels: ChannelPricing[]; onUpdate: (channelType: string, updates: Partial<ChannelPricing>) => void }) {
  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'mail': return Mail;
      case 'message-square': return MessageSquare;
      case 'send': return Send;
      default: return MessageSquare;
    }
  };

  return (
    <div className="space-y-6">
      {channels.map((channel) => {
        const Icon = getIcon(channel.icon_name);
        return (
          <div key={channel.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg ${channel.enabled ? 'bg-orange-100' : 'bg-gray-100'}`}>
                  <Icon className={`h-6 w-6 ${channel.enabled ? 'text-orange-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{channel.display_name}</h3>
                  <p className="text-sm text-gray-500">{channel.description}</p>
                </div>
              </div>
              <button
                onClick={() => onUpdate(channel.channel_type, { enabled: !channel.enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  channel.enabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    channel.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coût unitaire ({channel.currency})
                </label>
                <input
                  type="number"
                  value={channel.unit_cost}
                  onChange={(e) => onUpdate(channel.channel_type, { unit_cost: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantité minimum
                </label>
                <input
                  type="number"
                  value={channel.min_quantity}
                  onChange={(e) => onUpdate(channel.channel_type, { min_quantity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantité maximum
                </label>
                <input
                  type="number"
                  value={channel.max_quantity}
                  onChange={(e) => onUpdate(channel.channel_type, { max_quantity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AudienceTab({ settings, onSave, saving }: { settings: DiffusionSettings; onSave: (updates: Partial<DiffusionSettings>) => void; saving: boolean }) {
  const [localSettings, setLocalSettings] = useState(settings);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Critères de Sélection</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profil minimum requis (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={localSettings.min_profile_completion}
              onChange={(e) => setLocalSettings({ ...localSettings, min_profile_completion: parseInt(e.target.value) })}
              onBlur={() => onSave({ min_profile_completion: localSettings.min_profile_completion })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Seuls les candidats avec un profil complété à {localSettings.min_profile_completion}% minimum seront ciblés
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activité maximum (jours)
            </label>
            <input
              type="number"
              min="1"
              value={localSettings.max_inactive_days}
              onChange={(e) => setLocalSettings({ ...localSettings, max_inactive_days: parseInt(e.target.value) })}
              onBlur={() => onSave({ max_inactive_days: localSettings.max_inactive_days })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Candidats actifs dans les {localSettings.max_inactive_days} derniers jours
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Limite maximum par campagne
            </label>
            <input
              type="number"
              min="1"
              value={localSettings.max_recipients_per_campaign}
              onChange={(e) => setLocalSettings({ ...localSettings, max_recipients_per_campaign: parseInt(e.target.value) })}
              onBlur={() => onSave({ max_recipients_per_campaign: localSettings.max_recipients_per_campaign })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Nombre maximum de destinataires par campagne
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Options de Diffusion</h3>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Autoriser multi-canaux</h4>
            <p className="text-sm text-gray-500">Permettre l'utilisation de plusieurs canaux simultanément</p>
          </div>
          <button
            onClick={() => {
              const newValue = !localSettings.allow_multi_channels;
              setLocalSettings({ ...localSettings, allow_multi_channels: newValue });
              onSave({ allow_multi_channels: newValue });
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              localSettings.allow_multi_channels ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                localSettings.allow_multi_channels ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

function TemplatesTab({ templates, onRefresh }: { templates: MessageTemplate[]; onRefresh: () => void }) {
  const [filter, setFilter] = useState<string>('all');

  const filteredTemplates = templates.filter(t =>
    filter === 'all' || t.template_type === filter
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Tous
          </button>
          <button
            onClick={() => setFilter('email')}
            className={`px-4 py-2 rounded-lg ${filter === 'email' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Email
          </button>
          <button
            onClick={() => setFilter('sms')}
            className={`px-4 py-2 rounded-lg ${filter === 'sms' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            SMS
          </button>
          <button
            onClick={() => setFilter('whatsapp')}
            className={`px-4 py-2 rounded-lg ${filter === 'whatsapp' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            WhatsApp
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold">{template.template_name}</h3>
                  {template.is_default && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                      Par défaut
                    </span>
                  )}
                  {template.is_active ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-2">{template.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="capitalize">{template.template_type}</span>
                  <span>{template.language}</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Eye className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                  <Edit2 className="h-5 w-5" />
                </button>
              </div>
            </div>
            {template.subject && (
              <div className="mt-3 p-3 bg-gray-50 rounded">
                <p className="text-sm font-medium text-gray-700">Sujet:</p>
                <p className="text-sm text-gray-600">{template.subject}</p>
              </div>
            )}
            <div className="mt-2 p-3 bg-gray-50 rounded">
              <p className="text-sm font-medium text-gray-700 mb-1">Corps du message:</p>
              <p className="text-sm text-gray-600 line-clamp-3">{template.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImagesTab({ settings, onSave, saving }: { settings: DiffusionSettings; onSave: (updates: Partial<DiffusionSettings>) => void; saving: boolean }) {
  const [localSettings, setLocalSettings] = useState(settings);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Images par Défaut</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image par défaut - Offres d'emploi
            </label>
            <input
              type="text"
              value={localSettings.default_job_image_url || ''}
              onChange={(e) => setLocalSettings({ ...localSettings, default_job_image_url: e.target.value })}
              onBlur={() => onSave({ default_job_image_url: localSettings.default_job_image_url })}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image par défaut - Formations
            </label>
            <input
              type="text"
              value={localSettings.default_training_image_url || ''}
              onChange={(e) => setLocalSettings({ ...localSettings, default_training_image_url: e.target.value })}
              onBlur={() => onSave({ default_training_image_url: localSettings.default_training_image_url })}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo par défaut
            </label>
            <input
              type="text"
              value={localSettings.default_logo_url || ''}
              onChange={(e) => setLocalSettings({ ...localSettings, default_logo_url: e.target.value })}
              onBlur={() => onSave({ default_logo_url: localSettings.default_logo_url })}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Call-to-Action par Défaut</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CTA - Offres d'emploi
            </label>
            <input
              type="text"
              value={localSettings.default_cta_job}
              onChange={(e) => setLocalSettings({ ...localSettings, default_cta_job: e.target.value })}
              onBlur={() => onSave({ default_cta_job: localSettings.default_cta_job })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CTA - Formations
            </label>
            <input
              type="text"
              value={localSettings.default_cta_training}
              onChange={(e) => setLocalSettings({ ...localSettings, default_cta_training: e.target.value })}
              onBlur={() => onSave({ default_cta_training: localSettings.default_cta_training })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CTA - Publications
            </label>
            <input
              type="text"
              value={localSettings.default_cta_post}
              onChange={(e) => setLocalSettings({ ...localSettings, default_cta_post: e.target.value })}
              onBlur={() => onSave({ default_cta_post: localSettings.default_cta_post })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentTab({ settings, onSave, saving }: { settings: DiffusionSettings; onSave: (updates: Partial<DiffusionSettings>) => void; saving: boolean }) {
  const [localSettings, setLocalSettings] = useState(settings);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Configuration Orange Money</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro Orange Money
            </label>
            <input
              type="text"
              value={localSettings.orange_money_number}
              onChange={(e) => setLocalSettings({ ...localSettings, orange_money_number: e.target.value })}
              onBlur={() => onSave({ orange_money_number: localSettings.orange_money_number })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du bénéficiaire
            </label>
            <input
              type="text"
              value={localSettings.orange_money_recipient_name}
              onChange={(e) => setLocalSettings({ ...localSettings, orange_money_recipient_name: e.target.value })}
              onBlur={() => onSave({ orange_money_recipient_name: localSettings.orange_money_recipient_name })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructions de paiement
            </label>
            <textarea
              value={localSettings.payment_instructions || ''}
              onChange={(e) => setLocalSettings({ ...localSettings, payment_instructions: e.target.value })}
              onBlur={() => onSave({ payment_instructions: localSettings.payment_instructions })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Instructions détaillées pour le paiement..."
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Validation</h3>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Validation obligatoire</h4>
            <p className="text-sm text-gray-500">Exiger la validation admin avant diffusion</p>
          </div>
          <button
            onClick={() => {
              const newValue = !localSettings.require_payment_validation;
              setLocalSettings({ ...localSettings, require_payment_validation: newValue });
              onSave({ require_payment_validation: newValue });
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              localSettings.require_payment_validation ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                localSettings.require_payment_validation ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

function AntiSpamTab({ settings, onSave, saving }: { settings: DiffusionSettings; onSave: (updates: Partial<DiffusionSettings>) => void; saving: boolean }) {
  const [localSettings, setLocalSettings] = useState(settings);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Limites d'Envoi</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum par candidat / 24h
            </label>
            <input
              type="number"
              min="1"
              value={localSettings.max_sends_per_24h}
              onChange={(e) => setLocalSettings({ ...localSettings, max_sends_per_24h: parseInt(e.target.value) })}
              onBlur={() => onSave({ max_sends_per_24h: localSettings.max_sends_per_24h })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Nombre maximum de messages qu'un candidat peut recevoir en 24h
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum par candidat / 7 jours
            </label>
            <input
              type="number"
              min="1"
              value={localSettings.max_sends_per_7d}
              onChange={(e) => setLocalSettings({ ...localSettings, max_sends_per_7d: parseInt(e.target.value) })}
              onBlur={() => onSave({ max_sends_per_7d: localSettings.max_sends_per_7d })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Nombre maximum de messages qu'un candidat peut recevoir en 7 jours
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function WhatsAppTab({ settings, onSave, saving }: { settings: DiffusionSettings; onSave: (updates: Partial<DiffusionSettings>) => void; saving: boolean }) {
  const [localSettings, setLocalSettings] = useState(settings);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Configuration WhatsApp Admin</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numéro WhatsApp Admin
            </label>
            <input
              type="text"
              value={localSettings.whatsapp_admin_number || ''}
              onChange={(e) => setLocalSettings({ ...localSettings, whatsapp_admin_number: e.target.value })}
              onBlur={() => onSave({ whatsapp_admin_number: localSettings.whatsapp_admin_number })}
              placeholder="+224 ..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">API WhatsApp activée</h4>
              <p className="text-sm text-gray-500">Utiliser l'API WhatsApp Business</p>
            </div>
            <button
              onClick={() => {
                const newValue = !localSettings.whatsapp_api_enabled;
                setLocalSettings({ ...localSettings, whatsapp_api_enabled: newValue });
                onSave({ whatsapp_api_enabled: newValue });
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localSettings.whatsapp_api_enabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localSettings.whatsapp_api_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Mode manuel</h4>
              <p className="text-sm text-gray-500">Les messages sont copiés manuellement</p>
            </div>
            <button
              onClick={() => {
                const newValue = !localSettings.whatsapp_manual_mode;
                setLocalSettings({ ...localSettings, whatsapp_manual_mode: newValue });
                onSave({ whatsapp_manual_mode: newValue });
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localSettings.whatsapp_manual_mode ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localSettings.whatsapp_manual_mode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketingTab({ settings, onSave, saving }: { settings: DiffusionSettings; onSave: (updates: Partial<DiffusionSettings>) => void; saving: boolean }) {
  const [localSettings, setLocalSettings] = useState(settings);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Marketing B2B</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Afficher sur page B2B</h4>
              <p className="text-sm text-gray-500">Montrer le bloc diffusion ciblée</p>
            </div>
            <button
              onClick={() => {
                const newValue = !localSettings.show_b2b_marketing;
                setLocalSettings({ ...localSettings, show_b2b_marketing: newValue });
                onSave({ show_b2b_marketing: newValue });
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localSettings.show_b2b_marketing ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localSettings.show_b2b_marketing ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Texte du CTA
            </label>
            <input
              type="text"
              value={localSettings.b2b_cta_text}
              onChange={(e) => setLocalSettings({ ...localSettings, b2b_cta_text: e.target.value })}
              onBlur={() => onSave({ b2b_cta_text: localSettings.b2b_cta_text })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Tracking</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Domaine shortlink
            </label>
            <input
              type="text"
              value={localSettings.shortlink_domain}
              onChange={(e) => setLocalSettings({ ...localSettings, shortlink_domain: e.target.value })}
              onBlur={() => onSave({ shortlink_domain: localSettings.shortlink_domain })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Tracking des clics</h4>
              <p className="text-sm text-gray-500">Suivre les clics sur les liens</p>
            </div>
            <button
              onClick={() => {
                const newValue = !localSettings.enable_click_tracking;
                setLocalSettings({ ...localSettings, enable_click_tracking: newValue });
                onSave({ enable_click_tracking: newValue });
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localSettings.enable_click_tracking ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localSettings.enable_click_tracking ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogsTab({ logs }: { logs: AuditLog[] }) {
  const getActionBadge = (actionType: string) => {
    const colors: Record<string, string> = {
      'settings_updated': 'bg-blue-100 text-blue-800',
      'pricing_updated': 'bg-green-100 text-green-800',
      'template_created': 'bg-purple-100 text-purple-800',
      'template_updated': 'bg-yellow-100 text-yellow-800',
      'template_deleted': 'bg-red-100 text-red-800',
      'campaign_validated': 'bg-green-100 text-green-800',
      'campaign_rejected': 'bg-red-100 text-red-800',
      'payment_approved': 'bg-green-100 text-green-800',
      'payment_rejected': 'bg-red-100 text-red-800',
      'module_toggled': 'bg-orange-100 text-orange-800',
      'channel_toggled': 'bg-orange-100 text-orange-800',
    };

    return colors[actionType] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Journal d'Audit</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {logs.map((log) => (
            <div key={log.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getActionBadge(log.action_type)}`}>
                      {log.action_type}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900">{log.description}</p>
                  {log.entity_type && (
                    <p className="text-xs text-gray-500 mt-1">
                      {log.entity_type} {log.entity_id && `- ${log.entity_id}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
