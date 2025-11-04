import { X, Clock, BookOpen, Award, Users, CheckCircle, Target } from 'lucide-react';
import { Formation } from '../../lib/supabase';

interface FormationDetailsModalProps {
  formation: Formation;
  onClose: () => void;
  onEnroll: (formation: Formation) => void;
}

export default function FormationDetailsModal({ formation, onClose, onEnroll }: FormationDetailsModalProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75 backdrop-blur-sm" onClick={onClose}></div>

        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
          <div className="relative bg-gradient-to-r from-[#0E2F56] to-blue-700 px-8 py-6 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{formation.title}</h2>
                <div className="flex flex-wrap gap-3">
                  <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                    {formation.category}
                  </span>
                  <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formation.duration}
                  </span>
                  <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                    Niveau: {formation.level}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 max-h-[60vh] overflow-y-auto">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed">{formation.description}</p>
              </div>

              {formation.objectives && formation.objectives.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Objectifs pédagogiques
                  </h3>
                  <ul className="space-y-2">
                    {formation.objectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {formation.program && formation.program.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Programme</h3>
                  <div className="space-y-3">
                    {formation.program.map((module, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          Module {index + 1}: {module}
                        </h4>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">Modalité</h4>
                  </div>
                  <p className="text-gray-700">{formation.modality}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-gray-900">Certification</h4>
                  </div>
                  <p className="text-gray-700">Certificat de fin de formation</p>
                </div>
              </div>

              {formation.prerequisites && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Prérequis</h3>
                  <p className="text-gray-700">{formation.prerequisites}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Prix de la formation</p>
                <p className="text-3xl font-bold text-[#0E2F56]">{formatPrice(formation.price)}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition"
                >
                  Fermer
                </button>
                <button
                  onClick={() => onEnroll(formation)}
                  className="px-8 py-3 bg-[#0E2F56] hover:bg-blue-800 text-white font-semibold rounded-lg transition shadow-lg"
                >
                  S'inscrire maintenant
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
