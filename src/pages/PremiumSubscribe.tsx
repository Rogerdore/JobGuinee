import { useState, useEffect } from 'react';
import {
  Crown, Check, Sparkles, X, Copy, MessageCircle, Zap, Shield, Clock, Award,
  ArrowLeft, Lock, BarChart3, Users, FileText, TrendingUp, Search, Target,
  Calendar, Briefcase, Mail, CheckCircle, Bot, ShoppingCart, Gift, Settings,
  Database, Globe, Cpu
} from 'lucide-react';
import { PremiumSubscriptionService, PremiumSubscription } from '../services/premiumSubscriptionService';
import { CreditStoreService, CreditStoreSettings, CreditPackage } from '../services/creditStoreService';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { calculateRecruiterCompletion, getCompletionStatus } from '../utils/profileCompletion';
import OrangeMoneyPaymentInfo from '../components/payments/OrangeMoneyPaymentInfo';

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
            <div className="bg-gradient-to-br from-blue-900 to-[#0E2F56] rounded-xl p-8 mb-6 text-white">
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
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-[#0E2F56] text-white font-bold rounded-lg hover:from-blue-700 hover:to-blue-900 transition"
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

interface PremiumSubscribeProps {
  onNavigate: (page: string) => void;
}

export default function PremiumSubscribe({ onNavigate }: PremiumSubscribeProps) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<CreditStoreSettings | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<PremiumSubscription | null>(null);
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [canSubscribe, setCanSubscribe] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [showCreditPaymentModal, setShowCreditPaymentModal] = useState(false);

  const isRecruiter = profile?.user_type === 'recruiter';

  useEffect(() => {
    loadData();
    if (isRecruiter) {
      checkProfileCompletion();
      loadCreditPackages();
    }
  }, [isRecruiter, profile]);

  const checkProfileCompletion = async () => {
    if (!profile) return;

    try {
      let company = null;
      if (profile.company_id) {
        const { data } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .maybeSingle();
        company = data;
      }

      const percentage = calculateRecruiterCompletion(profile, company);
      setCompletionPercentage(percentage);
      setCanSubscribe(percentage >= 80);
    } catch (error) {
      console.error('Error checking profile:', error);
    }
  };

  const loadCreditPackages = async () => {
    try {
      const packages = await CreditStoreService.getAllPackages();
      setCreditPackages(packages);
    } catch (error) {
      console.error('Error loading credit packages:', error);
    }
  };

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

  const handleBuyCredits = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setShowCreditPaymentModal(true);
  };

  const handleCreditPurchaseComplete = async () => {
    setShowCreditPaymentModal(false);
    setSelectedPackage(null);
    alert('Achat initié avec succès! Veuillez suivre les instructions de paiement.');
  };

  const premiumFeatures = [
    {
      icon: Target,
      title: 'IA Matching Automatique',
      description: 'Scoring intelligent des candidatures avec recommandations personnalisées',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: FileText,
      title: 'Génération d\'Offres IA',
      description: 'Créez des offres d\'emploi professionnelles en quelques clics',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Search,
      title: 'CVThèque Premium',
      description: 'Accès illimité à la base de talents avec filtres avancés',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: BarChart3,
      title: 'Analytics Avancés',
      description: 'Tableaux de bord et KPIs de recrutement en temps réel',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: FileText,
      title: 'Export PDF/Excel',
      description: 'Exportez vos données de recrutement dans tous les formats',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Settings,
      title: 'Workflow Personnalisable',
      description: 'Créez votre pipeline de recrutement sur mesure',
      color: 'from-indigo-500 to-blue-500'
    },
    {
      icon: Mail,
      title: 'Messagerie Intégrée',
      description: 'Communiquez directement avec les candidats',
      color: 'from-teal-500 to-cyan-500'
    },
    {
      icon: Calendar,
      title: 'Gestion d\'Entretiens',
      description: 'Planifiez et évaluez vos entretiens efficacement',
      color: 'from-red-500 to-pink-500'
    },
    {
      icon: Bot,
      title: 'Chatbot RH',
      description: 'Assistant virtuel pour répondre aux candidats 24/7',
      color: 'from-cyan-500 to-blue-500'
    },
    {
      icon: TrendingUp,
      title: 'Automatisation',
      description: 'Automatisez vos processus de recrutement',
      color: 'from-green-500 to-teal-500'
    },
    {
      icon: Database,
      title: 'Multi-utilisateurs',
      description: 'Collaborez avec toute votre équipe RH',
      color: 'from-blue-500 to-indigo-500'
    },
    {
      icon: Globe,
      title: 'API Complète',
      description: 'Intégrez avec vos outils existants',
      color: 'from-purple-500 to-indigo-500'
    }
  ];

  const recruiterPlans = [
    {
      name: 'Smart Recruiter',
      price: '1.000.000',
      period: 'GNF / mois',
      features: [
        'Workflow personnalisable',
        'IA Matching automatique',
        'Chat RH intégré',
        'Export PDF/Excel',
        'Jusqu\'à 10 offres actives',
        'Support prioritaire',
      ],
    },
    {
      name: 'Enterprise Recruiter',
      price: '1.800.000',
      period: 'GNF / mois',
      popular: true,
      features: [
        'Tout Smart Recruiter +',
        'Multi-utilisateurs illimités',
        'Campagnes de recrutement',
        'Rapports IA avancés',
        'Offres illimitées',
        'CVThèque premium',
        'Chatbot RH personnalisé',
      ],
    },
    {
      name: 'Corporate 360°',
      price: '2.800.000',
      period: 'GNF / mois',
      features: [
        'Tout Enterprise +',
        'API complète',
        'Intégration SIRH',
        'IA prédictive',
        'Archivage sécurisé',
        'Formation équipe RH',
        'Account manager dédié',
      ],
    },
  ];

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

  if (!isRecruiter && activeSubscription) {
    const remainingDays = PremiumSubscriptionService.getRemainingDays(activeSubscription.expires_at);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-[#0E2F56] to-blue-800 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <button
            onClick={() => onNavigate('candidate-dashboard')}
            className="mb-8 flex items-center gap-2 text-white hover:text-blue-100 font-semibold transition group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Retour au tableau de bord
          </button>
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

              <div className="bg-gradient-to-r from-blue-600 to-[#0E2F56] rounded-xl p-6 text-white mb-6">
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

  if (isRecruiter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <button
            onClick={() => onNavigate('recruiter-dashboard')}
            className="mb-8 flex items-center gap-2 text-gray-700 hover:text-blue-600 font-semibold transition group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Retour au tableau de bord
          </button>

          {!canSubscribe && (
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-500 rounded-xl p-6 shadow-lg mb-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-500 bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-2">
                    Complétez votre profil pour accéder au Premium
                  </h3>
                  <p className="text-gray-700 mb-3">
                    Votre profil doit être complété à 80% minimum. Actuellement: <span className="font-bold">{completionPercentage}%</span>
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div className="bg-orange-500 h-full rounded-full transition-all" style={{ width: `${completionPercentage}%` }}></div>
                  </div>
                  <button
                    onClick={() => onNavigate('recruiter-dashboard')}
                    className="px-6 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700"
                  >
                    Compléter mon profil
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 rounded-2xl p-8 mb-8 border-2 border-orange-200">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-full mb-4 shadow-lg">
                <Zap className="w-5 h-5" />
                <span className="font-semibold">Boutique Crédits IA</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Rechargez vos crédits IA
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Utilisez nos services IA à la demande : CV Builder, Matching, Lettres de motivation et plus encore
              </p>
            </div>

            {creditPackages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
                {creditPackages.map((pkg) => {
                  const totalCredits = pkg.credits_amount + pkg.bonus_credits;
                  const bonusPercentage = Math.round((pkg.bonus_credits / pkg.credits_amount) * 100);

                  return (
                    <div
                      key={pkg.id}
                      className={`relative bg-white rounded-xl p-5 shadow-md hover:shadow-2xl transition-all hover:scale-105 ${
                        pkg.is_popular ? 'ring-2 ring-orange-500 scale-[1.02]' : ''
                      }`}
                    >
                      {pkg.is_popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Populaire
                          </span>
                        </div>
                      )}

                      {pkg.bonus_credits > 0 && (
                        <div className="absolute -top-3 -right-3">
                          <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                            <Gift className="w-3 h-3" />
                            +{bonusPercentage}%
                          </div>
                        </div>
                      )}

                      <div className="text-center mb-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-full mb-3">
                          <Zap className="w-8 h-8 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{pkg.package_name}</h3>
                        <p className="text-xs text-gray-500 mb-3">{pkg.description}</p>
                      </div>

                      <div className="text-center mb-4 p-3 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                        <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-1">
                          {totalCredits}
                        </div>
                        <div className="text-xs text-gray-600">
                          {pkg.credits_amount} + <span className="text-green-600 font-bold">{pkg.bonus_credits} bonus</span>
                        </div>
                      </div>

                      <div className="text-center mb-4">
                        <div className="text-2xl font-bold text-gray-900">
                          {CreditStoreService.formatPrice(pkg.price_amount, pkg.currency)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {Math.round(pkg.price_amount / totalCredits)} GNF / crédit
                        </div>
                      </div>

                      <button
                        onClick={() => handleBuyCredits(pkg)}
                        className={`w-full py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                          pkg.is_popular
                            ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                        }`}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Acheter
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Chargement des packs...
              </div>
            )}

            <div className="mt-6 p-4 bg-white rounded-xl border border-orange-200">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-600" />
                Que peut-on faire avec les crédits IA ?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Générer des CVs professionnels</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Matching IA candidats/offres</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Lettres de motivation personnalisées</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Simulations d'entretien</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
              <h3 className="font-bold text-gray-900 mb-2">Paiement sécurisé</h3>
              <div className="flex flex-wrap gap-3 text-sm text-gray-700">
                <span className="px-3 py-1 bg-white rounded-full font-medium border border-orange-200 flex items-center gap-2">
                  🟠 Orange Money
                </span>
                <span className="px-3 py-1 bg-white rounded-full font-medium border border-orange-200">
                  💳 Cartes bancaires
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0E2F56] via-blue-900 to-blue-800 rounded-2xl p-8 mb-8 text-white">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">Fonctionnalités Premium</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                Tous les outils pour recruter efficacement
              </h2>
              <p className="text-blue-200 max-w-2xl mx-auto">
                Découvrez notre suite complète d'outils professionnels pour optimiser votre processus de recrutement de A à Z
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {premiumFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-5 hover:bg-white/20 transition-all hover:scale-105"
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mb-3`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-blue-200">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 mb-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-full mb-4">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">Abonnements Premium RH</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Optimisez votre recrutement avec l'IA
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Des outils professionnels pour gérer tout le cycle de recrutement, de la rédaction à l'embauche
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {recruiterPlans.map((plan, index) => (
                <div
                  key={index}
                  className={`relative bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition ${
                    plan.popular ? 'ring-2 ring-blue-900 scale-105' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-900 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Le plus populaire
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="flex items-end justify-center gap-1 mb-1">
                      <span className="text-4xl font-bold text-blue-900">{plan.price}</span>
                    </div>
                    <p className="text-gray-600 text-sm">{plan.period}</p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    disabled={!canSubscribe}
                    className={`w-full py-3 rounded-lg font-semibold transition ${
                      !canSubscribe
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : plan.popular
                        ? 'bg-blue-900 hover:bg-blue-800 text-white shadow-lg'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    {!canSubscribe ? `Profil requis: ${completionPercentage}%/80%` : 'Choisir ce plan'}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-white rounded-xl border border-blue-200">
              <h3 className="font-bold text-gray-900 mb-3">Moyens de paiement acceptés</h3>
              <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                <span className="px-3 py-1 bg-orange-50 text-orange-900 rounded-full font-medium">
                  🟠 Orange Money
                </span>
                <span className="px-3 py-1 bg-blue-50 text-blue-900 rounded-full font-medium">
                  💳 LengoPay
                </span>
                <span className="px-3 py-1 bg-teal-50 text-teal-900 rounded-full font-medium">
                  💎 DigitalPay SA
                </span>
                <span className="px-3 py-1 bg-gray-50 text-gray-900 rounded-full font-medium">
                  💳 Visa / Mastercard
                </span>
              </div>
            </div>
          </div>

          {showCreditPaymentModal && selectedPackage && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">Finaliser l'achat</h3>
                    <button
                      onClick={() => setShowCreditPaymentModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-6 mb-6 border-2 border-orange-200">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-full mb-4">
                        <Zap className="w-10 h-10 text-orange-600" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">{selectedPackage.package_name}</h4>
                      <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                        {selectedPackage.credits_amount + selectedPackage.bonus_credits} crédits
                      </div>
                      <div className="text-sm text-gray-600 mb-4">
                        {selectedPackage.credits_amount} crédits + <span className="text-green-600 font-bold">{selectedPackage.bonus_credits} bonus</span>
                      </div>
                      <div className="text-3xl font-bold text-gray-900">
                        {CreditStoreService.formatPrice(selectedPackage.price_amount, selectedPackage.currency)}
                      </div>
                    </div>
                  </div>

                  <OrangeMoneyPaymentInfo
                    amount={selectedPackage.price_amount}
                    serviceName={selectedPackage.package_name}
                    userEmail={profile?.email || ''}
                    showWhatsApp={true}
                  />

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => setShowCreditPaymentModal(false)}
                      className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleCreditPurchaseComplete}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold transition shadow-lg"
                    >
                      J'ai effectué le paiement
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0E2F56] to-blue-800 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => onNavigate('candidate-dashboard')}
          className="mb-8 flex items-center gap-2 text-white hover:text-blue-100 font-semibold transition group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Retour au tableau de bord
        </button>
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
