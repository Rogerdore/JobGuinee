import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Brain,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Lightbulb,
  Download,
  Loader,
  ChevronRight,
  BarChart3,
  Award,
  Briefcase,
  Building,
  Search,
  X,
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company_name: string;
  location: string;
}

interface ProfileAnalysis {
  id: string;
  score: number;
  skills_match?: number;
  experience_match?: number;
  education_match?: number;
  points_forts: string[];
  ameliorations: string[];
  formations_suggerees: Array<{
    titre: string;
    domaine: string;
    duree: string;
    niveau: string;
  }>;
  recommandations: string[];
  offer_title?: string;
  offer_company?: string;
  date_analyse: string;
}

interface AIMatchingServiceProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
  onNavigateToJobs?: () => void;
  preSelectedJob?: Job | null;
}

export default function AIMatchingService({ onBack, onNavigate, onNavigateToJobs, preSelectedJob }: AIMatchingServiceProps) {
  const { user } = useAuth();
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState('');

  // Sélection d'offre
  const [showJobSelection, setShowJobSelection] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [manualPosition, setManualPosition] = useState('');

  // Gestion des crédits
  const [creditBalance, setCreditBalance] = useState(0);
  const [serviceCost, setServiceCost] = useState(50);
  const [loadingCredits, setLoadingCredits] = useState(true);

  useEffect(() => {
    if (user) {
      loadAnalyses();
      loadJobs();
      loadCredits();
    }
  }, [user]);

  useEffect(() => {
    if (preSelectedJob) {
      setSelectedJob(preSelectedJob);
      setShowJobSelection(false);
    }
  }, [preSelectedJob]);

  const loadCredits = async () => {
    if (!user) return;

    setLoadingCredits(true);
    try {
      // Récupérer le solde
      const { data: balance, error } = await supabase.rpc('get_user_credit_balance', {
        p_user_id: user.id
      });

      if (error) throw error;

      setCreditBalance(balance || 0);

      // Récupérer le coût du service
      const { data: cost } = await supabase
        .from('service_credit_costs')
        .select('credits_cost')
        .eq('service_code', 'profile_analysis')
        .single();

      if (cost) {
        setServiceCost(cost.credits_cost);
      }
    } catch (error: any) {
      console.error('Erreur chargement crédits:', error);
    } finally {
      setLoadingCredits(false);
    }
  };

  const loadAnalyses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_user_profile_analyses', {
        p_user_id: user.id,
        p_limit: 10,
      });

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error: any) {
      console.error('Erreur:', error);
    }
  };

  const loadJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          location,
          companies!inner(name)
        `)
        .eq('status', 'published')
        .limit(50);

      if (error) throw error;

      const jobsFormatted = (data || []).map((job: any) => ({
        id: job.id,
        title: job.title,
        company_name: job.companies?.name || 'Entreprise',
        location: job.location,
      }));

      setJobs(jobsFormatted);
    } catch (error: any) {
      console.error('Erreur chargement offres:', error);
    }
  };

  const analyzeProfile = async (jobId?: string, manual?: string) => {
    if (!user) return;

    // Vérifier les crédits avant de lancer l'analyse
    if (creditBalance < serviceCost) {
      setError(`Crédits insuffisants. Requis: ${serviceCost} crédits, Disponibles: ${creditBalance} crédits`);
      return;
    }

    setAnalyzing(true);
    setError('');
    setShowJobSelection(false);

    try {
      // Utiliser les crédits
      const { data: creditResult } = await supabase.rpc('use_credits_for_service', {
        p_user_id: user.id,
        p_service_code: 'profile_analysis',
        p_metadata: {
          offer_id: jobId,
          manual_position: manual
        }
      });

      if (!creditResult.success) {
        setError(creditResult.message || 'Crédits insuffisants');
        return;
      }

      // Mettre à jour le solde
      setCreditBalance(creditResult.new_balance);

      // Lancer l'analyse
      const { data, error } = await supabase.rpc('analyze_profile_with_ai', {
        p_user_id: user.id,
        p_offer_id: jobId || null,
        p_manual_position: manual || null,
      });

      if (error) throw error;

      if (!data.success) {
        setError(data.message || 'Erreur lors de l\'analyse');
        return;
      }

      setAnalysis({
        id: data.analysis_id,
        score: data.score,
        skills_match: data.skills_match,
        experience_match: data.experience_match,
        education_match: data.education_match,
        points_forts: data.points_forts || [],
        ameliorations: data.ameliorations || [],
        formations_suggerees: data.formations_suggerees || [],
        recommandations: data.recommandations || [],
        offer_title: data.offer_title,
        offer_company: data.offer_company,
        date_analyse: new Date().toISOString(),
      });

      await loadAnalyses();

      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Analyse de profil terminée',
        message: `Votre score de compatibilité est de ${data.score}%`,
        type: 'success',
      });
    } catch (error: any) {
      console.error('Erreur:', error);
      setError('Une erreur est survenue lors de l\'analyse');
    } finally {
      setAnalyzing(false);
    }
  };

  const downloadReport = async () => {
    if (!analysis) return;

    try {
      await supabase.rpc('increment_analysis_download', {
        p_analysis_id: analysis.id,
      });

      alert('Téléchargement du rapport PDF (fonctionnalité à venir)');
    } catch (error: any) {
      console.error('Erreur:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-blue-500 to-blue-600';
    if (score >= 40) return 'from-yellow-500 to-orange-500';
    return 'from-orange-500 to-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Bon';
    if (score >= 40) return 'Moyen';
    return 'À améliorer';
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 text-blue-900 hover:text-blue-700 font-medium flex items-center space-x-2"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
            <span>Retour</span>
          </button>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Analyse IA de Profil
            </h1>
            <p className="text-gray-600">
              Obtenez une analyse complète de votre profil avec des recommandations personnalisées
            </p>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center space-x-2"
          >
            <BarChart3 className="w-5 h-5" />
            <span>{showHistory ? 'Nouvelle analyse' : 'Historique'}</span>
          </button>
        </div>
      </div>

      {showJobSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Sélectionner une offre</h3>
                <button
                  onClick={() => setShowJobSelection(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher un poste ou une entreprise..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ou saisissez un poste manuellement
                </label>
                <input
                  type="text"
                  value={manualPosition}
                  onChange={(e) => setManualPosition(e.target.value)}
                  placeholder="Ex: Responsable RH"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                {manualPosition && (
                  <button
                    onClick={() => analyzeProfile(undefined, manualPosition)}
                    className="mt-2 w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                  >
                    Analyser avec ce poste
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {filteredJobs.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Aucune offre trouvée</p>
                ) : (
                  filteredJobs.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => {
                        setSelectedJob(job);
                        analyzeProfile(job.id);
                      }}
                      className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition"
                    >
                      <div className="flex items-start space-x-3">
                        <Briefcase className="w-5 h-5 text-purple-600 mt-1" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{job.title}</h4>
                          <p className="text-sm text-gray-600">{job.company_name}</p>
                          <p className="text-sm text-gray-500">{job.location}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showHistory ? (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Mes Analyses Précédentes</h3>
          {analyses.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune analyse disponible</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analyses.map((item) => (
                <div
                  key={item.id}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:border-purple-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                        <span className="text-2xl font-bold text-purple-900">
                          {item.score}%
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">
                          {item.offer_title || 'Analyse générale'}
                        </h4>
                        {item.offer_company && (
                          <p className="text-sm text-gray-600">{item.offer_company}</p>
                        )}
                        <p className="text-sm text-gray-500">
                          {new Date(item.date_analyse).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        const { data } = await supabase.rpc('get_profile_analysis_detail', {
                          p_analysis_id: item.id,
                        });
                        if (data.success) {
                          setAnalysis(data);
                          setShowHistory(false);
                        }
                      }}
                      className="text-purple-600 hover:text-purple-800 font-medium flex items-center space-x-1"
                    >
                      <span>Voir</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : !analysis ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl shadow-2xl p-8 text-white">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Brain className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Analyse Intelligente</h2>
                  <p className="text-purple-100">Propulsée par l'IA</p>
                </div>
              </div>

              <p className="text-purple-50 mb-6 leading-relaxed">
                Notre IA analyse votre profil et le compare avec une offre d'emploi pour vous fournir
                un score de compatibilité détaillé et des recommandations personnalisées.
              </p>

              <div className="mb-6 bg-white bg-opacity-10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-purple-100">Coût du service:</span>
                  <span className="text-xl font-bold text-white">{serviceCost} ⚡</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-100">Votre solde:</span>
                  <span className={`text-xl font-bold ${creditBalance >= serviceCost ? 'text-green-300' : 'text-red-300'}`}>
                    {loadingCredits ? '...' : creditBalance} ⚡
                  </span>
                </div>
                {creditBalance < serviceCost && !loadingCredits && (
                  <div className="mt-3 pt-3 border-t border-white border-opacity-20">
                    <p className="text-xs text-red-200 mb-2">Crédits insuffisants</p>
                    <button className="w-full bg-yellow-500 text-yellow-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition text-sm">
                      Acheter des crédits
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {selectedJob && (
                  <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Briefcase className="w-4 h-4 text-white" />
                          <h4 className="font-semibold text-white">{selectedJob.title}</h4>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-purple-100">
                          <Building className="w-3 h-3" />
                          <span>{selectedJob.company_name}</span>
                        </div>
                        {selectedJob.location && (
                          <p className="text-xs text-purple-200 mt-1">{selectedJob.location}</p>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedJob(null)}
                        className="text-white hover:text-red-300 transition"
                        title="Supprimer la sélection"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-xs text-green-300 font-medium mt-2">✓ Offre sélectionnée</p>
                  </div>
                )}

                {onNavigateToJobs && !selectedJob ? (
                  <button
                    onClick={onNavigateToJobs}
                    disabled={analyzing || loadingCredits || creditBalance < serviceCost}
                    className="w-full bg-white text-purple-900 px-6 py-4 rounded-lg font-bold hover:bg-purple-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
                  >
                    <Briefcase className="w-5 h-5" />
                    <span>Comparer avec une offre ({serviceCost} ⚡)</span>
                  </button>
                ) : !selectedJob ? (
                  <button
                    onClick={() => setShowJobSelection(true)}
                    disabled={analyzing || loadingCredits || creditBalance < serviceCost}
                    className="w-full bg-white text-purple-900 px-6 py-4 rounded-lg font-bold hover:bg-purple-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
                  >
                    <Briefcase className="w-5 h-5" />
                    <span>Comparer avec une offre ({serviceCost} ⚡)</span>
                  </button>
                ) : null}

                <button
                  onClick={() => analyzeProfile()}
                  disabled={analyzing || loadingCredits || creditBalance < serviceCost}
                  className="w-full bg-purple-500 text-white px-6 py-4 rounded-lg font-bold hover:bg-purple-400 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {analyzing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Analyse en cours...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Analyse générale ({serviceCost} ⚡)</span>
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="mt-4 bg-red-500 bg-opacity-20 border border-red-300 rounded-lg p-3">
                  <p className="text-sm text-white">{error}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Ce que vous obtiendrez</h3>
              <div className="space-y-4">
                {[
                  { icon: TrendingUp, title: 'Score de Compatibilité', desc: 'Un score détaillé de 0 à 100%', color: 'text-blue-600' },
                  { icon: CheckCircle2, title: 'Points Forts', desc: 'Vos atouts professionnels', color: 'text-green-600' },
                  { icon: AlertCircle, title: 'Points à Améliorer', desc: 'Domaines de progression', color: 'text-orange-600' },
                  { icon: GraduationCap, title: 'Formations Suggérées', desc: 'Programmes adaptés', color: 'text-purple-600' },
                  { icon: Lightbulb, title: 'Recommandations', desc: 'Conseils personnalisés', color: 'text-yellow-600' },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-start space-x-3">
                      <div className={`w-10 h-10 ${item.color} bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{item.title}</h4>
                        <p className="text-sm text-gray-600">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl shadow-2xl p-8 text-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold">Votre Analyse IA</h2>
                {analysis.offer_title && (
                  <p className="text-purple-200 mt-1">
                    Pour: {analysis.offer_title}
                    {analysis.offer_company && ` chez ${analysis.offer_company}`}
                  </p>
                )}
              </div>
              <button
                onClick={downloadReport}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg font-medium transition flex items-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>PDF</span>
              </button>
            </div>

            <div className="bg-white bg-opacity-10 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 mb-1">Score Global</p>
                  <p className="text-5xl font-bold">{analysis.score}%</p>
                  <p className="text-purple-200 mt-1">{getScoreLabel(analysis.score)}</p>
                </div>
                {analysis.skills_match !== undefined && analysis.skills_match > 0 && (
                  <div className="text-right space-y-1 text-sm">
                    <p className="text-purple-100">Compétences: {analysis.skills_match}%</p>
                    <p className="text-purple-100">Expérience: {analysis.experience_match}%</p>
                    <p className="text-purple-100">Formation: {analysis.education_match}%</p>
                  </div>
                )}
              </div>

              <div className="w-full bg-white bg-opacity-20 rounded-full h-3 mt-4">
                <div
                  className={`h-3 rounded-full bg-gradient-to-r ${getScoreColor(analysis.score)} transition-all duration-1000`}
                  style={{ width: `${analysis.score}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <span>Points Forts</span>
              </h3>
              <ul className="space-y-3">
                {analysis.points_forts.map((point, idx) => (
                  <li key={idx} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <AlertCircle className="w-6 h-6 text-orange-600" />
                <span>Points à Améliorer</span>
              </h3>
              <ul className="space-y-3">
                {analysis.ameliorations.map((point, idx) => (
                  <li key={idx} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <GraduationCap className="w-6 h-6 text-purple-600" />
              <span>Formations Suggérées</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.formations_suggerees.map((formation, idx) => (
                <div key={idx} className="border-2 border-gray-200 rounded-lg p-4 hover:border-purple-300 transition">
                  <h4 className="font-bold text-gray-900 mb-2">{formation.titre}</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>🎯 {formation.domaine}</p>
                    <p>⏱️ {formation.duree}</p>
                    <p>📊 Niveau: {formation.niveau}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Lightbulb className="w-6 h-6 text-yellow-600" />
              <span>Recommandations</span>
            </h3>
            <ul className="space-y-3">
              {analysis.recommandations.map((reco, idx) => (
                <li key={idx} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                    {idx + 1}
                  </div>
                  <span className="text-gray-700">{reco}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setAnalysis(null)}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Nouvelle analyse
            </button>
            <button
              onClick={downloadReport}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition flex items-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Télécharger le rapport</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
