import React from 'react';
import { X, Target, Users, TrendingUp, Mail, MessageSquare, Phone, ChevronRight } from 'lucide-react';

interface TargetedDiffusionProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDiffusion: () => void;
  onLater: () => void;
  jobTitle?: string;
}

export default function TargetedDiffusionProposalModal({
  isOpen,
  onClose,
  onStartDiffusion,
  onLater,
  jobTitle
}: TargetedDiffusionProposalModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-fadeIn">
        <div className="relative bg-gradient-to-br from-blue-50 via-green-50 to-emerald-50 p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-full shadow-lg">
              <Target className="w-12 h-12 text-white" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">
            Boostez votre visibilité !
          </h2>

          <p className="text-center text-gray-700 text-lg">
            Touchez plus de candidats qualifiés avec la <strong>Diffusion Ciblée</strong>
          </p>
        </div>

        <div className="p-8">
          {jobTitle && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-1">Offre publiée :</p>
              <p className="font-semibold text-gray-900">{jobTitle}</p>
            </div>
          )}

          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              Pourquoi la diffusion ciblée ?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl">
                <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">
                    +200% de candidatures
                  </h4>
                  <p className="text-xs text-gray-600">
                    Multipliez les candidatures qualifiées
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                <Target className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">
                    Ciblage précis
                  </h4>
                  <p className="text-xs text-gray-600">
                    Touchez les profils qui correspondent
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl">
                <MessageSquare className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">
                    Multi-canaux
                  </h4>
                  <p className="text-xs text-gray-600">
                    Email, SMS, WhatsApp
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl">
                <TrendingUp className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">
                    Résultats rapides
                  </h4>
                  <p className="text-xs text-gray-600">
                    Recevez des réponses en 24-48h
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-green-200 rounded-xl">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Phone className="w-5 h-5 text-green-600" />
              Comment ça marche ?
            </h3>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="font-bold text-green-600 flex-shrink-0">1.</span>
                <span>Définissez votre audience cible (compétences, localisation, expérience...)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-green-600 flex-shrink-0">2.</span>
                <span>Choisissez vos canaux de diffusion (Email, SMS, WhatsApp)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-green-600 flex-shrink-0">3.</span>
                <span>Validation du devis et activation immédiate</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-green-600 flex-shrink-0">4.</span>
                <span>Recevez les candidatures directement dans votre dashboard</span>
              </li>
            </ol>
          </div>

          <div className="space-y-3">
            <button
              onClick={onStartDiffusion}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
            >
              <Target className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Lancer une diffusion ciblée
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onLater}
              className="w-full bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Plus tard
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              💡 La diffusion ciblée augmente en moyenne de 200% le nombre de candidatures qualifiées
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
