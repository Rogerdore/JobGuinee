/**
 * Hook React pour le Chameleon Guard
 *
 * Permet aux composants de savoir s'ils sont sur une route critique
 * et d'ajuster leur comportement en conséquence
 */

import { useState, useEffect } from 'react';
import {
  isCriticalRoute,
  isChameleonLoaded,
  getChameleonGuardStatus,
  safeChmln
} from '../utils/chameleonGuard';

interface ChameleonGuardStatus {
  isActive: boolean;
  currentRoute: string;
  isCritical: boolean;
  chameleonLoaded: boolean;
}

/**
 * Hook pour vérifier si on est sur une route critique
 */
export function useChameleonGuard() {
  const [status, setStatus] = useState<ChameleonGuardStatus>(() => getChameleonGuardStatus());

  useEffect(() => {
    // Mettre à jour le statut
    const updateStatus = () => {
      setStatus(getChameleonGuardStatus());
    };

    // Écouter les changements de route
    updateStatus();

    // Observer les changements d'URL (pour les SPAs)
    window.addEventListener('popstate', updateStatus);

    return () => {
      window.removeEventListener('popstate', updateStatus);
    };
  }, []);

  return {
    ...status,
    // Fonction helper pour appeler Chameleon de manière sécurisée
    callChameleon: safeChmln,
    // Vérifier si on peut charger des widgets tiers
    canLoadThirdPartyWidgets: !status.isCritical,
  };
}

/**
 * Hook simple pour savoir si on est sur une route critique
 */
export function useIsCriticalRoute(): boolean {
  const [critical, setCritical] = useState(() => isCriticalRoute());

  useEffect(() => {
    const checkRoute = () => {
      setCritical(isCriticalRoute());
    };

    checkRoute();
    window.addEventListener('popstate', checkRoute);

    return () => {
      window.removeEventListener('popstate', checkRoute);
    };
  }, []);

  return critical;
}

/**
 * Hook pour vérifier si Chameleon est chargé
 */
export function useIsChameleonLoaded(): boolean {
  const [loaded, setLoaded] = useState(() => isChameleonLoaded());

  useEffect(() => {
    // Vérifier périodiquement si Chameleon est chargé
    const interval = setInterval(() => {
      setLoaded(isChameleonLoaded());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return loaded;
}
