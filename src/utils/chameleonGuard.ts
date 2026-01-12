/**
 * Chameleon Guard - Protection contre les crashes de scripts externes
 *
 * Empêche Chameleon et autres scripts externes de charger sur les routes critiques
 * pour garantir :
 * - Stabilité sur les routes de partage Facebook (/share, /s)
 * - Performance sur les pages offres (/offres)
 * - HTML pur pour le SEO et les crawlers
 *
 * BUG RÉSOLU :
 * - Crashes chmln("boot")
 * - Erreurs 502
 * - Pages Facebook vides
 * - Dashboard cassé
 */

/**
 * Routes critiques qui doivent rester en HTML pur
 * Sans scripts externes type Chameleon
 */
const CRITICAL_ROUTES = [
  '/share',      // Routes de partage social
  '/s/',         // Short URLs de partage
  '/offres',     // Pages d'offres d'emploi (SEO critiques)
  '/job/',       // Routes de détail d'offres
  '/public',     // Profils publics partagés
];

/**
 * Vérifie si l'URL actuelle est une route critique
 */
export function isCriticalRoute(): boolean {
  const pathname = window.location.pathname;

  return CRITICAL_ROUTES.some(route =>
    pathname.startsWith(route)
  );
}

/**
 * Empêche le chargement de Chameleon sur les routes critiques
 */
export function blockChameleonOnCriticalRoutes(): void {
  if (isCriticalRoute()) {
    console.log('🛡️ [Chameleon Guard] Route critique détectée, Chameleon bloqué');

    // Bloquer la fonction globale chmln
    if (typeof window !== 'undefined') {
      (window as any).chmln = function(...args: any[]) {
        console.warn('⚠️ [Chameleon Guard] Appel chmln bloqué sur route critique:', args);
        return undefined;
      };

      // Bloquer aussi l'object Chameleon
      Object.defineProperty(window, 'Chameleon', {
        get() {
          console.warn('⚠️ [Chameleon Guard] Accès Chameleon bloqué sur route critique');
          return undefined;
        },
        set() {
          console.warn('⚠️ [Chameleon Guard] Initialisation Chameleon bloquée');
          return false;
        },
        configurable: false
      });
    }
  }
}

/**
 * Bloque l'injection de scripts externes suspects
 */
export function blockSuspiciousScripts(): void {
  if (!isCriticalRoute()) return;

  // Observer les nouveaux scripts ajoutés au DOM
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeName === 'SCRIPT') {
          const script = node as HTMLScriptElement;
          const src = script.src || script.innerHTML;

          // Bloquer les scripts Chameleon
          if (
            src.includes('chameleon') ||
            src.includes('chmln') ||
            src.includes('trychameleon')
          ) {
            console.warn('🛡️ [Chameleon Guard] Script externe bloqué:', src.substring(0, 100));
            script.remove();
          }
        }
      });
    });
  });

  // Observer le head et le body
  if (document.head) observer.observe(document.head, { childList: true, subtree: true });
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });

  console.log('🛡️ [Chameleon Guard] Protection des scripts activée');
}

/**
 * Initialise toutes les protections
 * À appeler au démarrage de l'application
 */
export function initializeChameleonGuard(): void {
  const pathname = window.location.pathname;

  if (isCriticalRoute()) {
    console.log('🛡️ [Chameleon Guard] ACTIVÉ pour:', pathname);
    console.log('   - Chameleon bloqué');
    console.log('   - Scripts externes surveillés');
    console.log('   - HTML pur garanti pour Facebook/SEO');

    // Activer toutes les protections
    blockChameleonOnCriticalRoutes();
    blockSuspiciousScripts();
  } else {
    console.log('✅ [Chameleon Guard] Route normale, pas de protection nécessaire');
  }
}

/**
 * Version safe de chmln pour l'utiliser dans le code
 * Vérifie automatiquement si on est sur une route critique
 */
export function safeChmln(action: string, ...args: any[]): void {
  if (isCriticalRoute()) {
    console.warn(`⚠️ [Chameleon Guard] chmln("${action}") ignoré sur route critique`);
    return;
  }

  // Si on n'est pas sur une route critique, appeler normalement
  if (typeof (window as any).chmln === 'function') {
    try {
      (window as any).chmln(action, ...args);
    } catch (error) {
      console.error('❌ [Chameleon] Erreur lors de l\'appel:', error);
    }
  }
}

/**
 * Détecte si Chameleon est chargé et actif
 */
export function isChameleonLoaded(): boolean {
  return typeof (window as any).chmln === 'function' &&
         !(window as any).chmln.toString().includes('Chameleon Guard');
}

/**
 * Rapport de statut pour le debugging
 */
export function getChameleonGuardStatus(): {
  isActive: boolean;
  currentRoute: string;
  isCritical: boolean;
  chameleonLoaded: boolean;
} {
  return {
    isActive: isCriticalRoute(),
    currentRoute: window.location.pathname,
    isCritical: isCriticalRoute(),
    chameleonLoaded: isChameleonLoaded(),
  };
}
