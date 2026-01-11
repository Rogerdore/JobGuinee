import { supabase } from '../lib/supabase';

export interface PublicProfileToken {
  id: string;
  candidate_id: string;
  token: string;
  expires_at: string;
  is_revoked: boolean;
  created_for_application_id?: string;
  view_count: number;
  last_viewed_at?: string;
  allowed_sections: string[];
  custom_message?: string;
  created_at: string;
  updated_at: string;
}

export interface PublicProfileData {
  full_name: string;
  professional_title?: string;
  email?: string;
  phone?: string;
  location?: string;
  profile_photo_url?: string;
  professional_summary?: string;
  experiences: any[];
  education: any[];
  skills: any[];
  languages: any[];
  certifications: any[];
  documents: any[];
  linkedin_url?: string;
  portfolio_url?: string;
  github_url?: string;
}

class PublicProfileTokenService {
  /**
   * Génère un nouveau token public pour un profil
   */
  async generateToken(
    candidateId: string,
    applicationId?: string
  ): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('generate_public_profile_token', {
        p_candidate_id: candidateId,
        p_application_id: applicationId || null
      });

      if (error || !data) {
        return { success: false, error: 'Erreur lors de la génération du token' };
      }

      return { success: true, token: data };
    } catch (error) {
      console.error('Error generating token:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Récupère les informations d'un profil via token public
   */
  async getProfileByToken(token: string): Promise<{ success: boolean; data?: PublicProfileData; error?: string }> {
    try {
      const tokenData = await this.validateToken(token);
      if (!tokenData.valid || !tokenData.candidateId) {
        return { success: false, error: 'Token invalide ou expiré' };
      }

      await this.incrementViewCount(token);

      const profile = await this.fetchCandidateProfile(tokenData.candidateId);

      return { success: true, data: profile };
    } catch (error) {
      console.error('Error fetching public profile:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Valide un token
   */
  private async validateToken(token: string): Promise<{ valid: boolean; candidateId?: string }> {
    try {
      const { data, error } = await supabase
        .from('public_profile_tokens')
        .select('candidate_id, expires_at, is_revoked')
        .eq('token', token)
        .maybeSingle();

      if (error || !data) {
        return { valid: false };
      }

      if (data.is_revoked) {
        return { valid: false };
      }

      const expiresAt = new Date(data.expires_at);
      if (expiresAt < new Date()) {
        return { valid: false };
      }

      return { valid: true, candidateId: data.candidate_id };
    } catch (error) {
      console.error('Error validating token:', error);
      return { valid: false };
    }
  }

  /**
   * Incrémente le compteur de vues
   */
  private async incrementViewCount(token: string): Promise<void> {
    try {
      await supabase.rpc('increment_token_view_count', {
        p_token: token
      });
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  }

  /**
   * Récupère le profil complet d'un candidat
   */
  private async fetchCandidateProfile(candidateId: string): Promise<PublicProfileData> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', candidateId)
        .maybeSingle();

      const { data: candidateProfile } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('profile_id', candidateId)
        .maybeSingle();

      const { data: documents } = await supabase
        .from('candidate_documents')
        .select('*')
        .eq('profile_id', candidateId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      return {
        full_name: profile?.full_name || 'Candidat',
        email: profile?.email,
        professional_title: candidateProfile?.titre_professionnel || candidateProfile?.professional_title,
        phone: candidateProfile?.telephone || candidateProfile?.phone,
        location: candidateProfile?.lieu || candidateProfile?.location || candidateProfile?.city,
        profile_photo_url: candidateProfile?.profile_photo || candidateProfile?.profile_photo_url,
        professional_summary: candidateProfile?.resume_professionnel || candidateProfile?.bio,
        experiences: candidateProfile?.experiences || candidateProfile?.work_experience || [],
        education: candidateProfile?.formations || candidateProfile?.education || [],
        skills: candidateProfile?.competences || candidateProfile?.skills || [],
        languages: candidateProfile?.langues || candidateProfile?.languages || [],
        certifications: candidateProfile?.certifications || [],
        documents: documents || [],
        linkedin_url: candidateProfile?.linkedin_url,
        portfolio_url: candidateProfile?.portfolio_url,
        github_url: candidateProfile?.github_url
      };
    } catch (error) {
      console.error('Error fetching candidate profile:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les tokens d'un candidat
   */
  async getCandidateTokens(candidateId: string): Promise<{ success: boolean; data?: PublicProfileToken[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('public_profile_tokens')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching tokens:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Révoque un token
   */
  async revokeToken(tokenId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('public_profile_tokens')
        .update({ is_revoked: true })
        .eq('id', tokenId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error revoking token:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Génère l'URL publique pour un token
   */
  getPublicProfileURL(token: string): string {
    const baseURL = window.location.origin;
    return `${baseURL}/public/cv/${token}`;
  }

  /**
   * Nettoie les tokens expirés (pour l'admin)
   */
  async cleanupExpiredTokens(): Promise<{ success: boolean; deleted?: number; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('public_profile_tokens')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, deleted: data?.length || 0 };
    } catch (error) {
      console.error('Error cleaning up tokens:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Statistiques des tokens
   */
  async getTokenStatistics(candidateId: string): Promise<{
    total: number;
    active: number;
    expired: number;
    revoked: number;
    total_views: number;
  }> {
    try {
      const { data } = await supabase
        .from('public_profile_tokens')
        .select('expires_at, is_revoked, view_count')
        .eq('candidate_id', candidateId);

      const now = new Date();
      const stats = {
        total: data?.length || 0,
        active: 0,
        expired: 0,
        revoked: 0,
        total_views: 0
      };

      data?.forEach(token => {
        stats.total_views += token.view_count || 0;

        if (token.is_revoked) {
          stats.revoked++;
        } else if (new Date(token.expires_at) < now) {
          stats.expired++;
        } else {
          stats.active++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching token statistics:', error);
      return { total: 0, active: 0, expired: 0, revoked: 0, total_views: 0 };
    }
  }
}

export const publicProfileTokenService = new PublicProfileTokenService();
export default PublicProfileTokenService;
