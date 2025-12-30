import { useEffect, useState } from 'react';
import { CheckCircle, Star, Sparkles } from 'lucide-react';

interface ConfettiCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  subMessage?: string;
}

export default function ConfettiCelebration({
  isOpen,
  onClose,
  message = 'Félicitations !',
  subMessage = 'Votre profil est complet à 100%',
}: ConfettiCelebrationProps) {
  const [confettiPieces, setConfettiPieces] = useState<Array<{
    id: number;
    left: number;
    delay: number;
    duration: number;
    color: string;
    rotation: number;
  }>>([]);

  useEffect(() => {
    if (isOpen) {
      const pieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'][Math.floor(Math.random() * 6)],
        rotation: Math.random() * 360,
      }));
      setConfettiPieces(pieces);

      const timer = setTimeout(() => {
        onClose();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
      <div className="relative">
        {confettiPieces.map((piece) => (
          <div
            key={piece.id}
            className="absolute top-0 w-3 h-3 animate-confetti-fall"
            style={{
              left: `${piece.left}vw`,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              backgroundColor: piece.color,
              transform: `rotate(${piece.rotation}deg)`,
            }}
          />
        ))}

        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform animate-bounce-in">
          <div className="text-center">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 animate-ping">
                <div className="w-20 h-20 bg-green-400 rounded-full opacity-75"></div>
              </div>
              <div className="relative bg-gradient-to-br from-green-400 to-green-600 rounded-full p-5 shadow-lg">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 animate-pulse">
                <Star className="w-6 h-6 text-yellow-400 fill-current" />
              </div>
              <div className="absolute -bottom-2 -left-2 animate-pulse delay-100">
                <Sparkles className="w-6 h-6 text-blue-400 fill-current" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2 animate-fade-in">
              {message}
            </h2>

            <p className="text-xl text-gray-700 mb-4 animate-fade-in animation-delay-200">
              {subMessage}
            </p>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-6 animate-fade-in animation-delay-300">
              <p className="text-sm text-gray-800 font-medium">
                Votre profil est maintenant 3x plus visible par les recruteurs !
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Vous avez débloqué toutes les fonctionnalités premium de JobGuinée
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-6 animate-fade-in animation-delay-400">
              {['Candidatures externes', 'Services IA', 'CVthèque Premium'].map((feature, index) => (
                <span
                  key={feature}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold animate-fade-in"
                  style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                >
                  ✓ {feature}
                </span>
              ))}
            </div>

            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition transform hover:scale-105 shadow-lg animate-fade-in animation-delay-500"
            >
              Continuer
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes bounce-in {
          0% {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.1) rotate(10deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-confetti-fall {
          animation: confetti-fall linear forwards;
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
          opacity: 0;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-300 {
          animation-delay: 0.3s;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
        }

        .animation-delay-500 {
          animation-delay: 0.5s;
        }

        .delay-100 {
          animation-delay: 0.1s;
        }
      `}</style>
    </div>
  );
}
