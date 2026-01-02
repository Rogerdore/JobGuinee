import { useState, useEffect } from 'react';
import { Shield, TrendingUp, Users, Activity, AlertCircle, CheckCircle, Settings, Filter, Calendar, Crown, Zap, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useModalContext } from '../contexts/ModalContext';

interface ServiceQuotaConfig {
  id: string;
  service_code: string;
  service_name: string;
  service_description: string;
  enable_premium_limits: boolean;
  premium_daily_limit: number;
  credits_cost: number;
  is_active: boolean;
}

interface UsageStats {
  service_code: string;
  service_name: string;
  total_users_today: number;
  total_actions_today: number;
  avg_actions_per_user: number;
  users_at_limit: number;
}

export default function AdminIAPremiumQuota() {
  const { showSuccess, showError, showWarning, showConfirm } = useModalContext();
  const { profile } = useAuth();
  const [services, setServices] = useState<ServiceQuotaConfig[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<ServiceQuotaConfig | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    enable_premium_limits: false,
    premium_daily_limit: 30,
    credits_cost: 5
  });

  useEffect(() => {
    if (profile?.user_type === 'admin') {
      loadData();
    }
  }, [profile]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadServices(),
        loadUsageStats()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    const { data, error } = await supabase
      .from('ia_service_config')
      .select('id, service_code, service_name, service_description, enable_premium_limits, premium_daily_limit, credits_cost, is_active')
      .order('service_name');

    if (error) {
      console.error('Error loading services:', error);
      return;
    }

    setServices(data || []);
  };

  const loadUsageStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: usageData, error } = await supabase
        .from('ai_service_usage_history')
        .select('service_code, user_id')
        .gte('created_at', today.toISOString());

      if (error) throw error;

      const { data: servicesData, error: servicesError } = await supabase
        .from('ia_service_config')
        .select('service_code, service_name, premium_daily_limit');

      if (servicesError) throw servicesError;

      const statsMap = new Map<string, {
        users: Set<string>;
        actions: number;
        usersAtLimit: Set<string>;
      }>();

      usageData?.forEach((record: any) => {
        if (!statsMap.has(record.service_code)) {
          statsMap.set(record.service_code, {
            users: new Set(),
            actions: 0,
            usersAtLimit: new Set()
          });
        }
        const stat = statsMap.get(record.service_code)!;
        stat.users.add(record.user_id);
        stat.actions++;
      });

      const userActionsMap = new Map<string, Map<string, number>>();
      usageData?.forEach((record: any) => {
        if (!userActionsMap.has(record.user_id)) {
          userActionsMap.set(record.user_id, new Map());
        }
        const userServices = userActionsMap.get(record.user_id)!;
        userServices.set(record.service_code, (userServices.get(record.service_code) || 0) + 1);
      });

      servicesData?.forEach((service: any) => {
        if (service.premium_daily_limit && service.premium_daily_limit > 0) {
          userActionsMap.forEach((services, userId) => {
            const count = services.get(service.service_code) || 0;
            if (count >= service.premium_daily_limit) {
              const stat = statsMap.get(service.service_code);
              if (stat) {
                stat.usersAtLimit.add(userId);
              }
            }
          });
        }
      });

      const stats: UsageStats[] = servicesData?.map((service: any) => {
        const stat = statsMap.get(service.service_code);
        const totalUsers = stat?.users.size || 0;
        const totalActions = stat?.actions || 0;

        return {
          service_code: service.service_code,
          service_name: service.service_name,
          total_users_today: totalUsers,
          total_actions_today: totalActions,
          avg_actions_per_user: totalUsers > 0 ? Math.round(totalActions / totalUsers) : 0,
          users_at_limit: stat?.usersAtLimit.size || 0
        };
      }) || [];

      setUsageStats(stats);
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  };

  const handleEditService = (service: ServiceQuotaConfig) => {
    setSelectedService(service);
    setEditForm({
      enable_premium_limits: service.enable_premium_limits,
      premium_daily_limit: service.premium_daily_limit,
      credits_cost: service.credits_cost
    });
    setShowEditModal(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedService) return;

    const { error } = await supabase
      .from('ia_service_config')
      .update({
        enable_premium_limits: editForm.enable_premium_limits,
        premium_daily_limit: editForm.premium_daily_limit,
        credits_cost: editForm.credits_cost,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedService.id);

    if (error) {
      console.error('Error updating service:', error);
      showSuccess('Mise à jour', 'Erreur lors de la mise à jour');
      return;
    }

    showSuccess('Mise à jour', 'Configuration mise à jour avec succès');
    setShowEditModal(false);
    loadData();
  };

  const toggleQuotaEnabled = async (serviceId: string, currentValue: boolean) => {
    const { error } = await supabase
      .from('ia_service_config')
      .update({
        enable_premium_limits: !currentValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', serviceId);

    if (error) {
      console.error('Error toggling quota:', error);
      return;
    }

    loadData();
  };

  const getServiceStats = (serviceCode: string): UsageStats | undefined => {
    return usageStats.find(s => s.service_code === serviceCode);
  };

  if (profile?.user_type !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès Restreint</h2>
          <p className="text-gray-600">Cette page est réservée aux administrateurs.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const totalActionsToday = usageStats.reduce((sum, s) => sum + s.total_actions_today, 0);
  const totalUsersToday = new Set(usageStats.flatMap(s => Array(s.total_users_today).fill(s.service_code))).size;
  const servicesWithQuota = services.filter(s => s.enable_premium_limits).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Quotas Premium IA</h1>
              <p className="text-gray-600">Configuration et monitoring des limites quotidiennes Premium PRO+</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-blue-500" />
              <span className="text-sm font-medium text-gray-500">Actions Total</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{totalActionsToday}</div>
            <p className="text-sm text-gray-600 mt-1">Aujourd'hui</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-green-500" />
              <span className="text-sm font-medium text-gray-500">Utilisateurs Actifs</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{totalUsersToday}</div>
            <p className="text-sm text-gray-600 mt-1">Aujourd'hui</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Shield className="w-8 h-8 text-orange-500" />
              <span className="text-sm font-medium text-gray-500">Services avec Quota</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{servicesWithQuota}</div>
            <p className="text-sm text-gray-600 mt-1">Sur {services.length} services</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-purple-500" />
              <span className="text-sm font-medium text-gray-500">Moyenne/User</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {totalUsersToday > 0 ? Math.round(totalActionsToday / totalUsersToday) : 0}
            </div>
            <p className="text-sm text-gray-600 mt-1">Actions par user</p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={loadData}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Actualiser
              </button>
            </div>
            <div className="text-sm text-gray-600">
              <Calendar className="w-4 h-4 inline mr-2" />
              Dernière mise à jour : {new Date().toLocaleTimeString('fr-FR')}
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuration des Services IA
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quota Activé
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Limite/Jour
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coût Crédits
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions Aujourd'hui
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Users à la Limite
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {services.map((service) => {
                  const stats = getServiceStats(service.service_code);
                  return (
                    <tr key={service.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{service.service_name}</div>
                          <div className="text-sm text-gray-500">{service.service_code}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleQuotaEnabled(service.id, service.enable_premium_limits)}
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition ${
                            service.enable_premium_limits
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {service.enable_premium_limits ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Activé
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4" />
                              Désactivé
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg font-bold text-gray-900">
                          {service.premium_daily_limit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-900">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          {service.credits_cost}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {stats?.total_actions_today || 0}
                        </div>
                        <div className="text-xs text-gray-500">
                          {stats?.total_users_today || 0} users
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {stats && stats.users_at_limit > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                            <AlertCircle className="w-4 h-4" />
                            {stats.users_at_limit}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleEditService(service)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
                        >
                          <Settings className="w-4 h-4" />
                          Modifier
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && selectedService && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Modifier {selectedService.service_name}
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Enable Premium Limits */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-900">
                      Activer les quotas Premium
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      Limiter le nombre d'utilisations par jour pour les Premium PRO+
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.enable_premium_limits}
                      onChange={(e) => setEditForm({ ...editForm, enable_premium_limits: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Premium Daily Limit */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Limite quotidienne Premium PRO+
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.premium_daily_limit}
                    onChange={(e) => setEditForm({ ...editForm, premium_daily_limit: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="30"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Nombre maximum d'utilisations par jour (0 = illimité)
                  </p>
                </div>

                {/* Credits Cost */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Coût en crédits (utilisateurs non-premium)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.credits_cost}
                    onChange={(e) => setEditForm({ ...editForm, credits_cost: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="5"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Crédits nécessaires pour utiliser ce service
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveChanges}
                  className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
                >
                  Enregistrer les modifications
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
