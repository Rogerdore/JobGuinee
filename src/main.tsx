import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { validateEnvOnStartup } from './utils/envValidator';
import { initializeChameleonGuard } from './utils/chameleonGuard';

// PROTECTION CHAMELEON: Bloquer sur les routes critiques AVANT TOUT
// Empêche les crashes, 502, et pages Facebook vides
try {
  initializeChameleonGuard();
} catch (error) {
  console.error('⚠️ Erreur lors de l\'initialisation du Chameleon Guard:', error);
}

// PROTECTION ULTIME: Garantir que l'application démarre TOUJOURS
try {
  // Validation d'environnement (ne bloque jamais)
  validateEnvOnStartup();
} catch (error) {
  console.error('⚠️ Erreur lors de la validation d\'environnement:', error);
}

// Vérifier que le DOM est prêt
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('❌ Élément root introuvable dans le DOM');
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f3f4f6; font-family: system-ui, -apple-system, sans-serif;">
      <div style="background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center;">
        <h1 style="color: #dc2626; margin-bottom: 1rem;">Erreur de configuration</h1>
        <p style="color: #4b5563; margin-bottom: 1rem;">L'élément racine de l'application est introuvable.</p>
        <button onclick="location.reload()" style="background: #2563eb; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.25rem; cursor: pointer;">
          Recharger
        </button>
      </div>
    </div>
  `;
} else {
  try {
    const root = createRoot(rootElement);
    root.render(<App />);
  } catch (error) {
    console.error('❌ Erreur critique lors du rendu de l\'application:', error);

    // Fallback ultime si même React ne peut pas démarrer
    rootElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f3f4f6; font-family: system-ui, -apple-system, sans-serif;">
        <div style="background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 500px;">
          <h1 style="color: #dc2626; margin-bottom: 1rem;">Erreur de démarrage</h1>
          <p style="color: #4b5563; margin-bottom: 1rem;">L'application n'a pas pu démarrer correctement.</p>
          <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 1.5rem;">Détails: ${error instanceof Error ? error.message : 'Erreur inconnue'}</p>
          <button onclick="location.reload()" style="background: #2563eb; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.25rem; cursor: pointer; font-size: 1rem;">
            Recharger la page
          </button>
        </div>
      </div>
    `;
  }
}
