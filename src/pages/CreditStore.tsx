import { useState, useEffect } from 'react';
import { ShoppingCart, Zap, TrendingUp, Gift, Check, ArrowRight, Star, Sparkles } from 'lucide-react';
import { CreditStoreService, CreditPackage, PaymentMethod } from '../services/creditStoreService';
import { useAuth } from '../contexts/AuthContext';
import CreditBalance from '../components/credits/CreditBalance';

interface PurchaseModalProps {
  pack: CreditPackage | null;
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (packageId: string, method: PaymentMethod) => Promise<void>;
}

function PurchaseModal({ pack, isOpen, onClose, onPurchase }: PurchaseModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);

  if (!isOpen || !pack) return null;

  const handlePurchase = async () => {
    if (!selectedMethod) return;

    setProcessing(true);
    try {
      await onPurchase(pack.id, selectedMethod);
      onClose();
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const totalCredits = pack.credits_amount + pack.bonus_credits;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <h2 className="text-2xl font-bold">Finaliser l'achat</h2>
          <p className="text-blue-100 mt-1">Choisissez votre méthode de paiement</p>
        </div>

        <div className="p-6">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{pack.name}</h3>
                <p className="text-gray-600">{pack.description}</p>
              </div>
              {pack.is_popular && (
                <span className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-sm font-bold">
                  ⭐ Populaire
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 border-2 border-blue-300">
                <div className="text-sm text-gray-600 mb-1">Crédits</div>
                <div className="text-3xl font-bold text-blue-600">
                  {CreditStoreService.formatCredits(pack.credits_amount)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border-2 border-green-300">
                <div className="text-sm text-gray-600 mb-1">Bonus</div>
                <div className="text-3xl font-bold text-green-600">
                  +{CreditStoreService.formatCredits(pack.bonus_credits)}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-4">
              <div className="text-sm mb-1">Total à recevoir</div>
              <div className="text-4xl font-bold">
                {CreditStoreService.formatCredits(totalCredits)} crédits
              </div>
            </div>

            <div className="mt-4 pt-4 border-t-2 border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-700">Prix:</span>
                <span className="text-3xl font-bold text-gray-900">
                  {CreditStoreService.formatPrice(pack.price_amount, pack.currency)}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Méthode de paiement</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedMethod('orange_money')}
                className={`p-4 rounded-xl border-2 transition ${
                  selectedMethod === 'orange_money'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
                    OM
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900">Orange Money</div>
                    <div className="text-xs text-gray-600">Paiement mobile</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedMethod('mtn_money')}
                className={`p-4 rounded-xl border-2 transition ${
                  selectedMethod === 'mtn_money'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-yellow-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center text-white font-bold">
                    MTN
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900">MTN Money</div>
                    <div className="text-xs text-gray-600">Paiement mobile</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedMethod('visa')}
                className={`p-4 rounded-xl border-2 transition ${
                  selectedMethod === 'visa'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                    VISA
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900">Visa</div>
                    <div className="text-xs text-gray-600">Carte bancaire</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedMethod('mastercard')}
                className={`p-4 rounded-xl border-2 transition ${
                  selectedMethod === 'mastercard'
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">
                    MC
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900">Mastercard</div>
                    <div className="text-xs text-gray-600">Carte bancaire</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={processing}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg transition"
            >
              Annuler
            </button>
            <button
              onClick={handlePurchase}
              disabled={!selectedMethod || processing}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Traitement...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  Procéder au paiement
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreditStore() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState<CreditPackage | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const data = await CreditStoreService.getAllPackages();
      setPackages(data);
    } catch (error) {
      console.error('Error loading packages:', error);
      showAlert('error', 'Erreur lors du chargement des packs');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleBuyClick = (pack: CreditPackage) => {
    if (!user) {
      showAlert('error', 'Veuillez vous connecter pour acheter des crédits');
      return;
    }
    setSelectedPack(pack);
    setShowPurchaseModal(true);
  };

  const handlePurchase = async (packageId: string, method: PaymentMethod) => {
    try {
      const result = await CreditStoreService.createPurchase(packageId, method);

      if (result.success) {
        showAlert('success', 'Achat initié! Redirection vers le paiement...');

        setTimeout(async () => {
          const completeResult = await CreditStoreService.completePurchase(
            result.data.purchase_id,
            'DEMO-' + Date.now()
          );

          if (completeResult.success) {
            showAlert('success', `${completeResult.data.credits_added} crédits ajoutés! Nouveau solde: ${completeResult.data.new_balance}`);
          }
        }, 2000);
      } else {
        showAlert('error', result.message);
      }
    } catch (error) {
      showAlert('error', 'Erreur lors de l\'achat');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement de la boutique...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {alert && (
          <div className={`mb-6 p-4 rounded-xl border-2 flex items-center gap-3 ${
            alert.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}>
            {alert.type === 'success' ? <Check className="w-6 h-6" /> : <Star className="w-6 h-6" />}
            <span className="font-semibold">{alert.message}</span>
          </div>
        )}

        <div className="text-center mb-12">
          <div className="inline-block p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Boutique Crédits IA
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Rechargez vos crédits et accédez à tous nos services IA premium
          </p>

          <CreditBalance showDetails />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {packages.map((pack) => {
            const totalCredits = pack.credits_amount + pack.bonus_credits;
            const savingsPercent = Math.round((pack.bonus_credits / pack.credits_amount) * 100);

            return (
              <div
                key={pack.id}
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-all hover:scale-105 hover:shadow-2xl ${
                  pack.is_popular ? 'border-4 border-orange-500' : 'border-2 border-gray-200'
                }`}
              >
                {pack.is_popular && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Populaire
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">{pack.name}</h3>
                  <p className="text-blue-100 text-sm">{pack.description}</p>
                </div>

                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className="text-5xl font-bold text-gray-900 mb-2">
                      {CreditStoreService.formatCredits(pack.credits_amount)}
                    </div>
                    <div className="text-sm text-gray-600">crédits de base</div>

                    {pack.bonus_credits > 0 && (
                      <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                        <div className="flex items-center justify-center gap-2 text-green-700 font-bold">
                          <Gift className="w-5 h-5" />
                          +{CreditStoreService.formatCredits(pack.bonus_credits)} BONUS
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          Économisez {savingsPercent}%
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-6 border-2 border-purple-200">
                    <div className="text-sm text-gray-600 mb-1">Total</div>
                    <div className="text-3xl font-bold text-purple-600">
                      {CreditStoreService.formatCredits(totalCredits)}
                    </div>
                    <div className="text-xs text-gray-600">crédits IA</div>
                  </div>

                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-gray-900">
                      {CreditStoreService.formatPrice(pack.price_amount, pack.currency)}
                    </div>
                  </div>

                  <button
                    onClick={() => handleBuyClick(pack)}
                    className={`w-full py-4 rounded-xl font-bold text-white transition flex items-center justify-center gap-2 ${
                      pack.is_popular
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                    }`}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Acheter maintenant
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pourquoi acheter des crédits IA ?
            </h2>
            <p className="text-gray-600">
              Débloquez tout le potentiel de nos services d'intelligence artificielle
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Accès Instantané</h3>
              <p className="text-gray-600">
                Utilisez vos crédits immédiatement après l'achat
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Bonus Généreux</h3>
              <p className="text-gray-600">
                Recevez des crédits bonus sur chaque pack
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Meilleur Prix</h3>
              <p className="text-gray-600">
                Plus vous achetez, plus vous économisez
              </p>
            </div>
          </div>
        </div>
      </div>

      <PurchaseModal
        pack={selectedPack}
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onPurchase={handlePurchase}
      />
    </div>
  );
}
