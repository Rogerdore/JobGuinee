import { useState, useEffect } from 'react';
import { Check, Sparkles, AlertTriangle, Lock, Zap, ShoppingCart, Gift } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { calculateRecruiterCompletion, getCompletionStatus } from '../../utils/profileCompletion';
import { CreditStoreService, CreditPackage } from '../../services/creditStoreService';
import OrangeMoneyPaymentInfo from '../payments/OrangeMoneyPaymentInfo';
import SuccessModal from '../notifications/SuccessModal';

interface Plan {
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
}

interface PremiumPlansProps {
  onNavigateToProfile?: () => void;
}

export default function PremiumPlans({ onNavigateToProfile }: PremiumPlansProps = {}) {
  const { profile } = useAuth();
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [canSubscribe, setCanSubscribe] = useState(true);
  const [loading, setLoading] = useState(true);
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [purchaseInProgress, setPurchaseInProgress] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    checkProfileCompletion();
    loadCreditPackages();
  }, [profile]);

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
    } finally {
      setLoading(false);
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

  const handleBuyCredits = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setShowPaymentModal(true);
  };

  const handlePurchaseComplete = async () => {
    setShowPaymentModal(false);
    setSelectedPackage(null);
    setShowSuccessModal(true);
  };
  const plans: Plan[] = [
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

  const completionStatus = getCompletionStatus(completionPercentage);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {!canSubscribe && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-500 rounded-xl p-6 shadow-lg">
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
              {onNavigateToProfile && (
                <button onClick={onNavigateToProfile} className="px-6 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700">
                  Compléter mon profil
                </button>
              )}
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
        {plans.map((plan, index) => (
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

    {showPaymentModal && selectedPackage && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Finaliser l'achat</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
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
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition"
              >
                Annuler
              </button>
              <button
                onClick={handlePurchaseComplete}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold transition shadow-lg"
              >
                J'ai effectué le paiement
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {showSuccessModal && (
      <SuccessModal
        title="Achat initié avec succès !"
        message="Veuillez suivre les instructions de paiement envoyées par email. Votre achat sera confirmé dès réception du paiement."
        onClose={() => setShowSuccessModal(false)}
        actionLabel="Compris"
      />
    )}
    </div>
  );
}
