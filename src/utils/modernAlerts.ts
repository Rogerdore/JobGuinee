export interface ModernAlertsConfig {
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, type?: 'warning' | 'error' | 'success' | 'info') => void;
}

export function replaceAlert(message: string, modal: ModernAlertsConfig) {
  if (message.toLowerCase().includes('succès') || message.toLowerCase().includes('success')) {
    const title = message.includes('supprimé') ? 'Supprimé' :
                  message.includes('créé') ? 'Créé' :
                  message.includes('modifié') || message.includes('mis à jour') ? 'Mis à jour' :
                  message.includes('enregistré') ? 'Enregistré' :
                  message.includes('publié') ? 'Publié' : 'Succès';
    modal.showSuccess(title, message);
  } else if (message.toLowerCase().includes('erreur') || message.toLowerCase().includes('error')) {
    modal.showError('Erreur', message + '. Veuillez réessayer.');
  } else {
    modal.showInfo('Information', message);
  }
}

export function replaceConfirm(
  message: string,
  callback: () => void,
  modal: ModernAlertsConfig
): void {
  const title = message.includes('supprimer') ? 'Confirmer la suppression' :
                message.includes('modifier') ? 'Confirmer la modification' :
                message.includes('activer') ? 'Confirmer l\'activation' :
                message.includes('désactiver') ? 'Confirmer la désactivation' : 'Confirmer l\'action';

  modal.showConfirm(title, message, callback, 'warning');
}
