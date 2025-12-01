import { useState, useEffect } from 'react';
import { Coins, AlertTriangle, CheckCircle, X, Loader } from 'lucide-react';
import { useConsumeCredits, useCreditBalance } from '../../hooks/useCreditService';
import { ServiceCode } from '../../services/creditService';

interface CreditConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (success: boolean, result?: any) => void;
  serviceCode: ServiceCode | string;
  serviceName: string;
  serviceCost: number;
  description?: string;
  inputPayload?: any;
}

export default function CreditConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  serviceCode,
  serviceName,
  serviceCost,
  description,
  inputPayload
}: CreditConfirmModalProps) {
  const { balance } = useCreditBalance();
  const { consumeCredits, consuming } = useConsumeCredits();
  const [checking, setChecking] = useState(false);
  const [canProceed, setCanProceed] = useState(false);

  useEffect(() => {
    if (isOpen && balance) {
      setChecking(true);
      const sufficient = balance.credits_available >= serviceCost;
      setCanProceed(sufficient);
      setChecking(false);
    }
  }, [isOpen, balance, serviceCost]);

  const handleConfirm = async () => {
    if (!canProceed) return;

    const result = await consumeCredits(serviceCode, inputPayload);

    if (result.success) {
      onConfirm(true, result);
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      onConfirm(false, result);
    }
  };

  if (!isOpen) return null;

  const currentBalance = balance?.credits_available || 0;
  const balanceAfter = currentBalance - serviceCost;
  const insufficient = currentBalance < serviceCost;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Coins className="w-6 h-6 text-yellow-500" />
            Confirmation d'utilisation
          </h3>
          <button
            onClick={onClose}
            disabled={consuming}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="font-medium text-blue-900 mb-1">Service</div>
            <div className="text-blue-700">{serviceName}</div>
            {description && (
              <div className="text-sm text-blue-600 mt-2">{description}</div>
            )}
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Coût du service</span>
              <div className="flex items-center gap-1">
                <Coins className="w-4 h-4 text-yellow-600" />
                <span className="font-bold text-yellow-900">{serviceCost}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Votre solde actuel</span>
              <div className="flex items-center gap-1">
                <Coins className="w-4 h-4 text-gray-500" />
                <span className="font-bold text-gray-900">{currentBalance}</span>
              </div>
            </div>

            <div className="border-t border-yellow-200 pt-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Solde après utilisation</span>
                <div className="flex items-center gap-1">
                  <Coins className={`w-5 h-5 ${balanceAfter < 50 ? 'text-red-500' : 'text-green-500'}`} />
                  <span className={`font-bold text-lg ${balanceAfter < 50 ? 'text-red-600' : 'text-green-600'}`}>
                    {Math.max(0, balanceAfter)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {insufficient && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-red-900 mb-1">Crédits insuffisants</div>
                <div className="text-sm text-red-700">
                  Vous avez besoin de {serviceCost - currentBalance} crédits supplémentaires pour utiliser ce service.
                </div>
              </div>
            </div>
          )}

          {canProceed && balanceAfter < 50 && (
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-700">
                Attention : Votre solde sera faible après cette opération. Pensez à recharger vos crédits.
              </div>
            </div>
          )}

          {consuming && (
            <div className="p-4 bg-blue-50 rounded-lg flex items-center gap-3">
              <Loader className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-blue-900">Traitement en cours...</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={consuming}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canProceed || consuming || checking}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              canProceed && !consuming
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-300 text-gray-500'
            }`}
          >
            {consuming ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Traitement...
              </>
            ) : checking ? (
              'Vérification...'
            ) : canProceed ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Confirmer
              </>
            ) : (
              'Crédits insuffisants'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
