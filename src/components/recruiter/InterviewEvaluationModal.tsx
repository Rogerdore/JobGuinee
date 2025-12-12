import { useState, useEffect } from 'react';
import { X, Star, ThumbsUp, ThumbsDown, AlertCircle, CheckCircle } from 'lucide-react';
import { interviewEvaluationService, InterviewEvaluation } from '../../services/interviewEvaluationService';

interface InterviewEvaluationModalProps {
  interview: {
    id: string;
    application_id: string;
    candidate: {
      full_name: string;
    };
    job: {
      title: string;
    };
  };
  onClose: () => void;
  onSuccess?: () => void;
}

export default function InterviewEvaluationModal({ interview, onClose, onSuccess }: InterviewEvaluationModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingEvaluation, setExistingEvaluation] = useState<InterviewEvaluation | null>(null);

  const [technicalScore, setTechnicalScore] = useState(0);
  const [softSkillsScore, setSoftSkillsScore] = useState(0);
  const [motivationScore, setMotivationScore] = useState(0);
  const [culturalFitScore, setCulturalFitScore] = useState(0);
  const [recommendation, setRecommendation] = useState<'recommended' | 'to_confirm' | 'not_retained' | ''>('');
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [detailedFeedback, setDetailedFeedback] = useState('');
  const [hiringNotes, setHiringNotes] = useState('');

  useEffect(() => {
    loadExistingEvaluation();
  }, [interview.id]);

  const loadExistingEvaluation = async () => {
    setLoading(true);
    const evaluation = await interviewEvaluationService.getEvaluationByInterview(interview.id);

    if (evaluation) {
      setExistingEvaluation(evaluation);
      setTechnicalScore(evaluation.technical_score || 0);
      setSoftSkillsScore(evaluation.soft_skills_score || 0);
      setMotivationScore(evaluation.motivation_score || 0);
      setCulturalFitScore(evaluation.cultural_fit_score || 0);
      setRecommendation(evaluation.recommendation || '');
      setStrengths(evaluation.strengths || '');
      setWeaknesses(evaluation.weaknesses || '');
      setDetailedFeedback(evaluation.detailed_feedback || '');
      setHiringNotes(evaluation.hiring_recommendation_notes || '');
    }

    setLoading(false);
  };

  const calculateOverallScore = () => {
    return Math.round(
      technicalScore * 0.3 +
      softSkillsScore * 0.25 +
      motivationScore * 0.25 +
      culturalFitScore * 0.2
    );
  };

  const handleSave = async () => {
    if (!recommendation) {
      alert('Veuillez sélectionner une recommandation');
      return;
    }

    setSaving(true);

    const params = {
      interviewId: interview.id,
      applicationId: interview.application_id,
      technicalScore: technicalScore || undefined,
      softSkillsScore: softSkillsScore || undefined,
      motivationScore: motivationScore || undefined,
      culturalFitScore: culturalFitScore || undefined,
      recommendation: recommendation as 'recommended' | 'to_confirm' | 'not_retained',
      strengths: strengths || undefined,
      weaknesses: weaknesses || undefined,
      detailedFeedback: detailedFeedback || undefined,
      hiringRecommendationNotes: hiringNotes || undefined
    };

    let result;
    if (existingEvaluation) {
      result = await interviewEvaluationService.updateEvaluation(existingEvaluation.id, params);
    } else {
      result = await interviewEvaluationService.createEvaluation(params);
    }

    setSaving(false);

    if (result.success) {
      onSuccess?.();
      onClose();
    } else {
      alert('Erreur lors de l\'enregistrement de l\'évaluation: ' + result.error);
    }
  };

  const ScoreSlider = ({
    label,
    value,
    onChange,
    color
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    color: string;
  }) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-gray-900">{label}</label>
        <div className={`text-2xl font-bold ${color}`}>{value}%</div>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        step="5"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-3 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color === 'text-blue-600' ? '#2563eb' : color === 'text-green-600' ? '#16a34a' : color === 'text-purple-600' ? '#9333ea' : '#ea580c'} ${value}%, #e5e7eb ${value}%)`
        }}
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Faible</span>
        <span>Moyen</span>
        <span>Excellent</span>
      </div>
    </div>
  );

  const overallScore = calculateOverallScore();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-600 mt-4">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full my-8">
        <div className="bg-gradient-to-r from-purple-900 via-purple-700 to-purple-900 text-white p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Évaluation Post-Entretien</h2>
                <p className="text-purple-100 text-sm">
                  {interview.candidate.full_name} - {interview.job.title}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-6">
            <div className="text-center">
              <div className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                {overallScore}%
              </div>
              <div className="text-sm text-gray-600 font-medium">Score Global (calculé automatiquement)</div>
              <div className="text-xs text-gray-500 mt-1">
                Technique 30% • Soft Skills 25% • Motivation 25% • Culture 20%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ScoreSlider
              label="Compétences Techniques (30%)"
              value={technicalScore}
              onChange={setTechnicalScore}
              color="text-blue-600"
            />
            <ScoreSlider
              label="Soft Skills (25%)"
              value={softSkillsScore}
              onChange={setSoftSkillsScore}
              color="text-green-600"
            />
            <ScoreSlider
              label="Motivation & Engagement (25%)"
              value={motivationScore}
              onChange={setMotivationScore}
              color="text-purple-600"
            />
            <ScoreSlider
              label="Adéquation Culturelle (20%)"
              value={culturalFitScore}
              onChange={setCulturalFitScore}
              color="text-orange-600"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Recommandation *
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setRecommendation('recommended')}
                className={`p-4 rounded-xl border-2 transition ${
                  recommendation === 'recommended'
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <ThumbsUp className={`w-6 h-6 mx-auto mb-2 ${recommendation === 'recommended' ? 'text-green-600' : 'text-gray-400'}`} />
                <div className="text-sm font-semibold">Recommandé</div>
                <div className="text-xs text-gray-500">À recruter</div>
              </button>
              <button
                onClick={() => setRecommendation('to_confirm')}
                className={`p-4 rounded-xl border-2 transition ${
                  recommendation === 'to_confirm'
                    ? 'border-yellow-600 bg-yellow-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <AlertCircle className={`w-6 h-6 mx-auto mb-2 ${recommendation === 'to_confirm' ? 'text-yellow-600' : 'text-gray-400'}`} />
                <div className="text-sm font-semibold">À confirmer</div>
                <div className="text-xs text-gray-500">Besoin de vérifications</div>
              </button>
              <button
                onClick={() => setRecommendation('not_retained')}
                className={`p-4 rounded-xl border-2 transition ${
                  recommendation === 'not_retained'
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <ThumbsDown className={`w-6 h-6 mx-auto mb-2 ${recommendation === 'not_retained' ? 'text-red-600' : 'text-gray-400'}`} />
                <div className="text-sm font-semibold">Non retenu</div>
                <div className="text-xs text-gray-500">Éliminé</div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Points Forts
              </label>
              <textarea
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                rows={4}
                placeholder="Compétences, qualités, aptitudes remarquées..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Points d'Amélioration
              </label>
              <textarea
                value={weaknesses}
                onChange={(e) => setWeaknesses(e.target.value)}
                rows={4}
                placeholder="Axes de développement, lacunes identifiées..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Feedback Détaillé
            </label>
            <textarea
              value={detailedFeedback}
              onChange={(e) => setDetailedFeedback(e.target.value)}
              rows={4}
              placeholder="Commentaires généraux sur l'entretien, comportement, réponses..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Notes pour Décision Finale
            </label>
            <textarea
              value={hiringNotes}
              onChange={(e) => setHiringNotes(e.target.value)}
              rows={3}
              placeholder="Recommandations pour la direction, conditions d'embauche..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <strong>Confidentialité:</strong> Cette évaluation est strictement confidentielle et ne sera jamais visible par le candidat. Elle est réservée à l'usage interne de votre équipe de recrutement.
              </div>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-gray-200 p-6 bg-gray-50 rounded-b-3xl flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !recommendation}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>{existingEvaluation ? 'Mettre à jour' : 'Enregistrer'} l'évaluation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
