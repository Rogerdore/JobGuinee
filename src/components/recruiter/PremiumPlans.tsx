import { Check, Sparkles } from 'lucide-react';

interface Plan {
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
}

export default function PremiumPlans() {
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

  return (
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
              className={`w-full py-3 rounded-lg font-semibold transition ${
                plan.popular
                  ? 'bg-blue-900 hover:bg-blue-800 text-white shadow-lg'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
            >
              Choisir ce plan
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
  );
}
