import { useState, useEffect, useMemo } from 'react';
import { X, Send, Mail, MessageSquare, Search, Filter, CheckSquare, Square, Users } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { supabase } from '../../lib/supabase';
import { communicationService, CommunicationTemplate } from '../../services/communicationService';

interface Candidate {
  id: string;
  application_id: string;
  full_name: string;
  email: string;
  phone?: string;
  job_id: string;
  job_title: string;
  profile_id: string;
}

interface ImprovedCommunicationModalProps {
  companyId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const SUBJECT_TEMPLATES = [
  'Invitation à un entretien',
  'Suite à votre candidature',
  'Demande de documents complémentaires',
  'Confirmation de réception',
  'Mise à jour sur votre candidature',
  'Rappel - Action requise',
  'Félicitations - Étape suivante',
  'Décision concernant votre candidature',
  'Planification d\'un rendez-vous',
  'Sujet personnalisé...'
];

export default function ImprovedCommunicationModal({
  companyId,
  onClose,
  onSuccess
}: ImprovedCommunicationModalProps) {
  const [step, setStep] = useState<1 | 2>(1);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('all');
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());

  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState<'notification' | 'email'>('email');

  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadCandidates();
    loadTemplates();
  }, [companyId]);

  const loadCandidates = async () => {
    setLoading(true);

    const { data: jobsData } = await supabase
      .from('jobs')
      .select('id')
      .eq('company_id', companyId);

    if (!jobsData || jobsData.length === 0) {
      setLoading(false);
      return;
    }

    const jobIds = jobsData.map(j => j.id);

    const { data, error } = await supabase
      .from('applications')
      .select(`
        id,
        job_id,
        candidate_id,
        job:jobs!applications_job_id_fkey(
          title
        ),
        candidate:candidate_profiles!applications_candidate_id_fkey(
          id,
          profile_id,
          profile:profiles!candidate_profiles_profile_id_fkey(
            full_name,
            email,
            phone
          )
        )
      `)
      .in('job_id', jobIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading candidates:', error);
      setLoading(false);
      return;
    }

    const candidatesData: Candidate[] = (data || []).map((app: any) => ({
      id: app.candidate.id,
      application_id: app.id,
      full_name: app.candidate.profile.full_name,
      email: app.candidate.profile.email,
      phone: app.candidate.profile.phone,
      job_id: app.job_id,
      job_title: app.job.title,
      profile_id: app.candidate.profile_id
    }));

    setCandidates(candidatesData);
    setLoading(false);
  };

  const loadTemplates = async () => {
    const data = await communicationService.getTemplates(companyId);
    setTemplates(data);
  };

  const handleTemplateChange = async (templateId: string) => {
    setSelectedTemplate(templateId);

    if (!templateId) {
      setMessage('');
      return;
    }

    const template = await communicationService.getTemplate(templateId);
    if (template) {
      if (!subject || subject === '') {
        setSubject(template.subject);
      }
      setMessage(template.body);
    }
  };

  const jobs = useMemo(() => {
    const uniqueJobs = new Map<string, string>();
    candidates.forEach(c => {
      if (!uniqueJobs.has(c.job_id)) {
        uniqueJobs.set(c.job_id, c.job_title);
      }
    });
    return Array.from(uniqueJobs.entries()).map(([id, title]) => ({ id, title }));
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    let filtered = candidates;

    if (selectedJobFilter !== 'all') {
      filtered = filtered.filter(c => c.job_id === selectedJobFilter);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.full_name.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.job_title.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [candidates, selectedJobFilter, searchTerm]);

  const toggleCandidate = (candidateId: string) => {
    const newSelected = new Set(selectedCandidates);
    if (newSelected.has(candidateId)) {
      newSelected.delete(candidateId);
    } else {
      newSelected.add(candidateId);
    }
    setSelectedCandidates(newSelected);
  };

  const toggleAll = () => {
    if (selectedCandidates.size === filteredCandidates.length) {
      setSelectedCandidates(new Set());
    } else {
      setSelectedCandidates(new Set(filteredCandidates.map(c => c.id)));
    }
  };

  const handleNext = () => {
    if (selectedCandidates.size === 0) {
      alert('Veuillez sélectionner au moins un candidat');
      return;
    }
    setStep(2);
  };

  const handleSend = async () => {
    const finalSubject = subject === 'Sujet personnalisé...' ? customSubject : subject;

    if (!finalSubject || !message) {
      alert('Veuillez remplir le sujet et le message');
      return;
    }

    if (selectedCandidates.size === 0) {
      alert('Aucun destinataire sélectionné');
      return;
    }

    setSending(true);

    const selectedCandidatesList = candidates.filter(c => selectedCandidates.has(c.id));

    const applicationsToSend = selectedCandidatesList.map(c => ({
      id: c.application_id,
      candidate_id: c.profile_id,
      candidate: {
        full_name: c.full_name
      }
    }));

    try {
      await communicationService.sendBulkCommunication(
        applicationsToSend,
        finalSubject,
        message,
        channel
      );

      setSending(false);

      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50';
      notification.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>${selectedCandidates.size} message(s) envoyé(s) avec succès !</span>
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error sending messages:', error);
      alert('Erreur lors de l\'envoi des messages');
      setSending(false);
    }
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      ['link'],
      ['clean']
    ]
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 text-center">Chargement des candidats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-900 via-blue-700 to-blue-900 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Nouveau message</h2>
                <p className="text-blue-100 text-sm">
                  {step === 1 ? 'Sélection des destinataires' : 'Composition du message'}
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

          <div className="flex items-center gap-4 mt-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${step === 1 ? 'bg-white/30' : 'bg-white/10'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 1 ? 'bg-white text-blue-900' : 'bg-white/20'}`}>
                1
              </div>
              <span className="font-semibold">Destinataires</span>
            </div>
            <div className="flex-1 h-1 bg-white/20 rounded-full"></div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${step === 2 ? 'bg-white/30' : 'bg-white/10'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 2 ? 'bg-white text-blue-900' : 'bg-white/20'}`}>
                2
              </div>
              <span className="font-semibold">Message</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 ? (
            <>
              <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un candidat..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={selectedJobFilter}
                    onChange={(e) => setSelectedJobFilter(e.target.value)}
                    className="pl-10 pr-8 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white min-w-[200px]"
                  >
                    <option value="all">Tous les projets</option>
                    {jobs.map(job => (
                      <option key={job.id} value={job.id}>{job.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <button
                  onClick={toggleAll}
                  className="flex items-center gap-2 text-blue-900 font-semibold hover:text-blue-700 transition"
                >
                  {selectedCandidates.size === filteredCandidates.length ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                  <span>Tout sélectionner</span>
                </button>
                <div className="flex items-center gap-2 text-blue-900">
                  <Users className="w-5 h-5" />
                  <span className="font-bold">{selectedCandidates.size}</span>
                  <span>candidat(s) sélectionné(s)</span>
                </div>
              </div>

              {filteredCandidates.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Aucun candidat trouvé</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {filteredCandidates.map(candidate => (
                    <div
                      key={candidate.id}
                      onClick={() => toggleCandidate(candidate.id)}
                      className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition ${
                        selectedCandidates.has(candidate.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {selectedCandidates.has(candidate.id) ? (
                          <CheckSquare className="w-6 h-6 text-blue-600" />
                        ) : (
                          <Square className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{candidate.full_name}</h3>
                        <p className="text-sm text-gray-600 truncate">{candidate.email}</p>
                        <p className="text-xs text-blue-600 mt-1 truncate">{candidate.job_title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-900" />
                  <span className="font-semibold text-blue-900">
                    {selectedCandidates.size} destinataire(s)
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {candidates
                    .filter(c => selectedCandidates.has(c.id))
                    .slice(0, 5)
                    .map(c => (
                      <span key={c.id} className="px-3 py-1 bg-white rounded-full text-sm text-blue-900 border border-blue-300">
                        {c.full_name}
                      </span>
                    ))}
                  {selectedCandidates.size > 5 && (
                    <span className="px-3 py-1 bg-blue-200 rounded-full text-sm text-blue-900 font-semibold">
                      +{selectedCandidates.size - 5} autres
                    </span>
                  )}
                </div>
              </div>

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
                    <option value="">Sans template</option>
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
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Sujet *
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sélectionnez un sujet...</option>
                    {SUBJECT_TEMPLATES.map((subj, idx) => (
                      <option key={idx} value={subj}>{subj}</option>
                    ))}
                  </select>

                  {subject === 'Sujet personnalisé...' && (
                    <input
                      type="text"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      placeholder="Saisissez votre sujet personnalisé"
                      className="w-full mt-3 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Message *
                  </label>
                  <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                    <ReactQuill
                      value={message}
                      onChange={setMessage}
                      modules={quillModules}
                      placeholder="Rédigez votre message aux candidats..."
                      theme="snow"
                      className="bg-white"
                      style={{ minHeight: '250px' }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Variables disponibles: {'{'}candidate_name{'}'}, {'{'}job_title{'}'}, {'{'}company_name{'}'}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="border-t-2 border-gray-200 p-6 bg-gray-50 flex gap-3">
          {step === 1 ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition"
              >
                Annuler
              </button>
              <button
                onClick={handleNext}
                disabled={selectedCandidates.size === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant →
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep(1)}
                disabled={sending}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition disabled:opacity-50"
              >
                ← Retour
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !subject || !message || (subject === 'Sujet personnalisé...' && !customSubject)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
