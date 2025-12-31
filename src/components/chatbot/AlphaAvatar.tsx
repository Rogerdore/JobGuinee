import React, { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  proactiveMessage = "👋 Bonjour ! Je suis Alpha. Besoin d'aide pour un CV, un emploi ou un service IA ?",
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
      <motion.div
        ref={avatarRef}
        className={`${sizeClasses[size]} relative cursor-pointer`}
        animate={getAnimationVariants()}
        whileHover={state === 'idle' || state === 'attention' ? { scale: 1.1 } : {}}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={onClick}
        style={{
          filter: `drop-shadow(0 0 ${isHovered ? '20px' : '10px'} ${getGlowColor()})`
        }}
      >
        <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
          <img
            src="/alpha-avatar.png"
            alt="Alpha - Assistant intelligent"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
              if (fallback) {
                (fallback as HTMLElement).style.display = 'flex';
              }
            }}
          />

          <div className="fallback-icon hidden absolute inset-0 items-center justify-center bg-gradient-to-br from-[#0E2F56] to-[#1a4a7e]">
            <MessageCircle className="w-1/2 h-1/2 text-white" />
          </div>

          {blinkEyes && (
            <motion.div
              className="absolute inset-0 bg-[#0E2F56] opacity-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
          )}
        </div>

        {(state === 'responding' || state === 'listening') && (
          <motion.div
            className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#06B6D4] rounded-full border-2 border-white"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [1, 0.7, 1]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )}

        {state === 'success' && (
          <motion.div
            className="absolute -top-2 -right-2 text-2xl"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 10 }}
          >
            🎉
          </motion.div>
        )}

        {state === 'error' && (
          <motion.div
            className="absolute -top-2 -right-2 text-2xl"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 10 }}
          >
            😊
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {showProactiveMessage && (state === 'attention' || state === 'idle') && (
          <motion.div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 z-50"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="relative bg-white border-2 border-[#0E2F56] rounded-2xl px-4 py-3 shadow-xl">
              <p className="text-sm text-slate-800 font-medium leading-relaxed">
                {proactiveMessage}
              </p>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-2 border-b-2 border-[#0E2F56] rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
