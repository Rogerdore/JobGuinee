export interface ErrorResult {
  message: string;
  code?: string;
  details?: any;
  userMessage: string;
}

export class AppError extends Error {
  code?: string;
  details?: any;
  userMessage: string;

  constructor(message: string, code?: string, details?: any, userMessage?: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.userMessage = userMessage || this.getDefaultUserMessage(code);
  }

  private getDefaultUserMessage(code?: string): string {
    const messages: Record<string, string> = {
      'AUTH_ERROR': 'Vous devez être connecté pour effectuer cette action',
      'PERMISSION_DENIED': 'Vous n\'avez pas les permissions nécessaires',
      'NOT_FOUND': 'L\'élément demandé n\'a pas été trouvé',
      'VALIDATION_ERROR': 'Les données fournies ne sont pas valides',
      'STORAGE_ERROR': 'Erreur lors de l\'accès au stockage',
      'DATABASE_ERROR': 'Erreur lors de l\'accès à la base de données',
      'NETWORK_ERROR': 'Erreur de connexion réseau',
      'RATE_LIMIT': 'Trop de requêtes, veuillez réessayer plus tard',
      'FILE_TOO_LARGE': 'Le fichier est trop volumineux',
      'INVALID_FILE_TYPE': 'Type de fichier non autorisé',
      'RLS_ERROR': 'Accès refusé par les politiques de sécurité'
    };
    return messages[code || ''] || 'Une erreur est survenue';
  }
}

class ErrorHandler {
  handleSupabaseError(error: any, context?: string): ErrorResult {
    console.error(`Supabase error in ${context}:`, error);

    let code = 'DATABASE_ERROR';
    let userMessage = 'Une erreur est survenue lors de l\'accès aux données';

    if (error.code === 'PGRST116') {
      code = 'RLS_ERROR';
      userMessage = 'Vous n\'avez pas l\'autorisation d\'accéder à ces données';
    } else if (error.code === '23505') {
      code = 'DUPLICATE_ERROR';
      userMessage = 'Cet élément existe déjà';
    } else if (error.code === '23503') {
      code = 'REFERENCE_ERROR';
      userMessage = 'Impossible de supprimer cet élément car il est référencé ailleurs';
    } else if (error.code === '42501') {
      code = 'PERMISSION_DENIED';
      userMessage = 'Permission refusée';
    } else if (error.message?.includes('JWT')) {
      code = 'AUTH_ERROR';
      userMessage = 'Session expirée, veuillez vous reconnecter';
    }

    return {
      message: error.message || 'Unknown database error',
      code,
      details: error,
      userMessage
    };
  }

  handleStorageError(error: any, context?: string): ErrorResult {
    console.error(`Storage error in ${context}:`, error);

    let code = 'STORAGE_ERROR';
    let userMessage = 'Une erreur est survenue lors de l\'accès aux fichiers';

    if (error.message?.includes('not found')) {
      code = 'NOT_FOUND';
      userMessage = 'Le fichier demandé n\'a pas été trouvé';
    } else if (error.message?.includes('permission')) {
      code = 'PERMISSION_DENIED';
      userMessage = 'Vous n\'avez pas l\'autorisation d\'accéder à ce fichier';
    } else if (error.message?.includes('size')) {
      code = 'FILE_TOO_LARGE';
      userMessage = 'Le fichier est trop volumineux (max 10 MB)';
    } else if (error.message?.includes('type')) {
      code = 'INVALID_FILE_TYPE';
      userMessage = 'Type de fichier non autorisé';
    }

    return {
      message: error.message || 'Unknown storage error',
      code,
      details: error,
      userMessage
    };
  }

  handleNetworkError(error: any, context?: string): ErrorResult {
    console.error(`Network error in ${context}:`, error);

    return {
      message: error.message || 'Network error',
      code: 'NETWORK_ERROR',
      details: error,
      userMessage: 'Erreur de connexion. Vérifiez votre connexion internet.'
    };
  }

  handleValidationError(message: string, details?: any): ErrorResult {
    return {
      message,
      code: 'VALIDATION_ERROR',
      details,
      userMessage: message
    };
  }

  handleError(error: any, context?: string): ErrorResult {
    if (error instanceof AppError) {
      return {
        message: error.message,
        code: error.code,
        details: error.details,
        userMessage: error.userMessage
      };
    }

    if (error?.code?.startsWith('PG') || error?.code?.startsWith('23')) {
      return this.handleSupabaseError(error, context);
    }

    if (error?.message?.includes('storage') || error?.statusCode === 404) {
      return this.handleStorageError(error, context);
    }

    if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
      return this.handleNetworkError(error, context);
    }

    console.error(`Unexpected error in ${context}:`, error);
    return {
      message: error?.message || 'Unknown error',
      code: 'UNKNOWN_ERROR',
      details: error,
      userMessage: 'Une erreur inattendue est survenue'
    };
  }

  logError(error: any, context?: string, userId?: string): void {
    const errorInfo = this.handleError(error, context);

    const logEntry = {
      timestamp: new Date().toISOString(),
      context,
      userId,
      error: {
        message: errorInfo.message,
        code: errorInfo.code,
        userMessage: errorInfo.userMessage
      },
      stack: error?.stack
    };

    console.error('Error logged:', logEntry);
  }

  async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<{ data: T | null; error: ErrorResult | null }> {
    try {
      const data = await operation();
      return { data, error: null };
    } catch (error) {
      const errorResult = this.handleError(error, context);
      return { data: null, error: errorResult };
    }
  }

  isAuthError(error: ErrorResult): boolean {
    return error.code === 'AUTH_ERROR';
  }

  isPermissionError(error: ErrorResult): boolean {
    return error.code === 'PERMISSION_DENIED' || error.code === 'RLS_ERROR';
  }

  isNotFoundError(error: ErrorResult): boolean {
    return error.code === 'NOT_FOUND';
  }

  isValidationError(error: ErrorResult): boolean {
    return error.code === 'VALIDATION_ERROR';
  }
}

export const errorHandler = new ErrorHandler();

export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const errorResult = errorHandler.handleError(error, context);
      throw new AppError(
        errorResult.message,
        errorResult.code,
        errorResult.details,
        errorResult.userMessage
      );
    }
  };
}
