import { NAVIGATION_MAP, NavigationIntent } from './navigationMap';

export interface NavigationDetectionResult {
  intent: NavigationIntent | null;
  confidence: number;
  matchedLabels: string[];
  alternativeIntents?: NavigationIntent[];
}

export interface UserNavigationContext {
  isAuthenticated: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  userType: 'candidate' | 'recruiter' | 'trainer' | 'admin' | null;
}

export class ChatbotNavigationService {
  static detectNavigationIntent(
    message: string,
    userContext?: UserNavigationContext
  ): NavigationDetectionResult {
    const messageLower = message.toLowerCase().trim();
    const words = messageLower.split(/\s+/);

    const scores: Array<{
      intent: NavigationIntent;
      score: number;
      matchedLabels: string[];
    }> = [];

    for (const intentKey in NAVIGATION_MAP) {
      const intent = NAVIGATION_MAP[intentKey];
      let score = 0;
      const matchedLabels: string[] = [];

      for (const label of intent.labels) {
        const labelLower = label.toLowerCase();
        const labelWords = labelLower.split(/\s+/);

        if (messageLower.includes(labelLower)) {
          score += labelWords.length * 10;
          matchedLabels.push(label);
        } else {
          const matchedWordCount = labelWords.filter(labelWord =>
            words.some(messageWord => messageWord === labelWord || messageWord.includes(labelWord) || labelWord.includes(messageWord))
          ).length;

          if (matchedWordCount > 0) {
            score += matchedWordCount * 5;
            if (matchedWordCount === labelWords.length) {
              matchedLabels.push(label);
            }
          }
        }
      }

      if (messageLower.includes('aller') || messageLower.includes('ouvrir') || messageLower.includes('voir')) {
        score += 2;
      }

      if (messageLower.includes('je veux') || messageLower.includes('j\'aimerais') || messageLower.includes('peux-tu')) {
        score += 1;
      }

      if (userContext) {
        if (intent.requiresAuth && !userContext.isAuthenticated) {
          score = 0;
        }

        if (intent.requiresAdmin && !userContext.isAdmin) {
          score = 0;
        }

        if (intent.userTypes && intent.userTypes.length > 0 && userContext.userType) {
          if (!intent.userTypes.includes(userContext.userType)) {
            score = 0;
          }
        }
      }

      if (score > 0) {
        scores.push({ intent, score, matchedLabels });
      }
    }

    scores.sort((a, b) => b.score - a.score);

    if (scores.length === 0) {
      return {
        intent: null,
        confidence: 0,
        matchedLabels: []
      };
    }

    const topResult = scores[0];
    const confidence = Math.min(topResult.score / 50, 1);

    const result: NavigationDetectionResult = {
      intent: topResult.intent,
      confidence,
      matchedLabels: topResult.matchedLabels
    };

    if (scores.length > 1 && scores[1].score > topResult.score * 0.7) {
      result.alternativeIntents = scores.slice(1, 3).map(s => s.intent);
    }

    return result;
  }

  static canUserAccessIntent(
    intent: NavigationIntent,
    userContext: UserNavigationContext
  ): { canAccess: boolean; reason?: string } {
    if (intent.requiresAuth && !userContext.isAuthenticated) {
      return {
        canAccess: false,
        reason: 'Vous devez être connecté pour accéder à cette page.'
      };
    }

    if (intent.requiresAdmin && !userContext.isAdmin) {
      return {
        canAccess: false,
        reason: 'Cette page est réservée aux administrateurs.'
      };
    }

    if (intent.requiresPremium && !userContext.isPremium) {
      return {
        canAccess: false,
        reason: 'Cette fonctionnalité nécessite un abonnement Premium PRO+.'
      };
    }

    if (intent.userTypes && intent.userTypes.length > 0 && userContext.userType) {
      if (!intent.userTypes.includes(userContext.userType)) {
        return {
          canAccess: false,
          reason: `Cette page est réservée aux ${intent.userTypes.join(', ')}.`
        };
      }
    }

    return { canAccess: true };
  }

