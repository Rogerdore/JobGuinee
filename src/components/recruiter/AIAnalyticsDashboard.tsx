import { useEffect, useState } from 'react';
import { TrendingUp, Users, Clock, DollarSign, Target, Award, Zap, BarChart3 } from 'lucide-react';
import { recruiterAnalyticsService, GlobalAnalytics, RecruiterAnalytics } from '../../services/recruiterAnalyticsService';

interface AIAnalyticsDashboardProps {
  companyId: string;
}

export default function AIAnalyticsDashboard({ companyId }: AIAnalyticsDashboardProps) {
  const [globalAnalytics, setGlobalAnalytics] = useState<GlobalAnalytics | null>(null);
  const [jobAnalytics, setJobAnalytics] = useState<RecruiterAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [companyId]);

  const loadAnalytics = async () => {
    setLoading(true);
    const [global, jobs] = await Promise.all([
      recruiterAnalyticsService.getGlobalAnalytics(companyId),
      recruiterAnalyticsService.getCompanyAnalytics(companyId)
    ]);

    setGlobalAnalytics(global);
    setJobAnalytics(jobs);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!globalAnalytics) {
    return (
      <div className="text-center p-12">
        <p className="text-gray-600">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics IA - ROI</h2>
        <p className="text-gray-600">Vue d'ensemble de l'impact de l'IA sur votre recrutement</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-blue-600 rounded-xl">
              <Users className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-900 mb-1">
            {globalAnalytics.total_candidates_analyzed}
          </div>
          <div className="text-sm text-blue-700">Candidats analysés par IA</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-green-600 rounded-xl">
              <Award className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-900 mb-1">
            {globalAnalytics.total_hired}
          </div>
          <div className="text-sm text-green-700">Candidats recrutés</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-purple-600 rounded-xl">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <Zap className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-purple-900 mb-1">
            {globalAnalytics.total_time_saved_hours}h
          </div>
          <div className="text-sm text-purple-700">Temps gagné estimé</div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-orange-600 rounded-xl">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <Target className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-orange-900 mb-1">
            {globalAnalytics.avg_cost_per_hire}
          </div>
          <div className="text-sm text-orange-700">Crédits par embauche</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900">Score IA Moyen</h3>
          </div>
          <div className="text-4xl font-bold text-blue-900 mb-2">
            {globalAnalytics.avg_ai_score}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${globalAnalytics.avg_ai_score}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900">Taux de conversion</h3>
          </div>
          <div className="text-4xl font-bold text-green-900 mb-2">
            {globalAnalytics.strong_match_conversion_rate}%
          </div>
          <div className="text-sm text-gray-600">Profils forts → Embauche</div>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900">Entretiens</h3>
          </div>
          <div className="text-4xl font-bold text-purple-900 mb-2">
            {globalAnalytics.total_interviews}
          </div>
          <div className="text-sm text-gray-600">Entretiens planifiés</div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6">
        <h3 className="font-bold text-blue-900 mb-4 text-lg">💡 Insights IA</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">Efficacité</span>
            </div>
            <p className="text-sm text-gray-700">
              L'IA vous fait gagner <span className="font-bold text-blue-600">80%</span> du temps de tri manuel des candidatures.
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900">Précision</span>
            </div>
            <p className="text-sm text-gray-700">
              Les profils "forte correspondance" ont un taux de conversion de <span className="font-bold text-green-600">{globalAnalytics.strong_match_conversion_rate}%</span>.
            </p>
          </div>
        </div>
      </div>

      {jobAnalytics.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 mb-4 text-lg">📊 Statistiques par offre</h3>
          <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Offre</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Candidatures</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Analysées IA</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Score moyen</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Embauches</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Crédits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {jobAnalytics.slice(0, 10).map((job) => (
                    <tr key={job.job_id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{job.job_title}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(job.job_created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-900">
                        {job.total_applications}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                          {job.ai_analyzed_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-semibold ${
                          job.avg_ai_score >= 75 ? 'text-green-600' :
                          job.avg_ai_score >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {job.avg_ai_score}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                          {job.hired_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                        {job.total_credits_spent}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
