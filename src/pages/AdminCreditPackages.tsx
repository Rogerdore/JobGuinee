import { useState, useEffect } from 'react';
import { Save, Plus, Edit2, Trash2, DollarSign, Zap, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ModernModal from '../components/modals/ModernModal';
import { useModal } from '../hooks/useModal';

interface CreditPackage {
  id: string;
  package_name: string;
  description: string | null;
  credits_amount: number;
  bonus_credits: number;
  price_amount: number;
  currency: string;
  is_popular: boolean;
  is_active: boolean;
  display_order: number;
}

interface PricingConfig {
  id: string;
  credit_unit_price: number;
  currency: string;
}

interface AdminCreditPackagesProps {
  onNavigate?: (page: string) => void;
}

export default function AdminCreditPackages({ onNavigate }: AdminCreditPackagesProps) {
  const { profile } = useAuth();
  const { modalState, showSuccess, showError, showConfirm, closeModal } = useModal();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CreditPackage | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newUnitPrice, setNewUnitPrice] = useState<number>(1000);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [packagesData, configData] = await Promise.all([
        supabase.from('credit_packages').select('*').order('display_order'),
        supabase.from('credit_pricing_config').select('*').limit(1).maybeSingle()
      ]);

      if (packagesData.data) setPackages(packagesData.data);
      if (configData.data) {
        setPricingConfig(configData.data);
        setNewUnitPrice(configData.data.credit_unit_price);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUnitPrice = async () => {
    if (!pricingConfig) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('credit_pricing_config')
        .update({
          credit_unit_price: newUnitPrice,
          updated_by: profile?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', pricingConfig.id);

      if (error) throw error;

      showSuccess(
        'Mise à jour réussie',
        'Le prix unitaire du crédit a été mis à jour avec succès!'
      );
      loadData();
    } catch (error) {
      console.error('Error updating unit price:', error);
      showError(
        'Erreur de mise à jour',
        'Une erreur est survenue lors de la mise à jour du prix unitaire. Veuillez réessayer.'
      );
    } finally {
      setSaving(false);
    }
  };

  const recalculatePackagePrice = (credits: number, bonus: number, unitPrice: number) => {
    return (credits + bonus) * unitPrice;
  };

  const updatePackage = async (pkg: CreditPackage) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('credit_packages')
        .update({
          package_name: pkg.package_name,
          description: pkg.description,
          credits_amount: pkg.credits_amount,
          bonus_credits: pkg.bonus_credits,
          price_amount: pkg.price_amount,
          is_popular: pkg.is_popular,
          is_active: pkg.is_active,
          display_order: pkg.display_order,
          updated_at: new Date().toISOString()
        })
        .eq('id', pkg.id);

      if (error) throw error;

      showSuccess(
        'Pack mis à jour',
        'Le pack de crédits a été mis à jour avec succès!'
      );
      setShowEditModal(false);
      setEditingPackage(null);
      loadData();
    } catch (error) {
      console.error('Error updating package:', error);
      showError(
        'Erreur de mise à jour',
        'Une erreur est survenue lors de la mise à jour du pack. Veuillez réessayer.'
      );
    } finally {
      setSaving(false);
    }
  };

  const deletePackage = async (id: string) => {
    showConfirm(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer ce pack de crédits? Cette action est irréversible.',
      async () => {
        try {
          const { error } = await supabase
            .from('credit_packages')
            .delete()
            .eq('id', id);

          if (error) throw error;

          showSuccess(
            'Pack supprimé',
            'Le pack de crédits a été supprimé avec succès!'
          );
          loadData();
        } catch (error) {
          console.error('Error deleting package:', error);
          showError(
            'Erreur de suppression',
            'Une erreur est survenue lors de la suppression du pack. Veuillez réessayer.'
          );
        }
      },
      'warning'
    );
  };

  const recalculateAllPrices = async () => {
    showConfirm(
      'Recalculer les prix',
      'Voulez-vous recalculer tous les prix des packs selon le prix unitaire actuel? Cette opération modifiera tous les packs existants.',
      async () => {
        setSaving(true);
        try {
          for (const pkg of packages) {
            const newPrice = recalculatePackagePrice(
              pkg.credits_amount,
              pkg.bonus_credits,
              newUnitPrice
            );

            await supabase
              .from('credit_packages')
              .update({ price_amount: newPrice })
              .eq('id', pkg.id);
          }

          showSuccess(
            'Recalcul terminé',
            'Tous les prix ont été recalculés avec succès!'
          );
          loadData();
        } catch (error) {
          console.error('Error recalculating prices:', error);
          showError(
            'Erreur de recalcul',
            'Une erreur est survenue lors du recalcul des prix. Veuillez réessayer.'
          );
        } finally {
          setSaving(false);
        }
      },
      'warning'
    );
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Chargement...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Packs de Crédits IA</h1>
          <p className="text-gray-600">Configurez les packs et le prix unitaire des crédits</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Prix Unitaire du Crédit</h2>
            <p className="text-sm text-gray-600">Base de calcul pour tous les packs</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prix par crédit (GNF)
            </label>
            <input
              type="number"
              value={newUnitPrice}
              onChange={(e) => setNewUnitPrice(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="100"
              step="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prix actuel
            </label>
            <div className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-bold text-lg text-blue-600">
              {pricingConfig?.credit_unit_price.toLocaleString()} GNF
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={updateUnitPrice}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Enregistrer
            </button>
            <button
              onClick={recalculateAllPrices}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              Recalculer tout
            </button>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <strong>Note:</strong> Après avoir modifié le prix unitaire, cliquez sur "Recalculer tout"
            pour mettre à jour automatiquement les prix de tous les packs selon la formule:
            <code className="px-2 py-1 bg-white rounded ml-1">Prix = (Crédits + Bonus) × Prix unitaire</code>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Liste des Packs</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ordre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Crédits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bonus</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix/Crédit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {packages.map((pkg) => {
                const totalCredits = pkg.credits_amount + pkg.bonus_credits;
                const pricePerCredit = pkg.price_amount / totalCredits;

                return (
                  <tr key={pkg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pkg.display_order}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{pkg.package_name}</div>
                      {pkg.is_popular && (
                        <span className="text-xs text-orange-600 font-semibold">⭐ Populaire</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pkg.credits_amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">+{pkg.bonus_credits}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{totalCredits}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {pkg.price_amount.toLocaleString()} GNF
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {Math.round(pricePerCredit).toLocaleString()} GNF
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        pkg.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {pkg.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingPackage(pkg);
                            setShowEditModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deletePackage(pkg.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showEditModal && editingPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Modifier le Pack</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPackage(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du pack
                </label>
                <input
                  type="text"
                  value={editingPackage.package_name}
                  onChange={(e) => setEditingPackage({...editingPackage, package_name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editingPackage.description || ''}
                  onChange={(e) => setEditingPackage({...editingPackage, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Crédits de base
                  </label>
                  <input
                    type="number"
                    value={editingPackage.credits_amount}
                    onChange={(e) => {
                      const newCredits = Number(e.target.value);
                      const newPrice = recalculatePackagePrice(
                        newCredits,
                        editingPackage.bonus_credits,
                        newUnitPrice
                      );
                      setEditingPackage({
                        ...editingPackage,
                        credits_amount: newCredits,
                        price_amount: newPrice
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Crédits bonus
                  </label>
                  <input
                    type="number"
                    value={editingPackage.bonus_credits}
                    onChange={(e) => {
                      const newBonus = Number(e.target.value);
                      const newPrice = recalculatePackagePrice(
                        editingPackage.credits_amount,
                        newBonus,
                        newUnitPrice
                      );
                      setEditingPackage({
                        ...editingPackage,
                        bonus_credits: newBonus,
                        price_amount: newPrice
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix (GNF)
                </label>
                <input
                  type="number"
                  value={editingPackage.price_amount}
                  onChange={(e) => setEditingPackage({...editingPackage, price_amount: Number(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Prix calculé: {recalculatePackagePrice(
                    editingPackage.credits_amount,
                    editingPackage.bonus_credits,
                    newUnitPrice
                  ).toLocaleString()} GNF
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordre d'affichage
                </label>
                <input
                  type="number"
                  value={editingPackage.display_order}
                  onChange={(e) => setEditingPackage({...editingPackage, display_order: Number(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPackage.is_popular}
                    onChange={(e) => setEditingPackage({...editingPackage, is_popular: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Pack populaire</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPackage.is_active}
                    onChange={(e) => setEditingPackage({...editingPackage, is_active: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Pack actif</span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPackage(null);
                }}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={() => updatePackage(editingPackage)}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ModernModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        onConfirm={modalState.onConfirm}
        showCancel={modalState.showCancel}
        pedagogical={modalState.pedagogical}
      />
      </div>
    </>
  );
}
