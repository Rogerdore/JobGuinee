import React from 'react';
import { CheckCircle2, User, Briefcase, X, TrendingUp } from 'lucide-react';

interface ApplicationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteProfile: () => void;
  onViewMoreJobs: () => void;
  jobTitle?: string;
  applicationReference?: string;
  profileCompletionPercentage?: number;
}

export default function ApplicationSuccessModal({
  isOpen,
  onClose,
  onCompleteProfile,
  onViewMoreJobs,
  jobTitle,
  applicationReference,
  profileCompletionPercentage = 0
}: ApplicationSuccessModalProps) {
  if (!isOpen) return null;

  const isProfileIncomplete = profileCompletionPercentage < 80;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-fadeIn">
        <div className="relative bg-gradient-to-br from-green-50 via-green-100 to-emerald-50 p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center justify-center mb-6">
            <div className="bg-green-500 p-4 rounded-full animate-bounce">
              <CheckCircle2 className="w-16 h-16 text-white" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">
            Candidature envoyée !
          </h2>

          {jobTitle && (
            <p className="text-center text-gray-700 mb-2 font-medium">
              {jobTitle}
            </p>
          )}

          {applicationReference && (
            <p className="text-center text-sm text-gray-500">
              Référence : <span className="font-mono font-semibold">{applicationReference}</span>
            </p>
          )}
        </div>

        <div className="p-8">
          {isProfileIncomplete && (
            <div className="mb-6 p-4 bg-orange-50 border-2 border-orange-200 rounded-xl">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 mb-1">
                    Maximisez vos chances !
                  </h3>
                  <p className="text-sm text-orange-800 mb-3">
                    Votre profil est complété à <strong>{profileCompletionPercentage}%</strong>.
                    Un profil complété à 80% est <strong>3x plus visible</strong> par les recruteurs.
                  </p>
                  <div className="w-full bg-orange-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${profileCompletionPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {isProfileIncomplete ? (
              <>
                <button
                  onClick={onCompleteProfile}
                  className="w-full bg-green-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-green-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
                >
                  <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Compléter mon profil (recommandé)
                </button>

                <button
                  onClick={onViewMoreJobs}
                  className="w-full bg-white border-2 border-gray-300 text-gray-700 px-6 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Briefcase className="w-5 h-5" />
                  Voir d'autres offres
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onViewMoreJobs}
                  className="w-full bg-green-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-green-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
                >
                  <Briefcase className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Voir d'autres offres
                </button>

                <button
                  onClick={onCompleteProfile}
                  className="w-full bg-white border-2 border-gray-300 text-gray-700 px-6 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <User className="w-5 h-5" />
                  Voir mon profil
                </button>
              </>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3 text-sm">
              Prochaines étapes :
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold mt-0.5">1.</span>
                <span>Le recruteur examinera votre candidature</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold mt-0.5">2.</span>
                <span>Vous recevrez une notification de mise à jour</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold mt-0.5">3.</span>
                <span>Consultez votre tableau de bord pour suivre l'avancement</span>
              </li>
            </ul>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-center text-blue-800">
              💡 <strong>Astuce :</strong> Activez les notifications pour ne manquer aucune réponse
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
