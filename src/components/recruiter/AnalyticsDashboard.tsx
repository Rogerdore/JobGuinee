import { BarChart3, TrendingUp, Users, Clock, Target, Award } from 'lucide-react';

interface AnalyticsData {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  strongProfiles: number;
  mediumProfiles: number;
  weakProfiles: number;
  avgTimeToHire: number;
  avgAIScore: number;
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
}

export default function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const matchRate = data.totalApplications > 0
    ? ((data.strongProfiles / data.totalApplications) * 100).toFixed(1)
    : '0';

  const responseRate = data.totalApplications > 0
    ? ((data.activeJobs / data.totalJobs) * 100).toFixed(0)
    : '0';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <BarChart3 className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 text-white/80" />
          </div>
          <div className="text-3xl font-bold mb-1">{data.totalApplications}</div>
          <div className="text-blue-100 text-sm">Candidatures totales</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Award className="w-6 h-6" />
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded">+{matchRate}%</span>
          </div>
          <div className="text-3xl font-bold mb-1">{data.strongProfiles}</div>
          <div className="text-green-100 text-sm">Profils forts (compatibles)</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">{data.avgTimeToHire}j</div>
          <div className="text-orange-100 text-sm">Délai moyen de recrutement</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Target className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">{data.avgAIScore}%</div>
          <div className="text-purple-100 text-sm">Score IA moyen</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-bold text-lg text-gray-900 mb-6 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-600" />
            Distribution des profils par catégorie
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">🟢 Profils forts</span>
                <span className="text-sm font-bold text-gray-900">{data.strongProfiles}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${data.totalApplications > 0 ? (data.strongProfiles / data.totalApplications) * 100 : 0}%`
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">🟡 Profils moyens</span>
                <span className="text-sm font-bold text-gray-900">{data.mediumProfiles}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${data.totalApplications > 0 ? (data.mediumProfiles / data.totalApplications) * 100 : 0}%`
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">🔴 Profils faibles</span>
                <span className="text-sm font-bold text-gray-900">{data.weakProfiles}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${data.totalApplications > 0 ? (data.weakProfiles / data.totalApplications) * 100 : 0}%`
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">Taux de matching IA</span>
              <span className="text-2xl font-bold text-blue-900">{matchRate}%</span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Pourcentage de profils fortement compatibles
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-bold text-lg text-gray-900 mb-6 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            Performance du recrutement
          </h3>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-600 mb-1">Offres actives</div>
                <div className="text-2xl font-bold text-gray-900">{data.activeJobs}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">Total offres</div>
                <div className="text-2xl font-bold text-gray-900">{data.totalJobs}</div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">Taux de réactivité</span>
                <span className="text-xl font-bold text-blue-900">{responseRate}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${responseRate}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border-2 border-green-200 rounded-lg bg-green-50">
                <div className="text-xs text-green-700 mb-1">Candidatures/Offre</div>
                <div className="text-2xl font-bold text-green-900">
                  {data.activeJobs > 0 ? (data.totalApplications / data.activeJobs).toFixed(1) : '0'}
                </div>
              </div>

              <div className="p-4 border-2 border-purple-200 rounded-lg bg-purple-50">
                <div className="text-xs text-purple-700 mb-1">Score moy. IA</div>
                <div className="text-2xl font-bold text-purple-900">{data.avgAIScore}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-bold text-lg text-gray-900 mb-4">Indicateurs clés de performance (KPI)</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
            <div className="text-4xl font-bold text-blue-900 mb-2">
              {data.totalApplications > 0 ? ((data.strongProfiles / data.totalApplications) * 100).toFixed(0) : '0'}%
            </div>
            <div className="text-sm font-medium text-blue-700">Taux de compatibilité</div>
            <div className="text-xs text-blue-600 mt-1">Profils forts vs Total</div>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
            <div className="text-4xl font-bold text-green-900 mb-2">{data.avgTimeToHire}</div>
            <div className="text-sm font-medium text-green-700">Jours moyens</div>
            <div className="text-xs text-green-600 mt-1">Délai de recrutement</div>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
            <div className="text-4xl font-bold text-purple-900 mb-2">
              {data.activeJobs > 0 ? (data.totalApplications / data.activeJobs).toFixed(1) : '0'}
            </div>
            <div className="text-sm font-medium text-purple-700">Candidatures/Offre</div>
            <div className="text-xs text-purple-600 mt-1">Attractivité moyenne</div>
          </div>
        </div>
      </div>
    </div>
  );
}
