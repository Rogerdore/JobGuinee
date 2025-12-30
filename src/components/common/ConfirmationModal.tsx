import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'warning' | 'info';
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  primaryAction,
  secondaryAction
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const icons = {
    success: <CheckCircle className="w-16 h-16 text-green-500" />,
    warning: <AlertCircle className="w-16 h-16 text-orange-500" />,
    info: <Info className="w-16 h-16 text-blue-500" />
  };

  const bgColors = {
    success: 'bg-green-50',
    warning: 'bg-orange-50',
    info: 'bg-blue-50'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className={`px-6 pt-8 pb-6 ${bgColors[type]}`}>
            <div className="flex justify-center mb-4">
              {icons[type]}
            </div>
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-center text-gray-600 leading-relaxed">
              {message}
            </p>
          </div>

          <div className="bg-white px-6 py-4 space-y-3">
            {primaryAction && (
              <button
                onClick={primaryAction.onClick}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold shadow-md hover:shadow-lg"
              >
                {primaryAction.label}
              </button>
            )}
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                className="w-full px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                {secondaryAction.label}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
