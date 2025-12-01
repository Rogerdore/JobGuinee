import { useState } from 'react';
import { Sparkles, FileText, Briefcase } from 'lucide-react';
import CreditBalance from './CreditBalance';
import ServiceCostBadge from './ServiceCostBadge';
import CreditConfirmModal from './CreditConfirmModal';
import { SERVICES } from '../../services/creditService';
import { useConsumeCredits } from '../../hooks/useCreditService';

export default function CreditServiceExample() {
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const { consumeCredits } = useConsumeCredits();

  const services = [
    {
      code: SERVICES.AI_CV_GENERATION,
      name: 'Génération de CV IA',
      icon: FileText,
      cost: 50,
      description: 'Créez un CV professionnel avec l\'aide de l\'IA'
    },
    {
      code: SERVICES.AI_COVER_LETTER,
      name: 'Lettre de motivation IA',
      icon: FileText,
      cost: 30,
      description: 'Générez une lettre de motivation personnalisée'
    },
    {
      code: SERVICES.AI_JOB_MATCHING,
      name: 'Matching Emplois IA',
      icon: Briefcase,
      cost: 20,
      description: 'Trouvez les emplois qui correspondent à votre profil'
    }
  ];

  const handleServiceClick = (service: any) => {
    setSelectedService(service);
    setShowModal(true);
  };

  const handleConfirm = async (success: boolean, result?: any) => {
    if (success) {
      console.log('Service utilisé avec succès:', result);
      alert(`✅ ${selectedService.name} utilisé avec succès!\nCrédits restants: ${result.credits_remaining}`);
    } else {
      console.error('Erreur:', result);
      alert(`❌ Erreur: ${result?.message || 'Une erreur est survenue'}`);
    }
  };

  const handleDirectConsume = async (serviceCode: string) => {
    const result = await consumeCredits(serviceCode, {
      example: 'payload data',
      timestamp: new Date().toISOString()
    });

    if (result.success) {
      alert(`✅ Service utilisé directement!\nCrédits consommés: ${result.credits_consumed}\nCrédits restants: ${result.credits_remaining}`);
    } else {
      alert(`❌ ${result.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-blue-600" />
          Exemple d'utilisation du système de crédits
        </h2>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Votre solde actuel</h3>
          <CreditBalance showDetails className="text-lg" />
        </div>

        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Services disponibles avec confirmation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {services.map((service) => (
              <button
                key={service.code}
                onClick={() => handleServiceClick(service)}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all text-left"
              >
                <div className="flex items-center gap-2 mb-2">
                  <service.icon className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">{service.name}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                <ServiceCostBadge serviceCode={service.code} />
              </button>
            ))}
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="font-medium text-gray-900 mb-3">Consommation directe (sans confirmation)</h3>
          <div className="space-y-3">
            {services.map((service) => (
              <div key={service.code} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <service.icon className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">{service.name}</span>
                  <ServiceCostBadge serviceCode={service.code} className="text-xs" />
                </div>
                <button
                  onClick={() => handleDirectConsume(service.code)}
                  className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Utiliser
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">💡 Comment utiliser dans votre code :</h4>
          <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
{`// 1. Importer le hook
import { useConsumeCredits } from '../../hooks/useCreditService';
import { SERVICES } from '../../services/creditService';

// 2. Utiliser dans votre composant
const { consumeCredits, consuming } = useConsumeCredits();

// 3. Consommer les crédits
const handleAction = async () => {
  const result = await consumeCredits(
    SERVICES.AI_CV_GENERATION,
    { userData: profileData }, // Input
    { generatedCV: cvData }    // Output (optionnel)
  );

  if (result.success) {
    console.log('Crédits restants:', result.credits_remaining);
    // Continuer votre logique
  } else {
    alert(result.message);
  }
};`}
          </pre>
        </div>
      </div>

      {selectedService && (
        <CreditConfirmModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={handleConfirm}
          serviceCode={selectedService.code}
          serviceName={selectedService.name}
          serviceCost={selectedService.cost}
          description={selectedService.description}
        />
      )}
    </div>
  );
}
