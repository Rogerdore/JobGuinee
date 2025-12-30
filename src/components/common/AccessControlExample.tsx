import React from 'react';
import { useAccessControl } from '../../hooks/useAccessControl';
import AccessRestrictionModal from './AccessRestrictionModal';

interface ProtectedPageWrapperProps {
  area: 'candidate-dashboard' | 'recruiter-dashboard' | 'cvtheque' | 'external-applications' | 'admin-panel';
  children: React.ReactNode;
  onNavigate?: (page: string) => void;
  fallback?: React.ReactNode;
}

export function ProtectedPageWrapper({
  area,
  children,
  onNavigate,
  fallback
}: ProtectedPageWrapperProps) {
  const {
    hasAccess,
    showRestrictionModal,
    restrictionType,
    closeModal,
    currentUserType
  } = useAccessControl(area);

  React.useEffect(() => {
    if (!hasAccess) {
    }
  }, [hasAccess]);

  if (!hasAccess) {
    return (
      <>
        {fallback || (
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès restreint</h2>
              <p className="text-gray-600">Cette page nécessite une autorisation spécifique</p>
            </div>
          </div>
        )}

        <AccessRestrictionModal
          isOpen={showRestrictionModal}
          onClose={closeModal}
          restrictionType={restrictionType}
          currentUserType={currentUserType}
          onNavigate={onNavigate}
        />
      </>
    );
  }

  return <>{children}</>;
}

interface ProtectedActionButtonProps {
  area: 'external-applications' | 'cvtheque' | 'premium-services' | 'ai-services';
  onNavigate?: (page: string) => void;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function ProtectedActionButton({
  area,
  onNavigate,
  onClick,
  children,
  className = '',
  disabled = false
}: ProtectedActionButtonProps) {
  const {
    hasAccess,
    enforceAccess,
    showRestrictionModal,
    restrictionType,
    closeModal,
    currentUserType
  } = useAccessControl(area);

  const handleClick = () => {
    const canProceed = enforceAccess();

    if (canProceed && onClick) {
      onClick();
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={disabled}
        className={className}
      >
        {children}
      </button>

      <AccessRestrictionModal
        isOpen={showRestrictionModal}
        onClose={closeModal}
        restrictionType={restrictionType}
        currentUserType={currentUserType}
        onNavigate={onNavigate}
      />
    </>
  );
}

export function AccessGuard({
  area,
  children,
  fallback,
  onDenied
}: {
  area: 'candidate-dashboard' | 'recruiter-dashboard' | 'cvtheque' | 'external-applications' | 'admin-panel';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onDenied?: () => void;
}) {
  const { hasAccess } = useAccessControl(area);

  React.useEffect(() => {
    if (!hasAccess && onDenied) {
      onDenied();
    }
  }, [hasAccess, onDenied]);

  if (!hasAccess) {
    return <>{fallback || null}</>;
  }

  return <>{children}</>;
}
