import { AlertCircle, X } from 'lucide-react';
import { useEffect } from 'react';

interface ErrorListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  errors: string[];
  actionLabel?: string;
}

export default function ErrorListModal({
  isOpen,
  onClose,
  title = 'Veuillez corriger les erreurs suivantes',
  errors,
  actionLabel = 'OK',
}: ErrorListModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 border-b-2 border-red-200 rounded-t-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-red-900 mb-1">{title}</h3>
              <p className="text-sm text-red-700">
                {errors.length} {errors.length === 1 ? 'erreur détectée' : 'erreurs détectées'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error List */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <ul className="space-y-3">
            {errors.map((error, index) => (
              <li
                key={index}
                className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition"
              >
                <div className="flex-shrink-0 w-6 h-6 bg-red-200 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-red-700">{index + 1}</span>
                </div>
                <p className="flex-1 text-sm text-red-900 leading-relaxed">{error}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 rounded-b-2xl border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold rounded-xl transition shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {actionLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
}