  static generateNavigationSuggestion(
    intent: NavigationIntent,
    userContext?: UserNavigationContext
  ): string {
    if (userContext) {
      const accessCheck = this.canUserAccessIntent(intent, userContext);
      if (!accessCheck.canAccess) {
        return accessCheck.reason || 'Accès non autorisé.';
      }
    }

    let suggestion = `Je peux vous diriger vers **${intent.displayName}**. `;

    switch (intent.category) {
      case 'ai-services':
        if (userContext?.isPremium) {
          suggestion += `${intent.description} En tant que membre Premium PRO+, vous avez un accès illimité à ce service.`;
        } else {
          suggestion += `${intent.description} Ce service consomme des crédits IA.`;
        }
        break;

      case 'premium':
        suggestion += intent.description;
        break;

      case 'dashboard':
        suggestion += `${intent.description} Vous y trouverez toutes vos informations et actions importantes.`;
        break;

      case 'main':
        suggestion += intent.description;
        break;

      case 'profile':
        suggestion += `${intent.description} Un profil complet augmente vos chances d'être remarqué.`;
        break;

      case 'admin':
        suggestion += intent.description;
        break;

      default:
        suggestion += intent.description;
    }

    return suggestion;
  }

  static generateNavigationResponse(
    detectionResult: NavigationDetectionResult,
    userContext?: UserNavigationContext
  ): {
    message: string;
    showConfirmation: boolean;
    intent: NavigationIntent | null;
    alternatives?: NavigationIntent[];
  } {
    if (!detectionResult.intent || detectionResult.confidence < 0.3) {
      return {
        message: 'Je n\'ai pas bien compris où vous souhaitez aller. Pouvez-vous reformuler votre demande ?',
        showConfirmation: false,
        intent: null
      };
    }

    const intent = detectionResult.intent;

    if (userContext) {
      const accessCheck = this.canUserAccessIntent(intent, userContext);
      if (!accessCheck.canAccess) {
        let message = accessCheck.reason || 'Accès non autorisé.';

        if (intent.requiresAuth && !userContext.isAuthenticated) {
          message += ' Connectez-vous pour accéder à cette fonctionnalité.';
        }

        if (intent.requiresPremium && !userContext.isPremium) {
          message += ' Passez à Premium PRO+ pour débloquer cet accès illimité.';
        }

        return {
          message,
          showConfirmation: false,
          intent: null
        };
      }
    }

    const suggestion = this.generateNavigationSuggestion(intent, userContext);

    if (detectionResult.confidence < 0.6 && detectionResult.alternativeIntents) {
      const alternativesText = detectionResult.alternativeIntents
        .map(alt => `- ${alt.displayName}`)
        .join('\n');

      return {
        message: `${suggestion}\n\nVouliez-vous peut-être accéder à :\n${alternativesText}`,
        showConfirmation: true,
        intent,
        alternatives: detectionResult.alternativeIntents
      };
    }

    return {
      message: suggestion,
      showConfirmation: true,
      intent
    };
  }

  static getNavigationKeywords(): string[] {
    return [
      'aller', 'ouvrir', 'voir', 'accéder', 'aller à', 'aller sur',
      'ouvre', 'ouvrir la page', 'je veux aller', 'amène-moi',
      'diriger vers', 'naviguer vers', 'page', 'espace',
      'je cherche', 'où est', 'où se trouve', 'comment accéder'
    ];
  }

  static hasNavigationIntent(message: string): boolean {
    const messageLower = message.toLowerCase();
    const keywords = this.getNavigationKeywords();

    const hasKeyword = keywords.some(keyword => messageLower.includes(keyword));

    const hasPageReference = Object.values(NAVIGATION_MAP).some(intent =>
      intent.labels.some(label => messageLower.includes(label.toLowerCase()))
    );

    return hasKeyword || hasPageReference;
  }
}
