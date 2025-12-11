import { useState, useEffect } from 'react';
import { Crown, Check, X, Calendar, FileText, Filter, Eye, Edit2, Ban } from 'lucide-react';
import { PremiumSubscriptionService, PremiumSubscription } from '../services/premiumSubscriptionService';
import { supabase } from '../lib/supabase';

interface SubscriptionWithUser extends PremiumSubscription {
  user_email?: string;
  user_name?: string;
}

interface DetailsModalProps {
  subscription: SubscriptionWithUser | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

function DetailsModal({ subscription, isOpen, onClose, onUpdate }: DetailsModalProps) {
  const [activating, setActivating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (subscription) {
      setAdminNotes(subscription.admin_notes || '');
      setDurationDays(30);
      setCancelReason('');
    }
  }, [subscription]);

  if (!isOpen || !subscription) return null;

  const handleActivate = async () => {
    if (!confirm(`Activer cet abonnement pour ${durationDays} jours ?`)) {
      return;
    }

    setActivating(true);
    try {
      const result = await PremiumSubscriptionService.activateSubscription(
        subscription.id,
        durationDays
      );

      if (result.success) {
        alert(result.message);
        onUpdate();
        onClose();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error activating subscription:', error);
      alert('Erreur lors de l\'activation');
    } finally {
      setActivating(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      alert('Veuillez indiquer une raison pour l\'annulation');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir annuler cet abonnement ?')) {
      return;
    }

    setCancelling(true);
    try {
      const result = await PremiumSubscriptionService.cancelSubscription(
        subscription.id,
        cancelReason
      );

      if (result.success) {
        alert(result.message);
        onUpdate();
        onClose();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Erreur lors de l\'annulation');
    } finally {
      setCancelling(false);
    }
  };

  const handleSaveNotes = async () => {
    const success = await PremiumSubscriptionService.updateAdminNotes(
      subscription.id,
      adminNotes
    );

    if (success) {
      alert('Notes sauvegardées');
      onUpdate();
    } else {
      alert('Erreur lors de la sauvegarde');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      waiting_proof: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      expired: 'bg-orange-100 text-orange-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <h2 className="text-2xl font-bold text-white">Détails de l'abonnement</h2>
          <p className="text-blue-100 mt-1">{subscription.payment_reference}</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Utilisateur</div>
              <div className="font-bold text-gray-900">{subscription.user_email || 'N/A'}</div>
              <div className="text-sm text-gray-600">{subscription.user_name || ''}</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Plan</div>
              <div className="font-bold text-gray-900">{subscription.plan_name}</div>
              <div className="text-sm text-gray-600">
                {PremiumSubscriptionService.formatPrice(subscription.price_amount, subscription.currency)}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Statut paiement</div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(subscription.payment_status)}`}>
                {subscription.payment_status}
              </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Statut abonnement</div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(subscription.subscription_status)}`}>
                {subscription.subscription_status}
              </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Méthode de paiement</div>
              <div className="font-bold text-gray-900">{subscription.payment_method}</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Date de création</div>
              <div className="font-bold text-gray-900">
                {PremiumSubscriptionService.formatDateTime(subscription.created_at)}
              </div>
            </div>

            {subscription.started_at && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Date de début</div>
                <div className="font-bold text-gray-900">
                  {PremiumSubscriptionService.formatDateTime(subscription.started_at)}
                </div>
              </div>
            )}

            {subscription.expires_at && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Date d'expiration</div>
                <div className="font-bold text-gray-900">
                  {PremiumSubscriptionService.formatDateTime(subscription.expires_at)}
                </div>
                {subscription.subscription_status === 'active' && (
                  <div className="text-sm text-blue-600 mt-1">
                    Dans {PremiumSubscriptionService.getRemainingDays(subscription.expires_at)} jours
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes administrateur
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              rows={4}
              placeholder="Ajouter des notes..."
            />
            <button
              onClick={handleSaveNotes}
              className="mt-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition"
            >
              Sauvegarder les notes
            </button>
          </div>

          {subscription.subscription_status === 'pending' && subscription.payment_status === 'waiting_proof' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                <h4 className="font-bold text-blue-900 mb-2">Actions administrateur</h4>
                <p className="text-sm text-blue-800 mb-4">
                  L'utilisateur a confirmé le paiement. Vérifiez la preuve et activez l'abonnement.
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Durée de l'abonnement (jours)
                  </label>
                  <input
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    min="1"
                    max="365"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleActivate}
                    disabled={activating}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {activating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Activation...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Activer l'abonnement
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {(subscription.subscription_status === 'active' || subscription.subscription_status === 'pending') && (
            <div className="mt-4">
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <h4 className="font-bold text-red-900 mb-2">Annuler l'abonnement</h4>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Raison de l'annulation..."
                  className="w-full px-4 py-2 mb-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none"
                />
                <button
                  onClick={handleCancel}
                  disabled={cancelling || !cancelReason.trim()}
                  className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cancelling ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Annulation...
                    </>
                  ) : (
                    <>
                      <Ban className="w-5 h-5" />
                      Annuler l'abonnement
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPremiumSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionWithUser | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('');
  const [filterSubscriptionStatus, setFilterSubscriptionStatus] = useState<string>('');

  useEffect(() => {
    loadSubscriptions();
  }, [filterPaymentStatus, filterSubscriptionStatus]);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (filterPaymentStatus) filters.payment_status = filterPaymentStatus;
      if (filterSubscriptionStatus) filters.subscription_status = filterSubscriptionStatus;

      const subs = await PremiumSubscriptionService.getAllSubscriptions(filters);

      const subsWithUsers = await Promise.all(
        subs.map(async (sub) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', sub.user_id)
            .single();

          return {
            ...sub,
            user_email: profile?.email,
            user_name: profile?.full_name
          };
        })
      );

      setSubscriptions(subsWithUsers);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (subscription: SubscriptionWithUser) => {
    setSelectedSubscription(subscription);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      waiting_proof: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      expired: 'bg-orange-100 text-orange-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des abonnements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Abonnements Premium</h1>
                <p className="text-blue-100">Gérer les abonnements Premium PRO+</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Filter className="w-4 h-4 inline mr-2" />
                  Statut paiement
                </label>
                <select
                  value={filterPaymentStatus}
                  onChange={(e) => setFilterPaymentStatus(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Tous</option>
                  <option value="pending">En attente</option>
                  <option value="waiting_proof">Preuve en attente</option>
                  <option value="completed">Complété</option>
                  <option value="failed">Échoué</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Filter className="w-4 h-4 inline mr-2" />
                  Statut abonnement
                </label>
                <select
                  value={filterSubscriptionStatus}
                  onChange={(e) => setFilterSubscriptionStatus(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Tous</option>
                  <option value="pending">En attente</option>
                  <option value="active">Actif</option>
                  <option value="expired">Expiré</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>
            </div>

            {subscriptions.length === 0 ? (
              <div className="text-center py-12">
                <Crown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucun abonnement trouvé</p>
              </div>
            ) : (
              <div className="space-y-4">
                {subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">{sub.user_email || 'Utilisateur inconnu'}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(sub.payment_status)}`}>
                            {sub.payment_status}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(sub.subscription_status)}`}>
                            {sub.subscription_status}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{sub.plan_name} • {sub.payment_reference}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>
                            <Calendar className="w-4 h-4 inline mr-1" />
                            {PremiumSubscriptionService.formatDateTime(sub.created_at)}
                          </span>
                          {sub.expires_at && sub.subscription_status === 'active' && (
                            <span className="text-blue-600">
                              Expire dans {PremiumSubscriptionService.getRemainingDays(sub.expires_at)} jours
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleViewDetails(sub)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition flex items-center gap-2"
                      >
                        <Eye className="w-5 h-5" />
                        Voir détails
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <DetailsModal
        subscription={selectedSubscription}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onUpdate={loadSubscriptions}
      />
    </div>
  );
}
