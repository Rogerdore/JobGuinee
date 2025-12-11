import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Eye, Search, Filter, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ProfilePurchase {
  id: string;
  buyer_id: string;
  candidate_id: string;
  amount: number;
  payment_status: string;
  payment_method: string;
  transaction_id: string;
  payment_verified_by_admin: boolean;
  verified_by: string | null;
  verified_at: string | null;
  admin_notes: string | null;
  purchased_at: string;
  buyer: {
    full_name: string;
    email: string;
  };
  candidate: {
    title: string;
    location: string;
    experience_years: number;
    profile: {
      full_name: string;
    };
  };
}

export default function AdminProfilePurchases() {
  const { profile } = useAuth();
  const [purchases, setPurchases] = useState<ProfilePurchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<ProfilePurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [selectedPurchase, setSelectedPurchase] = useState<ProfilePurchase | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPurchases();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [purchases, searchQuery, statusFilter, verificationFilter]);

  const loadPurchases = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profile_purchases')
      .select(`
        *,
        buyer:profiles!profile_purchases_buyer_id_fkey(full_name, email),
        candidate:candidate_profiles!profile_purchases_candidate_id_fkey(
          title,
          location,
          experience_years,
          profile:profiles!candidate_profiles_profile_id_fkey(full_name)
        )
      `)
      .order('purchased_at', { ascending: false });

    if (data && !error) {
      setPurchases(data as any);
    } else if (error) {
      console.error('Error loading purchases:', error);
      alert('Erreur lors du chargement des achats');
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...purchases];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.buyer?.full_name?.toLowerCase().includes(query) ||
        p.buyer?.email?.toLowerCase().includes(query) ||
        p.candidate?.profile?.full_name?.toLowerCase().includes(query) ||
        p.transaction_id?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.payment_status === statusFilter);
    }

    if (verificationFilter === 'verified') {
      filtered = filtered.filter(p => p.payment_verified_by_admin);
    } else if (verificationFilter === 'pending') {
      filtered = filtered.filter(p => !p.payment_verified_by_admin);
    }

    setFilteredPurchases(filtered);
  };

  const handleVerify = async (purchaseId: string, approve: boolean) => {
    if (!profile?.id) return;

    setProcessing(true);

    const updateData: any = {
      payment_verified_by_admin: approve,
      verified_by: approve ? profile.id : null,
      verified_at: approve ? new Date().toISOString() : null,
      admin_notes: adminNotes || null,
    };

    if (approve && !purchases.find(p => p.id === purchaseId)?.payment_status ||
        purchases.find(p => p.id === purchaseId)?.payment_status === 'pending') {
      updateData.payment_status = 'completed';
    }

    const { error } = await supabase
      .from('profile_purchases')
      .update(updateData)
      .eq('id', purchaseId);

    if (error) {
      console.error('Error updating purchase:', error);
      alert('Erreur lors de la mise à jour');
    } else {
      alert(approve ? 'Achat vérifié avec succès' : 'Vérification annulée');
      setSelectedPurchase(null);
      setAdminNotes('');
      await loadPurchases();
    }

    setProcessing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-GN').format(amount) + ' GNF';
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En attente' },
      'completed': { bg: 'bg-green-100', text: 'text-green-800', label: 'Complété' },
      'failed': { bg: 'bg-red-100', text: 'text-red-800', label: 'Échoué' },
      'refunded': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Remboursé' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const stats = {
    total: purchases.length,
    pending: purchases.filter(p => !p.payment_verified_by_admin).length,
    verified: purchases.filter(p => p.payment_verified_by_admin).length,
    revenue: purchases.filter(p => p.payment_verified_by_admin).reduce((sum, p) => sum + p.amount, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-900 mb-4"></div>
          <p className="text-gray-600">Chargement des achats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Achats de Profils</h1>
          <p className="text-gray-600">Vérifiez et validez les paiements des recruteurs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.total}</div>
            <div className="text-sm text-gray-600">Total des achats</div>
          </div>
          <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-6">
            <div className="text-3xl font-bold text-yellow-900 mb-1">{stats.pending}</div>
            <div className="text-sm text-yellow-700">En attente de vérification</div>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-200 p-6">
            <div className="text-3xl font-bold text-green-900 mb-1">{stats.verified}</div>
            <div className="text-sm text-green-700">Vérifiés</div>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
            <div className="text-3xl font-bold text-blue-900 mb-1">{formatAmount(stats.revenue)}</div>
            <div className="text-sm text-blue-700">Revenus vérifiés</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="completed">Complété</option>
              <option value="failed">Échoué</option>
              <option value="refunded">Remboursé</option>
            </select>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes les vérifications</option>
              <option value="pending">Non vérifiés</option>
              <option value="verified">Vérifiés</option>
            </select>
          </div>
        </div>

        {filteredPurchases.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun achat trouvé</h3>
            <p className="text-gray-600">Essayez d'ajuster vos filtres de recherche</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recruteur</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profil Acheté</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Méthode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vérifié</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPurchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(purchase.purchased_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{purchase.buyer?.full_name}</div>
                        <div className="text-sm text-gray-500">{purchase.buyer?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{purchase.candidate?.title}</div>
                        <div className="text-sm text-gray-500">{purchase.candidate?.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatAmount(purchase.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {purchase.payment_method || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(purchase.payment_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {purchase.payment_verified_by_admin ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">Oui</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-yellow-600">
                            <XCircle className="w-4 h-4" />
                            <span className="text-sm">Non</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            setSelectedPurchase(purchase);
                            setAdminNotes(purchase.admin_notes || '');
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Gérer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedPurchase && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">Gestion de l'Achat</h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Recruteur</p>
                  <p className="font-semibold text-gray-900">{selectedPurchase.buyer?.full_name}</p>
                  <p className="text-sm text-gray-500">{selectedPurchase.buyer?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Profil acheté</p>
                  <p className="font-semibold text-gray-900">{selectedPurchase.candidate?.title}</p>
                  <p className="text-sm text-gray-500">{selectedPurchase.candidate?.location}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Montant</p>
                  <p className="font-bold text-lg text-blue-900">{formatAmount(selectedPurchase.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Méthode de paiement</p>
                  <p className="font-semibold text-gray-900">{selectedPurchase.payment_method || 'Non spécifié'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">ID de transaction</p>
                <p className="font-mono text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded">
                  {selectedPurchase.transaction_id || 'Non disponible'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Date d'achat</p>
                <p className="font-semibold text-gray-900">{formatDate(selectedPurchase.purchased_at)}</p>
              </div>

              {selectedPurchase.payment_verified_by_admin && selectedPurchase.verified_at && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Vérifié</span>
                  </div>
                  <p className="text-sm text-green-700">Vérifié le {formatDate(selectedPurchase.verified_at)}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes administrateur
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ajoutez des notes sur cet achat..."
                />
              </div>

              <div className="flex gap-3">
                {!selectedPurchase.payment_verified_by_admin && (
                  <button
                    onClick={() => handleVerify(selectedPurchase.id, true)}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Vérifier et Approuver
                  </button>
                )}
                {selectedPurchase.payment_verified_by_admin && (
                  <button
                    onClick={() => handleVerify(selectedPurchase.id, false)}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="w-5 h-5" />
                    Annuler la Vérification
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedPurchase(null);
                    setAdminNotes('');
                  }}
                  disabled={processing}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition disabled:opacity-50"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
