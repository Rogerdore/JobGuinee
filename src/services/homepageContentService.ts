import { supabase } from '../lib/supabase';

export interface VideoSettings {
  id?: string;
  is_enabled: boolean;
  video_url?: string;
  video_file_url?: string;
  thumbnail_url?: string;
  title: string;
  description: string;
  layout: 'left' | 'right';
  background_color: string;
  created_at?: string;
  updated_at?: string;
}

export interface Guide {
  id?: string;
  title: string;
  description?: string;
  category: 'candidate' | 'recruiter' | 'trainer' | 'ia' | 'general';
  icon: string;
  file_url: string;
  file_type: 'pdf' | 'external_link';
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export const homepageContentService = {
  async getVideoSettings(): Promise<VideoSettings | null> {
    try {
      const { data, error } = await supabase
        .from('homepage_video_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching video settings:', error);
      return null;
    }
  },

  async updateVideoSettings(settings: Partial<VideoSettings>): Promise<boolean> {
    try {
      const existing = await this.getVideoSettings();

      if (existing) {
        const { error } = await supabase
          .from('homepage_video_settings')
          .update({ ...settings, updated_at: new Date().toISOString() })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('homepage_video_settings')
          .insert([settings]);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error updating video settings:', error);
      return false;
    }
  },

  async getAllGuides(): Promise<Guide[]> {
    try {
      const { data, error } = await supabase
        .from('homepage_guides')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all guides:', error);
      return [];
    }
  },

  async getActiveGuides(userRole?: 'candidate' | 'recruiter' | 'trainer' | null): Promise<Guide[]> {
    try {
      const { data, error } = await supabase
        .from('homepage_guides')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      const guides = data || [];

      if (!userRole) {
        return guides.filter(g => g.category === 'general');
      }

      const allowedCategories = ['general'];
      if (userRole === 'candidate') {
        allowedCategories.push('candidate', 'ia');
      } else if (userRole === 'recruiter') {
        allowedCategories.push('recruiter');
      } else if (userRole === 'trainer') {
        allowedCategories.push('trainer');
      }

      return guides.filter(g => allowedCategories.includes(g.category));
    } catch (error) {
      console.error('Error fetching active guides:', error);
      return [];
    }
  },

  async createGuide(guide: Omit<Guide, 'id' | 'created_at' | 'updated_at'>): Promise<Guide | null> {
    try {
      const { data, error } = await supabase
        .from('homepage_guides')
        .insert([guide])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating guide:', error);
      return null;
    }
  },

  async updateGuide(id: string, updates: Partial<Guide>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('homepage_guides')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating guide:', error);
      return false;
    }
  },

  async deleteGuide(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('homepage_guides')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting guide:', error);
      return false;
    }
  },

  async reorderGuides(guides: { id: string; display_order: number }[]): Promise<boolean> {
    try {
      for (const guide of guides) {
        await supabase
          .from('homepage_guides')
          .update({ display_order: guide.display_order })
          .eq('id', guide.id);
      }
      return true;
    } catch (error) {
      console.error('Error reordering guides:', error);
      return false;
    }
  },

  async uploadVideo(file: File, userId: string): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('homepage-videos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('homepage-videos')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading video:', error);
      return null;
    }
  },

  async uploadThumbnail(file: File, userId: string): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('homepage-thumbnails')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('homepage-thumbnails')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      return null;
    }
  },

  async uploadGuidePDF(file: File, userId: string): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('homepage-guides')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('homepage-guides')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading guide PDF:', error);
      return null;
    }
  }
};
