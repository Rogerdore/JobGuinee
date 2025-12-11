import { useState, useEffect } from 'react';
import { Crown, Check, Sparkles, X, Copy, MessageCircle, Zap, Shield, Clock, Award } from 'lucide-react';
import { PremiumSubscriptionService, PremiumSubscription } from '../services/premiumSubscriptionService';
import { CreditStoreService, CreditStoreSettings } from '../services/creditStoreService';
import { useAuth } from '../contexts/AuthContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CreditStoreSettings | null;
  userEmail: string;
}

function PaymentModal({ isOpen, onClose, settings, userEmail }: PaymentModalProps) {
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
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold">Paiement Orange Money</h2>
          <p className="text-white/90 mt-1">Suivez les étapes pour activer votre Premium PRO+</p>
        </div>

        {step === 'info' && (
          <div className="p-6">
            <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-xl p-8 mb-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-3xl font-bold">Premium PRO+</h3>
                  <p className="text-blue-200">Abonnement mensuel</p>
                </div>
                <div className="p-4 bg-white/10 rounded-xl">
                  <Crown className="w-12 h-12 text-yellow-400" />
                </div>
              </div>

              <div className="text-center py-4 mb-4 bg-white/10 rounded-lg">
                <div className="text-5xl font-bold mb-2">350 000 GNF</div>
                <div className="text-blue-200">par mois</div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>Tous les services IA illimités</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>Cloud 10 Go pour documents</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>Support prioritaire 24/7</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>Badge Profil vérifié</span>
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
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:opacity-90"
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
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 mb-6 border-2 border-orange-200">
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
                      className="px-4 py-2 bg-orange-100 rounded-lg transition flex items-center gap-2 hover:opacity-80"
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
                className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-3 hover:opacity-90"
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
                Votre paiement a été enregistré. Un administrateur va le valider dans les plus brefs délais.
                Vous recevrez une notification dès l'activation de votre abonnement Premium PRO+.
              </p>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition"
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

export default function PremiumSubscribe() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<CreditStoreSettings | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<PremiumSubscription | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsData, subData] = await Promise.all([
        CreditStoreService.getSettings(),
        PremiumSubscriptionService.getActiveSubscription()
      ]);

      setSettings(settingsData);
      setActiveSubscription(subData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = () => {
    setShowPaymentModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (activeSubscription) {
    const remainingDays = PremiumSubscriptionService.getRemainingDays(activeSubscription.expires_at);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-8 text-center">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-16 h-16 text-yellow-500" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">Vous êtes Premium PRO+!</h1>
              <p className="text-yellow-100 text-lg">Profitez de tous les avantages</p>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                  <Clock className="w-10 h-10 text-blue-600 mb-3" />
                  <div className="text-sm text-gray-600 mb-1">Expire dans</div>
                  <div className="text-3xl font-bold text-blue-900">{remainingDays} jours</div>
                  <div className="text-sm text-gray-600 mt-2">
                    {PremiumSubscriptionService.formatDate(activeSubscription.expires_at)}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                  <Zap className="w-10 h-10 text-green-600 mb-3" />
                  <div className="text-sm text-gray-600 mb-1">Services IA</div>
                  <div className="text-3xl font-bold text-green-900">Illimités</div>
                  <div className="text-sm text-gray-600 mt-2">Sans consommer de crédits</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white mb-6">
                <h3 className="text-xl font-bold mb-4">Vos avantages Premium</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 flex-shrink-0" />
                    <span>Services IA illimités</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 flex-shrink-0" />
                    <span>Cloud 10 Go sécurisé</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 flex-shrink-0" />
                    <span>Support prioritaire 24/7</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 flex-shrink-0" />
                    <span>Badge Profil vérifié</span>
                  </div>
                </div>
              </div>

              {remainingDays <= 7 && (
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg mb-6">
                  <div className="flex items-center gap-3">
                    <Clock className="w-6 h-6 text-orange-600" />
                    <div>
                      <h4 className="font-bold text-orange-900">Votre abonnement expire bientôt!</h4>
                      <p className="text-sm text-orange-800">
                        Renouvelez maintenant pour continuer à profiter de tous les avantages Premium.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0E2F56] to-blue-800 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-[#0E2F56] to-blue-800 rounded-2xl p-8 text-white">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-12 h-12 text-yellow-400" />
              </div>
              <h1 className="text-4xl font-bold mb-2">Abonnement Premium PRO+</h1>
              <p className="text-blue-200 text-lg">
                Accédez à tous les services Premium IA + Cloud sécurisé + Support prioritaire
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Check className="w-6 h-6 text-green-400 flex-shrink-0" />
                <span>Tous les services IA inclus</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-6 h-6 text-green-400 flex-shrink-0" />
                <span>Cloud 10 Go pour documents</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-6 h-6 text-green-400 flex-shrink-0" />
                <span>Support prioritaire 24/7</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-6 h-6 text-green-400 flex-shrink-0" />
                <span>Badge Profil vérifié</span>
              </div>
            </div>

            <div className="text-center py-6 bg-white/10 rounded-xl mb-6">
              <div className="text-6xl font-bold mb-2">350 000</div>
              <div className="text-2xl text-blue-200">GNF / mois</div>
            </div>

            <button
              onClick={handleSubscribe}
              className="w-full px-8 py-4 bg-white text-blue-900 font-bold text-lg rounded-xl hover:bg-blue-50 transition shadow-lg flex items-center justify-center gap-3"
            >
              S'abonner maintenant
            </button>

            <div className="text-center mt-4 text-sm text-blue-200">
              Orange Money • LengoPay • DigitalPay SA
            </div>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        settings={settings}
        userEmail={user?.email || ''}
      />
    </div>
  );
}
