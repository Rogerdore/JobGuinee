import { useState } from 'react';
import { Calendar, Download, Star, Video, MapPin, Phone, Clock, ExternalLink } from 'lucide-react';
import { Interview } from '../../services/interviewSchedulingService';
import { calendarExportService } from '../../services/calendarExportService';
import InterviewEvaluationModal from './InterviewEvaluationModal';

interface InterviewCardProps {
  interview: Interview & {
    candidate: { full_name: string; email: string };
    job: { title: string };
    recruiter: { full_name: string; email: string };
  };
  onUpdate?: () => void;
}

export default function InterviewCard({ interview, onUpdate }: InterviewCardProps) {
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [showCalendarOptions, setShowCalendarOptions] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      case 'no_show': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'visio': return <Video className="w-5 h-5" />;
      case 'presentiel': return <MapPin className="w-5 h-5" />;
      case 'telephone': return <Phone className="w-5 h-5" />;
      default: return <Calendar className="w-5 h-5" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadICS = () => {
    const icsContent = calendarExportService.generateInterviewICS(
      interview,
      interview.recruiter.full_name,
      interview.recruiter.email,
      interview.candidate.full_name,
      interview.candidate.email,
      interview.job.title
    );

    const filename = `entretien-${interview.candidate.full_name.replace(/\s+/g, '-').toLowerCase()}.ics`;
    calendarExportService.downloadICS(icsContent, filename);
    setShowCalendarOptions(false);
  };

  const handleGoogleCalendar = () => {
    const link = calendarExportService.getGoogleCalendarLink(interview, interview.job.title);
    window.open(link, '_blank');
    setShowCalendarOptions(false);
  };

  const handleOutlookCalendar = () => {
    const link = calendarExportService.getOutlookCalendarLink(interview, interview.job.title);
    window.open(link, '_blank');
    setShowCalendarOptions(false);
  };

  const isPast = new Date(interview.scheduled_at) < new Date();
  const canEvaluate = interview.status === 'completed';

  return (
    <>
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-xl">
              {getTypeIcon(interview.interview_type)}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{interview.candidate.full_name}</h3>
              <p className="text-sm text-gray-600">{interview.job.title}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(interview.status)}`}>
            {interview.status}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{formatDate(interview.scheduled_at)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{formatTime(interview.scheduled_at)} ({interview.duration_minutes} min)</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-700">
            {getTypeIcon(interview.interview_type)}
            <span className="flex-1 break-all">{interview.location_or_link}</span>
          </div>
        </div>

        {interview.notes && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
            <p className="text-sm text-gray-700">{interview.notes}</p>
          </div>
        )}

        <div className="flex gap-2">
          <div className="relative flex-1">
            <button
              onClick={() => setShowCalendarOptions(!showCalendarOptions)}
              disabled={isPast}
              className="w-full px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>Exporter</span>
            </button>

            {showCalendarOptions && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl overflow-hidden z-10">
                <button
                  onClick={handleDownloadICS}
                  className="w-full px-4 py-3 hover:bg-gray-50 text-left text-sm font-medium flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger .ics</span>
                </button>
                <button
                  onClick={handleGoogleCalendar}
                  className="w-full px-4 py-3 hover:bg-gray-50 text-left text-sm font-medium flex items-center gap-2 border-t"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Google Calendar</span>
                </button>
                <button
                  onClick={handleOutlookCalendar}
                  className="w-full px-4 py-3 hover:bg-gray-50 text-left text-sm font-medium flex items-center gap-2 border-t"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Outlook</span>
                </button>
              </div>
            )}
          </div>

          {canEvaluate && (
            <button
              onClick={() => setShowEvaluationModal(true)}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition flex items-center justify-center gap-2"
            >
              <Star className="w-4 h-4" />
              <span>Évaluer</span>
            </button>
          )}
        </div>
      </div>

      {showEvaluationModal && (
        <InterviewEvaluationModal
          interview={interview}
          onClose={() => setShowEvaluationModal(false)}
          onSuccess={() => {
            setShowEvaluationModal(false);
            onUpdate?.();
          }}
        />
      )}
    </>
  );
}
