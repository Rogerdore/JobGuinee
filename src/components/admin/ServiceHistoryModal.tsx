import { useState, useEffect } from 'react';
import { X, History, TrendingUp, TrendingDown, Clock, User, AlertCircle } from 'lucide-react';
import { PricingEngine, ServiceCostHistory } from '../../services/creditService';

interface ServiceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceCode?: string;
  serviceName?: string;
}

export default function ServiceHistoryModal({ isOpen, onClose, serviceCode, serviceName }: ServiceHistoryModalProps) {
  const [history, setHistory] = useState<ServiceCostHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, serviceCode]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await PricingEngine.getHistory(serviceCode);
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'created': return 'text-green-700 bg-green-100';
      case 'updated': return 'text-blue-700 bg-blue-100';
      case 'deleted': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getChangeTypeLabel = (type: string) => {
    switch (type) {
      case 'created': return 'Créé';
      case 'updated': return 'Modifié';
      case 'deleted': return 'Supprimé';
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const renderCostChange = (entry: ServiceCostHistory) => {
    if (entry.old_credits_cost === null && entry.new_credits_cost !== null) {
      return (
        <div className="flex items-center gap-2">
          <span className="font-bold text-green-600">{entry.new_credits_cost} crédits</span>
          <span className="text-sm text-gray-500">(création)</span>
        </div>
      );
    }

    if (entry.old_credits_cost === entry.new_credits_cost) {
      return <span className="text-gray-600">{entry.old_credits_cost} crédits</span>;
    }

    const diff = (entry.new_credits_cost || 0) - (entry.old_credits_cost || 0);
    const isIncrease = diff > 0;

    return (
      <div className="flex items-center gap-2">
        <span className="text-gray-400 line-through">{entry.old_credits_cost}</span>
        <span className="text-gray-400">→</span>
        <span className="font-bold text-gray-900">{entry.new_credits_cost} crédits</span>
        {isIncrease ? (
          <TrendingUp className="w-4 h-4 text-red-600" />
        ) : (
          <TrendingDown className="w-4 h-4 text-green-600" />
        )}
        <span className={`text-sm font-semibold ${isIncrease ? 'text-red-600' : 'text-green-600'}`}>
          {isIncrease ? '+' : ''}{diff}
        </span>
      </div>
    );
  };

  const renderStatusChange = (entry: ServiceCostHistory) => {
    if (entry.old_is_active === entry.new_is_active) {
      return entry.new_is_active ? (
        <span className="text-green-600 text-sm">Actif</span>
      ) : (
        <span className="text-gray-500 text-sm">Inactif</span>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <span className={entry.old_is_active ? 'text-green-600' : 'text-gray-500'}>
          {entry.old_is_active ? 'Actif' : 'Inactif'}
        </span>
        <span className="text-gray-400">→</span>
        <span className={entry.new_is_active ? 'text-green-600 font-semibold' : 'text-gray-500 font-semibold'}>
          {entry.new_is_active ? 'Actif' : 'Inactif'}
        </span>
      </div>
    );
  };

  const renderPromotionChange = (entry: ServiceCostHistory) => {
    const oldPromo = entry.old_promotion_active;
    const newPromo = entry.new_promotion_active;
    const oldDiscount = entry.old_discount_percent || 0;
    const newDiscount = entry.new_discount_percent || 0;

    if (!oldPromo && !newPromo) {
      return <span className="text-gray-400 text-sm">—</span>;
    }

    if (oldPromo === newPromo && oldDiscount === newDiscount) {
      return newPromo ? (
        <span className="text-orange-600 text-sm font-semibold">-{newDiscount}%</span>
      ) : (
        <span className="text-gray-400 text-sm">Aucune</span>
      );
    }

    return (
      <div className="flex items-center gap-2 text-sm">
        {oldPromo ? (
          <span className="text-orange-500">-{oldDiscount}%</span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
        <span className="text-gray-400">→</span>
        {newPromo ? (
          <span className="text-orange-600 font-semibold">-{newDiscount}%</span>
        ) : (
          <span className="text-gray-500 font-semibold">Aucune</span>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-bold">Historique des Modifications</h2>
                {serviceName && (
                  <p className="text-purple-100 text-sm mt-1">{serviceName}</p>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Aucun historique disponible</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry, index) => (
                <div
                  key={entry.id}
                  className="border-2 border-gray-200 rounded-xl p-5 hover:border-purple-300 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getChangeTypeColor(entry.change_type)}`}>
                          {getChangeTypeLabel(entry.change_type)}
                        </span>
                        <span className="text-sm font-mono text-gray-600">{entry.service_code}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{entry.service_name}</h3>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(entry.created_at)}
                      </div>
                      {entry.changed_by_email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="w-4 h-4" />
                          {entry.changed_by_email}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="text-sm font-semibold text-blue-900 mb-2">Coût</div>
                      {renderCostChange(entry)}
                    </div>

                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="text-sm font-semibold text-green-900 mb-2">Statut</div>
                      {renderStatusChange(entry)}
                    </div>

                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <div className="text-sm font-semibold text-orange-900 mb-2">Promotion</div>
                      {renderPromotionChange(entry)}
                    </div>
                  </div>

                  {entry.change_reason && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-sm font-semibold text-gray-700 mb-1">Raison</div>
                      <div className="text-sm text-gray-600">{entry.change_reason}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t-2 border-gray-200 p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-bold rounded-lg transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
