interface EnvConfig {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

class EnvValidator {
  private requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

  validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const varName of this.requiredVars) {
      const value = import.meta.env[varName];

      if (!value) {
        errors.push(`Variable d'environnement manquante: ${varName}`);
        continue;
      }

      if (typeof value !== 'string' || value.trim() === '') {
        errors.push(`Variable d'environnement invalide: ${varName} (valeur vide)`);
        continue;
      }

      if (varName === 'VITE_SUPABASE_URL') {
        if (!this.isValidUrl(value)) {
          errors.push(`URL Supabase invalide: ${varName}`);
        } else if (value.includes('your-project-ref')) {
          errors.push(`URL Supabase non configurée: ${varName} (utilise encore la valeur d'exemple)`);
        }
      }

      if (varName === 'VITE_SUPABASE_ANON_KEY') {
        if (value.includes('your-anon-key')) {
          errors.push(`Clé Supabase non configurée: ${varName} (utilise encore la valeur d'exemple)`);
        } else if (value.length < 20) {
          errors.push(`Clé Supabase invalide: ${varName} (trop courte)`);
        }
      }
    }

    const environment = import.meta.env.VITE_ENVIRONMENT || 'development';
    if (environment === 'production' && window.location.hostname === 'localhost') {
      warnings.push('Mode production détecté sur localhost');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  getConfig(): EnvConfig {
    return {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    };
  }

  showValidationError(result: ValidationResult): void {
    if (!result.isValid) {
      const errorMessage = this.formatErrorMessage(result);
      console.error('❌ Configuration Environment Invalide:', result);

      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.95);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        font-family: monospace;
        padding: 20px;
      `;

      errorDiv.innerHTML = `
        <div style="max-width: 600px; background: #1a1a1a; border: 2px solid #ff4444; border-radius: 8px; padding: 30px;">
          <h1 style="color: #ff4444; margin-top: 0;">⚠️ Configuration Manquante</h1>
          <p style="font-size: 14px; line-height: 1.6;">
            L'application ne peut pas démarrer car des variables d'environnement requises sont manquantes ou invalides.
          </p>
          <div style="background: #2a2a2a; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <strong style="color: #ff4444;">Erreurs détectées:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              ${result.errors.map(err => `<li style="margin: 5px 0;">${err}</li>`).join('')}
            </ul>
          </div>
          <div style="background: #1a3a1a; padding: 15px; border-radius: 4px; border: 1px solid #44ff44;">
            <strong style="color: #44ff44;">Comment corriger:</strong>
            <ol style="margin: 10px 0; padding-left: 20px; font-size: 13px;">
              <li style="margin: 8px 0;">Copiez le fichier <code>.env.example</code> en <code>.env</code></li>
              <li style="margin: 8px 0;">Ouvrez <a href="https://app.supabase.com" target="_blank" style="color: #44ff44;">Supabase Dashboard</a></li>
              <li style="margin: 8px 0;">Allez dans Settings > API</li>
              <li style="margin: 8px 0;">Copiez votre <strong>Project URL</strong> dans <code>VITE_SUPABASE_URL</code></li>
              <li style="margin: 8px 0;">Copiez votre <strong>anon public key</strong> dans <code>VITE_SUPABASE_ANON_KEY</code></li>
              <li style="margin: 8px 0;">Redémarrez le serveur de développement</li>
            </ol>
          </div>
          ${result.warnings.length > 0 ? `
            <div style="background: #3a3a1a; padding: 15px; border-radius: 4px; border: 1px solid #ffaa44; margin-top: 15px;">
              <strong style="color: #ffaa44;">Avertissements:</strong>
              <ul style="margin: 10px 0; padding-left: 20px; font-size: 13px;">
                ${result.warnings.map(warn => `<li style="margin: 5px 0;">${warn}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      `;

      document.body.innerHTML = '';
      document.body.appendChild(errorDiv);
    }
  }

  private formatErrorMessage(result: ValidationResult): string {
    let message = '❌ Configuration Environment Invalide\n\n';
    message += 'Erreurs:\n';
    result.errors.forEach(error => {
      message += `  - ${error}\n`;
    });

    if (result.warnings.length > 0) {
      message += '\nAvertissements:\n';
      result.warnings.forEach(warning => {
        message += `  - ${warning}\n`;
      });
    }

    message += '\n💡 Consultez le fichier .env.example pour la configuration requise\n';
    message += '📚 Documentation: https://docs.supabase.com/docs/guides/getting-started\n';

    return message;
  }

  logConfiguration(): void {
    // NE LOGGER QU'EN MODE DÉVELOPPEMENT
    if (import.meta.env.MODE !== 'development') {
      return;
    }

    const config = this.getConfig();
    const environment = import.meta.env.VITE_ENVIRONMENT || 'development';

    console.log('%c🚀 JobGuinée Configuration', 'color: #4CAF50; font-size: 16px; font-weight: bold');
    console.log('%c────────────────────────────', 'color: #4CAF50');
    console.log(`%c Environment: %c${environment}`, 'color: #888', 'color: #4CAF50; font-weight: bold');
    console.log(`%c Supabase URL: %c${config.VITE_SUPABASE_URL}`, 'color: #888', 'color: #2196F3');
    console.log(`%c Anon Key: %c${config.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...`, 'color: #888', 'color: #2196F3');
    console.log('%c────────────────────────────', 'color: #4CAF50');
    console.log('%c⚡ Mode développement activé', 'color: #FFC107');
  }
}

export const envValidator = new EnvValidator();

export function validateEnvOnStartup(): void {
  try {
    const result = envValidator.validate();

    if (!result.isValid) {
      // En développement, afficher l'erreur mais NE JAMAIS BLOQUER
      console.error('❌ Configuration environment invalide:', result.errors);
      console.warn('⚠️ L\'application va démarrer malgré les erreurs de configuration');

      // Afficher l'avertissement visuellement mais permettre le rendu
      if (import.meta.env.MODE === 'development') {
        setTimeout(() => {
          envValidator.showValidationError(result);
        }, 1000);
      }
      return;
    }

    if (result.warnings.length > 0) {
      console.warn('⚠️ Avertissements de configuration:', result.warnings);
    }

    envValidator.logConfiguration();
  } catch (error) {
    // ABSOLUMENT AUCUNE EXCEPTION NE DOIT BLOQUER LE DÉMARRAGE
    console.error('❌ Erreur lors de la validation de l\'environnement:', error);
    console.warn('⚠️ L\'application démarre malgré l\'erreur de validation');
  }
}
