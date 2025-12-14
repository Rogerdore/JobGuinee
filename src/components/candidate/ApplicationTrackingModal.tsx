import { useState, useEffect } from 'react';
import {
  X, FileText, Eye, Search, Star, MessageCircle,
  CheckCircle, XCircle, Clock, Calendar, Briefcase, Building2
} from 'lucide-react';
import {
  candidateApplicationTrackingService,
  CandidateApplicationStatus,
  CandidateTimelineEvent
} from '../../services/candidateApplicationTrackingService';

interface ApplicationTrackingModalProps {
  applicationId: string;
  onClose: () => void;
}

const statusIcons: Record<string, any> = {
  'Postulé': FileText,
  'Vu': Eye,
  'En analyse': Search,
  'Shortlist': Star,
  'Entretien': MessageCircle,
  'Accepté': CheckCircle,
  'Refusé': XCircle
};

export default function ApplicationTrackingModal({
  applicationId,
  onClose
}: ApplicationTrackingModalProps) {
  const [status, setStatus] = useState<CandidateApplicationStatus | null>(null);
  const [timeline, setTimeline] = useState<CandidateTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [applicationId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statusData, timelineData] = await Promise.all([
        candidateApplicationTrackingService.getApplicationStatus(applicationId),
        candidateApplicationTrackingService.getTimeline(applicationId)
      ]);

      setStatus(statusData);
      setTimeline(timelineData);
    } catch (error) {
      console.error('Error loading tracking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-8">
          <div className="text-center">
            <p className="text-gray-600">Impossible de charger les informations de suivi</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  const StatusIcon = statusIcons[status.status_label] || Clock;
  const badgeStyle = candidateApplicationTrackingService.getStatusBadgeStyle(status.status_label);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-start z-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Briefcase className="text-gray-400" size={24} />
              <h2 className="text-2xl font-bold text-gray-900">{status.job_title}</h2>
            </div>
            <div className="flex items-center gap-2 text-gray-600 mb-3">
              <Building2 size={16} />
              <span>{status.company_name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={16} />
              <span>Postulé le {formatDate(status.applied_at)}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Current Status Card */}
        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
            <div className="flex items-start gap-4">
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: status.status_color + '20' }}
              >
                <StatusIcon
                  size={32}
                  style={{ color: status.status_color }}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">Statut actuel</h3>
                  <span
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold ${badgeStyle.bg} ${badgeStyle.text}`}
                  >
                    {badgeStyle.icon} {status.status_label}
                  </span>
                </div>
                <p className="text-gray-700 text-lg">{status.status_description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Clock size={20} />
            Historique de votre candidature
          </h3>

          {timeline.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock size={48} className="mx-auto mb-3 text-gray-300" />
              <p>Aucun historique disponible pour le moment</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

              {/* Timeline Events */}
              <div className="space-y-6">
                {timeline.map((event, index) => {
                  const EventIcon = statusIcons[event.status_label] || Clock;
                  const isLast = index === timeline.length - 1;

                  return (
                    <div key={event.event_id} className="relative flex gap-4 group">
                      {/* Icon */}
                      <div
                        className={`relative z-10 flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white transition-all ${
                          event.is_current
                            ? 'scale-110'
                            : 'group-hover:scale-105'
                        }`}
                        style={{
                          backgroundColor: event.status_color,
                          opacity: isLast ? 1 : 0.9
                        }}
                      >
                        <EventIcon size={24} className="text-white" />
                      </div>

                      {/* Content */}
                      <div className={`flex-1 pb-8 ${isLast ? 'pb-0' : ''}`}>
                        <div className={`bg-white rounded-xl p-5 shadow-sm border-2 transition-all ${
                          event.is_current
                            ? 'border-blue-300 shadow-md'
                            : 'border-gray-100 group-hover:border-gray-200 group-hover:shadow-md'
                        }`}>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-900 text-lg">
                              {event.status_label}
                              {event.is_current && (
                                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
                                  Actuel
                                </span>
                              )}
                            </h4>
                            <time className="text-sm text-gray-500 flex items-center gap-1">
                              <Calendar size={14} />
                              {formatDate(event.event_date)}
                            </time>
                          </div>
                          <p className="text-gray-600">{event.status_description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer with contextual advice */}
        <div className="border-t border-gray-200 p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="mb-4">
            <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              💡 Conseil
            </h4>
            <p className="text-sm text-gray-700">
              {status.status_label === 'Postulé' && 'Votre candidature a été reçue. Assurez-vous que votre profil est complet pour maximiser vos chances.'}
              {status.status_label === 'Vu' && 'Votre profil a attiré l\'attention ! Restez disponible, vous pourriez être contacté(e) prochainement.'}
              {status.status_label === 'En analyse' && 'Votre candidature est en cours d\'analyse. Vous serez notifié(e) dès qu\'il y aura du nouveau.'}
              {status.status_label === 'Shortlist' && 'Félicitations ! Vous êtes présélectionné(e). Préparez-vous pour un éventuel entretien.'}
              {status.status_label === 'Entretien' && 'Préparez-vous bien pour votre entretien. N\'hésitez pas à vous renseigner sur l\'entreprise.'}
              {status.status_label === 'Accepté' && 'Félicitations ! Le recruteur devrait vous contacter prochainement pour finaliser les détails.'}
              {status.status_label === 'Refusé' && 'Cette fois n\'était pas la bonne, mais continuez à postuler. Chaque expérience vous rapproche de votre objectif !'}
              {!['Postulé', 'Vu', 'En analyse', 'Shortlist', 'Entretien', 'Accepté', 'Refusé'].includes(status.status_label) &&
                'Vous recevrez une notification à chaque étape importante de votre candidature.'}
            </p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              🔔 Notifications actives pour cette candidature
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
