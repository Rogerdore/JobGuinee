import { useState, useEffect } from 'react';
import { X, TrendingUp, Star, Users, Award, Download } from 'lucide-react';
import { interviewEvaluationService, CandidateComparison } from '../../services/interviewEvaluationService';
import { institutionalReportingService } from '../../services/institutionalReportingService';

interface CandidateComparisonModalProps {
  jobId: string;
  jobTitle: string;
  companyId: string;
  onClose: () => void;
}

export default function CandidateComparisonModal({ jobId, jobTitle, companyId, onClose }: CandidateComparisonModalProps) {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [candidates, setCandidates] = useState<CandidateComparison[]>([]);
  const [hasEnterpriseAccess, setHasEnterpriseAccess] = useState(false);

  useEffect(() => {
    loadCandidates();
    checkEnterpriseAccess();
  }, [jobId]);

  const loadCandidates = async () => {
    setLoading(true);
    const data = await interviewEvaluationService.getCandidateComparison(jobId);
    setCandidates(data);
    setLoading(false);
  };

  const checkEnterpriseAccess = async () => {
    const hasAccess = await institutionalReportingService.checkEnterpriseAccess(companyId);
    setHasEnterpriseAccess(hasAccess);
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    const result = await institutionalReportingService.downloadReport(jobId);

    if (!result.success) {
      alert('Erreur lors de la génération du rapport: ' + result.error);
    }

    setGenerating(false);
  };

  const getRecommendationColor = (recommendation?: string) => {
    switch (recommendation) {
      case 'recommended': return 'bg-green-100 text-green-700 border-green-200';
      case 'to_confirm': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'not_retained': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-600 mt-4">Chargement de la comparaison...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-7xl w-full my-8">
        <div className="bg-gradient-to-r from-blue-900 via-blue-700 to-blue-900 text-white p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Comparaison des Candidats</h2>
                <p className="text-blue-100 text-sm">{jobTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasEnterpriseAccess && (
                <button
                  onClick={handleGenerateReport}
                  disabled={generating}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition flex items-center gap-2 disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Génération...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Rapport PDF</span>
                    </>
                  )}
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {candidates.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Aucun candidat à comparer pour le moment</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {candidates.map((candidate, index) => (
                <div
                  key={candidate.application_id}
                  className={`border-2 rounded-2xl p-5 transition ${
                    candidate.recommendation === 'recommended'
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl font-bold text-lg">
                        #{index + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{candidate.candidate_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            candidate.is_shortlisted
                              ? 'bg-blue-100 text-blue-700 border-blue-200'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}>
                            {candidate.workflow_stage}
                          </span>
                          {candidate.is_shortlisted && (
                            <span className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                              <Star className="w-3 h-3 fill-current" />
                              Shortlisté
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {candidate.recommendation && (
                      <span className={`px-4 py-2 rounded-xl text-sm font-bold border-2 ${getRecommendationColor(candidate.recommendation)}`}>
                        {interviewEvaluationService.getRecommendationLabel(candidate.recommendation as any)}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Score IA</div>
                      <div className={`text-2xl font-bold ${getScoreColor(candidate.ai_match_score)}`}>
                        {candidate.ai_match_score || '-'}
                        {candidate.ai_match_score && '%'}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Entretien</div>
                      <div className={`text-2xl font-bold ${getScoreColor(candidate.interview_score)}`}>
                        {candidate.interview_score || '-'}
                        {candidate.interview_score && '%'}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Technique</div>
                      <div className={`text-xl font-bold ${getScoreColor(candidate.technical_score)}`}>
                        {candidate.technical_score || '-'}
                        {candidate.technical_score && '%'}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Soft Skills</div>
                      <div className={`text-xl font-bold ${getScoreColor(candidate.soft_skills_score)}`}>
                        {candidate.soft_skills_score || '-'}
                        {candidate.soft_skills_score && '%'}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Motivation</div>
                      <div className={`text-xl font-bold ${getScoreColor(candidate.motivation_score)}`}>
                        {candidate.motivation_score || '-'}
                        {candidate.motivation_score && '%'}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Culture</div>
                      <div className={`text-xl font-bold ${getScoreColor(candidate.cultural_fit_score)}`}>
                        {candidate.cultural_fit_score || '-'}
                        {candidate.cultural_fit_score && '%'}
                      </div>
                    </div>
                  </div>

                  {candidate.evaluated_at && (
                    <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      Évalué le {new Date(candidate.evaluated_at).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!hasEnterpriseAccess && candidates.length > 0 && (
            <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Rapports PDF Institutionnels</h3>
                  <p className="text-sm text-gray-700 mb-3">
                    Générez des rapports professionnels complets avec statistiques détaillées, ROI IA et insights pour la direction.
                  </p>
                  <p className="text-xs text-purple-700 font-semibold">
                    ⭐ Disponible avec Enterprise PRO, Enterprise GOLD ou Cabinet RH
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t-2 border-gray-200 p-6 bg-gray-50 rounded-b-3xl">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
