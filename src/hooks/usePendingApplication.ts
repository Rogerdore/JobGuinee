import { useEffect, useState } from 'react';
import { fastApplicationValidator } from '../services/fastApplicationValidator';

/**
 * Hook pour gérer la reprise automatique d'une candidature en attente
 * après complétion du profil
 */
export function usePendingApplication(candidateId: string | null) {
  const [pendingApplication, setPendingApplication] = useState<{
    jobId: string;
    jobTitle: string;
    companyName: string;
  } | null>(null);

  const [shouldShowApplicationModal, setShouldShowApplicationModal] = useState(false);

  useEffect(() => {
    if (!candidateId) return;

    const checkPendingApplication = async () => {
      const jobId = sessionStorage.getItem('pendingApplicationJobId');
      const jobTitle = sessionStorage.getItem('pendingApplicationJobTitle');
      const companyName = sessionStorage.getItem('pendingApplicationCompanyName');

      if (jobId && jobTitle && companyName) {
        const validation = await fastApplicationValidator.checkEligibility(candidateId, jobId);

        if (validation.isEligible) {
          setPendingApplication({ jobId, jobTitle, companyName });
          setShouldShowApplicationModal(true);

          sessionStorage.removeItem('pendingApplicationJobId');
          sessionStorage.removeItem('pendingApplicationJobTitle');
          sessionStorage.removeItem('pendingApplicationCompanyName');
        } else {
          console.log('Profile still incomplete:', validation.missingFields);
        }
      }
    };

    const timeoutId = setTimeout(checkPendingApplication, 1000);
    return () => clearTimeout(timeoutId);
  }, [candidateId]);

  const clearPendingApplication = () => {
    setPendingApplication(null);
    setShouldShowApplicationModal(false);
  };

  return {
    pendingApplication,
    shouldShowApplicationModal,
    clearPendingApplication
  };
}
