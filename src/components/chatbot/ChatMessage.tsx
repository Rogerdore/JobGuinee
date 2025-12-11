import React from 'react';
import { ExternalLink, Check, X, MapPin } from 'lucide-react';
import { ChatbotStyle } from '../../services/chatbotService';
import { NavigationIntent } from '../../services/navigationMap';

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

interface ChatMessageProps {
  message: Message;
  style: ChatbotStyle | null;
  onNavigate?: (page: string) => void;
  onClose?: () => void;
  onNavigationConfirm?: (intent: NavigationIntent) => void;
  onNavigationCancel?: () => void;
}

export default function ChatMessage({ message, style, onNavigate, onClose, onNavigationConfirm, onNavigationCancel }: ChatMessageProps) {
  const isUser = message.type === 'user';

  const handleLinkClick = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
      if (onClose) onClose();
    }
  };

  const handleNavigationConfirm = () => {
    if (message.navigationIntent && onNavigationConfirm) {
      onNavigationConfirm(message.navigationIntent);
      if (onClose) onClose();
    }
  };

  const handleNavigationCancel = () => {
    if (onNavigationCancel) {
      onNavigationCancel();
    }
  };

  const handleAlternativeNavigation = (intent: NavigationIntent) => {
    if (onNavigationConfirm) {
      onNavigationConfirm(intent);
      if (onClose) onClose();
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`px-4 py-3 rounded-2xl ${isUser ? 'rounded-br-none' : 'rounded-bl-none'}`}
          style={{
            backgroundColor: isUser
              ? (style?.bubble_color_user || '#3B82F6')
              : (style?.bubble_color_bot || '#F3F4F6'),
            color: isUser ? '#FFFFFF' : (style?.text_color || '#1F2937')
          }}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {!isUser && message.showNavigationConfirmation && message.navigationIntent && (
          <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">Navigation</span>
            </div>
            <p className="text-xs text-gray-600 mb-3">Voulez-vous ouvrir cette page ?</p>
            <div className="flex gap-2">
              <button
                onClick={handleNavigationConfirm}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Check className="w-4 h-4" />
                Oui, ouvrir
              </button>
              <button
                onClick={handleNavigationCancel}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <X className="w-4 h-4" />
                Non
              </button>
            </div>

            {message.navigationAlternatives && message.navigationAlternatives.length > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-gray-600 mb-2">Ou peut-être :</p>
                <div className="space-y-1">
                  {message.navigationAlternatives.map((alt, index) => (
                    <button
                      key={index}
                      onClick={() => handleAlternativeNavigation(alt)}
                      className="w-full text-left px-2 py-1.5 text-xs text-blue-700 hover:bg-blue-100 rounded transition-colors"
                    >
                      → {alt.displayName}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!isUser && message.suggested_links && message.suggested_links.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.suggested_links.map((link, index) => (
              <button
                key={index}
                onClick={() => handleLinkClick(link.page)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-sm w-full"
                style={{
                  borderColor: style?.primary_color + '40' || '#3B82F640'
                }}
              >
                <ExternalLink className="w-4 h-4" style={{ color: style?.primary_color || '#3B82F6' }} />
                <span className="font-medium" style={{ color: style?.primary_color || '#3B82F6' }}>
                  {link.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {!isUser && message.actionButtons && message.actionButtons.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.actionButtons.map((button, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  const parts = button.action.split(':');
                  const actionType = parts[0];
                  const actionValue = parts[1];

                  if (actionType === 'navigate') {
                    if (onNavigate) {
                      handleLinkClick(actionValue);
                    } else {
                      console.warn('onNavigate not provided to ChatMessage', { actionValue });
                    }
                  }
                }}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                  button.variant === 'primary'
                    ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400'
                }`}
              >
                {button.label}
              </button>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-1 px-1">
          {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
