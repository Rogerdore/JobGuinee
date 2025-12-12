import { useState } from 'react';
import { X, Calendar, Clock, MapPin, Video, Phone, MessageSquare, CheckCircle } from 'lucide-react';
import { interviewSchedulingService, CreateInterviewParams } from '../../services/interviewSchedulingService';

interface ScheduleInterviewModalProps {
  applications: Array<{
    id: string;
    candidate_id: string;
    job_id: string;
    candidate: {
      full_name: string;
      email: string;
    };
  }>;
  companyId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ScheduleInterviewModal({ applications, companyId, onClose, onSuccess }: ScheduleInterviewModalProps) {
  const [interviewType, setInterviewType] = useState<'visio' | 'presentiel' | 'telephone'>('visio');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [scheduled, setScheduled] = useState(false);

  const handleSchedule = async () => {
    if (!scheduledDate || !scheduledTime || !location) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setScheduling(true);

    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

    let successCount = 0;
    let errorCount = 0;

    for (const app of applications) {
      const params: CreateInterviewParams = {
        applicationId: app.id,
        jobId: app.job_id,
        candidateId: app.candidate_id,
        companyId,
        interviewType,
        scheduledAt,
        durationMinutes: duration,
        locationOrLink: location,
        notes
      };

      const result = await interviewSchedulingService.createInterview(params);

      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        console.error('Failed to schedule interview:', result.error);
      }
    }

    setScheduling(false);
    setScheduled(true);

    setTimeout(() => {
      onSuccess();
      onClose();
    }, 2000);
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (scheduled) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Entretien{applications.length > 1 ? 's' : ''} planifié{applications.length > 1 ? 's' : ''}</h2>
            <p className="text-gray-600">
              {applications.length} entretien{applications.length > 1 ? 's ont été planifiés' : ' a été planifié'} avec succès.
              Les candidats ont été notifiés.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-900 via-blue-700 to-blue-900 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Planifier un entretien</h2>
                <p className="text-blue-100 text-sm">
                  {applications.length} candidat{applications.length > 1 ? 's sélectionnés' : ' sélectionné'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {applications.length > 0 && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Candidats sélectionnés:</h3>
              <div className="space-y-1">
                {applications.slice(0, 5).map((app) => (
                  <div key={app.id} className="text-sm text-blue-700">
                    • {app.candidate.full_name}
                  </div>
                ))}
                {applications.length > 5 && (
                  <div className="text-sm text-blue-600">
                    +{applications.length - 5} autre{applications.length - 5 > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Type d'entretien *
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setInterviewType('visio')}
                  className={`p-4 rounded-xl border-2 transition ${
                    interviewType === 'visio'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Video className={`w-6 h-6 mx-auto mb-2 ${interviewType === 'visio' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="text-sm font-medium">Visio</div>
                </button>
                <button
                  onClick={() => setInterviewType('presentiel')}
                  className={`p-4 rounded-xl border-2 transition ${
                    interviewType === 'presentiel'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <MapPin className={`w-6 h-6 mx-auto mb-2 ${interviewType === 'presentiel' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="text-sm font-medium">Présentiel</div>
                </button>
                <button
                  onClick={() => setInterviewType('telephone')}
                  className={`p-4 rounded-xl border-2 transition ${
                    interviewType === 'telephone'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Phone className={`w-6 h-6 mx-auto mb-2 ${interviewType === 'telephone' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="text-sm font-medium">Téléphone</div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={getMinDate()}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Heure *
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Durée
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 heure</option>
                <option value={90}>1h30</option>
                <option value={120}>2 heures</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                {interviewType === 'visio' && 'Lien de visioconférence *'}
                {interviewType === 'presentiel' && 'Adresse *'}
                {interviewType === 'telephone' && 'Numéro de téléphone *'}
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={
                  interviewType === 'visio'
                    ? 'https://meet.google.com/...'
                    : interviewType === 'presentiel'
                    ? 'Adresse complète du lieu'
                    : '+224 xxx xxx xxx'
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Notes internes (optionnel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Notes privées pour l'équipe de recrutement..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>

        <div className="border-t-2 border-gray-200 p-6 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            disabled={scheduling}
            className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSchedule}
            disabled={scheduling || !scheduledDate || !scheduledTime || !location}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {scheduling ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Planification...</span>
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5" />
                <span>Planifier l'entretien</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
