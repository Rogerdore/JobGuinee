import { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  Edit,
  Plus,
  RefreshCw,
  DollarSign,
  Activity,
  BarChart3,
  Tag,
  Eye,
  EyeOff,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Percent,
  History,
  Clock
} from 'lucide-react';
import {
  PricingEngine,
  CreditServiceConfig,
  PricingUpdateParams,
  NewServiceParams,
  ServiceStatistics,
  ServiceCostHistory
} from '../services/creditService';
import ServiceHistoryModal from '../components/admin/ServiceHistoryModal';

interface EditModalProps {
  service: CreditServiceConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (params: PricingUpdateParams) => Promise<void>;
}

function EditServiceModal({ service, isOpen, onClose, onSave }: EditModalProps) {
  const [formData, setFormData] = useState<PricingUpdateParams>({
    service_code: '',
    credits_cost: 0,
    is_active: true,
    promotion_active: false,
    discount_percent: 0,
    display_order: 0,
    icon: 'Sparkles',
    service_description: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (service) {
      setFormData({
        service_code: service.service_code,
        credits_cost: service.credits_cost,
        is_active: service.is_active,
        promotion_active: service.promotion_active || false,
        discount_percent: service.discount_percent || 0,
        display_order: service.display_order || 0,
        icon: service.icon || 'Sparkles',
        service_description: service.service_description || ''
      });
    }
  }, [service]);

  if (!isOpen || !service) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const effectiveCost = PricingEngine.calculateEffectiveCost(
    formData.credits_cost || 0,
    formData.promotion_active || false,
    formData.discount_percent || 0
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Edit className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-bold">Modifier le Service</h2>
                <p className="text-blue-100 text-sm">{service.service_name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Code du service (lecture seule)</div>
              <div className="font-mono font-semibold text-gray-900">{service.service_code}</div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description du service
              </label>
              <textarea
                value={formData.service_description}
                onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Description détaillée du service..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Coût en crédits
                </label>
                <input
                  type="number"
                  value={formData.credits_cost}
                  onChange={(e) => setFormData({ ...formData, credits_cost: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ordre d'affichage
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Icône (Lucide React)
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Sparkles"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <div className="font-semibold text-blue-900">Service Actif</div>
                <div className="text-sm text-blue-700">Le service sera visible et utilisable</div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                className={`relative w-14 h-8 rounded-full transition ${
                  formData.is_active ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  formData.is_active ? 'translate-x-6' : ''
                }`} />
              </button>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-orange-600" />
                Promotion
              </h3>

              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200 mb-4">
                <div>
                  <div className="font-semibold text-orange-900">Promotion Active</div>
                  <div className="text-sm text-orange-700">Appliquer une remise temporaire</div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, promotion_active: !formData.promotion_active })}
                  className={`relative w-14 h-8 rounded-full transition ${
                    formData.promotion_active ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    formData.promotion_active ? 'translate-x-6' : ''
                  }`} />
                </button>
              </div>

              {formData.promotion_active && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Percent className="w-4 h-4" />
                    Pourcentage de remise
                  </label>
                  <input
                    type="number"
                    value={formData.discount_percent}
                    onChange={(e) => setFormData({ ...formData, discount_percent: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600">Coût original</div>
                        <div className="text-2xl font-bold text-gray-400 line-through">
                          {formData.credits_cost} crédits
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Coût promotionnel</div>
                        <div className="text-3xl font-bold text-green-600">
                          {effectiveCost} crédits
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
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
          </div>
        </form>
      </div>
    </div>
  );
}

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (params: NewServiceParams) => Promise<void>;
}

function AddServiceModal({ isOpen, onClose, onAdd }: AddServiceModalProps) {
  const [formData, setFormData] = useState<NewServiceParams>({
    service_code: '',
    service_name: '',
    service_description: '',
    credits_cost: 50,
    category: 'ia_services',
    icon: 'Sparkles',
    is_active: true
  });
  const [adding, setAdding] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await onAdd(formData);
      setFormData({
        service_code: '',
        service_name: '',
        service_description: '',
        credits_cost: 50,
        category: 'ia_services',
        icon: 'Sparkles',
        is_active: true
      });
      onClose();
    } catch (error) {
      console.error('Error adding:', error);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
        <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Plus className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Ajouter un Service IA</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Code du service (unique)
              </label>
              <input
                type="text"
                value={formData.service_code}
                onChange={(e) => setFormData({ ...formData, service_code: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                placeholder="ai_new_service"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nom du service
              </label>
              <input
                type="text"
                value={formData.service_name}
                onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Nouveau Service IA"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.service_description}
                onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Description détaillée..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Coût en crédits
                </label>
                <input
                  type="number"
                  value={formData.credits_cost}
                  onChange={(e) => setFormData({ ...formData, credits_cost: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Icône
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Sparkles"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Catégorie
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="ia_services">Services IA</option>
                <option value="premium_features">Fonctionnalités Premium</option>
                <option value="boost_services">Services Boost</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={adding}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              {adding ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Ajout...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Ajouter le service
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminIAPricing() {
  const [services, setServices] = useState<CreditServiceConfig[]>([]);
  const [statistics, setStatistics] = useState<ServiceStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<CreditServiceConfig | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyServiceCode, setHistoryServiceCode] = useState<string | undefined>();
  const [historyServiceName, setHistoryServiceName] = useState<string | undefined>();
  const [recentChanges, setRecentChanges] = useState<ServiceCostHistory[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [servicesData, statsData, historyData] = await Promise.all([
        PricingEngine.fetchAllPricing(),
        PricingEngine.getStatistics(),
        PricingEngine.getRecentChanges(5)
      ]);
      setServices(servicesData);
      setStatistics(statsData);
      setRecentChanges(historyData);
    } catch (error) {
      console.error('Error loading data:', error);
      showAlert('error', 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const openHistory = (serviceCode: string, serviceName: string) => {
    setHistoryServiceCode(serviceCode);
    setHistoryServiceName(serviceName);
    setShowHistoryModal(true);
  };

  const openAllHistory = () => {
    setHistoryServiceCode(undefined);
    setHistoryServiceName('Tous les services');
    setShowHistoryModal(true);
  };

  useEffect(() => {
    loadData();
  }, []);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleUpdate = async (params: PricingUpdateParams) => {
    const result = await PricingEngine.updatePricing(params);
    if (result.success) {
      showAlert('success', result.message);
      await loadData();
    } else {
      showAlert('error', result.message);
    }
  };

  const handleAdd = async (params: NewServiceParams) => {
    const result = await PricingEngine.addService(params);
    if (result.success) {
      showAlert('success', result.message);
      await loadData();
    } else {
      showAlert('error', result.message);
    }
  };

  const getStatForService = (serviceCode: string) => {
    return statistics.find(s => s.service_code === serviceCode);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {alert && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          alert.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          {alert.type === 'success' ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
          ) : (
            <AlertCircle className="w-6 h-6 text-red-600" />
          )}
          <span className={`font-semibold ${alert.type === 'success' ? 'text-green-900' : 'text-red-900'}`}>
            {alert.message}
          </span>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-10 h-10" />
              <h1 className="text-4xl font-bold">Moteur de Tarification IA</h1>
            </div>
            <p className="text-blue-100">
              Gérez les coûts, promotions et paramètres de tous les services IA
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={openAllHistory}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition flex items-center gap-2"
            >
              <History className="w-5 h-5" />
              Historique
            </button>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Actualiser
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Nouveau Service
            </button>
          </div>
        </div>
      </div>

      {recentChanges.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-6 mb-8 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-bold text-purple-900">Activité Récente</h2>
            </div>
            <button
              onClick={openAllHistory}
              className="text-sm font-semibold text-purple-700 hover:text-purple-900 transition"
            >
              Voir tout →
            </button>
          </div>
          <div className="space-y-2">
            {recentChanges.map((change) => (
              <div
                key={change.id}
                className="bg-white rounded-lg p-4 border border-purple-200 flex items-center justify-between hover:shadow-md transition"
              >
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    change.change_type === 'created' ? 'bg-green-100 text-green-700' :
                    change.change_type === 'updated' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {change.change_type === 'created' ? 'Créé' :
                     change.change_type === 'updated' ? 'Modifié' : 'Supprimé'}
                  </span>
                  <div>
                    <div className="font-semibold text-gray-900">{change.service_name}</div>
                    <div className="text-sm text-gray-600">
                      {change.old_credits_cost !== change.new_credits_cost && (
                        <span>
                          {change.old_credits_cost} cr → {change.new_credits_cost} cr
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  {new Date(change.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border-2 border-blue-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Services Actifs</div>
              <div className="text-3xl font-bold text-gray-900">
                {services.filter(s => s.is_active).length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-orange-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Tag className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Promotions Actives</div>
              <div className="text-3xl font-bold text-gray-900">
                {services.filter(s => s.promotion_active).length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border-2 border-green-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-green-100 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Services</div>
              <div className="text-3xl font-bold text-gray-900">
                {services.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Tous les Services IA
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Service</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Code</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Coût</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Statut</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Promotion</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Utilisations</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {services.map((service) => {
                const stats = getStatForService(service.service_code);
                return (
                  <tr key={service.service_code} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{service.service_name}</div>
                      <div className="text-sm text-gray-600">{service.service_description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                        {service.service_code}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {service.promotion_active && service.discount_percent ? (
                          <>
                            <div className="text-sm text-gray-400 line-through">
                              {service.credits_cost} cr
                            </div>
                            <div className="text-lg font-bold text-green-600">
                              {service.effective_cost} cr
                            </div>
                            <div className="text-xs text-orange-600 font-semibold">
                              -{service.discount_percent}%
                            </div>
                          </>
                        ) : (
                          <div className="text-lg font-bold text-gray-900">
                            {service.credits_cost} cr
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {service.is_active ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                          <Eye className="w-4 h-4" />
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-sm font-semibold">
                          <EyeOff className="w-4 h-4" />
                          Inactif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {service.promotion_active ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                          <Tag className="w-4 h-4" />
                          Promo
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="text-lg font-bold text-blue-600">
                          {stats?.total_usage_count || 0}
                        </div>
                        <div className="text-xs text-gray-500">
                          {stats?.unique_users_count || 0} utilisateurs
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <button
                          onClick={() => setEditingService(service)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Modifier
                        </button>
                        <button
                          onClick={() => openHistory(service.service_code, service.service_name)}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition flex items-center gap-2"
                        >
                          <History className="w-4 h-4" />
                          Historique
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <EditServiceModal
        service={editingService}
        isOpen={!!editingService}
        onClose={() => setEditingService(null)}
        onSave={handleUpdate}
      />

      <AddServiceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAdd}
      />

      <ServiceHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        serviceCode={historyServiceCode}
        serviceName={historyServiceName}
      />
    </div>
  );
}
