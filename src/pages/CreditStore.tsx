import { useState, useEffect } from 'react';
import { ShoppingCart, Zap, Star, Check, Copy, MessageCircle, AlertCircle, Sparkles, X, Crown, Shield, Clock, Award } from 'lucide-react';
import { CreditStoreService, CreditPackage, CreditStoreSettings } from '../services/creditStoreService';
import { PremiumSubscriptionService } from '../services/premiumSubscriptionService';
import { useAuth } from '../contexts/AuthContext';
import CreditBalance from '../components/credits/CreditBalance';

interface PaymentModalProps {
  pack: CreditPackage | null;
  isOpen: boolean;
  onClose: () => void;
  settings: CreditStoreSettings | null;
  userEmail: string;
}

interface PremiumPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CreditStoreSettings | null;
  userEmail: string;
}

function PaymentModal({ pack, isOpen, onClose, settings, userEmail }: PaymentModalProps) {
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [step, setStep] = useState<'info' | 'payment' | 'confirm'>('info');
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && pack) {
      setStep('info');
      setPurchaseId(null);
      setReference(null);
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold">Paiement Orange Money</h2>
          <p className="text-orange-100 mt-1">Suivez les étapes pour finaliser votre achat</p>
        </div>

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
                  <h4 className="font-bold text-blue-900 mb-1">Mode de paiement</h4>
                  <p className="text-sm text-blue-800">
                    Le paiement s'effectue exclusivement par <strong>Orange Money</strong>.
                    Après le transfert, vous devrez envoyer la preuve via WhatsApp pour validation rapide.
                  </p>
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
                onClick={handleCreatePurchase}
                disabled={processing}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 mb-6 border-2 border-orange-300">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Instructions de paiement</h3>

              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border-2 border-orange-400">
                  <div className="text-sm text-gray-600 mb-2">Référence de paiement</div>
                  <div className="text-2xl font-mono font-bold text-orange-600">
                    {reference}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border-2 border-orange-400">
                  <div className="text-sm text-gray-600 mb-2">Numéro Orange Money</div>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-orange-600">
                      {settings.admin_phone_number}
                    </div>
                    <button
                      onClick={handleCopyNumber}
                      className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition flex items-center gap-2"
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

                <div className="bg-white rounded-lg p-4 border-2 border-orange-400">
                  <div className="text-sm text-gray-600 mb-2">Montant à envoyer</div>
                  <div className="text-3xl font-bold text-orange-600">
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
                className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-3"
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

function PremiumPaymentModal({ isOpen, onClose, settings, userEmail }: PremiumPaymentModalProps) {
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [step, setStep] = useState<'info' | 'payment' | 'confirm'>('info');
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('info');
      setSubscriptionId(null);
      setReference(null);
    }
  }, [isOpen]);

  if (!isOpen || !settings) return null;

  const handleCreateSubscription = async () => {
    setProcessing(true);
    try {
      const result = await PremiumSubscriptionService.createSubscription({
        payment_method: 'orange_money',
        price_amount: 350000,
        currency: 'GNF'
      });

      if (result.success && result.subscription_id) {
        setSubscriptionId(result.subscription_id);
        setReference(result.payment_reference || null);
        setStep('payment');
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
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
    const whatsappLink = PremiumSubscriptionService.getWhatsAppLink(
      settings.admin_whatsapp_number,
      'Premium PRO+',
      userEmail,
      reference || ''
    );
    window.open(whatsappLink, '_blank');
  };

  const handleMarkAsPaid = async () => {
    if (!subscriptionId) return;

    setProcessing(true);
    try {
      const success = await PremiumSubscriptionService.markAsWaitingProof(subscriptionId);

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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Premium PRO+</h2>
              <p className="text-yellow-100 text-sm">Paiement Orange Money</p>
            </div>
          </div>
        </div>

        {step === 'info' && (
          <div className="p-6">
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 mb-6 border-2 border-yellow-200">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">Abonnement Premium PRO+</h3>
                <p className="text-gray-600">Accès illimité à tous les services IA</p>
              </div>

              <div className="text-center py-4 mb-4 bg-white rounded-lg border-2 border-yellow-300">
                <div className="text-4xl font-bold text-orange-600 mb-1">350 000 GNF</div>
                <div className="text-gray-600 text-sm">par mois</div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span className="text-gray-700">Services IA illimités sans crédits</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Cloud 10 Go pour documents</span>
                </div>
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <span className="text-gray-700">Support prioritaire 24/7</span>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                  <span className="text-gray-700">Badge Profil vérifié</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-900 mb-1">Mode de paiement</h4>
                  <p className="text-sm text-blue-800">
                    Paiement sécurisé via Orange Money. Envoyez la preuve via WhatsApp pour validation rapide.
                  </p>
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
                onClick={handleCreateSubscription}
                disabled={processing}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Préparation...
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5" />
                    Continuer
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'payment' && (
          <div className="p-6">
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-6 mb-6 border-2 border-orange-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Instructions de paiement</h3>

              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border-2 border-orange-300">
                  <div className="text-sm text-gray-600 mb-2">Référence de paiement</div>
                  <div className="text-2xl font-mono font-bold text-orange-600">
                    {reference}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border-2 border-orange-300">
                  <div className="text-sm text-gray-600 mb-2">Numéro Orange Money</div>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-orange-600">
                      {settings.admin_phone_number}
                    </div>
                    <button
                      onClick={handleCopyNumber}
                      className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition flex items-center gap-2"
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

                <div className="bg-white rounded-lg p-4 border-2 border-orange-300">
                  <div className="text-sm text-gray-600 mb-2">Montant à envoyer</div>
                  <div className="text-3xl font-bold text-orange-600">
                    350 000 GNF
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
                className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-3"
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
                Vous recevrez une notification dès l'activation de votre abonnement Premium PRO+.
              </p>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-left mb-6">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Référence:</strong> {reference}
                </p>
                <p className="text-sm text-blue-800">
                  Conservez cette référence pour le suivi de votre achat.
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
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);

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

  const handleSelectPremium = () => {
    if (!user) {
      alert('Vous devez être connecté pour acheter Premium PRO+');
      return;
    }

    setPremiumModalOpen(true);
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

        <div className="mt-12 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl shadow-xl border-3 border-yellow-300 overflow-hidden">
          <div className="relative">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-200 rounded-full opacity-20"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-200 rounded-full opacity-20"></div>

            <div className="relative z-10 p-8">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-center mb-6">
                  <div className="p-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-lg">
                    <Crown className="w-12 h-12 text-white" />
                  </div>
                </div>

                <h2 className="text-4xl font-bold text-center text-gray-900 mb-3">
                  Premium PRO+
                </h2>
                <p className="text-center text-gray-600 mb-8 text-lg">
                  Accès illimité à tous les services IA sans consommer de crédits
                </p>

                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  <div className="bg-white rounded-xl p-4 border-2 border-blue-200 flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-blue-500 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-gray-900">Services IA</div>
                      <div className="text-sm text-gray-600">Illimités</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 border-2 border-green-200 flex items-center gap-3">
                    <Shield className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-gray-900">Cloud 10 Go</div>
                      <div className="text-sm text-gray-600">Sécurisé</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 border-2 border-purple-200 flex items-center gap-3">
                    <MessageCircle className="w-6 h-6 text-purple-500 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-gray-900">Support 24/7</div>
                      <div className="text-sm text-gray-600">Prioritaire</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 border-2 border-yellow-200 flex items-center gap-3">
                    <Award className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-gray-900">Badge vérifié</div>
                      <div className="text-sm text-gray-600">Profil premium</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 mb-8 text-center border-2 border-orange-300">
                  <div className="text-5xl font-bold text-orange-600 mb-2">
                    350 000 GNF
                  </div>
                  <div className="text-gray-600">par mois • Sans engagement</div>
                </div>

                <button
                  onClick={handleSelectPremium}
                  className="w-full px-8 py-4 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 text-white font-bold text-lg rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 mb-4"
                >
                  <Crown className="w-6 h-6" />
                  S'abonner maintenant
                </button>

                <p className="text-center text-sm text-gray-600">
                  Paiement par Orange Money • Validation rapide par WhatsApp
                </p>
              </div>
            </div>
          </div>
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

      <PremiumPaymentModal
        isOpen={premiumModalOpen}
        onClose={() => setPremiumModalOpen(false)}
        settings={settings}
        userEmail={profile?.email || user?.email || ''}
      />
    </div>
  );
}
