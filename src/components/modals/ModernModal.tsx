import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

export type ModalType = 'success' | 'error' | 'warning' | 'info';

interface ModernModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string | ReactNode;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
  pedagogical?: boolean;
  icon?: ReactNode;
}

const typeConfig = {
  success: {
    bgGradient: 'from-green-50 to-emerald-50',
    borderColor: 'border-green-200',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    buttonBg: 'bg-green-600 hover:bg-green-700',
    Icon: CheckCircle,
  },
  error: {
    bgGradient: 'from-red-50 to-rose-50',
    borderColor: 'border-red-200',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    buttonBg: 'bg-red-600 hover:bg-red-700',
    Icon: AlertCircle,
  },
  warning: {
    bgGradient: 'from-amber-50 to-yellow-50',
    borderColor: 'border-amber-200',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    buttonBg: 'bg-amber-600 hover:bg-amber-700',
    Icon: AlertTriangle,
  },
  info: {
    bgGradient: 'from-blue-50 to-cyan-50',
    borderColor: 'border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    buttonBg: 'bg-blue-600 hover:bg-blue-700',
    Icon: Info,
  },
};

export default function ModernModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Annuler',
  onConfirm,
  showCancel = false,
  pedagogical = true,
  icon,
}: ModernModalProps) {
  const config = typeConfig[type];
  const IconComponent = config.Icon;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 animate-fadeIn"
      style={{ zIndex: 10000 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div
        className={`relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-slideUp ${
          pedagogical ? 'border-2 ' + config.borderColor : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {pedagogical && (
          <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 ${config.iconBg} rounded-full p-4 shadow-lg border-4 border-white`}>
            {icon || <IconComponent className={`w-8 h-8 ${config.iconColor}`} />}
          </div>
        )}

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        <div className={`p-6 ${pedagogical ? 'pt-12' : 'pt-6'}`}>
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
            <div className="text-gray-600 leading-relaxed">
              {typeof message === 'string' ? (
                <p className="whitespace-pre-line">{message}</p>
              ) : (
                message
              )}
            </div>
          </div>

          {pedagogical && type === 'warning' && (
            <div className={`mb-6 p-4 rounded-xl bg-gradient-to-br ${config.bgGradient} border ${config.borderColor}`}>
              <p className="text-sm text-gray-700">
                💡 <strong>Conseil:</strong> Prenez un moment pour lire attentivement ce message avant de continuer.
              </p>
            </div>
          )}

          <div className={`flex gap-3 ${showCancel ? 'justify-end' : 'justify-center'}`}>
            {showCancel && (
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors min-w-[120px]"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={handleConfirm}
              className={`px-6 py-3 rounded-xl text-white font-semibold transition-all transform hover:scale-105 shadow-lg ${config.buttonBg} min-w-[120px]`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, modalRoot);
}
