import { supabase } from '../lib/supabase';
import { isPremiumActive } from '../utils/premiumHelpers';

export type ServiceCode =
  | 'ai_cv_builder'
  | 'ai_cv_improver'
  | 'ai_cv_targeted'
  | 'ai_cover_letter'
  | 'ai_job_matching'
  | 'ai_career_coaching'
  | 'ai_career_plan'
  | 'ai_interview_simulator'
  | 'ai_job_alerts'
  | 'ai_chatbot'
  | 'ai_gold_profile';

export interface IAAccessResult {
  allowed: boolean;
  reason:
    | 'access_granted'
    | 'not_authenticated'
    | 'insufficient_credits'
    | 'premium_quota_reached'
    | 'service_inactive'
    | 'premium_expired'
    | 'service_not_found';
  message: string;
  requiredCredits?: number;
  currentCredits?: number;
  dailyActionsUsed?: number;
  dailyLimit?: number;
  suggestedAction?: 'buy_credits' | 'subscribe_premium' | 'renew_premium' | 'wait_reset' | 'login';
}

export interface EnhancedUserContext {
  userId: string | null;
  isAuthenticated: boolean;
  isPremium: boolean;
  isPremiumActive: boolean;
  premiumExpiration: string | null;
  creditsBalance: number;
  daysRemainingPremium: number | null;
  userType: string | null;
}

export class ChatbotIAAccessControl {
  static readonly IA_SERVICE_ROUTES: Record<string, ServiceCode> = {
    'ai-cv-generator': 'ai_cv_builder',
    'ai-cover-letter': 'ai_cover_letter',
    'ai-matching': 'ai_job_matching',
    'ai-coach': 'ai_career_coaching',
    'ai-career-plan': 'ai_career_plan',
    'ai-interview-simulator': 'ai_interview_simulator',
    'ai-alerts': 'ai_job_alerts',
    'ai-chat': 'ai_chatbot',
    'gold-profile': 'ai_gold_profile',
  };

  static isIAService(route: string): boolean {
    return route in this.IA_SERVICE_ROUTES;
  }

  static getServiceCode(route: string): ServiceCode | null {
    return this.IA_SERVICE_ROUTES[route] || null;
  }

  static async checkIAAccess(
    serviceCode: ServiceCode,
    userContext: EnhancedUserContext
  ): Promise<IAAccessResult> {
    if (!userContext.isAuthenticated || !userContext.userId) {
      return {
        allowed: false,
        reason: 'not_authenticated',
        message: 'Oups ! Connectez-vous d\'abord pour accéder à ce service. 😊',
        suggestedAction: 'login'
      };
    }

    const serviceConfig = await this.getServiceConfig(serviceCode);

    if (!serviceConfig) {
      return {
        allowed: false,
        reason: 'service_not_found',
        message: 'Ce service n\'est pas encore disponible. Revenez bientôt ! 🚀'
      };
    }

    if (!serviceConfig.is_active) {
      return {
        allowed: false,
        reason: 'service_inactive',
        message: `Le service "${serviceConfig.service_name}" est en pause. On le réactive très vite ! ⚙️`
      };
    }

    if (userContext.isPremium && userContext.isPremiumActive) {
      const premiumCheck = await this.checkPremiumQuota(
        userContext.userId,
        serviceCode,
        serviceConfig
      );

      if (premiumCheck.allowed) {
        return {
          allowed: true,
          reason: 'access_granted',
          message: `Accès autorisé au service Premium "${serviceConfig.service_name}".`
        };
      }

      return premiumCheck;
    }

    if (userContext.isPremium && !userContext.isPremiumActive) {
      return {
        allowed: false,
        reason: 'premium_expired',
        message: 'Votre Premium a expiré. Renouvelez-le pour profiter des services IA ! 👑',
        suggestedAction: 'renew_premium'
      };
    }

    const creditsCost = serviceConfig.credits_cost || 0;

    if (creditsCost === 0) {
      return {
        allowed: true,
        reason: 'access_granted',
        message: `✓ Service "${serviceConfig.service_name}" gratuit. C'est parti !`
      };
    }

    if (userContext.creditsBalance < creditsCost) {
      return {
        allowed: false,
        reason: 'insufficient_credits',
        message: `Il vous manque quelques crédits. Ce service coûte ${creditsCost} crédits (vous en avez ${userContext.creditsBalance}). 💰`,
        requiredCredits: creditsCost,
        currentCredits: userContext.creditsBalance,
        suggestedAction: 'buy_credits'
      };
    }

    return {
      allowed: true,
      reason: 'access_granted',
      message: `✓ Prêt ! ${creditsCost} crédit${creditsCost > 1 ? 's' : ''} sera${creditsCost > 1 ? 'ont' : ''} utilisé${creditsCost > 1 ? 's' : ''}.`,
      requiredCredits: creditsCost,
      currentCredits: userContext.creditsBalance
    };
  }

