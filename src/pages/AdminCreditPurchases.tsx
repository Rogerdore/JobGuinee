import { useState, useEffect } from 'react';
import {
  ShoppingCart, Check, X, Clock, AlertCircle, Filter, RefreshCw, Eye, ArrowLeft,
  TrendingUp, DollarSign, CreditCard, Users, CheckCircle, XCircle,
  Settings, Bell, Shield, History, Gift, Calculator, FileText, Download
} from 'lucide-react';
import { CreditStoreService, CreditPurchase, CreditStoreSettings } from '../services/creditStoreService';
import { useModalContext } from '../contexts/ModalContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type StatusFilter = 'all' | 'pending' | 'waiting_proof' | 'completed' | 'cancelled';

interface PageProps {
  onNavigate: (page: string) => void;
}

interface AuditStats {
  totalPurchases: number;
  pendingCount: number;
  waitingProofCount: number;
  completedCount: number;
  cancelledCount: number;
  totalRevenue: number;
  totalCreditsIssued: number;
}

interface ConversionRule {
  id: string;
  amount_fg: number;
  credits: number;
  bonus_percentage: number;
  is_active: boolean;
}

interface AdminLog {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  purchase_id: string;
  purchase_reference: string;
  details: string;
  created_at: string;
}

export default function AdminCreditPurchases({ onNavigate }: PageProps) {
  const { showSuccess, showError, showWarning, showConfirm } = useModalContext();
  const { user, profile, isAdmin } = useAuth();

  // États existants
  const [purchases, setPurchases] = useState<CreditPurchase[]>([]);
  const [settings, setSettings] = useState<CreditStoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('waiting_proof');
  const [selectedPurchase, setSelectedPurchase] = useState<CreditPurchase | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Nouveaux états pour les fonctionnalités avancées
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);
  const [activeTab, setActiveTab] = useState<'purchases' | 'logs'>('purchases');
  const [searchTerm, setSearchTerm] = useState('');
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [conversionRules, setConversionRules] = useState<ConversionRule[]>([]);
  const [validationNotes, setValidationNotes] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'validate' | 'cancel'; purchaseId: string } | null>(null);

  useEffect(() => {
    if (user && profile) {
      if (!isAdmin) {
        setAuthError('Vous devez être administrateur pour accéder à cette page');
      } else {
        setAuthError(null);
        loadData();
      }
    }
  }, [statusFilter, user, profile, isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [purchasesData, settingsData] = await Promise.all([
        CreditStoreService.getAllPurchases(statusFilter === 'all' ? undefined : statusFilter),
        CreditStoreService.getSettings()
      ]);

      setPurchases(purchasesData);
      setSettings(settingsData);

      // Charger les statistiques d'audit
      await loadAuditStats();

      // Charger les logs admin
      await loadAdminLogs();

      // Charger les règles de conversion
      await loadConversionRules();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditStats = async () => {
    try {
      const { data: allPurchases } = await supabase
        .from('credit_purchases')
        .select('*');

      if (allPurchases) {
        const stats: AuditStats = {
          totalPurchases: allPurchases.length,
          pendingCount: allPurchases.filter(p => p.payment_status === 'pending').length,
          waitingProofCount: allPurchases.filter(p => p.payment_status === 'waiting_proof').length,
          completedCount: allPurchases.filter(p => p.payment_status === 'completed').length,
          cancelledCount: allPurchases.filter(p => p.payment_status === 'cancelled').length,
          totalRevenue: allPurchases
            .filter(p => p.payment_status === 'completed')
            .reduce((sum, p) => sum + (p.price_amount || 0), 0),
          totalCreditsIssued: allPurchases
            .filter(p => p.payment_status === 'completed')
            .reduce((sum, p) => sum + (p.total_credits || 0), 0)
        };
        setAuditStats(stats);
      }
    } catch (error) {
      console.error('Error loading audit stats:', error);
    }
  };

  const loadAdminLogs = async () => {
    try {
      const { data } = await supabase
        .from('admin_action_logs')
        .select(`
          *,
          admin:profiles!admin_id(email)
        `)
        .eq('action_type', 'credit_purchase')
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        const logs: AdminLog[] = data.map(log => ({
          id: log.id,
          admin_id: log.admin_id,
          admin_email: log.admin?.email || 'Inconnu',
          action: log.action,
          purchase_id: log.reference_id,
          purchase_reference: log.details?.purchase_reference || '',
          details: log.details?.notes || '',
          created_at: log.created_at
        }));
        setAdminLogs(logs);
      }
    } catch (error) {
      console.error('Error loading admin logs:', error);
    }
  };

  const loadConversionRules = async () => {
    try {
      const { data } = await supabase
        .from('credit_conversion_rules')
        .select('*')
        .order('amount_fg', { ascending: true });

      if (data) {
        setConversionRules(data);
      }
    } catch (error) {
      console.error('Error loading conversion rules:', error);
    }
  };

  const handleValidate = async (purchaseId: string, notes?: string) => {
    setProcessing(purchaseId);
    try {
      console.log('[AdminCreditPurchases] Validating purchase:', purchaseId);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showError('Erreur', 'Session expirée. Veuillez vous reconnecter.');
        return;
      }

      const result = await CreditStoreService.completePurchase(purchaseId, notes);

      console.log('[AdminCreditPurchases] Result:', result);

      if (result.success) {
        showSuccess('Succès', `Paiement validé! ${result.data.credits_added} crédits ajoutés.`);

        // Logger l'action
        await logAdminAction('validate', purchaseId, notes);

        await loadData();
        setShowModal(false);
        setShowValidationModal(false);
        setSelectedPurchase(null);
        setValidationNotes('');
      } else {
        showError('Erreur', result.message || 'Erreur lors de la validation');
        console.error('[AdminCreditPurchases] Validation failed:', result);
      }
    } catch (error) {
      console.error('[AdminCreditPurchases] Error validating purchase:', error);
      showError('Erreur', 'Une erreur est survenue lors de la validation');
    } finally {
      setProcessing(null);
      setPendingAction(null);
    }
  };

  const handleCancel = async (purchaseId: string, reason?: string) => {
    setProcessing(purchaseId);
    try {
      const result = await CreditStoreService.cancelPurchase(purchaseId, reason);

      if (result.success) {
        showWarning('Information', 'Paiement annulé');

        // Logger l'action
        await logAdminAction('cancel', purchaseId, reason);

        await loadData();
        setShowModal(false);
        setShowCancellationModal(false);
        setSelectedPurchase(null);
        setCancellationReason('');
      } else {
        showError('Erreur', result.message || 'Erreur lors de l\'annulation');
      }
    } catch (error) {
      console.error('Error cancelling purchase:', error);
      showError('Erreur', 'Une erreur est survenue');
    } finally {
      setProcessing(null);
      setPendingAction(null);
    }
  };

  const logAdminAction = async (action: string, purchaseId: string, notes?: string) => {
    try {
      const purchase = purchases.find(p => p.id === purchaseId);
      await supabase.from('admin_action_logs').insert({
        admin_id: user?.id,
        action_type: 'credit_purchase',
        action: action,
        reference_id: purchaseId,
        details: {
          purchase_reference: purchase?.payment_reference,
          notes: notes || ''
        }
      });
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  };

  const openValidationModal = (purchase: CreditPurchase) => {
    setSelectedPurchase(purchase);
    setPendingAction({ type: 'validate', purchaseId: purchase.id });
    setShowValidationModal(true);
  };

  const openCancellationModal = (purchase: CreditPurchase) => {
    setSelectedPurchase(purchase);
    setPendingAction({ type: 'cancel', purchaseId: purchase.id });
    setShowCancellationModal(true);
  };

  const confirmValidation = () => {
    if (pendingAction && pendingAction.type === 'validate') {
      handleValidate(pendingAction.purchaseId, validationNotes);
    }
  };

  const confirmCancellation = () => {
    if (pendingAction && pendingAction.type === 'cancel') {
      if (!cancellationReason.trim()) {
        showWarning('Attention', 'Veuillez indiquer une raison pour l\'annulation');
        return;
      }
      handleCancel(pendingAction.purchaseId, cancellationReason);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const filteredPurchases = purchases.filter(purchase => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      purchase.payment_reference?.toLowerCase().includes(term) ||
      purchase.user_id?.toLowerCase().includes(term) ||
      purchase.payment_phone_number?.toLowerCase().includes(term)
    );
  });

  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-800 mb-2">Accès refusé</h2>
            <p className="text-red-600 mb-6">{authError}</p>
            <button
              onClick={() => onNavigate('home')}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 text-center">
            <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-yellow-800 mb-2">Authentification requise</h2>
            <p className="text-yellow-600 mb-6">Veuillez vous connecter pour accéder à cette page</p>
            <button
              onClick={() => onNavigate('auth')}
              className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition"
            >
              Se connecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <button
          onClick={() => onNavigate('home')}
          className="mb-8 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Retour à l'accueil
        </button>

        {/* ÉTAPE 1: AUDIT & ÉTAT GLOBAL - KPI Cards */}
        {auditStats && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <ShoppingCart className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{auditStats.totalPurchases}</span>
              </div>
              <div className="text-blue-100 font-medium">Total achats</div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{auditStats.waitingProofCount}</span>
              </div>
              <div className="text-yellow-100 font-medium">En attente validation</div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-8 h-8 opacity-80" />
                <div className="text-right">
                  <div className="text-3xl font-bold">{formatCurrency(auditStats.totalRevenue)} FG</div>
                  <div className="text-sm text-green-100">{auditStats.completedCount} validés</div>
                </div>
              </div>
              <div className="text-green-100 font-medium">Revenus encaissés</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <CreditCard className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">{formatCurrency(auditStats.totalCreditsIssued)}</span>
              </div>
              <div className="text-purple-100 font-medium">Crédits IA attribués</div>
            </div>
          </div>
        )}

        {/* Navigation par onglets */}
        <div className="bg-white rounded-t-2xl shadow-lg">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {[
              { id: 'purchases', label: 'Transactions', icon: ShoppingCart },
              { id: 'logs', label: 'Historique', icon: History }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ÉTAPE 3: LISTE DES TRANSACTIONS */}
          {activeTab === 'purchases' && (
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Rechercher par référence, utilisateur ou téléphone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition flex items-center gap-2 justify-center"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </button>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <Filter className="w-5 h-5 text-gray-600" />
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: 'all', label: 'Tous', count: auditStats?.totalPurchases },
                    { value: 'pending', label: 'En attente', count: auditStats?.pendingCount },
                    { value: 'waiting_proof', label: 'Preuve envoyée', count: auditStats?.waitingProofCount },
                    { value: 'completed', label: 'Validés', count: auditStats?.completedCount },
                    { value: 'cancelled', label: 'Annulés', count: auditStats?.cancelledCount }
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
                      {filter.label} {filter.count !== undefined && `(${filter.count})`}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                </div>
              ) : filteredPurchases.length === 0 ? (
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
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Utilisateur</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Téléphone</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Montant</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Crédits</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Bonus</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Statut</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPurchases.map((purchase) => (
                        <tr key={purchase.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {formatDate(purchase.created_at)}
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-mono font-bold text-gray-900">
                              {purchase.payment_reference}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-xs font-mono text-gray-500">
                              {purchase.user_id.substring(0, 8)}...
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700">
                            {purchase.payment_phone_number || 'N/A'}
                          </td>
                          <td className="px-4 py-4 text-sm font-bold text-gray-900">
                            {formatCurrency(purchase.price_amount)} FG
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-bold text-blue-600">
                              {purchase.credits_amount}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-bold text-green-600">
                              +{purchase.bonus_credits}
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
                                    onClick={() => openValidationModal(purchase)}
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
                                    onClick={() => openCancellationModal(purchase)}
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
          )}

          {/* ÉTAPE 10: LOGS & HISTORIQUE */}
          {activeTab === 'logs' && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <History className="w-6 h-6 text-orange-600" />
                Historique des actions admin
              </h2>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <strong>Traçabilité complète:</strong> Toutes les actions de validation et d'annulation
                    sont enregistrées et conservées de manière permanente.
                  </div>
                </div>
              </div>

              {adminLogs.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun historique disponible</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {adminLogs.map((log) => (
                    <div key={log.id} className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-orange-300 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              log.action === 'validate'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {log.action === 'validate' ? 'VALIDATION' : 'ANNULATION'}
                            </span>
                            <span className="text-sm text-gray-600">{formatDate(log.created_at)}</span>
                          </div>
                          <div className="text-sm font-mono text-gray-700">
                            Référence: {log.purchase_reference || log.purchase_id}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Admin: {log.admin_email}
                          </div>
                          {log.details && (
                            <div className="text-sm text-gray-700 mt-2 bg-gray-50 rounded p-2">
                              {log.details}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ÉTAPE 4: MODAL DÉTAIL D'UN ACHAT */}
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
                    <div className="text-sm text-blue-600 mb-1">Montant payé</div>
                    <div className="text-2xl font-bold text-blue-700">
                      {formatCurrency(selectedPurchase.price_amount)} FG
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                    <div className="text-sm text-green-600 mb-1">Crédits total</div>
                    <div className="text-2xl font-bold text-green-700">
                      {selectedPurchase.total_credits}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      ({selectedPurchase.credits_amount} + {selectedPurchase.bonus_credits} bonus)
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Téléphone de paiement</div>
                  <div className="font-bold text-gray-900">{selectedPurchase.payment_phone_number || 'Non renseigné'}</div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Utilisateur (ID)</div>
                  <div className="font-mono text-sm text-gray-900">{selectedPurchase.user_id}</div>
                </div>

                {selectedPurchase.admin_notes && (
                  <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                    <div className="text-sm text-blue-600 mb-1">Notes de validation</div>
                    <div className="text-sm text-blue-900">{selectedPurchase.admin_notes}</div>
                  </div>
                )}

                {selectedPurchase.failed_reason && (
                  <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                    <div className="text-sm text-red-600 mb-1">Raison d'annulation</div>
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
                    onClick={() => openValidationModal(selectedPurchase)}
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
                    onClick={() => openCancellationModal(selectedPurchase)}
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

      {/* ÉTAPE 5: MODAL DE VALIDATION AVEC CONFIRMATION */}
      {showValidationModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-full">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Confirmation de validation</h2>
                  <p className="text-green-100 text-sm mt-1">Action irréversible</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <strong>Attention:</strong> Cette action validera le paiement et ajoutera {selectedPurchase.total_credits} crédits
                    IA au compte de l'utilisateur. Cette action ne peut pas être annulée.
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Référence:</span>
                  <span className="font-mono font-bold">{selectedPurchase.payment_reference}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Montant:</span>
                  <span className="font-bold">{formatCurrency(selectedPurchase.price_amount)} FG</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Crédits à ajouter:</span>
                  <span className="font-bold text-green-600">{selectedPurchase.total_credits} crédits</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes de validation (optionnel)
                </label>
                <textarea
                  value={validationNotes}
                  onChange={(e) => setValidationNotes(e.target.value)}
                  placeholder="Ajouter une note pour cette validation..."
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowValidationModal(false);
                    setPendingAction(null);
                    setValidationNotes('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmValidation}
                  disabled={processing !== null}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Confirmer la validation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL D'ANNULATION AVEC RAISON OBLIGATOIRE */}
      {showCancellationModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-full">
                  <X className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Confirmation d'annulation</h2>
                  <p className="text-red-100 text-sm mt-1">Raison obligatoire</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <strong>Attention:</strong> Cette action annulera le paiement. L'utilisateur sera notifié
                    avec la raison que vous indiquez ci-dessous.
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Référence:</span>
                  <span className="font-mono font-bold">{selectedPurchase.payment_reference}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Montant:</span>
                  <span className="font-bold">{formatCurrency(selectedPurchase.price_amount)} FG</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison de l'annulation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Expliquez pourquoi ce paiement est annulé..."
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none"
                  rows={3}
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancellationModal(false);
                    setPendingAction(null);
                    setCancellationReason('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmCancellation}
                  disabled={processing !== null || !cancellationReason.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <X className="w-5 h-5" />
                      Confirmer l'annulation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
