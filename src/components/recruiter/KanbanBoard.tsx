import { useState } from 'react';
import { ChevronDown, User, Mail, Phone, Download, MessageSquare, Eye } from 'lucide-react';

interface Application {
  id: string;
  ai_score: number;
  ai_category: string;
  workflow_stage: string;
  applied_at: string;
  candidate: {
    full_name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
  };
  candidate_profile: {
    title?: string;
    experience_years?: number;
    education_level?: string;
    skills?: string[];
  };
}

interface Stage {
  id: string;
  name: string;
  color: string;
}

interface KanbanBoardProps {
  applications: Application[];
  stages: Stage[];
  onMoveApplication: (applicationId: string, newStage: string) => void;
  onViewProfile: (applicationId: string) => void;
  onMessage: (applicationId: string) => void;
}

export default function KanbanBoard({
  applications,
  stages,
  onMoveApplication,
  onViewProfile,
  onMessage,
}: KanbanBoardProps) {
  const [expandedStages, setExpandedStages] = useState<string[]>(stages.map(s => s.id));

  const toggleStage = (stageId: string) => {
    setExpandedStages(prev =>
      prev.includes(stageId)
        ? prev.filter(id => id !== stageId)
        : [...prev, stageId]
    );
  };

  const getApplicationsByStage = (stageName: string) => {
    return applications.filter(app => app.workflow_stage === stageName);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'strong':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'weak':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'strong':
        return '🟢 Fort';
      case 'medium':
        return '🟡 Moyen';
      case 'weak':
        return '🔴 Faible';
      default:
        return 'Non évalué';
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const stageApplications = getApplicationsByStage(stage.name);
        const isExpanded = expandedStages.includes(stage.id);

        return (
          <div
            key={stage.id}
            className="flex-shrink-0 w-80 bg-gray-50 rounded-xl border-2 border-gray-200"
          >
            <div
              className="p-4 cursor-pointer select-none"
              style={{ borderTopColor: stage.color, borderTopWidth: '4px' }}
              onClick={() => toggleStage(stage.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900">{stage.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-white rounded-full text-sm font-semibold text-gray-700">
                    {stageApplications.length}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      isExpanded ? '' : '-rotate-90'
                    }`}
                  />
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
                {stageApplications.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Aucune candidature
                  </div>
                ) : (
                  stageApplications.map((app) => (
                    <div
                      key={app.id}
                      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition cursor-move"
                      draggable
                    >
                      <div className="flex items-start gap-3 mb-3">
                        {app.candidate.avatar_url ? (
                          <img
                            src={app.candidate.avatar_url}
                            alt={app.candidate.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {app.candidate.full_name}
                          </h4>
                          <p className="text-sm text-gray-600 truncate">
                            {app.candidate_profile.title || 'Candidat'}
                          </p>
                        </div>

                        <div className="text-center">
                          <div className="text-xl font-bold text-blue-900">
                            {app.ai_score}%
                          </div>
                          <div className="text-xs text-gray-500">Score IA</div>
                        </div>
                      </div>

                      <div className={`px-3 py-1.5 rounded-lg text-xs font-medium mb-3 border ${getCategoryColor(app.ai_category)}`}>
                        {getCategoryLabel(app.ai_category)}
                      </div>

                      <div className="space-y-2 mb-3 text-xs text-gray-600">
                        {app.candidate_profile.experience_years && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Expérience:</span>
                            <span>{app.candidate_profile.experience_years} ans</span>
                          </div>
                        )}
                        {app.candidate_profile.education_level && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Niveau:</span>
                            <span>{app.candidate_profile.education_level}</span>
                          </div>
                        )}
                      </div>

                      {app.candidate_profile.skills && app.candidate_profile.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {app.candidate_profile.skills.slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded"
                            >
                              {skill}
                            </span>
                          ))}
                          {app.candidate_profile.skills.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                              +{app.candidate_profile.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="text-xs text-gray-500 mb-2">
                        Candidature du {new Date(app.applied_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => onViewProfile(app.id)}
                          className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded transition flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Voir
                        </button>
                        <button
                          onClick={() => onMessage(app.id)}
                          className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded transition flex items-center justify-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Message
                        </button>
                      </div>

                      <select
                        value={app.workflow_stage}
                        onChange={(e) => onMoveApplication(app.id, e.target.value)}
                        className="w-full mt-2 px-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {stages.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
