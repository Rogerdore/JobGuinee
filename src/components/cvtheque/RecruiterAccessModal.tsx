import { X, UserCheck, Shield, Eye, Briefcase, Users } from 'lucide-react';

interface RecruiterAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRedirect: () => void;
}

export default function RecruiterAccessModal({ isOpen, onClose, onRedirect }: RecruiterAccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-fade-in">
        {/* Header avec icône d'accès refusé */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-3 rounded-full">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Accès refusé</h2>
              <p className="text-red-100 text-sm mt-1">Compte recruteur requis</p>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-900 font-medium text-center">
              Seuls les recruteurs peuvent accéder aux détails des profils.
            </p>
          </div>

          {/* Guide des avantages */}
          <div className="space-y-4 mb-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Pourquoi créer un compte recruteur ?
            </h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg mt-0.5">
                  <Eye className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Accès à la CVThèque complète</p>
                  <p className="text-gray-600 text-xs">Consultez des milliers de profils qualifiés</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-2 rounded-lg mt-0.5">
                  <Briefcase className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Publiez vos offres d'emploi</p>
                  <p className="text-gray-600 text-xs">Diffusez vos annonces auprès de candidats ciblés</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-purple-100 p-2 rounded-lg mt-0.5">
                  <UserCheck className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">Outils de recrutement avancés</p>
                  <p className="text-gray-600 text-xs">Filtres intelligents, matching IA, et plus encore</p>
                </div>
              </div>
            </div>
          </div>

          {/* Message d'action */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-900 text-sm text-center">
              Veuillez créer un compte recruteur pour accéder à la CVThèque.
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition"
            >
              Annuler
            </button>
            <button
              onClick={onRedirect}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition shadow-lg"
            >
              Créer un compte recruteur
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
