import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Sparkles,
  Target,
  FileText,
  Mail,
  MessageCircle,
  TrendingUp,
  Video,
  Crown,
  Check,
  ArrowRight,
  Loader,
  ArrowLeft,
  Infinity
} from 'lucide-react';
import CVCentralModal from '../components/ai/CVCentralModal';
import CreditBalance from '../components/credits/CreditBalance';
import { isPremiumActive } from '../utils/premiumHelpers';

interface PremiumService {
  id: string;
  name: string;
  description: string;
  type: 'free' | 'premium';
  category: string;
  price: number;
  credits_cost: number;
  icon: string;
  features: string[];
  is_active: boolean;
}

interface UserService {
  service_id: string;
  status: string;
  expires_at: string | null;
}

const iconMap: Record<string, React.ReactNode> = {
  target: <Target className="w-8 h-8" />,
  'file-text': <FileText className="w-8 h-8" />,
  mail: <Mail className="w-8 h-8" />,
  'message-circle': <MessageCircle className="w-8 h-8" />,
  'trending-up': <TrendingUp className="w-8 h-8" />,
  video: <Video className="w-8 h-8" />,
};

interface PremiumAIServicesProps {
  onNavigate?: (page: string, param?: string) => void;
}

export default function PremiumAIServices({ onNavigate }: PremiumAIServicesProps = {}) {
  const { user, profile } = useAuth();
  const [services, setServices] = useState<PremiumService[]>([]);
  const [userServices, setUserServices] = useState<UserService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [showCVModal, setShowCVModal] = useState(false);
  const [creditsBalance, setCreditsBalance] = useState<number>(0);

  const isPremium = isPremiumActive(profile);

  useEffect(() => {
    loadServices();
    if (user) {
      loadUserServices();
      loadCreditsBalance();
    }
  }, [user]);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('premium_services')
        .select('*')
        .eq('is_active', true)
        .order('category');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserServices = async () => {
    try {
      const { data, error } = await supabase
        .from('user_premium_services')
        .select('service_id, status, expires_at')
        .eq('user_id', user!.id)
        .eq('status', 'active');

      if (error) throw error;
      setUserServices(data || []);
    } catch (error) {
      console.error('Error loading user services:', error);
    }
  };

  const loadCreditsBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('credits_balance')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      setCreditsBalance(data?.credits_balance || 0);
    } catch (error) {
      console.error('Error loading credits balance:', error);
    }
  };

  const hasAccess = (serviceId: string) => {
    return userServices.some(us => us.service_id === serviceId);
  };

  const hasEnoughCredits = (creditsCost: number) => {
    return creditsBalance >= creditsCost;
  };

  const handleServiceClick = (service: PremiumService) => {
    if (service.category === 'cv') {
      setShowCVModal(true);
      return;
    }

    if (service.category === 'chatbot') {
      alert('Le chatbot est déjà disponible en bas à droite de votre écran !');
      return;
    }

    if (service.category === 'alerts') {
      alert('Les alertes IA sont automatiquement activées pour tous les utilisateurs. Vous recevrez des notifications quand de nouvelles offres correspondent à votre profil.');
      return;
    }

    if (service.type === 'free' || hasEnoughCredits(service.credits_cost)) {
      navigateToService(service.category);
    }
  };

  const navigateToService = (category: string) => {
    const routes: Record<string, string> = {
      matching: 'ai-matching',
      cv: 'ai-cv-generator',
      cover_letter: 'ai-cover-letter',
      coaching: 'ai-coach',
      career_plan: 'ai-career-plan',
      interview: 'ai-interview-simulator',
      gold_profile: 'gold-profile',
    };

    const page = routes[category];
    if (page && onNavigate) {
      onNavigate(page);
    } else {
      alert('Ce service sera bientôt disponible !');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Back Button */}
        {onNavigate && (
          <button
            onClick={() => onNavigate('candidate-dashboard')}
            className="mb-8 flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Retour au Dashboard</span>
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-orange-500 rounded-full text-white mb-6">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold">Intelligence Artificielle</span>
          </div>

          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Services Premium d'Assistance IA
          </h1>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Améliore ton profil, booste ta candidature et développe ton plan de carrière
            avec l'intelligence artificielle
          </p>
        </div>

        {/* Credit Balance */}
        <div className="mb-8">
          <CreditBalance
            variant="prominent"
            onBuyCredits={() => onNavigate?.('credit-store')}
          />
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {services.map((service) => {
            const userHasAccess = hasAccess(service.id);
            const isServicePremium = service.type === 'premium';
            const enoughCredits = hasEnoughCredits(service.credits_cost);
            const isDisabled = !isPremium && service.credits_cost > 0 && !enoughCredits;

            return (
              <div
                key={service.id}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-blue-200"
              >
                {/* Premium User Badge */}
                {isPremium && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full text-white text-xs font-bold shadow-lg">
                      <Infinity className="w-3 h-3" />
                      ACCÈS ILLIMITÉ
                    </div>
                  </div>
                )}

                {/* Service Type Badge */}
                {!isPremium && isServicePremium && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full text-white text-xs font-bold shadow-lg">
                      <Crown className="w-3 h-3" />
                      PREMIUM
                    </div>
                  </div>
                )}

                {/* Access Badge */}
                {!isPremium && userHasAccess && (
                  <div className="absolute top-4 left-4 z-10">
                    <div className="flex items-center gap-1 px-3 py-1 bg-green-500 rounded-full text-white text-xs font-bold">
                      <Check className="w-3 h-3" />
                      Actif
                    </div>
                  </div>
                )}

                <div className="p-8">
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                    {iconMap[service.icon] || <Sparkles className="w-8 h-8" />}
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {service.name}
                  </h3>

                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {service.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {service.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Credits Cost & CTA */}
                  <div className="pt-6 border-t border-gray-100">
                    {isPremium ? (
                      <div className="mb-4">
                        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                          <Infinity className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-bold text-green-900">Accès illimité inclus</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-baseline gap-2">
                            <span className={`text-3xl font-bold ${isServicePremium ? 'text-orange-600' : 'text-green-600'}`}>
                              {service.credits_cost}
                            </span>
                            <span className="text-gray-600">crédits</span>
                          </div>
                          {!isServicePremium && service.credits_cost === 0 && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                              GRATUIT
                            </span>
                          )}
                        </div>

                        {/* Insufficient Credits Warning */}
                        {isDisabled && (
                          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700 font-medium text-center">
                              Crédits insuffisants
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    <button
                      onClick={() => {
                        if (!isPremium && isDisabled) {
                          onNavigate?.('credit-store');
                        } else {
                          handleServiceClick(service);
                        }
                      }}
                      className={`w-full py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
                        isPremium
                          ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:from-green-700 hover:to-emerald-800'
                          : isDisabled
                          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 cursor-pointer'
                          : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                      }`}
                    >
                      {isPremium ? (
                        <>
                          Utiliser le service
                          <ArrowRight className="w-5 h-5" />
                        </>
                      ) : isDisabled ? (
                        'Acheter des crédits'
                      ) : (
                        <>
                          Utiliser le service
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            );
          })}
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pourquoi choisir nos services IA ?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Des outils puissants pour maximiser vos chances de succès professionnel
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Technologie Avancée</h3>
              <p className="text-gray-600 text-sm">
                Intelligence artificielle de pointe pour des résultats professionnels
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Personnalisation</h3>
              <p className="text-gray-600 text-sm">
                Chaque service adapté à votre profil et vos objectifs
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Résultats Rapides</h3>
              <p className="text-gray-600 text-sm">
                Obtenez des résultats professionnels en quelques minutes
              </p>
            </div>
          </div>
        </div>

        {/* Premium PRO+ Section */}
        <div id="premium-pro-section" className="mt-12 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl shadow-xl border-3 border-yellow-300 overflow-hidden">
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
                    <FileText className="w-6 h-6 text-green-500 flex-shrink-0" />
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
                    <Check className="w-6 h-6 text-yellow-500 flex-shrink-0" />
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
                  onClick={() => onNavigate?.('credit-store', 'premium-pro')}
                  className="w-full px-8 py-4 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 text-white font-bold text-lg rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 mb-4"
                >
                  <Crown className="w-6 h-6" />
                  S'abonner maintenant
                </button>

                <p className="text-center text-gray-600">
                  Orange Money • LengoPay • DigitalPay SA
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCVModal && (
        <CVCentralModal
          onClose={() => {
            setShowCVModal(false);
            if (user) {
              loadCreditsBalance();
            }
          }}
        />
      )}
    </div>
  );
}