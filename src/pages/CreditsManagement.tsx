import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/AdminLayout';
import {
  Coins,
  Package,
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
} from 'lucide-react';

interface CreditPackage {
  id: string;
  name: string;
  description: string;
  credits_amount: number;
  price_amount: number;
  currency: string;
  bonus_credits: number;
  is_popular: boolean;
  is_active: boolean;
  display_order: number;
}

interface ServiceCost {
  id: string;
  service_code: string;
  service_name: string;
  service_description: string;
  credits_cost: number;
  is_active: boolean;
  category: string;
}

interface Stats {
  total_users_with_credits: number;
  total_credits_in_circulation: number;
  total_revenue: number;
  total_transactions: number;
}

export default function CreditsManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'packages' | 'services' | 'stats'>('packages');
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [services, setServices] = useState<ServiceCost[]>([]);
  const [stats, setStats] = useState<Stats>({ total_users_with_credits: 0, total_credits_in_circulation: 0, total_revenue: 0, total_transactions: 0 });
  const [loading, setLoading] = useState(true);

  const [editingPackage, setEditingPackage] = useState<CreditPackage | null>(null);
  const [editingService, setEditingService] = useState<ServiceCost | null>(null);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadPackages(), loadServices(), loadStats()]);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPackages = async () => {
    const { data, error } = await supabase
      .from('credit_packages')
      .select('*')
      .order('display_order');

    if (error) throw error;
    setPackages(data || []);
  };

  const loadServices = async () => {
    const { data, error } = await supabase
      .from('service_credit_costs')
      .select('*')
      .order('category, service_name');

    if (error) throw error;
    setServices(data || []);
  };

  const loadStats = async () => {
    const { data: balances } = await supabase
      .from('user_credit_balances')
      .select('total_credits');

    const { data: transactions } = await supabase
      .from('credit_transactions')
      .select('price_paid, transaction_type');

    const totalCredits = balances?.reduce((sum, b) => sum + b.total_credits, 0) || 0;
    const totalRevenue = transactions?.filter(t => t.transaction_type === 'purchase').reduce((sum, t) => sum + (parseFloat(t.price_paid as any) || 0), 0) || 0;

    setStats({
      total_users_with_credits: balances?.length || 0,
      total_credits_in_circulation: totalCredits,
      total_revenue: totalRevenue,
      total_transactions: transactions?.length || 0,
    });
  };

  const savePackage = async (pkg: Partial<CreditPackage>) => {
    try {
      if (pkg.id) {
        const { error } = await supabase
          .from('credit_packages')
          .update(pkg)
          .eq('id', pkg.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('credit_packages')
          .insert([pkg]);
        if (error) throw error;
      }
      await loadPackages();
      setShowPackageModal(false);
      setEditingPackage(null);
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const saveService = async (service: Partial<ServiceCost>) => {
    try {
      if (service.id) {
        const { error } = await supabase
          .from('service_credit_costs')
          .update(service)
          .eq('id', service.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('service_credit_costs')
          .insert([service]);
        if (error) throw error;
      }
      await loadServices();
      setShowServiceModal(false);
      setEditingService(null);
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const deletePackage = async (id: string) => {
    if (!confirm('Supprimer ce package?')) return;

    try {
      const { error } = await supabase
        .from('credit_packages')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await loadPackages();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Crédits</h1>
          <p className="text-gray-600">Configuration des packages et coûts des services</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">{stats.total_users_with_credits}</span>
            </div>
            <p className="text-sm text-gray-600">Utilisateurs avec crédits</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Coins className="w-8 h-8 text-yellow-600" />
              <span className="text-2xl font-bold text-gray-900">{stats.total_credits_in_circulation.toLocaleString()}</span>
            </div>
            <p className="text-sm text-gray-600">Crédits en circulation</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold text-gray-900">{(stats.total_revenue / 1000).toFixed(0)}k</span>
            </div>
            <p className="text-sm text-gray-600">Revenu total (GNF)</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-purple-600" />
              <span className="text-2xl font-bold text-gray-900">{stats.total_transactions}</span>
            </div>
            <p className="text-sm text-gray-600">Transactions totales</p>
          </div>
        </div>

        <div className="flex space-x-4 mb-6 border-b-2 border-gray-200">
          <button
            onClick={() => setActiveTab('packages')}
            className={`px-6 py-3 font-medium transition-all border-b-2 -mb-0.5 ${
              activeTab === 'packages'
                ? 'text-blue-900 border-blue-900'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <Package className="w-5 h-5 inline mr-2" />
            Packages de Crédits
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-6 py-3 font-medium transition-all border-b-2 -mb-0.5 ${
              activeTab === 'services'
                ? 'text-blue-900 border-blue-900'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <Settings className="w-5 h-5 inline mr-2" />
            Coûts des Services
          </button>
        </div>

        {activeTab === 'packages' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Packages de Crédits</h2>
              <button
                onClick={() => {
                  setEditingPackage({
                    id: '',
                    name: '',
                    description: '',
                    credits_amount: 100,
                    price_amount: 50000,
                    currency: 'GNF',
                    bonus_credits: 0,
                    is_popular: false,
                    is_active: true,
                    display_order: packages.length + 1,
                  });
                  setShowPackageModal(true);
                }}
                className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Nouveau Package</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`border-2 rounded-lg p-6 ${
                    pkg.is_popular ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  } ${!pkg.is_active ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{pkg.name}</h3>
                      {pkg.is_popular && (
                        <span className="inline-block bg-blue-500 text-white text-xs px-2 py-1 rounded mt-1">
                          Populaire
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingPackage(pkg);
                          setShowPackageModal(true);
                        }}
                        className="text-gray-600 hover:text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deletePackage(pkg.id)}
                        className="text-gray-600 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Crédits:</span>
                      <span className="font-semibold">{pkg.credits_amount}</span>
                    </div>
                    {pkg.bonus_credits > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span className="text-sm">Bonus:</span>
                        <span className="font-semibold">+{pkg.bonus_credits}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Prix:</span>
                      <span className="font-bold text-lg">{pkg.price_amount.toLocaleString()} {pkg.currency}</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Statut: {pkg.is_active ? 'Actif' : 'Inactif'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Coûts des Services</h2>
              <button
                onClick={() => {
                  setEditingService({
                    id: '',
                    service_code: '',
                    service_name: '',
                    service_description: '',
                    credits_cost: 0,
                    is_active: true,
                    category: 'Autre',
                  });
                  setShowServiceModal(true);
                }}
                className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Nouveau Service</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4">Service</th>
                    <th className="text-left py-3 px-4">Code</th>
                    <th className="text-left py-3 px-4">Catégorie</th>
                    <th className="text-center py-3 px-4">Coût (crédits)</th>
                    <th className="text-center py-3 px-4">Statut</th>
                    <th className="text-center py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold text-gray-900">{service.service_name}</p>
                          <p className="text-sm text-gray-600">{service.service_description}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{service.service_code}</code>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">{service.category}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block bg-yellow-100 text-yellow-900 px-3 py-1 rounded-full font-bold">
                          {service.credits_cost} ⚡
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          service.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {service.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setEditingService(service);
                            setShowServiceModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 mr-2"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showPackageModal && editingPackage && (
          <PackageModal
            package={editingPackage}
            onSave={savePackage}
            onClose={() => {
              setShowPackageModal(false);
              setEditingPackage(null);
            }}
          />
        )}

        {showServiceModal && editingService && (
          <ServiceModal
            service={editingService}
            onSave={saveService}
            onClose={() => {
              setShowServiceModal(false);
              setEditingService(null);
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

function PackageModal({ package: pkg, onSave, onClose }: any) {
  const [formData, setFormData] = useState(pkg);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">{pkg.id ? 'Modifier' : 'Nouveau'} Package</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nom</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Crédits</label>
              <input
                type="number"
                value={formData.credits_amount}
                onChange={(e) => setFormData({ ...formData, credits_amount: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bonus</label>
              <input
                type="number"
                value={formData.bonus_credits}
                onChange={(e) => setFormData({ ...formData, bonus_credits: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Prix (GNF)</label>
              <input
                type="number"
                value={formData.price_amount}
                onChange={(e) => setFormData({ ...formData, price_amount: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Ordre</label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_popular}
                onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Populaire</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Actif</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 flex items-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>Enregistrer</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ServiceModal({ service, onSave, onClose }: any) {
  const [formData, setFormData] = useState(service);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">{service.id ? 'Modifier' : 'Nouveau'} Service</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Code Service</label>
            <input
              type="text"
              value={formData.service_code}
              onChange={(e) => setFormData({ ...formData, service_code: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg font-mono"
              disabled={!!service.id}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nom du Service</label>
            <input
              type="text"
              value={formData.service_name}
              onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.service_description}
              onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Coût (crédits)</label>
              <input
                type="number"
                value={formData.credits_cost}
                onChange={(e) => setFormData({ ...formData, credits_cost: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Catégorie</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="IA & Analyse">IA & Analyse</option>
                <option value="Documents">Documents</option>
                <option value="Formation">Formation</option>
                <option value="Visibilité">Visibilité</option>
                <option value="Candidature">Candidature</option>
                <option value="Communication">Communication</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Service actif</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 flex items-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>Enregistrer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
