import { useEffect, useState } from 'react';
import { Bell, Mail, MessageSquare, Clock, Save, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface NotificationSettings {
  id: string;
  recruiter_id: string;
  instant_email_enabled: boolean;
  instant_sms_enabled: boolean;
  instant_whatsapp_enabled: boolean;
  daily_digest_enabled: boolean;
  daily_digest_hour: number;
  daily_digest_timezone: string;
  include_zero_applications: boolean;
  digest_format: 'summary' | 'detailed';
  include_candidate_scores: boolean;
  include_direct_links: boolean;
}

interface RecruiterData {
  id: string;
  full_name: string;
  email: string;
  settings: NotificationSettings | null;
}

export default function AdminRecruiterNotifications() {
  const [recruiters, setRecruiters] = useState<RecruiterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadRecruiters();
  }, []);

  const loadRecruiters = async () => {
    setLoading(true);
    try {
      const { data: recruitersData, error: recruitersError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('user_type', 'recruiter')
        .order('full_name');

      if (recruitersError) throw recruitersError;

      const { data: settingsData, error: settingsError } = await supabase
        .from('recruiter_notification_settings')
        .select('*');

      if (settingsError) throw settingsError;

      const settingsMap = new Map(settingsData.map(s => [s.recruiter_id, s]));

      const combined = (recruitersData || []).map(recruiter => ({
        ...recruiter,
        settings: settingsMap.get(recruiter.id) || null
      }));

      setRecruiters(combined);
    } catch (error: any) {
      console.error('Error loading recruiters:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des données' });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (recruiterId: string, updates: Partial<NotificationSettings>) => {
    setSaving(recruiterId);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('recruiter_notification_settings')
        .upsert({
          recruiter_id: recruiterId,
          ...updates,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'recruiter_id'
        });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Paramètres enregistrés avec succès' });
      await loadRecruiters();
    } catch (error: any) {
      console.error('Error updating settings:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <Bell className="w-8 h-8 mr-3 text-blue-600" />
            Configuration des notifications recruteurs
          </h1>
          <p className="text-gray-600">
            Gérez les paramètres de notification pour chaque recruteur
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {message.text}
            </div>
          </div>
        )}

        <div className="space-y-6">
          {recruiters.map(recruiter => {
            const settings = recruiter.settings || {
              recruiter_id: recruiter.id,
              instant_email_enabled: true,
              instant_sms_enabled: false,
              instant_whatsapp_enabled: false,
              daily_digest_enabled: true,
              daily_digest_hour: 18,
              daily_digest_timezone: 'Africa/Conakry',
              include_zero_applications: false,
              digest_format: 'detailed' as const,
              include_candidate_scores: true,
              include_direct_links: true
            };

            return (
              <div key={recruiter.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">{recruiter.full_name}</h2>
                  <p className="text-gray-600">{recruiter.email}</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Mail className="w-5 h-5 mr-2 text-blue-600" />
                      Notifications immédiates
                    </h3>
                    <div className="space-y-3 ml-7">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.instant_email_enabled}
                          onChange={(e) => updateSettings(recruiter.id, { instant_email_enabled: e.target.checked })}
                          disabled={saving === recruiter.id}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-700">Email immédiat à chaque nouvelle candidature</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.instant_sms_enabled}
                          onChange={(e) => updateSettings(recruiter.id, { instant_sms_enabled: e.target.checked })}
                          disabled={saving === recruiter.id}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-700">SMS immédiat (si disponible)</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.instant_whatsapp_enabled}
                          onChange={(e) => updateSettings(recruiter.id, { instant_whatsapp_enabled: e.target.checked })}
                          disabled={saving === recruiter.id}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-700">WhatsApp immédiat (si disponible)</span>
                      </label>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-blue-600" />
                      Rapport quotidien
                    </h3>
                    <div className="space-y-4 ml-7">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.daily_digest_enabled}
                          onChange={(e) => updateSettings(recruiter.id, { daily_digest_enabled: e.target.checked })}
                          disabled={saving === recruiter.id}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-700 font-medium">Activer le rapport quotidien</span>
                      </label>

                      {settings.daily_digest_enabled && (
                        <div className="space-y-3 pl-8 border-l-2 border-blue-200">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Heure d'envoi
                            </label>
                            <select
                              value={settings.daily_digest_hour}
                              onChange={(e) => updateSettings(recruiter.id, { daily_digest_hour: parseInt(e.target.value) })}
                              disabled={saving === recruiter.id}
                              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {Array.from({ length: 24 }, (_, i) => (
                                <option key={i} value={i}>
                                  {i.toString().padStart(2, '0')}:00
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Format du rapport
                            </label>
                            <select
                              value={settings.digest_format}
                              onChange={(e) => updateSettings(recruiter.id, { digest_format: e.target.value as 'summary' | 'detailed' })}
                              disabled={saving === recruiter.id}
                              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="summary">Résumé (simple)</option>
                              <option value="detailed">Détaillé (avec informations complètes)</option>
                            </select>
                          </div>

                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.include_zero_applications}
                              onChange={(e) => updateSettings(recruiter.id, { include_zero_applications: e.target.checked })}
                              disabled={saving === recruiter.id}
                              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Envoyer même si aucune candidature</span>
                          </label>

                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.include_candidate_scores}
                              onChange={(e) => updateSettings(recruiter.id, { include_candidate_scores: e.target.checked })}
                              disabled={saving === recruiter.id}
                              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Inclure les scores IA</span>
                          </label>

                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.include_direct_links}
                              onChange={(e) => updateSettings(recruiter.id, { include_direct_links: e.target.checked })}
                              disabled={saving === recruiter.id}
                              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Inclure les liens directs vers le pipeline</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {saving === recruiter.id && (
                  <div className="mt-4 flex items-center justify-center text-blue-600">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mr-2"></div>
                    Enregistrement...
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
