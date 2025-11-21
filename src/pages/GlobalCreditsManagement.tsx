import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/AdminLayout';
import {
  Coins,
  Plus,
  Minus,
  Search,
  Loader,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
} from 'lucide-react';

interface UserCredit {
  id: string;
  full_name: string;
  email: string;
  credits_balance: number;
  user_type: string;
}

interface CreditTransaction {
  id: string;
  user_id: string;
  credits_amount: number;
  balance_after: number;
  transaction_type: string;
  service_code: string | null;
  description: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface CreditSummary {
  totalUsers: number;
  totalCredits: number;
  totalUsed: number;
  totalAdded: number;
}

export default function GlobalCreditsManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserCredit[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserCredit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserCredit | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [summary, setSummary] = useState<CreditSummary>({
    totalUsers: 0,
    totalCredits: 0,
    totalUsed: 0,
    totalAdded: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUsers(),
        loadTransactions(),
        loadSummary(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, credits_balance, user_type')
      .order('credits_balance', { ascending: false });

    if (!error && data) {
      setUsers(data);
      setFilteredUsers(data);
    }
  };

  const loadTransactions = async () => {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select(`
        id,
        user_id,
        credits_amount,
        balance_after,
        transaction_type,
        service_code,
        description,
        created_at,
        profiles:user_id (full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setTransactions(data as any);
    }
  };

  const loadSummary = async () => {
    const { data: usersData } = await supabase
      .from('profiles')
      .select('credits_balance');

    const { data: transData } = await supabase
      .from('credit_transactions')
      .select('credits_amount, transaction_type');

    if (usersData && transData) {
      const totalCredits = usersData.reduce((sum, u) => sum + (u.credits_balance || 0), 0);
      const totalUsed = transData
        .filter(t => t.transaction_type === 'usage')
        .reduce((sum, t) => sum + t.credits_amount, 0);
      const totalAdded = transData
        .filter(t => t.transaction_type === 'admin_adjustment' || t.transaction_type === 'purchase' || t.transaction_type === 'bonus')
        .reduce((sum, t) => sum + t.credits_amount, 0);

      setSummary({
        totalUsers: usersData.length,
        totalCredits,
        totalUsed,
        totalAdded,
      });
    }
  };

  const handleAddCredits = async () => {
    if (!selectedUser || !amount) return;

    setProcessing(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.rpc('add_global_credits', {
        p_user_id: selectedUser.id,
        p_amount: parseInt(amount),
        p_note: note || null,
      });

      if (error) throw error;

      if (data?.success) {
        setMessage({ type: 'success', text: `${amount} crédits ajoutés avec succès à ${selectedUser.full_name}` });
        setShowAddModal(false);
        setAmount('');
        setNote('');
        setSelectedUser(null);
        loadData();
      } else {
        throw new Error(data?.message || 'Erreur lors de l\'ajout');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erreur lors de l\'ajout des crédits' });
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveCredits = async () => {
    if (!selectedUser || !amount) return;

    setProcessing(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.rpc('remove_global_credits', {
        p_user_id: selectedUser.id,
        p_amount: parseInt(amount),
        p_note: note || null,
      });

      if (error) throw error;

      if (data?.success) {
        setMessage({ type: 'success', text: `${amount} crédits retirés avec succès de ${selectedUser.full_name}` });
        setShowRemoveModal(false);
        setAmount('');
        setNote('');
        setSelectedUser(null);
        loadData();
      } else {
        throw new Error(data?.message || 'Erreur lors du retrait');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erreur lors du retrait des crédits' });
    } finally {
      setProcessing(false);
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'purchase': 'Achat',
      'bonus': 'Bonus',
      'usage': 'Utilisation',
      'refund': 'Remboursement',
      'admin_adjustment': 'Ajustement Admin',
    };
    return labels[type] || type;
  };

  const getTransactionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'purchase': 'text-green-600 bg-green-100',
      'bonus': 'text-blue-600 bg-blue-100',
      'usage': 'text-red-600 bg-red-100',
      'refund': 'text-yellow-600 bg-yellow-100',
      'admin_adjustment': 'text-purple-600 bg-purple-100',
    };
    return colors[type] || 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Crédits Globaux</h1>
          <p className="text-gray-600">Gérez le solde de crédits unique de chaque utilisateur</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Utilisateurs</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalUsers}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Crédits Totaux</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalCredits.toLocaleString()}</p>
              </div>
              <Coins className="w-10 h-10 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Crédits Ajoutés</p>
                <p className="text-2xl font-bold text-green-600">{summary.totalAdded.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Crédits Utilisés</p>
                <p className="text-2xl font-bold text-red-600">{summary.totalUsed.toLocaleString()}</p>
              </div>
              <TrendingDown className="w-10 h-10 text-red-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Utilisateurs</h2>
              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher un utilisateur..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="divide-y max-h-[600px] overflow-y-auto">
              {filteredUsers.map((usr) => (
                <div key={usr.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{usr.full_name || 'Sans nom'}</p>
                      <p className="text-sm text-gray-600">{usr.email}</p>
                      <span className="inline-block mt-1 px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">
                        {usr.user_type}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right mr-4">
                        <p className="text-lg font-bold text-blue-600">{usr.credits_balance.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">crédits</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedUser(usr);
                          setShowAddModal(true);
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                        title="Ajouter des crédits"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(usr);
                          setShowRemoveModal(true);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Retirer des crédits"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Activity className="w-6 h-6" />
                <span>Historique des Transactions</span>
              </h2>
            </div>

            <div className="divide-y max-h-[600px] overflow-y-auto">
              {transactions.map((trans) => (
                <div key={trans.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {(trans.profiles as any)?.full_name || 'Utilisateur inconnu'}
                      </p>
                      <p className="text-sm text-gray-600">{trans.description}</p>
                      {trans.service_code && (
                        <p className="text-xs text-gray-500 mt-1">Service: {trans.service_code}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(trans.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <span className={`inline-block px-2 py-1 text-xs rounded ${getTransactionTypeColor(trans.transaction_type)}`}>
                        {getTransactionTypeLabel(trans.transaction_type)}
                      </span>
                      <p className={`text-lg font-bold mt-1 ${
                        trans.transaction_type === 'usage' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {trans.transaction_type === 'usage' ? '-' : '+'}{trans.credits_amount}
                      </p>
                      <p className="text-xs text-gray-500">Solde: {trans.balance_after}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {showAddModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Ajouter des crédits</h3>
              <p className="text-gray-600 mb-4">
                Utilisateur: <strong>{selectedUser.full_name}</strong>
              </p>
              <p className="text-gray-600 mb-4">
                Solde actuel: <strong>{selectedUser.credits_balance} crédits</strong>
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant à ajouter
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  placeholder="Ex: 1000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (optionnel)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Raison de l'ajout..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedUser(null);
                    setAmount('');
                    setNote('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={processing}
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddCredits}
                  disabled={processing || !amount}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {processing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Ajout...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span>Ajouter</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {showRemoveModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Retirer des crédits</h3>
              <p className="text-gray-600 mb-4">
                Utilisateur: <strong>{selectedUser.full_name}</strong>
              </p>
              <p className="text-gray-600 mb-4">
                Solde actuel: <strong>{selectedUser.credits_balance} crédits</strong>
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant à retirer
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  max={selectedUser.credits_balance}
                  placeholder="Ex: 500"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (optionnel)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Raison du retrait..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  rows={3}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowRemoveModal(false);
                    setSelectedUser(null);
                    setAmount('');
                    setNote('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={processing}
                >
                  Annuler
                </button>
                <button
                  onClick={handleRemoveCredits}
                  disabled={processing || !amount}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {processing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Retrait...</span>
                    </>
                  ) : (
                    <>
                      <Minus className="w-5 h-5" />
                      <span>Retirer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
