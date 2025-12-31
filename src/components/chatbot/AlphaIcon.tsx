import React, { useState, useEffect } from 'react';

export type AlphaIconState = 'idle' | 'greeting' | 'thinking' | 'happy' | 'speaking' | 'impatient' | 'success' | 'blocked';

interface AlphaIconProps {
  state?: AlphaIconState;
  size?: number;
  className?: string;
}

export default function AlphaIcon({ state = 'idle', size = 48, className = '' }: AlphaIconProps) {
  const [eyesBlink, setEyesBlink] = useState(false);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setEyesBlink(true);
      setTimeout(() => setEyesBlink(false), 150);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  const getAnimationClass = () => {
    switch (state) {
      case 'greeting':
        return 'animate-chatbot-wave';
      case 'thinking':
        return 'animate-pulse';
      case 'happy':
        return 'animate-chatbot-bounce';
      case 'speaking':
        return 'animate-chatbot-excited';
      case 'impatient':
        return 'animate-chatbot-excited';
      case 'success':
        return 'animate-chatbot-success';
      case 'blocked':
        return '';
      default:
        return '';
    }
  };

  const getArmRotation = () => {
    switch (state) {
      case 'greeting':
        return 'rotate-12';
      case 'happy':
        return 'rotate-6';
      case 'impatient':
        return '-rotate-6';
      default:
        return 'rotate-0';
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${getAnimationClass()} ${className}`}
      style={{ transformOrigin: 'center' }}
    >
      <g id="alpha-avatar">
        <circle cx="50" cy="40" r="20" fill="#1E293B" />

        <circle cx="50" cy="40" r="18" fill="#334155" />

        <rect x="35" y="50" width="30" height="35" rx="4" fill="#0F172A" />

        <rect x="38" y="54" width="24" height="28" rx="2" fill="#1E293B" />

        <line x1="50" y1="54" x2="50" y2="78" stroke="#1E40AF" strokeWidth="1" />

        <g id="left-arm" className={`transition-transform duration-300 ${getArmRotation()}`} style={{ transformOrigin: '35px 58px' }}>
          <line x1="35" y1="58" x2="28" y2="70" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
          <circle cx="28" cy="72" r="3" fill="#334155" />
        </g>

        <g id="right-arm" className={`transition-transform duration-300 ${state === 'success' ? 'rotate-45' : ''}`} style={{ transformOrigin: '65px 58px' }}>
          <line x1="65" y1="58" x2="72" y2="70" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
          <circle cx="72" cy="72" r="3" fill="#334155" />
          {state === 'success' && (
            <text x="74" y="68" fontSize="12" fill="#06B6D4">👍</text>
          )}
        </g>

        <g id="legs">
          <line x1="44" y1="85" x2="42" y2="95" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
          <line x1="56" y1="85" x2="58" y2="95" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
        </g>

        <g id="tie">
          <polygon points="50,54 46,60 50,68 54,60" fill="#06B6D4" />
        </g>

        <g id="eyes">
          {!eyesBlink ? (
            <>
              <circle cx="44" cy="38" r="3" fill="#1E293B" />
              <circle cx="56" cy="38" r="3" fill="#1E293B" />
              <circle cx="45" cy="37" r="1" fill="#FFFFFF" />
              <circle cx="57" cy="37" r="1" fill="#FFFFFF" />
            </>
          ) : (
            <>
              <line x1="41" y1="38" x2="47" y2="38" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
              <line x1="53" y1="38" x2="59" y2="38" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
            </>
          )}
        </g>

        <g id="mouth">
          {state === 'happy' || state === 'greeting' ? (
            <path d="M 42 45 Q 50 50 58 45" stroke="#1E293B" strokeWidth="2" fill="none" strokeLinecap="round" />
          ) : state === 'thinking' ? (
            <ellipse cx="50" cy="46" rx="4" ry="2" fill="#1E293B" />
          ) : state === 'speaking' ? (
            <ellipse cx="50" cy="46" rx="5" ry="4" fill="#1E293B" />
          ) : state === 'impatient' ? (
            <line x1="42" y1="46" x2="58" y2="46" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <path d="M 44 46 Q 50 48 56 46" stroke="#1E293B" strokeWidth="2" fill="none" strokeLinecap="round" />
          )}
        </g>

        {state === 'thinking' && (
          <g id="thought-bubbles" className="animate-float">
            <circle cx="70" cy="25" r="3" fill="#94A3B8" opacity="0.7" />
            <circle cx="75" cy="20" r="4" fill="#94A3B8" opacity="0.5" />
            <circle cx="80" cy="15" r="5" fill="#94A3B8" opacity="0.3" />
          </g>
        )}

        {state === 'speaking' && (
          <g id="speech-indicators" className="animate-pulse">
            <circle cx="72" cy="35" r="2" fill="#06B6D4" opacity="0.8">
              <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1s" repeatCount="indefinite" />
            </circle>
            <circle cx="77" cy="32" r="2" fill="#06B6D4" opacity="0.6">
              <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1s" begin="0.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="82" cy="29" r="2" fill="#06B6D4" opacity="0.4">
              <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1s" begin="0.4s" repeatCount="indefinite" />
            </circle>
          </g>
        )}

        {state === 'blocked' && (
          <g id="pause-gesture">
            <line x1="60" y1="55" x2="65" y2="65" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" />
            <text x="68" y="62" fontSize="10" fill="#06B6D4">✋</text>
          </g>
        )}
      </g>
    </svg>
  );
}