  private static async getServiceConfig(serviceCode: ServiceCode): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('ia_service_config')
        .select('*')
        .eq('service_code', serviceCode)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching service config:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getServiceConfig:', error);
      return null;
    }
  }

  private static async checkPremiumQuota(
    userId: string,
    serviceCode: ServiceCode,
    serviceConfig: any
  ): Promise<IAAccessResult> {
    if (!serviceConfig.enable_premium_limits) {
      return {
        allowed: true,
        reason: 'access_granted',
        message: `✓ Accès illimité ! Service "${serviceConfig.service_name}" inclus dans votre Premium. 🎉`
      };
    }

    const dailyLimit = serviceConfig.premium_daily_limit;

    if (!dailyLimit || dailyLimit <= 0) {
      return {
        allowed: true,
        reason: 'access_granted',
        message: `✓ Accès illimité ! Service "${serviceConfig.service_name}" inclus dans votre Premium. 🎉`
      };
    }

    const usageToday = await this.getTodayUsageCount(userId, serviceCode);

    if (usageToday >= dailyLimit) {
      return {
        allowed: false,
        reason: 'premium_quota_reached',
        message: `Vous avez atteint votre quota quotidien (${dailyLimit} utilisations). Ça se réinitialise à minuit ! ⏰`,
        dailyActionsUsed: usageToday,
        dailyLimit: dailyLimit,
        suggestedAction: 'wait_reset'
      };
    }

    return {
      allowed: true,
      reason: 'access_granted',
      message: `✓ C'est parti ! ${usageToday}/${dailyLimit} utilisations aujourd'hui.`,
      dailyActionsUsed: usageToday,
      dailyLimit: dailyLimit
    };
  }

  private static async getTodayUsageCount(
    userId: string,
    serviceCode: ServiceCode
  ): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('ai_service_usage_history')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('service_code', serviceCode)
        .gte('created_at', today.toISOString());

      if (error) {
        console.error('Error fetching usage count:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error in getTodayUsageCount:', error);
      return 0;
    }
  }

  static async buildEnhancedUserContext(
    userId: string | null,
    profile: any
  ): Promise<EnhancedUserContext> {
    if (!userId || !profile) {
      return {
        userId: null,
        isAuthenticated: false,
        isPremium: false,
        isPremiumActive: false,
        premiumExpiration: null,
        creditsBalance: 0,
        daysRemainingPremium: null,
        userType: null
      };
    }

    const isPremiumStatus = isPremiumActive({
      is_premium: profile.is_premium,
      premium_expiration: profile.premium_expiration
    });

    let daysRemaining = null;
    if (profile.is_premium && profile.premium_expiration) {
      const now = new Date();
      const expiration = new Date(profile.premium_expiration);
      const diffTime = expiration.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysRemaining = Math.max(0, daysRemaining);
    }

    return {
      userId,
      isAuthenticated: true,
      isPremium: profile.is_premium || false,
      isPremiumActive: isPremiumStatus,
      premiumExpiration: profile.premium_expiration,
      creditsBalance: profile.credits_balance || 0,
      daysRemainingPremium: daysRemaining,
      userType: profile.user_type
    };
  }

  static formatAccessMessage(result: IAAccessResult): string {
    return result.message;
  }

  static getActionButtons(result: IAAccessResult): Array<{
    label: string;
    action: string;
    variant: 'primary' | 'secondary';
  }> {
    if (result.allowed) {
      return [];
    }

    const buttons: Array<{
      label: string;
      action: string;
      variant: 'primary' | 'secondary';
    }> = [];

    switch (result.suggestedAction) {
      case 'login':
        buttons.push({
          label: 'Se connecter',
          action: 'navigate:auth',
          variant: 'primary'
        });
        break;

      case 'buy_credits':
        buttons.push({
          label: 'Acheter des crédits',
          action: 'navigate:credit-store',
          variant: 'primary'
        });
        buttons.push({
          label: 'Passer Premium PRO+',
          action: 'navigate:premium-subscribe',
          variant: 'secondary'
        });
        break;

      case 'subscribe_premium':
        buttons.push({
          label: 'Découvrir Premium PRO+',
          action: 'navigate:premium-subscribe',
          variant: 'primary'
        });
        break;

      case 'renew_premium':
        buttons.push({
          label: 'Renouveler Premium',
          action: 'navigate:premium-subscribe',
          variant: 'primary'
        });
        break;

      case 'wait_reset':
        buttons.push({
          label: 'Voir d\'autres services',
          action: 'navigate:premium-ai-services',
          variant: 'secondary'
        });
        break;
    }

    return buttons;
  }

  static getAccessDeniedEmoji(reason: IAAccessResult['reason']): string {
    const emojis: Record<string, string> = {
      not_authenticated: '🔒',
      insufficient_credits: '💰',
      premium_quota_reached: '⏰',
      service_inactive: '⚠️',
      premium_expired: '👑',
      service_not_found: '❌',
      access_granted: '✓'
    };

    return emojis[reason] || '❌';
  }
}
