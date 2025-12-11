import { useEffect, useState } from 'react';
import { CheckCircle, X, AlertCircle, Info, ShoppingCart } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastNotificationProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export default function ToastNotification({ toast, onClose }: ToastNotificationProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = toast.duration || 5000;
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-orange-600" />;
      case 'info':
        return <Info className="w-6 h-6 text-blue-600" />;
    }
  };

  const getColorClasses = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-white border-l-4 border-green-500 shadow-lg';
      case 'error':
        return 'bg-white border-l-4 border-red-500 shadow-lg';
      case 'warning':
        return 'bg-white border-l-4 border-orange-500 shadow-lg';
      case 'info':
        return 'bg-white border-l-4 border-blue-500 shadow-lg';
    }
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg ${getColorClasses()} transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}
      style={{ minWidth: '320px', maxWidth: '400px' }}
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-900 text-sm mb-1">{toast.title}</h4>
        <p className="text-sm text-gray-600 leading-relaxed">{toast.message}</p>
      </div>

      <button
        onClick={handleClose}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Fermer"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
