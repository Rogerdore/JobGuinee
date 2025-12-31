import React, { useState, useEffect, useRef } from 'react';
import { X, Minimize2, Crown, Zap, MapPin } from 'lucide-react';
import { ChatbotService, ChatbotSettings, ChatbotStyle, QuickAction, UserContext } from '../../services/chatbotService';
import { ChatbotNavigationService, UserNavigationContext } from '../../services/chatbotNavigationService';
import { NavigationIntent } from '../../services/navigationMap';
import { ChatbotIAAccessControl, EnhancedUserContext, ServiceCode } from '../../services/chatbotIAAccessControl';
import { useAuth } from '../../contexts/AuthContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import QuickActions from './QuickActions';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggested_links?: Array<{ label: string; page: string }>;
  navigationIntent?: NavigationIntent;
  showNavigationConfirmation?: boolean;
  navigationAlternatives?: NavigationIntent[];
  actionButtons?: Array<{
    label: string;
    action: string;
    variant: 'primary' | 'secondary';
  }>;
}

interface ChatbotWindowProps {
  settings: ChatbotSettings;
  style: ChatbotStyle | null;
  onClose: () => void;
  onNavigate?: (page: string) => void;
}

export default function ChatbotWindow({ settings, style, onClose, onNavigate }: ChatbotWindowProps) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random()}`);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [enhancedUserContext, setEnhancedUserContext] = useState<EnhancedUserContext | null>(null);
  const [iconAnimation, setIconAnimation] = useState<string>('animate-chatbot-wave');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      await loadQuickActions();
      await loadUserContext();
    };
    init();
  }, [user, profile]);

  useEffect(() => {
    const animations = ['animate-chatbot-wave', 'animate-chatbot-bounce', 'animate-chatbot-excited'];
    let currentIndex = 0;

    const animationInterval = setInterval(() => {
      currentIndex = (currentIndex + 1) % animations.length;
      setIconAnimation(animations[currentIndex]);
    }, 4000);

    return () => clearInterval(animationInterval);
  }, []);

  useEffect(() => {
    if (userContext !== null || !user || !settings.enable_premium_detection) {
      displayWelcomeMessage();
    }
  }, [userContext]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadUserContext = async () => {
    if (user && settings.enable_premium_detection) {
      const context = await ChatbotService.getUserContext(user.id);
      setUserContext(context);

      const enhanced = await ChatbotIAAccessControl.buildEnhancedUserContext(
        user.id,
        profile
      );
      setEnhancedUserContext(enhanced);
    } else if (user) {
      const enhanced = await ChatbotIAAccessControl.buildEnhancedUserContext(
        user.id,
        profile
      );
      setEnhancedUserContext(enhanced);
    }
  };

  const displayWelcomeMessage = () => {
    if (userContext?.is_premium && settings.premium_welcome_message) {
      addBotMessage(settings.premium_welcome_message);
    } else {
      addBotMessage(settings.welcome_message);
    }
  };

  const loadQuickActions = async () => {
    if (settings.show_quick_actions) {
      const actions = await ChatbotService.getQuickActions();
      setQuickActions(actions);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addBotMessage = (
    content: string,
    suggested_links?: Array<{ label: string; page: string }>,
    navigationIntent?: NavigationIntent,
    showNavigationConfirmation?: boolean,
    navigationAlternatives?: NavigationIntent[],
    actionButtons?: Array<{
      label: string;
      action: string;
      variant: 'primary' | 'secondary';
    }>
  ) => {
    const botMessage: Message = {
      id: `bot-${Date.now()}`,
      type: 'bot',
      content,
      timestamp: new Date(),
      suggested_links,
      navigationIntent,
      showNavigationConfirmation,
      navigationAlternatives,
      actionButtons
    };
    setMessages(prev => [...prev, botMessage]);
  };

  const getUserNavigationContext = (): UserNavigationContext => {
    return {
      isAuthenticated: !!user,
      isPremium: userContext?.is_premium || false,
      isAdmin: user?.user_metadata?.user_type === 'admin' || false,
      userType: user?.user_metadata?.user_type || null
    };
  };

  const addUserMessage = (content: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    addUserMessage(message);
    setLoading(true);

    try {
      const hasNavigationKeywords = ChatbotNavigationService.hasNavigationIntent(message);

      if (hasNavigationKeywords) {
        const navContext = getUserNavigationContext();
        const detectionResult = ChatbotNavigationService.detectNavigationIntent(message, navContext);

        if (detectionResult.intent && detectionResult.confidence >= 0.3) {
          const navigationResponse = ChatbotNavigationService.generateNavigationResponse(
            detectionResult,
            navContext
          );

          setTimeout(() => {
            addBotMessage(
              navigationResponse.message,
              undefined,
              navigationResponse.intent || undefined,
              navigationResponse.showConfirmation,
              navigationResponse.alternatives
            );
            setLoading(false);
          }, 500);
          return;
        }
      }

      const response = await ChatbotService.askChatbot(
        message,
        user?.id || null,
        window.location.pathname,
        sessionId
      );

      if (response.success) {
        setTimeout(() => {
          addBotMessage(response.answer, response.suggested_links);
          setLoading(false);
        }, 500);
      } else {
        setTimeout(() => {
          addBotMessage('Désolé, une erreur est survenue. Veuillez réessayer.');
          setLoading(false);
        }, 500);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setTimeout(() => {
        addBotMessage('Désolé, je n\'ai pas pu traiter votre demande.');
        setLoading(false);
      }, 500);
    }
  };

  const handleNavigationConfirm = async (intent: NavigationIntent) => {
    const isIAService = ChatbotNavigationService.isIAServiceIntent(intent);

    if (isIAService && enhancedUserContext) {
      const serviceCode = ChatbotNavigationService.getIAServiceCode(intent);

      if (serviceCode) {
        const accessResult = await ChatbotIAAccessControl.checkIAAccess(
          serviceCode as ServiceCode,
          enhancedUserContext
        );

        if (!accessResult.allowed) {
          const formattedMessage = ChatbotIAAccessControl.formatAccessMessage(accessResult);
          const actionButtons = ChatbotIAAccessControl.getActionButtons(accessResult);

          addBotMessage(
            formattedMessage,
            undefined,
            undefined,
            false,
            undefined,
            actionButtons.length > 0 ? actionButtons : undefined
          );
          return;
        }
      }
    }

    if (onNavigate) {
      onNavigate(intent.route);
      addBotMessage(`✓ Je vous ai dirigé vers ${intent.displayName}.`);
    }
  };

  const handleNavigationCancel = () => {
    addBotMessage('D\'accord, je reste à votre disposition pour d\'autres questions.');
  };

  const handleQuickAction = (action: QuickAction) => {
    if (action.action_type === 'open_route' && onNavigate) {
      const page = action.action_payload.page;
      onNavigate(page);
      onClose();
    }
  };

  const position = settings.position === 'bottom-left' ? 'left-4' : 'right-4';
  const shadow = style?.shadow_strength === 'strong' ? 'shadow-2xl' : style?.shadow_strength === 'soft' ? 'shadow-lg' : 'shadow-md';

  return (
    <div
      className={`fixed bottom-24 ${position} w-96 h-[600px] bg-white rounded-2xl ${shadow} flex flex-col overflow-hidden z-40 animate-slide-up`}
      style={{
        backgroundColor: style?.background_color || '#FFFFFF',
        borderRadius: `${style?.border_radius || 12}px`
      }}
    >
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{
          backgroundColor: style?.primary_color || '#3B82F6',
          color: '#FFFFFF'
        }}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <div className={`w-10 h-10 rounded-full bg-white/20 flex items-center justify-center ${iconAnimation}`}>
              <span className="text-xl">🤖</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-status-pulse"></div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white">Assistant JobGuinée</h3>
              {userContext?.is_premium && settings.enable_premium_detection && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500 text-yellow-900 text-xs font-bold rounded-full">
                  <Crown className="w-3 h-3" />
                  {settings.premium_badge_text || 'PRO+'}
                </span>
              )}
            </div>
            <p className="text-xs text-white/80 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              En ligne
            </p>
            {userContext && settings.enable_premium_detection && (
              <div className="flex items-center gap-3 mt-1 text-xs text-white/70">
                {settings.show_credits_balance && (
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {userContext.credits_balance} crédits
                  </span>
                )}
                {settings.show_premium_expiration && userContext.is_premium && userContext.remaining_days !== undefined && (
                  <span>
                    {userContext.remaining_days}j restants
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {settings.show_quick_actions && quickActions.length > 0 && messages.length <= 1 && (
        <div className="p-3 border-b bg-gray-50">
          <QuickActions actions={quickActions} onAction={handleQuickAction} />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            style={style}
            onNavigate={onNavigate}
            onClose={onClose}
            onNavigationConfirm={handleNavigationConfirm}
            onNavigationCancel={handleNavigationCancel}
          />
        ))}

        {loading && (
          <div className="flex items-center gap-2">
            <div
              className="px-4 py-3 rounded-2xl inline-block"
              style={{
                backgroundColor: style?.bubble_color_bot || '#F3F4F6',
                color: style?.text_color || '#1F2937'
              }}
            >
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}

        {!userContext?.is_premium && settings.show_premium_benefits && messages.length > 2 && settings.premium_upsell_message && (
          <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-1">Passez Premium PRO+</h4>
                <p className="text-sm text-gray-700 mb-3">{settings.premium_upsell_message}</p>
                <button
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('premium-subscribe');
                      onClose();
                    }
                  }}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
                >
                  Découvrir Premium PRO+
                </button>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t bg-gray-50">
        <ChatInput onSendMessage={handleSendMessage} disabled={loading} style={style} />
      </div>
    </div>
  );
}
