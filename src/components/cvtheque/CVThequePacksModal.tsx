import { useState, useEffect } from 'react';
import { X, Check, Building, Users, Sparkles, TrendingUp, Crown } from 'lucide-react';
import { cvthequePricingService, CVThequePack } from '../../services/cvthequePricingService';
import { OrangeMoneyPaymentInfo } from '../payments/OrangeMoneyPaymentInfo';

interface CVThequePacksModalProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CVThequePacksModal({
  userId,
  onClose,
  onSuccess
}: CVThequePacksModalProps) {
  const [packs, setPacks] = useState<CVThequePack[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState<CVThequePack | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [activeTab, setActiveTab] = useState<'mono' | 'mixed' | 'enterprise'>('mono');

  useEffect(() => {
    loadPacks();
  }, []);

  const loadPacks = async () => {
    try {
      const data = await cvthequePricingService.getAllPacks();
      setPacks(data);
    } catch (error) {
      console.error('Error loading packs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPack = (pack: CVThequePack) => {
    setSelectedPack(pack);
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (paymentProofUrl: string) => {
    if (!selectedPack) return;

    setPurchasing(true);
    try {
      await cvthequePricingService.purchasePack(userId, selectedPack.id, paymentProofUrl);
      alert('✅ Votre achat a été enregistré ! Il sera activé après validation du paiement.');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error purchasing pack:', error);
      alert('❌ Erreur lors de l\'achat du pack');
    } finally {
      setPurchasing(false);
    }
  };

  const getPackIcon = (packType: string) => {
    switch (packType) {
      case 'junior':
      case 'intermediate':
      case 'senior':
        return Users;
      case 'mixed':
        return TrendingUp;
      case 'enterprise':
        return Building;
      case 'gold':
        return Crown;
      default:
        return Sparkles;
    }
  };

  const getPackColor = (packType: string) => {
    switch (packType) {
      case 'junior':
        return 'from-green-500 to-green-600';
      case 'intermediate':
        return 'from-blue-500 to-blue-600';
      case 'senior':
        return 'from-purple-500 to-purple-600';
      case 'mixed':
        return 'from-orange-500 to-orange-600';
      case 'enterprise':
        return 'from-slate-600 to-slate-700';
      case 'gold':
        return 'from-yellow-500 to-yellow-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const filteredPacks = packs.filter(pack => {
    if (activeTab === 'mono') return ['junior', 'intermediate', 'senior'].includes(pack.pack_type);
    if (activeTab === 'mixed') return pack.pack_type === 'mixed';
    if (activeTab === 'enterprise') return ['enterprise', 'gold'].includes(pack.pack_type);
    return true;
  });

  if (showPayment && selectedPack) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{selectedPack.pack_name}</h3>
              <p className="text-gray-600">{selectedPack.total_profiles} profils</p>
            </div>
            <button
              onClick={() => {
                setShowPayment(false);
                setSelectedPack(null);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <OrangeMoneyPaymentInfo
            amount={selectedPack.price_gnf}
            packageName={selectedPack.pack_name}
            onPaymentProofUploaded={handlePaymentSuccess}
            loading={purchasing}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-7xl w-full p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Packs CVThèque</h2>
            <p className="text-gray-600">Choisissez le pack adapté à vos besoins de recrutement</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex space-x-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('mono')}
            className={`px-6 py-3 font-semibold transition border-b-2 ${
              activeTab === 'mono'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Packs Mono-Niveau
          </button>
          <button
            onClick={() => setActiveTab('mixed')}
            className={`px-6 py-3 font-semibold transition border-b-2 ${
              activeTab === 'mixed'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Packs Mixtes
          </button>
          <button
            onClick={() => setActiveTab('enterprise')}
            className={`px-6 py-3 font-semibold transition border-b-2 ${
              activeTab === 'enterprise'
                ? 'border-slate-600 text-slate-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Abonnements Entreprise
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPacks.map((pack) => {
              const Icon = getPackIcon(pack.pack_type);
              const colorClass = getPackColor(pack.pack_type);
              const isGold = pack.pack_type === 'gold';

              return (
                <div
                  key={pack.id}
                  className={`relative bg-white border-2 rounded-2xl p-6 transition hover:shadow-xl ${
                    isGold ? 'border-yellow-500 ring-2 ring-yellow-200' : 'border-gray-200'
                  }`}
                >
                  {isGold && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-1 rounded-full text-xs font-bold">
                        VALIDATION OBLIGATOIRE
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-gradient-to-br ${colorClass}`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{pack.pack_name}</h3>
                    <div className="text-3xl font-bold text-gray-900">
                      {(pack.price_gnf / 1000000).toFixed(1)}M
                      <span className="text-sm text-gray-500 font-normal ml-1">GNF</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {isGold ? 'Accès illimité' : `${pack.total_profiles} profils`}
                    </div>
                  </div>

                  {pack.description && (
                    <p className="text-sm text-gray-600 mb-4 text-center">{pack.description}</p>
                  )}

                  <ul className="space-y-2 mb-6">
                    {(pack.features || []).map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelectPack(pack)}
                    className={`w-full py-3 rounded-xl font-semibold transition ${
                      isGold
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                  >
                    {isGold ? 'Demander le GOLD' : 'Acheter ce pack'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}