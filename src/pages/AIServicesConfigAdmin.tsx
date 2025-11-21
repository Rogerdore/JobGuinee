import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';
import {
  Settings,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Loader,
  Power,
  Zap,
  Edit2,
  TestTube
} from 'lucide-react';

interface AIServiceConfig {
  id: string;
  service_code: string;
  service_key: string;
  service_name: string;
  service_description: string;
  credits_cost: number;
  is_active: boolean;
  status: boolean;
  category: string;
  model: string;
  prompt_template: string;
  system_instructions: string;
  knowledge_base: string;
  temperature: number;
  max_tokens: number;
}

export default function AIServicesConfigAdmin() {
  const { profile } = useAuth();
  const [services, setServices] = useState<AIServiceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AIServiceConfig>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    if (profile?.user_type === 'admin') {
      loadServices();
    }
  }, [profile]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_credit_costs')
        .select('*')
        .order('category', { ascending: true })
        .order('service_name', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error: any) {
      showMessage('error', 'Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (service: AIServiceConfig) => {
    setEditingId(service.id);
    setEditForm(service);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
    setTestResult(null);
  };

  const saveService = async (serviceId: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('service_credit_costs')
        .update(editForm)
        .eq('id', serviceId);

      if (error) throw error;

      showMessage('success', 'Configuration sauvegardée');
      setEditingId(null);
      setEditForm({});
      setTestResult(null);
      loadServices();
    } catch (error: any) {
      showMessage('error', 'Erreur: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const testService = async (service: Partial<AIServiceConfig>) => {
    if (!service.service_key) return;

    try {
      setTesting(true);
      setTestResult(null);

      const testPayload: Record<string, any> = {};

      const matches = service.prompt_template?.match(/\{\{(\w+)\}\}/g);
      if (matches) {
        matches.forEach(match => {
          const key = match.replace(/\{\{|\}\}/g, '');
          testPayload[key] = `[TEST_${key.toUpperCase()}]`;
        });
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session non trouvée');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-service`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: profile?.id,
            service_key: service.service_key,
            payload: testPayload
          })
        }
      );

      const result = await response.json();
      setTestResult(result);

      if (result.success) {
        showMessage('success', 'Test réussi !');
      } else {
        showMessage('error', `Test échoué: ${result.error || result.message}`);
      }
    } catch (error: any) {
      showMessage('error', 'Erreur test: ' + error.message);
      setTestResult({ success: false, error: error.message });
    } finally {
      setTesting(false);
    }
  };

  const toggleStatus = async (serviceId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('service_credit_costs')
        .update({ status: !currentStatus })
        .eq('id', serviceId);

      if (error) throw error;
      showMessage('success', `Service ${!currentStatus ? 'activé' : 'désactivé'}`);
      loadServices();
    } catch (error: any) {
      showMessage('error', 'Erreur: ' + error.message);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  if (profile?.user_type !== 'admin') {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Accès Refusé</h2>
          <p className="text-gray-600">Réservé aux administrateurs</p>
        </div>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Settings className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Configuration Services IA</h1>
          </div>
          <p className="text-gray-600">
            Configurez tous les paramètres des services IA (prompts, modèles, coûts)
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          {services.map((service) => (
            <div key={service.id} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{service.service_name}</h3>
                      <span className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                        {service.service_key}
                      </span>
                      <span className={`text-sm px-3 py-1 rounded-full ${
                        service.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {service.status ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{service.service_description}</p>
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>Coût: <strong>{service.credits_cost} crédits</strong></span>
                      <span>Modèle: <strong>{service.model || 'N/A'}</strong></span>
                      <span>Température: <strong>{service.temperature ?? 'N/A'}</strong></span>
                      <span>Max Tokens: <strong>{service.max_tokens || 'N/A'}</strong></span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleStatus(service.id, service.status)}
                      className={`p-2 rounded-lg transition ${
                        service.status
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      title={service.status ? 'Désactiver' : 'Activer'}
                    >
                      <Power className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => startEdit(service)}
                      className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                      title="Modifier"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {editingId === service.id && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nom du Service
                        </label>
                        <input
                          type="text"
                          value={editForm.service_name || ''}
                          onChange={(e) => setEditForm({ ...editForm, service_name: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Coût en Crédits
                        </label>
                        <input
                          type="number"
                          value={editForm.credits_cost || 0}
                          onChange={(e) => setEditForm({ ...editForm, credits_cost: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Modèle IA
                        </label>
                        <select
                          value={editForm.model || ''}
                          onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="gemini-pro">Gemini Pro</option>
                          <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                          <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                          <option value="gpt-4">GPT-4</option>
                          <option value="claude-3-haiku">Claude 3 Haiku</option>
                          <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Température (0.0 - 2.0)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="2"
                          value={editForm.temperature ?? 0.7}
                          onChange={(e) => setEditForm({ ...editForm, temperature: parseFloat(e.target.value) })}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Tokens
                        </label>
                        <input
                          type="number"
                          value={editForm.max_tokens || 2000}
                          onChange={(e) => setEditForm({ ...editForm, max_tokens: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={editForm.service_description || ''}
                          onChange={(e) => setEditForm({ ...editForm, service_description: e.target.value })}
                          rows={2}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Instructions Système
                        </label>
                        <textarea
                          value={editForm.system_instructions || ''}
                          onChange={(e) => setEditForm({ ...editForm, system_instructions: e.target.value })}
                          rows={3}
                          placeholder="Vous êtes un expert..."
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Template de Prompt (utilisez {`{{variable}}`})
                        </label>
                        <textarea
                          value={editForm.prompt_template || ''}
                          onChange={(e) => setEditForm({ ...editForm, prompt_template: e.target.value })}
                          rows={5}
                          placeholder="Analysez le profil suivant: {{profile_data}}"
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Base de Connaissances (optionnel)
                        </label>
                        <textarea
                          value={editForm.knowledge_base || ''}
                          onChange={(e) => setEditForm({ ...editForm, knowledge_base: e.target.value })}
                          rows={4}
                          placeholder="Informations spécifiques au domaine..."
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      </div>
                    </div>

                    {testResult && (
                      <div className={`mb-6 p-4 rounded-lg ${
                        testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                      }`}>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          {testResult.success ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
                          Résultat du Test
                        </h4>
                        <pre className="text-sm overflow-x-auto">{JSON.stringify(testResult, null, 2)}</pre>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => saveService(service.id)}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                      >
                        <Save className="w-5 h-5" />
                        {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                      </button>
                      <button
                        onClick={() => testService(editForm)}
                        disabled={testing}
                        className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
                      >
                        <TestTube className="w-5 h-5" />
                        {testing ? 'Test...' : 'Tester'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
                      >
                        <X className="w-5 h-5" />
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
