import React, { useState, useEffect } from 'react';
import { Bell, Settings, Mail, Clock, Save, AlertCircle, CheckCircle, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface JobAlertsConfig {
  id?: string;
  enable_job_alerts: boolean;
  enable_email_alerts: boolean;
  enable_sms_alerts: boolean;
  enable_push_notifications: boolean;
  enable_whatsapp_alerts: boolean;
  default_frequency: string;
  max_alerts_per_user: number;
  max_alerts_per_day: number;
  alert_batch_size: number;
  send_time_hour: number;
  enable_immediate_alerts: boolean;
  enable_daily_digest: boolean;
  enable_weekly_digest: boolean;
  min_match_score: number;
  include_similar_jobs: boolean;
  max_similar_jobs: number;
  alert_expiration_days: number;
  require_email_verification: boolean;
  enable_alert_analytics: boolean;
  pause_alerts_after_days: number;
  auto_unsubscribe_after_months: number;
  updated_at?: string;
}

export default function AdminJobAlertsConfig() {
  const [activeTab, setActiveTab] = useState<'general' | 'frequency' | 'channels' | 'filters'>('general');
  const [config, setConfig] = useState<JobAlertsConfig>({
    enable_job_alerts: true,
    enable_email_alerts: true,
    enable_sms_alerts: false,
    enable_push_notifications: true,
    enable_whatsapp_alerts: false,
    default_frequency: 'daily',
    max_alerts_per_user: 10,
    max_alerts_per_day: 50,
    alert_batch_size: 10,
    send_time_hour: 9,
    enable_immediate_alerts: true,
    enable_daily_digest: true,
    enable_weekly_digest: true,
    min_match_score: 70,
    include_similar_jobs: true,
    max_similar_jobs: 3,
    alert_expiration_days: 90,
    require_email_verification: true,
    enable_alert_analytics: true,
    pause_alerts_after_days: 30,
    auto_unsubscribe_after_months: 6
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_alerts_config')
        .select('*')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading job alerts config:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement de la configuration' });
    } finally {
      setLoading(false);
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
          .from('job_alerts_config')
          .update(configData)
          .eq('id', config.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('job_alerts_config')
          .insert([configData])
          .select()
          .single();

        if (error) throw error;
        if (data) setConfig(data);
      }

      setMessage({ type: 'success', text: 'Configuration enregistrée avec succès' });
    } catch (error) {
      console.error('Error saving job alerts config:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'frequency', label: 'Fréquence', icon: Clock },
    { id: 'channels', label: 'Canaux', icon: Mail },
    { id: 'filters', label: 'Filtres', icon: Filter }
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
        <h1 className="text-3xl font-bold text-gray-900">Configuration des Alertes Emploi</h1>
        <p className="mt-2 text-gray-600">
          Gérez les paramètres du système d'alertes et de notifications d'offres d'emploi
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
                      <p className="font-medium text-gray-900">Activer les alertes emploi</p>
                      <p className="text-sm text-gray-600">Permettre aux utilisateurs de créer des alertes</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_job_alerts}
                        onChange={(e) => setConfig({ ...config, enable_job_alerts: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Alertes immédiates</p>
                      <p className="text-sm text-gray-600">Envoyer une alerte dès qu'un emploi correspondant est publié</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_immediate_alerts}
                        onChange={(e) => setConfig({ ...config, enable_immediate_alerts: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Vérification email obligatoire</p>
                      <p className="text-sm text-gray-600">Exiger la vérification de l'email avant d'activer les alertes</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.require_email_verification}
                        onChange={(e) => setConfig({ ...config, require_email_verification: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Analyses des alertes</p>
                      <p className="text-sm text-gray-600">Suivre les performances et l'engagement des alertes</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_alert_analytics}
                        onChange={(e) => setConfig({ ...config, enable_alert_analytics: e.target.checked })}
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
                      Alertes maximales par utilisateur
                    </label>
                    <input
                      type="number"
                      value={config.max_alerts_per_user}
                      onChange={(e) => setConfig({ ...config, max_alerts_per_user: Number(e.target.value) })}
                      min="1"
                      max="50"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alertes maximales par jour (global)
                    </label>
                    <input
                      type="number"
                      value={config.max_alerts_per_day}
                      onChange={(e) => setConfig({ ...config, max_alerts_per_day: Number(e.target.value) })}
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Taille du lot d'alertes
                    </label>
                    <input
                      type="number"
                      value={config.alert_batch_size}
                      onChange={(e) => setConfig({ ...config, alert_batch_size: Number(e.target.value) })}
                      min="1"
                      max="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Nombre d'offres par email d'alerte</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiration des alertes (jours)
                    </label>
                    <input
                      type="number"
                      value={config.alert_expiration_days}
                      onChange={(e) => setConfig({ ...config, alert_expiration_days: Number(e.target.value) })}
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Gestion Automatique</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pause après inactivité (jours)
                    </label>
                    <input
                      type="number"
                      value={config.pause_alerts_after_days}
                      onChange={(e) => setConfig({ ...config, pause_alerts_after_days: Number(e.target.value) })}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Mettre en pause les alertes après X jours sans interaction</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Désabonnement automatique (mois)
                    </label>
                    <input
                      type="number"
                      value={config.auto_unsubscribe_after_months}
                      onChange={(e) => setConfig({ ...config, auto_unsubscribe_after_months: Number(e.target.value) })}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Désabonner automatiquement après X mois d'inactivité</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'frequency' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Options de Fréquence</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Résumé quotidien</p>
                      <p className="text-sm text-gray-600">Envoyer un résumé une fois par jour</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_daily_digest}
                        onChange={(e) => setConfig({ ...config, enable_daily_digest: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Résumé hebdomadaire</p>
                      <p className="text-sm text-gray-600">Envoyer un résumé une fois par semaine</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_weekly_digest}
                        onChange={(e) => setConfig({ ...config, enable_weekly_digest: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Paramètres d'Envoi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fréquence par défaut
                    </label>
                    <select
                      value={config.default_frequency}
                      onChange={(e) => setConfig({ ...config, default_frequency: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="immediate">Immédiat</option>
                      <option value="daily">Quotidien</option>
                      <option value="weekly">Hebdomadaire</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Heure d'envoi (24h)
                    </label>
                    <input
                      type="number"
                      value={config.send_time_hour}
                      onChange={(e) => setConfig({ ...config, send_time_hour: Number(e.target.value) })}
                      min="0"
                      max="23"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Pour les résumés quotidiens et hebdomadaires</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'channels' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Canaux de Notification</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-600">Envoyer les alertes par email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_email_alerts}
                        onChange={(e) => setConfig({ ...config, enable_email_alerts: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">SMS</p>
                      <p className="text-sm text-gray-600">Envoyer les alertes par SMS</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_sms_alerts}
                        onChange={(e) => setConfig({ ...config, enable_sms_alerts: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Notifications Push</p>
                      <p className="text-sm text-gray-600">Envoyer des notifications push dans l'application</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_push_notifications}
                        onChange={(e) => setConfig({ ...config, enable_push_notifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">WhatsApp</p>
                      <p className="text-sm text-gray-600">Envoyer les alertes via WhatsApp</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enable_whatsapp_alerts}
                        onChange={(e) => setConfig({ ...config, enable_whatsapp_alerts: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'filters' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtres de Matching</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Inclure les emplois similaires</p>
                      <p className="text-sm text-gray-600">Suggérer des offres similaires aux critères</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.include_similar_jobs}
                        onChange={(e) => setConfig({ ...config, include_similar_jobs: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Paramètres de Matching</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Score de matching minimum (%)
                    </label>
                    <input
                      type="number"
                      value={config.min_match_score}
                      onChange={(e) => setConfig({ ...config, min_match_score: Number(e.target.value) })}
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Les offres avec un score inférieur ne seront pas incluses</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre max d'emplois similaires
                    </label>
                    <input
                      type="number"
                      value={config.max_similar_jobs}
                      onChange={(e) => setConfig({ ...config, max_similar_jobs: Number(e.target.value) })}
                      min="0"
                      max="10"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
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
