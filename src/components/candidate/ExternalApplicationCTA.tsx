import React, { useState } from 'react';
import { Send, Lock, CheckCircle, TrendingUp } from 'lucide-react';
import ConfirmationModal from '../common/ConfirmationModal';

interface ExternalApplicationCTAProps {
  profileCompletion: number;
  onNavigate: (page: string) => void;
  className?: string;
}

export default function ExternalApplicationCTA({
  profileCompletion,
  onNavigate,
  className = ''
}: ExternalApplicationCTAProps) {
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const isUnlocked = profileCompletion >= 80;

  const handleClick = () => {
    if (isUnlocked) {
      onNavigate('external-application');
    } else {
      setShowUnlockModal(true);
    }
  };

  React.useEffect(() => {
    const hasShownSuccess = sessionStorage.getItem('external_app_unlocked_shown');

    if (isUnlocked && !hasShownSuccess) {
      setShowSuccessModal(true);
      sessionStorage.setItem('external_app_unlocked_shown', 'true');
    }
  }, [isUnlocked]);

  return (
    <>
      <div className={`bg-gray-50 rounded-lg border ${
        isUnlocked ? 'border-green-300' : 'border-gray-200'
      } p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${
            isUnlocked ? 'bg-green-50' : 'bg-gray-100'
          }`}>
            {isUnlocked ? (
              <Send className="w-5 h-5 text-green-600" />
            ) : (
              <Lock className="w-5 h-5 text-gray-400" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-gray-900">
                Postuler à une offre externe
              </h3>
              {!isUnlocked && <Lock className="w-3.5 h-3.5 text-gray-400" />}
            </div>

            <p className="text-sm text-gray-600 mb-3">
              {isUnlocked
                ? 'Utilisez votre profil JobGuinée pour postuler par email à des offres externes'
                : 'Débloquez ce service en complétant votre profil à 80%'}
            </p>

            {!isUnlocked && (
              <div className="mb-3 p-2.5 bg-gray-100 border border-gray-200 rounded-md">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-800">
                      Encore {80 - profileCompletion}% pour débloquer
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Complétez votre CV, expériences et diplômes
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleClick}
              disabled={!isUnlocked}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                isUnlocked
                  ? 'bg-[#0E2F56] text-white hover:bg-[#1a4275]'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isUnlocked ? 'Postuler maintenant' : 'Débloquer ce service'}
            </button>

            {isUnlocked && (
              <p className="text-xs text-gray-600 mt-1.5 text-center">
                ✓ Service gratuit pour les profils complets
              </p>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        title="Complétez votre profil pour débloquer ce service"
        message="Pour postuler à des offres externes avec JobGuinée, votre profil doit être complété à au moins 80%. Un profil complet vous permet d'envoyer des candidatures professionnelles par email."
        type="warning"
        primaryAction={{
          label: 'Compléter mon profil',
          onClick: () => {
            setShowUnlockModal(false);
            onNavigate('candidate-profile-form');
          }
        }}
        secondaryAction={{
          label: 'Plus tard',
          onClick: () => setShowUnlockModal(false)
        }}
      />

      <ConfirmationModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="🎉 Félicitations !"
        message="Votre profil est maintenant complété à 80%. Vous pouvez désormais postuler à des offres externes avec votre profil JobGuinée."
        type="success"
        primaryAction={{
          label: 'Postuler à une offre externe',
          onClick: () => {
            setShowSuccessModal(false);
            onNavigate('external-application');
          }
        }}
        secondaryAction={{
          label: 'Fermer',
          onClick: () => setShowSuccessModal(false)
        }}
      />
    </>
  );
}
