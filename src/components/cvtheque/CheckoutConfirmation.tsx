import { useState, useEffect } from 'react';
import { ShoppingCart, AlertTriangle, CreditCard, Package, History, X, Clock, Copy, Check, AlertCircle, MessageCircle } from 'lucide-react';
import { CartHistoryItem } from '../../services/cartHistoryService';
import { CreditStoreService, CreditStoreSettings } from '../../services/creditStoreService';

interface CheckoutConfirmationProps {
  cartItems: CartHistoryItem[];
  onValidateDirectPurchase: () => void;
  onBuyPack: () => void;
  onViewHistory: () => void;
  onClose: () => void;
  loading?: boolean;
}

export default function CheckoutConfirmation({
  cartItems,
  onValidateDirectPurchase,
  onBuyPack,
  onViewHistory,
  onClose,
  loading = false
}: CheckoutConfirmationProps) {
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState<CreditStoreSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await CreditStoreService.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // Calculer les statistiques du panier
  const stats = {
    junior: { count: 0, price: 0 },
    intermediate: { count: 0, price: 0 },
    senior: { count: 0, price: 0 },
    total: 0
  };

  cartItems.forEach(item => {
    stats[item.experience_level].count++;
    stats[item.experience_level].price += item.price_at_selection;
    stats.total += item.price_at_selection;
  });

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-GN').format(amount);
  };

  const handleDirectPurchase = () => {
    setShowPaymentInfo(true);
  };

  const handleCopyNumber = () => {
    if (settings) {
      navigator.clipboard.writeText(settings.admin_phone_number.replace(/\D/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConfirmPayment = () => {
    setShowPaymentInfo(false);
    onValidateDirectPurchase();
  };

  if (showPaymentInfo) {
    const paymentReference = `DP${Date.now()}`;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-orange-700 text-white p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="w-7 h-7" />
                <div>
                  <h2 className="text-2xl font-bold">Paiement Orange Money</h2>
                  <p className="text-orange-100 text-sm">Montant: {formatPrice(stats.total)} GNF</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentInfo(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Instructions de paiement */}
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
              <h3 className="font-bold text-orange-900 mb-4 text-lg">Instructions de Paiement</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-orange-800 mb-2">
                    1. Numéro Orange Money
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white border-2 border-orange-300 rounded-lg px-4 py-3 font-mono text-lg font-bold text-orange-900">
                      {settings?.admin_phone_number || '+224 620 00 00 00'}
                    </div>
                    <button
                      onClick={handleCopyNumber}
                      className="p-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition"
                      title="Copier le numéro"
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-800 mb-2">
                    Support WhatsApp
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white border-2 border-green-300 rounded-lg px-4 py-3 font-mono text-lg font-bold text-green-700">
                      {settings?.admin_whatsapp_number || '+224 620 00 00 00'}
                    </div>
                    <a
                      href={`https://wa.me/${settings?.admin_whatsapp_number.replace(/\D/g, '') || '224620000000'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                      title="Contacter sur WhatsApp"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </a>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-800 mb-2">
                    2. Montant à envoyer
                  </label>
                  <div className="bg-white border-2 border-orange-300 rounded-lg px-4 py-3">
                    <span className="text-2xl font-bold text-orange-900">
                      {formatPrice(stats.total)} GNF
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-800 mb-2">
                    3. Référence de la commande
                  </label>
                  <div className="bg-white border-2 border-orange-300 rounded-lg px-4 py-3">
                    <span className="font-mono font-bold text-orange-900">
                      {paymentReference}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Note importante */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Après le paiement</p>
                  <p>
                    Une fois le paiement effectué, vous serez redirigé pour soumettre votre preuve de paiement.
                    Votre commande sera validée sous <strong>24h ouvrées</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentInfo(false)}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg transition"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmPayment}
                className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition"
              >
                J'ai Effectué le Paiement
              </button>
            </div>

            {/* Contact WhatsApp */}
            <div className="text-center">
              <a
                href={`https://wa.me/${settings?.admin_whatsapp_number.replace(/\D/g, '') || '224620000000'}?text=${encodeURIComponent(`Bonjour, j'ai effectué le paiement pour la référence ${paymentReference}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
              >
                <MessageCircle className="w-4 h-4" />
                Besoin d'aide ? Contactez-nous sur WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-blue-800 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-7 h-7" />
              <div>
                <h2 className="text-2xl font-bold">Validation de Votre Commande</h2>
                <p className="text-blue-100 text-sm">{cartItems.length} profil(s) sélectionné(s)</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Alerte importante */}
          <div className="bg-yellow-500/20 border-2 border-yellow-400 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-100 mb-1">Choix Important</p>
                <p className="text-yellow-50">
                  Vous pouvez soit <strong>valider cette commande directement</strong> (paiement à l'unité),
                  soit <strong>acheter un pack</strong> pour bénéficier de meilleurs tarifs.
                  <span className="text-yellow-200"> ⚠️ L'achat d'un pack annulera cette sélection.</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Récapitulatif de la commande */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Récapitulatif de Votre Sélection
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Junior */}
              {stats.junior.count > 0 && (
                <div className="bg-white rounded-lg p-4 border-2 border-orange-200">
                  <div className="text-sm text-orange-600 font-medium mb-1">Profils Junior</div>
                  <div className="text-2xl font-bold text-orange-900">{stats.junior.count}</div>
                  <div className="text-sm text-orange-700 mt-2">
                    {formatPrice(stats.junior.price)} GNF
                  </div>
                </div>
              )}

              {/* Intermédiaire */}
              {stats.intermediate.count > 0 && (
                <div className="bg-white rounded-lg p-4 border-2 border-green-200">
                  <div className="text-sm text-green-600 font-medium mb-1">Profils Intermédiaires</div>
                  <div className="text-2xl font-bold text-green-900">{stats.intermediate.count}</div>
                  <div className="text-sm text-green-700 mt-2">
                    {formatPrice(stats.intermediate.price)} GNF
                  </div>
                </div>
              )}

              {/* Senior */}
              {stats.senior.count > 0 && (
                <div className="bg-white rounded-lg p-4 border-2 border-blue-300">
                  <div className="text-sm text-blue-600 font-medium mb-1">Profils Senior</div>
                  <div className="text-2xl font-bold text-blue-900">{stats.senior.count}</div>
                  <div className="text-sm text-blue-700 mt-2">
                    {formatPrice(stats.senior.price)} GNF
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t-2 border-blue-300 flex items-center justify-between">
              <span className="text-lg font-bold text-blue-900">Montant Total</span>
              <span className="text-3xl font-bold text-blue-900">
                {formatPrice(stats.total)} GNF
              </span>
            </div>
          </div>

          {/* Options de validation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option 1: Validation directe */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-300 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-green-900 text-lg">Valider la Commande</h4>
                  <p className="text-sm text-green-700">Paiement à l'unité</p>
                </div>
              </div>

              <ul className="space-y-2 mb-4 text-sm text-green-800">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Accès immédiat après validation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Paiement sécurisé via Orange Money</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Validation sous 24h ouvrées</span>
                </li>
              </ul>

              <button
                onClick={handleDirectPurchase}
                disabled={loading}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                {loading ? 'Traitement...' : 'Procéder au Paiement'}
              </button>
            </div>

            {/* Option 2: Acheter un pack */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-300 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-purple-900 text-lg">Acheter un Pack</h4>
                  <p className="text-sm text-purple-700">Économisez jusqu'à 60%</p>
                </div>
              </div>

              <ul className="space-y-2 mb-4 text-sm text-purple-800">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">✓</span>
                  <span>Prix unitaire réduit</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">✓</span>
                  <span>Crédits valables 6 mois</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">⚠️</span>
                  <span className="text-red-800 font-medium">Cette sélection sera annulée</span>
                </li>
              </ul>

              <button
                onClick={onBuyPack}
                disabled={loading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Package className="w-5 h-5" />
                Voir les Packs
              </button>
            </div>
          </div>

          {/* Historique des sélections */}
          <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-700">
                <History className="w-5 h-5" />
                <span className="font-medium">Besoin de retrouver d'anciennes sélections ?</span>
              </div>
              <button
                onClick={onViewHistory}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition text-sm"
              >
                Voir l'Historique
              </button>
            </div>
          </div>

          {/* Note de sécurité */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Délai de traitement</p>
                <p>
                  Après réception de votre preuve de paiement, votre commande sera validée
                  sous <strong>24h ouvrées</strong>. Vous recevrez une notification dès
                  l'activation de vos accès.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition font-medium"
            >
              Retour au Panier
            </button>
            <div className="text-right">
              <div className="text-sm text-gray-600">Besoin d'aide ?</div>
              <a
                href={`https://wa.me/${settings?.admin_whatsapp_number.replace(/\D/g, '') || '224620000000'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-700 font-medium text-sm"
              >
                Contactez-nous sur WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
