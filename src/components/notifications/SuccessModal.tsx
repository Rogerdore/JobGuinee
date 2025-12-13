import { CheckCircle, X, Info, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'error';
  autoClose?: boolean;
  autoCloseDelay?: number;
  actionLabel?: string;
  onAction?: () => void;
}

export default function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'success',
  autoClose = true,
  autoCloseDelay = 3000,
  actionLabel = 'OK',
  onAction
}: SuccessModalProps) {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      titleColor: 'text-green-900',
      messageColor: 'text-green-700',
      buttonBg: 'bg-green-600 hover:bg-green-700',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900',
      messageColor: 'text-blue-700',
      buttonBg: 'bg-blue-600 hover:bg-blue-700',
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      titleColor: 'text-red-900',
      messageColor: 'text-red-700',
      buttonBg: 'bg-red-600 hover:bg-red-700',
    },
  };

  const { icon: Icon, bgColor, borderColor, iconBg, iconColor, titleColor, messageColor, buttonBg } = config[type];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${bgColor} ${borderColor} border rounded-t-2xl p-6`}>
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-12 h-12 ${iconBg} rounded-full flex items-center justify-center`}>
              <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-lg font-bold ${titleColor} mb-1`}>{title}</h3>
              <p className={`text-sm ${messageColor} leading-relaxed`}>{message}</p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 bg-white rounded-b-2xl">
          <button
            onClick={handleAction}
            className={`w-full px-4 py-2.5 ${buttonBg} text-white font-medium rounded-lg transition shadow-sm hover:shadow`}
          >
            {actionLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
