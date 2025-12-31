import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { ChatbotService, ChatbotSettings, ChatbotStyle } from '../../services/chatbotService';
import ChatbotWindow from './ChatbotWindow';
import AlphaAvatar, { AlphaAvatarState } from './AlphaAvatar';

interface ChatbotWidgetProps {
  onNavigate?: (page: string) => void;
}

export default function ChatbotWidget({ onNavigate }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<ChatbotSettings | null>(null);
  const [style, setStyle] = useState<ChatbotStyle | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarState, setAvatarState] = useState<AlphaAvatarState>('idle');
  const [showProactiveMessage, setShowProactiveMessage] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());

  useEffect(() => {
    loadConfiguration();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setAvatarState('idle');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setShowProactiveMessage(false);
      setAvatarState('opening');
      setTimeout(() => setAvatarState('listening'), 600);
      return;
    }

    const handleActivity = () => {
      setLastActivityTime(Date.now());
      setShowProactiveMessage(false);
      if (!isOpen) setAvatarState('idle');
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) return;

    const checkInactivity = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityTime;

      if (timeSinceActivity > 8000 && !showProactiveMessage) {
        setAvatarState('attention');
        setShowProactiveMessage(true);
      } else if (timeSinceActivity <= 8000) {
        setAvatarState('idle');
        setShowProactiveMessage(false);
      }
    }, 1000);

    return () => clearInterval(checkInactivity);
  }, [isOpen, lastActivityTime, showProactiveMessage]);

  const loadConfiguration = async () => {
    setLoading(true);
    try {
      const [settingsData, styleData] = await Promise.all([
        ChatbotService.getSettings(),
        ChatbotService.getDefaultStyle()
      ]);

      console.log('🤖 Alpha Avatar - Configuration chargée:', {
        settings: settingsData,
        style: styleData,
        enabled: settingsData?.is_enabled
      });

      setSettings(settingsData);
      setStyle(styleData);
    } catch (error) {
      console.error('❌ Alpha Avatar - Erreur chargement configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mode debug : afficher l'état pour diagnostic
  if (loading) {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm">
        Chargement...
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-red-500 text-white px-4 py-2 rounded-lg text-sm">
        Aucun paramètre
      </div>
    );
  }

  if (!settings.is_enabled) {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm">
        Chatbot désactivé
      </div>
    );
  }

  const avatarSize = style?.widget_size === 'small' ? 'small' : style?.widget_size === 'large' ? 'large' : 'medium';
  const position = settings.position === 'bottom-left' ? 'left-6' : 'right-6';
  const animation = style?.animation_type === 'fade' ? 'animate-fade-in' : style?.animation_type === 'scale' ? 'animate-scale-in' : 'animate-slide-up';

  const handleAvatarClick = () => {
    setIsOpen(true);
    setAvatarState('opening');
    setTimeout(() => setAvatarState('listening'), 600);
  };

  const handleClose = () => {
    setIsOpen(false);
    setAvatarState('idle');
  };

  return (
    <>
      <div
        className={`fixed bottom-6 ${position} z-50 ${animation}`}
        style={{
          animationDelay: '0.5s'
        }}
      >
        {!isOpen ? (
          <AlphaAvatar
            state={avatarState}
            size={avatarSize}
            onClick={handleAvatarClick}
            showProactiveMessage={showProactiveMessage}
            proactiveMessage="Bonjour! Je suis Alpha, l'assistant virtuel JobGuinee. Besoin d'aide? Je suis là pour vous."
          />
        ) : (
          <button
            onClick={handleClose}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
                e.preventDefault();
                handleClose();
              }
            }}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0E2F56] to-[#1a4a7e] hover:scale-110 transition-transform duration-300 flex items-center justify-center shadow-2xl hover:shadow-[#FF8C00]/30"
            aria-label="Fermer le chatbot Alpha"
            aria-expanded="true"
            title="Fermer (Échap)"
          >
            <X className="w-8 h-8 text-white" />
          </button>
        )}
      </div>

      {isOpen && (
        <ChatbotWindow
          settings={settings}
          style={style}
          onClose={handleClose}
          onNavigate={onNavigate}
        />
      )}
    </>
  );
}
