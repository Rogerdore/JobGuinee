import { useState, useEffect } from 'react';
import { ShoppingCart, Zap, Star, Check, Copy, MessageCircle, AlertCircle, Sparkles, X } from 'lucide-react';
import { CreditStoreService, CreditPackage, CreditStoreSettings } from '../services/creditStoreService';
import { useAuth } from '../contexts/AuthContext';
import CreditBalance from '../components/credits/CreditBalance';

interface PaymentModalProps {
  pack: CreditPackage | null;
  isOpen: boolean;
  onClose: () => void;
  settings: CreditStoreSettings | null;
  userEmail: string;
}

type PaymentMethod = 'orange_money' | 'lengopay' | 'digitalpay';

function PaymentModal({ pack, isOpen, onClose, settings, userEmail }: PaymentModalProps) {
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [step, setStep] = useState<'method' | 'info' | 'payment' | 'confirm'>('method');
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('orange_money');

  useEffect(() => {
    if (isOpen && pack) {
      setStep('method');
      setPurchaseId(null);
      setReference(null);
      setSelectedMethod('orange_money');
    }
  }, [isOpen, pack]);

  if (!isOpen || !pack || !settings) return null;

  const totalCredits = pack.credits_amount + pack.bonus_credits;

  const handleCreatePurchase = async () => {
    setProcessing(true);
    try {
      const result = await CreditStoreService.createPurchase(pack.id);

      if (result.success && result.data) {
        setPurchaseId(result.data.purchase_id);
        setReference(result.data.payment_reference);
        setStep('payment');
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error creating purchase:', error);
      alert('Une erreur est survenue');
    } finally {
      setProcessing(false);
    }
  };

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(settings.admin_phone_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const whatsappLink = CreditStoreService.getWhatsAppLink(
      settings.admin_whatsapp_number,
      pack.package_name,
      userEmail,
      reference || ''
    );
    window.open(whatsappLink, '_blank');
  };

  const handleMarkAsPaid = async () => {
    if (!purchaseId) return;

    setProcessing(true);
    try {
      const success = await CreditStoreService.markAsWaitingProof(purchaseId);

      if (success) {
        setStep('confirm');
      } else {
        alert('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error marking as paid:', error);
      alert('Une erreur est survenue');
    } finally {
      setProcessing(false);
    }
  };

  const paymentMethodLabels = {
    orange_money: 'Orange Money',
    lengopay: 'LengoPay',
    digitalpay: 'DigitalPay SA'
  };

  const paymentMethodColors = {
    orange_money: 'from-orange-500 to-orange-600',
    lengopay: 'from-blue-500 to-blue-600',
    digitalpay: 'from-green-500 to-green-600'
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className={`bg-gradient-to-r ${paymentMethodColors[selectedMethod]} text-white p-6 relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold">
            {step === 'method' ? 'Choisir votre mode de paiement' : `Paiement ${paymentMethodLabels[selectedMethod]}`}
          </h2>
          <p className="text-white/90 mt-1">Suivez les étapes pour finaliser votre achat</p>
        </div>

        {step === 'method' && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Sélectionnez votre méthode de paiement</h3>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setSelectedMethod('orange_money')}
                  className={`p-6 rounded-xl border-2 transition ${
                    selectedMethod === 'orange_money'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300 bg-white'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 mb-2">Orange Money</div>
                    <div className={`text-sm ${selectedMethod === 'orange_money' ? 'text-orange-700' : 'text-gray-600'}`}>
                      Paiement mobile
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedMethod('lengopay')}
                  className={`p-6 rounded-xl border-2 transition ${
                    selectedMethod === 'lengopay'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 bg-white'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">LengoPay</div>
                    <div className={`text-sm ${selectedMethod === 'lengopay' ? 'text-blue-700' : 'text-gray-600'}`}>
                      Paiement sécurisé
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedMethod('digitalpay')}
                  className={`p-6 rounded-xl border-2 transition ${
                    selectedMethod === 'digitalpay'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300 bg-white'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-2">DigitalPay SA</div>
                    <div className={`text-sm ${selectedMethod === 'digitalpay' ? 'text-green-700' : 'text-gray-600'}`}>
                      Paiement digital
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-6 border-2 border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{pack.package_name}</h3>
                  <p className="text-gray-600">{pack.description}</p>
                </div>
                {pack.is_popular && (
                  <span className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-sm font-bold flex items-center gap-2">
                    <Star className="w-4 h-4" /> Populaire
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-lg p-4 border-2 border-orange-300">
                  <div className="text-sm text-gray-600 mb-1">Crédits</div>
                  <div className="text-3xl font-bold text-orange-600">
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

              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-4 mb-4">
                <div className="text-sm mb-1">Total à recevoir</div>
                <div className="text-4xl font-bold">
                  {CreditStoreService.formatCredits(totalCredits)} crédits
                </div>
              </div>

              <div className="pt-4 border-t-2 border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-700">Prix:</span>
                  <span className="text-3xl font-bold text-gray-900">
                    {CreditStoreService.formatPrice(pack.price_amount, pack.currency)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg transition"
              >
                Annuler
              </button>
              <button
                onClick={() => setStep('info')}
                className={`flex-1 px-6 py-3 bg-gradient-to-r ${paymentMethodColors[selectedMethod]} text-white font-bold rounded-lg transition hover:opacity-90`}
              >
                Continuer avec {paymentMethodLabels[selectedMethod]}
              </button>
            </div>
          </div>
        )}

        {step === 'info' && (
          <div className="p-6">
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 mb-6 border-2 border-orange-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{pack.package_name}</h3>
                  <p className="text-gray-600">{pack.description}</p>
                </div>
                {pack.is_popular && (
                  <span className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-sm font-bold flex items-center gap-2">
                    <Star className="w-4 h-4" /> Populaire
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-lg p-4 border-2 border-orange-300">
                  <div className="text-sm text-gray-600 mb-1">Crédits</div>
                  <div className="text-3xl font-bold text-orange-600">
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

              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-4 mb-4">
                <div className="text-sm mb-1">Total à recevoir</div>
                <div className="text-4xl font-bold">
                  {CreditStoreService.formatCredits(totalCredits)} crédits
                </div>
              </div>

              <div className="pt-4 border-t-2 border-orange-200">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-700">Prix:</span>
                  <span className="text-3xl font-bold text-gray-900">
                    {CreditStoreService.formatPrice(pack.price_amount, pack.currency)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-900 mb-1">Mode de paiement sélectionné</h4>
                  <p className="text-sm text-blue-800">
                    Vous avez choisi <strong>{paymentMethodLabels[selectedMethod]}</strong>.
                    Après le transfert, vous devrez envoyer la preuve via WhatsApp pour validation rapide.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('method')}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg transition"
              >
                Retour
              </button>
              <button
                onClick={handleCreatePurchase}
                disabled={processing}
                className={`flex-1 px-6 py-3 bg-gradient-to-r ${paymentMethodColors[selectedMethod]} text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:opacity-90`}
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Préparation...
                  </>
                ) : (
                  <>
                    Continuer
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'payment' && (
          <div className="p-6">
            <div className={`bg-gradient-to-br ${
              selectedMethod === 'orange_money' ? 'from-orange-50 to-red-50 border-orange-300' :
              selectedMethod === 'lengopay' ? 'from-blue-50 to-indigo-50 border-blue-300' :
              'from-green-50 to-emerald-50 border-green-300'
            } rounded-xl p-6 mb-6 border-2`}>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Instructions de paiement</h3>

              <div className="space-y-4">
                <div className={`bg-white rounded-lg p-4 border-2 ${
                  selectedMethod === 'orange_money' ? 'border-orange-400' :
                  selectedMethod === 'lengopay' ? 'border-blue-400' :
                  'border-green-400'
                }`}>
                  <div className="text-sm text-gray-600 mb-2">Référence de paiement</div>
                  <div className={`text-2xl font-mono font-bold ${
                    selectedMethod === 'orange_money' ? 'text-orange-600' :
                    selectedMethod === 'lengopay' ? 'text-blue-600' :
                    'text-green-600'
                  }`}>
                    {reference}
                  </div>
                </div>

                <div className={`bg-white rounded-lg p-4 border-2 ${
                  selectedMethod === 'orange_money' ? 'border-orange-400' :
                  selectedMethod === 'lengopay' ? 'border-blue-400' :
                  'border-green-400'
                }`}>
                  <div className="text-sm text-gray-600 mb-2">Numéro {paymentMethodLabels[selectedMethod]}</div>
                  <div className="flex items-center justify-between">
                    <div className={`text-3xl font-bold ${
                      selectedMethod === 'orange_money' ? 'text-orange-600' :
                      selectedMethod === 'lengopay' ? 'text-blue-600' :
                      'text-green-600'
                    }`}>
                      {settings.admin_phone_number}
                    </div>
                    <button
                      onClick={handleCopyNumber}
                      className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                        selectedMethod === 'orange_money' ? 'bg-orange-100 hover:bg-orange-200 text-orange-700' :
                        selectedMethod === 'lengopay' ? 'bg-blue-100 hover:bg-blue-200 text-blue-700' :
                        'bg-green-100 hover:bg-green-200 text-green-700'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-5 h-5" />
                          Copié!
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5" />
                          Copier
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className={`bg-white rounded-lg p-4 border-2 ${
                  selectedMethod === 'orange_money' ? 'border-orange-400' :
                  selectedMethod === 'lengopay' ? 'border-blue-400' :
                  'border-green-400'
                }`}>
                  <div className="text-sm text-gray-600 mb-2">Montant à envoyer</div>
                  <div className={`text-3xl font-bold ${
                    selectedMethod === 'orange_money' ? 'text-orange-600' :
                    selectedMethod === 'lengopay' ? 'text-blue-600' :
                    'text-green-600'
                  }`}>
                    {CreditStoreService.formatPrice(pack.price_amount, pack.currency)}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-2">Instructions importantes</h4>
                <p className="text-sm text-blue-800">{settings.payment_instructions}</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleOpenWhatsApp}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-3"
              >
                <MessageCircle className="w-6 h-6" />
                Envoyer la preuve via WhatsApp
              </button>

              <button
                onClick={handleMarkAsPaid}
                disabled={processing}
                className={`w-full px-6 py-4 bg-gradient-to-r ${paymentMethodColors[selectedMethod]} text-white font-bold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-3 hover:opacity-90`}
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Traitement...
                  </>
                ) : (
                  <>
                    <Check className="w-6 h-6" />
                    J'ai effectué le paiement
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="p-6">
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Paiement enregistré!</h3>
              <p className="text-gray-600 mb-6">
                Merci ! Votre paiement est en cours de vérification par l'équipe JobGuinée.
                Temps estimé : <strong>5 à 20 minutes</strong>.
              </p>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-left mb-6">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Référence:</strong> {reference}
                </p>
                <p className="text-sm text-blue-800">
                  Conservez cette référence pour le suivi de votre achat.
                  Vos crédits seront automatiquement ajoutés à votre compte après validation.
                </p>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 text-left mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> N'oubliez pas d'envoyer la preuve de paiement via WhatsApp pour accélérer la validation.
                </p>
              </div>

              <button
                onClick={onClose}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreditStore() {
  const { user, profile } = useAuth();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [settings, setSettings] = useState<CreditStoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState<CreditPackage | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [packagesData, settingsData] = await Promise.all([
        CreditStoreService.getAllPackages(),
        CreditStoreService.getSettings()
      ]);

      setPackages(packagesData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPack = (pack: CreditPackage) => {
    if (!user) {
      alert('Vous devez être connecté pour acheter des crédits');
      return;
    }

    if (!settings?.is_enabled) {
      alert('La boutique de crédits est temporairement désactivée');
      return;
    }

    setSelectedPack(pack);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la boutique...</p>
        </div>
      </div>
    );
  }

  if (!settings?.is_enabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-8 h-8 text-yellow-600 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-yellow-900 mb-2">Boutique temporairement fermée</h3>
                <p className="text-yellow-800">
                  La boutique de crédits est actuellement indisponible. Veuillez réessayer plus tard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-block p-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg mb-4">
            <ShoppingCart className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Boutique de Crédits IA</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Rechargez vos crédits pour profiter de tous nos services IA premium
          </p>
          <div className="mt-6">
            <CreditBalance showDetails />
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-8">
          <div className="flex items-start gap-4">
            <MessageCircle className="w-8 h-8 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-blue-900 mb-2">Paiement Orange Money uniquement</h3>
              <p className="text-blue-800">
                Le paiement s'effectue par transfert Orange Money. Après votre transfert, envoyez la preuve
                via WhatsApp pour une validation rapide par notre équipe.
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pack) => {
            const totalCredits = pack.credits_amount + pack.bonus_credits;
            const bonusPercentage = pack.bonus_credits > 0
              ? Math.round((pack.bonus_credits / pack.credits_amount) * 100)
              : 0;

            return (
              <div
                key={pack.id}
                className={`relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 ${
                  pack.is_popular ? 'border-orange-500 scale-105' : 'border-gray-200'
                }`}
              >
                {pack.is_popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-bl-xl flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    <span className="text-sm font-bold">Populaire</span>
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{pack.package_name}</h3>
                  <p className="text-gray-600 mb-6 min-h-[48px]">{pack.description}</p>

                  <div className="space-y-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                      <div className="text-sm text-blue-600 mb-1">Crédits de base</div>
                      <div className="text-3xl font-bold text-blue-700">
                        {CreditStoreService.formatCredits(pack.credits_amount)}
                      </div>
                    </div>

                    {pack.bonus_credits > 0 && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-100 rounded-lg p-4">
                        <div className="text-sm text-green-600 mb-1">
                          Bonus +{bonusPercentage}%
                        </div>
                        <div className="text-2xl font-bold text-green-700 flex items-center gap-2">
                          <Sparkles className="w-6 h-6" />
                          +{CreditStoreService.formatCredits(pack.bonus_credits)}
                        </div>
                      </div>
                    )}

                    <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-lg p-4 border-2 border-orange-300">
                      <div className="text-sm text-orange-700 mb-1 font-semibold">Total</div>
                      <div className="text-4xl font-bold text-orange-700">
                        {CreditStoreService.formatCredits(totalCredits)}
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="text-center py-4 bg-gray-50 rounded-lg">
                      <div className="text-4xl font-bold text-gray-900">
                        {CreditStoreService.formatPrice(pack.price_amount, pack.currency)}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectPack(pack)}
                    className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
                      pack.is_popular
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                    }`}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Acheter maintenant
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Zap className="w-8 h-8 text-orange-500" />
            À quoi servent les crédits IA?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Check className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Génération de CV</h3>
                <p className="text-sm text-gray-600">Créez des CV professionnels avec l'IA (50-100 crédits)</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Lettres de motivation</h3>
                <p className="text-sm text-gray-600">Lettres personnalisées par IA (20-30 crédits)</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Check className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Matching emploi</h3>
                <p className="text-sm text-gray-600">Analyse de compatibilité avec offres (10 crédits)</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Check className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Coaching carrière</h3>
                <p className="text-sm text-gray-600">Conseils personnalisés par IA (5 crédits/question)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PaymentModal
        pack={selectedPack}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        settings={settings}
        userEmail={profile?.email || user?.email || ''}
      />
    </div>
  );
}
