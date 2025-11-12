import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  MessageCircle,
  Send,
  Paperclip,
  X,
  Search,
  Loader,
  AlertCircle,
  CheckCircle2,
  User,
  Briefcase,
  Clock,
  MoreVertical,
  Trash2,
  Archive,
  CheckCheck,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Conversation {
  id: string;
  candidate_id: string;
  recruiter_id: string;
  job_id: string | null;
  last_message_at: string;
  candidate_unread_count: number;
  recruiter_unread_count: number;
  created_at: string;
  candidate?: {
    id: string;
    full_name: string;
    email: string;
  };
  recruiter?: {
    id: string;
    full_name: string;
    email: string;
  };
  job?: {
    id: string;
    title: string;
    company_name: string;
  };
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  created_at: string;
}

interface MessagingSystemProps {
  userType: 'candidate' | 'recruiter';
  onNavigate?: (page: string, id?: string) => void;
}

export default function MessagingSystem({ userType, onNavigate }: MessagingSystemProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
      setupRealtimeSubscriptions();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      markMessagesAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const setupRealtimeSubscriptions = () => {
    const conversationSubscription = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    const messageSubscription = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          if (selectedConversation && payload.new.conversation_id === selectedConversation.id) {
            setMessages((prev) => [...prev, payload.new as Message]);
            markMessagesAsRead(selectedConversation.id);
          }
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      conversationSubscription.unsubscribe();
      messageSubscription.unsubscribe();
    };
  };

  const loadConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(
          `
          *,
          candidate:candidate_id(id, full_name, email),
          recruiter:recruiter_id(id, full_name, email),
          job:job_id(id, title, company_name)
        `
        )
        .or(`candidate_id.eq.${user.id},recruiter_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error: any) {
      console.error('Erreur chargement conversations:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des conversations.' });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Erreur chargement messages:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des messages.' });
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    if (!user) return;

    try {
      await supabase.rpc('mark_messages_as_read', {
        p_conversation_id: conversationId,
        p_user_id: user.id,
      });
      await loadConversations();
    } catch (error: any) {
      console.error('Erreur marquage messages lus:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedConversation || !messageText.trim()) return;

    setSending(true);
    setMessage(null);

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        content: messageText.trim(),
      });

      if (error) throw error;
      setMessageText('');
    } catch (error: any) {
      console.error('Erreur envoi message:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'envoi du message.' });
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !selectedConversation) return;

    setUploading(true);
    setMessage(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('message-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(fileName);

      const { error: messageError } = await supabase.from('messages').insert({
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        content: `Fichier joint: ${file.name}`,
        attachment_url: urlData.publicUrl,
        attachment_name: file.name,
      });

      if (messageError) throw messageError;
      setMessage({ type: 'success', text: 'Fichier envoyé avec succès!' });
    } catch (error: any) {
      console.error('Erreur upload fichier:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'envoi du fichier.' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    if (userType === 'candidate') {
      return conversation.recruiter;
    }
    return conversation.candidate;
  };

  const getUnreadCount = (conversation: Conversation) => {
    if (userType === 'candidate') {
      return conversation.candidate_unread_count;
    }
    return conversation.recruiter_unread_count;
  };

  const filteredConversations = conversations.filter((conv) => {
    const participant = getOtherParticipant(conv);
    const searchLower = searchQuery.toLowerCase();
    return (
      participant?.full_name.toLowerCase().includes(searchLower) ||
      participant?.email.toLowerCase().includes(searchLower) ||
      conv.job?.title.toLowerCase().includes(searchLower) ||
      conv.job?.company_name.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-900 mx-auto mb-4" />
          <p className="text-gray-600">Chargement de la messagerie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-300px)] flex bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="w-full md:w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center space-x-2">
            <MessageCircle className="w-6 h-6 text-blue-900" />
            <span>Messages</span>
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const participant = getOtherParticipant(conv);
              const unreadCount = getUnreadCount(conv);
              const isSelected = selectedConversation?.id === conv.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-4 border-b border-gray-200 hover:bg-gray-50 transition text-left ${
                    isSelected ? 'bg-blue-50 border-l-4 border-l-blue-900' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {participant?.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {participant?.full_name}
                        </h3>
                        {unreadCount > 0 && (
                          <span className="ml-2 px-2 py-1 bg-blue-900 text-white text-xs font-bold rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      {conv.job && (
                        <div className="flex items-center space-x-1 text-xs text-gray-600 mb-1">
                          <Briefcase className="w-3 h-3" />
                          <span className="truncate">{conv.job.title}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>
                          {formatDistanceToNow(new Date(conv.last_message_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold">
                    {getOtherParticipant(selectedConversation)?.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {getOtherParticipant(selectedConversation)?.full_name}
                    </h3>
                    {selectedConversation.job && (
                      <button
                        onClick={() =>
                          onNavigate && onNavigate('job-detail', selectedConversation.job?.id)
                        }
                        className="flex items-center space-x-1 text-sm text-blue-900 hover:underline"
                      >
                        <Briefcase className="w-3 h-3" />
                        <span>{selectedConversation.job.title}</span>
                      </button>
                    )}
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-200 rounded-lg transition">
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {message && (
              <div
                className={`mx-4 mt-4 p-3 rounded-lg border-l-4 ${
                  message.type === 'success'
                    ? 'bg-green-50 border-green-500'
                    : 'bg-red-50 border-red-500'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {message.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <p
                    className={`text-sm font-medium ${
                      message.type === 'success' ? 'text-green-900' : 'text-red-900'
                    }`}
                  >
                    {message.text}
                  </p>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isSender = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] ${
                        isSender
                          ? 'bg-blue-900 text-white rounded-2xl rounded-br-sm'
                          : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm'
                      } p-3 shadow-sm`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      {msg.attachment_url && (
                        <a
                          href={msg.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center space-x-2 mt-2 p-2 rounded-lg ${
                            isSender ? 'bg-blue-800' : 'bg-gray-200'
                          } hover:opacity-80 transition`}
                        >
                          <Paperclip className="w-4 h-4" />
                          <span className="text-xs truncate">{msg.attachment_name}</span>
                        </a>
                      )}
                      <div
                        className={`flex items-center space-x-1 mt-1 text-xs ${
                          isSender ? 'text-blue-200' : 'text-gray-500'
                        }`}
                      >
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isSender && msg.is_read && <CheckCheck className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-end space-x-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="p-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition disabled:opacity-50"
                  title="Joindre un fichier"
                >
                  {uploading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Paperclip className="w-5 h-5" />
                  )}
                </button>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e);
                    }
                  }}
                  placeholder="Écrivez votre message..."
                  rows={2}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <button
                  type="submit"
                  disabled={sending || !messageText.trim()}
                  className="p-3 bg-blue-900 text-white rounded-xl hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Appuyez sur Entrée pour envoyer, Shift+Entrée pour nouvelle ligne
              </p>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Sélectionnez une conversation
              </h3>
              <p className="text-gray-600">
                Choisissez une conversation dans la liste pour commencer à échanger
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
