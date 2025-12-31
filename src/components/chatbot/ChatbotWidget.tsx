import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { ChatbotService, ChatbotSettings, ChatbotStyle } from '../../services/chatbotService';
import ChatbotWindow from './ChatbotWindow';
import AlphaIcon from './AlphaIcon';

interface ChatbotWidgetProps {
  onNavigate?: (page: string) => void;
}

export default function ChatbotWidget({ onNavigate }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<ChatbotSettings | null>(null);
  const [style, setStyle] = useState<ChatbotStyle | null>(null);
  const [loading, setLoading] = useState(true);
  const [widgetAnimation, setWidgetAnimation] = useState<string>('animate-chatbot-bounce');

  useEffect(() => {
    loadConfiguration();
  }, []);

  useEffect(() => {
    if (isOpen) return;

    const animations = ['animate-chatbot-bounce', 'animate-chatbot-wave', 'animate-chatbot-excited'];
    let currentIndex = 0;

    const animationInterval = setInterval(() => {
      currentIndex = (currentIndex + 1) % animations.length;
      setWidgetAnimation(animations[currentIndex]);
    }, 3500);

    return () => clearInterval(animationInterval);
  }, [isOpen]);

  const loadConfiguration = async () => {
    setLoading(true);
    try {
      const [settingsData, styleData] = await Promise.all([
        ChatbotService.getSettings(),
        ChatbotService.getDefaultStyle()
      ]);

      setSettings(settingsData);
      setStyle(styleData);
    } catch (error) {
      console.error('Error loading chatbot configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !settings || !settings.is_enabled) {
    return null;
  }

  const widgetSize = style?.widget_size === 'small' ? 'w-14 h-14' : style?.widget_size === 'large' ? 'w-20 h-20' : 'w-16 h-16';
  const position = settings.position === 'bottom-left' ? 'left-4' : 'right-4';
  const animation = style?.animation_type === 'fade' ? 'animate-fade-in' : style?.animation_type === 'scale' ? 'animate-scale-in' : 'animate-slide-up';
  const shadow = style?.shadow_strength === 'strong' ? 'shadow-2xl' : style?.shadow_strength === 'soft' ? 'shadow-lg' : '';

  return (
    <>
      <div
        className={`fixed bottom-4 ${position} z-50 ${animation}`}
        style={{
          animationDelay: '0.5s'
        }}
      >
        {!isOpen ? (
          <div className="relative group">
            <button
              onClick={() => setIsOpen(true)}
              className={`${widgetSize} rounded-full hover:scale-110 transition-all duration-300 flex items-center justify-center ${widgetAnimation} neo-clay relative overflow-hidden`}
              style={{
                background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                boxShadow: '0 10px 40px rgba(6, 182, 212, 0.3)'
              }}
              aria-label="Discuter avec Alpha"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <AlphaIcon state="greeting" size={parseInt(widgetSize.split('-')[1]) * 0.6 || 32} className="relative z-10" />
            </button>
            <div className="absolute top-0 right-0 w-4 h-4 rounded-full border-2 border-white animate-status-pulse shadow-lg z-20" style={{ backgroundColor: '#06B6D4' }}></div>

            <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
              <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-xl">
                Besoin d'aide ? 💬
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsOpen(false)}
            className={`${widgetSize} rounded-full ${shadow} hover:scale-110 transition-transform duration-300 flex items-center justify-center`}
            style={{
              backgroundColor: style?.secondary_color || '#1E40AF'
            }}
            aria-label="Fermer le chatbot"
          >
            <X className="w-1/2 h-1/2 text-white" />
          </button>
        )}
      </div>

      {isOpen && (
        <ChatbotWindow
          settings={settings}
          style={style}
          onClose={() => setIsOpen(false)}
          onNavigate={onNavigate}
        />
      )}
    </>
  );
}
