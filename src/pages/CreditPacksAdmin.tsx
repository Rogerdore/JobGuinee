import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';
import {
  Package,
  Edit2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Loader,
  Plus,
  Star,
  Power,
  TrendingUp
} from 'lucide-react';

interface CreditPackage {
  id: string;
  name: string;
  description: string;
  credits_amount: number;
  price_amount: number;
  currency: string;
  bonus_credits: number;
  is_popular: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export default function CreditPacksAdmin() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CreditPackage>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error: any) {
      showMessage('error', 'Erreur lors du chargement des packs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (pack: CreditPackage) => {
    setEditingId(pack.id);
    setEditForm({
      name: pack.name,
      description: pack.description,
      credits_amount: pack.credits_amount,
      price_amount: pack.price_amount,
      currency: pack.currency,
      bonus_credits: pack.bonus_credits,
      is_popular: pack.is_popular,
      is_active: pack.is_active,
      display_order: pack.display_order,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const savePackage = async (packageId: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('credit_packages')
        .update(editForm)
        .eq('id', packageId);

      if (error) throw error;

      showMessage('success', 'Pack mis à jour avec succès');
      setEditingId(null);
      setEditForm({});
      loadPackages();
    } catch (error: any) {
      showMessage('error', 'Erreur lors de la mise à jour: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (packageId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('credit_packages')
        .update({ is_active: !currentStatus })
        .eq('id', packageId);

      if (error) throw error;

      showMessage('success', `Pack ${!currentStatus ? 'activé' : 'désactivé'} avec succès`);
      loadPackages();
    } catch (error: any) {
      showMessage('error', 'Erreur lors du changement de statut: ' + error.message);
    }
  };

  const togglePopular = async (packageId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('credit_packages')
        .update({ is_popular: !currentStatus })
        .eq('id', packageId);

      if (error) throw error;

      showMessage('success', `Pack ${!currentStatus ? 'marqué comme populaire' : 'retiré des populaires'}`);
      loadPackages();
    } catch (error: any) {
      showMessage('error', 'Erreur lors du changement: ' + error.message);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTotalCredits = (baseCredits: number, bonusCredits: number) => {
    return baseCredits + bonusCredits;
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Package className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Packs de Crédits</h1>
          </div>
          <p className="text-gray-600">
            Configurez les packs de crédits disponibles à l'achat (Minimum: 100,000 GNF)
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

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {packages.map((pack) => (
            <div
              key={pack.id}
              className={`bg-white rounded-xl shadow-md overflow-hidden transition-all ${
                pack.is_popular ? 'ring-2 ring-blue-500' : ''
              } ${!pack.is_active ? 'opacity-60' : ''}`}
            >
              {editingId === pack.id ? (
                <div className="p-6 space-y-4">
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
                    placeholder="Nom du pack"
                  />

                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Description"
                    rows={2}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Prix (GNF)</label>
                      <input
                        type="number"
                        min="100000"
                        step="1000"
                        value={editForm.price_amount || 0}
                        onChange={(e) => setEditForm({ ...editForm, price_amount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Ordre</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.display_order || 0}
                        onChange={(e) => setEditForm({ ...editForm, display_order: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Crédits</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.credits_amount || 0}
                        onChange={(e) => setEditForm({ ...editForm, credits_amount: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Bonus</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.bonus_credits || 0}
                        onChange={(e) => setEditForm({ ...editForm, bonus_credits: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.is_active || false}
                        onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Actif</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.is_popular || false}
                        onChange={(e) => setEditForm({ ...editForm, is_popular: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Populaire</span>
                    </label>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      onClick={() => savePackage(pack.id)}
                      disabled={saving}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Enregistrer</span>
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={saving}
                      className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Annuler</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={`p-6 ${pack.is_popular ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' : 'bg-gray-50'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className={`text-xl font-bold ${pack.is_popular ? 'text-white' : 'text-gray-900'}`}>
                            {pack.name}
                          </h3>
                          {pack.is_popular && (
                            <span className="flex items-center space-x-1 bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-bold">
                              <Star className="w-3 h-3" />
                              <span>Populaire</span>
                            </span>
                          )}
                        </div>
                        <p className={`text-sm mt-1 ${pack.is_popular ? 'text-blue-100' : 'text-gray-600'}`}>
                          {pack.description}
                        </p>
                      </div>
                    </div>

                    <div className={`text-3xl font-bold ${pack.is_popular ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(pack.price_amount)} GNF
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Crédits de base</span>
                        <span className="font-semibold text-gray-900">{pack.credits_amount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Crédits bonus</span>
                        <span className="font-semibold text-green-600">+{pack.bonus_credits}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-900">Total crédits</span>
                          <span className="text-lg font-bold text-blue-600 flex items-center space-x-1">
                            <TrendingUp className="w-5 h-5" />
                            <span>{getTotalCredits(pack.credits_amount, pack.bonus_credits)}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <button
                        onClick={() => toggleActive(pack.id, pack.is_active)}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition ${
                          pack.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{pack.is_active ? 'Actif' : 'Inactif'}</span>
                      </button>

                      <button
                        onClick={() => togglePopular(pack.id, pack.is_popular)}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition ${
                          pack.is_popular
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        <Star className="w-3 h-3" />
                        <span>{pack.is_popular ? 'Populaire' : 'Standard'}</span>
                      </button>
                    </div>

                    <button
                      onClick={() => startEdit(pack)}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Modifier</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-2">Informations importantes</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Prix minimum: 100,000 GNF par pack</li>
                <li>Conversion: 1000 GNF = 10 crédits</li>
                <li>Le pack "Populaire" est mis en avant dans l'interface utilisateur</li>
                <li>Les modifications s'appliquent immédiatement</li>
                <li>L'ordre d'affichage détermine la position des packs sur la page</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
