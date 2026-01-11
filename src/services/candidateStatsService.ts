import { supabase } from '../lib/supabase';

/**
 * SYSTÈME SÉCURISÉ DE STATISTIQUES CANDIDAT
 *
 * RÈGLES MÉTIER STRICTES:
 * - Tous les compteurs sont gérés côté BACKEND uniquement
 * - Aucun incrément direct depuis le frontend
 * - Toutes les actions passent par des fonctions RPC sécurisées
 * - Anti-spam intégré avec fenêtres temporelles
 * - Traçabilité complète dans candidate_stats_logs
 */

export interface CandidateStats {
  jobViewsCount: number;
  applicationsCount: number;
  profileViewsCount: number;
  profilePurchasesCount: number;
  formationsCount: number;
  aiScore: number;
  aiScoreVersion: string;
  aiScoreUpdatedAt: string | null;
  creditsBalance: number;
  isPremium: boolean;
  unreadMessagesCount: number;
  updatedAt: string;
}

export const candidateStatsService = {
  /**
   * Get all candidate statistics from backend
   * Uses RPC function that returns validated, aggregated stats
   * SOURCE UNIQUE DE VÉRITÉ
   */
  async getAllStats(userId: string): Promise<CandidateStats | null> {
    try {
      // Appeler la fonction RPC backend qui retourne toutes les stats agrégées
      const { data, error } = await supabase.rpc('get_candidate_stats', {
        p_candidate_id: userId
      });

      if (error) {
        console.error('Error fetching candidate stats:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      return {
        jobViewsCount: data.job_views_count || 0,
        applicationsCount: data.applications_count || 0,
        profileViewsCount: data.profile_views_count || 0,
        profilePurchasesCount: data.purchases_count || 0,
        formationsCount: data.formations_count || 0,
        aiScore: data.ai_score || 0,
        aiScoreVersion: data.ai_score_version || 'v1.0',
        aiScoreUpdatedAt: data.ai_score_updated_at || null,
        creditsBalance: data.credits_balance || 0,
        isPremium: data.is_premium || false,
        unreadMessagesCount: 0, // Will be set separately via real-time
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error fetching candidate stats:', error);
      return null;
    }
  },

  /**
   * Track a job view via Edge Function (anti-spam + validation backend)
   * RÈGLE: Tracking backend uniquement, anti-spam 1h
   */
  async trackJobView(jobId: string, sessionId?: string): Promise<{ success: boolean; status?: string; message?: string }> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Appeler l'Edge Function qui gère l'anti-spam et la validation
      const response = await fetch(`${supabaseUrl}/functions/v1/track-job-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          job_id: jobId,
          session_id: sessionId || `session_${Date.now()}_${Math.random().toString(36)}`
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error tracking job view:', result);
        return { success: false, ...result };
      }

      return result;
    } catch (error: any) {
      console.error('Error in trackJobView:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Track profile preview click (CVTHÈQUE UNIQUEMENT)
   * RÈGLE CRITIQUE: Comptage UNIQUEMENT sur clic bouton "Aperçu"
   * Anti-spam: 24h
   */
  async trackProfilePreviewClick(
    candidateId: string,
    sessionId?: string
  ): Promise<{ success: boolean; status?: string; message?: string }> {
    try {
      // Appeler la fonction RPC backend sécurisée
      const { data, error } = await supabase.rpc('track_profile_preview_click', {
        p_candidate_id: candidateId,
        p_session_id: sessionId || `session_${Date.now()}_${Math.random().toString(36)}`,
        p_ip_hash: null, // Edge Function gère le hash IP
        p_user_agent: navigator.userAgent
      });

      if (error) {
        console.error('Error tracking profile preview:', error);
        return { success: false, message: error.message };
      }

      return data;
    } catch (error: any) {
      console.error('Error in trackProfilePreviewClick:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Recalculate AI score (backend calculation)
   * RÈGLE: Calcul exclusivement backend, versionné
   */
  async recalculateAIScore(candidateId: string): Promise<{ success: boolean; ai_score?: number }> {
    try {
      const { data, error } = await supabase.rpc('calculate_ai_score_backend', {
        p_candidate_id: candidateId
      });

      if (error) {
        console.error('Error calculating AI score:', error);
        return { success: false };
      }

      return data;
    } catch (error) {
      console.error('Error in recalculateAIScore:', error);
      return { success: false };
    }
  },

  /**
   * Enroll user in a formation
   */
  async enrollInFormation(
    userId: string,
    formationId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('formation_enrollments')
        .insert({
          user_id: userId,
          formation_id: formationId,
          status: 'enrolled',
          progress: 0
        });

      if (error) {
        // Check if already enrolled (unique constraint)
        if (error.code === '23505') {
          return { success: false, error: 'Vous êtes déjà inscrit à cette formation' };
        }
        console.error('Error enrolling in formation:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in enrollInFormation:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update formation progress
   */
  async updateFormationProgress(
    userId: string,
    formationId: string,
    progress: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        progress,
        updated_at: new Date().toISOString()
      };

      // If progress is 100%, mark as completed
      if (progress >= 100) {
        updateData.status = 'completed';
        updateData.completed_at = new Date().toISOString();
      } else if (progress > 0) {
        updateData.status = 'in_progress';
      }

      const { error } = await supabase
        .from('formation_enrollments')
        .update(updateData)
        .eq('user_id', userId)
        .eq('formation_id', formationId);

      if (error) {
        console.error('Error updating formation progress:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in updateFormationProgress:', error);
      return { success: false, error: error.message };
    }
  }
};
