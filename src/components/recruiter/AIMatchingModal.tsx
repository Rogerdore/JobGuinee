import { X, Sparkles, TrendingUp, TrendingDown, Award, AlertCircle, CheckCircle, User, Briefcase, Check, Lock, Crown } from 'lucide-react';
import { useState } from 'react';

interface AIMatchingModalProps {
  job: {
    id: string;
    title: string;
    description: string;
    required_skills: string[];
    experience_level: string;
    education_level: string;
  };
  applications: Array<{
    id: string;
    ai_score: number;
    ai_category: string;
    candidate: {
      full_name: string;
      email: string;
      avatar_url?: string;
    };
    candidate_profile: {
      title?: string;
      experience_years?: number;
      education_level?: string;
      skills?: string[];
    };
  }>;
  onClose: () => void;
  onUpdateScores: (scores: Array<{ id: string; score: number; category: string }>) => void;
  isPremium: boolean;
  onUpgrade: () => void;
}

interface MatchingResult {
  applicationId: string;
  candidateName: string;
  candidateTitle: string;
  oldScore: number;
  newScore: number;
  category: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export default function AIMatchingModal({ job, applications, onClose, onUpdateScores, isPremium, onUpgrade }: AIMatchingModalProps) {
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<MatchingResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);

  console.log('AIMatchingModal - isPremium:', isPremium);
  console.log('AIMatchingModal - applications count:', applications.length);
  console.log('AIMatchingModal - job:', job);

  const toggleCandidate = (id: string) => {
    const newSelected = new Set(selectedCandidates);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCandidates(newSelected);
  };

  const toggleAll = () => {
    if (selectedCandidates.size === applications.length) {
      setSelectedCandidates(new Set());
    } else {
      setSelectedCandidates(new Set(applications.map(app => app.id)));
    }
  };

  const analyzeProfile = (application: any): MatchingResult => {
    const candidate = application.candidate_profile;
    const candidateSkills = candidate?.skills || [];
    const jobSkills = job.required_skills || [];

    let score = 50;
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    const matchingSkills = candidateSkills.filter((skill: string) =>
      jobSkills.some(jobSkill =>
        jobSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(jobSkill.toLowerCase())
      )
    );

    const skillMatchPercentage = jobSkills.length > 0
      ? (matchingSkills.length / jobSkills.length) * 100
      : 50;

    score = Math.round(skillMatchPercentage * 0.4);

    if (matchingSkills.length > 0) {
      strengths.push(`Compétences correspondantes: ${matchingSkills.slice(0, 3).join(', ')}`);
      score += 15;
    } else {
      weaknesses.push('Aucune compétence technique correspondante trouvée');
      recommendations.push('Vérifier les compétences transférables du candidat');
    }

    const requiredExp = parseInt(job.experience_level) || 0;
    const candidateExp = candidate?.experience_years || 0;

    if (candidateExp >= requiredExp) {
      const expBonus = Math.min(20, Math.round((candidateExp / Math.max(requiredExp, 1)) * 10));
      score += expBonus;
      strengths.push(`${candidateExp} ans d'expérience (requis: ${requiredExp}+)`);
    } else if (candidateExp >= requiredExp * 0.7) {
      score += 10;
      weaknesses.push(`Expérience légèrement en dessous des attentes (${candidateExp} vs ${requiredExp} ans)`);
    } else {
      weaknesses.push(`Manque d'expérience (${candidateExp} vs ${requiredExp} ans requis)`);
      recommendations.push('Évaluer la motivation et la capacité d\'apprentissage');
    }

    const educationMatch = candidate?.education_level?.toLowerCase().includes(job.education_level?.toLowerCase() || '');
    if (educationMatch) {
      score += 10;
      strengths.push(`Niveau d'études conforme: ${candidate.education_level}`);
    } else {
      weaknesses.push('Niveau d\'études différent des prérequis');
    }

    if (candidate?.title) {
      const titleRelevance = job.title.toLowerCase().split(' ').some(word =>
        candidate.title?.toLowerCase().includes(word) && word.length > 3
      );
      if (titleRelevance) {
        score += 10;
        strengths.push('Titre professionnel pertinent');
      }
    }

    score = Math.min(100, Math.max(0, score));

    let category = 'weak';
    if (score >= 75) {
      category = 'strong';
      recommendations.push('Candidat fortement recommandé pour un entretien');
    } else if (score >= 50) {
      category = 'medium';
      recommendations.push('Candidat intéressant, nécessite une évaluation approfondie');
    } else {
      category = 'weak';
      recommendations.push('Profil ne correspondant pas aux critères principaux');
    }

    if (strengths.length === 0) {
      strengths.push('Profil général à évaluer en entretien');
    }

    return {
      applicationId: application.id,
      candidateName: application.candidate.full_name,
      candidateTitle: candidate?.title || 'Profil',
      oldScore: application.ai_score || 0,
      newScore: score,
      category,
      strengths,
      weaknesses,
      recommendations,
    };
  };

