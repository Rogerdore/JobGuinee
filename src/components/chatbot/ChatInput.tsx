import React, { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { ChatbotStyle } from '../../services/chatbotService';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  style: ChatbotStyle | null;
}

export default function ChatInput({ onSendMessage, disabled, style }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Écrivez votre message..."
        disabled={disabled}
        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          focusRing: style?.primary_color || '#3B82F6'
        }}
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !message.trim()}
        className="p-3 rounded-xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
        style={{
          backgroundColor: style?.primary_color || '#3B82F6'
        }}
        aria-label="Envoyer"
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  );
}
