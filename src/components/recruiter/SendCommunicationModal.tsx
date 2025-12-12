import { useState, useEffect } from 'react';
import { X, Mail, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { communicationService, CommunicationTemplate } from '../../services/communicationService';

interface SendCommunicationModalProps {
  applications: Array<{
    id: string;
    candidate_id: string;
    candidate: {
      full_name: string;
    };
  }>;
  companyId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SendCommunicationModal({ applications, companyId, onClose, onSuccess }: SendCommunicationModalProps) {
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState<'notification' | 'email'>('notification');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, [companyId]);

  const loadTemplates = async () => {
    const data = await communicationService.getTemplates(companyId);
    setTemplates(data);
  };

  const handleTemplateChange = async (templateId: string) => {
    setSelectedTemplate(templateId);

    if (!templateId) {
      setSubject('');
      setMessage('');
      return;
    }

    const template = await communicationService.getTemplate(templateId);
    if (template) {
      setSubject(template.subject);
      setMessage(template.body);
    }
  };

  const handleSend = async () => {
    if (!subject || !message) {
      alert('Veuillez remplir le sujet et le message');
      return;
    }

    setSending(true);

    const result = await communicationService.sendBulkCommunication(
      applications,
      subject,
      message,
      channel
    );

    setSending(false);
    setSent(true);

    setTimeout(() => {
      onSuccess();
      onClose();
    }, 2000);
  };

  if (sent) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Message{applications.length > 1 ? 's' : ''} envoyé{applications.length > 1 ? 's' : ''}</h2>
            <p className="text-gray-600">
              {applications.length} candidat{applications.length > 1 ? 's ont été notifiés' : ' a été notifié'} avec succès.
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
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Envoyer un message</h2>
                <p className="text-blue-100 text-sm">
                  {applications.length} candidat{applications.length > 1 ? 's' : ''}
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
              <h3 className="font-semibold text-blue-900 mb-2">Destinataires:</h3>
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
                Template (optionnel)
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner un template...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.template_name} {template.is_system && '(Système)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Canal de communication
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setChannel('notification')}
                  className={`p-4 rounded-xl border-2 transition ${
                    channel === 'notification'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <MessageSquare className={`w-6 h-6 mx-auto mb-2 ${channel === 'notification' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="text-sm font-medium">Notification</div>
                </button>
                <button
                  onClick={() => setChannel('email')}
                  className={`p-4 rounded-xl border-2 transition ${
                    channel === 'email'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Mail className={`w-6 h-6 mx-auto mb-2 ${channel === 'email' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="text-sm font-medium">Email</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Sujet *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Objet du message"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Message *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                placeholder="Votre message aux candidats..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                Variables disponibles: {'{'}candidate_name{'}'}, {'{'}job_title{'}'}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-gray-200 p-6 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            disabled={sending}
            className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !subject || !message}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Envoi en cours...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Envoyer</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
