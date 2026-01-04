import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: ReactNode;
  containerId?: string;
}

export default function ModalPortal({ children, containerId = 'modal-root' }: ModalPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  const modalRoot = document.getElementById(containerId);
  if (!modalRoot) {
    console.warn(`ModalPortal: Container element #${containerId} not found in DOM`);
    return null;
  }

  return createPortal(children, modalRoot);
}
