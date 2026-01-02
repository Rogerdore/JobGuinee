import { useState, useEffect } from 'react';
import { Save, ToggleLeft, ToggleRight, Zap, Bell, UserX, Activity } from 'lucide-react';
import { recruitmentAutomationService, AutomationRule } from '../services/recruitmentAutomationService';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/AdminLayout';
import { useModalContext } from '../contexts/ModalContext';

export default function AdminAutomationRules() {
  const { showSuccess, showError, showWarning, showConfirm } = useModalContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      loadRules();
    }
  }, [selectedCompanyId]);

  const loadCompanies = async () => {
    const { data } = await supabase
      .from('companies')
      .select('id, name')
      .order('name');

    if (data) {
      setCompanies(data);
      if (data.length > 0) {
        setSelectedCompanyId(data[0].id);
      }
    }
  };

  const loadRules = async () => {
    if (!selectedCompanyId) return;

    setLoading(true);
    const data = await recruitmentAutomationService.getAutomationRules(selectedCompanyId);
    setRules(data);
    setLoading(false);
  };

  const handleToggle = async (ruleId: string, currentEnabled: boolean) => {
    setSaving(ruleId);
    const result = await recruitmentAutomationService.updateAutomationRule(ruleId, {
      is_enabled: !currentEnabled
    });

    if (result.success) {
      setRules(rules.map(r => r.id === ruleId ? { ...r, is_enabled: !currentEnabled } : r));
    } else {
      alert('Erreur lors de la mise à jour: ' + result.error);
    }

    setSaving(null);
  };

  const handleConfigUpdate = async (ruleId: string, config: Record<string, any>) => {
    setSaving(ruleId);
    const result = await recruitmentAutomationService.updateAutomationRule(ruleId, {
      configuration: config
    });

    if (result.success) {
      setRules(rules.map(r => r.id === ruleId ? { ...r, configuration: config } : r));
    } else {
      alert('Erreur lors de la mise à jour: ' + result.error);
    }

    setSaving(null);
  };

  const getRuleIcon = (type: string) => {
    switch (type) {
      case 'auto_candidate_followup': return <UserX className="w-6 h-6" />;
      case 'auto_interview_reminders': return <Bell className="w-6 h-6" />;
      case 'auto_job_closure_notifications': return <Activity className="w-6 h-6" />;
      default: return <Zap className="w-6 h-6" />;
    }
  };

  const getRuleColor = (type: string) => {
    switch (type) {
      case 'auto_candidate_followup': return 'from-blue-600 to-blue-700';
      case 'auto_interview_reminders': return 'from-green-600 to-green-700';
      case 'auto_job_closure_notifications': return 'from-orange-600 to-orange-700';
      default: return 'from-gray-600 to-gray-700';
    }
  };

  const renderRuleConfig = (rule: AutomationRule) => {
    const config = rule.configuration || {};

    switch (rule.rule_type) {
      case 'auto_candidate_followup':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Délai première relance (jours)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={config.delay_days_reminder_1 || 2}
                onChange={(e) => handleConfigUpdate(rule.id, {
                  ...config,
                  delay_days_reminder_1: Number(e.target.value)
                })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Délai deuxième relance (jours)
              </label>
              <input
                type="number"
                min="1"
                max="15"
                value={config.delay_days_reminder_2 || 5}
                onChange={(e) => handleConfigUpdate(rule.id, {
                  ...config,
                  delay_days_reminder_2: Number(e.target.value)
                })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre max de relances
              </label>
              <select
                value={config.max_reminders || 2}
                onChange={(e) => handleConfigUpdate(rule.id, {
                  ...config,
                  max_reminders: Number(e.target.value)
                })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={1}>1 relance</option>
                <option value={2}>2 relances</option>
                <option value={3}>3 relances</option>
              </select>
            </div>
          </div>
        );

      case 'auto_interview_reminders':
        return (
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.send_j_minus_1 !== false}
                onChange={(e) => handleConfigUpdate(rule.id, {
                  ...config,
                  send_j_minus_1: e.target.checked
                })}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Envoyer rappel J-1</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.send_2h_before !== false}
                onChange={(e) => handleConfigUpdate(rule.id, {
                  ...config,
                  send_2h_before: e.target.checked
                })}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Envoyer rappel 2h avant</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.send_candidate_notification !== false}
                onChange={(e) => handleConfigUpdate(rule.id, {
                  ...config,
                  send_candidate_notification: e.target.checked
                })}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Notifier le candidat</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.send_recruiter_notification !== false}
                onChange={(e) => handleConfigUpdate(rule.id, {
                  ...config,
                  send_recruiter_notification: e.target.checked
                })}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Notifier le recruteur</span>
            </label>
          </div>
        );

      case 'auto_job_closure_notifications':
        return (
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.notify_pending_candidates !== false}
                onChange={(e) => handleConfigUpdate(rule.id, {
                  ...config,
                  notify_pending_candidates: e.target.checked
                })}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Notifier les candidats en attente</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={config.auto_archive_applications !== false}
                onChange={(e) => handleConfigUpdate(rule.id, {
                  ...config,
                  auto_archive_applications: e.target.checked
                })}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Archiver automatiquement les candidatures</span>
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-purple-900 via-purple-700 to-purple-900 text-white rounded-3xl p-8 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-2xl">
              <Zap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Automations de Recrutement</h1>
              <p className="text-purple-100">
                Configurez les règles d'automatisation pour optimiser votre processus de recrutement
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Sélectionner une entreprise
          </label>
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des règles...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden"
              >
                <div className={`bg-gradient-to-r ${getRuleColor(rule.rule_type)} text-white p-6`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 rounded-xl">
                        {getRuleIcon(rule.rule_type)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">
                          {recruitmentAutomationService.getRuleTypeLabel(rule.rule_type)}
                        </h3>
                        <p className="text-white/80 text-sm mt-1">
                          {rule.rule_type === 'auto_candidate_followup' && 'Relancer automatiquement les candidats qui ne répondent pas'}
                          {rule.rule_type === 'auto_interview_reminders' && 'Envoyer des rappels avant les entretiens'}
                          {rule.rule_type === 'auto_job_closure_notifications' && 'Notifier lors de la fermeture d\'une offre'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle(rule.id, rule.is_enabled)}
                      disabled={saving === rule.id}
                      className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition disabled:opacity-50"
                    >
                      {rule.is_enabled ? (
                        <ToggleRight className="w-8 h-8" />
                      ) : (
                        <ToggleLeft className="w-8 h-8" />
                      )}
                    </button>
                  </div>
                </div>

                {rule.is_enabled && (
                  <div className="p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Configuration</h4>
                    {renderRuleConfig(rule)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
