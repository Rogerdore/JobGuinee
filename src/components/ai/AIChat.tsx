import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { chatbotConversationService, ChatbotConversation, ChatMessage } from '../../services/chatbotConversationService';
import { MessageCircle, Plus, Archive, Trash2, ArrowLeft, Send, Loader } from 'lucide-react';
import CreditBalance from '../credits/CreditBalance';

interface AIChatProps {
  onNavigate?: (page: string) => void;
}

export default function AIChat({ onNavigate }: AIChatProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatbotConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ChatbotConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await chatbotConversationService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = async () => {
    try {
      const newConversation = await chatbotConversationService.createConversation(user?.id);
      setConversations([newConversation, ...conversations]);
      setCurrentConversation(newConversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentConversation || sending) return;

    try {
      setIsSending(true);
      const userMessage: ChatMessage = {
        role: 'user',
        content: messageInput,
        timestamp: new Date().toISOString(),
      };

      let updatedConversation = await chatbotConversationService.addMessage(
        currentConversation.id,
        userMessage
      );

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: 'Je suis en train de traiter votre question... Merci de patienter.',
        timestamp: new Date().toISOString(),
      };

      updatedConversation = await chatbotConversationService.addMessage(
        updatedConversation.id,
        assistantMessage
      );

      setCurrentConversation(updatedConversation);
      setConversations(conversations.map(c => c.id === updatedConversation.id ? updatedConversation : c));
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await chatbotConversationService.deleteConversation(id);
      setConversations(conversations.filter(c => c.id !== id));
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const handleArchiveConversation = async (id: string) => {
    try {
      await chatbotConversationService.archiveConversation(id);
      setConversations(conversations.filter(c => c.id !== id));
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
      }
    } catch (error) {
      console.error('Error archiving conversation:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => onNavigate?.('premium-ai')}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>
          <button
            onClick={handleCreateConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Nouvelle
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {conversations.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-8">Aucune conversation</p>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setCurrentConversation(conv)}
                className={`p-3 rounded-lg cursor-pointer transition-all group ${
                  currentConversation?.id === conv.id
                    ? 'bg-blue-100 border border-blue-300'
                    : 'hover:bg-gray-100 border border-transparent'
                }`}
              >
                <p className="font-medium text-gray-900 truncate text-sm">{conv.title}</p>
                <p className="text-xs text-gray-500 mt-1">{conv.total_messages} messages</p>
                <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleArchiveConversation(conv.id);
                    }}
                    className="flex-1 p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Archiver"
                  >
                    <Archive className="w-4 h-4 text-gray-600 mx-auto" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                    className="flex-1 p-1 hover:bg-red-100 rounded transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4 text-red-600 mx-auto" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <CreditBalance />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-orange-500 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{currentConversation.title}</h2>
                <p className="text-sm text-gray-500">{currentConversation.total_messages} messages</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {currentConversation.messages && currentConversation.messages.length > 0 ? (
                currentConversation.messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-br-none'
                          : 'bg-gray-200 text-gray-900 rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-600'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Commencez la conversation</h3>
                  <p className="text-gray-600 max-w-sm">
                    Posez vos questions sur les carrières, les emplois, et recevez des conseils personnalisés
                  </p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Tapez votre message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  disabled={sending}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sending}
                  className="p-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {sending ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <MessageCircle className="w-20 h-20 text-gray-300 mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Chatbot IA</h2>
            <p className="text-gray-600 mb-8 max-w-sm">
              Discutez avec notre assistant IA pour obtenir des conseils sur votre carrière et vos candidatures
            </p>
            <button
              onClick={handleCreateConversation}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Démarrer une conversation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
