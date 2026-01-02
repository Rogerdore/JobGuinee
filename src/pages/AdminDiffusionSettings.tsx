import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useModalContext } from '../contexts/ModalContext';
import {
  Settings, DollarSign, Users, MessageSquare, Image as ImageIcon,
  CreditCard, Shield, Send, TrendingUp, Clock, Save, RefreshCw,
  Mail, Phone, CheckCircle, XCircle, Eye, Plus, Edit2, Trash2,
  ToggleRight, ToggleLeft, AlertCircle, Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type TabType = 'general' | 'channels' | 'audience' | 'templates' | 'images' | 'payment' | 'antispam' | 'whatsapp' | 'marketing' | 'logs';

interface SystemSettings {
  id: string;
  module_enabled: boolean;
  jobs_enabled: boolean;
  trainings_enabled: boolean;
  posts_enabled: boolean;
  test_mode: boolean;
  admin_info_message: string;
  shortlink_domain: string;
  tracking_enabled: boolean;
}

interface ChannelPricing {
  id: string;
  channel: string;
  enabled: boolean;
  unit_cost: number;
  currency: string;
  description: string;
}

interface AudienceRules {
  id: string;
  min_profile_completion: number;
  max_inactive_days: number;
  priority_by_completion: boolean;
  priority_by_activity: boolean;
  allow_multi_channel: boolean;
  max_quantity_per_campaign: number;
}

interface PaymentSettings {
  id: string;
  orange_money_number: string;
  beneficiary_name: string;
  payment_message: string;
  require_admin_validation: boolean;
  allow_free_campaigns: boolean;
}

interface AntispamRules {
  id: string;
  max_per_candidate_24h: number;
  max_per_candidate_7d: number;
  respect_opt_out: boolean;
  respect_blacklist: boolean;
}

interface WhatsAppConfig {
  id: string;
  admin_whatsapp_number: string;
  api_enabled: boolean;
  send_mode: string;
  templates: any;
}

interface MarketingContent {
  id: string;
  show_on_b2b_page: boolean;
  title: string;
  subtitle: string;
  description: string;
  cta_text: string;
  cta_url: string;
}

interface ImageSettings {
  id: string;
  generic_job_image_url: string;
  generic_training_image_url: string;
  generic_post_image_url: string;
  default_logo_url: string;
  default_cta_job: string;
  default_cta_training: string;
  default_cta_post: string;
  enable_ai_images: boolean;
}

export default function AdminDiffusionSettings() {
  const { showSuccess, showError, showWarning, showConfirm } = useModalContext();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [channels, setChannels] = useState<ChannelPricing[]>([]);
  const [audienceRules, setAudienceRules] = useState<AudienceRules | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [antispamRules, setAntispamRules] = useState<AntispamRules | null>(null);
  const [whatsappConfig, setWhatsAppConfig] = useState<WhatsAppConfig | null>(null);
  const [marketingContent, setMarketingContent] = useState<MarketingContent | null>(null);
  const [imageSettings, setImageSettings] = useState<ImageSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        { data: sysSettings },
        { data: channelData },
        { data: audRules },
        { data: paySettings },
        { data: antiSpam },
        { data: whatsApp },
        { data: marketing },
        { data: images },
        { data: logs }
      ] = await Promise.all([
        supabase.from('diffusion_system_settings').select('*').limit(1).single(),
        supabase.from('diffusion_channel_pricing').select('*').order('channel'),
        supabase.from('diffusion_audience_rules').select('*').limit(1).single(),
        supabase.from('diffusion_payment_settings').select('*').limit(1).single(),
        supabase.from('diffusion_antispam_rules').select('*').limit(1).single(),
        supabase.from('diffusion_whatsapp_config').select('*').limit(1).single(),
        supabase.from('diffusion_marketing_content').select('*').limit(1).single(),
        supabase.from('diffusion_image_settings').select('*').limit(1).single(),
        supabase.from('diffusion_config_audit').select('*').order('created_at', { ascending: false }).limit(50)
      ]);

      setSystemSettings(sysSettings);
      setChannels(channelData || []);
      setAudienceRules(audRules);
      setPaymentSettings(paySettings);
      setAntispamRules(antiSpam);
      setWhatsAppConfig(whatsApp);
      setMarketingContent(marketing);
      setImageSettings(images);
      setAuditLogs(logs || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const updateSystemSettings = async (updates: Partial<SystemSettings>) => {
    if (!systemSettings) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('diffusion_system_settings')
        .update({ ...updates, updated_by: user?.id, updated_at: new Date().toISOString() })
        .eq('id', systemSettings.id);

      if (error) throw error;
      await loadData();
      showSuccess('Paramètres enregistrés avec succès');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const updateChannelPricing = async (channelId: string, updates: Partial<ChannelPricing>) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('diffusion_channel_pricing')
        .update({ ...updates, updated_by: user?.id, updated_at: new Date().toISOString() })
        .eq('id', channelId);

      if (error) throw error;
      await loadData();
      showSuccess('Tarification mise à jour');
    } catch (error) {
      console.error('Error updating channel:', error);
      showSuccess('Mise à jour', 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const updateAudienceRules = async (updates: Partial<AudienceRules>) => {
    if (!audienceRules) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('diffusion_audience_rules')
        .update({ ...updates, updated_by: user?.id, updated_at: new Date().toISOString() })
        .eq('id', audienceRules.id);

      if (error) throw error;
      await loadData();
      showSuccess('Règles d\'audience mises à jour');
    } catch (error) {
      console.error('Error updating rules:', error);
      showSuccess('Mise à jour', 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const updatePaymentSettings = async (updates: Partial<PaymentSettings>) => {
    if (!paymentSettings) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('diffusion_payment_settings')
        .update({ ...updates, updated_by: user?.id, updated_at: new Date().toISOString() })
        .eq('id', paymentSettings.id);

      if (error) throw error;
      await loadData();
      showSuccess('Paramètres de paiement mis à jour');
    } catch (error) {
      console.error('Error updating payment:', error);
      showSuccess('Mise à jour', 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const updateAntispamRules = async (updates: Partial<AntispamRules>) => {
    if (!antispamRules) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('diffusion_antispam_rules')
        .update({ ...updates, updated_by: user?.id, updated_at: new Date().toISOString() })
        .eq('id', antispamRules.id);

      if (error) throw error;
      await loadData();
      showSuccess('Règles anti-spam mises à jour');
    } catch (error) {
      console.error('Error updating antispam:', error);
      showSuccess('Mise à jour', 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const updateWhatsAppConfig = async (updates: Partial<WhatsAppConfig>) => {
    if (!whatsappConfig) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('diffusion_whatsapp_config')
        .update({ ...updates, updated_by: user?.id, updated_at: new Date().toISOString() })
        .eq('id', whatsappConfig.id);

      if (error) throw error;
      await loadData();
      showSuccess('Configuration WhatsApp mise à jour');
    } catch (error) {
      console.error('Error updating whatsapp:', error);
      showSuccess('Mise à jour', 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const updateMarketingContent = async (updates: Partial<MarketingContent>) => {
    if (!marketingContent) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('diffusion_marketing_content')
        .update({ ...updates, updated_by: user?.id, updated_at: new Date().toISOString() })
        .eq('id', marketingContent.id);

      if (error) throw error;
      await loadData();
      showSuccess('Contenu marketing mis à jour');
    } catch (error) {
      console.error('Error updating marketing:', error);
      showSuccess('Mise à jour', 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const updateImageSettings = async (updates: Partial<ImageSettings>) => {
    if (!imageSettings) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('diffusion_image_settings')
        .update({ ...updates, updated_by: user?.id, updated_at: new Date().toISOString() })
        .eq('id', imageSettings.id);

      if (error) throw error;
      await loadData();
      showSuccess('Paramètres d\'images mis à jour');
    } catch (error) {
      console.error('Error updating images:', error);
      showSuccess('Mise à jour', 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general' as TabType, label: 'Général', icon: Settings },
    { id: 'channels' as TabType, label: 'Canaux & Tarifs', icon: DollarSign },
    { id: 'audience' as TabType, label: 'Audience', icon: Users },
    { id: 'images' as TabType, label: 'Images & CTA', icon: ImageIcon },
    { id: 'payment' as TabType, label: 'Paiement', icon: CreditCard },
    { id: 'antispam' as TabType, label: 'Anti-spam', icon: Shield },
    { id: 'whatsapp' as TabType, label: 'WhatsApp', icon: Send },
    { id: 'marketing' as TabType, label: 'Marketing B2B', icon: TrendingUp },
    { id: 'logs' as TabType, label: 'Audit', icon: Clock },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-[#FF8C00] mx-auto mb-4" />
            <p className="text-gray-600">Chargement des paramètres...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configuration Diffusion Ciblée</h1>
            <p className="text-gray-600 mt-1">
              {systemSettings?.admin_info_message || 'Gérez tous les paramètres de la diffusion multicanale'}
            </p>
          </div>
          <button
            onClick={() => loadData()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 overflow-hidden">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-[#FF8C00] to-orange-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-8">
          {/* GENERAL TAB */}
          {activeTab === 'general' && systemSettings && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Paramètres Généraux</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Activation du Module</h3>

                  <div className="space-y-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-gray-700 font-medium">Module actif</span>
                      <button
                        onClick={() => updateSystemSettings({ module_enabled: !systemSettings.module_enabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          systemSettings.module_enabled ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          systemSettings.module_enabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-gray-700">Offres d'emploi</span>
                      <button
                        onClick={() => updateSystemSettings({ jobs_enabled: !systemSettings.jobs_enabled })}
                        disabled={!systemSettings.module_enabled}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          systemSettings.jobs_enabled && systemSettings.module_enabled ? 'bg-green-500' : 'bg-gray-300'
                        } ${!systemSettings.module_enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          systemSettings.jobs_enabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-gray-700">Formations</span>
                      <button
                        onClick={() => updateSystemSettings({ trainings_enabled: !systemSettings.trainings_enabled })}
                        disabled={!systemSettings.module_enabled}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          systemSettings.trainings_enabled && systemSettings.module_enabled ? 'bg-green-500' : 'bg-gray-300'
                        } ${!systemSettings.module_enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          systemSettings.trainings_enabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-gray-700">Publications</span>
                      <button
                        onClick={() => updateSystemSettings({ posts_enabled: !systemSettings.posts_enabled })}
                        disabled={!systemSettings.module_enabled}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          systemSettings.posts_enabled && systemSettings.module_enabled ? 'bg-green-500' : 'bg-gray-300'
                        } ${!systemSettings.module_enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          systemSettings.posts_enabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </label>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Mode & Tracking</h3>

                  <div className="space-y-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-gray-700 font-medium">Mode Test</span>
                      <button
                        onClick={() => updateSystemSettings({ test_mode: !systemSettings.test_mode })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          systemSettings.test_mode ? 'bg-yellow-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          systemSettings.test_mode ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-gray-700">Tracking des clics</span>
                      <button
                        onClick={() => updateSystemSettings({ tracking_enabled: !systemSettings.tracking_enabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          systemSettings.tracking_enabled ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          systemSettings.tracking_enabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Domaine shortlink
                      </label>
                      <input
                        type="text"
                        value={systemSettings.shortlink_domain}
                        onChange={(e) => setSystemSettings({ ...systemSettings, shortlink_domain: e.target.value })}
                        onBlur={() => updateSystemSettings({ shortlink_domain: systemSettings.shortlink_domain })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message informatif Admin
                </label>
                <textarea
                  value={systemSettings.admin_info_message}
                  onChange={(e) => setSystemSettings({ ...systemSettings, admin_info_message: e.target.value })}
                  onBlur={() => updateSystemSettings({ admin_info_message: systemSettings.admin_info_message })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                  placeholder="Message affiché en haut de cette page..."
                />
              </div>
            </div>
          )}

          {/* CHANNELS TAB */}
          {activeTab === 'channels' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Canaux & Tarification</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {channels.map((channel) => (
                  <div key={channel.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 capitalize">
                        {channel.channel}
                      </h3>
                      <button
                        onClick={() => updateChannelPricing(channel.id, { enabled: !channel.enabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          channel.enabled ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          channel.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Coût unitaire ({channel.currency})
                        </label>
                        <input
                          type="number"
                          value={channel.unit_cost}
                          onChange={(e) => {
                            const newChannels = channels.map(c =>
                              c.id === channel.id ? { ...c, unit_cost: parseInt(e.target.value) || 0 } : c
                            );
                            setChannels(newChannels);
                          }}
                          onBlur={() => updateChannelPricing(channel.id, { unit_cost: channel.unit_cost })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                          disabled={!channel.enabled}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={channel.description || ''}
                          onChange={(e) => {
                            const newChannels = channels.map(c =>
                              c.id === channel.id ? { ...c, description: e.target.value } : c
                            );
                            setChannels(newChannels);
                          }}
                          onBlur={() => updateChannelPricing(channel.id, { description: channel.description })}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                          disabled={!channel.enabled}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note :</strong> Les nouveaux tarifs s'appliquent uniquement aux nouvelles campagnes.
                  Les campagnes en cours conservent leurs tarifs d'origine.
                </p>
              </div>
            </div>
          )}

          {/* AUDIENCE TAB */}
          {activeTab === 'audience' && audienceRules && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Règles d'Audience</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Critères de Sélection</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Complétion minimale du profil (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={audienceRules.min_profile_completion}
                        onChange={(e) => setAudienceRules({ ...audienceRules, min_profile_completion: parseInt(e.target.value) || 0 })}
                        onBlur={() => updateAudienceRules({ min_profile_completion: audienceRules.min_profile_completion })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Inactivité maximale (jours)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={audienceRules.max_inactive_days}
                        onChange={(e) => setAudienceRules({ ...audienceRules, max_inactive_days: parseInt(e.target.value) || 30 })}
                        onBlur={() => updateAudienceRules({ max_inactive_days: audienceRules.max_inactive_days })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantité maximale par campagne
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={audienceRules.max_quantity_per_campaign}
                        onChange={(e) => setAudienceRules({ ...audienceRules, max_quantity_per_campaign: parseInt(e.target.value) || 10000 })}
                        onBlur={() => updateAudienceRules({ max_quantity_per_campaign: audienceRules.max_quantity_per_campaign })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Priorités & Options</h3>

                  <div className="space-y-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-gray-700">Prioriser profils complétés</span>
                      <button
                        onClick={() => updateAudienceRules({ priority_by_completion: !audienceRules.priority_by_completion })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          audienceRules.priority_by_completion ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          audienceRules.priority_by_completion ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-gray-700">Prioriser actifs récents</span>
                      <button
                        onClick={() => updateAudienceRules({ priority_by_activity: !audienceRules.priority_by_activity })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          audienceRules.priority_by_activity ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          audienceRules.priority_by_activity ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-gray-700">Autoriser multi-canaux</span>
                      <button
                        onClick={() => updateAudienceRules({ allow_multi_channel: !audienceRules.allow_multi_channel })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          audienceRules.allow_multi_channel ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          audienceRules.allow_multi_channel ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </label>
                  </div>

                  <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      Les règles d'audience s'appliquent au calcul de l'audience disponible lors de la création de campagnes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* IMAGES TAB */}
          {activeTab === 'images' && imageSettings && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Images & CTA</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Images Génériques</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image emploi par défaut
                      </label>
                      <input
                        type="url"
                        value={imageSettings.generic_job_image_url || ''}
                        onChange={(e) => setImageSettings({ ...imageSettings, generic_job_image_url: e.target.value })}
                        onBlur={() => updateImageSettings({ generic_job_image_url: imageSettings.generic_job_image_url })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image formation par défaut
                      </label>
                      <input
                        type="url"
                        value={imageSettings.generic_training_image_url || ''}
                        onChange={(e) => setImageSettings({ ...imageSettings, generic_training_image_url: e.target.value })}
                        onBlur={() => updateImageSettings({ generic_training_image_url: imageSettings.generic_training_image_url })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image publication par défaut
                      </label>
                      <input
                        type="url"
                        value={imageSettings.generic_post_image_url || ''}
                        onChange={(e) => setImageSettings({ ...imageSettings, generic_post_image_url: e.target.value })}
                        onBlur={() => updateImageSettings({ generic_post_image_url: imageSettings.generic_post_image_url })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Logo par défaut
                      </label>
                      <input
                        type="url"
                        value={imageSettings.default_logo_url || ''}
                        onChange={(e) => setImageSettings({ ...imageSettings, default_logo_url: e.target.value })}
                        onBlur={() => updateImageSettings({ default_logo_url: imageSettings.default_logo_url })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                        placeholder="https://..."
                      />
                    </div>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-gray-700">Activer images IA</span>
                      <button
                        onClick={() => updateImageSettings({ enable_ai_images: !imageSettings.enable_ai_images })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          imageSettings.enable_ai_images ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          imageSettings.enable_ai_images ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </label>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Textes CTA</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CTA Emploi
                      </label>
                      <input
                        type="text"
                        value={imageSettings.default_cta_job}
                        onChange={(e) => setImageSettings({ ...imageSettings, default_cta_job: e.target.value })}
                        onBlur={() => updateImageSettings({ default_cta_job: imageSettings.default_cta_job })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CTA Formation
                      </label>
                      <input
                        type="text"
                        value={imageSettings.default_cta_training}
                        onChange={(e) => setImageSettings({ ...imageSettings, default_cta_training: e.target.value })}
                        onBlur={() => updateImageSettings({ default_cta_training: imageSettings.default_cta_training })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CTA Publication
                      </label>
                      <input
                        type="text"
                        value={imageSettings.default_cta_post}
                        onChange={(e) => setImageSettings({ ...imageSettings, default_cta_post: e.target.value })}
                        onBlur={() => updateImageSettings({ default_cta_post: imageSettings.default_cta_post })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Ordre de fallback :</strong>
                      <br />1. Image de l'annonce
                      <br />2. Logo entreprise
                      <br />3. Image générique
                      <br />4. Image IA (si activée)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAYMENT TAB */}
          {activeTab === 'payment' && paymentSettings && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Paiement Manuel</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Orange Money</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Numéro Orange Money Admin
                      </label>
                      <input
                        type="tel"
                        value={paymentSettings.orange_money_number}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, orange_money_number: e.target.value })}
                        onBlur={() => updatePaymentSettings({ orange_money_number: paymentSettings.orange_money_number })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                        placeholder="+224 ..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom du bénéficiaire
                      </label>
                      <input
                        type="text"
                        value={paymentSettings.beneficiary_name}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, beneficiary_name: e.target.value })}
                        onBlur={() => updatePaymentSettings({ beneficiary_name: paymentSettings.beneficiary_name })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message de paiement
                      </label>
                      <textarea
                        value={paymentSettings.payment_message}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, payment_message: e.target.value })}
                        onBlur={() => updatePaymentSettings({ payment_message: paymentSettings.payment_message })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Variables : {'{{number}}'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Validation</h3>

                  <div className="space-y-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-gray-700 font-medium">Validation Admin obligatoire</span>
                      <button
                        onClick={() => updatePaymentSettings({ require_admin_validation: !paymentSettings.require_admin_validation })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          paymentSettings.require_admin_validation ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          paymentSettings.require_admin_validation ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-gray-700">Autoriser campagnes gratuites</span>
                      <button
                        onClick={() => updatePaymentSettings({ allow_free_campaigns: !paymentSettings.allow_free_campaigns })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          paymentSettings.allow_free_campaigns ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          paymentSettings.allow_free_campaigns ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </label>
                  </div>

                  <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Important :</strong> La validation Admin doit rester activée pour un contrôle total des paiements.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ANTISPAM TAB */}
          {activeTab === 'antispam' && antispamRules && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Règles Anti-spam</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Limites Temporelles</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max diffusions / candidat / 24h
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={antispamRules.max_per_candidate_24h}
                        onChange={(e) => setAntispamRules({ ...antispamRules, max_per_candidate_24h: parseInt(e.target.value) || 1 })}
                        onBlur={() => updateAntispamRules({ max_per_candidate_24h: antispamRules.max_per_candidate_24h })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max diffusions / candidat / 7 jours
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={antispamRules.max_per_candidate_7d}
                        onChange={(e) => setAntispamRules({ ...antispamRules, max_per_candidate_7d: parseInt(e.target.value) || 2 })}
                        onBlur={() => updateAntispamRules({ max_per_candidate_7d: antispamRules.max_per_candidate_7d })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Consentements</h3>

                  <div className="space-y-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-gray-700">Respecter les opt-out</span>
                      <button
                        onClick={() => updateAntispamRules({ respect_opt_out: !antispamRules.respect_opt_out })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          antispamRules.respect_opt_out ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          antispamRules.respect_opt_out ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-gray-700">Respecter la blacklist</span>
                      <button
                        onClick={() => updateAntispamRules({ respect_blacklist: !antispamRules.respect_blacklist })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          antispamRules.respect_blacklist ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          antispamRules.respect_blacklist ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </label>
                  </div>

                  <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      <strong>RGPD :</strong> Les règles anti-spam et le respect des consentements sont obligatoires pour la conformité légale.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WHATSAPP TAB */}
          {activeTab === 'whatsapp' && whatsappConfig && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Configuration WhatsApp</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Paramètres Généraux</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Numéro WhatsApp Admin
                      </label>
                      <input
                        type="tel"
                        value={whatsappConfig.admin_whatsapp_number}
                        onChange={(e) => setWhatsAppConfig({ ...whatsappConfig, admin_whatsapp_number: e.target.value })}
                        onBlur={() => updateWhatsAppConfig({ admin_whatsapp_number: whatsappConfig.admin_whatsapp_number })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                        placeholder="+224 ..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mode d'envoi
                      </label>
                      <select
                        value={whatsappConfig.send_mode}
                        onChange={(e) => updateWhatsAppConfig({ send_mode: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                      >
                        <option value="manual">Manuel (copie)</option>
                        <option value="api">API automatique</option>
                      </select>
                    </div>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-gray-700">API WhatsApp activée</span>
                      <button
                        onClick={() => updateWhatsAppConfig({ api_enabled: !whatsappConfig.api_enabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          whatsappConfig.api_enabled ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          whatsappConfig.api_enabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </label>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Templates Messages</h3>

                  <div className="space-y-2 text-sm">
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <p className="font-medium text-gray-900">✓ Demande de paiement</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <p className="font-medium text-gray-900">✓ Paiement approuvé</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <p className="font-medium text-gray-900">✓ Paiement rejeté</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <p className="font-medium text-gray-900">✓ Campagne terminée</p>
                    </div>
                  </div>

                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      Les templates sont préconfigurés dans la base de données.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MARKETING TAB */}
          {activeTab === 'marketing' && marketingContent && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Marketing B2B</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Contenu Marketing</h3>

                  <div className="space-y-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-gray-700 font-medium">Afficher sur page B2B</span>
                      <button
                        onClick={() => updateMarketingContent({ show_on_b2b_page: !marketingContent.show_on_b2b_page })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          marketingContent.show_on_b2b_page ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          marketingContent.show_on_b2b_page ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Titre
                      </label>
                      <input
                        type="text"
                        value={marketingContent.title}
                        onChange={(e) => setMarketingContent({ ...marketingContent, title: e.target.value })}
                        onBlur={() => updateMarketingContent({ title: marketingContent.title })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sous-titre
                      </label>
                      <input
                        type="text"
                        value={marketingContent.subtitle}
                        onChange={(e) => setMarketingContent({ ...marketingContent, subtitle: e.target.value })}
                        onBlur={() => updateMarketingContent({ subtitle: marketingContent.subtitle })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={marketingContent.description}
                        onChange={(e) => setMarketingContent({ ...marketingContent, description: e.target.value })}
                        onBlur={() => updateMarketingContent({ description: marketingContent.description })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Call-to-Action</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Texte du CTA
                      </label>
                      <input
                        type="text"
                        value={marketingContent.cta_text}
                        onChange={(e) => setMarketingContent({ ...marketingContent, cta_text: e.target.value })}
                        onBlur={() => updateMarketingContent({ cta_text: marketingContent.cta_text })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL du CTA
                      </label>
                      <input
                        type="text"
                        value={marketingContent.cta_url}
                        onChange={(e) => setMarketingContent({ ...marketingContent, cta_url: e.target.value })}
                        onBlur={() => updateMarketingContent({ cta_url: marketingContent.cta_url })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                        placeholder="/contact"
                      />
                    </div>
                  </div>

                  <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      <strong>Prévisualisation :</strong> Les modifications s'affichent immédiatement sur la page B2B Solutions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LOGS TAB */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Journal d'Audit</h2>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Table
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admin
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          Aucun log disponible
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(log.created_at).toLocaleString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.table_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              log.action === 'INSERT' ? 'bg-green-100 text-green-800' :
                              log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.admin_email || log.admin_id}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Traçabilité :</strong> Toutes les modifications de configuration sont automatiquement journalisées avec l'identité de l'Admin responsable.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
