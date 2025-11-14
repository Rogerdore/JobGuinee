import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minimize2, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatBotConfig {
  enabled: boolean;
  name: string;
  welcome_message: string;
  avatar_url: string | null;
  primary_color: string;
  position: 'bottom-right' | 'bottom-left';
}

export default function ChatBot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<ChatBotConfig | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [showTooltip, setShowTooltip] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadConfig();
    loadConversation();
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0 && config) {
      setMessages([{
        role: 'assistant',
        content: config.welcome_message,
        timestamp: new Date().toISOString()
      }]);
    }
  }, [isOpen, config]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConfig = async () => {
    const { data } = await supabase
      .from('chatbot_config')
      .select('*')
      .single();

    if (data) {
      setConfig(data);
    }
  };

  const loadConversation = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('chatbot_conversations')
      .select('messages')
      .eq('user_id', user.id)
      .eq('session_id', sessionId)
      .single();

    if (data?.messages) {
      setMessages(data.messages);
    }
  };

  const saveConversation = async (newMessages: Message[]) => {
    if (!user) return;

    const { data: existing } = await supabase
      .from('chatbot_conversations')
      .select('id')
      .eq('user_id', user.id)
      .eq('session_id', sessionId)
      .single();

    if (existing) {
      await supabase
        .from('chatbot_conversations')
        .update({ messages: newMessages })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('chatbot_conversations')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          messages: newMessages
        });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const playNotificationSound = () => {
    if (isSoundEnabled) {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIF2m98OSeUBALTqXh8bllHgU2jdXzzn0vBSl+zPLaizsKElyx6OyrWBMKRp/g8r5sIQUrgs/y2Ik2CBZpvfDjn1QRDEyl4fG5ZB4FNo3V88+ALwYpfszz2oo7ChBbsOjrq1gTCkaf4PK+bCEFK4LO8tiJNggWab3w459UEAxMpOHxuWQeBTaN1fPQgC8GKX/M89qKOwsPWrDo66tYEwpGn+DyvmwhBSuCzvLYiTYIFmm98OOfVBAMTKTh8blkHgU2jdXz0IAvBil/zPPaijsLD1qw6OurWBMKRp/g8r5sIQUrgs7y2Ik2CBZpvfDjn1MRDEyl4fG5ZR4FNo3V89CALwYpfszz2oo7Cg9asOjrq1gTCkaf4PK+bCEFK4LO8tiJNggWab3w459TEQxMpOHxuWUeBTaN1fPPgC8GKX7M89qKOwoPW7Do66tYEwpGn+DyvmwhBSuCzvLYiTYIFmm98OOfUxEMTKTh8bllHgU2jdXzz4AvBil+zPPaijsKD1uw6OurWBMKRp/g8r5sIQUrgs7y2Ik2CBZpvfDjn1MRDEyk4fG5ZR4FNo3V88+ALwYpfsz02oo7Cg9bsOjrq1gTCkaf4PK+bCEFK4LO8tiJNggWab3w459TEQxMpOHxuWUeBTaN1fPPgC8GKX7M9NqKOwoPW7Do66tYEwpGn+DyvmwhBSuCzvLYiTYIFmm98OOfUxEMTKTh8bllHgU2jdXzz4AvBil+zPTaijsKD1uw6OurWBMKRp/g8r5sIQUrgs7y2Ik2CBZpvfDjn1MRDEyk4fG5ZR4FNo3V88+ALwYpfsz02oo7Cg9bsOjrq1gTCkaf4PK+bCEFK4LO8tiJNggWab3w459TEQxMpOHxuWUeBTaN1fPPgC8GKX7M9NqKOwoPW7Do66tYEwpGn+DyvmwhBSuCzvLYiTYIFmm98OOfUxEMTKTh8bllHgU2jdXzz4AvBil+zPTaijsKD1uw6OurWBMKRp/g8r5sIQU=');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Check FAQs first
      const { data: faqs } = await supabase
        .from('chatbot_faqs')
        .select('*')
        .eq('active', true)
        .order('priority', { ascending: false });

      let botResponse = '';
      const lowerInput = inputMessage.toLowerCase();

      if (faqs) {
        const matchingFaq = faqs.find(faq =>
          faq.keywords?.some((keyword: string) => lowerInput.includes(keyword.toLowerCase())) ||
          lowerInput.includes(faq.question.toLowerCase())
        );

        if (matchingFaq) {
          botResponse = matchingFaq.answer;
        }
      }

      // If no FAQ match, use AI via edge function
      if (!botResponse) {
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

          const apiUrl = `${supabaseUrl}/functions/v1/chatbot-ai`;

          const conversationMessages = newMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          }));

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: conversationMessages,
              sessionId: sessionId
            })
          });

          if (response.ok) {
            const data = await response.json();
            botResponse = data.response;
          } else {
            console.error('AI API error:', await response.text());
            botResponse = "Je suis désolé, je n'ai pas de réponse précise à votre question pour le moment. Pourriez-vous reformuler ou me poser une autre question? Vous pouvez aussi consulter notre section FAQ ou contacter notre support.";
          }
        } catch (aiError) {
          console.error('AI call error:', aiError);
          botResponse = "Je suis désolé, je n'ai pas de réponse précise à votre question pour le moment. Pourriez-vous reformuler ou me poser une autre question? Vous pouvez aussi consulter notre section FAQ ou contacter notre support.";
        }
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: botResponse,
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      await saveConversation(finalMessages);
      playNotificationSound();

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Désolé, une erreur est survenue. Veuillez réessayer.',
        timestamp: new Date().toISOString()
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!config?.enabled) return null;

  const positionClasses = config.position === 'bottom-right'
    ? 'right-6 bottom-6'
    : 'left-6 bottom-6';

  return (
    <div className={`fixed ${positionClasses} z-50`}>
      {/* Chat Window */}
      {isOpen && (
        <div
          className={`mb-4 w-96 bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${
            isMinimized ? 'h-16' : 'h-[600px]'
          }`}
          style={{
            boxShadow: '20px 20px 60px #d1d9e6, -20px -20px 60px #ffffff',
          }}
        >
          {/* Header */}
          <div
            className="p-4 text-white relative overflow-hidden cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${config.primary_color}, ${config.primary_color}dd)`,
            }}
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
              style={{ background: 'white', transform: 'translate(30%, -30%)' }}
            />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"
                  style={{
                    boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.1), inset -2px -2px 5px rgba(255,255,255,0.1)',
                  }}
                >
                  {config.avatar_url ? (
                    <img src={config.avatar_url} alt="Bot" className="w-10 h-10 rounded-full" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{config.name}</h3>
                  <p className="text-xs text-white/80 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    En ligne
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSoundEnabled(!isSoundEnabled);
                  }}
                  className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 transition flex items-center justify-center"
                >
                  {isSoundEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMinimized(!isMinimized);
                  }}
                  className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 transition flex items-center justify-center"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 transition flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="h-[440px] overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-gray-50 to-blue-50/30">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-lg ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br text-white'
                          : 'bg-white text-gray-800'
                      }`}
                      style={message.role === 'user' ? {
                        background: `linear-gradient(135deg, ${config.primary_color}, ${config.primary_color}dd)`,
                        boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
                      } : {
                        boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
                      }}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                        {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl px-4 py-3 shadow-lg"
                      style={{
                        boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
                      }}
                    >
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tapez votre message..."
                    className="flex-1 px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-transparent focus:outline-none focus:ring-2 transition"
                    style={{
                      boxShadow: 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff',
                      focusRingColor: config.primary_color,
                    }}
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="w-12 h-12 rounded-2xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${config.primary_color}, ${config.primary_color}dd)`,
                      boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
                    }}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <div className="relative">
          {/* Tooltip */}
          <div
            className={`absolute ${config.position === 'bottom-right' ? 'right-20' : 'left-20'} bottom-4 transition-all duration-300 ${
              showTooltip ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'
            }`}
          >
            <div className="bg-white px-4 py-3 rounded-2xl shadow-xl border border-gray-100 whitespace-nowrap"
              style={{
                boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
              }}
            >
              <p className="text-sm font-medium text-gray-700">Besoin d'aide ?</p>
              <p className="text-xs text-gray-500">Cliquez pour discuter avec moi 💬</p>
            </div>
          </div>

          {/* Button */}
          <button
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
              setShowTooltip(false);
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="w-16 h-16 rounded-full text-white shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center group relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${config.primary_color}, ${config.primary_color}dd)`,
              boxShadow: '12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff',
            }}
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity rounded-full"></div>
            <MessageCircle className="w-7 h-7 relative z-10 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full"></span>
          </button>
        </div>
      )}
    </div>
  );
}
