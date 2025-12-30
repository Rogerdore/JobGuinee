import { supabase } from '../lib/supabase';

export interface CVVersion {
  id: string;
  profile_id: string;
  cv_title: string;
  version_number: number;
  is_active: boolean;
  is_default: boolean;
  full_name?: string;
  professional_title?: string;
  email?: string;
  phone?: string;
  location?: string;
  nationality?: string;
  professional_summary?: string;
  experiences: any[];
  education: any[];
  skills: any[];
  languages: any[];
  certifications: any[];
  projects: any[];
  linkedin_url?: string;
  portfolio_url?: string;
  github_url?: string;
  other_urls: any[];
  template_id: string;
  template_config: any;
  color_scheme: string;
  font_family: string;
  parsed_from_file?: string;
  parsing_method?: string;
  parsing_confidence_score?: number;
  raw_parsed_data?: any;
  view_count: number;
  download_count: number;
  last_viewed_at?: string;
  last_downloaded_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CVSection {
  id: string;
  cv_version_id: string;
  section_type: 'experience' | 'education' | 'skill' | 'language' | 'certification' | 'project' | 'award' | 'volunteer' | 'hobby' | 'custom';
  display_order: number;
  is_visible: boolean;
  title?: string;
  subtitle?: string;
  organization?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
  description?: string;
  achievements: any[];
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface CreateCVVersionParams {
  cv_title: string;
  template_id?: string;
  color_scheme?: string;
  font_family?: string;
  data?: Partial<CVVersion>;
}

export interface UpdateCVVersionParams {
  cv_title?: string;
  is_active?: boolean;
  is_default?: boolean;
  full_name?: string;
  professional_title?: string;
  email?: string;
  phone?: string;
  location?: string;
  nationality?: string;
  professional_summary?: string;
  experiences?: any[];
  education?: any[];
  skills?: any[];
  languages?: any[];
  certifications?: any[];
  projects?: any[];
  linkedin_url?: string;
  portfolio_url?: string;
  github_url?: string;
  other_urls?: any[];
  template_id?: string;
  template_config?: any;
  color_scheme?: string;
  font_family?: string;
}

class CVVersionService {
  /**
   * Récupérer toutes les versions CV d'un utilisateur
   */
  async getUserCVVersions(profileId: string): Promise<{ success: boolean; data?: CVVersion[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('cv_versions')
        .select('*')
        .eq('profile_id', profileId)
        .order('version_number', { ascending: false });

      if (error) {
        console.error('Error fetching CV versions:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getUserCVVersions:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Récupérer le CV actif d'un utilisateur
   */
  async getActiveCV(profileId: string): Promise<{ success: boolean; data?: CVVersion; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('cv_versions')
        .select('*')
        .eq('profile_id', profileId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching active CV:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || undefined };
    } catch (error) {
      console.error('Error in getActiveCV:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Récupérer le CV par défaut d'un utilisateur
   */
  async getDefaultCV(profileId: string): Promise<{ success: boolean; data?: CVVersion; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('cv_versions')
        .select('*')
        .eq('profile_id', profileId)
        .eq('is_default', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching default CV:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || undefined };
    } catch (error) {
      console.error('Error in getDefaultCV:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Récupérer une version CV spécifique
   */
  async getCVVersion(cvId: string): Promise<{ success: boolean; data?: CVVersion; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('cv_versions')
        .select('*')
        .eq('id', cvId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching CV version:', error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: 'CV non trouvé' };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in getCVVersion:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Créer une nouvelle version CV
   */
  async createCVVersion(
    profileId: string,
    params: CreateCVVersionParams
  ): Promise<{ success: boolean; data?: CVVersion; error?: string }> {
    try {
      const cvData = {
        profile_id: profileId,
        cv_title: params.cv_title,
        template_id: params.template_id || 'modern',
        color_scheme: params.color_scheme || 'blue',
        font_family: params.font_family || 'Inter',
        is_active: true,
        is_default: false,
        ...params.data
      };

      const { data, error } = await supabase
        .from('cv_versions')
        .insert(cvData)
        .select()
        .single();

      if (error) {
        console.error('Error creating CV version:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in createCVVersion:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Mettre à jour une version CV
   */
  async updateCVVersion(
    cvId: string,
    updates: UpdateCVVersionParams
  ): Promise<{ success: boolean; data?: CVVersion; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('cv_versions')
        .update(updates)
        .eq('id', cvId)
        .select()
        .single();

      if (error) {
        console.error('Error updating CV version:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in updateCVVersion:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Dupliquer une version CV
   */
  async duplicateCVVersion(
    cvId: string,
    newTitle?: string
  ): Promise<{ success: boolean; data?: CVVersion; error?: string }> {
    try {
      const original = await this.getCVVersion(cvId);
      if (!original.success || !original.data) {
        return { success: false, error: 'CV original non trouvé' };
      }

      const { id, version_number, created_at, updated_at, ...cvData } = original.data;

      const duplicated = {
        ...cvData,
        cv_title: newTitle || `${cvData.cv_title} (Copie)`,
        is_active: false,
        is_default: false,
        view_count: 0,
        download_count: 0,
        last_viewed_at: null,
        last_downloaded_at: null
      };

      const { data, error } = await supabase
        .from('cv_versions')
        .insert(duplicated)
        .select()
        .single();

      if (error) {
        console.error('Error duplicating CV version:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in duplicateCVVersion:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Activer une version CV (désactive les autres)
   */
  async setActiveCV(cvId: string, profileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await supabase
        .from('cv_versions')
        .update({ is_active: false })
        .eq('profile_id', profileId);

      const { error } = await supabase
        .from('cv_versions')
        .update({ is_active: true })
        .eq('id', cvId);

      if (error) {
        console.error('Error setting active CV:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in setActiveCV:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Définir un CV comme défaut
   */
  async setDefaultCV(cvId: string, profileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await supabase
        .from('cv_versions')
        .update({ is_default: false })
        .eq('profile_id', profileId);

      const { error } = await supabase
        .from('cv_versions')
        .update({ is_default: true })
        .eq('id', cvId);

      if (error) {
        console.error('Error setting default CV:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in setDefaultCV:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Archiver un CV (désactiver)
   */
  async archiveCV(cvId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('cv_versions')
        .update({ is_active: false })
        .eq('id', cvId);

      if (error) {
        console.error('Error archiving CV:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in archiveCV:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Supprimer une version CV
   */
  async deleteCVVersion(cvId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('cv_versions')
        .delete()
        .eq('id', cvId);

      if (error) {
        console.error('Error deleting CV version:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteCVVersion:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Incrémenter le compteur de vues
   */
  async incrementViewCount(cvId: string): Promise<void> {
    try {
      await supabase.rpc('increment_cv_view_count', { cv_id: cvId });
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  }

  /**
   * Incrémenter le compteur de téléchargements
   */
  async incrementDownloadCount(cvId: string): Promise<void> {
    try {
      await supabase.rpc('increment_cv_download_count', { cv_id: cvId });
    } catch (error) {
      console.error('Error incrementing download count:', error);
    }
  }

  /**
   * Récupérer les sections d'une version CV
   */
  async getCVSections(cvId: string): Promise<{ success: boolean; data?: CVSection[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('cv_sections')
        .select('*')
        .eq('cv_version_id', cvId)
        .order('display_order');

      if (error) {
        console.error('Error fetching CV sections:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getCVSections:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Ajouter une section à un CV
   */
  async addCVSection(
    cvId: string,
    section: Partial<CVSection>
  ): Promise<{ success: boolean; data?: CVSection; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('cv_sections')
        .insert({
          cv_version_id: cvId,
          ...section
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding CV section:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in addCVSection:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Mettre à jour une section
   */
  async updateCVSection(
    sectionId: string,
    updates: Partial<CVSection>
  ): Promise<{ success: boolean; data?: CVSection; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('cv_sections')
        .update(updates)
        .eq('id', sectionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating CV section:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in updateCVSection:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Supprimer une section
   */
  async deleteCVSection(sectionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('cv_sections')
        .delete()
        .eq('id', sectionId);

      if (error) {
        console.error('Error deleting CV section:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteCVSection:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Réorganiser les sections
   */
  async reorderSections(updates: { id: string; display_order: number }[]): Promise<{ success: boolean; error?: string }> {
    try {
      const promises = updates.map(({ id, display_order }) =>
        supabase
          .from('cv_sections')
          .update({ display_order })
          .eq('id', id)
      );

      await Promise.all(promises);
      return { success: true };
    } catch (error) {
      console.error('Error reordering sections:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}

export const cvVersionService = new CVVersionService();
