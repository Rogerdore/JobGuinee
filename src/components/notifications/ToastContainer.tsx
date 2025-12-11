import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ToastNotification, { ToastMessage, ToastType } from './ToastNotification';

interface ToastContextType {
  showToast: (type: ToastType, title: string, message: string, duration?: number) => void;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (type: ToastType, title: string, message: string, duration = 5000) => {
      const id = Date.now().toString() + Math.random().toString(36);
      const newToast: ToastMessage = { id, type, title, message, duration };
      setToasts((prev) => [...prev, newToast]);
    },
    []
  );

  const showSuccess = useCallback(
    (title: string, message: string) => showToast('success', title, message),
    [showToast]
  );

  const showError = useCallback(
    (title: string, message: string) => showToast('error', title, message),
    [showToast]
  );

  const showInfo = useCallback(
    (title: string, message: string) => showToast('info', title, message),
    [showToast]
  );

  const showWarning = useCallback(
    (title: string, message: string) => showToast('warning', title, message),
    [showToast]
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider
      value={{ showToast, showSuccess, showError, showInfo, showWarning }}
    >
      {children}

      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
        <div className="flex flex-col gap-3 pointer-events-auto">
          {toasts.map((toast) => (
            <ToastNotification key={toast.id} toast={toast} onClose={removeToast} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};
