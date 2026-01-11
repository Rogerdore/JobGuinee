import { supabase } from '../lib/supabase';

/**
 * SERVICE DE SCORING CV - BACKEND FIRST (CONFORMITÉ TOTALE)
 *
 * RÈGLES MÉTIER RESPECTÉES:
 * 1. BACKEND FIRST - Tous calculs via RPC calculate_ai_score_backend_v2()
 * 2. SOURCE DE VÉRITÉ UNIQUE - Score stocké dans candidate_stats
 * 3. TRAÇABILITÉ TOTALE - Logs dans candidate_stats_logs
 * 4. AUCUNE VALEUR SANS COÛT - Si IA premium utilisée, vérification crédits
 * 5. VERSIONING - ai_score_version dans DB
 * 6. EXPLICABILITÉ - ai_score_breakdown (JSON détaillé)
 *
 * ⚠️ AUCUN CALCUL FRONTEND - VIOLATION INTERDITE
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
   * RÈGLE: BACKEND ONLY via RPC calculate_ai_score_backend_v2()
   *
   * ⚠️ CONFORMITÉ: Respecte Principe 1 (Backend First)
   */
  async calculateProfileScore(
    candidateId: string,
    profileData: ProfileScoringInput
  ): Promise<ScoringResult> {
    try {
      // Appel RPC backend (OBLIGATOIRE - Principe 1)
      const { data, error } = await supabase.rpc('calculate_ai_score_backend_v2', {
        p_candidate_id: candidateId,
        p_experience_years: profileData.experienceYears || 0,
        p_education_level: profileData.educationLevel || 'bac',
        p_skills: profileData.skills || [],
        p_is_verified: profileData.isVerified || false,
        p_is_gold: profileData.isGold || false,
        p_profile_completion: profileData.profileCompletion || 80
      });

      if (error) {
        console.error('Backend scoring error:', error);
        throw error;
      }

      if (!data || !data.success) {
        throw new Error('Score calculation failed');
      }

      return {
        score: data.score,
        breakdown: {
          experienceScore: data.breakdown.cv_quality, // Backend calcule différemment
          educationScore: data.breakdown.cv_quality,
          skillsScore: data.breakdown.activity,
          verificationScore: data.breakdown.activity,
          completionScore: data.breakdown.profile_completion
        },
        reasoning: `Score calculé par backend v${data.version}`,
        source: 'backend'
      };
    } catch (error) {
      console.error('Scoring error:', error);
      // EN CAS D'ERREUR: Retourner score minimal, PAS de calcul local
      return {
        score: 60, // Score minimal par défaut
        source: 'error_fallback',
        reasoning: 'Erreur de calcul backend - score minimal attribué'
      };
    }
  }

  /**
   * Récupère le score existant depuis la base de données
   * RÈGLE: Lecture seule depuis source de vérité (candidate_stats)
   */
  async getExistingScore(candidateId: string): Promise<ScoringResult | null> {
    try {
      const { data, error } = await supabase.rpc('get_full_candidate_stats', {
        p_candidate_id: candidateId
      });

      if (error || !data || !data.success) {
        return null;
      }

      return {
        score: data.ai_score || 0,
        breakdown: {
          experienceScore: data.ai_score_breakdown?.cv_quality || 0,
          educationScore: data.ai_score_breakdown?.cv_quality || 0,
          skillsScore: data.ai_score_breakdown?.activity || 0,
          verificationScore: data.ai_score_breakdown?.activity || 0,
          completionScore: data.ai_score_breakdown?.profile_completion || 0
        },
        reasoning: `Score backend v${data.ai_score_version}`,
        source: 'database'
      };
    } catch (error) {
      console.error('Error fetching existing score:', error);
      return null;
    }
  }

  /**
   * ⚠️ FONCTION SUPPRIMÉE - VIOLATION Principe 1 (Backend First)
   *
   * L'ancien calcul local était une VIOLATION du principe "Backend First".
   * Tous les calculs DOIVENT se faire côté backend via RPC.
   *
   * Si vous voyez cette fonction utilisée quelque part, c'est une ERREUR.
   * Utilisez calculateProfileScore() ou getExistingScore() à la place.
   */

  /**
   * Calcule le score pour plusieurs profils en batch
   * RÈGLE: Appelle RPC backend pour chaque profil
   *
   * ⚠️ CONFORMITÉ: Pas de calcul local, même pour le batch
   */
  async calculateBatchScores(
    profiles: Array<{ candidateId: string; data: ProfileScoringInput }>
  ): Promise<ScoringResult[]> {
    // Appel backend pour CHAQUE profil (Principe 1)
    const promises = profiles.map(({ candidateId, data }) =>
      this.calculateProfileScore(candidateId, data)
    );

    return Promise.all(promises);
  }

  /**
   * Vérifie l'historique des calculs de score d'un candidat
   * RÈGLE: Lecture depuis candidate_stats_logs (traçabilité)
   */
  async getScoreHistory(candidateId: string, limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('candidate_stats_logs')
        .select('*')
        .eq('candidate_id', candidateId)
        .eq('stat_type', 'ai_score_update')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching score history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getScoreHistory:', error);
      return [];
    }
  }
}

export const cvScoringService = new CVScoringService();
