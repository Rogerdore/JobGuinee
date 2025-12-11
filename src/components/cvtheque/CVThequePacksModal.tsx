import { useState, useEffect } from 'react';
import { X, Check, Building, Users, Sparkles, TrendingUp, Crown, Copy, MessageCircle, AlertCircle, Circle, Hexagon, Star } from 'lucide-react';
import { cvthequePricingService, CVThequePack, PackPurchase } from '../../services/cvthequePricingService';
import { CreditStoreService, CreditStoreSettings } from '../../services/creditStoreService';

interface CVThequePacksModalProps {
  userId: string;
  userEmail?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CVThequePacksModal({
  userId,
  userEmail = '',
  onClose,
  onSuccess
}: CVThequePacksModalProps) {
  const [packs, setPacks] = useState<CVThequePack[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState<CVThequePack | null>(null);
  const [step, setStep] = useState<'selection' | 'info' | 'payment' | 'confirm'>('selection');
  const [purchaseData, setPurchaseData] = useState<PackPurchase | null>(null);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'mono' | 'mixed' | 'enterprise'>('mono');
  const [settings, setSettings] = useState<CreditStoreSettings | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [packsData, settingsData] = await Promise.all([
        cvthequePricingService.getAllPacks(),
        CreditStoreService.getSettings()
      ]);
      setPacks(packsData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPack = (pack: CVThequePack) => {
    setSelectedPack(pack);
    setStep('info');
  };

  const handleCreatePurchase = async () => {
    if (!selectedPack) return;

    setProcessing(true);
    try {
      const purchase = await cvthequePricingService.purchasePack(userId, selectedPack.id);
      setPurchaseData(purchase);
      setStep('payment');
    } catch (error) {
      console.error('Error creating purchase:', error);
      alert('❌ Erreur lors de la création de l\'achat');
    } finally {
      setProcessing(false);
    }
  };

  const handleCopyNumber = () => {
    if (settings) {
      navigator.clipboard.writeText(settings.admin_phone_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenWhatsApp = () => {
    if (!settings || !selectedPack || !purchaseData) return;

    const whatsappLink = cvthequePricingService.getWhatsAppLink(
      settings.admin_whatsapp_number,
      selectedPack.pack_name,
      userEmail,
      purchaseData.payment_reference || ''
    );
    window.open(whatsappLink, '_blank');
  };

  const handleMarkAsPaid = async () => {
    if (!purchaseData) return;

    setProcessing(true);
    try {
      const success = await cvthequePricingService.markPackAsWaitingProof(purchaseData.id);

      if (success) {
        setStep('confirm');
      } else {
        alert('❌ Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error marking as paid:', error);
      alert('❌ Une erreur est survenue');
    } finally {
      setProcessing(false);
    }
  };

  const handleBack = () => {
    if (step === 'info') {
      setStep('selection');
      setSelectedPack(null);
    } else if (step === 'payment') {
      setStep('info');
    }
  };

  const handleClose = () => {
    if (step === 'confirm') {
      onSuccess();
    }
    onClose();
  };

  const getPackIcon = (packType: string) => {
    switch (packType) {
      case 'junior':
        return Circle;
      case 'intermediate':
        return Hexagon;
      case 'senior':
        return Star;
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
        return 'from-orange-500 to-orange-600';
      case 'intermediate':
        return 'from-green-500 to-green-600';
      case 'senior':
        return 'from-blue-500 to-blue-600';
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

  // STEP: SELECTION DES PACKS
  if (step === 'selection') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-7xl w-full p-8 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Packs CVThèque</h2>
              <p className="text-gray-600">Choisissez le pack adapté à vos besoins de recrutement</p>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg">
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
                      <div className="text-2xl font-bold text-gray-900">
                        {cvthequePricingService.formatPrice(pack.price_gnf)}
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

  // STEP: INFO DU PACK
  if (step === 'info' && selectedPack) {
    const Icon = getPackIcon(selectedPack.pack_type);
    const colorClass = getPackColor(selectedPack.pack_type);

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 relative">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold">Paiement Orange Money</h2>
            <p className="text-orange-100 mt-1">Suivez les étapes pour finaliser votre achat</p>
          </div>

          <div className="p-6">
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 mb-6 border-2 border-orange-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedPack.pack_name}</h3>
                  <p className="text-gray-600">{selectedPack.description}</p>
                </div>
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-lg p-4 border-2 border-orange-300">
                  <div className="text-sm text-gray-600 mb-1">Nombre de profils</div>
                  <div className="text-3xl font-bold text-orange-600">
                    {selectedPack.pack_type === 'gold' ? '∞' : selectedPack.total_profiles}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border-2 border-green-300">
                  <div className="text-sm text-gray-600 mb-1">Type de pack</div>
                  <div className="text-xl font-bold text-green-600 capitalize">
                    {selectedPack.pack_type}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-orange-200">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-700">Prix:</span>
                  <span className="text-3xl font-bold text-gray-900">
                    {cvthequePricingService.formatPrice(selectedPack.price_gnf)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-900 mb-1">Mode de paiement</h4>
                  <p className="text-sm text-blue-800">
                    Le paiement s'effectue exclusivement par <strong>Orange Money</strong>.
                    Après le transfert, vous devrez envoyer la preuve via WhatsApp pour validation rapide.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg transition"
              >
                Retour
              </button>
              <button
                onClick={handleCreatePurchase}
                disabled={processing}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Préparation...
                  </>
                ) : (
                  'Continuer'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP: PAYMENT
  if (step === 'payment' && selectedPack && purchaseData && settings) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 relative">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold">Paiement Orange Money</h2>
            <p className="text-orange-100 mt-1">Finalisez votre achat</p>
          </div>

          <div className="p-6">
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 mb-6 border-2 border-orange-300">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Instructions de paiement</h3>

              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border-2 border-orange-400">
                  <div className="text-sm text-gray-600 mb-2">Référence de paiement</div>
                  <div className="text-2xl font-mono font-bold text-orange-600">
                    {purchaseData.payment_reference}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border-2 border-orange-400">
                  <div className="text-sm text-gray-600 mb-2">Numéro Orange Money</div>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-orange-600">
                      {settings.admin_phone_number}
                    </div>
                    <button
                      onClick={handleCopyNumber}
                      className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-5 h-5" />
                          Copié!
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5" />
                          Copier
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border-2 border-orange-400">
                  <div className="text-sm text-gray-600 mb-2">Montant à envoyer</div>
                  <div className="text-3xl font-bold text-orange-600">
                    {cvthequePricingService.formatPrice(selectedPack.price_gnf)}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-2">Instructions importantes</h4>
                <p className="text-sm text-blue-800">{settings.payment_instructions}</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleOpenWhatsApp}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-lg transition flex items-center justify-center gap-3"
              >
                <MessageCircle className="w-6 h-6" />
                Envoyer la preuve via WhatsApp
              </button>

              <button
                onClick={handleMarkAsPaid}
                disabled={processing}
                className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Traitement...
                  </>
                ) : (
                  <>
                    <Check className="w-6 h-6" />
                    J'ai effectué le paiement
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP: CONFIRMATION
  if (step === 'confirm' && purchaseData) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 relative">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold">Paiement enregistré!</h2>
          </div>

          <div className="p-6">
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Paiement enregistré!</h3>
              <p className="text-gray-600 mb-6">
                Merci ! Votre paiement est en cours de vérification par l'équipe JobGuinée.
                Temps estimé : <strong>5 à 20 minutes</strong>.
              </p>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-left mb-6">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Référence:</strong> {purchaseData.payment_reference}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Pack:</strong> {purchaseData.pack_name}
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h4 className="font-bold text-green-900 mb-2">Prochaines étapes</h4>
                <ul className="text-sm text-green-800 text-left space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Notre équipe vérifie votre paiement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Vous recevrez une notification une fois validé</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Votre pack sera immédiatement disponible</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={handleClose}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white font-bold rounded-lg transition"
              >
                Retour à la CVThèque
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
