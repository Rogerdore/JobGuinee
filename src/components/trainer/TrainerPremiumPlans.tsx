import { useState } from 'react';
import { Award, TrendingUp, Building, Check, X } from 'lucide-react';
import { trainerService } from '../../services/trainerService';
import { OrangeMoneyPaymentInfo } from '../payments/OrangeMoneyPaymentInfo';

interface TrainerPremiumPlansProps {
  trainerId: string;
  formationId?: string;
  entityType: 'individual' | 'organization';
  onClose: () => void;
  onSuccess: () => void;
}

export default function TrainerPremiumPlans({
  trainerId,
  formationId,
  entityType,
  onClose,
  onSuccess
}: TrainerPremiumPlansProps) {
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);

  const packs = trainerService.getPromotionPacks().filter(pack => {
    // Filtrer les packs selon le type d'entité
    if (entityType === 'individual') {
      return pack.code !== 'premium_org_annual';
    } else {
      return true; // Les organisations peuvent tout acheter
    }
  });

  const selectedPackData = packs.find(p => p.code === selectedPack);

  const handleSelectPack = (packCode: string) => {
    setSelectedPack(packCode);
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (paymentProof: string) => {
    if (!selectedPackData || !formationId) return;

    setLoading(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + selectedPackData.duration_days);

      await trainerService.createPromotion({
        trainer_id: trainerId,
        formation_id: formationId,
        pack_type: selectedPackData.code as any,
        pack_name: selectedPackData.name,
        price_amount: selectedPackData.price,
        currency: 'GNF',
        payment_method: 'orange_money',
        payment_status: 'waiting_proof',
        payment_proof_url: paymentProof,
        promotion_status: 'pending',
        expires_at: expiresAt.toISOString()
      });

      alert('✅ Votre demande de promotion a été envoyée. Elle sera activée après validation du paiement.');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating promotion:', error);
      alert('❌ Erreur lors de la création de la promotion');
    } finally {
      setLoading(false);
    }
  };

  if (showPayment && selectedPackData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">{selectedPackData.name}</h3>
            <button onClick={() => setShowPayment(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-6 h-6" />
            </button>
          </div>

          <OrangeMoneyPaymentInfo
            amount={selectedPackData.price}
            packageName={selectedPackData.name}
            onPaymentProofUploaded={handlePaymentSuccess}
            loading={loading}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Packs Premium Formateur</h2>
            <p className="text-gray-600">Boostez la visibilité de vos formations</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packs.map((pack) => {
            const Icon = pack.code.includes('org') ? Building : pack.code.includes('premium') ? Award : TrendingUp;
            const isPopular = pack.code === 'boost_15j';

            return (
              <div
                key={pack.code}
                className={`relative bg-white border-2 rounded-2xl p-6 transition hover:shadow-xl ${
                  isPopular ? 'border-orange-500' : 'border-gray-200'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1 rounded-full text-xs font-bold">
                      POPULAIRE
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                    pack.code.includes('org') ? 'bg-blue-100' : pack.code.includes('premium') ? 'bg-orange-100' : 'bg-green-100'
                  }`}>
                    <Icon className={`w-8 h-8 ${
                      pack.code.includes('org') ? 'text-blue-600' : pack.code.includes('premium') ? 'text-orange-600' : 'text-green-600'
                    }`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{pack.name}</h3>
                  <div className="text-3xl font-bold text-gray-900">
                    {(pack.price / 1000).toLocaleString()}K
                    <span className="text-sm text-gray-500 font-normal ml-1">GNF</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {pack.duration_days} jours
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {pack.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPack(pack.code)}
                  disabled={!formationId}
                  className={`w-full py-3 rounded-xl font-semibold transition ${
                    pack.code.includes('org')
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : pack.code.includes('premium')
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {formationId ? 'Choisir ce pack' : 'Sélectionnez une formation'}
                </button>
              </div>
            );
          })}
        </div>

        {!formationId && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-sm text-yellow-800">
              ℹ️ Vous devez sélectionner une formation à promouvoir avant de choisir un pack.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}