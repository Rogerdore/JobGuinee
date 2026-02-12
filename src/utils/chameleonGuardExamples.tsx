/**
 * Exemples d'utilisation du Chameleon Guard
 *
 * Ce fichier montre comment intégrer le guard dans différentes situations
 */

import { isCriticalRoute, safeChmln } from './chameleonGuard';
import { useChameleonGuard, useIsCriticalRoute } from '../hooks/useChameleonGuard';

/**
 * EXEMPLE 1 : Charger un widget tiers seulement sur les routes normales
 */
export function loadThirdPartyWidget() {
  // ❌ MAUVAIS - Charge partout
  // window.chmln('boot');

  // ✅ BON - Vérifie d'abord
  if (!isCriticalRoute()) {
    safeChmln('boot');
  }
}

/**
 * EXEMPLE 2 : Composant React qui s'adapte selon la route
 */
export function ExampleComponent() {
  const { isCritical } = useChameleonGuard();

  if (isCritical) {
    // Sur les routes critiques : HTML pur
    return (
      <div className="simple-content">
        <h1>Offre d'emploi</h1>
        <p>Description...</p>
      </div>
    );
  }

  // Sur les routes normales : widgets interactifs
  return (
    <div className="interactive-content">
      <h1>Offre d'emploi</h1>
      <InteractiveWidget />
      <ChatSupport />
    </div>
  );
}

/**
 * EXEMPLE 3 : Tracking Analytics Conditionnel
 */
export function trackUserAction(action: string, data: any) {
  // ❌ MAUVAIS - Crash possible
  // chmln('track', action, data);

  // ✅ BON - Utilise safeChmln
  safeChmln('track', action, data);
}

/**
 * EXEMPLE 4 : Hook Simple dans un Composant
 */
export function AnotherComponent() {
  const isCritical = useIsCriticalRoute();

  return (
    <div>
      {isCritical ? (
        <StaticSEOContent />
      ) : (
        <DynamicInteractiveContent />
      )}
    </div>
  );
}

/**
 * EXEMPLE 5 : Charger un Script Externe Conditionnellement
 */
export function loadExternalScript(src: string) {
  if (isCriticalRoute()) {
    console.warn('Script externe bloqué sur route critique:', src);
    return;
  }

  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  document.head.appendChild(script);
}

/**
 * EXEMPLE 6 : Initialisation Conditionnelle d'un Service
 */
export function initializeAnalyticsService() {
  // Ne pas initialiser sur les routes critiques
  if (isCriticalRoute()) {
    console.log('Analytics désactivé sur route critique');
    return null;
  }

  // Initialiser normalement
  return {
    track: (event: string) => safeChmln('track', event),
    identify: (userId: string) => safeChmln('identify', userId),
  };
}

/**
 * EXEMPLE 7 : useEffect avec Protection
 */
export function ComponentWithEffect() {
  const isCritical = useIsCriticalRoute();

  useEffect(() => {
    if (!isCritical) {
      // Charger les widgets seulement sur routes normales
      safeChmln('boot');

      return () => {
        // Cleanup si nécessaire
      };
    }
  }, [isCritical]);

  return <div>Content</div>;
}

/**
 * EXEMPLE 8 : Fonction Helper pour les Routes de Partage
 */
export function isShareRoute(): boolean {
  const path = window.location.pathname;
  return path.startsWith('/share') || path.startsWith('/s/');
}

export function prepareForSocialSharing() {
  if (isShareRoute()) {
    // Désactiver tous les widgets
    // S'assurer que le HTML est propre pour les crawlers
    console.log('Mode partage social activé - HTML pur');
    return true;
  }
  return false;
}

/**
 * EXEMPLE 9 : Wrapper pour les Actions Utilisateur
 */
export function safeTrackUserEvent(eventName: string, properties?: any) {
  // Cette fonction peut être appelée partout
  // Elle gère automatiquement les routes critiques
  safeChmln('track', eventName, properties);
}

/**
 * EXEMPLE 10 : Vérification Avant Rendu de Widget
 */
export function SupportChatWidget() {
  const { canLoadThirdPartyWidgets } = useChameleonGuard();

  if (!canLoadThirdPartyWidgets) {
    // Sur route critique : pas de widget
    return null;
  }

  // Sur route normale : afficher le widget
  return (
    <div id="support-chat">
      {/* Widget de support */}
    </div>
  );
}

// Composants factices pour les exemples
function InteractiveWidget() { return <div>Interactive</div>; }
function ChatSupport() { return <div>Chat</div>; }
function StaticSEOContent() { return <div>Static SEO</div>; }
function DynamicInteractiveContent() { return <div>Dynamic</div>; }
function useEffect(_callback: () => void, _deps: any[]) {}