  const startAnalysis = () => {
    console.log('startAnalysis called - isPremium:', isPremium);
    console.log('startAnalysis - selectedCandidates:', selectedCandidates.size);

    if (selectedCandidates.size === 0) {
      alert('Veuillez sélectionner au moins un candidat à analyser');
      return;
    }

    if (!isPremium) {
      console.log('Not premium - showing upgrade prompt');
      alert('⭐ Fonctionnalité Premium\n\nL\'analyse IA et le matching automatique des candidatures sont réservés aux membres Premium.\n\nPassez à Premium pour :\n• Scoring automatique des candidatures\n• Analyse approfondie des profils\n• Recommandations personnalisées\n• Statistiques avancées');
      onUpgrade();
      return;
    }

    console.log('Starting analysis...');
    setAnalyzing(true);
    setResults([]);
    setCurrentIndex(0);
    setShowResults(false);

    const selectedApps = applications.filter(app => selectedCandidates.has(app.id));
    console.log('Selected apps for analysis:', selectedApps.length);

    let currentIdx = 0;
    const interval = setInterval(() => {
      currentIdx++;
      setCurrentIndex(currentIdx);

      if (currentIdx >= selectedApps.length) {
        clearInterval(interval);
        console.log('Progress animation complete');
      }
    }, 800);

    const analysisResults = selectedApps.map(analyzeProfile);
    console.log('Analysis results:', analysisResults);

    setTimeout(() => {
      console.log('Showing results...');
      setResults(analysisResults);
      setShowResults(true);
      setAnalyzing(false);

      const scores = analysisResults.map(r => ({
        id: r.applicationId,
        score: r.newScore,
        category: r.category,
      }));

      console.log('Updating scores:', scores);
      onUpdateScores(scores);
    }, selectedApps.length * 800 + 500);
  };

