import { createContext, useContext, ReactNode } from 'react';
import ModernModal from '../components/modals/ModernModal';
import { useModal } from '../hooks/useModal';

interface ModalContextType {
  showAlert: (title: string, message: string | ReactNode, type?: 'success' | 'error' | 'warning' | 'info', pedagogical?: boolean) => void;
  showConfirm: (title: string, message: string | ReactNode, onConfirm: () => void, type?: 'success' | 'error' | 'warning' | 'info', pedagogical?: boolean) => Promise<boolean>;
  showSuccess: (title: string, message: string | ReactNode, pedagogical?: boolean) => void;
  showError: (title: string, message: string | ReactNode, pedagogical?: boolean) => void;
  showWarning: (title: string, message: string | ReactNode, pedagogical?: boolean) => void;
  showInfo: (title: string, message: string | ReactNode, pedagogical?: boolean) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const { modalState, showAlert, showConfirm, showSuccess, showError, showWarning, showInfo, closeModal } = useModal();

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, showSuccess, showError, showWarning, showInfo }}>
      {children}
      <ModernModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        onConfirm={modalState.onConfirm}
        showCancel={modalState.showCancel}
        pedagogical={modalState.pedagogical}
      />
    </ModalContext.Provider>
  );
}

export function useModalContext() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalContext must be used within a ModalProvider');
  }
  return context;
}
