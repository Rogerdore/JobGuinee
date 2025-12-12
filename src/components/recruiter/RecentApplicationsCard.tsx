import { Users, Award, TrendingUp, Briefcase } from 'lucide-react';
import { RecentApplication, recruiterDashboardService } from '../../services/recruiterDashboardService';

interface RecentApplicationsCardProps {
  applications: RecentApplication[];
  onApplicationClick: (applicationId: string, candidateId: string) => void;
  loading?: boolean;
}

export default function RecentApplicationsCard({ applications, onApplicationClick, loading }: RecentApplicationsCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Candidatures Récentes</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Candidatures Récentes</h3>
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune candidature reçue</p>
          <p className="text-sm text-gray-400 mt-1">Les candidatures apparaîtront ici</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Users className="w-6 h-6 text-green-600" />
        Candidatures Récentes
      </h3>

      <div className="space-y-3">
        {applications.map((app) => (
          <button
            key={app.application_id}
            onClick={() => onApplicationClick(app.application_id, app.candidate_id)}
            className={`w-full border-2 rounded-xl p-4 transition text-left ${
              app.is_strong_profile
                ? 'bg-green-50 hover:bg-green-100 border-green-300 hover:border-green-400'
                : 'bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-gray-900">{app.candidate_name}</h4>
                  {app.is_strong_profile && (
                    <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      Profil Fort
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Briefcase className="w-4 h-4" />
                  <span>{app.job_title}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 ${
                  recruiterDashboardService.getScoreBgColor(app.ai_match_score)
                }`}>
                  <TrendingUp className={`w-4 h-4 ${recruiterDashboardService.getScoreColor(app.ai_match_score)}`} />
                  <span className={`font-bold ${recruiterDashboardService.getScoreColor(app.ai_match_score)}`}>
                    {app.ai_match_score}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-600 mt-3">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                {recruiterDashboardService.getExperienceLevelLabel(app.experience_level)}
              </span>
              <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full font-medium">
                {app.workflow_stage}
              </span>
              <span className="text-gray-500">
                {new Date(app.applied_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short'
                })}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
