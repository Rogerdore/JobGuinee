import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  MessageSquare,
  Send,
  Filter,
  Search,
  Mail,
  Bell,
  User,
  Briefcase,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { communicationService, CommunicationTemplate } from '../services/communicationService';

interface Message {
  id: string;
  application_id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  message: string;
  channel: string;
  status: string;
  sent_at: string;
  sender: { full_name: string };
  recipient: { full_name: string };
  application: {
    job: { title: string };
    workflow_stage: string;
  };
}

interface RecruiterMessagingProps {
  onNavigate: (page: string) => void;
}

export default function RecruiterMessaging({ onNavigate }: RecruiterMessagingProps) {
  const { user } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const [composing, setComposing] = useState(false);
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadCompany();
  }, [user]);

  useEffect(() => {
    if (company) {
      loadMessages();
      loadTemplates();
    }
  }, [company]);

  useEffect(() => {
    filterMessages();
  }, [messages, searchQuery, channelFilter, statusFilter]);

  const loadCompany = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (data) {
      setCompany(data);
    }
  };

  const loadMessages = async () => {
    if (!company) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('communications_log')
        .select(`
          *,
          sender:profiles!communications_log_sender_id_fkey(full_name),
          recipient:profiles!communications_log_recipient_id_fkey(full_name),
          application:applications(
            workflow_stage,
            job:jobs(title)
          )
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('sent_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    const data = await communicationService.getTemplates(company?.id);
    setTemplates(data);
  };

  const filterMessages = () => {
    let filtered = [...messages];

    if (searchQuery) {
      filtered = filtered.filter(msg =>
        msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.sender?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.recipient?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (channelFilter !== 'all') {
      filtered = filtered.filter(msg => msg.channel === channelFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(msg => msg.status === statusFilter);
    }

    setFilteredMessages(filtered);
  };

  const handleTemplateChange = async (templateId: string) => {
    setSelectedTemplate(templateId);

    if (!templateId) {
      setNewSubject('');
      setNewMessage('');
      return;
    }

    const template = await communicationService.getTemplate(templateId);
    if (template) {
      setNewSubject(template.subject);
      setNewMessage(template.body);
    }
  };

  const handleSendMessage = async () => {
    if (!newSubject || !newMessage || !recipientSearch) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    setSending(true);
    try {
      const { data: applications } = await supabase
        .from('applications')
        .select('id, candidate_id, candidate:candidate_profiles!applications_candidate_id_fkey(profile:profiles!candidate_profiles_profile_id_fkey(full_name, email))')
        .eq('job_id', company.id)
        .ilike('candidate.profile.full_name', `%${recipientSearch}%`)
        .limit(1);

      if (!applications || applications.length === 0) {
        alert('Candidat non trouvé');
        return;
      }

      const app = applications[0];
      const result = await communicationService.sendCommunication({
        applicationId: app.id,
        recipientId: app.candidate_id,
        subject: newSubject,
        message: newMessage,
        channel: 'notification'
      });

      if (result.success) {
        alert('Message envoyé avec succès!');
        setComposing(false);
        setNewSubject('');
        setNewMessage('');
        setRecipientSearch('');
        loadMessages();
      } else {
        alert('Erreur: ' + result.error);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert('Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; label: string; icon: any }> = {
      sent: { color: 'bg-blue-100 text-blue-700', label: 'Envoyé', icon: Send },
      delivered: { color: 'bg-green-100 text-green-700', label: 'Délivré', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-700', label: 'Échec', icon: AlertCircle }
    };

    const badge = badges[status] || badges.sent;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  const getChannelBadge = (channel: string) => {
    const badges: Record<string, { color: string; label: string; icon: any }> = {
      notification: { color: 'bg-gray-100 text-gray-700', label: 'Notification', icon: Bell },
      email: { color: 'bg-purple-100 text-purple-700', label: 'Email', icon: Mail },
      sms: { color: 'bg-green-100 text-green-700', label: 'SMS', icon: MessageSquare },
      whatsapp: { color: 'bg-green-100 text-green-700', label: 'WhatsApp', icon: MessageSquare }
    };

    const badge = badges[channel] || badges.notification;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-green-600"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <MessageSquare className="w-8 h-8 mr-3 text-green-600" />
            Messagerie Recruteur
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez toutes vos communications avec les candidats
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Messages totaux</p>
                <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Envoyés</p>
                <p className="text-2xl font-bold text-green-600">
                  {messages.filter(m => m.sender_id === user?.id).length}
                </p>
              </div>
              <Send className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reçus</p>
                <p className="text-2xl font-bold text-purple-600">
                  {messages.filter(m => m.recipient_id === user?.id).length}
                </p>
              </div>
              <Mail className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <button
              onClick={() => setComposing(true)}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center"
            >
              <Send className="w-5 h-5 mr-2" />
              Nouveau message
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="p-6 border-b">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Tous les canaux</option>
                <option value="notification">Notifications</option>
                <option value="email">Emails</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="sent">Envoyés</option>
                <option value="delivered">Délivrés</option>
                <option value="failed">Échecs</option>
              </select>
            </div>
          </div>

          <div className="divide-y max-h-[600px] overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="p-12 text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun message trouvé</p>
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => setSelectedMessage(msg)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900">
                            {msg.sender_id === user?.id ? msg.recipient?.full_name : msg.sender?.full_name}
                          </span>
                          {msg.application?.job && (
                            <span className="text-sm text-gray-500">
                              • {msg.application.job.title}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          {getChannelBadge(msg.channel)}
                          {getStatusBadge(msg.status)}
                          {msg.application?.workflow_stage && (
                            <span className="text-xs text-gray-500">
                              {msg.application.workflow_stage}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(msg.sent_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <div className="ml-13">
                    <p className="font-medium text-gray-900 mb-1">{msg.subject}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{msg.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {composing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <Send className="w-6 h-6 mr-2 text-green-600" />
                  Nouveau message
                </h3>
                <button
                  onClick={() => setComposing(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <AlertCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template (optionnel)
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Sans template</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.template_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destinataire
                  </label>
                  <input
                    type="text"
                    value={recipientSearch}
                    onChange={(e) => setRecipientSearch(e.target.value)}
                    placeholder="Nom du candidat..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sujet
                  </label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSendMessage}
                    disabled={sending}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 flex items-center justify-center"
                  >
                    {sending ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Envoyer
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setComposing(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Détails du message</h3>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <AlertCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {selectedMessage.sender?.full_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        À: {selectedMessage.recipient?.full_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(selectedMessage.sent_at).toLocaleString('fr-FR')}
                    </p>
                    <div className="flex items-center justify-end space-x-2 mt-1">
                      {getChannelBadge(selectedMessage.channel)}
                      {getStatusBadge(selectedMessage.status)}
                    </div>
                  </div>
                </div>

                {selectedMessage.application?.job && (
                  <div className="flex items-center bg-blue-50 rounded-lg p-3">
                    <Briefcase className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-sm text-blue-900">
                      {selectedMessage.application.job.title}
                    </span>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-bold text-lg text-gray-900 mb-3">
                    {selectedMessage.subject}
                  </h4>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedMessage.message}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
