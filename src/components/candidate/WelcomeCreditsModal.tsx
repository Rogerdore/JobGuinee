import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Gift,
  Sparkles,
  X,
  CheckCircle2,
  Crown,
  ArrowRight,
  Brain,
  FileText,
  Bell,
  MessageCircle,
  BarChart3,
  Users,
} from 'lucide-react';

interface WelcomeCredit {
  service_name: string;
  credits_available: number;
  service_value: string;
  description: string;
}

interface WelcomeCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToServices: () => void;
}

export default function WelcomeCreditsModal({
  isOpen,
  onClose,
  onNavigateToServices,
}: WelcomeCreditsModalProps) {
  const { user } = useAuth();
  const [credits, setCredits] = useState<WelcomeCredit[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      loadWelcomeCredits();
    }
  }, [isOpen, user]);

  const loadWelcomeCredits = async () => {
    if (!user) return;

    try {
      // Récupérer le résumé des crédits
      const { data: creditsData, error: creditsError } = await supabase.rpc(
        'get_welcome_credits_summary',
        { p_user_id: user.id }
      );

      if (creditsError) throw creditsError;

      // Récupérer la valeur totale
      const { data: valueData, error: valueError } = await supabase.rpc(
        'calculate_free_credits_value',
        { p_user_id: user.id }
      );

      if (valueError) throw valueError;

      setCredits(creditsData || []);
      setTotalValue(valueData || 0);
    } catch (error: any) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const getServiceIcon = (serviceName: string) => {
    if (serviceName.includes('Analyse')) return Brain;
    if (serviceName.includes('CV') || serviceName.includes('Lettre')) return FileText;
    if (serviceName.includes('Alertes')) return Bell;
    if (serviceName.includes('Chatbot')) return MessageCircle;
    if (serviceName.includes('Rapport')) return BarChart3;
    if (serviceName.includes('Coaching')) return Users;
    return Sparkles;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-GN').format(price) + ' GNF';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête festif */}
        <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-20 translate-y-20"></div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-4 backdrop-blur-sm">
              <Gift className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Bienvenue sur JobGuinée! 🎉</h2>
            <p className="text-xl text-white text-opacity-90">
              Découvrez vos crédits gratuits pour tester nos services premium IA
            </p>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-8">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-900"></div>
              <p className="mt-4 text-gray-600">Chargement de vos crédits...</p>
            </div>
          ) : (
            <>
              {/* Valeur totale */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 mb-8 border-2 border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 mb-1">Valeur totale de vos crédits gratuits</p>
                    <p className="text-3xl font-bold text-purple-900">
                      {formatPrice(totalValue)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      + Services illimités inclus
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              {/* Liste des crédits */}
              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <Sparkles className="w-6 h-6 text-orange-500" />
                  <span>Vos crédits gratuits</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {credits.map((credit, index) => {
                    const Icon = getServiceIcon(credit.service_name);
                    return (
                      <div
                        key={index}
                        className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 transition"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-blue-900" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="font-semibold text-gray-900 text-sm">
                                {credit.service_name}
                              </h4>
                              {credit.service_value !== 'Illimité' &&
                               credit.service_value !== 'Inclus' &&
                               credit.service_value !== 'Gratuit' && (
                                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                                  {credit.service_value}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {credit.description}
                            </p>
                            <div className="flex items-center space-x-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-gray-900">
                                {credit.credits_available > 900
                                  ? 'Illimité'
                                  : `${credit.credits_available} crédit${credit.credits_available > 1 ? 's' : ''}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Informations importantes */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
                <div className="flex items-start space-x-3">
                  <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Comment utiliser vos crédits ?
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Accédez aux services premium depuis votre dashboard</li>
                      <li>• Testez chaque service gratuitement avec vos crédits</li>
                      <li>• Rechargez facilement via Orange Money, MTN ou Moov</li>
                      <li>• Les crédits n'expirent pas, utilisez-les quand vous voulez</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToServices();
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-900 to-blue-700 text-white px-6 py-4 rounded-xl font-medium hover:from-blue-800 hover:to-blue-600 transition flex items-center justify-center space-x-2 shadow-lg"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Découvrir les services premium</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
                >
                  Plus tard
                </button>
              </div>

              {/* Message de motivation */}
              <p className="text-center text-sm text-gray-500 mt-6">
                🚀 Profitez de ces crédits pour booster votre recherche d'emploi!
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
