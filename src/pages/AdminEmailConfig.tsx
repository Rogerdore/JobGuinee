import React, { useState, useEffect } from 'react';
import { Save, Mail, TestTube, AlertCircle, CheckCircle, Loader, Eye, EyeOff, Send } from 'lucide-react';
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

const providers = [
  { value: 'sendgrid', label: 'SendGrid', description: 'Service email professionnel' },
  { value: 'resend', label: 'Resend', description: 'Service moderne et simple' },
  { value: 'mailgun', label: 'Mailgun', description: 'Service puissant et flexible' },
  { value: 'smtp', label: 'SMTP / Gmail', description: 'Configuration SMTP personnalisée' },
  { value: 'aws_ses', label: 'AWS SES', description: 'Amazon Simple Email Service' },
  { value: 'brevo', label: 'Brevo (Sendinblue)', description: 'Service marketing + transactionnel' },
];

export default function AdminEmailConfig() {
  const { profile } = useAuth();
  const [config, setConfig] = useState<EmailConfig>({
    provider_type: 'sendgrid',
    is_active: false,
    from_email: '',
    from_name: 'JobGuinée',
    daily_limit: 500,
    rate_limit_per_minute: 10,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (profile?.user_type === 'admin') {
      loadConfig();
    }
  }, [profile]);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('email_provider_config')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (config.id) {
        const { error } = await supabase
          .from('email_provider_config')
          .update(config)
          .eq('id', config.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('email_provider_config')
          .insert([{ ...config, created_by: profile?.id }]);

        if (error) throw error;
      }

      alert('Configuration enregistrée avec succès!');
      await loadConfig();
    } catch (error: any) {
      console.error('Error saving config:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail) {
      alert('Veuillez entrer un email de test');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            to_email: testEmail,
            to_name: 'Test',
            subject: 'Test Email - JobGuinée',
            html_body: '<h1>Test Email</h1><p>Si vous recevez cet email, la configuration fonctionne correctement!</p>',
            text_body: 'Test Email - Si vous recevez cet email, la configuration fonctionne correctement!',
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setTestResult({ success: true, message: 'Email de test envoyé avec succès! Vérifiez votre boîte de réception.' });
      } else {
        setTestResult({ success: false, message: result.error || 'Échec de l\'envoi' });
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.message });
    } finally {
      setTesting(false);
    }
  };

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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold">Configuration Email</h1>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fournisseur Email
            </label>
            <select
              value={config.provider_type}
              onChange={(e) => setConfig({ ...config, provider_type: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {providers.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label} - {provider.description}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email expéditeur *
              </label>
              <input
                type="email"
                value={config.from_email}
                onChange={(e) => setConfig({ ...config, from_email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="noreply@jobguinee.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom expéditeur *
              </label>
              <input
                type="text"
                value={config.from_name}
                onChange={(e) => setConfig({ ...config, from_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="JobGuinée"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email de réponse (optionnel)
            </label>
            <input
              type="email"
              value={config.reply_to_email || ''}
              onChange={(e) => setConfig({ ...config, reply_to_email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="contact@jobguinee.com"
            />
          </div>

          {config.provider_type === 'smtp' && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold">Configuration SMTP</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hôte SMTP *
                  </label>
                  <input
                    type="text"
                    value={config.smtp_host || ''}
                    onChange={(e) => setConfig({ ...config, smtp_host: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Port *
                  </label>
                  <input
                    type="number"
                    value={config.smtp_port || 587}
                    onChange={(e) => setConfig({ ...config, smtp_port: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Utilisateur *
                </label>
                <input
                  type="text"
                  value={config.smtp_user || ''}
                  onChange={(e) => setConfig({ ...config, smtp_user: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={config.smtp_password || ''}
                    onChange={(e) => setConfig({ ...config, smtp_password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {['sendgrid', 'resend', 'mailgun', 'aws_ses', 'brevo'].includes(config.provider_type) && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold">Configuration API</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clé API *
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={config.api_key || ''}
                    onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Votre clé API"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showApiKey ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
              </div>

              {config.provider_type === 'mailgun' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domaine Mailgun *
                  </label>
                  <input
                    type="text"
                    value={config.api_domain || ''}
                    onChange={(e) => setConfig({ ...config, api_domain: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="mg.votredomaine.com"
                  />
                </div>
              )}

              {config.provider_type === 'aws_ses' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Région AWS
                  </label>
                  <input
                    type="text"
                    value={config.api_region || ''}
                    onChange={(e) => setConfig({ ...config, api_region: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="us-east-1"
                  />
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Limite quotidienne
              </label>
              <input
                type="number"
                value={config.daily_limit || 500}
                onChange={(e) => setConfig({ ...config, daily_limit: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emails par minute
              </label>
              <input
                type="number"
                value={config.rate_limit_per_minute || 10}
                onChange={(e) => setConfig({ ...config, rate_limit_per_minute: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={config.is_active}
              onChange={(e) => setConfig({ ...config, is_active: e.target.checked })}
              className="h-4 w-4"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Activer cette configuration
            </label>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Test de Configuration
            </h3>
            <div className="flex gap-4">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Votre email pour tester"
              />
              <button
                onClick={handleTest}
                disabled={testing || !testEmail}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {testing ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    Test en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Envoyer un test
                  </>
                )}
              </button>
            </div>

            {testResult && (
              <div className={`mt-4 p-4 rounded-lg ${testResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-start gap-2">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {testResult.success ? 'Succès' : 'Échec'}
                    </p>
                    <p className={`text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                      {testResult.message}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
