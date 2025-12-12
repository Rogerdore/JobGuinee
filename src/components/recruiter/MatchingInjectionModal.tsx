import { useState } from 'react';
import { X, CheckCircle, AlertTriangle, TrendingUp, ArrowRight, Users } from 'lucide-react';
import { pipelineInjectionService, MatchingResultForInjection, InjectionConfig } from '../../services/pipelineInjectionService';

interface MatchingInjectionModalProps {
  results: MatchingResultForInjection[];
  onClose: () => void;
  onConfirm: () => void;
}

export default function MatchingInjectionModal({ results, onClose, onConfirm }: MatchingInjectionModalProps) {
  const [weakMatchAction, setWeakMatchAction] = useState<'keep' | 'reject'>('keep');
  const [injecting, setInjecting] = useState(false);
  const [injectionComplete, setInjectionComplete] = useState(false);
  const [injectionResult, setInjectionResult] = useState<any>(null);

  const grouped = pipelineInjectionService.groupResultsByCategory(results);

  const handleConfirm = async () => {
    setInjecting(true);

    const config: InjectionConfig = {
      strongMatchStage: 'Présélection IA',
      mediumMatchStage: 'Reçues',
      weakMatchAction
    };

    const result = await pipelineInjectionService.injectMatchingResults(results, config);

    setInjectionResult(result);
    setInjecting(false);
    setInjectionComplete(true);

    setTimeout(() => {
      onConfirm();
    }, 2000);
  };

  if (injectionComplete && injectionResult) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Injection réussie!</h2>
            <p className="text-gray-600 mb-6">
              Les résultats du matching IA ont été intégrés au pipeline avec succès.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="text-3xl font-bold text-green-700">{injectionResult.moved}</div>
                <div className="text-sm text-green-600">Présélectionnés</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="text-3xl font-bold text-blue-700">{injectionResult.kept}</div>
                <div className="text-sm text-blue-600">Conservés</div>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <div className="text-3xl font-bold text-red-700">{injectionResult.rejected}</div>
                <div className="text-sm text-red-600">Rejetés</div>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              Fermeture automatique...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-900 via-blue-700 to-blue-900 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Injection dans le Pipeline</h2>
              <p className="text-blue-100">Confirmez l'intégration des résultats IA</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Actions automatiques</h3>
                <p className="text-sm text-blue-700">
                  Les candidatures seront automatiquement déplacées dans le pipeline selon leur score IA.
                  Vous pourrez toujours les déplacer manuellement après.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <h3 className="font-bold text-green-900">Forte correspondance (≥ 75%)</h3>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <Users className="w-4 h-4" />
                  <span className="font-semibold">{grouped.strong.length} candidat{grouped.strong.length > 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-green-700">Action:</span>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-green-300">
                  <span className="font-medium">Déplacer vers</span>
                  <ArrowRight className="w-4 h-4 text-green-600" />
                  <span className="font-bold text-green-900">Présélection IA</span>
                </div>
              </div>
              {grouped.strong.length > 0 && (
                <div className="mt-3 space-y-1">
                  {grouped.strong.slice(0, 3).map((r) => (
                    <div key={r.applicationId} className="text-sm text-green-700 flex items-center gap-2">
                      <CheckCircle className="w-3 h-3" />
                      <span>{r.candidateName} ({r.score}%)</span>
                    </div>
                  ))}
                  {grouped.strong.length > 3 && (
                    <div className="text-sm text-green-600 ml-5">
                      +{grouped.strong.length - 3} autre{grouped.strong.length - 3 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <h3 className="font-bold text-yellow-900">Correspondance moyenne (50-74%)</h3>
                </div>
                <div className="flex items-center gap-2 text-yellow-700">
                  <Users className="w-4 h-4" />
                  <span className="font-semibold">{grouped.medium.length} candidat{grouped.medium.length > 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-yellow-700">Action:</span>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-yellow-300">
                  <span className="font-medium">Rester dans</span>
                  <span className="font-bold text-yellow-900">Reçues</span>
                </div>
              </div>
              {grouped.medium.length > 0 && (
                <div className="mt-3 space-y-1">
                  {grouped.medium.slice(0, 3).map((r) => (
                    <div key={r.applicationId} className="text-sm text-yellow-700 flex items-center gap-2">
                      <CheckCircle className="w-3 h-3" />
                      <span>{r.candidateName} ({r.score}%)</span>
                    </div>
                  ))}
                  {grouped.medium.length > 3 && (
                    <div className="text-sm text-yellow-600 ml-5">
                      +{grouped.medium.length - 3} autre{grouped.medium.length - 3 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <h3 className="font-bold text-red-900">Faible correspondance (&lt; 50%)</h3>
                </div>
                <div className="flex items-center gap-2 text-red-700">
                  <Users className="w-4 h-4" />
                  <span className="font-semibold">{grouped.weak.length} candidat{grouped.weak.length > 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-red-700 mb-2">
                  Action pour les profils faibles:
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setWeakMatchAction('keep')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition ${
                      weakMatchAction === 'keep'
                        ? 'bg-blue-100 border-blue-500 text-blue-900'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-semibold mb-1">Conserver</div>
                    <div className="text-xs">Rester dans "Reçues"</div>
                  </button>
                  <button
                    onClick={() => setWeakMatchAction('reject')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition ${
                      weakMatchAction === 'reject'
                        ? 'bg-red-100 border-red-500 text-red-900'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-semibold mb-1">Rejeter</div>
                    <div className="text-xs">Déplacer vers "Rejetées"</div>
                  </button>
                </div>
              </div>
              {grouped.weak.length > 0 && (
                <div className="mt-3 space-y-1">
                  {grouped.weak.slice(0, 3).map((r) => (
                    <div key={r.applicationId} className="text-sm text-red-700 flex items-center gap-2">
                      <CheckCircle className="w-3 h-3" />
                      <span>{r.candidateName} ({r.score}%)</span>
                    </div>
                  ))}
                  {grouped.weak.length > 3 && (
                    <div className="text-sm text-red-600 ml-5">
                      +{grouped.weak.length - 3} autre{grouped.weak.length - 3 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Historique complet</h3>
                <p className="text-sm text-blue-700">
                  Toutes les actions seront enregistrées dans l'historique de chaque candidature.
                  Vous pourrez consulter les détails et les scores à tout moment.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-gray-200 p-6 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            disabled={injecting}
            className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={injecting}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {injecting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Injection en cours...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Confirmer l'injection</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
