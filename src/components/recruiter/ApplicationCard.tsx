import { Download, MessageCircle, Eye } from 'lucide-react';

interface Application {
  id: string;
  ai_score: number;
  ai_category: string;
  workflow_stage: string;
  applied_at: string;
  cover_letter?: string;
  cv_url?: string;
  candidate: {
    full_name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
  };
  candidate_profile?: {
    title?: string;
    experience_years?: number;
    education_level?: string;
    skills?: string[];
  };
}

interface ApplicationCardProps {
  application: Application;
  onMessage: (appId: string) => void;
  onViewProfile: (appId: string) => void;
}

export default function ApplicationCard({ application, onMessage, onViewProfile }: ApplicationCardProps) {
  const getCategoryBadge = (category: string) => {
    const badges = {
      strong: { bg: 'bg-green-100', text: 'text-green-800', icon: '🟢', label: 'Profil fort' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '🟡', label: 'Profil moyen' },
      weak: { bg: 'bg-red-100', text: 'text-red-800', icon: '🔴', label: 'Profil faible' },
    };
    return badges[category as keyof typeof badges] || badges.medium;
  };

  const badge = getCategoryBadge(application.ai_category);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition">
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0">
          {application.candidate.avatar_url ? (
            <img
              src={application.candidate.avatar_url}
              alt={application.candidate.full_name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-xl font-bold text-blue-900">
                {application.candidate.full_name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">
                {application.candidate.full_name}
              </h3>
              {application.candidate_profile?.title && (
                <p className="text-sm text-gray-600 mb-1">{application.candidate_profile.title}</p>
              )}
              <p className="text-sm text-gray-500">{application.candidate.email}</p>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold text-blue-900 mb-1">{application.ai_score}%</div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                {badge.icon} {badge.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {application.candidate_profile && (
        <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
          {application.candidate_profile.experience_years !== undefined && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Expérience:</span>
              <span>{application.candidate_profile.experience_years} ans</span>
            </div>
          )}
          {application.candidate_profile.education_level && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Formation:</span>
              <span>{application.candidate_profile.education_level}</span>
            </div>
          )}
        </div>
      )}

      {application.candidate_profile?.skills && application.candidate_profile.skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {application.candidate_profile.skills.slice(0, 5).map((skill, idx) => (
            <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
              {skill}
            </span>
          ))}
          {application.candidate_profile.skills.length > 5 && (
            <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
              +{application.candidate_profile.skills.length - 5}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-sm text-gray-500">
          {new Date(application.applied_at).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </span>

        <div className="flex gap-2">
          {application.cv_url && (
            <a
              href={application.cv_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition"
              title="Télécharger CV"
            >
              <Download className="w-5 h-5" />
            </a>
          )}
          <button
            onClick={() => onMessage(application.id)}
            className="p-2 text-gray-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition"
            title="Contacter"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          <button
            onClick={() => onViewProfile(application.id)}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-sm font-medium rounded-lg transition"
          >
            <Eye className="w-4 h-4 inline mr-1" />
            Voir profil
          </button>
        </div>
      </div>
    </div>
  );
}
