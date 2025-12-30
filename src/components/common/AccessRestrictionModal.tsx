import React from 'react';
import { Shield, User, Briefcase, ArrowRight, X, AlertCircle } from 'lucide-react';

interface AccessRestrictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  restrictionType: 'candidate-only' | 'recruiter-only' | 'premium-only' | 'admin-only';
  currentUserType?: string;
  onNavigate?: (page: string) => void;
}

const restrictionConfig = {
  'candidate-only': {
    icon: User,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    title: 'Espace réservé aux candidats',
    message: 'Cette fonctionnalité est exclusivement accessible aux candidats inscrits sur JobGuinée.',
    explanation: 'Pour accéder à cet espace, vous devez créer un compte candidat ou vous connecter avec vos identifiants candidat.',
    primaryAction: {
      label: 'Créer un compte candidat',
      icon: User,
      page: 'signup-candidate'
    },
    secondaryActions: [
      {
        label: 'Se connecter en tant que candidat',
        page: 'login'
      },
      {
        label: 'Découvrir les offres',
        page: 'jobs'
      }
    ]
  },
  'recruiter-only': {
    icon: Briefcase,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    title: 'Espace réservé aux recruteurs',
    message: 'Cette fonctionnalité est exclusivement accessible aux recruteurs et entreprises partenaires.',
    explanation: 'Pour accéder à la CVthèque et aux outils de recrutement, vous devez créer un compte recruteur ou vous connecter.',
    primaryAction: {
      label: 'Créer un compte recruteur',
      icon: Briefcase,
      page: 'signup-recruiter'
    },
    secondaryActions: [
      {
        label: 'Se connecter en tant que recruteur',
        page: 'login'
      },
      {
        label: 'Découvrir les solutions B2B',
        page: 'b2b-solutions'
      }
    ]
  },
  'premium-only': {
    icon: Shield,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    title: 'Fonctionnalité Premium',
    message: 'Cette fonctionnalité est réservée aux membres Premium et Premium Pro+.',
    explanation: 'Passez à un abonnement Premium pour accéder à cette fonctionnalité et débloquer tous les avantages de JobGuinée.',
    primaryAction: {
      label: 'Découvrir Premium',
      icon: Shield,
      page: 'premium-subscribe'
    },
    secondaryActions: [
      {
        label: 'Voir les tarifs',
        page: 'credit-store'
      }
    ]
  },
  'admin-only': {
    icon: Shield,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    title: 'Accès administrateur requis',
    message: 'Cette section est réservée aux administrateurs de la plateforme.',
    explanation: 'Vous n\'avez pas les permissions nécessaires pour accéder à cet espace. Contactez un administrateur si vous pensez qu\'il s\'agit d\'une erreur.',
    primaryAction: {
      label: 'Retour à l\'accueil',
      icon: ArrowRight,
      page: 'home'
    },
    secondaryActions: []
  }
};

export default function AccessRestrictionModal({
  isOpen,
  onClose,
  restrictionType,
  currentUserType,
  onNavigate
}: AccessRestrictionModalProps) {
  if (!isOpen) return null;

  const config = restrictionConfig[restrictionType];
  const Icon = config.icon;

  const handlePrimaryAction = () => {
    onClose();
    if (onNavigate && config.primaryAction.page) {
      onNavigate(config.primaryAction.page);
    }
  };

  const handleSecondaryAction = (page: string) => {
    onClose();
    if (onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75 backdrop-blur-sm"
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className={`px-6 pt-8 pb-6 ${config.iconBg} bg-opacity-50`}>
            <div className="flex justify-center mb-4">
              <div className={`${config.iconBg} p-4 rounded-2xl shadow-md`}>
                <Icon className={`w-12 h-12 ${config.iconColor}`} />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-center text-gray-900 mb-3">
              {config.title}
            </h3>

            <p className="text-center text-gray-700 font-medium leading-relaxed">
              {config.message}
            </p>
          </div>

          <div className="bg-white px-6 py-5">
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-900 leading-relaxed">
                {config.explanation}
              </p>
            </div>

            {currentUserType && (
              <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">Votre compte actuel :</span> {
                    currentUserType === 'candidate' ? 'Candidat' :
                    currentUserType === 'recruiter' ? 'Recruteur' :
                    currentUserType === 'trainer' ? 'Formateur' :
                    currentUserType === 'admin' ? 'Administrateur' :
                    'Non connecté'
                  }
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handlePrimaryAction}
                className="w-full px-6 py-3.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {React.createElement(config.primaryAction.icon, { className: "w-5 h-5" })}
                {config.primaryAction.label}
              </button>

              {config.secondaryActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleSecondaryAction(action.page)}
                  className="w-full px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  {action.label}
                </button>
              ))}

              <button
                onClick={onClose}
                className="w-full px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm"
              >
                Annuler
              </button>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <p className="text-xs text-center text-gray-500">
              Besoin d'aide ? <a href="mailto:support@jobguinee.com" className="text-green-600 hover:text-green-700 font-medium">Contactez notre support</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
