import { useState, useEffect } from 'react';
import { ShoppingCart, Check, X, Clock, AlertCircle, Filter, RefreshCw, Eye } from 'lucide-react';
import { CreditStoreService, CreditPurchase, CreditStoreSettings } from '../services/creditStoreService';

type StatusFilter = 'all' | 'pending' | 'waiting_proof' | 'completed' | 'cancelled';

export default function AdminCreditPurchases() {
  const [purchases, setPurchases] = useState<CreditPurchase[]>([]);
  const [settings, setSettings] = useState<CreditStoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('waiting_proof');
  const [selectedPurchase, setSelectedPurchase] = useState<CreditPurchase | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [purchasesData, settingsData] = await Promise.all([
        CreditStoreService.getAllPurchases(statusFilter === 'all' ? undefined : statusFilter),
        CreditStoreService.getSettings()
      ]);

      setPurchases(purchasesData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (purchaseId: string, notes?: string) => {
    setProcessing(purchaseId);
    try {
      const result = await CreditStoreService.completePurchase(purchaseId, notes);

      if (result.success) {
        alert(`Paiement validé! ${result.data.credits_added} crédits ajoutés.`);
        await loadData();
        setShowModal(false);
        setSelectedPurchase(null);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error validating purchase:', error);
      alert('Une erreur est survenue');
    } finally {
      setProcessing(null);
    }
  };

  const handleCancel = async (purchaseId: string, reason?: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce paiement?')) return;

    setProcessing(purchaseId);
    try {
      const result = await CreditStoreService.cancelPurchase(purchaseId, reason);

      if (result.success) {
        alert('Paiement annulé');
        await loadData();
        setShowModal(false);
        setSelectedPurchase(null);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error cancelling purchase:', error);
      alert('Une erreur est survenue');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'En attente' },
      waiting_proof: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Preuve envoyée' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Validé' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Annulé' },
      failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Échec' }
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl">
                  <ShoppingCart className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Validation des Paiements</h1>
                  <p className="text-orange-100">Gérer les achats de crédits Orange Money</p>
                </div>
              </div>

              <button
                onClick={loadData}
                disabled={loading}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition flex items-center gap-2"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Filter className="w-5 h-5 text-gray-600" />
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'all', label: 'Tous' },
                  { value: 'pending', label: 'En attente' },
                  { value: 'waiting_proof', label: 'Preuve envoyée' },
                  { value: 'completed', label: 'Validés' },
                  { value: 'cancelled', label: 'Annulés' }
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setStatusFilter(filter.value as StatusFilter)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      statusFilter === filter.value
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
              </div>
            ) : purchases.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucun paiement à afficher</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Date</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Référence</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Montant</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Crédits</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Statut</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((purchase) => (
                      <tr key={purchase.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {formatDate(purchase.created_at)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-mono font-bold text-gray-900">
                            {purchase.payment_reference}
                          </div>
                          <div className="text-xs text-gray-500">
                            {purchase.user_id.substring(0, 8)}...
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-bold text-gray-900">
                          {CreditStoreService.formatPrice(purchase.price_amount, purchase.currency)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-bold text-blue-600">
                            {CreditStoreService.formatCredits(purchase.total_credits)}
                          </div>
                          <div className="text-xs text-gray-500">
                            ({purchase.credits_amount} + {purchase.bonus_credits} bonus)
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {getStatusBadge(purchase.payment_status)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedPurchase(purchase);
                                setShowModal(true);
                              }}
                              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition"
                              title="Voir détails"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {(purchase.payment_status === 'pending' || purchase.payment_status === 'waiting_proof') && (
                              <>
                                <button
                                  onClick={() => handleValidate(purchase.id)}
                                  disabled={processing === purchase.id}
                                  className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition disabled:opacity-50"
                                  title="Valider"
                                >
                                  {processing === purchase.id ? (
                                    <div className="w-4 h-4 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <Check className="w-4 h-4" />
                                  )}
                                </button>

                                <button
                                  onClick={() => handleCancel(purchase.id)}
                                  disabled={processing === purchase.id}
                                  className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition disabled:opacity-50"
                                  title="Annuler"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {settings && (
          <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Configuration actuelle</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Numéro Orange Money</div>
                <div className="text-lg font-bold text-gray-900">{settings.admin_phone_number}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">WhatsApp</div>
                <div className="text-lg font-bold text-gray-900">{settings.admin_whatsapp_number}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 relative">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedPurchase(null);
                }}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold">Détails du paiement</h2>
              <p className="text-blue-100 mt-1">{selectedPurchase.payment_reference}</p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Date de création</div>
                    <div className="font-bold text-gray-900">{formatDate(selectedPurchase.created_at)}</div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Statut</div>
                    <div>{getStatusBadge(selectedPurchase.payment_status)}</div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                    <div className="text-sm text-blue-600 mb-1">Montant</div>
                    <div className="text-2xl font-bold text-blue-700">
                      {CreditStoreService.formatPrice(selectedPurchase.price_amount, selectedPurchase.currency)}
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                    <div className="text-sm text-green-600 mb-1">Crédits total</div>
                    <div className="text-2xl font-bold text-green-700">
                      {CreditStoreService.formatCredits(selectedPurchase.total_credits)}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Utilisateur</div>
                  <div className="font-mono text-sm text-gray-900">{selectedPurchase.user_id}</div>
                </div>

                {selectedPurchase.admin_notes && (
                  <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                    <div className="text-sm text-blue-600 mb-1">Notes admin</div>
                    <div className="text-sm text-blue-900">{selectedPurchase.admin_notes}</div>
                  </div>
                )}

                {selectedPurchase.failed_reason && (
                  <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                    <div className="text-sm text-red-600 mb-1">Raison annulation</div>
                    <div className="text-sm text-red-900">{selectedPurchase.failed_reason}</div>
                  </div>
                )}

                {selectedPurchase.completed_at && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-green-600 mb-1">Date de validation</div>
                    <div className="font-bold text-green-900">{formatDate(selectedPurchase.completed_at)}</div>
                  </div>
                )}
              </div>

              {(selectedPurchase.payment_status === 'pending' || selectedPurchase.payment_status === 'waiting_proof') && (
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => handleValidate(selectedPurchase.id)}
                    disabled={processing === selectedPurchase.id}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processing === selectedPurchase.id ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Valider le paiement
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleCancel(selectedPurchase.id)}
                    disabled={processing === selectedPurchase.id}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Annuler
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
