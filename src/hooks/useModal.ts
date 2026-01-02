import { useState, useCallback, ReactNode } from 'react';
import { ModalType } from '../components/modals/ModernModal';

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string | ReactNode;
  type: ModalType;
  confirmText: string;
  cancelText: string;
  onConfirm?: () => void;
  showCancel: boolean;
  pedagogical: boolean;
}

export function useModal() {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK',
    cancelText: 'Annuler',
    showCancel: false,
    pedagogical: true,
  });

  const showAlert = useCallback((
    title: string,
    message: string | ReactNode,
    type: ModalType = 'info',
    pedagogical: boolean = true
  ) => {
    setModalState({
      isOpen: true,
      title,
      message,
      type,
      confirmText: 'OK',
      cancelText: 'Annuler',
      showCancel: false,
      pedagogical,
    });
  }, []);

  const showConfirm = useCallback((
    title: string,
    message: string | ReactNode,
    onConfirm: () => void,
    type: ModalType = 'warning',
    pedagogical: boolean = true
  ) => {
    return new Promise<boolean>((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        type,
        confirmText: 'Confirmer',
        cancelText: 'Annuler',
        showCancel: true,
        pedagogical,
        onConfirm: () => {
          onConfirm();
          resolve(true);
        },
      });
    });
  }, []);

  const showSuccess = useCallback((
    title: string,
    message: string | ReactNode,
    pedagogical: boolean = true
  ) => {
    showAlert(title, message, 'success', pedagogical);
  }, [showAlert]);

  const showError = useCallback((
    title: string,
    message: string | ReactNode,
    pedagogical: boolean = true
  ) => {
    showAlert(title, message, 'error', pedagogical);
  }, [showAlert]);

  const showWarning = useCallback((
    title: string,
    message: string | ReactNode,
    pedagogical: boolean = true
  ) => {
    showAlert(title, message, 'warning', pedagogical);
  }, [showAlert]);

  const showInfo = useCallback((
    title: string,
    message: string | ReactNode,
    pedagogical: boolean = true
  ) => {
    showAlert(title, message, 'info', pedagogical);
  }, [showAlert]);

  const closeModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    modalState,
    showAlert,
    showConfirm,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeModal,
  };
}