  const progress = selectedCandidates.size > 0 ? ((currentIndex + 1) / selectedCandidates.size) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-[#0E2F56] via-blue-700 to-[#0E2F56] text-white p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF8C00] rounded-full filter blur-3xl"></div>
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Sparkles className="w-10 h-10 animate-pulse" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-1">Analyse IA & Matching</h2>
                <p className="text-blue-100">
                  Scoring automatique des candidatures pour: <span className="font-semibold">{job.title}</span>
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

        <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
          {!showResults && !analyzing && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Sélectionnez les candidats à analyser
                </h3>
                <button
                  onClick={toggleAll}
                  className="px-4 py-2 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-semibold rounded-lg transition flex items-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  {selectedCandidates.size === applications.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              </div>

              {applications.length === 0 ? (
                <div className="text-center py-16">
                  <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">Aucune candidature disponible pour ce projet</p>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => toggleCandidate(app.id)}
                      className={`p-5 border-2 rounded-2xl cursor-pointer transition-all ${
                        selectedCandidates.has(app.id)
                          ? 'border-[#0E2F56] bg-blue-50 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                          selectedCandidates.has(app.id)
                            ? 'bg-[#0E2F56] border-[#0E2F56]'
                            : 'border-gray-300'
                        }`}>
                          {selectedCandidates.has(app.id) && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>

                        <div className="w-12 h-12 bg-gradient-to-br from-[#0E2F56] to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          {app.candidate.full_name.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            {app.candidate.full_name}
                          </h4>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {app.candidate_profile?.title || 'Profil'}
                          </p>
                        </div>

                        <div className="text-center">
                          <div className={`px-4 py-2 rounded-xl ${
                            app.ai_score >= 75
                              ? 'bg-green-100 text-green-700'
                              : app.ai_score >= 50
                              ? 'bg-yellow-100 text-yellow-700'
                              : app.ai_score > 0
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            <div className="text-xs font-semibold mb-1">Score actuel</div>
                            <div className="text-2xl font-bold">
                              {app.ai_score > 0 ? `${app.ai_score}%` : 'Non scoré'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {app.candidate_profile?.skills && app.candidate_profile.skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {app.candidate_profile.skills.slice(0, 5).map((skill, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {applications.length > 0 && (
                <div>
                  {!isPremium && (
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-400 rounded-2xl p-6 mb-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-amber-500 rounded-xl">
                          <Crown className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-lg mb-2 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-amber-600" />
                            Fonctionnalité Premium Requise
                          </h4>
                          <p className="text-gray-700 mb-4">
                            L'analyse IA et le matching automatique des candidatures sont réservés aux membres Premium.
                            Passez à Premium pour débloquer cette fonctionnalité puissante et bien plus encore.
                          </p>
                          <ul className="space-y-2 mb-4">
                            <li className="flex items-center gap-2 text-sm text-gray-700">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Scoring automatique IA des candidatures
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-700">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Analyses détaillées avec recommandations
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-700">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Accès à la CVthèque avec profils anonymisés
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-700">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Statistiques et analytics avancées
                            </li>
                          </ul>
                          <button
                            onClick={onUpgrade}
                            className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                          >
                            <Crown className="w-5 h-5" />
                            Passer à Premium
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-6 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-blue-900 text-lg mb-1">
                          {selectedCandidates.size} candidat{selectedCandidates.size > 1 ? 's' : ''} sélectionné{selectedCandidates.size > 1 ? 's' : ''}
                        </h4>
                        <p className="text-sm text-blue-700">
                          {selectedCandidates.size === 0
                            ? 'Cochez les candidats que vous souhaitez analyser'
                            : isPremium
                            ? `Prêt à analyser ${selectedCandidates.size} profil${selectedCandidates.size > 1 ? 's' : ''}`
                            : 'Passez à Premium pour lancer l\'analyse'}
                        </p>
                      </div>
                      <button
                        onClick={startAnalysis}
                        disabled={selectedCandidates.size === 0}
                        className={`px-8 py-4 rounded-xl font-semibold text-lg flex items-center gap-3 transition-all ${
                          selectedCandidates.size === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-[#0E2F56] hover:bg-[#1a4275] text-white shadow-md hover:shadow-lg'
                        }`}
                      >
                        {!isPremium ? (
                          <>
                            <Lock className="w-6 h-6" />
                            Premium Requis
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-6 h-6" />
                            Lancer l'analyse
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {analyzing && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#0E2F56]/20 border-t-[#0E2F56]"></div>
                  <span className="text-lg font-semibold text-gray-900">
                    Analyse en cours... {currentIndex + 1}/{selectedCandidates.size}
                  </span>
                </div>
                <span className="text-2xl font-bold text-[#0E2F56]">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#0E2F56] via-blue-600 to-[#FF8C00] transition-all duration-500 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-3 text-center">
                Analyse des compétences, expérience et adéquation au poste...
              </p>
            </div>
          )}

          {showResults && results.length > 0 && (
            <div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-bold text-green-900">Analyse terminée !</h3>
                </div>
                <p className="text-green-700">
                  {results.length} candidature{results.length > 1 ? 's analysées' : ' analysée'} et scorée{results.length > 1 ? 's' : ''} avec succès.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-2xl p-6 text-center">
                  <div className="text-4xl font-bold text-green-700 mb-2">
                    {results.filter(r => r.category === 'strong').length}
                  </div>
                  <div className="text-sm font-semibold text-green-600">Profils Forts</div>
                  <div className="text-xs text-green-500 mt-1">≥ 75%</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-2xl p-6 text-center">
                  <div className="text-4xl font-bold text-yellow-700 mb-2">
                    {results.filter(r => r.category === 'medium').length}
                  </div>
                  <div className="text-sm font-semibold text-yellow-600">Profils Moyens</div>
                  <div className="text-xs text-yellow-500 mt-1">50-74%</div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-2xl p-6 text-center">
                  <div className="text-4xl font-bold text-red-700 mb-2">
                    {results.filter(r => r.category === 'weak').length}
                  </div>
                  <div className="text-sm font-semibold text-red-600">Profils Faibles</div>
                  <div className="text-xs text-red-500 mt-1">&lt; 50%</div>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">Résultats détaillés</h3>
              <div className="space-y-4">
                {results
                  .sort((a, b) => b.newScore - a.newScore)
                  .map((result, index) => (
                  <div
                    key={result.applicationId}
                    className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#0E2F56] to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <User className="w-5 h-5 text-[#0E2F56]" />
                            {result.candidateName}
                          </h4>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {result.candidateTitle}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {result.oldScore > 0 && (
                          <div className="text-center">
                            <div className="text-sm text-gray-500 mb-1">Ancien</div>
                            <div className="text-2xl font-bold text-gray-400">{result.oldScore}%</div>
                          </div>
                        )}
                        <div className={`text-center px-6 py-3 rounded-2xl ${
                          result.category === 'strong'
                            ? 'bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-300'
                            : result.category === 'medium'
                            ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 border-2 border-yellow-300'
                            : 'bg-gradient-to-br from-red-100 to-red-200 border-2 border-red-300'
                        }`}>
                          <div className="text-sm font-semibold mb-1 opacity-75">Nouveau score</div>
                          <div className={`text-4xl font-bold ${
                            result.category === 'strong' ? 'text-green-700' :
                            result.category === 'medium' ? 'text-yellow-700' : 'text-red-700'
                          }`}>
                            {result.newScore}%
                          </div>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            {result.newScore > result.oldScore ? (
                              <>
                                <TrendingUp className="w-4 h-4 text-green-600" />
                                <span className="text-xs font-semibold text-green-600">
                                  +{result.newScore - result.oldScore}
                                </span>
                              </>
                            ) : result.newScore < result.oldScore ? (
                              <>
                                <TrendingDown className="w-4 h-4 text-red-600" />
                                <span className="text-xs font-semibold text-red-600">
                                  {result.newScore - result.oldScore}
                                </span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <h5 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                          <Award className="w-4 h-4" />
                          Points forts
                        </h5>
                        <ul className="space-y-1">
                          {result.strengths.map((strength, i) => (
                            <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                              <span className="text-green-500 mt-0.5">✓</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {result.weaknesses.length > 0 && (
                        <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                          <h5 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Points d'attention
                          </h5>
                          <ul className="space-y-1">
                            {result.weaknesses.map((weakness, i) => (
                              <li key={i} className="text-sm text-orange-700 flex items-start gap-2">
                                <span className="text-orange-500 mt-0.5">⚠</span>
                                <span>{weakness}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <h5 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Recommandations
                        </h5>
                        <ul className="space-y-1">
                          {result.recommendations.map((rec, i) => (
                            <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">→</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {!analyzing && (
          <div className="border-t-2 border-gray-200 p-6 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full py-4 bg-gradient-to-r from-[#0E2F56] to-blue-700 hover:from-blue-700 hover:to-[#0E2F56] text-white font-bold text-lg rounded-xl transition shadow-lg"
            >
              {showResults ? 'Fermer et appliquer les scores' : 'Annuler'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
