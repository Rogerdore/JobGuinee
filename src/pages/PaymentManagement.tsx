import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Eye, CreditCard, Briefcase, Star, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/AdminLayout';

interface CreditPurchase {
  id: string;
  user_id: string;
  user_email: string;
  amount: number;
  currency: string;
  credits: string;
  payment_method: string;
  payment_reference: string;
  created_at: string;
  description: string;
}

interface JobPublication {
  id: string;
  job_id: string;
  job_title: string;
  company_id: string;
  company_name: string;
  amount: number;
  currency: string;
  payment_method: string;
  created_at: string;
}

interface JobPremiumPurchase {
  id: string;
  job_id: string;
  job_title: string;
  company_name: string;
  feature_type: string;
  amount: number;
  currency: string;
  duration_days: number;
  payment_method: string;
  created_at: string;
}

interface PendingPayments {
  credit_purchases: CreditPurchase[];
  job_publications: JobPublication[];
  job_premium_purchases: JobPremiumPurchase[];
}

export default function PaymentManagement() {
  const { user, profile } = useAuth();
  const [payments, setPayments] = useState<PendingPayments>({
    credit_purchases: [],
    job_publications: [],
    job_premium_purchases: []
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'approve' | 'reject'>('approve');
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'credits' | 'publications' | 'premium'>('credits');

  useEffect(() => {
    if (user && profile?.user_type === 'admin') {
      loadPendingPayments();
    }
  }, [user, profile]);

  const loadPendingPayments = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_pending_payments', {
        p_admin_id: user.id
      });

      if (error) throw error;

      if (data?.success) {
        setPayments({
          credit_purchases: data.credit_purchases || [],
          job_publications: data.job_publications || [],
          job_premium_purchases: data.job_premium_purchases || []
        });
      }
    } catch (error: any) {
      console.error('Erreur chargement paiements:', error);
      alert('Erreur lors du chargement des paiements en attente');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (payment: any, type: string) => {
    if (!user) return;

    setProcessing(payment.id);
    try {
      let result;

      switch (type) {
        case 'credit_purchase':
          result = await supabase.rpc('approve_credit_purchase', {
            p_transaction_id: payment.id,
            p_admin_id: user.id,
            p_notes: notes || null
          });
          break;

        case 'job_publication':
          result = await supabase.rpc('approve_job_publication_payment', {
            p_payment_id: payment.id,
            p_admin_id: user.id,
            p_notes: notes || null
          });
          break;

        case 'job_premium':
          result = await supabase.rpc('approve_job_premium_purchase', {
            p_purchase_id: payment.id,
            p_admin_id: user.id,
            p_notes: notes || null
          });
          break;
      }

      const { data, error } = result as any;

      if (error) throw error;

      if (data?.success) {
        alert('✅ ' + data.message);
        setShowModal(false);
        setNotes('');
        await loadPendingPayments();
      } else {
        alert('❌ ' + (data?.message || 'Erreur lors de l\'approbation'));
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      alert('Erreur: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (payment: any, type: string) => {
    if (!user || !notes.trim()) {
      alert('Veuillez indiquer la raison du rejet');
      return;
    }

    setProcessing(payment.id);
    try {
      const { data, error } = await supabase.rpc('reject_payment', {
        p_payment_id: payment.id,
        p_payment_type: type,
        p_admin_id: user.id,
        p_reason: notes
      });

      if (error) throw error;

      if (data?.success) {
        alert('✅ Paiement rejeté');
        setShowModal(false);
        setNotes('');
        await loadPendingPayments();
      } else {
        alert('❌ ' + (data?.message || 'Erreur lors du rejet'));
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      alert('Erreur: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const openModal = (payment: any, type: 'approve' | 'reject') => {
    setSelectedPayment(payment);
    setModalType(type);
    setShowModal(true);
    setNotes('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFeatureType = (type: string) => {
    const types: Record<string, string> = {
      premium_listing: 'Annonce Premium',
      featured: 'Annonce En Vedette',
      urgent: 'Annonce Urgente'
    };
    return types[type] || type;
  };

  if (profile?.user_type !== 'admin') {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600">Accès réservé aux administrateurs</p>
        </div>
      </AdminLayout>
    );
  }

  const totalPending =
    payments.credit_purchases.length +
    payments.job_publications.length +
    payments.job_premium_purchases.length;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Paiements</h1>
            <p className="text-gray-600 mt-2">
              {totalPending} paiement{totalPending > 1 ? 's' : ''} en attente de validation
            </p>
          </div>
          <button
            onClick={loadPendingPayments}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#0E2F56] text-white rounded-lg hover:bg-[#1a4575] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('credits')}
            className={`pb-3 px-4 font-medium transition-colors relative ${
              activeTab === 'credits'
                ? 'text-[#0E2F56] border-b-2 border-[#0E2F56]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Achats de Crédits
              {payments.credit_purchases.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {payments.credit_purchases.length}
                </span>
              )}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('publications')}
            className={`pb-3 px-4 font-medium transition-colors relative ${
              activeTab === 'publications'
                ? 'text-[#0E2F56] border-b-2 border-[#0E2F56]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Publications d'Offres
              {payments.job_publications.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {payments.job_publications.length}
                </span>
              )}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('premium')}
            className={`pb-3 px-4 font-medium transition-colors relative ${
              activeTab === 'premium'
                ? 'text-[#0E2F56] border-b-2 border-[#0E2F56]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Options Premium
              {payments.job_premium_purchases.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {payments.job_premium_purchases.length}
                </span>
              )}
            </span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#0E2F56]" />
          </div>
        ) : (
          <>
            {/* Credit Purchases */}
            {activeTab === 'credits' && (
              <div className="space-y-4">
                {payments.credit_purchases.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Aucun achat de crédits en attente</p>
                  </div>
                ) : (
                  payments.credit_purchases.map((purchase) => (
                    <div key={purchase.id} className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CreditCard className="w-5 h-5 text-[#0E2F56]" />
                            <h3 className="font-semibold text-lg">Achat de {purchase.credits} crédits</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Utilisateur:</span>
                              <span className="ml-2 font-medium">{purchase.user_email}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Montant:</span>
                              <span className="ml-2 font-medium">{purchase.amount} {purchase.currency}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Méthode:</span>
                              <span className="ml-2 font-medium">{purchase.payment_method || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Référence:</span>
                              <span className="ml-2 font-medium">{purchase.payment_reference || 'N/A'}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-500">Date:</span>
                              <span className="ml-2">{formatDate(purchase.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => openModal({ ...purchase, type: 'credit_purchase' }, 'approve')}
                            disabled={processing === purchase.id}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {processing === purchase.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                            Approuver
                          </button>
                          <button
                            onClick={() => openModal({ ...purchase, type: 'credit_purchase' }, 'reject')}
                            disabled={processing === purchase.id}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            Rejeter
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Job Publications */}
            {activeTab === 'publications' && (
              <div className="space-y-4">
                {payments.job_publications.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Aucune publication d'offre en attente</p>
                  </div>
                ) : (
                  payments.job_publications.map((publication) => (
                    <div key={publication.id} className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Briefcase className="w-5 h-5 text-[#0E2F56]" />
                            <h3 className="font-semibold text-lg">{publication.job_title}</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Entreprise:</span>
                              <span className="ml-2 font-medium">{publication.company_name}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Montant:</span>
                              <span className="ml-2 font-medium">{publication.amount} {publication.currency}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Méthode:</span>
                              <span className="ml-2 font-medium">{publication.payment_method || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Date:</span>
                              <span className="ml-2">{formatDate(publication.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => openModal({ ...publication, type: 'job_publication' }, 'approve')}
                            disabled={processing === publication.id}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {processing === publication.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                            Approuver
                          </button>
                          <button
                            onClick={() => openModal({ ...publication, type: 'job_publication' }, 'reject')}
                            disabled={processing === publication.id}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            Rejeter
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Job Premium Purchases */}
            {activeTab === 'premium' && (
              <div className="space-y-4">
                {payments.job_premium_purchases.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Aucun achat d'option premium en attente</p>
                  </div>
                ) : (
                  payments.job_premium_purchases.map((purchase) => (
                    <div key={purchase.id} className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Star className="w-5 h-5 text-[#0E2F56]" />
                            <h3 className="font-semibold text-lg">{purchase.job_title}</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Entreprise:</span>
                              <span className="ml-2 font-medium">{purchase.company_name}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Option:</span>
                              <span className="ml-2 font-medium">{formatFeatureType(purchase.feature_type)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Montant:</span>
                              <span className="ml-2 font-medium">{purchase.amount} {purchase.currency}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Durée:</span>
                              <span className="ml-2 font-medium">{purchase.duration_days} jours</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Méthode:</span>
                              <span className="ml-2 font-medium">{purchase.payment_method || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Date:</span>
                              <span className="ml-2">{formatDate(purchase.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => openModal({ ...purchase, type: 'job_premium' }, 'approve')}
                            disabled={processing === purchase.id}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {processing === purchase.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                            Approuver
                          </button>
                          <button
                            onClick={() => openModal({ ...purchase, type: 'job_premium' }, 'reject')}
                            disabled={processing === purchase.id}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            Rejeter
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              {modalType === 'approve' ? 'Approuver le paiement' : 'Rejeter le paiement'}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {modalType === 'approve' ? 'Notes (optionnel)' : 'Raison du rejet *'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent"
                rows={4}
                placeholder={modalType === 'approve'
                  ? 'Ajoutez des notes pour ce paiement...'
                  : 'Indiquez la raison du rejet...'
                }
                required={modalType === 'reject'}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (modalType === 'approve') {
                    handleApprove(selectedPayment, selectedPayment.type);
                  } else {
                    handleReject(selectedPayment, selectedPayment.type);
                  }
                }}
                disabled={processing === selectedPayment.id}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                  modalType === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processing === selectedPayment.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Traitement...
                  </span>
                ) : (
                  modalType === 'approve' ? 'Approuver' : 'Rejeter'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
