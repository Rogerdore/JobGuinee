import React from 'react';
import { ExternalLink } from 'lucide-react';
import { ChatbotStyle } from '../../services/chatbotService';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggested_links?: Array<{ label: string; page: string }>;
}

interface ChatMessageProps {
  message: Message;
  style: ChatbotStyle | null;
  onNavigate?: (page: string) => void;
  onClose?: () => void;
}

export default function ChatMessage({ message, style, onNavigate, onClose }: ChatMessageProps) {
  const isUser = message.type === 'user';

  const handleLinkClick = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
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

        <p className="text-xs text-gray-400 mt-1 px-1">
          {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
