import { useState, useEffect } from 'react';
import { Download, MessageCircle, Eye, MoreVertical, FileText, Star, X, History } from 'lucide-react';
import { applicationActionsService } from '../../services/applicationActionsService';

interface Application {
  id: string;
  ai_score: number;
  ai_category: string;
  workflow_stage: string;
  applied_at: string;
  cover_letter?: string;
  cv_url?: string;
  is_shortlisted?: boolean;
  rejected_reason?: string;
  rejected_at?: string;
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
  onUpdate?: () => void;
}

export default function ApplicationCard({ application, onMessage, onViewProfile, onUpdate }: ApplicationCardProps) {
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);

  const getCategoryBadge = (category: string) => {
    const badges = {
      strong: { bg: 'bg-green-100', text: 'text-green-800', icon: '🟢', label: 'Profil fort' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '🟡', label: 'Profil moyen' },
      weak: { bg: 'bg-red-100', text: 'text-red-800', icon: '🔴', label: 'Profil faible' },
    };
    return badges[category as keyof typeof badges] || badges.medium;
  };

  const handleShortlist = async () => {
    setLoading(true);
    const result = application.is_shortlisted
      ? await applicationActionsService.unshortlistApplication(application.id)
      : await applicationActionsService.shortlistApplication(application.id);

    setLoading(false);
    if (result.success && onUpdate) {
      onUpdate();
    } else if (result.error) {
      alert(result.error);
    }
    setShowActionsMenu(false);
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) {
      alert('Veuillez saisir une note');
      return;
    }

    setLoading(true);
    const result = await applicationActionsService.addNote(application.id, noteText, true);
    setLoading(false);

    if (result.success) {
      setNoteText('');
      setShowNoteModal(false);
      if (onUpdate) onUpdate();
    } else {
      alert(result.error || 'Erreur lors de l\'ajout de la note');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Le motif de rejet est obligatoire');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir rejeter cette candidature ?')) {
      return;
    }

    setLoading(true);
    const result = await applicationActionsService.rejectApplication(application.id, rejectReason);
    setLoading(false);

    if (result.success) {
      setRejectReason('');
      setShowRejectModal(false);
      if (onUpdate) onUpdate();
    } else {
      alert(result.error || 'Erreur lors du rejet');
    }
  };

  const badge = getCategoryBadge(application.ai_category);

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition relative">
        {application.is_shortlisted && (
          <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" />
            Shortlisté
          </div>
        )}

        {application.rejected_reason && (
          <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            Rejeté
          </div>
        )}

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

              <div className="flex items-start gap-2">
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-900 mb-1">{application.ai_score}%</div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                    {badge.icon} {badge.label}
                  </span>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowActionsMenu(!showActionsMenu)}
                    className="p-2 text-gray-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition"
                    title="Actions"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {showActionsMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                      <button
                        onClick={() => {
                          setShowNoteModal(true);
                          setShowActionsMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm"
                      >
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>Ajouter une note</span>
                      </button>

                      <button
                        onClick={handleShortlist}
                        disabled={loading}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm"
                      >
                        <Star className={`w-4 h-4 ${application.is_shortlisted ? 'text-yellow-600 fill-current' : 'text-gray-600'}`} />
                        <span>{application.is_shortlisted ? 'Retirer de la shortlist' : 'Ajouter à la shortlist'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowHistoryModal(true);
                          setShowActionsMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 text-sm"
                      >
                        <History className="w-4 h-4 text-gray-600" />
                        <span>Voir l'historique</span>
                      </button>

                      {!application.rejected_reason && (
                        <>
                          <div className="border-t border-gray-200"></div>
                          <button
                            onClick={() => {
                              setShowRejectModal(true);
                              setShowActionsMenu(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-3 text-sm text-red-600"
                          >
                            <X className="w-4 h-4" />
                            <span>Rejeter la candidature</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
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

      {application.rejected_reason && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-semibold text-red-800 mb-1">Motif du rejet:</p>
          <p className="text-sm text-red-700">{application.rejected_reason}</p>
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

    {showNoteModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Ajouter une note</h3>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
            rows={6}
            placeholder="Saisissez votre note interne sur cette candidature..."
          />
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowNoteModal(false);
                setNoteText('');
              }}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold"
            >
              Annuler
            </button>
            <button
              onClick={handleAddNote}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    )}

    {showRejectModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Rejeter la candidature</h3>
          <p className="text-sm text-gray-600 mb-4">
            Veuillez indiquer le motif du rejet. Cette information sera enregistrée mais ne sera pas visible par le candidat.
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 mb-4"
            rows={4}
            placeholder="Motif du rejet (obligatoire)..."
            required
          />
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowRejectModal(false);
                setRejectReason('');
              }}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold"
            >
              Annuler
            </button>
            <button
              onClick={handleReject}
              disabled={loading || !rejectReason.trim()}
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'Rejet...' : 'Confirmer le rejet'}
            </button>
          </div>
        </div>
      </div>
    )}

    {showHistoryModal && (
      <ActivityHistoryModal
        applicationId={application.id}
        onClose={() => setShowHistoryModal(false)}
      />
    )}
  </>
  );
}

function ActivityHistoryModal({ applicationId, onClose }: { applicationId: string; onClose: () => void }) {
  const [activities, setActivities] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [activityResult, notesResult] = await Promise.all([
      applicationActionsService.getActivityLog(applicationId),
      applicationActionsService.getNotes(applicationId)
    ]);

    if (activityResult.success) setActivities(activityResult.activities || []);
    if (notesResult.success) setNotes(notesResult.notes || []);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Historique des actions</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Chargement...</div>
          ) : (
            <>
              {notes.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Notes internes</h4>
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div key={note.id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-semibold text-blue-900">{note.recruiter_name}</span>
                          <span className="text-xs text-blue-600">
                            {new Date(note.created_at).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{note.note_text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activities.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Activités</h4>
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div key={activity.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-sm font-semibold text-gray-900">
                            {applicationActionsService.getActionLabel(activity.action_type)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(activity.created_at).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">Par {activity.actor_name}</p>
                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            {activity.metadata.reason && (
                              <p>Motif: {activity.metadata.reason}</p>
                            )}
                            {activity.metadata.from_stage && activity.metadata.to_stage && (
                              <p>De "{activity.metadata.from_stage}" vers "{activity.metadata.to_stage}"</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activities.length === 0 && notes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Aucune activité enregistrée
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
