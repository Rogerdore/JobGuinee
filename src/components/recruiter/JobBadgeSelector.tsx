import { useState, useEffect } from 'react';
import { Zap, AlertTriangle, Info, CheckCircle, XCircle, Clock, Loader } from 'lucide-react';
import { jobBadgeRequestService, type BadgeEligibility } from '../../services/jobBadgeRequestService';
import { useAuth } from '../../contexts/AuthContext';

interface JobBadgeSelectorProps {
  jobId?: string;
  onBadgeRequest?: (badge_type: 'urgent' | 'featured') => void;
  showInJobForm?: boolean;
}

export default function JobBadgeSelector({ jobId, onBadgeRequest, showInJobForm = false }: JobBadgeSelectorProps) {
  const { profile } = useAuth();
  const [urgentEligibility, setUrgentEligibility] = useState<BadgeEligibility | null>(null);
  const [featuredEligibility, setFeaturedEligibility] = useState<BadgeEligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<'urgent' | 'featured' | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const isPremium = profile?.is_premium || false;
  const hasEnterprise = profile?.subscription_plan === 'enterprise' || false;

  useEffect(() => {
    checkEligibility();
  }, []);

  const checkEligibility = async () => {
    try {
      setLoading(true);
      const [urgentData, featuredData] = await Promise.all([
        jobBadgeRequestService.checkEligibility('urgent'),
        jobBadgeRequestService.checkEligibility('featured')
      ]);
      setUrgentEligibility(urgentData);
      setFeaturedEligibility(featuredData);
    } catch (error) {
      console.error('Erreur vérification éligibilité:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestBadge = (badge_type: 'urgent' | 'featured') => {
    setSelectedBadge(badge_type);
    if (onBadgeRequest) {
      onBadgeRequest(badge_type);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-6 h-6 animate-spin text-[#0E2F56]" />
        <span className="ml-2 text-gray-600">Vérification éligibilité...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-1">
              Boostez la visibilité de votre offre
            </h4>
            <p className="text-sm text-blue-800">
              Les badges premium augmentent significativement le nombre de candidatures reçues.
              <button
                onClick={() => setShowInfoModal(true)}
                className="ml-1 text-blue-600 underline font-medium"
              >
                En savoir plus
              </button>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`relative bg-gradient-to-br from-red-50 to-red-100 border-2 ${
          selectedBadge === 'urgent' ? 'border-red-500 ring-2 ring-red-300' : 'border-red-300'
        } rounded-xl p-6 transition-all cursor-pointer hover:shadow-lg`}
          onClick={() => urgentEligibility?.can_request && handleRequestBadge('urgent')}
        >
          {selectedBadge === 'urgent' && (
            <div className="absolute top-3 right-3">
              <CheckCircle className="w-6 h-6 text-red-600" />
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-600 rounded-xl shadow-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-red-900">URGENT</h3>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4 text-red-700" />
                <span className="text-sm font-medium text-red-700">7 jours</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-red-900">Badge rouge animé visible</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-red-900">Top 50 offres récentes</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-red-900">+85% de clics supplémentaires</span>
            </div>
          </div>

          <div className="border-t-2 border-red-300 pt-4 mt-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-900 mb-1">
                {jobBadgeRequestService.formatPrice(500000)}
              </div>
              <div className="text-sm text-red-700 font-medium">
                Validation admin requise
              </div>
            </div>
          </div>

          {urgentEligibility && (
            <div className="mt-4">
              {urgentEligibility.can_request ? (
                <div className="bg-white bg-opacity-60 rounded-lg p-3 text-center">
                  <span className="text-sm font-medium text-red-900">
                    {urgentEligibility.remaining} badge(s) disponible(s)
                  </span>
                </div>
              ) : (
                <div className="bg-red-200 rounded-lg p-3 text-center">
                  <span className="text-xs text-red-900 font-medium">
                    {urgentEligibility.reason}
                  </span>
                </div>
              )}
            </div>
          )}

          {!urgentEligibility?.can_request && (
            <div className="absolute inset-0 bg-gray-900 bg-opacity-40 rounded-xl flex items-center justify-center">
              <div className="bg-white rounded-lg px-4 py-2 shadow-xl">
                <span className="text-sm font-semibold text-gray-900">Limite atteinte</span>
              </div>
            </div>
          )}
        </div>

        <div className={`relative bg-gradient-to-br from-orange-50 to-orange-100 border-2 ${
          selectedBadge === 'featured' ? 'border-[#FF8C00] ring-2 ring-orange-300' : 'border-orange-300'
        } rounded-xl p-6 transition-all cursor-pointer hover:shadow-lg`}
          onClick={() => featuredEligibility?.can_request && handleRequestBadge('featured')}
        >
          {selectedBadge === 'featured' && (
            <div className="absolute top-3 right-3">
              <CheckCircle className="w-6 h-6 text-[#FF8C00]" />
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-[#FF8C00] to-orange-600 rounded-xl shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-orange-900">À LA UNE</h3>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4 text-[#FF8C00]" />
                <span className="text-sm font-medium text-[#FF8C00]">30 jours</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-[#FF8C00] mt-0.5 flex-shrink-0" />
              <span className="text-sm text-orange-900">Badge orange premium</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-[#FF8C00] mt-0.5 flex-shrink-0" />
              <span className="text-sm text-orange-900">Top 100 offres récentes</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-[#FF8C00] mt-0.5 flex-shrink-0" />
              <span className="text-sm text-orange-900">+200% de visibilité garantie</span>
            </div>
          </div>

          <div className="border-t-2 border-orange-300 pt-4 mt-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-900 mb-1">
                {jobBadgeRequestService.formatPrice(500000)}
              </div>
              <div className="text-sm text-[#FF8C00] font-medium">
                Validation admin requise
              </div>
            </div>
          </div>

          {featuredEligibility && (
            <div className="mt-4">
              {featuredEligibility.can_request ? (
                <div className="bg-white bg-opacity-60 rounded-lg p-3 text-center">
                  <span className="text-sm font-medium text-orange-900">
                    {featuredEligibility.remaining} badge(s) disponible(s)
                  </span>
                </div>
              ) : (
                <div className="bg-orange-200 rounded-lg p-3 text-center">
                  <span className="text-xs text-orange-900 font-medium">
                    {featuredEligibility.reason}
                  </span>
                </div>
              )}
            </div>
          )}

          {!featuredEligibility?.can_request && (
            <div className="absolute inset-0 bg-gray-900 bg-opacity-40 rounded-xl flex items-center justify-center">
              <div className="bg-white rounded-lg px-4 py-2 shadow-xl">
                <span className="text-sm font-semibold text-gray-900">Limite atteinte</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {showInJobForm && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-700 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-900 mb-1">
                Activation soumise à validation
              </h4>
              <p className="text-sm text-yellow-800">
                Votre demande de badge sera envoyée à l'administration pour validation.
                Le badge sera activé sous 24-48h après approbation et confirmation de paiement.
              </p>
            </div>
          </div>
        </div>
      )}

      {(!isPremium && !hasEnterprise) && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-6 h-6 text-blue-600" />
            <h4 className="font-bold text-blue-900">Passez Premium pour plus de badges</h4>
          </div>
          <p className="text-sm text-blue-800 mb-4">
            Les comptes Premium et Enterprise peuvent activer plus de badges simultanément.
          </p>
          <button
            onClick={() => window.location.href = '/premium/subscribe'}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Découvrir Premium
          </button>
        </div>
      )}

      {showInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 bg-gradient-to-r from-[#0E2F56] to-blue-600 text-white">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Info className="w-6 h-6" />
                Badges Premium - Guide Complet
              </h3>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Badge URGENT (7 jours)
                </h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Affichage prioritaire dans les 50 offres les plus récentes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Badge rouge animé qui attire immédiatement l'attention</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>+85% de clics supplémentaires en moyenne</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Recommandé pour les postes urgents ou deadlines proches</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#FF8C00]" />
                  Badge À LA UNE (30 jours)
                </h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Affichage prioritaire dans les 100 offres les plus récentes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Badge orange premium haute visibilité</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>+200% de visibilité garantie pendant 30 jours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Idéal pour les postes stratégiques et difficiles à pourvoir</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-bold text-gray-900 mb-2">Limites par type de compte</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Compte Gratuit:</span>
                    <span className="font-semibold">2 badges max simultanés</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Compte Premium:</span>
                    <span className="font-semibold">5 badges max simultanés</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Compte Enterprise:</span>
                    <span className="font-semibold">10 badges max simultanés</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                <h4 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Process de validation
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
                  <li>Vous demandez un badge lors de la publication</li>
                  <li>L'administration valide votre demande sous 24-48h</li>
                  <li>Vous recevez les instructions de paiement (Orange Money / MTN)</li>
                  <li>Le badge est activé après confirmation du paiement</li>
                </ol>
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-6 py-2.5 bg-[#0E2F56] text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                J'ai compris
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
