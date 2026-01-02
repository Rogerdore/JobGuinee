import React, { useState, useEffect } from 'react';
import { X, Star, AlertCircle, Award, Crown, CheckCircle2, Zap, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Badge {
  type: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  price: number;
  duration: number;
}

interface ActiveBadge {
  id: string;
  badge_type: string;
  start_date: string;
  end_date: string;
  price: number;
}

interface FormationBoostModalProps {
  formationId: string;
  formationTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FormationBoostModal({
  formationId,
  formationTitle,
  onClose,
  onSuccess
}: FormationBoostModalProps) {
  const { user } = useAuth();
  const [activeBadges, setActiveBadges] = useState<ActiveBadge[]>([]);
  const [selectedBadges, setSelectedBadges] = useState<{ type: string; duration: number }[]>([]);
  const [customDurations, setCustomDurations] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [loadingBadges, setLoadingBadges] = useState(true);

  const BADGE_TYPES: Badge[] = [
    {
      type: 'a_la_une',
      label: 'À la Une',
      description: 'Formation mise en avant en première position pendant toute la durée',
      icon: Star,
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      price: 50000,
      duration: 7
    },
    {
      type: 'urgent',
      label: 'Urgent',
      description: 'Badge rouge "Urgent" pour attirer l\'attention immédiatement',
      icon: AlertCircle,
      color: 'text-red-600 bg-red-50 border-red-200',
      price: 35000,
      duration: 7
    },
    {
      type: 'recommande',
      label: 'Recommandé',
      description: 'Badge "Recommandé" pour valoriser la qualité de la formation',
      icon: Award,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      price: 25000,
      duration: 14
    },
    {
      type: 'premium',
      label: 'Premium',
      description: 'Badge "Premium" avec mise en avant dans la section premium',
      icon: Crown,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      price: 40000,
      duration: 14
    },
    {
      type: 'certifie',
      label: 'Certifié',
      description: 'Badge "Certifié" attestant de la qualité et de la reconnaissance',
      icon: CheckCircle2,
      color: 'text-green-600 bg-green-50 border-green-200',
      price: 30000,
      duration: 30
    }
  ];

  useEffect(() => {
    loadActiveBadges();
  }, [formationId]);

  const loadActiveBadges = async () => {
    setLoadingBadges(true);
    try {
      const { data, error } = await supabase
        .from('formation_badges')
        .select('*')
        .eq('formation_id', formationId)
        .gt('end_date', new Date().toISOString());

      if (error) throw error;
      setActiveBadges(data || []);
    } catch (error) {
      console.error('Error loading active badges:', error);
    } finally {
      setLoadingBadges(false);
    }
  };

  const toggleBadge = (badgeType: string, defaultDuration: number) => {
    const exists = selectedBadges.find(b => b.type === badgeType);
    if (exists) {
      setSelectedBadges(selectedBadges.filter(b => b.type !== badgeType));
      const { [badgeType]: _, ...rest } = customDurations;
      setCustomDurations(rest);
    } else {
      setSelectedBadges([...selectedBadges, { type: badgeType, duration: defaultDuration }]);
      setCustomDurations({ ...customDurations, [badgeType]: defaultDuration });
    }
  };

  const updateDuration = (badgeType: string, duration: number) => {
    setCustomDurations({ ...customDurations, [badgeType]: duration });
    setSelectedBadges(selectedBadges.map(b =>
      b.type === badgeType ? { ...b, duration } : b
    ));
  };

  const calculatePrice = (badge: Badge, duration: number) => {
    const defaultDuration = badge.duration;
    return Math.round((badge.price / defaultDuration) * duration);
  };

  const totalPrice = selectedBadges.reduce((sum, selected) => {
    const badge = BADGE_TYPES.find(b => b.type === selected.type);
    if (!badge) return sum;
    return sum + calculatePrice(badge, selected.duration);
  }, 0);

  const handleApplyBoost = async () => {
    if (selectedBadges.length === 0) {
      alert('Veuillez sélectionner au moins un service boost');
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const badgesToInsert = selectedBadges.map(selected => {
        const badge = BADGE_TYPES.find(b => b.type === selected.type);
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + selected.duration);

        return {
          formation_id: formationId,
          badge_type: selected.type,
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          price: calculatePrice(badge!, selected.duration),
          is_paid: true,
          created_by: user?.id
        };
      });

      const { error } = await supabase
        .from('formation_badges')
        .insert(badgesToInsert);

      if (error) throw error;

      alert('Services boost appliqués avec succès!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error applying boost:', error);
      alert('Erreur lors de l\'application des services boost');
    } finally {
      setLoading(false);
    }
  };

  const isActiveBadge = (badgeType: string) => {
    return activeBadges.some(b => b.badge_type === badgeType);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-600" />
              Services Boost
            </h2>
            <p className="mt-1 text-sm text-gray-600">{formationTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {loadingBadges ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Chargement...</p>
            </div>
          ) : (
            <>
              {activeBadges.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">Badges actifs</h3>
                  <div className="space-y-2">
                    {activeBadges.map(badge => {
                      const badgeInfo = BADGE_TYPES.find(b => b.type === badge.badge_type);
                      const Icon = badgeInfo?.icon || Star;
                      return (
                        <div key={badge.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span className="font-medium">{badgeInfo?.label}</span>
                          </div>
                          <span className="text-gray-600">
                            Expire le {new Date(badge.end_date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Sélectionnez les services à appliquer
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {BADGE_TYPES.map(badge => {
                    const Icon = badge.icon;
                    const isSelected = selectedBadges.some(b => b.type === badge.type);
                    const isActive = isActiveBadge(badge.type);
                    const duration = customDurations[badge.type] || badge.duration;
                    const price = calculatePrice(badge, duration);

                    return (
                      <div
                        key={badge.type}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          isSelected
                            ? `${badge.color} border-current shadow-md`
                            : 'border-gray-200 hover:border-gray-300'
                        } ${isActive ? 'opacity-50' : ''}`}
                        onClick={() => !isActive && toggleBadge(badge.type, badge.duration)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-6 h-6 ${isSelected ? badge.color.split(' ')[0] : 'text-gray-400'}`} />
                            <h4 className="font-semibold text-gray-900">{badge.label}</h4>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className={`w-5 h-5 ${badge.color.split(' ')[0]}`} />
                          )}
                          {isActive && (
                            <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                              Actif
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-3">{badge.description}</p>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Durée par défaut:
                            </span>
                            <span className="font-medium">{badge.duration} jours</span>
                          </div>

                          {isSelected && (
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">
                                Durée personnalisée (jours)
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="90"
                                value={duration}
                                onChange={(e) => updateDuration(badge.type, parseInt(e.target.value) || badge.duration)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          )}

                          <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200">
                            <span className="text-gray-600 flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              Prix:
                            </span>
                            <span className="font-bold text-gray-900">
                              {price.toLocaleString()} GNF
                              {isSelected && duration !== badge.duration && (
                                <span className="text-xs text-gray-500 ml-1">
                                  (calculé)
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedBadges.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">Récapitulatif</span>
                    <span className="text-sm text-gray-600">
                      {selectedBadges.length} service{selectedBadges.length > 1 ? 's' : ''} sélectionné{selectedBadges.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-1 mb-3">
                    {selectedBadges.map(selected => {
                      const badge = BADGE_TYPES.find(b => b.type === selected.type);
                      if (!badge) return null;
                      return (
                        <div key={selected.type} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">
                            {badge.label} ({selected.duration} jours)
                          </span>
                          <span className="font-medium text-gray-900">
                            {calculatePrice(badge, selected.duration).toLocaleString()} GNF
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-3 border-t border-gray-300 flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {totalPrice.toLocaleString()} GNF
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleApplyBoost}
            disabled={loading || selectedBadges.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Application...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Appliquer les services ({totalPrice.toLocaleString()} GNF)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
