import React, { useState, useEffect } from 'react';
import {
  Mail, Save, Send, Eye, EyeOff, CheckCircle, AlertCircle, Loader,
  RefreshCw, Zap, Settings, Activity, BarChart2, Clock, XCircle,
  ChevronDown, Info, Shield, Globe
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface EmailConfig {
  id?: string;
  provider_type: 'smtp' | 'sendgrid' | 'aws_ses' | 'mailgun' | 'resend' | 'brevo';
  is_active: boolean;
  smtp_host?: string;
  smtp_port?: number;
  smtp_secure?: boolean;
  smtp_user?: string;
  smtp_password?: string;
  api_key?: string;
  api_domain?: string;
  api_region?: string;
  from_email: string;
  from_name: string;
  reply_to_email?: string;
  daily_limit?: number;
  rate_limit_per_minute?: number;
  last_tested_at?: string;
  last_test_status?: string;
  last_test_error?: string;
}

interface EmailStats {
  total_sent: number;
  total_failed: number;
  total_pending: number;
  sent_today: number;
  failed_today: number;
}

interface EmailLog {
  id: string;
  recipient_email: string;
  subject: string;
  provider: string;
  status: string;
  error_message?: string;
  sent_at: string;
  template_code: string;
}

const PROVIDERS = [
  {
    value: 'sendgrid',
    label: 'SendGrid',
    badge: 'Recommandé',
    badgeColor: 'bg-green-100 text-green-700',
    description: 'API puissante, haute délivrabilité, analytics avancés',
    icon: '📧',
    usesApi: true,
  },
  {
    value: 'resend',
    label: 'Resend',
    badge: 'Moderne',
    badgeColor: 'bg-blue-100 text-blue-700',
    description: 'Service moderne orienté développeurs',
    icon: '⚡',
    usesApi: true,
  },
  {
    value: 'brevo',
    label: 'Brevo (Sendinblue)',
    badge: '',
    badgeColor: '',
    description: 'Marketing + transactionnel tout-en-un',
    icon: '📬',
    usesApi: true,
  },
  {
    value: 'mailgun',
    label: 'Mailgun',
    badge: '',
    badgeColor: '',
    description: 'Flexible, adapté aux volumes élevés',
    icon: '🔫',
    usesApi: true,
    needsDomain: true,
  },
  {
    value: 'aws_ses',
    label: 'AWS SES',
    badge: '',
    badgeColor: '',
    description: 'Amazon Simple Email Service',
    icon: '☁️',
    usesApi: true,
    needsRegion: true,
  },
  {
    value: 'smtp',
    label: 'SMTP personnalisé',
    badge: '',
    badgeColor: '',
    description: 'Votre propre serveur SMTP (Gmail, Hostinger…)',
    icon: '🔧',
    usesApi: false,
  },
] as const;

type TabId = 'config' | 'test' | 'logs' | 'stats';

export default function AdminEmailConfig() {
  const { profile } = useAuth();

  const [activeTab, setActiveTab] = useState<TabId>('config');
  const [allConfigs, setAllConfigs] = useState<EmailConfig[]>([]);
  const [config, setConfig] = useState<EmailConfig>({
    provider_type: 'sendgrid',
    is_active: false,
    from_email: 'contact@jobguinee-pro.com',
    from_name: 'JobGuinée',
    reply_to_email: 'contact@jobguinee-pro.com',
    daily_limit: 100,
    rate_limit_per_minute: 100,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; provider?: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (profile?.user_type === 'admin') {
      loadAllConfigs();
    }
  }, [profile]);

  useEffect(() => {
    if (activeTab === 'logs') loadLogs();
    if (activeTab === 'stats') loadStats();
  }, [activeTab]);

  const loadAllConfigs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_provider_config')
        .select('*')
        .order('is_active', { ascending: false })
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setAllConfigs(data || []);

      const active = (data || []).find(c => c.is_active);
      if (active) setConfig(active);
    } catch (err) {
      console.error('Error loading email configs:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const [pendingRes, logsRes] = await Promise.all([
        supabase.from('email_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('email_logs').select('status, sent_at').order('sent_at', { ascending: false }).limit(1000),
      ]);

      const today = new Date().toISOString().slice(0, 10);
      const logsData = logsRes.data || [];
      const sentToday = logsData.filter(l => l.status === 'delivered' && l.sent_at?.slice(0, 10) === today).length;
      const failedToday = logsData.filter(l => l.status === 'failed' && l.sent_at?.slice(0, 10) === today).length;

      setStats({
        total_sent: logsData.filter(l => l.status === 'delivered').length,
        total_failed: logsData.filter(l => l.status === 'failed').length,
        total_pending: pendingRes.count || 0,
        sent_today: sentToday,
        failed_today: failedToday,
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('id, recipient_email, subject, provider, status, error_message, sent_at, template_code')
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error loading logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSelectConfig = (cfg: EmailConfig) => {
    setConfig(cfg);
    setSaveMsg(null);
    setTestResult(null);
  };

  const handleSave = async () => {
    if (!config.from_email || !config.from_name) {
      setSaveMsg({ type: 'error', text: "L'email et le nom expéditeur sont obligatoires." });
      return;
    }

    setSaving(true);
    setSaveMsg(null);
    try {
      if (config.is_active) {
        await supabase.from('email_provider_config').update({ is_active: false }).neq('id', config.id || '');
      }

      if (config.id) {
        const { error } = await supabase
          .from('email_provider_config')
          .update({ ...config, updated_at: new Date().toISOString() })
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('email_provider_config')
          .insert([{ ...config, created_by: profile?.id }])
          .select()
          .single();
        if (error) throw error;
        setConfig(data);
      }

      setSaveMsg({ type: 'success', text: 'Configuration enregistrée avec succès.' });
      await loadAllConfigs();
    } catch (err: any) {
      setSaveMsg({ type: 'error', text: err.message || 'Erreur lors de la sauvegarde.' });
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (cfg: EmailConfig) => {
    try {
      await supabase.from('email_provider_config').update({ is_active: false }).neq('id', cfg.id || '');
      await supabase.from('email_provider_config').update({ is_active: true }).eq('id', cfg.id!);
      await loadAllConfigs();
      setSaveMsg({ type: 'success', text: `${getProvider(cfg.provider_type)?.label} activé comme provider principal.` });
    } catch (err: any) {
      setSaveMsg({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async (cfg: EmailConfig) => {
    if (cfg.is_active) {
      setSaveMsg({ type: 'error', text: 'Désactivez ce provider avant de le supprimer.' });
      return;
    }
    if (!confirm('Supprimer cette configuration ?')) return;
    try {
      await supabase.from('email_provider_config').delete().eq('id', cfg.id!);
      await loadAllConfigs();
    } catch (err: any) {
      setSaveMsg({ type: 'error', text: err.message });
    }
  };

  const handleTest = async () => {
    if (!testEmail.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            to: testEmail.trim(),
            toName: 'Test Admin',
            subject: 'Test Email - JobGuinée',
            htmlBody: `
              <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
                <h2 style="color:#1d4ed8">Test de configuration email</h2>
                <p>Cet email confirme que votre moteur d'envoi fonctionne correctement.</p>
                <p style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;color:#166534">
                  Envoyé via le moteur central JobGuinée
                </p>
              </div>
            `,
            textBody: 'Test de configuration email - JobGuinée. Si vous recevez ce message, votre moteur email fonctionne.',
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        setTestResult({ success: true, message: `Email envoyé via ${result.provider || 'le provider actif'}. Vérifiez votre boite.`, provider: result.provider });
      } else {
        setTestResult({ success: false, message: result.error || "Échec de l'envoi." });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  const getProvider = (type: string) => PROVIDERS.find(p => p.value === type);
  const activeConfig = allConfigs.find(c => c.is_active);
  const currentProvider = getProvider(config.provider_type);

  if (profile?.user_type !== 'admin') {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Accès refusé</h2>
        <p className="text-gray-600">Seuls les administrateurs peuvent accéder à cette page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'config', label: 'Configuration', icon: <Settings className="w-4 h-4" /> },
    { id: 'test', label: 'Test', icon: <Send className="w-4 h-4" /> },
    { id: 'logs', label: 'Journaux', icon: <Activity className="w-4 h-4" /> },
    { id: 'stats', label: 'Statistiques', icon: <BarChart2 className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Moteur Email Central</h1>
            <p className="text-sm text-gray-500">Gérez tous les envois d'emails de la plateforme</p>
          </div>
        </div>
        {activeConfig && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-green-700">
              {getProvider(activeConfig.provider_type)?.label} actif
            </span>
          </div>
        )}
      </div>

      {/* Message global */}
      {saveMsg && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border-l-4 ${saveMsg.type === 'success' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
          {saveMsg.type === 'success'
            ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <p className={`text-sm font-medium ${saveMsg.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{saveMsg.text}</p>
          <button onClick={() => setSaveMsg(null)} className="ml-auto text-gray-400 hover:text-gray-600">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Providers overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {allConfigs.map(cfg => {
          const prov = getProvider(cfg.provider_type);
          const isSelected = config.id === cfg.id;
          return (
            <button
              key={cfg.id}
              onClick={() => handleSelectConfig(cfg)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{prov?.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{prov?.label || cfg.provider_type}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[140px]">{cfg.from_email}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {cfg.is_active && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Actif</span>
                  )}
                  {cfg.last_test_status === 'success' && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">Testé</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
        <button
          onClick={() => {
            setConfig({ provider_type: 'sendgrid', is_active: false, from_email: 'contact@jobguinee-pro.com', from_name: 'JobGuinée', reply_to_email: 'contact@jobguinee-pro.com', daily_limit: 100, rate_limit_per_minute: 100 });
            setSaveMsg(null);
          }}
          className="p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 text-gray-500 hover:text-blue-600 transition text-sm font-medium flex items-center justify-center gap-2"
        >
          + Nouveau provider
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition border-b-2 ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ── TAB CONFIG ── */}
          {activeTab === 'config' && (
            <div className="space-y-6">

              {/* Provider selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Fournisseur</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {PROVIDERS.map(prov => (
                    <button
                      key={prov.value}
                      type="button"
                      onClick={() => setConfig(c => ({ ...c, provider_type: prov.value as EmailConfig['provider_type'] }))}
                      className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition ${config.provider_type === prov.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <span className="text-xl shrink-0">{prov.icon}</span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-gray-900">{prov.label}</span>
                          {prov.badge && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${prov.badgeColor}`}>{prov.badge}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 leading-tight">{prov.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Expéditeur */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email expéditeur *</label>
                  <input
                    type="email"
                    value={config.from_email}
                    onChange={e => setConfig(c => ({ ...c, from_email: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="contact@jobguinee-pro.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom expéditeur *</label>
                  <input
                    type="text"
                    value={config.from_name}
                    onChange={e => setConfig(c => ({ ...c, from_name: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="JobGuinée"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email de réponse (optionnel)</label>
                  <input
                    type="email"
                    value={config.reply_to_email || ''}
                    onChange={e => setConfig(c => ({ ...c, reply_to_email: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="contact@jobguinee-pro.com"
                  />
                </div>
              </div>

              {/* API providers */}
              {currentProvider?.usesApi && (
                <div className="p-4 bg-gray-50 rounded-xl space-y-4 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Clé API {currentProvider.label}</h3>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Clé API *</label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={config.api_key || ''}
                        onChange={e => setConfig(c => ({ ...c, api_key: e.target.value }))}
                        className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                        placeholder="Votre clé API"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {config.provider_type === 'mailgun' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Domaine Mailgun *</label>
                      <input
                        type="text"
                        value={config.api_domain || ''}
                        onChange={e => setConfig(c => ({ ...c, api_domain: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="mg.votredomaine.com"
                      />
                    </div>
                  )}
                  {config.provider_type === 'aws_ses' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Région AWS</label>
                      <input
                        type="text"
                        value={config.api_region || ''}
                        onChange={e => setConfig(c => ({ ...c, api_region: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="us-east-1"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* SMTP */}
              {config.provider_type === 'smtp' && (
                <div className="p-4 bg-gray-50 rounded-xl space-y-4 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Configuration SMTP</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Hôte SMTP *</label>
                      <input
                        type="text"
                        value={config.smtp_host || ''}
                        onChange={e => setConfig(c => ({ ...c, smtp_host: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="smtp.hostinger.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Port *</label>
                      <input
                        type="number"
                        value={config.smtp_port || 587}
                        onChange={e => setConfig(c => ({ ...c, smtp_port: parseInt(e.target.value) }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Utilisateur *</label>
                    <input
                      type="text"
                      value={config.smtp_user || ''}
                      onChange={e => setConfig(c => ({ ...c, smtp_user: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={config.smtp_password || ''}
                        onChange={e => setConfig(c => ({ ...c, smtp_password: e.target.value }))}
                        className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.smtp_secure ?? true}
                      onChange={e => setConfig(c => ({ ...c, smtp_secure: e.target.checked }))}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-gray-700">Connexion sécurisée (SSL/TLS)</span>
                  </label>
                </div>
              )}

              {/* Limites */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Limite quotidienne</label>
                  <input
                    type="number"
                    value={config.daily_limit || 100}
                    onChange={e => setConfig(c => ({ ...c, daily_limit: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Emails par minute</label>
                  <input
                    type="number"
                    value={config.rate_limit_per_minute || 100}
                    onChange={e => setConfig(c => ({ ...c, rate_limit_per_minute: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Activer */}
              <label className="flex items-center gap-3 cursor-pointer p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={config.is_active}
                    onChange={e => setConfig(c => ({ ...c, is_active: e.target.checked }))}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors ${config.is_active ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${config.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Activer comme provider principal</p>
                  <p className="text-xs text-gray-500">Tous les emails (alertes, auth, invitations…) passeront par ce provider</p>
                </div>
              </label>

              {/* Dernier test */}
              {config.last_tested_at && (
                <div className={`flex items-start gap-3 p-4 rounded-xl border ${config.last_test_status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  {config.last_test_status === 'success'
                    ? <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    : <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
                  <div>
                    <p className={`text-sm font-medium ${config.last_test_status === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                      Dernier test : {config.last_test_status === 'success' ? 'Succès' : 'Échec'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(config.last_tested_at).toLocaleString('fr-FR')}
                      {config.last_test_error && <span className="ml-2 text-red-600">— {config.last_test_error}</span>}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                {config.id && !config.is_active && (
                  <button
                    onClick={() => handleDelete(config)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Supprimer cette configuration
                  </button>
                )}
                <div className="flex items-center gap-3 ml-auto">
                  {config.id && !config.is_active && (
                    <button
                      onClick={() => handleActivate(config)}
                      className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      Activer ce provider
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2 text-sm"
                  >
                    {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB TEST ── */}
          {activeTab === 'test' && (
            <div className="space-y-6 max-w-lg">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">Provider actif</p>
                  <p className="text-sm text-blue-700">
                    {activeConfig
                      ? `${getProvider(activeConfig.provider_type)?.icon} ${getProvider(activeConfig.provider_type)?.label} — ${activeConfig.from_email}`
                      : 'Aucun provider actif configuré.'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email de destination</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="votre@email.com"
                  onKeyDown={e => e.key === 'Enter' && handleTest()}
                />
              </div>

              <button
                onClick={handleTest}
                disabled={testing || !testEmail.trim() || !activeConfig}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {testing ? (
                  <><Loader className="w-4 h-4 animate-spin" />Envoi en cours…</>
                ) : (
                  <><Send className="w-4 h-4" />Envoyer un email de test</>
                )}
              </button>

              {testResult && (
                <div className={`p-4 rounded-xl flex items-start gap-3 ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  {testResult.success
                    ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    : <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
                  <div>
                    <p className={`font-semibold text-sm ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {testResult.success ? 'Email envoyé avec succès' : 'Échec'}
                    </p>
                    <p className={`text-sm mt-0.5 ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                      {testResult.message}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB LOGS ── */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">50 derniers emails envoyés</h3>
                <button onClick={loadLogs} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  <RefreshCw className="w-4 h-4" />Actualiser
                </button>
              </div>

              {logsLoading ? (
                <div className="flex justify-center py-8"><Loader className="w-6 h-6 animate-spin text-blue-600" /></div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Mail className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Aucun email envoyé pour l'instant</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Destinataire</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Sujet</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Provider</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Statut</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {logs.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-700 max-w-[180px] truncate">{log.recipient_email}</td>
                          <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{log.subject}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{log.provider || '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            {log.status === 'delivered' ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                                <CheckCircle className="w-3 h-3" />Envoyé
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium" title={log.error_message}>
                                <XCircle className="w-3 h-3" />Échec
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                            {log.sent_at ? new Date(log.sent_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── TAB STATS ── */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Statistiques d'envoi</h3>
                <button onClick={loadStats} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  <RefreshCw className="w-4 h-4" />Actualiser
                </button>
              </div>

              {statsLoading ? (
                <div className="flex justify-center py-8"><Loader className="w-6 h-6 animate-spin text-blue-600" /></div>
              ) : stats ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Envoyés aujourd\'hui', value: stats.sent_today, color: 'text-green-600', bg: 'bg-green-50', icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
                    { label: 'Échecs aujourd\'hui', value: stats.failed_today, color: 'text-red-600', bg: 'bg-red-50', icon: <XCircle className="w-5 h-5 text-red-500" /> },
                    { label: 'En attente', value: stats.total_pending, color: 'text-amber-600', bg: 'bg-amber-50', icon: <Clock className="w-5 h-5 text-amber-500" /> },
                    { label: 'Total envoyés', value: stats.total_sent, color: 'text-blue-600', bg: 'bg-blue-50', icon: <Mail className="w-5 h-5 text-blue-500" /> },
                    { label: 'Total échecs', value: stats.total_failed, color: 'text-gray-600', bg: 'bg-gray-50', icon: <AlertCircle className="w-5 h-5 text-gray-500" /> },
                    {
                      label: 'Taux de succès',
                      value: stats.total_sent + stats.total_failed > 0
                        ? `${Math.round((stats.total_sent / (stats.total_sent + stats.total_failed)) * 100)}%`
                        : '—',
                      color: 'text-green-700',
                      bg: 'bg-green-50',
                      icon: <Activity className="w-5 h-5 text-green-500" />,
                    },
                  ].map((stat, i) => (
                    <div key={i} className={`${stat.bg} rounded-xl p-5 border border-gray-100`}>
                      <div className="flex items-center gap-2 mb-2">{stat.icon}<p className="text-xs text-gray-500 font-medium">{stat.label}</p></div>
                      <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">Aucune statistique disponible</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
