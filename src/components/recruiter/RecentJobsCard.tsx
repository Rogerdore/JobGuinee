import { Briefcase, MapPin, Users, Eye, Calendar } from 'lucide-react';
import { RecentJob } from '../../services/recruiterDashboardService';
import TargetedDiffusionBadge from '../campaign/TargetedDiffusionBadge';

interface RecentJobsCardProps {
  jobs: RecentJob[];
  onJobClick: (jobId: string) => void;
  onNavigate: (path: string) => void;
  loading?: boolean;
}

export default function RecentJobsCard({ jobs, onJobClick, onNavigate, loading }: RecentJobsCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Publié</span>;
      case 'closed':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">Fermé</span>;
      case 'draft':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">Brouillon</span>;
      default:
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">{status}</span>;
    }
  };

  const isExpired = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Projets Récents</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Projets Récents</h3>
        <div className="text-center py-8">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune offre d'emploi publiée</p>
          <p className="text-sm text-gray-400 mt-1">Créez votre première offre pour commencer</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Briefcase className="w-6 h-6 text-blue-600" />
        Projets Récents
      </h3>

      <div className="space-y-3">
        {jobs.map((job) => (
          <button
            key={job.id}
            onClick={() => onJobClick(job.id)}
            className="w-full bg-gray-50 hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-300 rounded-xl p-4 transition text-left"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-1">{job.title}</h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{job.location}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(job.status)}
                {isExpired(job.deadline) && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                    Expirée
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{job.views_count || 0} vues</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{job.applications_count} candidatures</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(job.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>

            <div className="mt-3" onClick={(e) => e.stopPropagation()}>
              <TargetedDiffusionBadge
                entityType="job"
                entityId={job.id}
                entityStatus={job.status}
                onNavigate={onNavigate}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
