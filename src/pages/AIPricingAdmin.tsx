import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';
import {
  DollarSign,
  Edit2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Loader,
  TrendingUp,
  Power
} from 'lucide-react';

interface ServiceCreditCost {
  id: string;
  service_code: string;
  service_name: string;
  service_description: string;
  credits_cost: number;
  is_active: boolean;
  category: string;
  created_at: string;
  updated_at: string;
}

export default function AIPricingAdmin() {
  const { user } = useAuth();
  const [services, setServices] = useState<ServiceCreditCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ServiceCreditCost>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

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
      showMessage('error', 'Erreur lors du chargement des services: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (service: ServiceCreditCost) => {
    setEditingId(service.id);
    setEditForm({
      service_name: service.service_name,
      service_description: service.service_description,
      credits_cost: service.credits_cost,
      is_active: service.is_active,
      category: service.category,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveService = async (serviceId: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('service_credit_costs')
        .update(editForm)
        .eq('id', serviceId);

      if (error) throw error;

      showMessage('success', 'Service mis à jour avec succès');
      setEditingId(null);
      setEditForm({});
      loadServices();
    } catch (error: any) {
      showMessage('error', 'Erreur lors de la mise à jour: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (serviceId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('service_credit_costs')
        .update({ is_active: !currentStatus })
        .eq('id', serviceId);

      if (error) throw error;

      showMessage('success', `Service ${!currentStatus ? 'activé' : 'désactivé'} avec succès`);
      loadServices();
    } catch (error: any) {
      showMessage('error', 'Erreur lors du changement de statut: ' + error.message);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'IA & Analyse': 'bg-purple-100 text-purple-800',
      'Documents': 'bg-blue-100 text-blue-800',
      'Formation': 'bg-pink-100 text-pink-800',
      'Visibilité': 'bg-yellow-100 text-yellow-800',
      'Communication': 'bg-green-100 text-green-800',
      'Candidature': 'bg-indigo-100 text-indigo-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

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
            <DollarSign className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Gestion de la Tarification IA</h1>
          </div>
          <p className="text-gray-600">
            Configurez les coûts en crédits pour chaque service Premium IA
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p>{message.text}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Coût (crédits)
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50 transition">
                    {editingId === service.id ? (
                      <>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editForm.service_name || ''}
                              onChange={(e) => setEditForm({ ...editForm, service_name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Nom du service"
                            />
                            <textarea
                              value={editForm.service_description || ''}
                              onChange={(e) => setEditForm({ ...editForm, service_description: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="Description"
                              rows={2}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editForm.category || ''}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Catégorie"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min="0"
                            value={editForm.credits_cost || 0}
                            onChange={(e) => setEditForm({ ...editForm, credits_cost: parseInt(e.target.value) || 0 })}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editForm.is_active || false}
                              onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Actif</span>
                          </label>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => saveService(service.id)}
                              disabled={saving}
                              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                              title="Enregistrer"
                            >
                              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={saving}
                              className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
                              title="Annuler"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-gray-900">{service.service_name}</div>
                            <div className="text-sm text-gray-500 mt-1">{service.service_description}</div>
                            <div className="text-xs text-gray-400 mt-1">Code: {service.service_code}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(service.category)}`}>
                            {service.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            <span className="font-bold text-lg text-gray-900">{service.credits_cost}</span>
                            <span className="text-sm text-gray-500">crédits</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleActive(service.id, service.is_active)}
                            className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium transition ${
                              service.is_active
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            <Power className="w-3 h-3" />
                            <span>{service.is_active ? 'Actif' : 'Inactif'}</span>
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => startEdit(service)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-2">Informations importantes</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Les modifications s'appliquent immédiatement à tous les utilisateurs</li>
                <li>Les services avec 0 crédits sont considérés comme gratuits</li>
                <li>Le Badge Vérifié utilise une déduction automatique quotidienne</li>
                <li>Conversion: 1000 GNF = 10 crédits</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
