import { useState, useEffect } from 'react';
import { Check, Sparkles, AlertTriangle, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { calculateRecruiterCompletion, getCompletionStatus } from '../../utils/profileCompletion';

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

  useEffect(() => {
    checkProfileCompletion();
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

    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 mb-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-full mb-4">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold">Services Premium RH</span>
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
    </div>
  );
}
