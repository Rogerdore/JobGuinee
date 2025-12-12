import { useState, useEffect } from 'react';
import { History, X, Calendar, ShoppingCart, CheckCircle, XCircle } from 'lucide-react';
import { cartHistoryService, CartHistoryItem } from '../../services/cartHistoryService';

interface CartHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  recruiterId: string;
  onAddToCart?: (candidateId: string) => void;
}

export default function CartHistoryModal({
  isOpen,
  onClose,
  recruiterId,
  onAddToCart
}: CartHistoryModalProps) {
  const [history, setHistory] = useState<CartHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'removed' | 'purchased'>('all');

  useEffect(() => {
    if (isOpen && recruiterId) {
      loadHistory();
    }
  }, [isOpen, recruiterId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await cartHistoryService.getCartHistory(recruiterId, 100);
      setHistory(data);
    } catch (error) {
      console.error('Error loading cart history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item => {
    if (filter === 'removed') return item.removed_from_cart_at && !item.converted_to_purchase;
    if (filter === 'purchased') return item.converted_to_purchase;
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-GN').format(amount);
  };

  const getExperienceLabel = (level: string) => {
    const labels: Record<string, { label: string; color: string; bg: string }> = {
      junior: { label: 'Junior', color: 'text-orange-700', bg: 'bg-orange-100' },
      intermediate: { label: 'Intermédiaire', color: 'text-green-700', bg: 'bg-green-100' },
      senior: { label: 'Senior', color: 'text-blue-700', bg: 'bg-blue-100' }
    };
    return labels[level] || { label: 'Non défini', color: 'text-gray-700', bg: 'bg-gray-100' };
  };

  const getStatusBadge = (item: CartHistoryItem) => {
    if (item.converted_to_purchase) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" />
          Acheté
        </span>
      );
    }
    if (item.removed_from_cart_at) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3" />
          Retiré
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <ShoppingCart className="w-3 h-3" />
        Dans le panier
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>

      <div className="fixed inset-0 md:inset-y-4 md:inset-x-auto md:right-4 md:w-[600px] bg-white shadow-2xl z-50 flex flex-col md:rounded-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white p-6 md:rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <History className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">Historique du Panier</h2>
                <p className="text-sm text-gray-200">{filteredHistory.length} élément(s)</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Filtres */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'all'
                  ? 'bg-white text-gray-800'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Tous ({history.length})
            </button>
            <button
              onClick={() => setFilter('removed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'removed'
                  ? 'bg-white text-gray-800'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Retirés ({history.filter(i => i.removed_from_cart_at && !i.converted_to_purchase).length})
            </button>
            <button
              onClick={() => setFilter('purchased')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'purchased'
                  ? 'bg-white text-gray-800'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Achetés ({history.filter(i => i.converted_to_purchase).length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
              <p className="text-gray-600 mt-4">Chargement...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Aucun historique</p>
              <p className="text-sm text-gray-400">
                Votre historique de sélection apparaîtra ici
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => {
                const expInfo = getExperienceLabel(item.experience_level);
                const profile = item.profile_snapshot;

                return (
                  <div
                    key={item.id}
                    className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-2">
                          {profile.title || profile.desired_position || 'Profil Candidat'}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${expInfo.color} ${expInfo.bg}`}>
                            {expInfo.label}
                          </span>
                          {getStatusBadge(item)}
                        </div>

                        {profile.location && (
                          <div className="text-xs text-gray-600 mb-1">
                            📍 {profile.location}
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Ajouté: {formatDate(item.added_to_cart_at)}
                          </span>
                        </div>

                        {item.removed_from_cart_at && (
                          <div className="text-xs text-red-600 mt-1">
                            Retiré: {formatDate(item.removed_from_cart_at)}
                          </div>
                        )}
                      </div>

                      <div className="text-right ml-3">
                        <div className="text-lg font-bold text-gray-900">
                          {formatPrice(item.price_at_selection)} GNF
                        </div>
                        {!item.removed_from_cart_at && !item.converted_to_purchase && onAddToCart && (
                          <button
                            onClick={() => onAddToCart(item.candidate_id)}
                            className="mt-2 text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                          >
                            Dans le panier
                          </button>
                        )}
                        {item.removed_from_cart_at && !item.converted_to_purchase && onAddToCart && (
                          <button
                            onClick={() => onAddToCart(item.candidate_id)}
                            className="mt-2 text-xs px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                          >
                            Ré-ajouter
                          </button>
                        )}
                      </div>
                    </div>

                    {item.notes && (
                      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-2">
                        💬 {item.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 md:rounded-b-2xl">
          <p className="text-xs text-center text-gray-600">
            L'historique des 100 dernières sélections est conservé
          </p>
        </div>
      </div>
    </>
  );
}
