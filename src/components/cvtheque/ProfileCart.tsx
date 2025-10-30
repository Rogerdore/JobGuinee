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

interface ProfileCartProps {
  items: CartItem[];
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileCart({ items, onRemoveItem, onCheckout, isOpen, onClose }: ProfileCartProps) {
  const getExperienceLevel = (years: number) => {
    if (years >= 6) return { label: 'Senior', color: 'text-blue-900' };
    if (years >= 3) return { label: 'Intermédiaire', color: 'text-green-700' };
    return { label: 'Junior', color: 'text-orange-600' };
  };

  const totalAmount = items.reduce((sum, item) => sum + item.candidate.profile_price, 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-GN').format(price);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>

      <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 flex flex-col">
        <div className="bg-blue-900 text-white p-6 flex items-center justify-between">
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

        <div className="flex-1 overflow-y-auto p-4">
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
              {items.map((item) => {
                const level = getExperienceLevel(item.candidate.experience_years || 0);
                return (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {item.candidate.title || 'Profil'}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <span className={`font-medium ${level.color}`}>{level.label}</span>
                          <span>•</span>
                          <span>{item.candidate.experience_years || 0} ans</span>
                        </div>
                        {item.candidate.location && (
                          <p className="text-xs text-gray-500">{item.candidate.location}</p>
                        )}
                      </div>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Retirer du panier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-blue-900">
                        {formatPrice(item.candidate.profile_price)} GNF
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
                <span>Nombre de profils</span>
                <span>{items.length}</span>
              </div>
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
              className="w-full py-4 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg transition shadow-lg flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Procéder au paiement
            </button>

            <p className="text-xs text-center text-gray-500 mt-3">
              💳 Orange Money • LengoPay • DigitalPay • Visa/MC
            </p>
          </div>
        )}
      </div>
    </>
  );
}
