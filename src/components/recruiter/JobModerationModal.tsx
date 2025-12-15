import { Clock, CheckCircle, AlertCircle, Info, X, FileCheck } from 'lucide-react';

interface JobModerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'info' | 'success' | 'rejected';
  rejectionReason?: string;
}

export default function JobModerationModal({ isOpen, onClose, type, rejectionReason }: JobModerationModalProps) {
  if (!isOpen) return null;

  const configs = {
    info: {
      icon: Info,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      borderColor: 'border-blue-300',
      title: 'Comment fonctionne la modération ?',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Pour garantir la qualité des offres publiées sur notre plateforme, toutes les annonces
            passent par un processus de validation.
          </p>

          <div className="bg-white rounded-lg p-4 border border-blue-200 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-blue-600 font-bold text-sm">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Vous publiez votre offre</h4>
                <p className="text-sm text-gray-600">
                  Remplissez le formulaire et soumettez votre annonce
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-yellow-600 font-bold text-sm">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Modération sous 24h</h4>
                <p className="text-sm text-gray-600">
                  Notre équipe examine votre offre pour vérifier sa conformité
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-green-600 font-bold text-sm">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Publication automatique</h4>
                <p className="text-sm text-gray-600">
                  Une fois approuvée, votre offre devient visible publiquement
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">À noter:</span> Vous serez notifié par email et dans votre
              interface dès que la décision sera prise.
            </p>
          </div>
        </div>
      ),
      buttonLabel: 'J\'ai compris',
      buttonColor: 'bg-blue-600 hover:bg-blue-700'
    },
    success: {
      icon: CheckCircle,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      borderColor: 'border-green-300',
      title: 'Offre soumise avec succès !',
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="relative">
              <Clock className="w-16 h-16 text-yellow-500" />
              <div className="absolute -right-1 -bottom-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                <FileCheck className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-gray-700 font-medium text-lg">
              Votre offre est en cours de vérification
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              Notre équipe examine votre annonce pour s'assurer qu'elle respecte nos standards
              de qualité et les réglementations en vigueur.
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" />
              Que se passe-t-il maintenant ?
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Votre offre a été enregistrée avec le statut "En attente"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Vous recevrez une notification dès qu'elle sera examinée</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>La validation prend généralement moins de 24 heures</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800 text-center">
              <span className="font-semibold">Délai moyen de modération:</span> 2 à 4 heures
            </p>
          </div>
        </div>
      ),
      buttonLabel: 'Retour au tableau de bord',
      buttonColor: 'bg-green-600 hover:bg-green-700'
    },
    rejected: {
      icon: AlertCircle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      bgColor: 'bg-gradient-to-br from-red-50 to-red-100',
      borderColor: 'border-red-300',
      title: 'Offre non approuvée',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Votre offre n'a pas été approuvée pour publication. Nous vous invitons à la corriger
            en tenant compte des observations ci-dessous.
          </p>

          {rejectionReason && (
            <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                Raison du refus
              </h4>
              <p className="text-gray-700 whitespace-pre-line">{rejectionReason}</p>
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-3">Comment procéder ?</h4>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">1.</span>
                <span>Modifiez votre offre en tenant compte des remarques</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">2.</span>
                <span>Vérifiez que toutes les informations sont complètes et exactes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">3.</span>
                <span>Soumettez à nouveau votre offre pour modération</span>
              </li>
            </ol>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">Besoin d'aide ?</span> Contactez notre support si
              vous avez des questions sur les raisons du refus.
            </p>
          </div>
        </div>
      ),
      buttonLabel: 'Modifier mon offre',
      buttonColor: 'bg-red-600 hover:bg-red-700'
    }
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${config.bgColor} border-b-2 ${config.borderColor} rounded-t-2xl p-6`}>
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-14 h-14 ${config.iconBg} rounded-full flex items-center justify-center`}>
              <Icon className={`w-7 h-7 ${config.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{config.title}</h3>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition p-1 hover:bg-white/50 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {config.content}
        </div>

        <div className="p-6 bg-gray-50 rounded-b-2xl border-t border-gray-200">
          <button
            onClick={onClose}
            className={`w-full px-6 py-3 ${config.buttonColor} text-white font-semibold rounded-lg transition shadow-md hover:shadow-lg transform hover:scale-[1.02]`}
          >
            {config.buttonLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}
