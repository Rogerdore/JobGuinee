import React, { useState, useEffect } from 'react';
import { Settings, Users, TrendingUp, Eye, Clock, CheckCircle, Save, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AdminExternalApplications() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [config, setConfig] = useState({
    module_enabled: true,
    min_profile_completion: 80,
    max_file_size_mb: 10,
    allowed_file_types: ['pdf', 'doc', 'docx', 'jpg', 'png'],
    max_applications_per_day: 10,
    max_relances_per_application: 3,
    min_days_between_relances: 7,
    token_validity_days: 90,
    application_email_template: '',
    relance_email_template: ''
  });

  const [statistics, setStatistics] = useState({
    total_applications: 0,
    today_applications: 0,
    active_tokens: 0,
    total_token_views: 0,
    avg_profile_completion: 0
  });

  useEffect(() => {
    loadConfig();
    loadStatistics();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('external_applications_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig({
          ...data,
          allowed_file_types: data.allowed_file_types || ['pdf', 'doc', 'docx', 'jpg', 'png']
        });
      }
    } catch (err: any) {
      setError('Erreur lors du chargement de la configuration');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const { count: totalApps } = await supabase
        .from('external_applications')
        .select('*', { count: 'exact', head: true });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: todayApps } = await supabase
        .from('external_applications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      const { count: activeTokens } = await supabase
        .from('public_profile_tokens')
        .select('*', { count: 'exact', head: true })
        .eq('is_revoked', false)
        .gt('expires_at', new Date().toISOString());

      const { data: tokenData } = await supabase
        .from('public_profile_tokens')
        .select('view_count');

      const totalViews = tokenData?.reduce((sum, t) => sum + (t.view_count || 0), 0) || 0;

      const { data: profileData } = await supabase
        .from('candidate_profiles')
        .select('profile_completion_percentage');

      const avgCompletion = profileData?.length
        ? Math.round(
            profileData.reduce((sum, p) => sum + (p.profile_completion_percentage || 0), 0) / profileData.length
          )
        : 0;

      setStatistics({
        total_applications: totalApps || 0,
        today_applications: todayApps || 0,
        active_tokens: activeTokens || 0,
        total_token_views: totalViews,
        avg_profile_completion: avgCompletion
      });
    } catch (err: any) {
      console.error('Error loading statistics:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error: updateError } = await supabase
        .from('external_applications_config')
        .update(config)
        .eq('id', (await supabase.from('external_applications_config').select('id').limit(1).single()).data?.id);

      if (updateError) throw updateError;

      setSuccess('Configuration enregistrée avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Erreur lors de l\'enregistrement: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const defaultApplicationTemplate = `Bonjour {{recruiter_name}},

Je vous adresse ma candidature pour le poste de {{job_title}} au sein de {{company_name}}.

Cette candidature vous est transmise via la plateforme JobGuinée.

{{#if custom_message}}
{{custom_message}}
{{/if}}

Vous trouverez en pièces jointes :
{{#if has_cv}}- Mon CV{{/if}}
{{#if has_cover_letter}}- Ma lettre de motivation{{/if}}
{{#if has_other_documents}}- D'autres documents pertinents{{/if}}

👉 Vous pouvez consulter mon profil professionnel complet, sans création de compte, via le lien sécurisé ci-dessous :
{{public_profile_url}}

Cordialement,

{{candidate_name}}
{{candidate_email}}
{{candidate_phone}}

---
Envoyé via JobGuinée – Plateforme emploi & RH en Guinée
https://jobguinee.com`;

  const defaultRelanceTemplate = `Bonjour {{recruiter_name}},

Je me permets de revenir vers vous concernant ma candidature pour le poste de {{job_title}} au sein de {{company_name}}, transmise le {{sent_date}}.

{{custom_message}}

Je reste à votre disposition pour toute information complémentaire et pour un éventuel entretien.

👉 Mon profil professionnel complet est toujours accessible via ce lien :
{{public_profile_url}}

Cordialement,

{{candidate_name}}
{{candidate_email}}

---
Envoyé via JobGuinée – Plateforme emploi & RH en Guinée
https://jobguinee.com`;

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Candidatures Externes
          </h1>
          <p className="text-gray-600">
            Configuration et statistiques du module de candidatures externes
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.total_applications}
                </p>
                <p className="text-sm text-gray-600">Candidatures totales</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.today_applications}
                </p>
                <p className="text-sm text-gray-600">Aujourd'hui</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.active_tokens}
                </p>
                <p className="text-sm text-gray-600">Tokens actifs</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.total_token_views}
                </p>
                <p className="text-sm text-gray-600">Vues profils</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.avg_profile_completion}%
                </p>
                <p className="text-sm text-gray-600">Profil moyen</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-600" />
            Configuration du module
          </h2>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Activer le module</p>
                <p className="text-sm text-gray-600">
                  Permettre aux candidats d'utiliser le module de candidatures externes
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.module_enabled}
                  onChange={(e) => setConfig({ ...config, module_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complétion profil minimum (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={config.min_profile_completion}
                  onChange={(e) => setConfig({ ...config, min_profile_completion: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Pourcentage minimum requis pour accéder au module
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taille max fichiers (MB)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={config.max_file_size_mb}
                  onChange={(e) => setConfig({ ...config, max_file_size_mb: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Candidatures max/jour
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={config.max_applications_per_day}
                  onChange={(e) => setConfig({ ...config, max_applications_per_day: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relances max/candidature
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={config.max_relances_per_application}
                  onChange={(e) => setConfig({ ...config, max_relances_per_application: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Délai min entre relances (jours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={config.min_days_between_relances}
                  onChange={(e) => setConfig({ ...config, min_days_between_relances: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Validité tokens (jours)
                </label>
                <input
                  type="number"
                  min="7"
                  max="365"
                  value={config.token_validity_days}
                  onChange={(e) => setConfig({ ...config, token_validity_days: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template email candidature
              </label>
              <textarea
                value={config.application_email_template || defaultApplicationTemplate}
                onChange={(e) => setConfig({ ...config, application_email_template: e.target.value })}
                rows={12}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                placeholder={defaultApplicationTemplate}
              />
              <p className="text-xs text-gray-500 mt-2">
                Variables disponibles: {`{{recruiter_name}}, {{job_title}}, {{company_name}}, {{candidate_name}}, {{candidate_email}}, {{candidate_phone}}, {{public_profile_url}}, {{custom_message}}`}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template email relance
              </label>
              <textarea
                value={config.relance_email_template || defaultRelanceTemplate}
                onChange={(e) => setConfig({ ...config, relance_email_template: e.target.value })}
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                placeholder={defaultRelanceTemplate}
              />
              <p className="text-xs text-gray-500 mt-2">
                Variables disponibles: {`{{recruiter_name}}, {{job_title}}, {{company_name}}, {{sent_date}}, {{candidate_name}}, {{candidate_email}}, {{public_profile_url}}, {{custom_message}}`}
              </p>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Enregistrer la configuration
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
