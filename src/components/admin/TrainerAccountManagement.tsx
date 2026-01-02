import React, { useState, useEffect } from 'react';
import {
  Users, Search, Shield, Lock, Unlock, Settings, Eye, RefreshCw,
  CheckCircle, XCircle, AlertCircle, TrendingUp, Award, MessageSquare,
  FileText, BarChart3, Crown
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface TrainerWithStatus {
  id: string;
  user_id: string;
  entity_type: 'individual' | 'organization';
  full_name?: string;
  organization_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  is_verified: boolean;
  total_formations?: number;
  total_students?: number;
  account_status?: {
    id: string;
    account_status: string;
    is_blocked: boolean;
    block_reason?: string;
    blocked_at?: string;
    premium_features: string[];
    can_publish_formations: boolean;
    can_boost_formations: boolean;
    max_active_formations: number;
    can_receive_applications: boolean;
    can_send_messages: boolean;
    priority_support: boolean;
    analytics_enabled: boolean;
    notes?: string;
  };
}

export default function TrainerAccountManagement() {
  const { user } = useAuth();
  const [trainers, setTrainers] = useState<TrainerWithStatus[]>([]);
  const [filteredTrainers, setFilteredTrainers] = useState<TrainerWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked' | 'suspended'>('all');
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerWithStatus | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [modalTab, setModalTab] = useState<'status' | 'features' | 'premium' | 'limits'>('status');

  const [blockReason, setBlockReason] = useState('');
  const [accountNotes, setAccountNotes] = useState('');
  const [features, setFeatures] = useState({
    can_publish_formations: true,
    can_boost_formations: false,
    can_receive_applications: true,
    can_send_messages: true,
    priority_support: false,
    analytics_enabled: false
  });
  const [maxActiveFormations, setMaxActiveFormations] = useState(5);
  const [premiumFeatures, setPremiumFeatures] = useState<string[]>([]);

  const PREMIUM_FEATURES = [
    { value: 'unlimited_formations', label: 'Formations illimitées' },
    { value: 'priority_listing', label: 'Affichage prioritaire' },
    { value: 'advanced_analytics', label: 'Analytiques avancées' },
    { value: 'custom_branding', label: 'Personnalisation marque' },
    { value: 'api_access', label: 'Accès API' },
    { value: 'dedicated_support', label: 'Support dédié' },
    { value: 'bulk_operations', label: 'Opérations en masse' },
    { value: 'export_reports', label: 'Export de rapports' }
  ];

  useEffect(() => {
    loadTrainers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [trainers, searchTerm, statusFilter]);

  const loadTrainers = async () => {
    setLoading(true);
    try {
      const { data: trainersData, error: trainersError } = await supabase
        .from('trainer_profiles')
        .select(`
          *,
          account_status:trainer_account_status(*)
        `)
        .order('created_at', { ascending: false });

      if (trainersError) throw trainersError;

      if (trainersData) {
        const userIds = trainersData.map(t => t.user_id);
        const { data: authData } = await supabase
          .from('profiles')
          .select('id, email, phone')
          .in('id', userIds);

        const enrichedTrainers = trainersData.map(trainer => {
          const auth = authData?.find(a => a.id === trainer.user_id);
          const accountStatus = Array.isArray(trainer.account_status)
            ? trainer.account_status[0]
            : trainer.account_status;

          return {
            ...trainer,
            email: auth?.email,
            phone: auth?.phone,
            account_status: accountStatus
          };
        });

        setTrainers(enrichedTrainers);
      }
    } catch (error) {
      console.error('Error loading trainers:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...trainers];

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.organization_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => {
        if (statusFilter === 'blocked') return t.account_status?.is_blocked;
        return t.account_status?.account_status === statusFilter;
      });
    }

    setFilteredTrainers(filtered);
  };

  const openAccountModal = (trainer: TrainerWithStatus) => {
    setSelectedTrainer(trainer);
    if (trainer.account_status) {
      setFeatures({
        can_publish_formations: trainer.account_status.can_publish_formations,
        can_boost_formations: trainer.account_status.can_boost_formations,
        can_receive_applications: trainer.account_status.can_receive_applications,
        can_send_messages: trainer.account_status.can_send_messages,
        priority_support: trainer.account_status.priority_support,
        analytics_enabled: trainer.account_status.analytics_enabled
      });
      setMaxActiveFormations(trainer.account_status.max_active_formations);
      setPremiumFeatures(trainer.account_status.premium_features || []);
      setAccountNotes(trainer.account_status.notes || '');
      setBlockReason(trainer.account_status.block_reason || '');
    }
    setShowAccountModal(true);
  };

  const handleBlockAccount = async () => {
    if (!selectedTrainer?.account_status) return;
    if (!blockReason.trim()) {
      alert('Veuillez fournir une raison de blocage');
      return;
    }

    try {
      const { error } = await supabase
        .from('trainer_account_status')
        .update({
          is_blocked: true,
          account_status: 'blocked',
          block_reason: blockReason,
          blocked_at: new Date().toISOString(),
          blocked_by: user?.id,
          last_status_change: new Date().toISOString()
        })
        .eq('id', selectedTrainer.account_status.id);

      if (error) throw error;
      alert('Compte bloqué avec succès');
      loadTrainers();
      setShowAccountModal(false);
    } catch (error) {
      console.error('Error blocking account:', error);
      alert('Erreur lors du blocage');
    }
  };

  const handleUnblockAccount = async () => {
    if (!selectedTrainer?.account_status) return;

    try {
      const { error } = await supabase
        .from('trainer_account_status')
        .update({
          is_blocked: false,
          account_status: 'active',
          block_reason: null,
          blocked_at: null,
          last_status_change: new Date().toISOString()
        })
        .eq('id', selectedTrainer.account_status.id);

      if (error) throw error;
      alert('Compte débloqué avec succès');
      loadTrainers();
      setShowAccountModal(false);
    } catch (error) {
      console.error('Error unblocking account:', error);
      alert('Erreur lors du déblocage');
    }
  };

  const handleUpdateFeatures = async () => {
    if (!selectedTrainer?.account_status) return;

    try {
      const { error } = await supabase
        .from('trainer_account_status')
        .update({
          ...features,
          max_active_formations: maxActiveFormations,
          notes: accountNotes
        })
        .eq('id', selectedTrainer.account_status.id);

      if (error) throw error;
      alert('Fonctionnalités mises à jour avec succès');
      loadTrainers();
    } catch (error) {
      console.error('Error updating features:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleUpdatePremium = async () => {
    if (!selectedTrainer?.account_status) return;

    try {
      const { error } = await supabase
        .from('trainer_account_status')
        .update({
          premium_features: premiumFeatures
        })
        .eq('id', selectedTrainer.account_status.id);

      if (error) throw error;
      alert('Fonctionnalités premium mises à jour avec succès');
      loadTrainers();
    } catch (error) {
      console.error('Error updating premium features:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const stats = {
    total: trainers.length,
    active: trainers.filter(t => t.account_status?.account_status === 'active' && !t.account_status.is_blocked).length,
    blocked: trainers.filter(t => t.account_status?.is_blocked).length,
    suspended: trainers.filter(t => t.account_status?.account_status === 'suspended').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Comptes Formateurs</h2>
        <p className="mt-2 text-gray-600">Contrôle avancé des comptes, fonctionnalités et permissions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <Users className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Actifs</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bloqués</p>
              <p className="text-2xl font-bold text-red-600">{stats.blocked}</p>
            </div>
            <Lock className="w-10 h-10 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Suspendus</p>
              <p className="text-2xl font-bold text-orange-600">{stats.suspended}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="blocked">Bloqués</option>
              <option value="suspended">Suspendus</option>
            </select>

            <button
              onClick={loadTrainers}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Formateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Formations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut compte
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fonctionnalités
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTrainers.map((trainer) => (
                <tr key={trainer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {trainer.entity_type === 'individual' ? trainer.full_name : trainer.organization_name}
                      </p>
                      {trainer.is_verified && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <Shield className="w-3 h-3" />
                          Vérifié
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {trainer.email}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium">{trainer.total_formations || 0}</span>
                      <span className="text-gray-500">/ {trainer.account_status?.max_active_formations || 5} max</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      trainer.account_status?.is_blocked
                        ? 'bg-red-100 text-red-800'
                        : trainer.account_status?.account_status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {trainer.account_status?.is_blocked && 'Bloqué'}
                      {!trainer.account_status?.is_blocked && trainer.account_status?.account_status === 'active' && 'Actif'}
                      {!trainer.account_status?.is_blocked && trainer.account_status?.account_status === 'suspended' && 'Suspendu'}
                      {!trainer.account_status?.account_status && 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {trainer.account_status?.can_publish_formations && (
                        <FileText className="w-4 h-4 text-green-600" title="Peut publier" />
                      )}
                      {trainer.account_status?.can_boost_formations && (
                        <TrendingUp className="w-4 h-4 text-blue-600" title="Boost activé" />
                      )}
                      {trainer.account_status?.analytics_enabled && (
                        <BarChart3 className="w-4 h-4 text-purple-600" title="Analytics activées" />
                      )}
                      {trainer.account_status?.priority_support && (
                        <Crown className="w-4 h-4 text-yellow-600" title="Support prioritaire" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openAccountModal(trainer)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      <Settings className="w-4 h-4" />
                      Gérer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTrainers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun formateur trouvé</p>
          </div>
        )}
      </div>

      {showAccountModal && selectedTrainer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Gestion du compte: {selectedTrainer.entity_type === 'individual'
                  ? selectedTrainer.full_name
                  : selectedTrainer.organization_name}
              </h3>
            </div>

            <div className="border-b border-gray-200">
              <div className="flex gap-4 px-6">
                {(['status', 'features', 'limits', 'premium'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setModalTab(tab)}
                    className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                      modalTab === tab
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab === 'status' && 'Statut'}
                    {tab === 'features' && 'Fonctionnalités'}
                    {tab === 'limits' && 'Limites'}
                    {tab === 'premium' && 'Premium'}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {modalTab === 'status' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Statut actuel:</p>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      selectedTrainer.account_status?.is_blocked
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedTrainer.account_status?.is_blocked ? 'Bloqué' : 'Actif'}
                    </span>
                  </div>

                  {selectedTrainer.account_status?.is_blocked ? (
                    <>
                      {selectedTrainer.account_status.block_reason && (
                        <div className="p-4 bg-red-50 rounded-lg">
                          <p className="text-sm font-medium text-red-900 mb-1">Raison du blocage:</p>
                          <p className="text-red-700">{selectedTrainer.account_status.block_reason}</p>
                        </div>
                      )}
                      <button
                        onClick={handleUnblockAccount}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Unlock className="w-5 h-5" />
                        Débloquer le compte
                      </button>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Raison du blocage
                        </label>
                        <textarea
                          value={blockReason}
                          onChange={(e) => setBlockReason(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Expliquez la raison du blocage..."
                        />
                      </div>
                      <button
                        onClick={handleBlockAccount}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <Lock className="w-5 h-5" />
                        Bloquer le compte
                      </button>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes administratives
                    </label>
                    <textarea
                      value={accountNotes}
                      onChange={(e) => setAccountNotes(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Notes internes sur ce compte..."
                    />
                    <button
                      onClick={handleUpdateFeatures}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Enregistrer les notes
                    </button>
                  </div>
                </div>
              )}

              {modalTab === 'features' && (
                <div className="space-y-4">
                  <p className="text-gray-600 mb-4">Activez ou désactivez les fonctionnalités pour ce compte</p>

                  {Object.entries({
                    can_publish_formations: 'Publier des formations',
                    can_boost_formations: 'Utiliser les services boost',
                    can_receive_applications: 'Recevoir des candidatures',
                    can_send_messages: 'Envoyer des messages',
                    priority_support: 'Support prioritaire',
                    analytics_enabled: 'Accès aux analytiques'
                  }).map(([key, label]) => (
                    <label key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <span className="font-medium text-gray-900">{label}</span>
                      <input
                        type="checkbox"
                        checked={features[key as keyof typeof features]}
                        onChange={(e) => setFeatures({ ...features, [key]: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                  ))}

                  <button
                    onClick={handleUpdateFeatures}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Enregistrer les modifications
                  </button>
                </div>
              )}

              {modalTab === 'limits' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre maximum de formations actives
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={maxActiveFormations}
                      onChange={(e) => setMaxActiveFormations(parseInt(e.target.value) || 5)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Actuellement: {selectedTrainer.total_formations || 0} formations
                    </p>
                  </div>

                  <button
                    onClick={handleUpdateFeatures}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Enregistrer les limites
                  </button>
                </div>
              )}

              {modalTab === 'premium' && (
                <div className="space-y-4">
                  <p className="text-gray-600 mb-4">Sélectionnez les fonctionnalités premium pour ce compte</p>

                  <div className="space-y-2">
                    {PREMIUM_FEATURES.map((feature) => (
                      <label key={feature.value} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <Crown className="w-5 h-5 text-yellow-600" />
                          <span className="font-medium text-gray-900">{feature.label}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={premiumFeatures.includes(feature.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPremiumFeatures([...premiumFeatures, feature.value]);
                            } else {
                              setPremiumFeatures(premiumFeatures.filter(f => f !== feature.value));
                            }
                          }}
                          className="w-5 h-5 text-yellow-600 rounded focus:ring-2 focus:ring-yellow-500"
                        />
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={handleUpdatePremium}
                    className="w-full px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  >
                    Enregistrer les fonctionnalités premium
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowAccountModal(false);
                  setSelectedTrainer(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
