import { Download, MessageCircle, Eye, FileText } from 'lucide-react';

interface Application {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  cv_url: string;
  cover_letter_url?: string;
  message?: string;
  ai_score?: number;
  ai_category?: string;
  workflow_stage?: string;
  applied_at?: string;
  created_at: string;
  candidate_profile?: {
    id?: string;
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

  const fullName = `${application.first_name} ${application.last_name}`;
  const badge = getCategoryBadge(application.ai_category || 'medium');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition">
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-xl font-bold text-blue-900">
              {application.first_name.charAt(0)}{application.last_name.charAt(0)}
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">
                {fullName}
              </h3>
              {application.candidate_profile?.title && (
                <p className="text-sm text-gray-600 mb-1">{application.candidate_profile.title}</p>
              )}
              <p className="text-sm text-gray-500">{application.email}</p>
              {application.phone && (
                <p className="text-sm text-gray-500">{application.phone}</p>
              )}
            </div>

            <div className="text-right">
              {application.ai_score ? (
                <>
                  <div className="text-3xl font-bold text-blue-900 mb-1">{application.ai_score}%</div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                    {badge.icon} {badge.label}
                  </span>
                </>
              ) : (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  Nouveau
                </span>
              )}
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

      {application.message && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900 mb-1">Message de motivation:</p>
          <p className="text-sm text-gray-700">{application.message}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-sm text-gray-500">
          {new Date(application.created_at || application.applied_at || '').toLocaleDateString('fr-FR', {
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
              className="px-3 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center gap-2 text-sm font-medium"
              title="Télécharger CV"
            >
              <Download className="w-4 h-4" />
              CV
            </a>
          )}
          {application.cover_letter_url && (
            <a
              href={application.cover_letter_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition flex items-center gap-2 text-sm font-medium"
              title="Télécharger lettre de motivation"
            >
              <FileText className="w-4 h-4" />
              Lettre
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
            className="px-4 py-2 bg-[#FF8C00] hover:bg-[#e67e00] text-white text-sm font-medium rounded-lg transition"
          >
            <Eye className="w-4 h-4 inline mr-1" />
            Voir profil
          </button>
        </div>
      </div>
    </div>
  );
}
