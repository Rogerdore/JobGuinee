import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Crown,
  Brain,
  FileText,
  Bell,
  MessageCircle,
  BarChart3,
  Users,
  Check,
  X,
  Sparkles,
  Zap,
  CreditCard,
  Loader,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Phone,
  Copy,
  Shield,
} from 'lucide-react';

interface PremiumStatus {
  subscription_type: string;
  status: string;
  credits: {
    [key: string]: {
      available: number;
      used: number;
      total: number;
    };
  };
}

interface ServiceConfig {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  price: number;
  isIncluded: boolean;
  credits?: number;
  features: string[];
  serviceType: string;
}

interface PremiumAIServicesProps {
  onNavigate?: (page: string) => void;
}

export default function PremiumAIServices({ onNavigate }: PremiumAIServicesProps = {}) {
  const { user } = useAuth();
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasingService, setPurchasingService] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceConfig | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('orange_money');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [adminPhoneNumber, setAdminPhoneNumber] = useState<string>('');
  const [showDirectPayment, setShowDirectPayment] = useState(false);

  const services: ServiceConfig[] = [
    {
      id: 'profile_analysis',
      name: 'Analyse IA de profil',
      description: 'Score CV vs offre + suggestions formations',
      icon: Brain,
      color: 'from-purple-500 to-purple-600',
      price: 25000,
      isIncluded: false,
      credits: 50,
      serviceType: 'profile_analysis',
      features: [
        'Analyse complète du profil',
        'Score de compatibilité avec offres',
        'Suggestions de formations personnalisées',
        'Recommandations d\'amélioration',
      ],
    },
    {
      id: 'cv_generation',
      name: 'Création CV / Lettre IA',
      description: 'Génération automatique design professionnel',
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      price: 100000,
      isIncluded: false,
      credits: 1,
      serviceType: 'cv_generation',
      features: [
        'Génération CV professionnel',
        'Création lettre de motivation',
        'Design moderne et ATS-friendly',
        'Export PDF haute qualité',
      ],
    },
    {
      id: 'smart_alerts',
      name: 'Alertes IA ciblées',
      description: 'Détection auto d\'offres correspondantes',
      icon: Bell,
      color: 'from-orange-500 to-orange-600',
      price: 0,
      isIncluded: true,
      serviceType: 'smart_alerts',
      features: [
        'Alertes intelligentes personnalisées',
        'Matching avancé IA',
        'Notifications multi-canal',
        'Suggestions d\'offres similaires',
      ],
    },
    {
      id: 'chatbot',
      name: 'Chatbot Travail & Emploi',
      description: 'Réponses Code du Travail guinéen',
      icon: MessageCircle,
      color: 'from-green-500 to-green-600',
      price: 0,
      isIncluded: true,
      credits: 100,
      serviceType: 'chatbot_queries',
      features: [
        'Conseils juridiques emploi',
        'Code du Travail guinéen',
        'Réponses instantanées 24/7',
        'Historique des conversations',
      ],
    },
    {
      id: 'monthly_report',
      name: 'Rapport mensuel IA',
      description: 'Stats candidatures, matching, formations',
      icon: BarChart3,
      color: 'from-indigo-500 to-indigo-600',
      price: 150000,
      isIncluded: false,
      serviceType: 'monthly_report',
      features: [
        'Rapport détaillé mensuel',
        'Statistiques de candidatures',
        'Analyse de performance',
        'Recommandations stratégiques',
      ],
    },
    {
      id: 'career_coaching',
      name: 'Coaching carrière IA',
      description: 'Simulations entretien + feedbacks',
      icon: Users,
      color: 'from-pink-500 to-pink-600',
      price: 250000,
      isIncluded: false,
      credits: 3,
      serviceType: 'career_coaching',
      features: [
        'Simulations d\'entretien IA',
        'Feedback personnalisé détaillé',
        'Préparation questions techniques',
        '3 sessions de coaching',
      ],
    },
    {
      id: 'verified_badge',
      name: 'Badge Profil Vérifié',
      description: 'Certification de votre profil avec badge visible pour augmenter votre crédibilité auprès des recruteurs.',
      icon: Shield,
      color: 'from-yellow-500 to-yellow-600',
      price: 50000,
      isIncluded: false,
      serviceType: 'verified_badge',
      features: [
        'Vérification d\'identité complète',
        'Badge visible sur votre profil',
        'Score de crédibilité IA',
        'Augmentation de visibilité +30%',
        'Priorité dans les recherches',
        'Confiance accrue des recruteurs',
        'Valable 1 an',
      ],
    },
  ];

  useEffect(() => {
    if (user) {
      loadPremiumStatus();
      loadAdminPhoneNumber();
    }
  }, [user]);

  const loadAdminPhoneNumber = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('phone')
        .eq('user_type', 'admin')
        .single();

      if (!error && data?.phone) {
        setAdminPhoneNumber(data.phone);
      }
    } catch (error) {
      console.error('Erreur chargement numéro admin:', error);
    }
  };

  const loadPremiumStatus = async () => {
    if (!user) return;

    try {
      console.log('Loading premium status for user:', user.id);

      // Récupérer le solde de crédits global
      const { data: balance, error } = await supabase.rpc('get_user_credit_balance', {
        p_user_id: user.id
      });

      console.log('Balance response:', { balance, error });

      if (error) {
        console.error('Error loading balance:', error);
        throw error;
      }

      const creditBalance = balance || 0;

      // Créer un status fictif pour compatibilité avec l'interface
      setPremiumStatus({
        subscription_type: creditBalance > 0 ? 'premium' : 'free',
        status: 'active',
        credits: {
          // Le nouveau système utilise un solde global
          // On simule l'ancien format pour la compatibilité
          global_balance: {
            available: creditBalance,
            used: 0,
            total: creditBalance
          }
        }
      });

      console.log('Premium status set successfully');
    } catch (error: any) {
      console.error('Erreur chargement status:', error);
      // Même en cas d'erreur, on affiche la page avec un solde de 0
      setPremiumStatus({
        subscription_type: 'free',
        status: 'active',
        credits: {
          global_balance: {
            available: 0,
            used: 0,
            total: 0
          }
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (service: ServiceConfig) => {
    setSelectedService(service);
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    if (!user || !selectedService) return;

    setPurchasingService(selectedService.id);
    try {
      // Simuler un paiement (en production, intégrer Orange Money, MTN, etc.)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Acheter les crédits
      const { error } = await supabase.rpc('purchase_service_credits', {
        p_user_id: user.id,
        p_service_type: selectedService.serviceType,
        p_credits: selectedService.credits || 1,
        p_amount: selectedService.price,
        p_payment_method: paymentMethod,
        p_payment_reference: `${paymentMethod}_${Date.now()}`,
      });

      if (error) throw error;

      alert(`Service "${selectedService.name}" acheté avec succès!`);
      setShowPaymentModal(false);
      setSelectedService(null);
      setPhoneNumber('');
      loadPremiumStatus();
    } catch (error: any) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'achat: ' + error.message);
    } finally {
      setPurchasingService(null);
    }
  };

  const handleUseService = async (service: ServiceConfig) => {
    if (!user) return;

    // Naviguer vers le service approprié
    switch (service.id) {
      case 'profile_analysis':
        onNavigate?.('ai-matching');
        break;
      case 'cv_generation':
        onNavigate?.('ai-cv-generator');
        break;
      case 'career_coaching':
        onNavigate?.('ai-coach');
        break;
      default:
        alert(`Service ${service.name} bientôt disponible!`);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-GN').format(price) + ' GNF';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Numéro copié!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-900 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full mb-6">
          <Crown className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Services Premium IA</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Boostez votre recherche d'emploi avec nos services intelligents propulsés par l'IA
        </p>
      </div>

      {/* Boutons d'action */}
      <div className="flex justify-center space-x-4 mb-12">
        <button
          onClick={() => {
            /* Scroll to services */
          }}
          className="bg-blue-900 text-white px-8 py-4 rounded-xl font-medium hover:bg-blue-800 transition flex items-center space-x-3 shadow-lg"
        >
          <Sparkles className="w-6 h-6" />
          <span>Découvrir tous les services IA</span>
          <ArrowRight className="w-5 h-5" />
        </button>
        <button
          onClick={() => alert('Chatbot bientôt disponible!')}
          className="bg-green-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-green-700 transition flex items-center space-x-3 shadow-lg"
        >
          <MessageCircle className="w-6 h-6" />
          <span>Chatbot Emploi</span>
        </button>
      </div>

      {/* Statut Premium */}
      {premiumStatus && (
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-8 mb-12 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">
                Abonnement {premiumStatus.subscription_type === 'free' ? 'Gratuit' : 'Premium'}
              </h3>
              <p className="text-blue-100">
                Statut: {premiumStatus.status === 'active' ? 'Actif' : 'Inactif'}
              </p>
            </div>
            <Crown className="w-16 h-16 text-orange-400" />
          </div>
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service) => {
          const Icon = service.icon;
          const globalBalance = premiumStatus?.credits?.global_balance?.available || 0;
          const serviceCost = service.credits || 0;
          const hasEnoughCredits = globalBalance >= serviceCost;

          return (
            <div
              key={service.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition border-2 border-transparent hover:border-blue-100"
            >
              {/* En-tête coloré */}
              <div className={`bg-gradient-to-br ${service.color} p-8 text-white relative`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Icon className="w-8 h-8" />
                  </div>
                  {service.isIncluded ? (
                    <span className="px-3 py-1 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-sm font-medium">
                      Inclus
                    </span>
                  ) : service.credits ? (
                    <span className="px-3 py-1 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-sm font-medium">
                      {service.credits} ⚡
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-sm font-medium">
                      {formatPrice(service.price)}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold mb-2">{service.name}</h3>
                <p className="text-white text-opacity-90">{service.description}</p>
              </div>

              {/* Contenu */}
              <div className="p-6">
                {/* Crédits */}
                {!service.isIncluded && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Crédits disponibles</span>
                      <span className={`text-2xl font-bold ${hasEnoughCredits ? 'text-blue-900' : 'text-red-600'}`}>
                        {globalBalance}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${hasEnoughCredits ? 'bg-blue-600' : 'bg-red-500'}`}
                        style={{
                          width: `${Math.min((globalBalance / serviceCost) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      0 / {globalBalance} utilisés
                    </p>
                  </div>
                )}

                {/* Fonctionnalités */}
                <ul className="space-y-3 mb-6">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Actions */}
                {service.isIncluded ? (
                  <button
                    onClick={() => handleUseService(service)}
                    className="w-full bg-blue-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-800 transition flex items-center justify-center space-x-2"
                  >
                    <Zap className="w-5 h-5" />
                    <span>Utiliser le service</span>
                  </button>
                ) : hasEnoughCredits ? (
                  <button
                    onClick={() => handleUseService(service)}
                    className="w-full bg-blue-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-800 transition flex items-center justify-center space-x-2"
                  >
                    <Zap className="w-5 h-5" />
                    <span>Utiliser le service</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handlePurchase(service)}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Acheter des crédits</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de paiement */}
      {showPaymentModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Acheter le service</h2>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedService(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                {selectedService.name}
              </h3>
              <p className="text-gray-600 mb-4">{selectedService.description}</p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Prix</span>
                  <span className="text-2xl font-bold text-blue-900">
                    {formatPrice(selectedService.price)}
                  </span>
                </div>
                {selectedService.credits && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-700">Crédits</span>
                    <span className="font-semibold text-blue-900">
                      {selectedService.credits} crédit(s)
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Méthode de paiement
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'orange_money', label: 'Orange Money' },
                    { value: 'mtn_money', label: 'MTN Mobile Money' },
                    { value: 'moov_money', label: 'Moov Money' },
                  ].map((method) => (
                    <button
                      key={method.value}
                      onClick={() => {
                        setPaymentMethod(method.value);
                        setShowDirectPayment(false);
                      }}
                      className={`w-full p-4 rounded-lg border-2 transition flex items-center justify-between ${
                        paymentMethod === method.value && !showDirectPayment
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium text-gray-900">{method.label}</span>
                      {paymentMethod === method.value && !showDirectPayment && (
                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      )}
                    </button>
                  ))}

                  {adminPhoneNumber && (
                    <button
                      onClick={() => {
                        setShowDirectPayment(true);
                        setPaymentMethod('direct_admin');
                      }}
                      className={`w-full p-4 rounded-lg border-2 transition ${
                        showDirectPayment
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Phone className="w-5 h-5 text-orange-600" />
                          <span className="font-medium text-gray-900">Paiement direct à l'admin</span>
                        </div>
                        {showDirectPayment && (
                          <CheckCircle2 className="w-5 h-5 text-orange-600" />
                        )}
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {showDirectPayment && adminPhoneNumber ? (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 mb-3 flex items-center space-x-2">
                    <Phone className="w-5 h-5" />
                    <span>Contactez l'administrateur</span>
                  </h4>

                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Numéro de téléphone:</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900">{adminPhoneNumber}</span>
                        <button
                          onClick={() => copyToClipboard(adminPhoneNumber)}
                          className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition"
                          title="Copier le numéro"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-sm text-orange-800 space-y-2">
                      <p className="font-medium">Instructions:</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Appelez ou envoyez un message à ce numéro</li>
                        <li>Mentionnez le service: <span className="font-semibold">{selectedService.name}</span></li>
                        <li>Effectuez le paiement de <span className="font-semibold">{formatPrice(selectedService.price)}</span></li>
                        <li>L'admin activera votre service après confirmation</li>
                      </ol>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de téléphone
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Ex: 628 XX XX XX"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {!showDirectPayment && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Note</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Vous recevrez une notification pour confirmer le paiement sur votre téléphone.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              {showDirectPayment ? (
                <button
                  onClick={() => {
                    alert('Contactez l\'admin au ' + adminPhoneNumber + ' pour finaliser votre achat. Votre service sera activé après confirmation du paiement.');
                    setShowPaymentModal(false);
                    setSelectedService(null);
                    setShowDirectPayment(false);
                  }}
                  className="flex-1 bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 transition flex items-center justify-center space-x-2"
                >
                  <Phone className="w-5 h-5" />
                  <span>J'ai compris</span>
                </button>
              ) : (
                <button
                  onClick={processPayment}
                  disabled={purchasingService !== null || !phoneNumber}
                  className="flex-1 bg-blue-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {purchasingService ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Traitement...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>Payer {formatPrice(selectedService.price)}</span>
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedService(null);
                  setShowDirectPayment(false);
                }}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
