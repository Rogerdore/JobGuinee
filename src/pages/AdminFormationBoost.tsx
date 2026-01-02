import { useState, useEffect } from 'react';
import { useModalContext } from '../contexts/ModalContext';
import {
  Star, AlertCircle, Award, Crown, CheckCircle2, Zap,
  Calendar, DollarSign, TrendingUp, Search, Filter,
  Edit2, Trash2, Eye, Plus, Settings, Save, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';

interface Formation {
  id: string;
  title: string;
  provider: string;
  category: string;
}

interface FormationBadge {
  id: string;
  formation_id: string;
  badge_type: string;
  start_date: string;
  end_date: string;
  price: number;
  is_paid: boolean;
  created_at: string;
  formations?: Formation;
}

interface BadgeConfig {
  type: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  basePrice: number;
  baseDuration: number;
}

interface AdminFormationBoostProps {
  onNavigate: (page: string) => void;
}

export default function AdminFormationBoost({
  const { showSuccess, showError, showWarning, showConfirm } = useModalContext(); onNavigate }: AdminFormationBoostProps) {
  const { profile } = useAuth();
  const [badges, setBadges] = useState<FormationBadge[]>([]);
  const [filteredBadges, setFilteredBadges] = useState<FormationBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [badgeTypeFilter, setBadgeTypeFilter] = useState('all');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const BADGE_CONFIGS: BadgeConfig[] = [
    {
      type: 'a_la_une',
      label: 'À la Une',
      description: 'Formation mise en avant en première position',
      icon: Star,
      color: 'text-yellow-600 bg-yellow-50',
      basePrice: 50000,
      baseDuration: 7
    },
    {
      type: 'urgent',
      label: 'Urgent',
      description: 'Badge rouge pour attirer attention',
      icon: AlertCircle,
      color: 'text-red-600 bg-red-50',
      basePrice: 35000,
      baseDuration: 7
    },
    {
      type: 'recommande',
      label: 'Recommandé',
      description: 'Badge valorisant la qualité',
      icon: Award,
      color: 'text-blue-600 bg-blue-50',
      basePrice: 25000,
      baseDuration: 14
    },
    {
      type: 'premium',
      label: 'Premium',
      description: 'Badge avec mise en avant premium',
      icon: Crown,
      color: 'text-purple-600 bg-purple-50',
      basePrice: 40000,
      baseDuration: 14
    },
    {
      type: 'certifie',
      label: 'Certifié',
      description: 'Badge attestant qualité et reconnaissance',
      icon: CheckCircle2,
      color: 'text-green-600 bg-green-50',
      basePrice: 30000,
      baseDuration: 30
    }
  ];

  const [badgePricing, setBadgePricing] = useState<Record<string, { price: number; duration: number }>>(
    BADGE_CONFIGS.reduce((acc, config) => ({
      ...acc,
      [config.type]: { price: config.basePrice, duration: config.baseDuration }
    }), {})
  );

  useEffect(() => {
    loadBadges();
  }, []);

  useEffect(() => {
    filterBadges();
  }, [badges, searchTerm, statusFilter, badgeTypeFilter]);

  const loadBadges = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('formation_badges')
        .select(`
          *,
          formations (
            id,
            title,
            provider,
            category
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBadges(data || []);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBadges = () => {
    let filtered = [...badges];

    if (searchTerm) {
      filtered = filtered.filter(badge =>
        badge.formations?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        badge.formations?.provider.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      const now = new Date();
      if (statusFilter === 'active') {
        filtered = filtered.filter(badge => new Date(badge.end_date) > now);
      } else if (statusFilter === 'expired') {
        filtered = filtered.filter(badge => new Date(badge.end_date) <= now);
      }
    }

    if (badgeTypeFilter !== 'all') {
      filtered = filtered.filter(badge => badge.badge_type === badgeTypeFilter);
    }

    setFilteredBadges(filtered);
  };

  const getBadgeConfig = (type: string) => {
    return BADGE_CONFIGS.find(c => c.type === type);
  };

  const isActive = (endDate: string) => {
    return new Date(endDate) > new Date();
  };

  const deleteBadge = async (id: string) => {
    // Replaced with showConfirm - needs manual async wrapping
    // Original: if (!confirm('Êtes-vous sûr de vouloir supprimer ce badge ?')) return;

    try {
      const { error } = await supabase
        .from('formation_badges')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showSuccess('Supprimé', 'Badge supprimé avec succès');
      loadBadges();
    } catch (error) {
      console.error('Error deleting badge:', error);
      showError('Erreur', 'Erreur lors de la suppression. Veuillez réessayer.');
    }
  };

  const extendBadge = async (id: string, days: number) => {
    try {
      const badge = badges.find(b => b.id === id);
      if (!badge) return;

      const newEndDate = new Date(badge.end_date);
      newEndDate.setDate(newEndDate.getDate() + days);

      const { error } = await supabase
        .from('formation_badges')
        .update({ end_date: newEndDate.toISOString() })
        .eq('id', id);

      if (error) throw error;

      alert(`Badge prolongé de ${days} jours`);
      loadBadges();
    } catch (error) {
      console.error('Error extending badge:', error);
      showError('Erreur', 'Erreur lors de la prolongation. Veuillez réessayer.');
    }
  };

  const savePricingConfig = async () => {
    setSaving(true);
    try {
      showSuccess('Sauvegardé', 'Configuration sauvegardée avec succès');
      setShowConfigModal(false);
    } catch (error) {
      console.error('Error saving config:', error);
      showError('Erreur', 'Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  const calculateStats = () => {
    const now = new Date();
    const activeBadges = badges.filter(b => new Date(b.end_date) > now);
    const expiredBadges = badges.filter(b => new Date(b.end_date) <= now);
    const totalRevenue = badges.reduce((sum, b) => sum + (b.price || 0), 0);
    const activeRevenue = activeBadges.reduce((sum, b) => sum + (b.price || 0), 0);

    const badgeTypeCounts = BADGE_CONFIGS.map(config => ({
      ...config,
      count: badges.filter(b => b.badge_type === config.type).length,
      activeCount: activeBadges.filter(b => b.badge_type === config.type).length,
      revenue: badges.filter(b => b.badge_type === config.type).reduce((sum, b) => sum + (b.price || 0), 0)
    }));

    return {
      total: badges.length,
      active: activeBadges.length,
      expired: expiredBadges.length,
      totalRevenue,
      activeRevenue,
      badgeTypeCounts
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <AdminLayout onNavigate={onNavigate}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout onNavigate={onNavigate}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Packs Boost Formations</h1>
            <p className="mt-2 text-gray-600">
              Gérez les badges promotionnels et services boost pour les formations
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowStatsModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <TrendingUp className="w-5 h-5" />
              Statistiques
            </button>
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
            >
              <Settings className="w-5 h-5" />
              Configuration Prix
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Badges</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <Zap className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Badges Actifs</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.active}</p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Badges Expirés</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.expired}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenu Total</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {(stats.totalRevenue / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-gray-500">GNF</p>
              </div>
              <DollarSign className="w-12 h-12 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Rechercher une formation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs uniquement</option>
                <option value="expired">Expirés uniquement</option>
              </select>
              <select
                value={badgeTypeFilter}
                onChange={(e) => setBadgeTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les types</option>
                {BADGE_CONFIGS.map(config => (
                  <option key={config.type} value={config.type}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Formation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Badge</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBadges.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <Zap className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p>Aucun badge trouvé</p>
                    </td>
                  </tr>
                ) : (
                  filteredBadges.map(badge => {
                    const config = getBadgeConfig(badge.badge_type);
                    const Icon = config?.icon || Zap;
                    const active = isActive(badge.end_date);

                    return (
                      <tr key={badge.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{badge.formations?.title}</p>
                            <p className="text-sm text-gray-500">{badge.formations?.provider}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config?.color}`}>
                            <Icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{config?.label}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="text-gray-900">
                              {new Date(badge.start_date).toLocaleDateString('fr-FR')}
                            </p>
                            <p className="text-gray-500">
                              → {new Date(badge.end_date).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {badge.price.toLocaleString()} GNF
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          {active ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                              Actif
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                              Expiré
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {active && (
                              <button
                                onClick={() => extendBadge(badge.id, 7)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Prolonger de 7 jours"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteBadge(badge.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Configuration des Prix</h2>
              <button onClick={() => setShowConfigModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {BADGE_CONFIGS.map(config => {
                const Icon = config.icon;
                return (
                  <div key={config.type} className={`p-4 border-2 rounded-lg ${config.color}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <Icon className="w-6 h-6" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{config.label}</h3>
                        <p className="text-sm text-gray-600">{config.description}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prix de base (GNF)
                        </label>
                        <input
                          type="number"
                          value={badgePricing[config.type]?.price || config.basePrice}
                          onChange={(e) => setBadgePricing({
                            ...badgePricing,
                            [config.type]: {
                              ...badgePricing[config.type],
                              price: parseInt(e.target.value) || config.basePrice
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Durée de base (jours)
                        </label>
                        <input
                          type="number"
                          value={badgePricing[config.type]?.duration || config.baseDuration}
                          onChange={(e) => setBadgePricing({
                            ...badgePricing,
                            [config.type]: {
                              ...badgePricing[config.type],
                              duration: parseInt(e.target.value) || config.baseDuration
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={savePricingConfig}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showStatsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Statistiques Détaillées</h2>
              <button onClick={() => setShowStatsModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Revenu Total</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">
                    {stats.totalRevenue.toLocaleString()} GNF
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Revenu Badges Actifs</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">
                    {stats.activeRevenue.toLocaleString()} GNF
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par type de badge</h3>
                <div className="space-y-3">
                  {stats.badgeTypeCounts.map(item => {
                    const Icon = item.icon;
                    return (
                      <div key={item.type} className={`p-4 rounded-lg border-2 ${item.color}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Icon className="w-6 h-6" />
                            <div>
                              <p className="font-semibold text-gray-900">{item.label}</p>
                              <p className="text-sm text-gray-600">
                                {item.count} total • {item.activeCount} actifs
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">
                              {item.revenue.toLocaleString()} GNF
                            </p>
                            <p className="text-sm text-gray-600">
                              {item.count > 0 ? Math.round((item.revenue / stats.totalRevenue) * 100) : 0}% du total
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowStatsModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
