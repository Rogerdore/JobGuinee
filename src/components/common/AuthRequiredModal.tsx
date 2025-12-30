import React from 'react';
import { X, LogIn, UserPlus, Briefcase } from 'lucide-react';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  onSignup: () => void;
  context?: 'apply' | 'save' | 'access' | 'general';
  jobTitle?: string;
}

export default function AuthRequiredModal({
  isOpen,
  onClose,
  onLogin,
  onSignup,
  context = 'general',
  jobTitle
}: AuthRequiredModalProps) {
  if (!isOpen) return null;

  const contextMessages = {
    apply: {
      title: 'Connectez-vous pour postuler',
      description: jobTitle
        ? `Pour postuler à l'offre "${jobTitle}", vous devez être connecté(e).`
        : 'Pour postuler à cette offre, vous devez être connecté(e).',
      icon: Briefcase
    },
    save: {
      title: 'Connectez-vous pour sauvegarder',
      description: 'Créez un compte pour sauvegarder vos offres préférées et être alerté(e) des nouvelles opportunités.',
      icon: Briefcase
    },
    access: {
      title: 'Connectez-vous pour accéder',
      description: 'Cette fonctionnalité nécessite un compte JobGuinée.',
      icon: LogIn
    },
    general: {
      title: 'Connectez-vous',
      description: 'Pour continuer, veuillez vous connecter ou créer un compte.',
      icon: LogIn
    }
  };

  const message = contextMessages[context];
  const Icon = message.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-fadeIn">
        <div className="relative bg-gradient-to-br from-green-50 to-blue-50 p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center justify-center mb-6">
            <div className="bg-green-100 p-4 rounded-full">
              <Icon className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-900 mb-3">
            {message.title}
          </h2>

          <p className="text-center text-gray-600 leading-relaxed">
            {message.description}
          </p>
        </div>

        <div className="p-8 space-y-3">
          <button
            onClick={onSignup}
            className="w-full bg-green-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-green-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
          >
            <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Créer un compte et continuer
          </button>

          <button
            onClick={onLogin}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 px-6 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            Se connecter
          </button>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-center text-gray-500">
              Avec un compte JobGuinée, accédez à :
            </p>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Candidatures en un clic
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Suivi de vos candidatures
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Alertes emploi personnalisées
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
