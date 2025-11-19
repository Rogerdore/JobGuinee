import { useState, useEffect } from 'react';
import {
  Settings, Palette, Mail, Bell, DollarSign, ToggleLeft, Search as SearchIcon,
  Globe, Sliders, Save, RefreshCw, Eye, EyeOff, Zap, Shield, FileText, Smartphone
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type SettingsTab = 'general' | 'theme' | 'email' | 'notifications' | 'pricing' | 'features' | 'seo' | 'limits';

export default function SystemSettings() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [appSettings, setAppSettings] = useState({
    app_name: 'JobGuinée',
    app_logo_url: '',
    app_tagline: 'Votre plateforme emploi en Guinée',
    contact_email: 'contact@jobguinee.com',
    contact_phone: '',
    maintenance_mode: false,
    registration_enabled: true,
  });

  const [themeSettings, setThemeSettings] = useState({
    primary_color: '#0E2F56',
    secondary_color: '#1a4275',
    accent_color: '#FF8C00',
    background_color: '#F9FAFB',
    text_color: '#111827',
    font_family: 'Inter, system-ui, sans-serif',
    border_radius: 'medium',
    button_style: 'rounded',
  });

  const [emailSettings, setEmailSettings] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    from_email: 'noreply@jobguinee.com',
    from_name: 'JobGuinée',
    email_enabled: false,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    new_application_admin: true,
    new_application_recruiter: true,
    application_status_candidate: true,
    new_job_matching: true,
    profile_view_candidate: false,
    new_message: true,
    weekly_digest: true,
  });

  const [pricingSettings, setPricingSettings] = useState({
    job_posting_price: 50000,
    cv_unlock_price: 10000,
    ai_cv_generation_price: 30000,
    ai_matching_price: 20000,
    ai_coach_price_per_message: 5000,
    gold_profile_price: 100000,
    premium_monthly_price: 50000,
    premium_yearly_price: 500000,
    currency: 'GNF',
    free_trial_credits: 150000,
  });

  const [featureFlags, setFeatureFlags] = useState<any[]>([]);

  const [seoSettings, setSeoSettings] = useState({
    meta_title: 'JobGuinée - Trouvez votre emploi en Guinée',
    meta_description: 'La plateforme numéro 1 pour trouver un emploi en Guinée',
    meta_keywords: ['emploi guinée', 'job guinée', 'recrutement'],
    og_image_url: '',
    google_analytics_id: '',
    google_site_verification: '',
  });

  const [limitsSettings, setLimitsSettings] = useState({
    max_file_upload_size_mb: 10,
    max_applications_per_day: 10,
    max_jobs_per_recruiter_free: 3,
    max_cv_views_per_day_free: 5,
    session_timeout_minutes: 60,
    password_min_length: 8,
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (profile?.user_type === 'admin') {
      loadAllSettings();
    }
  }, [profile]);

  const loadAllSettings = async () => {
    const [app, theme, email, notif, pricing, features, seo, limits] = await Promise.all([
      supabase.from('app_settings').select('*').maybeSingle(),
      supabase.from('theme_settings').select('*').maybeSingle(),
      supabase.from('email_settings').select('*').maybeSingle(),
      supabase.from('notification_settings').select('*').maybeSingle(),
      supabase.from('pricing_settings').select('*').maybeSingle(),
      supabase.from('feature_flags').select('*').order('feature_name'),
      supabase.from('seo_settings').select('*').maybeSingle(),
      supabase.from('limits_settings').select('*').maybeSingle(),
    ]);

    if (app.data) setAppSettings(app.data);
    if (theme.data) setThemeSettings(theme.data);
    if (email.data) setEmailSettings(email.data);
    if (notif.data) setNotificationSettings(notif.data);
    if (pricing.data) setPricingSettings(pricing.data);
    if (features.data) setFeatureFlags(features.data);
    if (seo.data) setSeoSettings(seo.data);
    if (limits.data) setLimitsSettings(limits.data);
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage('');

    try {
      const userId = profile?.id;

      switch (activeTab) {
        case 'general':
          await supabase.from('app_settings').upsert({
            ...appSettings,
            updated_by: userId,
            updated_at: new Date().toISOString(),
          });
          break;
        case 'theme':
          await supabase.from('theme_settings').upsert({
            ...themeSettings,
            updated_by: userId,
            updated_at: new Date().toISOString(),
          });
          break;
        case 'email':
          await supabase.from('email_settings').upsert({
            ...emailSettings,
            updated_by: userId,
            updated_at: new Date().toISOString(),
          });
          break;
        case 'notifications':
          await supabase.from('notification_settings').upsert({
            ...notificationSettings,
            updated_by: userId,
            updated_at: new Date().toISOString(),
          });
          break;
        case 'pricing':
          await supabase.from('pricing_settings').upsert({
            ...pricingSettings,
            updated_by: userId,
            updated_at: new Date().toISOString(),
          });
          break;
        case 'seo':
          await supabase.from('seo_settings').upsert({
            ...seoSettings,
            updated_by: userId,
            updated_at: new Date().toISOString(),
          });
          break;
        case 'limits':
          await supabase.from('limits_settings').upsert({
            ...limitsSettings,
            updated_by: userId,
            updated_at: new Date().toISOString(),
          });
          break;
      }

      setMessage('Paramètres enregistrés avec succès !');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const toggleFeature = async (featureName: string, enabled: boolean) => {
    await supabase
      .from('feature_flags')
      .update({ enabled, updated_at: new Date().toISOString(), updated_by: profile?.id })
      .eq('feature_name', featureName);

    setFeatureFlags(prev => prev.map(f =>
      f.feature_name === featureName ? { ...f, enabled } : f
    ));
  };

  if (profile?.user_type !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h2>
          <p className="text-gray-600">Seuls les administrateurs peuvent accéder à cette page.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', name: 'Général', icon: Settings },
    { id: 'theme', name: 'Apparence', icon: Palette },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'pricing', name: 'Tarification', icon: DollarSign },
    { id: 'features', name: 'Fonctionnalités', icon: ToggleLeft },
    { id: 'seo', name: 'SEO', icon: Globe },
    { id: 'limits', name: 'Limites', icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Paramètres Système</h1>
          <p className="text-gray-600">Configurez tous les aspects de votre application</p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as SettingsTab)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-900 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-9">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {message && (
                <div className={`mb-6 p-4 rounded-lg ${
                  message.includes('succès') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {message}
                </div>
              )}

              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Paramètres Généraux</h2>
                    <p className="text-gray-600 mb-6">Configuration de base de l'application</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom de l'application
                    </label>
                    <input
                      type="text"
                      value={appSettings.app_name}
                      onChange={(e) => setAppSettings({ ...appSettings, app_name: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL du logo
                    </label>
                    <input
                      type="text"
                      value={appSettings.app_logo_url}
                      onChange={(e) => setAppSettings({ ...appSettings, app_logo_url: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slogan
                    </label>
                    <input
                      type="text"
                      value={appSettings.app_tagline}
                      onChange={(e) => setAppSettings({ ...appSettings, app_tagline: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email de contact
                      </label>
                      <input
                        type="email"
                        value={appSettings.contact_email}
                        onChange={(e) => setAppSettings({ ...appSettings, contact_email: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Téléphone de contact
                      </label>
                      <input
                        type="tel"
                        value={appSettings.contact_phone}
                        onChange={(e) => setAppSettings({ ...appSettings, contact_phone: e.target.value })}
                        placeholder="+224 XXX XX XX XX"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-6 space-y-4">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={appSettings.maintenance_mode}
                        onChange={(e) => setAppSettings({ ...appSettings, maintenance_mode: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Mode maintenance</span>
                        <p className="text-xs text-gray-500">Désactive l'accès public à l'application</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={appSettings.registration_enabled}
                        onChange={(e) => setAppSettings({ ...appSettings, registration_enabled: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Inscriptions ouvertes</span>
                        <p className="text-xs text-gray-500">Autoriser les nouvelles inscriptions</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'theme' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Apparence</h2>
                    <p className="text-gray-600 mb-6">Personnalisez l'apparence visuelle de l'application</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Couleur principale
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={themeSettings.primary_color}
                          onChange={(e) => setThemeSettings({ ...themeSettings, primary_color: e.target.value })}
                          className="w-12 h-10 rounded border"
                        />
                        <input
                          type="text"
                          value={themeSettings.primary_color}
                          onChange={(e) => setThemeSettings({ ...themeSettings, primary_color: e.target.value })}
                          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Couleur secondaire
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={themeSettings.secondary_color}
                          onChange={(e) => setThemeSettings({ ...themeSettings, secondary_color: e.target.value })}
                          className="w-12 h-10 rounded border"
                        />
                        <input
                          type="text"
                          value={themeSettings.secondary_color}
                          onChange={(e) => setThemeSettings({ ...themeSettings, secondary_color: e.target.value })}
                          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Couleur d'accent
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={themeSettings.accent_color}
                          onChange={(e) => setThemeSettings({ ...themeSettings, accent_color: e.target.value })}
                          className="w-12 h-10 rounded border"
                        />
                        <input
                          type="text"
                          value={themeSettings.accent_color}
                          onChange={(e) => setThemeSettings({ ...themeSettings, accent_color: e.target.value })}
                          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Couleur de fond
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={themeSettings.background_color}
                          onChange={(e) => setThemeSettings({ ...themeSettings, background_color: e.target.value })}
                          className="w-12 h-10 rounded border"
                        />
                        <input
                          type="text"
                          value={themeSettings.background_color}
                          onChange={(e) => setThemeSettings({ ...themeSettings, background_color: e.target.value })}
                          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Police de caractères
                    </label>
                    <select
                      value={themeSettings.font_family}
                      onChange={(e) => setThemeSettings({ ...themeSettings, font_family: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Inter, system-ui, sans-serif">Inter</option>
                      <option value="Roboto, sans-serif">Roboto</option>
                      <option value="Open Sans, sans-serif">Open Sans</option>
                      <option value="Poppins, sans-serif">Poppins</option>
                      <option value="Montserrat, sans-serif">Montserrat</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rayon de bordure
                      </label>
                      <select
                        value={themeSettings.border_radius}
                        onChange={(e) => setThemeSettings({ ...themeSettings, border_radius: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="small">Petit (4px)</option>
                        <option value="medium">Moyen (8px)</option>
                        <option value="large">Grand (16px)</option>
                        <option value="xlarge">Très grand (24px)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Style des boutons
                      </label>
                      <select
                        value={themeSettings.button_style}
                        onChange={(e) => setThemeSettings({ ...themeSettings, button_style: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="rounded">Arrondis</option>
                        <option value="square">Carrés</option>
                        <option value="pill">Pills</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'email' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Configuration Email</h2>
                    <p className="text-gray-600 mb-6">Configurez le serveur SMTP pour l'envoi d'emails</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Serveur SMTP
                      </label>
                      <input
                        type="text"
                        value={emailSettings.smtp_host}
                        onChange={(e) => setEmailSettings({ ...emailSettings, smtp_host: e.target.value })}
                        placeholder="smtp.gmail.com"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Port SMTP
                      </label>
                      <input
                        type="number"
                        value={emailSettings.smtp_port}
                        onChange={(e) => setEmailSettings({ ...emailSettings, smtp_port: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Utilisateur SMTP
                    </label>
                    <input
                      type="text"
                      value={emailSettings.smtp_user}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtp_user: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe SMTP
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={emailSettings.smtp_password}
                        onChange={(e) => setEmailSettings({ ...emailSettings, smtp_password: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email expéditeur
                      </label>
                      <input
                        type="email"
                        value={emailSettings.from_email}
                        onChange={(e) => setEmailSettings({ ...emailSettings, from_email: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom expéditeur
                      </label>
                      <input
                        type="text"
                        value={emailSettings.from_name}
                        onChange={(e) => setEmailSettings({ ...emailSettings, from_name: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={emailSettings.email_enabled}
                        onChange={(e) => setEmailSettings({ ...emailSettings, email_enabled: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Activer les emails</span>
                        <p className="text-xs text-gray-500">Autoriser l'envoi d'emails automatiques</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Notifications</h2>
                    <p className="text-gray-600 mb-6">Configurez les notifications envoyées aux utilisateurs</p>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={notificationSettings.new_application_admin}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, new_application_admin: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Nouvelle candidature (Admin)</span>
                        <p className="text-xs text-gray-500">Notifier l'administrateur lors d'une nouvelle candidature</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={notificationSettings.new_application_recruiter}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, new_application_recruiter: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Nouvelle candidature (Recruteur)</span>
                        <p className="text-xs text-gray-500">Notifier le recruteur lors d'une nouvelle candidature</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={notificationSettings.application_status_candidate}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, application_status_candidate: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Changement de statut (Candidat)</span>
                        <p className="text-xs text-gray-500">Notifier le candidat lors d'un changement de statut de sa candidature</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={notificationSettings.new_job_matching}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, new_job_matching: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Offres correspondantes</span>
                        <p className="text-xs text-gray-500">Notifier les candidats des offres qui correspondent à leur profil</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={notificationSettings.profile_view_candidate}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, profile_view_candidate: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Consultation de profil</span>
                        <p className="text-xs text-gray-500">Notifier le candidat lorsqu'un recruteur consulte son profil</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={notificationSettings.new_message}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, new_message: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Nouveaux messages</span>
                        <p className="text-xs text-gray-500">Notifier lors de la réception d'un nouveau message</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={notificationSettings.weekly_digest}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, weekly_digest: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Digest hebdomadaire</span>
                        <p className="text-xs text-gray-500">Envoyer un résumé hebdomadaire des activités</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'pricing' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Tarification</h2>
                    <p className="text-gray-600 mb-6">Configurez les prix des services et fonctionnalités</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Devise
                    </label>
                    <select
                      value={pricingSettings.currency}
                      onChange={(e) => setPricingSettings({ ...pricingSettings, currency: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="GNF">Franc Guinéen (GNF)</option>
                      <option value="USD">Dollar US (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Publication d'offre d'emploi
                      </label>
                      <input
                        type="number"
                        value={pricingSettings.job_posting_price}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, job_posting_price: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Prix en crédits</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Déblocage de CV
                      </label>
                      <input
                        type="number"
                        value={pricingSettings.cv_unlock_price}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, cv_unlock_price: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Prix en crédits</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Génération CV par IA
                      </label>
                      <input
                        type="number"
                        value={pricingSettings.ai_cv_generation_price}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, ai_cv_generation_price: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Prix en crédits</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Matching IA
                      </label>
                      <input
                        type="number"
                        value={pricingSettings.ai_matching_price}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, ai_matching_price: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Prix en crédits</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Coach IA (par message)
                      </label>
                      <input
                        type="number"
                        value={pricingSettings.ai_coach_price_per_message}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, ai_coach_price_per_message: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Prix en crédits</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Profil Gold
                      </label>
                      <input
                        type="number"
                        value={pricingSettings.gold_profile_price}
                        onChange={(e) => setPricingSettings({ ...pricingSettings, gold_profile_price: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Prix en crédits</p>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Abonnements Premium</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Abonnement mensuel
                        </label>
                        <input
                          type="number"
                          value={pricingSettings.premium_monthly_price}
                          onChange={(e) => setPricingSettings({ ...pricingSettings, premium_monthly_price: parseFloat(e.target.value) })}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Prix en {pricingSettings.currency}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Abonnement annuel
                        </label>
                        <input
                          type="number"
                          value={pricingSettings.premium_yearly_price}
                          onChange={(e) => setPricingSettings({ ...pricingSettings, premium_yearly_price: parseFloat(e.target.value) })}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Prix en {pricingSettings.currency}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Crédits gratuits à l'inscription
                    </label>
                    <input
                      type="number"
                      value={pricingSettings.free_trial_credits}
                      onChange={(e) => setPricingSettings({ ...pricingSettings, free_trial_credits: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Nombre de crédits offerts aux nouveaux utilisateurs</p>
                  </div>
                </div>
              )}

              {activeTab === 'features' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Fonctionnalités</h2>
                    <p className="text-gray-600 mb-6">Activez ou désactivez les fonctionnalités de l'application</p>
                  </div>

                  <div className="space-y-3">
                    {featureFlags.map((feature) => (
                      <div key={feature.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <span className="text-sm font-medium text-gray-900">{feature.feature_name}</span>
                          <p className="text-xs text-gray-500">{feature.description}</p>
                        </div>
                        <label className="relative inline-block w-12 h-6">
                          <input
                            type="checkbox"
                            checked={feature.enabled}
                            onChange={(e) => toggleFeature(feature.feature_name, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'seo' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">SEO & Analytics</h2>
                    <p className="text-gray-600 mb-6">Optimisez le référencement de votre application</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Titre Meta
                    </label>
                    <input
                      type="text"
                      value={seoSettings.meta_title}
                      onChange={(e) => setSeoSettings({ ...seoSettings, meta_title: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Titre affiché dans les résultats de recherche</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description Meta
                    </label>
                    <textarea
                      value={seoSettings.meta_description}
                      onChange={(e) => setSeoSettings({ ...seoSettings, meta_description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Description affichée dans les résultats de recherche</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mots-clés Meta
                    </label>
                    <input
                      type="text"
                      value={seoSettings.meta_keywords.join(', ')}
                      onChange={(e) => setSeoSettings({ ...seoSettings, meta_keywords: e.target.value.split(',').map(k => k.trim()) })}
                      placeholder="emploi, guinée, job, recrutement"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Séparez les mots-clés par des virgules</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image Open Graph
                    </label>
                    <input
                      type="text"
                      value={seoSettings.og_image_url}
                      onChange={(e) => setSeoSettings({ ...seoSettings, og_image_url: e.target.value })}
                      placeholder="https://example.com/og-image.jpg"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Image affichée lors du partage sur les réseaux sociaux</p>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ID Google Analytics
                        </label>
                        <input
                          type="text"
                          value={seoSettings.google_analytics_id}
                          onChange={(e) => setSeoSettings({ ...seoSettings, google_analytics_id: e.target.value })}
                          placeholder="G-XXXXXXXXXX"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Code de vérification Google
                        </label>
                        <input
                          type="text"
                          value={seoSettings.google_site_verification}
                          onChange={(e) => setSeoSettings({ ...seoSettings, google_site_verification: e.target.value })}
                          placeholder="Code de vérification"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'limits' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Limites Système</h2>
                    <p className="text-gray-600 mb-6">Définissez les limites et contraintes de l'application</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Taille max fichier (MB)
                      </label>
                      <input
                        type="number"
                        value={limitsSettings.max_file_upload_size_mb}
                        onChange={(e) => setLimitsSettings({ ...limitsSettings, max_file_upload_size_mb: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Taille maximale des fichiers uploadés</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Candidatures par jour
                      </label>
                      <input
                        type="number"
                        value={limitsSettings.max_applications_per_day}
                        onChange={(e) => setLimitsSettings({ ...limitsSettings, max_applications_per_day: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Nombre max de candidatures par candidat/jour</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Offres gratuites (recruteur)
                      </label>
                      <input
                        type="number"
                        value={limitsSettings.max_jobs_per_recruiter_free}
                        onChange={(e) => setLimitsSettings({ ...limitsSettings, max_jobs_per_recruiter_free: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Nombre max d'offres pour les recruteurs gratuits</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CV vus par jour (gratuit)
                      </label>
                      <input
                        type="number"
                        value={limitsSettings.max_cv_views_per_day_free}
                        onChange={(e) => setLimitsSettings({ ...limitsSettings, max_cv_views_per_day_free: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Nombre max de CV consultables/jour pour les recruteurs gratuits</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timeout session (minutes)
                      </label>
                      <input
                        type="number"
                        value={limitsSettings.session_timeout_minutes}
                        onChange={(e) => setLimitsSettings({ ...limitsSettings, session_timeout_minutes: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Durée avant déconnexion automatique</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Longueur min mot de passe
                      </label>
                      <input
                        type="number"
                        value={limitsSettings.password_min_length}
                        onChange={(e) => setLimitsSettings({ ...limitsSettings, password_min_length: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Nombre minimum de caractères pour les mots de passe</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-6 border-t">
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Enregistrer
                    </>
                  )}
                </button>

                <button
                  onClick={loadAllSettings}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
                >
                  <RefreshCw className="w-5 h-5" />
                  Recharger
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
