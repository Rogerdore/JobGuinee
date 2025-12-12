import { useState, useEffect } from 'react';
import { X, Send, Mail, MessageCircle, FileText, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface SendMessageModalProps {
  applicationId: string;
  onClose: () => void;
}

interface ApplicationData {
  id: string;
  candidate: {
    full_name: string;
    email: string;
    phone?: string;
  };
  job: {
    title: string;
  };
}

export default function SendMessageModal({ applicationId, onClose }: SendMessageModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [method, setMethod] = useState<'email' | 'platform'>('email');

  useEffect(() => {
    loadApplication();
  }, [applicationId]);

  const loadApplication = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('applications')
      .select(`
        id,
        candidate:candidate_profiles!applications_candidate_id_fkey(
          profile:profiles!candidate_profiles_profile_id_fkey(
            full_name,
            email,
            phone
          )
        ),
        job:jobs!applications_job_id_fkey(
          title
        )
      `)
      .eq('id', applicationId)
      .single();

    if (error) {
      console.error('Error loading application:', error);
    } else if (data) {
      setApplication({
        id: data.id,
        candidate: {
          full_name: data.candidate.profile.full_name,
          email: data.candidate.profile.email,
          phone: data.candidate.profile.phone,
        },
        job: data.job,
      });
      setSubject(`Concernant votre candidature - ${data.job.title}`);
    }

    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      alert('Veuillez saisir un message');
      return;
    }

    if (!application) return;

    setSending(true);

    if (method === 'email') {
      const mailtoLink = `mailto:${application.candidate.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
      window.location.href = mailtoLink;

      setTimeout(() => {
        setSending(false);
        onClose();
      }, 500);
    } else {
      try {
        const { data: candidateProfile } = await supabase
          .from('candidate_profiles')
          .select('profile_id')
          .eq('id', (await supabase
            .from('applications')
            .select('candidate_id')
            .eq('id', applicationId)
            .single()
          ).data?.candidate_id)
          .single();

        if (candidateProfile) {
          const { error: notifError } = await supabase
            .from('notifications')
            .insert({
              user_id: candidateProfile.profile_id,
              title: subject,
              message: message,
              type: 'recruiter_message',
              metadata: {
                application_id: applicationId,
                recruiter_name: profile?.full_name || 'Recruteur',
              }
            });

          if (notifError) {
            console.error('Error sending notification:', notifError);
            alert('Erreur lors de l\'envoi du message');
          } else {
            alert('Message envoyé avec succès!');
            onClose();
          }
        }
      } catch (error) {
        console.error('Error sending message:', error);
        alert('Erreur lors de l\'envoi du message');
      } finally {
        setSending(false);
      }
    }
  };

  const quickTemplates = [
    {
      title: 'Demande d\'information',
      content: `Bonjour,\n\nNous avons bien reçu votre candidature et nous souhaitons obtenir quelques informations complémentaires.\n\nPourriez-vous nous préciser :\n- Votre disponibilité\n- Vos prétentions salariales\n- Votre période de préavis\n\nCordialement,`
    },
    {
      title: 'Invitation entretien',
      content: `Bonjour,\n\nNous avons étudié votre candidature avec beaucoup d'intérêt et souhaitons vous rencontrer pour un entretien.\n\nSeriez-vous disponible cette semaine ou la semaine prochaine ?\n\nDans l'attente de votre retour,\nCordialement,`
    },
    {
      title: 'Demande de documents',
      content: `Bonjour,\n\nAfin de finaliser l'étude de votre candidature, nous aurions besoin des documents suivants :\n- CV actualisé\n- Copie des diplômes\n- Références professionnelles\n\nMerci de nous les transmettre dans les meilleurs délais.\n\nCordialement,`
    }
  ];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <p className="text-gray-600">Candidature introuvable</p>
          <button
            onClick={onClose}
            className="mt-4 px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full my-8">
        <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-blue-700 text-white p-6 rounded-t-2xl flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Contacter le Candidat</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-blue-900">
                  {application.candidate.full_name.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">{application.candidate.full_name}</h3>
                <p className="text-sm text-gray-600 mb-2">Candidature: {application.job.title}</p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {application.candidate.email}
                  </div>
                  {application.candidate.phone && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {application.candidate.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Méthode d'envoi
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMethod('email')}
                className={`p-4 rounded-xl border-2 transition ${
                  method === 'email'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Mail className={`w-6 h-6 mx-auto mb-2 ${method === 'email' ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="font-semibold text-sm">Email direct</div>
                <div className="text-xs text-gray-600 mt-1">Ouvre votre client email</div>
              </button>
              <button
                onClick={() => setMethod('platform')}
                className={`p-4 rounded-xl border-2 transition ${
                  method === 'platform'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <MessageCircle className={`w-6 h-6 mx-auto mb-2 ${method === 'platform' ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="font-semibold text-sm">Notification</div>
                <div className="text-xs text-gray-600 mt-1">Via la plateforme</div>
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Modèles rapides
            </label>
            <div className="grid grid-cols-3 gap-2">
              {quickTemplates.map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => setMessage(template.content)}
                  className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  {template.title}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Objet
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Objet du message"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Saisissez votre message..."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition"
            >
              Annuler
            </button>
            <button
              onClick={handleSendMessage}
              disabled={sending || !message.trim()}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Envoyer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
