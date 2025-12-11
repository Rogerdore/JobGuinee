import { ShoppingCart, X, Trash2, CreditCard } from 'lucide-react';
import { useState } from 'react';

interface CartItem {
  id: string;
  candidate_id: string;
  candidate: {
    title?: string;
    experience_years?: number;
    location?: string;
    profile_price: number;
  };
}

interface ActivePack {
  id: string;
  pack_name: string;
  experience_level: string | null;
  profiles_remaining: number;
  price_paid: number;
  total_profiles: number;
}

interface ProfileCartProps {
  items: CartItem[];
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
  isOpen: boolean;
  onClose: () => void;
  activePacks: ActivePack[];
}

export default function ProfileCart({ items, onRemoveItem, onCheckout, isOpen, onClose, activePacks }: ProfileCartProps) {
  const getExperienceLevel = (years: number): 'junior' | 'intermediate' | 'senior' => {
    if (years >= 6) return 'senior';
    if (years >= 3) return 'intermediate';
    return 'junior';
  };

  const getExperienceLevelLabel = (level: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      junior: { label: 'Junior (0-2 ans)', color: 'text-orange-600' },
      intermediate: { label: 'Intermédiaire (3-5 ans)', color: 'text-green-700' },
      senior: { label: 'Senior (6+ ans)', color: 'text-blue-900' }
    };
    return labels[level] || { label: 'Non défini', color: 'text-gray-600' };
  };

  // Vérifier si un profil a un pack compatible
  const hasCompatiblePack = (experienceYears: number): boolean => {
    if (activePacks.length === 0) return true; // Pas de packs = tous validés

    const profileLevel = getExperienceLevel(experienceYears);

    // Chercher un pack spécifique au niveau
    const specificPack = activePacks.find(
      p => p.experience_level === profileLevel && p.profiles_remaining > 0
    );

    if (specificPack) return true;

    // Chercher un pack mixte/entreprise
    const mixedPack = activePacks.find(
      p => !p.experience_level && p.profiles_remaining > 0
    );

    return !!mixedPack;
  };

  // Calculer le prix à afficher
  const getItemPrice = (item: CartItem) => {
    return item.candidate.profile_price;
  };

  // Séparer les profils actifs et désactivés
  const activeItems = items.filter(item => hasCompatiblePack(item.candidate.experience_years || 0));
  const disabledItems = items.filter(item => !hasCompatiblePack(item.candidate.experience_years || 0));

  const totalAmount = activeItems.reduce((sum, item) => sum + getItemPrice(item), 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-GN').format(price);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>

      <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 flex flex-col">
        <div className="bg-blue-900 text-white p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">Mon Panier</h2>
                <p className="text-sm text-blue-100">{items.length} profil(s) sélectionné(s)</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {activePack && (
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-100">Pack actif: {activePack.pack_name}</span>
                <span className="font-bold text-white">{activePack.profiles_remaining} crédits</span>
              </div>
              <div className="text-xs text-blue-200 mt-1">
                Prix unitaire: {formatPrice(activePack.unit_price)} GNF
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {disabledItems.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm font-medium text-red-800 mb-1">
                ⚠️ {disabledItems.length} profil{disabledItems.length > 1 ? 's' : ''} désactivé{disabledItems.length > 1 ? 's' : ''}
              </div>
              <div className="text-xs text-red-700">
                Ces profils nécessitent un pack approprié. Achetez le pack correspondant pour les activer.
              </div>
            </div>
          )}

          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Votre panier est vide</p>
              <p className="text-sm text-gray-400">
                Parcourez les profils et ajoutez ceux qui vous intéressent
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Profils actifs */}
              {activeItems.map((item) => {
                const profileLevel = getExperienceLevel(item.candidate.experience_years || 0);
                const experienceInfo = getExperienceLevelLabel(profileLevel);

                return (
                  <div key={item.id} className="bg-white border-2 border-blue-100 rounded-xl p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">
                          {item.candidate.title || 'Profil Candidat'}
                        </div>
                        {item.candidate.experience_years !== undefined && (
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${experienceInfo.color} bg-gray-100 mb-2`}>
                            {item.candidate.experience_years} ans • {experienceInfo.label}
                          </span>
                        )}
                        {item.candidate.location && (
                          <div className="text-xs text-gray-500 mb-2">{item.candidate.location}</div>
                        )}
                      </div>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="ml-3 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Retirer du panier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-blue-900">
                        {formatPrice(getItemPrice(item))} GNF
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Profils désactivés */}
              {disabledItems.map((item) => {
                const profileLevel = getExperienceLevel(item.candidate.experience_years || 0);
                const experienceInfo = getExperienceLevelLabel(profileLevel);

                return (
                  <div key={item.id} className="bg-gray-100 border-2 border-gray-300 rounded-xl p-4 opacity-60 relative">
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                      DÉSACTIVÉ
                    </div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-600 mb-1">
                          {item.candidate.title || 'Profil Candidat'}
                        </div>
                        {item.candidate.experience_years !== undefined && (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium text-gray-600 bg-gray-200 mb-2">
                            {item.candidate.experience_years} ans • {experienceInfo.label}
                          </span>
                        )}
                        <div className="text-xs text-red-600 font-medium mt-2">
                          ⚠️ Pack {experienceInfo.label} requis
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="ml-3 p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                        title="Retirer du panier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-500 line-through">
                        {formatPrice(getItemPrice(item))} GNF
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Sous-total</span>
                <span className="font-semibold text-gray-900">
                  {formatPrice(totalAmount)} GNF
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Profils validés</span>
                <span>{activeItems.length}</span>
              </div>
              {disabledItems.length > 0 && (
                <div className="flex items-center justify-between text-sm text-red-600">
                  <span>Profils désactivés</span>
                  <span>{disabledItems.length}</span>
                </div>
              )}
            </div>

            <div className="mb-4 pt-4 border-t border-gray-300">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-blue-900">
                  {formatPrice(totalAmount)} GNF
                </span>
              </div>
            </div>

            <button
              onClick={onCheckout}
              disabled={activeItems.length === 0}
              className="w-full py-4 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg transition shadow-lg flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <CreditCard className="w-5 h-5" />
              {activeItems.length > 0 ? 'Procéder au paiement' : 'Aucun profil valide'}
            </button>

            {disabledItems.length > 0 && (
              <div className="text-xs text-center text-red-600 mt-2 font-medium">
                ⚠️ Les profils désactivés ne seront pas comptabilisés ni accessibles
              </div>
            )}

            <p className="text-xs text-center text-gray-500 mt-3">
              💳 Orange Money • LengoPay • DigitalPay • Visa/MC
            </p>
          </div>
        )}
      </div>
    </>
  );
}
