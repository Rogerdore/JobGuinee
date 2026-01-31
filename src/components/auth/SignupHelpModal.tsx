import { AlertCircle, Mail, LogIn, RefreshCw, CheckCircle, Info, X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface SignupHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: 'email_exists' | 'profile_timeout' | 'account_incomplete' | 'weak_password' | 'general_error';
  email: string;
  onSwitchToLogin: () => void;
  onRetry: () => void;
}

export function SignupHelpModal({
  isOpen,
  onClose,
  scenario,
  email,
  onSwitchToLogin,
  onRetry
}: SignupHelpModalProps) {
  const getContent = () => {
    switch (scenario) {
      case 'email_exists':
        return {
          icon: <Info className="w-12 h-12 text-blue-500" />,
          title: 'Compte déjà existant',
          message: (
            <div className="space-y-4">
              <p className="text-gray-700">
                Bonne nouvelle ! Un compte existe déjà avec l'email <strong className="text-blue-600">{email}</strong>
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1">Vous êtes déjà inscrit !</p>
                    <p>Cliquez sur "Me connecter" ci-dessous pour accéder à votre compte.</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Si vous avez oublié votre mot de passe, vous pourrez le réinitialiser sur la page de connexion.
              </p>
            </div>
          ),
          primaryAction: {
            label: 'Me connecter',
            icon: <LogIn className="w-4 h-4" />,
            onClick: () => {
              onClose();
              onSwitchToLogin();
            }
          },
          secondaryAction: {
            label: 'Fermer',
            onClick: onClose
          }
        };

      case 'profile_timeout':
        return {
          icon: <RefreshCw className="w-12 h-12 text-orange-500" />,
          title: 'Inscription en cours...',
          message: (
            <div className="space-y-4">
              <p className="text-gray-700">
                Votre compte a été créé avec succès, mais le profil prend un peu plus de temps à se configurer.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-2">Pas d'inquiétude !</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Votre compte est bien créé</li>
                      <li>Vos identifiants sont enregistrés</li>
                      <li>Vous allez recevoir un email de bienvenue</li>
                    </ul>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Veuillez patienter <strong>30 secondes</strong>, puis connectez-vous avec vos identifiants.
              </p>
            </div>
          ),
          primaryAction: {
            label: 'Me connecter maintenant',
            icon: <LogIn className="w-4 h-4" />,
            onClick: () => {
              onClose();
              onSwitchToLogin();
            }
          },
          secondaryAction: {
            label: 'Réessayer l\'inscription',
            onClick: () => {
              onClose();
              onRetry();
            }
          }
        };

      case 'account_incomplete':
        return {
          icon: <RefreshCw className="w-12 h-12 text-yellow-500" />,
          title: 'Finalisation du compte',
          message: (
            <div className="space-y-4">
              <p className="text-gray-700">
                Un compte a été créé avec cet email mais n'est pas complètement configuré.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1">Que s'est-il passé ?</p>
                    <p>Votre inscription précédente n'a pas été finalisée. Nous allons nettoyer cela pour vous.</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Cliquez sur "Réessayer" pour finaliser votre inscription en quelques secondes.
              </p>
            </div>
          ),
          primaryAction: {
            label: 'Réessayer l\'inscription',
            icon: <RefreshCw className="w-4 h-4" />,
            onClick: () => {
              onClose();
              onRetry();
            }
          },
          secondaryAction: {
            label: 'Fermer',
            onClick: onClose
          }
        };

      case 'weak_password':
        return {
          icon: <AlertCircle className="w-12 h-12 text-red-500" />,
          title: 'Mot de passe trop simple',
          message: (
            <div className="space-y-4">
              <p className="text-gray-700">
                Pour protéger votre compte, nous avons besoin d'un mot de passe plus sécurisé.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-2">Votre mot de passe doit contenir :</p>
                  <ul className="space-y-1.5">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Au moins <strong>6 caractères</strong>
                    </li>
                    <li className="flex items-center gap-2 text-gray-500">
                      <Info className="w-4 h-4" />
                      Recommandé : lettres + chiffres
                    </li>
                  </ul>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Fermez cette fenêtre et choisissez un nouveau mot de passe.
              </p>
            </div>
          ),
          primaryAction: {
            label: 'Compris',
            icon: <CheckCircle className="w-4 h-4" />,
            onClick: onClose
          }
        };

      case 'general_error':
      default:
        return {
          icon: <AlertCircle className="w-12 h-12 text-gray-500" />,
          title: 'Erreur temporaire',
          message: (
            <div className="space-y-4">
              <p className="text-gray-700">
                Une erreur temporaire s'est produite lors de votre inscription.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1">Que faire ?</p>
                    <p>Patientez quelques secondes et réessayez. Si le problème persiste, contactez-nous.</p>
                  </div>
                </div>
              </div>
            </div>
          ),
          primaryAction: {
            label: 'Réessayer',
            icon: <RefreshCw className="w-4 h-4" />,
            onClick: () => {
              onClose();
              onRetry();
            }
          },
          secondaryAction: {
            label: 'Fermer',
            onClick: onClose
          }
        };
    }
  };

  const content = getContent();

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gray-50">
              {content.icon}
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-900">
                {content.title}
              </h3>
            </div>

            <div className="w-full text-left">
              {content.message}
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
            {content.secondaryAction && (
              <button
                onClick={content.secondaryAction.onClick}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                {content.secondaryAction.label}
              </button>
            )}
            <button
              onClick={content.primaryAction.onClick}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
            >
              {content.primaryAction.icon}
              {content.primaryAction.label}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
