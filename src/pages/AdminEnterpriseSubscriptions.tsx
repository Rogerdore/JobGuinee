import { useEffect, useState } from 'react';
import { Building, Check, X, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cvthequePricingService, EnterpriseSubscription } from '../services/cvthequePricingService';
import { useAuth } from '../contexts/AuthContext';

interface AdminEnterpriseSubscriptionsProps {
  onNavigate: (page: string) => void;
}

export default function AdminEnterpriseSubscriptions({ onNavigate }: AdminEnterpriseSubscriptionsProps) {
  const { profile } = useAuth();
  const [subscriptions, setSubscriptions] = useState<EnterpriseSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'rejected'>('all');

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('enterprise_subscriptions')
        .select(`
          *,
          company:companies!enterprise_subscriptions_company_id_fkey(name, location),
          profile:profiles!enterprise_subscriptions_profile_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (subscription: EnterpriseSubscription) => {
    if (!profile?.id) return;

    const notes = prompt('Notes d\'approbation (optionnel):');
    if (notes === null) return;

    try {
      await cvthequePricingService.approveSubscription(subscription.id, profile.id, notes);
      alert('✅ Abonnement approuvé avec succès');
      loadSubscriptions();
    } catch (error) {
      console.error('Error approving subscription:', error);
      alert('❌ Erreur lors de l\'approbation');
    }
  };

  const handleReject = async (subscription: EnterpriseSubscription) => {
    const reason = prompt('Raison du rejet:');
    if (!reason) {
      alert('⚠️ Veuillez fournir une raison pour le rejet');
      return;
    }

    try {
      await cvthequePricingService.rejectSubscription(subscription.id, reason);
      alert('✅ Abonnement rejeté');
      loadSubscriptions();
    } catch (error) {
      console.error('Error rejecting subscription:', error);
      alert('❌ Erreur lors du rejet');
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (filter === 'all') return true;
    return sub.status === filter;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      active: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      expired: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-gray-100 text-gray-700'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      basic: 'bg-blue-100 text-blue-700',
      silver: 'bg-slate-100 text-slate-700',
      gold: 'bg-yellow-100 text-yellow-700'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[type as keyof typeof styles] || 'bg-gray-100 text-gray-700'}`}>
        {type.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-blue-900"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <Building className="w-8 h-8" />
            <span>Abonnements Entreprises</span>
          </h1>
          <p className="text-gray-600 mt-2">Gérez les demandes d'abonnement (Basic, Silver, GOLD)</p>
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Tous ({subscriptions.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            En attente ({subscriptions.filter(s => s.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Actifs ({subscriptions.filter(s => s.status === 'active').length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Rejetés ({subscriptions.filter(s => s.status === 'rejected').length})
          </button>
        </div>

        <div className="space-y-4">
          {filteredSubscriptions.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center">
              <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucun abonnement trouvé</p>
            </div>
          ) : (
            filteredSubscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className={`bg-white rounded-xl shadow-sm border-2 p-6 ${
                  subscription.subscription_type === 'gold' && subscription.status === 'pending'
                    ? 'border-yellow-200 bg-yellow-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {(subscription as any).company?.name || 'Entreprise'}
                      </h3>
                      {getTypeBadge(subscription.subscription_type)}
                      {getStatusBadge(subscription.status)}
                      {subscription.requires_validation && subscription.status === 'pending' && (
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                          VALIDATION REQUISE
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Contact: {(subscription as any).profile?.full_name} ({(subscription as any).profile?.email})</div>
                      <div>Localisation: {(subscription as any).company?.location || 'Non spécifiée'}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600">Prix</div>
                    <div className="text-lg font-bold text-gray-900">
                      {(subscription.price_gnf / 1000000).toFixed(1)}M GNF
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Quota mensuel</div>
                    <div className="text-lg font-bold text-gray-900">
                      {subscription.monthly_cv_quota || 'Illimité'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">CV consommés</div>
                    <div className="text-lg font-bold text-gray-900">{subscription.cv_consumed}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Paiement</div>
                    <div className="text-sm font-medium text-gray-700">{subscription.payment_status}</div>
                  </div>
                </div>

                {subscription.start_date && subscription.end_date && (
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                    <div>
                      <span className="font-medium">Début:</span> {new Date(subscription.start_date).toLocaleDateString('fr-FR')}
                    </div>
                    <div>
                      <span className="font-medium">Fin:</span> {new Date(subscription.end_date).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                )}

                {subscription.approval_notes && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <div className="text-sm font-medium text-green-900 mb-1">Notes d'approbation:</div>
                    <div className="text-sm text-green-700">{subscription.approval_notes}</div>
                  </div>
                )}

                {subscription.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <div className="text-sm font-medium text-red-900 mb-1">Raison du rejet:</div>
                    <div className="text-sm text-red-700">{subscription.rejection_reason}</div>
                  </div>
                )}

                {subscription.payment_proof_url && (
                  <div className="mb-4">
                    <a
                      href={subscription.payment_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      📄 Voir la preuve de paiement
                    </a>
                  </div>
                )}

                {subscription.status === 'pending' && subscription.requires_validation && (
                  <div className="flex space-x-3 pt-4 border-t">
                    <button
                      onClick={() => handleApprove(subscription)}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approuver</span>
                    </button>
                    <button
                      onClick={() => handleReject(subscription)}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center space-x-2"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Rejeter</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}