import { useEffect, useState } from 'react';
import { Package, Plus, Edit2, ToggleLeft, ToggleRight, Save, X } from 'lucide-react';
import { cvthequePricingService, CVThequePack } from '../services/cvthequePricingService';
import { useModalContext } from '../contexts/ModalContext';

interface AdminCVThequePricingProps {
  onNavigate: (page: string) => void;
}

export default function AdminCVThequePricing({
  const { showSuccess, showError, showWarning, showConfirm } = useModalContext(); onNavigate }: AdminCVThequePricingProps) {
  const [packs, setPacks] = useState<CVThequePack[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPack, setEditingPack] = useState<CVThequePack | null>(null);
  const [formData, setFormData] = useState<Partial<CVThequePack>>({});

  useEffect(() => {
    loadPacks();
  }, []);

  const loadPacks = async () => {
    try {
      const data = await cvthequePricingService.getAllPacks();
      setPacks(data);
    } catch (error) {
      console.error('Error loading packs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pack: CVThequePack) => {
    setEditingPack(pack);
    setFormData(pack);
  };

  const handleSave = async () => {
    if (!editingPack) return;

    try {
      await cvthequePricingService.updatePack(editingPack.id, formData);
      showSuccess('Mis à jour', '✅ Pack mis à jour avec succès');
      setEditingPack(null);
      setFormData({});
      loadPacks();
    } catch (error) {
      console.error('Error updating pack:', error);
      showSuccess('Mise à jour', '❌ Erreur lors de la mise à jour');
    }
  };

  const handleToggleActive = async (pack: CVThequePack) => {
    try {
      await cvthequePricingService.updatePack(pack.id, {
        is_active: !pack.is_active
      });
      loadPacks();
    } catch (error) {
      console.error('Error toggling pack:', error);
      alert('❌ Erreur lors du changement de statut');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-blue-900"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <Package className="w-8 h-8" />
            <span>Tarification CVThèque</span>
          </h1>
          <p className="text-gray-600 mt-2">Gérez les packs et abonnements de la CVThèque</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {packs.map((pack) => (
            <div
              key={pack.id}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 ${
                pack.is_active ? 'border-green-200' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{pack.pack_name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      pack.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {pack.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{pack.description}</p>
                </div>
              </div>

              {editingPack?.id === pack.id ? (
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix (GNF)</label>
                    <input
                      type="number"
                      value={formData.price_gnf || ''}
                      onChange={(e) => setFormData({ ...formData, price_gnf: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de profils</label>
                    <input
                      type="number"
                      value={formData.total_profiles || ''}
                      onChange={(e) => setFormData({ ...formData, total_profiles: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ordre d'affichage</label>
                    <input
                      type="number"
                      value={formData.order_index || 0}
                      onChange={(e) => setFormData({ ...formData, order_index: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={handleSave}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Enregistrer</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingPack(null);
                        setFormData({});
                      }}
                      className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg flex items-center justify-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Annuler</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600">Prix</div>
                      <div className="text-lg font-bold text-gray-900">
                        {cvthequePricingService.formatPrice(pack.price_gnf)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Profils</div>
                      <div className="text-lg font-bold text-gray-900">{pack.total_profiles}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Type</div>
                      <div className="text-sm font-medium text-gray-700">{pack.pack_type}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Ordre</div>
                      <div className="text-sm font-medium text-gray-700">{pack.order_index}</div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleEdit(pack)}
                      className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center space-x-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Modifier</span>
                    </button>
                    <button
                      onClick={() => handleToggleActive(pack)}
                      className={`flex-1 py-2 rounded-lg flex items-center justify-center space-x-2 ${
                        pack.is_active
                          ? 'bg-orange-50 hover:bg-orange-100 text-orange-700'
                          : 'bg-green-50 hover:bg-green-100 text-green-700'
                      }`}
                    >
                      {pack.is_active ? (
                        <>
                          <ToggleRight className="w-4 h-4" />
                          <span>Désactiver</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4" />
                          <span>Activer</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}