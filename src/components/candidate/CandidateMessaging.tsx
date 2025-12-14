import { useState, useEffect, useRef } from 'react';
import {
  MessageCircle, Send, Search, Filter, Mail, Bell, Phone,
  Briefcase, Building2, Calendar, Clock, Check, CheckCheck,
  ChevronLeft, ChevronRight, X, MoreVertical, Archive,
  Star, AlertCircle, Paperclip, Image as ImageIcon, File
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  type: 'notification' | 'communication';
  channel: 'notification' | 'email' | 'sms' | 'whatsapp';
  sender: {
    id: string;
    name: string;
    company?: string;
    avatar?: string;
  };
  subject?: string;
  message: string;
  timestamp: string;
  read: boolean;
  application?: {
    id: string;
    reference: string;
    job_title: string;
    company_name: string;
  };
  metadata?: any;
}

interface Conversation {
  id: string;
  application_id?: string;
  job_title: string;
  company_name: string;
  company_logo?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  messages: Message[];
}

type FilterType = 'all' | 'notification' | 'email' | 'sms' | 'whatsapp' | 'unread';

export default function CandidateMessaging() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id) {
      loadConversations();
      const unsubscribe = subscribeToMessages();
      return unsubscribe;
    }
  }, [user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const subscribeToMessages = () => {
    const notificationsSubscription = supabase
      .channel('notifications_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        loadConversations();
      })
      .subscribe();

    const communicationsSubscription = supabase
      .channel('communications_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'communications_log',
        filter: `recipient_id=eq.${user?.id}`
      }, () => {
        loadConversations();
      })
      .subscribe();

    return () => {
      notificationsSubscription.unsubscribe();
      communicationsSubscription.unsubscribe();
    };
  };

  const loadConversations = async () => {
    if (!user?.id) {
      return;
    }

    setLoading(true);
    try {
      const [notificationsData, communicationsData, applicationsData] = await Promise.all([
        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),

        supabase
          .from('communications_log')
          .select(`
            *,
            sender:sender_id(id, full_name),
            application:application_id(
              id,
              application_reference,
              jobs(title, companies(name, logo_url))
            )
          `)
          .eq('recipient_id', user.id)
          .order('sent_at', { ascending: false }),

        supabase
          .from('applications')
          .select(`
            id,
            application_reference,
            jobs(
              id,
              title,
              companies(id, name, logo_url)
            )
          `)
          .eq('candidate_id', user.id)
      ]);

      const groupedConversations: { [key: string]: Conversation } = {};

      if (applicationsData.data) {
        applicationsData.data.forEach((app: any) => {
          if (!app.jobs) return;

          const key = app.id;
          groupedConversations[key] = {
            id: key,
            application_id: app.id,
            job_title: app.jobs.title,
            company_name: app.jobs.companies?.name || 'Entreprise',
            company_logo: app.jobs.companies?.logo_url,
            last_message: '',
            last_message_time: '',
            unread_count: 0,
            messages: []
          };
        });
      }

      if (notificationsData.data) {
        notificationsData.data.forEach((notif: any) => {
          const appId = notif.link?.includes('application=')
            ? notif.link.split('application=')[1].split('&')[0]
            : 'general';

          if (!groupedConversations[appId]) {
            groupedConversations[appId] = {
              id: appId,
              job_title: 'Notifications générales',
              company_name: 'JobGuinée',
              last_message: '',
              last_message_time: '',
              unread_count: 0,
              messages: []
            };
          }

          const message: Message = {
            id: notif.id,
            type: 'notification',
            channel: 'notification',
            sender: {
              id: 'system',
              name: 'JobGuinée',
              company: 'Système'
            },
            subject: notif.title,
            message: notif.message,
            timestamp: notif.created_at,
            read: notif.read,
            metadata: notif
          };

          groupedConversations[appId].messages.push(message);
          if (!notif.read) {
            groupedConversations[appId].unread_count++;
          }
        });
      }

      if (communicationsData.data) {
        communicationsData.data.forEach((comm: any) => {
          const appId = comm.application_id || 'general';

          if (!groupedConversations[appId]) {
            groupedConversations[appId] = {
              id: appId,
              job_title: comm.application?.jobs?.title || 'Communication directe',
              company_name: comm.application?.jobs?.companies?.name || 'Recruteur',
              last_message: '',
              last_message_time: '',
              unread_count: 0,
              messages: []
            };
          }

          const message: Message = {
            id: comm.id,
            type: 'communication',
            channel: comm.channel,
            sender: {
              id: comm.sender_id,
              name: comm.application?.jobs?.companies?.name || 'Recruteur',
              company: comm.application?.jobs?.companies?.name
            },
            subject: comm.subject,
            message: comm.message,
            timestamp: comm.sent_at,
            read: !!comm.delivered_at,
            application: comm.application ? {
              id: comm.application.id,
              reference: comm.application.application_reference,
              job_title: comm.application.jobs?.title,
              company_name: comm.application.jobs?.companies?.name
            } : undefined,
            metadata: comm.metadata
          };

          groupedConversations[appId].messages.push(message);
        });
      }

      Object.values(groupedConversations).forEach(conv => {
        conv.messages.sort((a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        if (conv.messages.length > 0) {
          const lastMsg = conv.messages[conv.messages.length - 1];
          conv.last_message = lastMsg.message.substring(0, 60) + '...';
          conv.last_message_time = lastMsg.timestamp;
        }
      });

      const conversationsArray = Object.values(groupedConversations)
        .filter(conv => conv.messages.length > 0)
        .sort((a, b) =>
          new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
        );

      setConversations(conversationsArray);

      if (selectedConversation) {
        const updated = conversationsArray.find(c => c.id === selectedConversation.id);
        if (updated) {
          setSelectedConversation(updated);
        }
      }

    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (conversation: Conversation) => {
    const unreadNotifications = conversation.messages
      .filter(m => m.type === 'notification' && !m.read)
      .map(m => m.id);

    if (unreadNotifications.length > 0) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadNotifications);
    }

    const unreadCommunications = conversation.messages
      .filter(m => m.type === 'communication' && !m.read)
      .map(m => m.id);

    if (unreadCommunications.length > 0) {
      await supabase
        .from('communications_log')
        .update({ delivered_at: new Date().toISOString() })
        .in('id', unreadCommunications);
    }

    // Ne pas recharger immédiatement, le WebSocket va s'en charger
    // loadConversations();
  };

  const handleSelectConversation = (e: React.MouseEvent, conversation: Conversation) => {
    e.preventDefault();
    setSelectedConversation(conversation);
    markAsRead(conversation);
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedConversation || !user?.id) return;

    setSending(true);
    try {
      if (selectedConversation.application_id) {
        await supabase
          .from('communications_log')
          .insert({
            application_id: selectedConversation.application_id,
            sender_id: user.id,
            recipient_id: selectedConversation.messages[0]?.sender.id || user.id,
            communication_type: 'reply',
            channel: 'notification',
            message: replyMessage,
            status: 'sent'
          });
      }

      setReplyMessage('');
      // Le WebSocket rechargera automatiquement
      // loadConversations();
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setSending(false);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <Phone className="w-4 h-4" />;
      case 'whatsapp': return <MessageCircle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case 'email': return 'Email';
      case 'sms': return 'SMS';
      case 'whatsapp': return 'WhatsApp';
      default: return 'Notification';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const filteredConversations = conversations.filter(conv => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!conv.job_title.toLowerCase().includes(query) &&
          !conv.company_name.toLowerCase().includes(query) &&
          !conv.last_message.toLowerCase().includes(query)) {
        return false;
      }
    }

    if (filterType === 'unread') {
      return conv.unread_count > 0;
    }

    if (filterType !== 'all') {
      return conv.messages.some(m => m.channel === filterType);
    }

    return true;
  });

  const totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unread_count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[600px] bg-gray-50 rounded-xl border-2 border-gray-200 overflow-hidden">
      {/* Sidebar - Liste des conversations */}
      <div className="w-96 bg-white border-r-2 border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Messages</h2>
              <p className="text-sm text-gray-500">
                {totalUnreadCount > 0 ? `${totalUnreadCount} non lu${totalUnreadCount > 1 ? 's' : ''}` : 'Tout est lu'}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowFilters(!showFilters);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
            >
              <Filter className="w-5 h-5 text-gray-600" />
              {filterType !== 'all' && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></span>
              )}
            </button>
          </div>

          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtres */}
          {showFilters && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setFilterType('all');
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  filterType === 'all' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'
                }`}
              >
                <span className="font-medium">Tous les messages</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setFilterType('unread');
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  filterType === 'unread' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'
                }`}
              >
                <span className="font-medium">Non lus</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setFilterType('email');
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  filterType === 'email' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span className="font-medium">Emails</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setFilterType('notification');
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  filterType === 'notification' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span className="font-medium">Notifications</span>
              </button>
            </div>
          )}
        </div>

        {/* Liste des conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">Aucune conversation</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchQuery ? 'Aucun résultat pour cette recherche' : 'Vous recevrez vos messages ici'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={(e) => handleSelectConversation(e, conversation)}
                className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left ${
                  selectedConversation?.id === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Logo entreprise ou icône */}
                  <div className="flex-shrink-0">
                    {conversation.company_logo ? (
                      <img
                        src={conversation.company_logo}
                        alt={conversation.company_name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{conversation.company_name}</h3>
                      {conversation.unread_count > 0 && (
                        <span className="flex-shrink-0 ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1 truncate">{conversation.job_title}</p>
                    <p className="text-xs text-gray-500 truncate">{conversation.last_message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatTime(conversation.last_message_time)}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Zone de conversation */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversation ? (
          <>
            {/* Header conversation */}
            <div className="px-6 py-4 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {selectedConversation.company_logo ? (
                    <img
                      src={selectedConversation.company_logo}
                      alt={selectedConversation.company_name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-gray-900">{selectedConversation.company_name}</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      {selectedConversation.job_title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedConversation(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedConversation.messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Aucun message dans cette conversation</p>
                  </div>
                </div>
              ) : (
                selectedConversation.messages.map((message, index) => {
                const isSystem = message.sender.id === 'system' || message.sender.id === user?.id;
                const showDate = index === 0 ||
                  new Date(message.timestamp).toDateString() !==
                  new Date(selectedConversation.messages[index - 1].timestamp).toDateString();

                return (
                  <div key={message.id}>
                    {/* Séparateur de date */}
                    {showDate && (
                      <div className="flex items-center justify-center my-6">
                        <div className="px-4 py-1 bg-gray-100 rounded-full">
                          <p className="text-xs font-medium text-gray-600">
                            {new Date(message.timestamp).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Message */}
                    <div className={`flex ${isSystem ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-2xl ${isSystem ? 'order-2' : 'order-1'}`}>
                        {/* En-tête message */}
                        <div className={`flex items-center gap-2 mb-1 ${isSystem ? 'justify-end' : 'justify-start'}`}>
                          {!isSystem && (
                            <span className="text-sm font-semibold text-gray-900">
                              {message.sender.name}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            {getChannelIcon(message.channel)}
                            <span>{getChannelLabel(message.channel)}</span>
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {/* Bulle message */}
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            isSystem
                              ? 'bg-blue-600 text-white rounded-tr-none'
                              : 'bg-gray-100 text-gray-900 rounded-tl-none'
                          }`}
                        >
                          {message.subject && (
                            <p className={`font-semibold mb-2 ${isSystem ? 'text-blue-100' : 'text-gray-900'}`}>
                              {message.subject}
                            </p>
                          )}
                          <div
                            className="whitespace-pre-wrap leading-relaxed prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: message.message }}
                          />

                          {message.application && (
                            <div className={`mt-3 pt-3 border-t ${isSystem ? 'border-blue-500' : 'border-gray-200'}`}>
                              <p className={`text-xs ${isSystem ? 'text-blue-100' : 'text-gray-500'}`}>
                                Candidature : {message.application.reference}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Statut lecture */}
                        {isSystem && (
                          <div className="flex justify-end mt-1">
                            {message.read ? (
                              <CheckCheck className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Check className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }))}
              <div ref={messagesEndRef} />
            </div>

            {/* Zone de réponse */}
            {selectedConversation.application_id && (
              <div className="p-4 border-t-2 border-gray-200 bg-gray-50">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply();
                        }
                      }}
                      placeholder="Écrivez votre message..."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Appuyez sur Entrée pour envoyer, Shift+Entrée pour une nouvelle ligne
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleSendReply();
                    }}
                    disabled={!replyMessage.trim() || sending}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Envoyer
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-6">
              <MessageCircle className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Sélectionnez une conversation</h3>
            <p className="text-gray-500 max-w-md">
              Choisissez une conversation dans la liste pour voir l'historique complet de vos échanges avec les recruteurs
            </p>
            {totalUnreadCount > 0 && (
              <div className="mt-6 px-6 py-3 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <p className="text-blue-700 font-medium flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Vous avez {totalUnreadCount} message{totalUnreadCount > 1 ? 's' : ''} non lu{totalUnreadCount > 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
