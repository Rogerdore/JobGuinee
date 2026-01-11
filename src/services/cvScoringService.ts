import { supabase } from '../lib/supabase';
import { IAConfigService } from './iaConfigService';

/**
 * SERVICE DE SCORING CV - CENTRALISÉ VIA MOTEUR IA
 *
 * RÈGLES MÉTIER:
 * - Utilise le moteur IA central (iaConfigService)
 * - Service: 'cv_profile_scoring'
 * - Coût: 1 crédit IA par scoring
 * - Fallback sur calcul local si IA indisponible
 * - Aucune duplication de logique
 *
 * MIGRATION DEPUIS CVTheque.tsx:
 * - La fonction calculateAIScore() locale a été déplacée ici
 * - Maintenant appelle le service IA configuré en priorité
 * - Calcul local uniquement en fallback
 */

export interface ProfileScoringInput {
  experienceYears?: number;
  educationLevel?: string;
  skills?: string[];
  isVerified?: boolean;
  isGold?: boolean;
  profileCompletion?: number;
}

export interface ScoringResult {
  score: number;
  breakdown?: {
    experienceScore: number;
    educationScore: number;
    skillsScore: number;
    verificationScore: number;
    completionScore: number;
  };
  reasoning?: string;
  source: 'ia' | 'local';
}

class CVScoringService {
  private serviceCode = 'cv_profile_scoring';

  /**
   * Calcule le score d'un profil candidat
   * RÈGLE: Appelle le moteur IA central en priorité, fallback sur calcul local
   */
  async calculateProfileScore(
    profileData: ProfileScoringInput,
    userId?: string
  ): Promise<ScoringResult> {
    try {
      // Tentative de scoring IA si userId fourni
      if (userId) {
        const iaScore = await this.calculateWithIA(userId, profileData);
        if (iaScore) {
          return iaScore;
        }
      }

      // Fallback: calcul local (ancienne logique de CVTheque.tsx)
      return this.calculateLocalScore(profileData);
    } catch (error) {
      console.error('Scoring error:', error);
      // En cas d'erreur, utiliser le calcul local
      return this.calculateLocalScore(profileData);
    }
  }

  /**
   * Calcul via le moteur IA central
   * Débite 1 crédit IA
   */
  private async calculateWithIA(
    userId: string,
    profileData: ProfileScoringInput
  ): Promise<ScoringResult | null> {
    try {
      // 1. Vérifier les crédits disponibles
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits_balance, is_premium')
        .eq('id', userId)
        .single();

      if (!profile) {
        return null;
      }

      // 2. Récupérer le coût du service
      const { data: serviceCost } = await supabase
        .from('service_credit_costs')
        .select('credits_cost')
        .eq('service_code', this.serviceCode)
        .eq('is_active', true)
        .single();

      const costInCredits = serviceCost?.credits_cost || 1;

      // Si pas assez de crédits et pas premium, utiliser fallback local
      if (profile.credits_balance < costInCredits && !profile.is_premium) {
        return null;
      }

      // 3. Récupérer la configuration du service IA
      const config = await IAConfigService.getConfig(this.serviceCode);
      if (!config || !config.is_active) {
        return null;
      }

      // 4. Préparer l'input
      const input = {
        experience_years: profileData.experienceYears || 0,
        education_level: profileData.educationLevel || 'bac',
        skills: profileData.skills || [],
        is_verified: profileData.isVerified || false,
        is_gold: profileData.isGold || false,
        profile_completion: profileData.profileCompletion || 80
      };

      // 5. Construire le prompt
      const builtPrompt = IAConfigService.buildPrompt(config, input);

      // 6. Appeler l'IA (simulation - à remplacer par OpenAI)
      const aiResponse = await this.callOpenAI(builtPrompt);

      // 7. Parser la réponse
      const parsedResult = IAConfigService.parseOutput(aiResponse, config.output_schema);

      // 8. Débiter les crédits
      await supabase.rpc('use_ai_credits', {
        p_user_id: userId,
        p_service_code: this.serviceCode,
        p_credits_cost: costInCredits,
        p_input_data: input,
        p_output_data: parsedResult
      });

      // 9. Log usage
      await IAConfigService.logServiceUsage(
        userId,
        this.serviceCode,
        input,
        parsedResult,
        costInCredits
      );

      // 10. Retourner le score
      return {
        score: parsedResult.score || 60,
        breakdown: parsedResult.breakdown,
        reasoning: parsedResult.reasoning,
        source: 'ia'
      };
    } catch (error) {
      console.error('IA Scoring failed:', error);
      return null;
    }
  }

