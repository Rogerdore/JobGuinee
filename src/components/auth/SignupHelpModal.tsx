import { AlertCircle, LogIn, RefreshCw, CheckCircle, Info, X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface SignupHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: 'email_exists' | 'email_exists_google' | 'profile_timeout' | 'account_incomplete' | 'weak_password' | 'general_error';
  email: string;
  onSwitchToLogin: () => void;
  onGoogleSignIn?: () => void;
  onRetry: () => void;
}

export function SignupHelpModal({
  isOpen,
  onClose,
  scenario,
  email,
  onSwitchToLogin,
  onGoogleSignIn,
  onRetry
}: SignupHelpModalProps) {
  const getContent = () => {
    switch (scenario) {
      case 'email_exists_google':
        return {
          icon: (
            <svg className="w-12 h-12" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          ),
          title: 'Compte Google detecte',
          message: (
            <div className="space-y-4">
              <p className="text-gray-700">
                L'adresse <strong className="text-blue-600">{email}</strong> est deja associee a un compte Google.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-2">Comment vous connecter :</p>
                    <ol className="space-y-1.5 list-decimal list-inside">
                      <li>Cliquez sur <strong>"Se connecter avec Google"</strong> ci-dessous</li>
                      <li>Selectionnez votre compte <strong>{email}</strong></li>
                      <li>Vous serez connecte automatiquement</li>
                    </ol>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Votre mot de passe Gmail n'est jamais partage avec JobGuinee. Google verifie votre identite de facon securisee.
              </p>
            </div>
          ),
          primaryAction: {
            label: 'Se connecter avec Google',
            icon: (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            ),
            onClick: () => {
              onClose();
              onGoogleSignIn?.();
            }
          },
          secondaryAction: {
            label: 'Fermer',
            onClick: onClose
          }
        };

      case 'email_exists':
        return {
          icon: <Info className="w-12 h-12 text-blue-500" />,
          title: 'Compte deja existant',
          message: (
            <div className="space-y-4">
              <p className="text-gray-700">
                Un compte existe deja avec l'email <strong className="text-blue-600">{email}</strong>
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1">Vous etes deja inscrit !</p>
                    <p>Cliquez sur "Me connecter" pour acceder a votre compte avec :</p>
                    <div className="mt-2 bg-white border border-blue-100 rounded px-3 py-2 font-mono text-xs text-gray-800">
                      {email}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Si vous avez oublie votre mot de passe, vous pourrez le reinitialiser sur la page de connexion.
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
                Votre compte a ete cree avec succes, mais le profil prend un peu plus de temps a se configurer.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-2">Pas d'inquietude !</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Votre compte est bien cree</li>
                      <li>Vos identifiants sont enregistres</li>
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
            label: 'Reessayer l\'inscription',
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
                Un compte a ete cree avec cet email mais n'est pas completement configure.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1">Que s'est-il passe ?</p>
                    <p>Votre inscription precedente n'a pas ete finalisee. Nous allons nettoyer cela pour vous.</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Cliquez sur "Reessayer" pour finaliser votre inscription en quelques secondes.
              </p>
            </div>
          ),
          primaryAction: {
            label: 'Reessayer l\'inscription',
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
                Pour proteger votre compte, nous avons besoin d'un mot de passe plus securise.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-2">Votre mot de passe doit contenir :</p>
                  <ul className="space-y-1.5">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Au moins <strong>6 caracteres</strong>
                    </li>
                    <li className="flex items-center gap-2 text-gray-500">
                      <Info className="w-4 h-4" />
                      Recommande : lettres + chiffres
                    </li>
                  </ul>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Fermez cette fenetre et choisissez un nouveau mot de passe.
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
                    <p>Patientez quelques secondes et reessayez. Si le probleme persiste, contactez-nous.</p>
                  </div>
                </div>
              </div>
            </div>
          ),
          primaryAction: {
            label: 'Reessayer',
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
