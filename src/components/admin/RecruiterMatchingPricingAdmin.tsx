import { useState, useEffect } from 'react';
import {
  Target,
  DollarSign,
  Users,
  Package,
  Crown,
  Save,
  Power,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import {
  RecruiterMatchingPricingService,
  MatchingPricingOption,
  RecruiterAISubscription
} from '../../services/recruiterMatchingPricingService';

export default function RecruiterMatchingPricingAdmin() {
  const [activeTab, setActiveTab] = useState<'pricing' | 'subscriptions'>('pricing');
  const [loading, setLoading] = useState(false);

  // Pricing
  const [pricingOptions, setPricingOptions] = useState<MatchingPricingOption[]>([]);
  const [editingPricing, setEditingPricing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<MatchingPricingOption>>({});

  // Subscriptions
  const [pendingSubscriptions, setPendingSubscriptions] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'pricing') {
        await loadPricing();
      } else {
        await loadPendingSubscriptions();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPricing = async () => {
    const data = await RecruiterMatchingPricingService.getActivePricing();
    setPricingOptions(data);
  };

  const loadPendingSubscriptions = async () => {
    // Charger les abonnements en attente de validation
    const { data, error } = await (await import('../../lib/supabase')).supabase
      .from('recruiter_ai_subscriptions')
      .select(`
        *,
        recruiter:profiles!recruiter_ai_subscriptions_recruiter_id_fkey(
          full_name,
          email
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPendingSubscriptions(data);
    }
  };

  const startEdit = (pricing: MatchingPricingOption) => {
    setEditingPricing(pricing.id);
    setEditForm(pricing);
  };

  const cancelEdit = () => {
    setEditingPricing(null);
    setEditForm({});
  };

  const savePricing = async () => {
    if (!editingPricing || !editForm.credits_cost) return;

    const result = await RecruiterMatchingPricingService.updatePricing(editingPricing, {
      credits_cost: editForm.credits_cost,
      description: editForm.description,
      is_active: editForm.is_active
    });

    if (result.success) {
      alert('Tarif mis à jour avec succès');
      cancelEdit();
      loadPricing();
    } else {
      alert(`Erreur: ${result.error}`);
    }
  };

  const handleValidateSubscription = async (subscriptionId: string, approved: boolean) => {
    const result = await RecruiterMatchingPricingService.validateGoldSubscription(
      subscriptionId,
      approved
    );

    if (result.success) {
      alert(approved ? 'Abonnement approuvé' : 'Abonnement refusé');
      loadPendingSubscriptions();
    } else {
      alert(`Erreur: ${result.error}`);
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'per_candidate':
        return <Users className="w-5 h-5" />;
      case 'batch':
        return <Package className="w-5 h-5" />;
      case 'subscription':
        return <Crown className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'per_candidate':
        return 'bg-blue-100 text-blue-900';
      case 'batch':
        return 'bg-green-100 text-green-900';
      case 'subscription':
        return 'bg-purple-100 text-purple-900';
      default:
        return 'bg-gray-100 text-gray-900';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Target className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Configuration Matching IA Recruteur</h1>
        </div>
        <p className="text-blue-100">
          Gérez les tarifs et abonnements du service de matching intelligent
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'pricing'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Tarifs
          </div>
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'subscriptions'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Abonnements en attente
            {pendingSubscriptions.length > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {pendingSubscriptions.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : (
        <>
          {/* Pricing Tab */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              {/* Per Candidate */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Mode A: Par Candidat</h3>
                    <p className="text-sm text-gray-600">Tarification individuelle avec dégressivité</p>
                  </div>
                </div>

                {pricingOptions
                  .filter((p) => p.mode === 'per_candidate')
                  .map((pricing) => (
                    <div
                      key={pricing.id}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      {editingPricing === pricing.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Coût en crédits
                            </label>
                            <input
                              type="number"
                              value={editForm.credits_cost || 0}
                              onChange={(e) =>
                                setEditForm({ ...editForm, credits_cost: parseInt(e.target.value) })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Équivalent GNF: {((editForm.credits_cost || 0) * 1000).toLocaleString()} GNF
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <textarea
                              value={editForm.description || ''}
                              onChange={(e) =>
                                setEditForm({ ...editForm, description: e.target.value })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              rows={2}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editForm.is_active ?? true}
                              onChange={(e) =>
                                setEditForm({ ...editForm, is_active: e.target.checked })
                              }
                              className="rounded"
                            />
                            <label className="text-sm text-gray-700">Actif</label>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={savePricing}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                              <Save className="w-4 h-4" />
                              Enregistrer
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{pricing.name}</h4>
                            <p className="text-sm text-gray-600">{pricing.description}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-lg font-bold text-blue-600">
                                {pricing.credits_cost} crédits
                              </span>
                              <span className="text-sm text-gray-500">
                                = {pricing.gnf_cost.toLocaleString()} GNF
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  pricing.is_active
                                    ? 'bg-green-100 text-green-900'
                                    : 'bg-red-100 text-red-900'
                                }`}
                              >
                                {pricing.is_active ? 'Actif' : 'Inactif'}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => startEdit(pricing)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                          >
                            <Edit className="w-5 h-5 text-gray-600" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {/* Batch */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Mode B: Par Batch</h3>
                    <p className="text-sm text-gray-600">Packs de candidats avec économies</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pricingOptions
                    .filter((p) => p.mode === 'batch')
                    .map((pricing) => (
                      <div
                        key={pricing.id}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{pricing.name}</h4>
                          <button
                            onClick={() => startEdit(pricing)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{pricing.description}</p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Candidats:</span>
                            <span className="font-medium">{pricing.candidate_count}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Crédits:</span>
                            <span className="font-bold text-green-600">{pricing.credits_cost}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">GNF:</span>
                            <span className="font-medium">{pricing.gnf_cost.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Par candidat:</span>
                            <span className="text-xs">
                              {pricing.candidate_count
                                ? (pricing.credits_cost / pricing.candidate_count).toFixed(1)
                                : 0}{' '}
                              crédits
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Subscriptions */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Mode C: Abonnements IA</h3>
                    <p className="text-sm text-gray-600">Forfaits mensuels avec quotas</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {pricingOptions
                    .filter((p) => p.mode === 'subscription')
                    .map((pricing) => (
                      <div
                        key={pricing.id}
                        className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-gray-900">{pricing.name}</h4>
                          <button
                            onClick={() => startEdit(pricing)}
                            className="p-1 hover:bg-purple-100 rounded"
                          >
                            <Edit className="w-4 h-4 text-purple-600" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{pricing.description}</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Matchings:</span>
                            <span className="font-bold text-purple-600">
                              {pricing.candidate_count || 'Illimité'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Prix GNF:</span>
                            <span className="font-bold text-gray-900">
                              {pricing.metadata?.gnf_price?.toLocaleString() || pricing.gnf_cost.toLocaleString()}
                            </span>
                          </div>
                          {pricing.metadata?.features && (
                            <div className="mt-3 pt-3 border-t border-purple-200">
                              <p className="text-xs font-medium text-gray-700 mb-2">Inclus:</p>
                              <ul className="space-y-1">
                                {pricing.metadata.features.map((feature: string, idx: number) => (
                                  <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                                    <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Subscriptions Tab */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-4">
              {pendingSubscriptions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Crown className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Aucun abonnement en attente de validation</p>
                </div>
              ) : (
                pendingSubscriptions.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="bg-white rounded-xl border border-yellow-200 p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Crown className="w-6 h-6 text-yellow-600" />
                          <h3 className="font-bold text-gray-900">
                            Abonnement {subscription.plan_type.toUpperCase()}
                          </h3>
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-900 text-xs rounded-full">
                            En attente
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Recruteur:</p>
                            <p className="font-medium">{subscription.recruiter?.full_name}</p>
                            <p className="text-xs text-gray-500">{subscription.recruiter?.email}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Montant payé:</p>
                            <p className="font-bold text-green-600">
                              {subscription.amount_paid?.toLocaleString()} GNF
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Moyen de paiement:</p>
                            <p className="font-medium">{subscription.payment_method}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Date de demande:</p>
                            <p className="font-medium">
                              {new Date(subscription.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleValidateSubscription(subscription.id, true)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approuver
                        </button>
                        <button
                          onClick={() => handleValidateSubscription(subscription.id, false)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Refuser
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
  );
}