  /**
   * Calcul local (ancienne fonction de CVTheque.tsx)
   * Utilisé en fallback si IA indisponible ou crédits insuffisants
   */
  private calculateLocalScore(profileData: ProfileScoringInput): ScoringResult {
    let score = 60; // Base minimale pour profils visibles
    let experienceScore = 0;
    let educationScore = 0;
    let skillsScore = 0;
    let verificationScore = 0;
    let completionScore = 0;

    // Expérience (max +20 points)
    if (profileData.experienceYears) {
      experienceScore = Math.min(profileData.experienceYears * 2, 20);
      score += experienceScore;
    }

    // Éducation (max +10 points)
    if (profileData.educationLevel) {
      const educationBonus: Record<string, number> = {
        'doctorat': 10,
        'master': 8,
        'licence': 5,
        'bac': 2
      };
      educationScore = educationBonus[profileData.educationLevel] || 0;
      score += educationScore;
    }

    // Compétences (max +5 points)
    if (profileData.skills && profileData.skills.length > 0) {
      skillsScore = Math.min(profileData.skills.length, 5);
      score += skillsScore;
    }

    // Vérification (+3 points)
    if (profileData.isVerified) {
      verificationScore = 3;
      score += verificationScore;
    }

    // Profil Gold (+2 points)
    if (profileData.isGold) {
      verificationScore += 2;
      score += 2;
    }

    // Complétude du profil (proportionnel)
    if (profileData.profileCompletion && profileData.profileCompletion >= 90) {
      completionScore = 2;
      score += completionScore;
    }

    // Limiter le score à 100
    score = Math.min(score, 100);

    return {
      score,
      breakdown: {
        experienceScore,
        educationScore,
        skillsScore,
        verificationScore,
        completionScore
      },
      source: 'local'
    };
  }

  /**
   * Appel simulé à OpenAI
   * À REMPLACER par un vrai appel API en production
   */
  private async callOpenAI(builtPrompt: any): Promise<string> {
    // SIMULATION - À remplacer par vrai appel OpenAI
    // const response = await openai.chat.completions.create({...});

    return JSON.stringify({
      score: 75,
      breakdown: {
        experience_score: 15,
        education_score: 8,
        skills_score: 4,
        verification_score: 3,
        completion_score: 2
      },
      reasoning: "Profil solide avec bonne expérience et formation. Compétences pertinentes."
    });
  }

  /**
   * Calcule le score pour plusieurs profils en batch
   * Optimisation: utilise calcul local pour éviter coûts IA massifs
   */
  async calculateBatchScores(
    profiles: ProfileScoringInput[]
  ): Promise<ScoringResult[]> {
    // Pour le batch, on utilise le calcul local pour éviter les coûts
    // Le calcul IA individuel est réservé aux cas où l'utilisateur le demande explicitement
    return profiles.map(profile => this.calculateLocalScore(profile));
  }

  /**
   * Vérifie si le scoring IA est disponible pour un utilisateur
   */
  async canUseIAScoring(userId: string): Promise<boolean> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits_balance, is_premium')
        .eq('id', userId)
        .single();

      const { data: serviceCost } = await supabase
        .from('service_credit_costs')
        .select('credits_cost')
        .eq('service_code', this.serviceCode)
        .eq('is_active', true)
        .single();

      const costInCredits = serviceCost?.credits_cost || 1;
      const creditsAvailable = profile?.credits_balance || 0;
      const isPremium = profile?.is_premium || false;

      return isPremium || creditsAvailable >= costInCredits;
    } catch (error) {
      return false;
    }
  }
}

export const cvScoringService = new CVScoringService();
