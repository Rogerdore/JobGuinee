import React from 'react';
import AlphaIcon from './AlphaIcon';

interface TypingIndicatorProps {
  showAvatar?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function TypingIndicator({ showAvatar = true, size = 'medium' }: TypingIndicatorProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'gap-1';
      case 'large':
        return 'gap-3';
      default:
        return 'gap-2';
    }
  };

  const getDotSize = () => {
    switch (size) {
      case 'small':
        return 'w-2 h-2';
      case 'large':
        return 'w-4 h-4';
      default:
        return 'w-3 h-3';
    }
  };

  const getAvatarSize = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'large':
        return 40;
      default:
        return 32;
    }
  };

  return (
    <div className={`flex items-center ${getSizeClasses()}`}>
      {showAvatar && (
        <AlphaIcon state="thinking" size={getAvatarSize()} />
      )}
      <div className="flex items-center gap-1">
        <div
          className={`${getDotSize()} rounded-full bg-cyan-500 animate-typing-dot`}
          style={{ animationDelay: '0ms' }}
        />
        <div
          className={`${getDotSize()} rounded-full bg-cyan-500 animate-typing-dot`}
          style={{ animationDelay: '200ms' }}
        />
        <div
          className={`${getDotSize()} rounded-full bg-cyan-500 animate-typing-dot`}
          style={{ animationDelay: '400ms' }}
        />
      </div>
    </div>
  );
}
