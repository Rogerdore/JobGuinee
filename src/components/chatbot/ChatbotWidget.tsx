import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { ChatbotService, ChatbotSettings, ChatbotStyle } from '../../services/chatbotService';
import ChatbotWindow from './ChatbotWindow';
import AlphaAvatar, { AlphaAvatarState } from './AlphaAvatar';

interface ChatbotWidgetProps {
  onNavigate?: (page: string) => void;
}

export default function ChatbotWidget({ onNavigate }: ChatbotWidgetProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<ChatbotSettings | null>(null);
  const [style, setStyle] = useState<ChatbotStyle | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarState, setAvatarState] = useState<AlphaAvatarState>('idle');
  const [showProactiveMessage, setShowProactiveMessage] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());

  // Protection contre insertBefore: montage différé avec requestAnimationFrame
  useEffect(() => {
    console.log('🚀 [ChatbotWidget] Initialisation du widget...');
    const rafId = requestAnimationFrame(() => {
      console.log('✅ [ChatbotWidget] Widget monté');
      setMounted(true);
    });
    return () => {
      console.log('🛑 [ChatbotWidget] Widget démonté');
      cancelAnimationFrame(rafId);
      setMounted(false);
    };
  }, []);

  useEffect(() => {
    if (mounted) {
      loadConfiguration();
    }
  }, [mounted]);

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
      console.log('🤖 [ChatbotWidget] Chargement de la configuration...');
      const [settingsData, styleData] = await Promise.all([
        ChatbotService.getSettings(),
        ChatbotService.getDefaultStyle()
      ]);

      console.log('🤖 [ChatbotWidget] Settings:', settingsData);
      console.log('🤖 [ChatbotWidget] Style:', styleData);

      if (settingsData?.is_enabled) {
        console.log('✅ [ChatbotWidget] Alpha Avatar chargé et activé');
      } else {
        console.warn('⚠️ [ChatbotWidget] Alpha Avatar désactivé dans les settings');
      }

      setSettings(settingsData);
      setStyle(styleData);
    } catch (error) {
      console.error('❌ [ChatbotWidget] Erreur:', error);
      // En cas d'erreur, désactiver le chatbot pour éviter le crash
      setSettings(null);
      setStyle(null);
    } finally {
      setLoading(false);
    }
  };

  // PROTECTION 1: Bloquer tout rendu avant montage complet
  if (!mounted) {
    return null;
  }

  if (loading) {
    return null;
  }

  if (!settings) {
    return null;
  }

  const avatarSize = style?.widget_size === 'small' ? 'small' : style?.widget_size === 'large' ? 'large' : 'medium';
  const position = settings.position === 'bottom-left' ? 'left-6' : 'right-6';
  const animation = style?.animation_type === 'fade' ? 'animate-fade-in' : style?.animation_type === 'scale' ? 'animate-scale-in' : 'animate-slide-up';

  const handleAvatarClick = () => {
    if (!settings.is_enabled) return;
    setIsOpen(true);
    setAvatarState('opening');
    setTimeout(() => setAvatarState('listening'), 600);
  };

  const handleClose = () => {
    setIsOpen(false);
    setAvatarState('idle');
  };

  const isEnabled = settings.is_enabled;

  // PROTECTION 2: Envelopper le rendu dans try/catch pour éviter tout crash
  try {
    return renderChatbot();
  } catch (error) {
    console.error('🚨 ChatBot Widget - Erreur critique bloquée:', error);
    return null;
  }

  function renderChatbot() {
    console.log('🎨 [ChatbotWidget] Rendu du chatbot - isEnabled:', isEnabled, 'position:', position);
    return (
    <>
      <div
        className={`fixed bottom-6 ${position} z-50 ${animation}`}
        style={{
          animationDelay: '0.5s',
          pointerEvents: 'auto'
        }}
      >
        {!isOpen ? (
          <div className="relative">
            <AlphaAvatar
              state={avatarState}
              size={avatarSize}
              onClick={handleAvatarClick}
              showProactiveMessage={showProactiveMessage && isEnabled}
              proactiveMessage="Bonjour! Je suis Alpha, l'assistant virtuel JobGuinee. Besoin d'aide? Je suis là pour vous."
            />
            <div
              className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${
                isEnabled ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{
                animation: isEnabled
                  ? 'status-pulse-green 2s ease-in-out infinite'
                  : 'status-pulse-red 2s ease-in-out infinite'
              }}
              title={isEnabled ? 'Alpha est en ligne' : 'Alpha est hors ligne'}
            />
          </div>
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

      {isOpen && isEnabled && (
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
}
