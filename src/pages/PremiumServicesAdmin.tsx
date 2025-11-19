import { useState, useEffect } from 'react';
import { Save, Plus, Edit2, Trash2, DollarSign, Zap, Crown, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/AdminLayout';

interface PremiumService {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  price: number;
  icon: string;
  is_active: boolean;
  features: string[];
}

interface ServiceCreditCost {
  id: string;
  service_code: string;
  service_name: string;
  service_description: string;
  credits_cost: number;
  is_active: boolean;
  category: string;
}

interface PremiumServicesAdminProps {
  onNavigate: (page: string) => void;
}

export default function PremiumServicesAdmin({ onNavigate }: PremiumServicesAdminProps) {
  const [premiumServices, setPremiumServices] = useState<PremiumService[]>([]);
  const [creditServices, setCreditServices] = useState<ServiceCreditCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'premium' | 'credits'>('premium');
  const [editingService, setEditingService] = useState<PremiumService | null>(null);
  const [editingCreditService, setEditingCreditService] = useState<ServiceCreditCost | null>(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      const [premiumResult, creditsResult] = await Promise.all([
        supabase
          .from('premium_services')
          .select('*')
          .order('category', { ascending: true }),
        supabase
          .from('service_credit_costs')
          .select('*')
          .order('category', { ascending: true })
      ]);

      if (premiumResult.data) {
        setPremiumServices(premiumResult.data);
      }

      if (creditsResult.data) {
        setCreditServices(creditsResult.data);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePremiumService = async (service: PremiumService) => {
    setSaving(true);
    try {
      console.log('Updating premium service:', service);

      const { data, error } = await supabase
        .from('premium_services')
        .update({
          name: service.name,
          description: service.description,
          price: service.price,
          is_active: service.is_active,
          features: service.features,
          updated_at: new Date().toISOString()
        })
        .eq('id', service.id)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Update successful:', data);
      await loadServices();
      setEditingService(null);
      alert('Service mis à jour avec succès');
    } catch (error: any) {
      console.error('Error updating service:', error);
      alert(`Erreur lors de la mise à jour: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCreditService = async (service: ServiceCreditCost) => {
    setSaving(true);
    try {
      console.log('Updating credit service:', service);

      const { data, error } = await supabase
        .from('service_credit_costs')
        .update({
          service_name: service.service_name,
          service_description: service.service_description,
          credits_cost: service.credits_cost,
          is_active: service.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', service.id)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Update successful:', data);
      await loadServices();
      setEditingCreditService(null);
      alert('Service mis à jour avec succès');
    } catch (error: any) {
      console.error('Error updating service:', error);
      alert(`Erreur lors de la mise à jour: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  const groupedPremiumServices = premiumServices.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, PremiumService[]>);

  const groupedCreditServices = creditServices.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, ServiceCreditCost[]>);

  if (loading) {
    return (
      <AdminLayout currentPage="premium-services" onNavigate={onNavigate}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="premium-services" onNavigate={onNavigate}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configuration Services Premium IA
          </h1>
          <p className="text-gray-600">
            Gérez les tarifs et coûts en crédits des services premium
          </p>
        </div>

        <div className="neo-clay-card rounded-2xl overflow-hidden">
          <div className="border-b border-gray-200 bg-white">
            <div className="flex space-x-1 p-2">
              <button
                onClick={() => setActiveTab('premium')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ${
                  activeTab === 'premium'
                    ? 'neo-clay-pressed text-primary-700'
                    : 'text-gray-600 hover:neo-clay'
                }`}
              >
                <Crown className="w-5 h-5" />
                Services Premium (Prix)
              </button>
              <button
                onClick={() => setActiveTab('credits')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ${
                  activeTab === 'credits'
                    ? 'neo-clay-pressed text-primary-700'
                    : 'text-gray-600 hover:neo-clay'
                }`}
              >
                <Zap className="w-5 h-5" />
                Coûts en Crédits
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'premium' && (
              <div className="space-y-8">
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <p className="text-sm text-blue-900">
                    Ces services sont vendus directement en GNF. Les utilisateurs paient pour débloquer ces fonctionnalités premium.
                  </p>
                </div>

                {Object.entries(groupedPremiumServices).map(([category, services]) => (
                  <div key={category}>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 capitalize">
                      {category.replace('_', ' ')}
                    </h2>
                    <div className="grid gap-6">
                      {services.map((service) => (
                        <div key={service.id} className="neo-clay-pressed rounded-xl p-6">
                          {editingService?.id === service.id ? (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Nom du service
                                </label>
                                <input
                                  type="text"
                                  value={editingService.name}
                                  onChange={(e) =>
                                    setEditingService({ ...editingService, name: e.target.value })
                                  }
                                  className="w-full px-4 py-2 rounded-xl neo-clay-input focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Description
                                </label>
                                <textarea
                                  value={editingService.description}
                                  onChange={(e) =>
                                    setEditingService({ ...editingService, description: e.target.value })
                                  }
                                  rows={3}
                                  className="w-full px-4 py-2 rounded-xl neo-clay-input focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Prix (GNF)
                                </label>
                                <input
                                  type="number"
                                  value={editingService.price}
                                  onChange={(e) =>
                                    setEditingService({ ...editingService, price: parseFloat(e.target.value) })
                                  }
                                  className="w-full px-4 py-2 rounded-xl neo-clay-input focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editingService.is_active}
                                    onChange={(e) =>
                                      setEditingService({ ...editingService, is_active: e.target.checked })
                                    }
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                  />
                                  <span className="text-sm text-gray-700">Service actif</span>
                                </label>
                              </div>

                              <div className="flex gap-3 pt-4">
                                <button
                                  onClick={() => handleUpdatePremiumService(editingService)}
                                  disabled={saving}
                                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-700 to-primary-600 hover:from-primary-800 hover:to-primary-700 text-white font-semibold rounded-xl transition disabled:opacity-50"
                                >
                                  <Save className="w-4 h-4" />
                                  Enregistrer
                                </button>
                                <button
                                  onClick={() => setEditingService(null)}
                                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition"
                                >
                                  Annuler
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-bold text-gray-900">{service.name}</h3>
                                  {!service.is_active && (
                                    <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                                      Inactif
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-600 mb-3">{service.description}</p>
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-5 h-5 text-green-600" />
                                  <span className="text-2xl font-bold text-green-600">
                                    {service.price.toLocaleString()} GNF
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => setEditingService(service)}
                                className="flex items-center gap-2 px-4 py-2 text-primary-700 hover:bg-primary-50 rounded-xl transition"
                              >
                                <Edit2 className="w-4 h-4" />
                                Modifier
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'credits' && (
              <div className="space-y-8">
                <div className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <p className="text-sm text-purple-900">
                    Ces services consomment des crédits du compte utilisateur. Les crédits sont achetés séparément via des packs.
                  </p>
                </div>

                {Object.entries(groupedCreditServices).map(([category, services]) => (
                  <div key={category}>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      {category}
                    </h2>
                    <div className="grid gap-6">
                      {services.map((service) => (
                        <div key={service.id} className="neo-clay-pressed rounded-xl p-6">
                          {editingCreditService?.id === service.id ? (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Nom du service
                                </label>
                                <input
                                  type="text"
                                  value={editingCreditService.service_name}
                                  onChange={(e) =>
                                    setEditingCreditService({ ...editingCreditService, service_name: e.target.value })
                                  }
                                  className="w-full px-4 py-2 rounded-xl neo-clay-input focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Description
                                </label>
                                <textarea
                                  value={editingCreditService.service_description}
                                  onChange={(e) =>
                                    setEditingCreditService({ ...editingCreditService, service_description: e.target.value })
                                  }
                                  rows={2}
                                  className="w-full px-4 py-2 rounded-xl neo-clay-input focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Coût en crédits
                                </label>
                                <input
                                  type="number"
                                  value={editingCreditService.credits_cost}
                                  onChange={(e) =>
                                    setEditingCreditService({ ...editingCreditService, credits_cost: parseInt(e.target.value) })
                                  }
                                  className="w-full px-4 py-2 rounded-xl neo-clay-input focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editingCreditService.is_active}
                                    onChange={(e) =>
                                      setEditingCreditService({ ...editingCreditService, is_active: e.target.checked })
                                    }
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                  />
                                  <span className="text-sm text-gray-700">Service actif</span>
                                </label>
                              </div>

                              <div className="flex gap-3 pt-4">
                                <button
                                  onClick={() => handleUpdateCreditService(editingCreditService)}
                                  disabled={saving}
                                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-700 to-primary-600 hover:from-primary-800 hover:to-primary-700 text-white font-semibold rounded-xl transition disabled:opacity-50"
                                >
                                  <Save className="w-4 h-4" />
                                  Enregistrer
                                </button>
                                <button
                                  onClick={() => setEditingCreditService(null)}
                                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition"
                                >
                                  Annuler
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-bold text-gray-900">{service.service_name}</h3>
                                  <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                                    {service.service_code}
                                  </span>
                                  {!service.is_active && (
                                    <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                                      Inactif
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-600 mb-3">{service.service_description}</p>
                                <div className="flex items-center gap-2">
                                  <Zap className="w-5 h-5 text-purple-600" />
                                  <span className="text-2xl font-bold text-purple-600">
                                    {service.credits_cost} crédits
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => setEditingCreditService(service)}
                                className="flex items-center gap-2 px-4 py-2 text-primary-700 hover:bg-primary-50 rounded-xl transition"
                              >
                                <Edit2 className="w-4 h-4" />
                                Modifier
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
