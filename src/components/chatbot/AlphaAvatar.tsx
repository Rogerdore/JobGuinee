import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle } from 'lucide-react';

export type AlphaAvatarState =
  | 'idle'
  | 'attention'
  | 'hover'
  | 'opening'
  | 'listening'
  | 'responding'
  | 'success'
  | 'error';

interface AlphaAvatarProps {
  state?: AlphaAvatarState;
  onClick?: () => void;
  showProactiveMessage?: boolean;
  proactiveMessage?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function AlphaAvatar({
  state = 'idle',
  onClick,
  showProactiveMessage = false,
  proactiveMessage = "Bonjour! Je suis Alpha, l'assistant virtuel JobGuinee. Besoin d'aide? Je suis là pour vous.",
  size = 'large',
  className = ''
}: AlphaAvatarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [blinkEyes, setBlinkEyes] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);
  const avatarRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-20 h-20',
    large: 'w-24 h-24'
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const blinkInterval = setInterval(() => {
      setBlinkEyes(true);
      setTimeout(() => setBlinkEyes(false), 150);
    }, 6000 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, [isVisible]);

  useEffect(() => {
    if (!isHovered) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!avatarRef.current) return;
      const rect = avatarRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      setCursorPosition({
        x: (e.clientX - centerX) / 20,
        y: (e.clientY - centerY) / 20
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isHovered]);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const getAnimationVariants = () => {
    if (prefersReducedMotion || !isVisible) {
      return {};
    }

    switch (state) {
      case 'idle':
        return {
          scale: [1, 1.02, 1],
          rotate: [-1, 1, -1],
          transition: {
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut'
          }
        };

      case 'attention':
        return {
          scale: [1, 1.05, 1, 1.05, 1],
          rotate: [0, -5, 5, -5, 0],
          y: [0, -5, 0, -5, 0],
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }
        };

      case 'hover':
        return {
          scale: 1.08,
          rotate: cursorPosition.x * 0.5,
          transition: {
            duration: 0.3,
            ease: 'easeOut'
          }
        };

      case 'opening':
        return {
          scale: [1, 1.2, 0.9, 1],
          rotate: [0, 10, -10, 0],
          transition: {
            duration: 0.6,
            ease: 'easeInOut'
          }
        };

      case 'listening':
        return {
          scale: 1,
          rotate: 3,
          transition: {
            duration: 0.3,
            ease: 'easeOut'
          }
        };

      case 'responding':
        return {
          y: [0, -3, 0],
          transition: {
            duration: 0.8,
            repeat: Infinity,
            ease: 'easeInOut'
          }
        };

      case 'success':
        return {
          scale: [1, 1.2, 1],
          rotate: [0, 360],
          y: [0, -20, 0],
          transition: {
            duration: 0.8,
            ease: 'easeOut'
          }
        };

      case 'error':
        return {
          x: [-5, 5, -5, 5, 0],
          transition: {
            duration: 0.5,
            ease: 'easeInOut'
          }
        };

      default:
        return {};
    }
  };

  const getGlowColor = () => {
    switch (state) {
      case 'success':
        return 'rgba(34, 197, 94, 0.5)';
      case 'error':
        return 'rgba(239, 68, 68, 0.5)';
      case 'attention':
        return 'rgba(255, 140, 0, 0.5)';
      case 'responding':
        return 'rgba(6, 182, 212, 0.5)';
      default:
        return 'rgba(14, 47, 86, 0.3)';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={avatarRef}
        className={`${sizeClasses[size]} relative cursor-pointer transition-transform hover:scale-110`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        style={{
          filter: `drop-shadow(0 0 ${isHovered ? '20px' : '10px'} ${getGlowColor()})`
        }}
      >
        {/* Orange glowing ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            padding: '4px',
            background: 'linear-gradient(45deg, rgba(255, 140, 0, 0.6), rgba(255, 165, 0, 0.4), rgba(255, 140, 0, 0.6))',
            animation: 'orange-pulse 3s ease-in-out infinite',
            boxShadow: '0 0 20px rgba(255, 140, 0, 0.5), 0 0 40px rgba(255, 140, 0, 0.3)',
          }}
        >
          <div className="w-full h-full rounded-full bg-transparent" />
        </div>

        <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-[#0E2F56] to-[#1a4a7e] flex items-center justify-center shadow-lg p-1">
          <img
            src="/avatar_alpha_gif.gif"
            alt="Alpha Avatar"
            className="w-full h-full object-contain rounded-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.parentElement?.querySelector('.fallback-icon');
              if (fallback) {
                (fallback as HTMLElement).style.display = 'block';
              }
            }}
          />
          <MessageCircle className="fallback-icon w-10 h-10 text-white hidden absolute" strokeWidth={2} />

          {blinkEyes && (
            <div className="absolute inset-0 bg-[#0E2F56] opacity-30" />
          )}
        </div>

        {(state === 'responding' || state === 'listening') && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#06B6D4] rounded-full border-2 border-white animate-pulse" />
        )}

        {state === 'success' && (
          <div className="absolute -top-2 -right-2 text-2xl">
            🎉
          </div>
        )}

        {state === 'error' && (
          <div className="absolute -top-2 -right-2 text-2xl">
            😊
          </div>
        )}
      </div>

      {showProactiveMessage && (state === 'attention' || state === 'idle') && (
        <div className="absolute -top-24 right-0 w-64 z-50 animate-fade-in">
          <div className="relative bg-white/50 backdrop-blur-sm border-2 border-[#0E2F56]/50 rounded-2xl px-4 py-3 shadow-xl">
            <p className="text-sm text-slate-800 font-medium leading-relaxed">
              {proactiveMessage}
            </p>
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white/50 border-r-2 border-b-2 border-[#0E2F56]/50 rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
}
