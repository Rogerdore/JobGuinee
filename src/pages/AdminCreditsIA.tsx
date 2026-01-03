import { useState, useEffect } from 'react';
import { Coins, Plus, Minus, History, Search, Filter, Download, Users, TrendingUp, RefreshCw, AlertCircle, CheckCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useModalContext } from '../contexts/ModalContext';

interface AdminCreditsIAProps {
  onNavigate: (page: string) => void;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  user_type: string;
  credits_balance: number;
  created_at: string;
}

interface CreditTransaction {
  id: string;
  user_id: string;
  transaction_type: string;
  credits_amount: number;
  service_code: string;
  description: string;
  balance_before: number;
  balance_after: number;
  created_at: string;
  user?: {
    email: string;
    full_name: string;
  };
}

interface CreditStats {
  totalUsers: number;
  totalCreditsDistributed: number;
  totalCreditsUsed: number;
  averageCreditsPerUser: number;
}

export default function AdminCreditsIA({ onNavigate }: AdminCreditsIAProps) {
  const { showSuccess, showError, showWarning, showConfirm } = useModalContext();
  const { isAdmin, profile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [stats, setStats] = useState<CreditStats>({
    totalUsers: 0,
    totalCreditsDistributed: 0,
    totalCreditsUsed: 0,
    averageCreditsPerUser: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'candidate' | 'recruiter' | 'trainer'>('all');
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'remove'>('add');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [processing, setProcessing] = useState(false);
  const [userTransactions, setUserTransactions] = useState<CreditTransaction[]>([]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchTransactions();
      fetchStats();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, user_type, credits_balance, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select(`
          *,
          user:profiles(email, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: usersData } = await supabase
        .from('profiles')
        .select('credits_balance');

      if (usersData) {
        const totalUsers = usersData.length;
        const totalCredits = usersData.reduce((sum, user) => sum + (user.credits_balance || 0), 0);

        const { data: transData } = await supabase
          .from('credit_transactions')
          .select('credits_amount, transaction_type');

        let totalUsed = 0;
        let totalDistributed = 0;

        if (transData) {
          transData.forEach(t => {
            if (t.transaction_type === 'usage') {
              totalUsed += t.credits_amount;
            } else if (t.transaction_type === 'purchase' || t.transaction_type === 'admin_add') {
              totalDistributed += t.credits_amount;
            }
          });
        }

        setStats({
          totalUsers,
          totalCreditsDistributed: totalDistributed,
          totalCreditsUsed: totalUsed,
          averageCreditsPerUser: totalUsers > 0 ? Math.round(totalCredits / totalUsers) : 0
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const fetchUserTransactions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserTransactions(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    }
  };

  const handleAddCredits = async () => {
    if (!selectedUser || creditAmount <= 0) return;

    setProcessing(true);
    try {
      const currentBalance = selectedUser.credits_balance || 0;
      const newBalance = currentBalance + creditAmount;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits_balance: newBalance })
        .eq('id', selectedUser.id);

      if (updateError) throw updateError;

      const { error: transError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: selectedUser.id,
          transaction_type: 'admin_add',
          credits_amount: creditAmount,
          description: description || `Ajout manuel par l'administrateur`,
          balance_before: currentBalance,
          balance_after: newBalance
        });

      if (transError) throw transError;

      showSuccess('Ajouté', 'Crédits ajoutés avec succès !');
      closeModal();
      fetchUsers();
      fetchTransactions();
      fetchStats();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de crédits:', error);
      alert('Erreur lors de l\'ajout de crédits');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveCredits = async () => {
    if (!selectedUser || creditAmount <= 0) return;

    const currentBalance = selectedUser.credits_balance || 0;
    if (creditAmount > currentBalance) {
      showWarning('Information', 'Le montant à retirer dépasse le solde disponible');
      return;
    }

    setProcessing(true);
    try {
      const newBalance = currentBalance - creditAmount;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits_balance: newBalance })
        .eq('id', selectedUser.id);

      if (updateError) throw updateError;

      const { error: transError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: selectedUser.id,
          transaction_type: 'admin_remove',
          credits_amount: -creditAmount,
          description: description || `Retrait manuel par l'administrateur`,
          balance_before: currentBalance,
          balance_after: newBalance
        });

      if (transError) throw transError;

      alert('Crédits retirés avec succès !');
      closeModal();
      fetchUsers();
      fetchTransactions();
      fetchStats();
    } catch (error) {
      console.error('Erreur lors du retrait de crédits:', error);
      showError('Erreur', 'Erreur lors du retrait de crédits. Veuillez réessayer.');
    } finally {
      setProcessing(false);
    }
  };

  const openModal = (user: User, type: 'add' | 'remove') => {
    setSelectedUser(user);
    setModalType(type);
    setCreditAmount(0);
    setDescription('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setCreditAmount(0);
    setDescription('');
  };

  const openHistoryModal = async (user: User) => {
    setSelectedUser(user);
    await fetchUserTransactions(user.id);
    setShowHistoryModal(true);
  };

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedUser(null);
    setUserTransactions([]);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || user.user_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'admin_add': return 'Ajout Admin';
      case 'admin_remove': return 'Retrait Admin';
      case 'purchase': return 'Achat';
      case 'usage': return 'Utilisation';
      case 'bonus': return 'Bonus';
      default: return type;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'admin_add':
      case 'purchase':
      case 'bonus':
        return 'text-green-600';
      case 'admin_remove':
      case 'usage':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!isAdmin) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Accès refusé</h2>
            <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl">
              <Coins className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Crédits IA</h1>
              <p className="text-gray-600 mt-1">Gérez les crédits des utilisateurs de la plateforme</p>
            </div>
          </div>
          <button
            onClick={() => {
              fetchUsers();
              fetchTransactions();
              fetchStats();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Actualiser
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Utilisateurs</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <Users className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Crédits Distribués</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCreditsDistributed.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Crédits Utilisés</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCreditsUsed.toLocaleString()}</p>
              </div>
              <Coins className="w-12 h-12 text-red-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Moyenne / Utilisateur</p>
                <p className="text-3xl font-bold text-gray-900">{stats.averageCreditsPerUser}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les types</option>
                <option value="candidate">Candidats</option>
                <option value="recruiter">Recruteurs</option>
                <option value="trainer">Formateurs</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crédits</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inscrit le</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Chargement...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.full_name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.user_type === 'candidate' ? 'bg-blue-100 text-blue-800' :
                          user.user_type === 'recruiter' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {user.user_type === 'candidate' ? 'Candidat' :
                           user.user_type === 'recruiter' ? 'Recruteur' : 'Formateur'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Coins className="w-5 h-5 text-yellow-500" />
                          <span className="text-lg font-bold text-gray-900">{user.credits_balance || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openModal(user, 'add')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Ajouter
                          </button>
                          <button
                            onClick={() => openModal(user, 'remove')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                            Retirer
                          </button>
                          <button
                            onClick={() => openHistoryModal(user)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <History className="w-4 h-4" />
                            Historique
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" />
            Dernières Transactions
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solde Après</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.slice(0, 20).map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString('fr-FR')}
                      <br />
                      <span className="text-xs text-gray-400">
                        {new Date(transaction.created_at).toLocaleTimeString('fr-FR')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.user?.full_name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">{transaction.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium">
                        {getTransactionTypeLabel(transaction.transaction_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-bold ${getTransactionColor(transaction.transaction_type)}`}>
                        {transaction.credits_amount > 0 ? '+' : ''}{transaction.credits_amount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {transaction.description || transaction.service_code || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.balance_after}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                {modalType === 'add' ? (
                  <>
                    <Plus className="w-6 h-6 text-green-600" />
                    Ajouter des crédits
                  </>
                ) : (
                  <>
                    <Minus className="w-6 h-6 text-red-600" />
                    Retirer des crédits
                  </>
                )}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Utilisateur sélectionné</div>
              <div className="font-medium text-gray-900">{selectedUser.full_name}</div>
              <div className="text-sm text-gray-500">{selectedUser.email}</div>
              <div className="mt-2 flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                <span className="font-bold text-gray-900">Solde actuel : {selectedUser.credits_balance || 0}</span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de crédits
                </label>
                <input
                  type="number"
                  min="1"
                  value={creditAmount || ''}
                  onChange={(e) => setCreditAmount(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Entrez le montant"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optionnelle)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Raison de la modification..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeModal}
                disabled={processing}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={modalType === 'add' ? handleAddCredits : handleRemoveCredits}
                disabled={processing || creditAmount <= 0}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                  modalType === 'add'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processing ? 'Traitement...' : modalType === 'add' ? 'Ajouter' : 'Retirer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <History className="w-6 h-6 text-blue-600" />
                  Historique des crédits
                </h3>
                <button
                  onClick={closeHistoryModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">{selectedUser.full_name}</div>
                <div className="text-sm text-gray-500">{selectedUser.email}</div>
                <div className="mt-2 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <span className="font-bold text-gray-900">Solde actuel : {selectedUser.credits_balance || 0}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {userTransactions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Aucune transaction trouvée pour cet utilisateur
                </div>
              ) : (
                <div className="space-y-3">
                  {userTransactions.map((transaction) => (
                    <div key={transaction.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {getTransactionTypeLabel(transaction.transaction_type)}
                            </span>
                            <span className={`text-lg font-bold ${getTransactionColor(transaction.transaction_type)}`}>
                              {transaction.credits_amount > 0 ? '+' : ''}{transaction.credits_amount}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {transaction.description || transaction.service_code || 'Aucune description'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            {new Date(transaction.created_at).toLocaleDateString('fr-FR')}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(transaction.created_at).toLocaleTimeString('fr-FR')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                        <span className="text-gray-600">Solde avant : {transaction.balance_before}</span>
                        <span className="font-medium text-gray-900">Solde après : {transaction.balance_after}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={closeHistoryModal}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
