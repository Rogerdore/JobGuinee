import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Briefcase,
  Clock,
  Target,
  Award,
  DollarSign,
  Zap,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  AlertCircle
} from 'lucide-react';
import { directionAnalyticsService, DirectionKPIs } from '../../services/directionAnalyticsService';

interface DirectionDashboardProps {
  companyId: string;
}

export default function DirectionDashboard({ companyId }: DirectionDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [kpis, setKPIs] = useState<DirectionKPIs | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    loadKPIs();
  }, [companyId, selectedPeriod]);

  const loadKPIs = async () => {
    setLoading(true);
    try {
      const data = await directionAnalyticsService.getDirectionKPIs(companyId);
      setKPIs(data);
    } catch (error) {
      console.error('Error loading Direction KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!kpis) {
    return (
      <div className="text-center p-12">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Impossible de charger les données</p>
      </div>
    );
  }

  const formatNumber = (num: number) => num.toLocaleString('fr-FR');
  const formatCurrency = (amount: number) => `${(amount / 1000000).toFixed(1)}M GNF`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Pilotage RH & Direction</h2>
          <p className="text-gray-600 mt-1">Vue synthétique de la performance recrutement</p>
        </div>

        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border-2 border-gray-200 shadow-sm">
          <Clock className="w-5 h-5 text-gray-500" />
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="border-none focus:ring-0 text-sm font-medium"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </select>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-900 via-blue-700 to-blue-900 text-white rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold">Indicateurs Clés de Performance</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Briefcase className="w-5 h-5 text-blue-200" />
              <div className="flex items-center gap-1 text-xs font-medium text-green-300">
                <ArrowUp className="w-3 h-3" />
                +12%
              </div>
            </div>
            <div className="text-3xl font-bold">{kpis.totalActiveJobs}</div>
            <div className="text-sm text-blue-200">Offres actives</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-blue-200" />
              <div className="flex items-center gap-1 text-xs font-medium text-green-300">
                <ArrowUp className="w-3 h-3" />
                +28%
              </div>
            </div>
            <div className="text-3xl font-bold">{formatNumber(kpis.totalApplications)}</div>
            <div className="text-sm text-blue-200">Candidatures totales</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-blue-200" />
              <div className="text-xs font-medium text-blue-200">Moyenne</div>
            </div>
            <div className="text-3xl font-bold">{kpis.avgTimeToHire}j</div>
            <div className="text-sm text-blue-200">Délai de recrutement</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-5 h-5 text-blue-200" />
              <div className="flex items-center gap-1 text-xs font-medium text-green-300">
                <ArrowUp className="w-3 h-3" />
                +15%
              </div>
            </div>
            <div className="text-3xl font-bold">{kpis.recruitmentROI.totalHired}</div>
            <div className="text-sm text-blue-200">Recrutements réussis</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-100 rounded-xl">
              <PieChart className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Répartition Candidats</h3>
              <p className="text-sm text-gray-600">Par niveau d'expérience</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Junior (0-3 ans)</span>
                <span className="text-sm font-bold text-gray-900">{kpis.candidateDistribution.junior} ({Math.round((kpis.candidateDistribution.junior / kpis.totalApplications) * 100)}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all"
                  style={{ width: `${(kpis.candidateDistribution.junior / kpis.totalApplications) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Intermédiaire (3-7 ans)</span>
                <span className="text-sm font-bold text-gray-900">{kpis.candidateDistribution.intermediate} ({Math.round((kpis.candidateDistribution.intermediate / kpis.totalApplications) * 100)}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${(kpis.candidateDistribution.intermediate / kpis.totalApplications) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Senior (7+ ans)</span>
                <span className="text-sm font-bold text-gray-900">{kpis.candidateDistribution.senior} ({Math.round((kpis.candidateDistribution.senior / kpis.totalApplications) * 100)}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-400 to-purple-600 h-3 rounded-full transition-all"
                  style={{ width: `${(kpis.candidateDistribution.senior / kpis.totalApplications) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">État du Pipeline</h3>
              <p className="text-sm text-gray-600">Distribution des candidatures</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Reçues', count: kpis.pipelineState.received, color: 'bg-gray-500' },
              { label: 'En criblage', count: kpis.pipelineState.screening, color: 'bg-yellow-500' },
              { label: 'Entretien', count: kpis.pipelineState.interview, color: 'bg-blue-500' },
              { label: 'Offre', count: kpis.pipelineState.offer, color: 'bg-purple-500' },
              { label: 'Recrutés', count: kpis.pipelineState.hired, color: 'bg-green-500' },
              { label: 'Refusés', count: kpis.pipelineState.rejected, color: 'bg-red-500' }
            ].map((stage, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{stage.label}</span>
                  <span className="text-sm font-bold text-gray-900">{stage.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-100 rounded-xl">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Performance par Offre</h3>
            <p className="text-sm text-gray-600">Analyse détaillée du recrutement</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Offre</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Candidatures</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Recrutés</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Taux réussite</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Délai moyen</th>
              </tr>
            </thead>
            <tbody>
              {kpis.performanceByJob.map((perf, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="py-3 px-4 font-medium text-gray-900">{perf.jobTitle}</td>
                  <td className="text-center py-3 px-4 text-gray-700">{perf.applicationsCount}</td>
                  <td className="text-center py-3 px-4">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                      {perf.hiredCount}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`px-3 py-1 rounded-full font-semibold ${
                      perf.successRate >= 20 ? 'bg-green-100 text-green-700' :
                      perf.successRate >= 10 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {perf.successRate}%
                    </span>
                  </td>
                  <td className="text-center py-3 px-4 text-gray-700">{perf.avgDaysToHire}j</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white/20 rounded-xl">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">ROI Intelligence Artificielle</h3>
              <p className="text-sm text-blue-100">Impact et performance IA</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-sm text-blue-100 mb-1">Crédits IA utilisés</div>
              <div className="text-2xl font-bold">{formatNumber(kpis.aiUsage.totalCreditsUsed)}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-sm text-blue-100 mb-1">Matchings réalisés</div>
              <div className="text-2xl font-bold">{kpis.aiUsage.totalMatchings}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-sm text-blue-100 mb-1">Score moyen IA</div>
              <div className="text-2xl font-bold">{kpis.aiUsage.avgMatchingScore}%</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-sm text-blue-100 mb-1">Temps économisé</div>
              <div className="text-2xl font-bold">{Math.round(kpis.aiUsage.timeSavedHours)}h</div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5" />
              <span className="text-sm font-semibold">Économies estimées</span>
            </div>
            <div className="text-3xl font-bold">{formatCurrency(kpis.aiUsage.aiCostSavings)}</div>
            <div className="text-xs text-blue-100 mt-1">Valeur du temps RH économisé par l'IA</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-800 text-white rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white/20 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Coût & Rentabilité</h3>
              <p className="text-sm text-green-100">Analyse financière recrutement</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-sm text-green-100 mb-1">Recrutements réalisés</div>
              <div className="text-4xl font-bold">{kpis.recruitmentROI.totalHired}</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-sm text-green-100 mb-1">Coût moyen par recrutement</div>
              <div className="text-3xl font-bold">{formatCurrency(kpis.recruitmentROI.avgCostPerHire)}</div>
              <div className="text-xs text-green-100 mt-1">Incluant processus et outils</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-sm text-green-100 mb-1">Économies IA totales</div>
              <div className="text-3xl font-bold">{formatCurrency(kpis.recruitmentROI.aiCostSavings)}</div>
              <div className="text-xs text-green-100 mt-1">vs processus manuel</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-bold text-yellow-900 mb-2">Mode Direction - Lecture Seule</h4>
            <p className="text-sm text-yellow-800 leading-relaxed">
              Cette vue synthétique est conçue pour la Direction et la DRH. Elle présente les indicateurs clés de performance du recrutement sans possibilité de modification. Pour effectuer des actions opérationnelles (planifier des entretiens, contacter des candidats, etc.), utilisez les autres onglets du dashboard recruteur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
