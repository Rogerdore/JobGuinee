import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getUserServiceAccessList, ServiceAccessInfo } from '../utils/serviceAccess';
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
  ArrowLeft,
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
  creditsByService: {
    [serviceCode: string]: number;
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
  onBack?: () => void;
}

export default function PremiumAIServices({ onNavigate, onBack }: PremiumAIServicesProps = {}) {
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
  const [grantedServices, setGrantedServices] = useState<Record<string, ServiceAccessInfo>>({});

  const defaultServices: ServiceConfig[] = [
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
      credits: 1,
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

  const [services, setServices] = useState<ServiceConfig[]>(defaultServices);

  useEffect(() => {
    const loadAll = async () => {
      await loadServicesFromDB();
      if (user) {
        await loadPremiumStatus();
        await loadAdminPhoneNumber();
        await loadGrantedServices();
      } else {
        // Si pas d'utilisateur, afficher quand même la page avec services par défaut
        setPremiumStatus({
          subscription_type: 'free',
          status: 'active',
          credits: {
            global_balance: {
              available: 0,
              used: 0,
              total: 0
            }
          },
          creditsByService: {}
        });
        setLoading(false);
      }
    };
    loadAll();
  }, [user]);

  const loadGrantedServices = async () => {
    if (!user) return;

    try {
      const accessMap = await getUserServiceAccessList(user.id);
      setGrantedServices(accessMap);
    } catch (error) {
      console.error('Error loading granted services:', error);
    }
  };

  const loadServicesFromDB = async () => {
    try {
      const { data: creditCosts } = await supabase
        .from('service_credit_costs')
        .select('*')
        .eq('is_active', true);

      if (creditCosts && creditCosts.length > 0) {
        const updatedServices = defaultServices.map(service => {
          const dbService = creditCosts.find(c => c.service_code === service.serviceType);
          if (dbService) {
            return {
              ...service,
              credits: dbService.credits_cost,
            };
          }
          return service;
        });
        setServices(updatedServices);
      } else {
        setServices(defaultServices);
      }
    } catch (error) {
      console.error('Error loading services from DB:', error);
      setServices(defaultServices);
    }
  };

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

      const { data: userCredits } = await supabase
        .from('user_service_credits')
        .select(`
          credits_balance,
          premium_services!inner(code)
        `)
        .eq('user_id', user.id);

      let totalBalance = 0;
      const creditsByService: { [key: string]: number } = {};

      if (userCredits && userCredits.length > 0) {
        totalBalance = userCredits.reduce((sum, credit) => sum + credit.credits_balance, 0);

        userCredits.forEach(credit => {
          const serviceCode = (credit as any).premium_services?.code;
          if (serviceCode) {
            creditsByService[serviceCode] = credit.credits_balance;
          }
        });
      }

      console.log('Credits loaded:', { totalBalance, creditsByService });

      setPremiumStatus({
        subscription_type: totalBalance > 0 ? 'premium' : 'free',
        status: 'active',
        credits: {
          global_balance: {
            available: totalBalance,
            used: 0,
            total: totalBalance
          }
        },
        creditsByService
      });

      console.log('Premium status set successfully');
    } catch (error: any) {
      console.error('Erreur chargement status:', error);
      setPremiumStatus({
        subscription_type: 'free',
        status: 'active',
        credits: {
          global_balance: {
            available: 0,
            used: 0,
            total: 0
          }
        },
        creditsByService: {}
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
    <div className="max-w-7xl mx-auto px-4">
      {/* Bouton de retour */}
      <div className="mb-6">
        <button
          onClick={() => {
            if (onBack) {
              onBack();
            } else {
              window.history.back();
            }
          }}
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-900 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Retour</span>
        </button>
      </div>

      {/* En-tête Principal */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-500 rounded-full mb-6">
          <Crown className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Services Premium IA</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Boostez votre recherche d'emploi avec nos services intelligents propulsés par l'IA
        </p>
      </div>

      {/* Boutons d'action principaux */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          }}
          className="bg-blue-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-800 transition flex items-center space-x-2"
        >
          <Sparkles className="w-5 h-5" />
          <span>Découvrir tous les services IA</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onNavigate?.('ai-coach')}
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition flex items-center space-x-2"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Chatbot Emploi</span>
        </button>
      </div>

      {/* Bannière Abonnement et Crédits */}
      {premiumStatus && (
        <div className="space-y-4 mb-8">
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  Abonnement {premiumStatus.subscription_type === 'free' ? 'Gratuit' : 'Premium'}
                </h2>
                <p className="text-blue-100">
                  Statut: {premiumStatus.status === 'active' ? 'Actif' : 'Inactif'}
                </p>
              </div>
              <div className="bg-orange-500 rounded-xl p-3">
                <Crown className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>

          {/* Bannière Solde de Crédits */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Solde de Crédits
                </h3>
                <p className="text-3xl font-bold mb-1">
                  {premiumStatus.credits.global_balance.available.toLocaleString()}
                </p>
                <p className="text-green-100 text-sm">
                  crédits disponibles pour tous les services IA
                </p>
              </div>
              <div className="text-right">
                <CreditCard className="w-12 h-12 text-white opacity-80 mb-2" />
                {premiumStatus.credits.global_balance.available > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs bg-white bg-opacity-20 px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Actif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs bg-red-500 bg-opacity-80 px-3 py-1 rounded-full">
                    <AlertCircle className="w-3 h-3" />
                    Épuisé
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Services Grid - 3 colonnes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => {
          const Icon = service.icon;
          const globalBalance = premiumStatus?.credits?.global_balance?.available || 0;
          const serviceBalance = premiumStatus?.creditsByService?.[service.serviceType] || 0;
          const serviceCost = service.credits || 0;
          const hasEnoughCredits = serviceBalance >= serviceCost;

          const grantedAccess = grantedServices[service.serviceType];
          const hasAdminAccess = grantedAccess?.hasAccess && !grantedAccess?.isExpired;
          const canUseService = service.isIncluded || hasAdminAccess || hasEnoughCredits;

          return (
            <div
              key={service.id}
              className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              {/* En-tête coloré */}
              <div className={`bg-gradient-to-br ${service.color} p-6 text-white relative`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <Icon className="w-8 h-8" />
                  </div>
                  {hasAdminAccess ? (
                    <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Accordé</span>
                    </span>
                  ) : service.isIncluded ? (
                    <span className="px-3 py-1 bg-white text-gray-900 rounded-full text-xs font-bold">
                      Inclus
                    </span>
                  ) : service.credits ? (
                    <span className="px-3 py-1 bg-white bg-opacity-30 backdrop-blur-sm rounded-full text-xs font-bold flex items-center space-x-1">
                      <span>{service.credits}</span>
                      <Zap className="w-3 h-3" />
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-white bg-opacity-30 backdrop-blur-sm rounded-full text-xs font-bold">
                      {formatPrice(service.price)}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2">{service.name}</h3>
                <p className="text-white text-opacity-90 text-sm">{service.description}</p>
              </div>

              {/* Contenu */}
              <div className="p-5 bg-white">
                {/* Badge d'accès accordé */}
                {hasAdminAccess && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 mb-1">
                      <Shield className="w-4 h-4" />
                      <span className="text-sm font-semibold">Accès gratuit accordé</span>
                    </div>
                    <p className="text-xs text-green-600">
                      {grantedAccess?.expiresAt
                        ? `Expire le ${new Date(grantedAccess.expiresAt).toLocaleDateString('fr-FR')}`
                        : 'Accès illimité'}
                    </p>
                  </div>
                )}

                {/* Crédits disponibles */}
                {!service.isIncluded && !hasAdminAccess && (
                  <div className="mb-5">
                    {hasEnoughCredits ? (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-800">Crédits suffisants</span>
                          </div>
                          <span className="text-2xl font-bold text-blue-900">
                            {serviceBalance}
                          </span>
                        </div>
                        <p className="text-xs text-blue-700">
                          Coût du service : <strong>{serviceCost}</strong> crédit(s)
                        </p>
                        <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                          <div
                            className="h-2 rounded-full bg-blue-600 transition-all"
                            style={{
                              width: `${Math.min((serviceBalance / serviceCost) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <span className="text-sm font-semibold text-red-800">Crédits insuffisants</span>
                          </div>
                          <span className="text-2xl font-bold text-red-600">
                            {serviceBalance}
                          </span>
                        </div>
                        <p className="text-xs text-red-700">
                          Coût du service : <strong>{serviceCost}</strong> crédit(s)<br/>
                          Il vous manque : <strong>{serviceCost - serviceBalance}</strong> crédit(s)
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Fonctionnalités */}
                <ul className="space-y-2 mb-5">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Boutons d'action */}
                {canUseService ? (
                  <button
                    onClick={() => handleUseService(service)}
                    className="w-full bg-blue-900 text-white px-5 py-3 rounded-lg font-medium hover:bg-blue-800 transition flex items-center justify-center space-x-2"
                  >
                    <Zap className="w-4 h-4" />
                    <span className="text-sm">Utiliser le service</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handlePurchase(service)}
                    className="w-full bg-orange-500 text-white px-5 py-3 rounded-lg font-medium hover:bg-orange-600 transition flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="text-sm">Acheter des crédits</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de paiement */}
      {showPaymentModal && selectedService && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={() => {
            setShowPaymentModal(false);
            setSelectedService(null);
            setShowDirectPayment(false);
            setPaymentMethod('orange_money');
            setPhoneNumber('');
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-8 my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
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

                  <button
                    onClick={() => {
                      setShowDirectPayment(true);
                      setPaymentMethod('direct_admin');
                    }}
                    className={`w-full p-4 rounded-lg border-2 transition ${
                      showDirectPayment
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Phone className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900">Paiement direct à l'admin</div>
                          <div className="text-xs text-gray-500">Contactez l'administrateur par téléphone</div>
                        </div>
                      </div>
                      {showDirectPayment && (
                        <CheckCircle2 className="w-5 h-5 text-orange-600" />
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {showDirectPayment ? (
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 bg-orange-500 rounded-lg">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-orange-900 text-lg">Contactez l'administrateur</h4>
                      <p className="text-sm text-orange-700">Pour un paiement direct et rapide</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {adminPhoneNumber ? (
                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <p className="text-sm text-gray-600 mb-2 font-medium">Numéro de téléphone:</p>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-gray-900">{adminPhoneNumber}</span>
                          <button
                            onClick={() => copyToClipboard(adminPhoneNumber)}
                            className="p-3 text-orange-600 hover:bg-orange-100 rounded-lg transition"
                            title="Copier le numéro"
                          >
                            <Copy className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-start space-x-3">
                          <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900 mb-1">Numéro non disponible</p>
                            <p className="text-sm text-gray-600">L'administrateur n'a pas encore configuré son numéro de téléphone. Veuillez réessayer plus tard ou utiliser un autre moyen de paiement.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <p className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                        <CheckCircle2 className="w-5 h-5 text-orange-600" />
                        <span>Instructions de paiement:</span>
                      </p>
                      <ol className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start space-x-2">
                          <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                          <span>Appelez ou envoyez un message WhatsApp au numéro ci-dessus</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                          <span>Mentionnez le service: <span className="font-semibold text-orange-900">{selectedService.name}</span></span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                          <span>Effectuez le paiement de <span className="font-semibold text-orange-900">{formatPrice(selectedService.price)}</span></span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                          <span>L'admin activera votre service immédiatement après confirmation du paiement</span>
                        </li>
                      </ol>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-800">
                          <span className="font-semibold">Paiement sécurisé:</span> Effectuez votre paiement directement auprès de l'administrateur. Vos crédits seront activés dès réception du paiement.
                        </p>
                      </div>
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
