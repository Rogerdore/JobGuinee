import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';
import {
  BarChart3,
  Search,
  Filter,
  Download,
  AlertCircle,
  Loader,
  Calendar,
  User,
  TrendingUp,
  Activity,
  Eye,
  Award,
  Briefcase,
} from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ProfileAnalysis {
  id: string;
  user_id: string;
  offer_id: string | null;
  score: number;
  points_forts: any;
  ameliorations: any;
  formations_suggerees: any;
  recommandations: any;
  offer_title: string | null;
  offer_company: string | null;
  status: string;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface AnalysisStats {
  total: number;
  today: number;
  week: number;
  avgScore: number;
  generalAnalyses: number;
  jobComparisons: number;
}

export default function ProfileAnalysisAdmin() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<ProfileAnalysis[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<ProfileAnalysis[]>([]);
  const [stats, setStats] = useState<AnalysisStats>({
    total: 0,
    today: 0,
    week: 0,
    avgScore: 0,
    generalAnalyses: 0,
    jobComparisons: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'general' | 'comparison'>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [selectedAnalysis, setSelectedAnalysis] = useState<ProfileAnalysis | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadAnalyses();
  }, [dateRange]);

  useEffect(() => {
    applyFilters();
    calculateStats();
  }, [searchTerm, filterType, analyses]);

  const loadAnalyses = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('ai_profile_analysis')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `);

      if (dateRange !== 'all') {
        const daysMap = { today: 0, week: 7, month: 30 };
        const startDate = startOfDay(subDays(new Date(), daysMap[dateRange]));
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error: any) {
      showMessage('error', 'Erreur lors du chargement des analyses: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...analyses];

    if (searchTerm.trim()) {
      filtered = filtered.filter(analysis =>
        analysis.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.offer_title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      if (filterType === 'general') {
        filtered = filtered.filter(analysis => !analysis.offer_id);
      } else {
        filtered = filtered.filter(analysis => analysis.offer_id);
      }
    }

    setFilteredAnalyses(filtered);
  };

  const calculateStats = () => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfDay(subDays(now, 7));

    const todayCount = analyses.filter(a =>
      new Date(a.created_at) >= todayStart
    ).length;

    const weekCount = analyses.filter(a =>
      new Date(a.created_at) >= weekStart
    ).length;

    const avgScore = analyses.length > 0
      ? Math.round(analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length)
      : 0;

    const generalAnalyses = analyses.filter(a => !a.offer_id).length;
    const jobComparisons = analyses.filter(a => a.offer_id).length;

    setStats({
      total: analyses.length,
      today: todayCount,
      week: weekCount,
      avgScore,
      generalAnalyses,
      jobComparisons,
    });
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Bon';
    if (score >= 40) return 'Moyen';
    return 'Faible';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analyses de Profil IA</h1>
            <p className="text-gray-600 mt-1">
              Historique et statistiques des analyses de profil
            </p>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-lg flex items-center space-x-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'
          }`}>
            {message.type === 'success' ? (
              <AlertCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-8 h-8 opacity-80" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
            <h3 className="text-lg font-semibold mb-1">Total Analyses</h3>
            <p className="text-blue-100 text-sm">Toutes périodes</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 opacity-80" />
              <span className="text-2xl font-bold">{stats.week}</span>
            </div>
            <h3 className="text-lg font-semibold mb-1">Cette Semaine</h3>
            <p className="text-green-100 text-sm">+{stats.today} aujourd'hui</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Award className="w-8 h-8 opacity-80" />
              <span className="text-2xl font-bold">{stats.avgScore}%</span>
            </div>
            <h3 className="text-lg font-semibold mb-1">Score Moyen</h3>
            <p className="text-purple-100 text-sm">Toutes analyses</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex-1 flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, email, offre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tous types</option>
                  <option value="general">Analyses générales</option>
                  <option value="comparison">Comparaisons offres</option>
                </select>

                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="today">Aujourd'hui</option>
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                  <option value="all">Toutes périodes</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : filteredAnalyses.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune analyse trouvée</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAnalyses.map((analysis) => (
                    <tr key={analysis.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {analysis.profiles?.full_name || 'Utilisateur'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {analysis.profiles?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {analysis.offer_id ? (
                            <>
                              <Briefcase className="w-4 h-4 text-blue-600" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {analysis.offer_title}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {analysis.offer_company}
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <User className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-gray-900">Analyse générale</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(analysis.score)}`}>
                          {analysis.score}% - {getScoreBadge(analysis.score)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(analysis.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedAnalysis(analysis)}
                          className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Voir détails</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {selectedAnalysis && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Détails de l'Analyse</h3>
                <button
                  onClick={() => setSelectedAnalysis(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 mb-1">
                        {selectedAnalysis.profiles?.full_name}
                      </h4>
                      <p className="text-gray-600">{selectedAnalysis.profiles?.email}</p>
                    </div>
                    <div className={`px-6 py-3 rounded-full text-2xl font-bold ${getScoreColor(selectedAnalysis.score)}`}>
                      {selectedAnalysis.score}%
                    </div>
                  </div>
                  {selectedAnalysis.offer_title && (
                    <div className="flex items-center space-x-2 text-gray-700">
                      <Briefcase className="w-5 h-5" />
                      <span className="font-medium">{selectedAnalysis.offer_title}</span>
                      {selectedAnalysis.offer_company && (
                        <span className="text-gray-500">• {selectedAnalysis.offer_company}</span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center space-x-2">
                    <Award className="w-5 h-5 text-green-600" />
                    <span>Points Forts</span>
                  </h4>
                  <ul className="space-y-2">
                    {(Array.isArray(selectedAnalysis.points_forts)
                      ? selectedAnalysis.points_forts
                      : []
                    ).map((point: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-green-600 mt-1">✓</span>
                        <span className="text-gray-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span>Axes d'Amélioration</span>
                  </h4>
                  <ul className="space-y-2">
                    {(Array.isArray(selectedAnalysis.ameliorations)
                      ? selectedAnalysis.ameliorations
                      : []
                    ).map((point: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-blue-600 mt-1">→</span>
                        <span className="text-gray-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-3">Formations Suggérées</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(Array.isArray(selectedAnalysis.formations_suggerees)
                      ? selectedAnalysis.formations_suggerees
                      : []
                    ).map((formation: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-900 mb-1">{formation.titre}</h5>
                        <p className="text-sm text-gray-600">{formation.domaine}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>⏱ {formation.duree}</span>
                          <span>📊 {formation.niveau}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
