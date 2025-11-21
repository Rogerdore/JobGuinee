import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';
import {
  Users,
  Search,
  Plus,
  Minus,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Loader,
  TrendingUp,
  TrendingDown,
  Wallet
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface UserBalance {
  id: string;
  user_id: string;
  total_credits: number;
  credits_purchased: number;
  credits_bonus: number;
  credits_used: number;
  last_purchase_at: string | null;
  profiles: {
    full_name: string;
    email: string;
    user_type: string;
  };
}

export default function UserCreditsAdmin() {
  const { user } = useAuth();
  const [balances, setBalances] = useState<UserBalance[]>([]);
  const [filteredBalances, setFilteredBalances] = useState<UserBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [adjustingUserId, setAdjustingUserId] = useState<string | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBalances();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredBalances(balances);
    } else {
      const filtered = balances.filter(balance =>
        balance.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        balance.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBalances(filtered);
    }
  }, [searchTerm, balances]);

  const loadBalances = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_credit_balances')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            user_type
          )
        `)
        .order('total_credits', { ascending: false });

      if (error) throw error;
      setBalances(data || []);
      setFilteredBalances(data || []);
    } catch (error: any) {
      showMessage('error', 'Erreur lors du chargement des soldes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const startAdjustment = (userId: string) => {
    setAdjustingUserId(userId);
    setAdjustmentAmount(0);
    setAdjustmentReason('');
  };

  const cancelAdjustment = () => {
    setAdjustingUserId(null);
    setAdjustmentAmount(0);
    setAdjustmentReason('');
  };

  const applyAdjustment = async (userId: string, currentBalance: number) => {
    if (adjustmentAmount === 0) {
      showMessage('error', 'Le montant d\'ajustement ne peut pas être 0');
      return;
    }

    if (!adjustmentReason.trim()) {
      showMessage('error', 'Veuillez fournir une raison pour cet ajustement');
      return;
    }

    const newBalance = currentBalance + adjustmentAmount;
    if (newBalance < 0) {
      showMessage('error', 'Le solde ne peut pas être négatif');
      return;
    }

    try {
      setSaving(true);

      const { error: updateError } = await supabase
        .from('user_credit_balances')
        .update({
          total_credits: newBalance,
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'admin_adjustment',
          credits_amount: adjustmentAmount,
          description: adjustmentReason,
          balance_before: currentBalance,
          balance_after: newBalance,
          metadata: {
            admin_id: user?.id,
            timestamp: new Date().toISOString(),
          },
        });

      if (transactionError) throw transactionError;

      showMessage('success', `Ajustement appliqué avec succès: ${adjustmentAmount > 0 ? '+' : ''}${adjustmentAmount} crédits`);
      cancelAdjustment();
      loadBalances();
    } catch (error: any) {
      showMessage('error', 'Erreur lors de l\'ajustement: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais';
    return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
  };

  const getTotalStats = () => {
    return {
      totalUsers: balances.length,
      totalCredits: balances.reduce((sum, b) => sum + b.total_credits, 0),
      totalPurchased: balances.reduce((sum, b) => sum + b.credits_purchased, 0),
      totalUsed: balances.reduce((sum, b) => sum + b.credits_used, 0),
    };
  };

  const stats = getTotalStats();

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
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Wallet className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Gestion du Solde des Candidats</h1>
          </div>
          <p className="text-gray-600">
            Consultez et ajustez les soldes de crédits des utilisateurs
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p>{message.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Utilisateurs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Crédits Totaux</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalCredits.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Achetés</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalPurchased.toLocaleString()}</p>
              </div>
              <Wallet className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Utilisés</p>
                <p className="text-2xl font-bold text-red-600">{stats.totalUsed.toLocaleString()}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Solde Total
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Achetés
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Bonus
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Utilisés
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Dernier Achat
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBalances.map((balance) => (
                  <tr key={balance.id} className="hover:bg-gray-50 transition">
                    {adjustingUserId === balance.user_id ? (
                      <td colSpan={7} className="px-6 py-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">
                              Ajustement pour {balance.profiles?.full_name}
                            </h4>
                            <div className="text-sm">
                              Solde actuel: <span className="font-bold text-blue-600">{balance.total_credits}</span> crédits
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Montant d'ajustement
                              </label>
                              <input
                                type="number"
                                value={adjustmentAmount}
                                onChange={(e) => setAdjustmentAmount(parseInt(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Ex: +100 ou -50"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Nouveau solde: {balance.total_credits + adjustmentAmount} crédits
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Raison de l'ajustement
                              </label>
                              <input
                                type="text"
                                value={adjustmentReason}
                                onChange={(e) => setAdjustmentReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Ex: Compensation erreur système"
                              />
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => applyAdjustment(balance.user_id, balance.total_credits)}
                              disabled={saving}
                              className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center space-x-2"
                            >
                              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              <span>Appliquer</span>
                            </button>
                            <button
                              onClick={cancelAdjustment}
                              disabled={saving}
                              className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 flex items-center justify-center space-x-2"
                            >
                              <X className="w-4 h-4" />
                              <span>Annuler</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-gray-900">{balance.profiles?.full_name}</div>
                            <div className="text-sm text-gray-500">{balance.profiles?.email}</div>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {balance.profiles?.user_type}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-lg font-bold text-green-600">{balance.total_credits}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-gray-600">{balance.credits_purchased}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-green-600">+{balance.credits_bonus}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-red-600">{balance.credits_used}</span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-600">
                          {formatDate(balance.last_purchase_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => startAdjustment(balance.user_id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Ajuster le solde"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-2">Attention</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Les ajustements sont enregistrés dans l'historique des transactions</li>
                <li>Utilisez des montants positifs (+) pour ajouter des crédits</li>
                <li>Utilisez des montants négatifs (-) pour retirer des crédits</li>
                <li>Fournissez toujours une raison claire pour la traçabilité</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
