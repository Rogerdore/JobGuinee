import { supabase } from '../lib/supabase';

export interface SiteSetting {
  id: string;
  key: string;
  value: any;
  description?: string;
  category: string;
  is_public: boolean;
  updated_at: string;
  updated_by?: string;
}

export const siteSettingsService = {
  async getSetting(key: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', key)
        .single();

      if (error) throw error;
      return data?.value;
    } catch (error) {
      console.error('Erreur lors de la récupération du paramètre:', error);
      return null;
    }
  },

  async getSettingsByCategory(category: string): Promise<SiteSetting[]> {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('category', category)
        .order('key');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error);
      return [];
    }
  },

  async getAllSettings(): Promise<SiteSetting[]> {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .order('category, key');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error);
      return [];
    }
  },

  async updateSetting(key: string, value: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({
          value,
          updated_at: new Date().toISOString()
        })
        .eq('key', key);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du paramètre:', error);
      throw error;
    }
  },

  async uploadAsset(file: File, path: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${path}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('site-assets')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Erreur lors de l\'upload du fichier:', error);
      throw error;
    }
  },

  async updateFavicon(file: File): Promise<string> {
    try {
      const publicUrl = await this.uploadAsset(file, 'favicon');
      await this.updateSetting('favicon_url', publicUrl);
      await this.updateSetting('favicon_16x16_url', publicUrl);
      await this.updateSetting('favicon_32x32_url', publicUrl);
      await this.updateSetting('apple_touch_icon_url', publicUrl);

      return publicUrl;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du favicon:', error);
      throw error;
    }
  },

  async updateLogo(file: File): Promise<string> {
    try {
      const publicUrl = await this.uploadAsset(file, 'logo');
      await this.updateSetting('site_logo_url', publicUrl);

      return publicUrl;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du logo:', error);
      throw error;
    }
  },

  async getBrandingSettings() {
    try {
      const settings = await this.getSettingsByCategory('branding');
      const brandingData: Record<string, any> = {};

      settings.forEach(setting => {
        brandingData[setting.key] = setting.value;
      });

      return brandingData;
    } catch (error) {
      console.error('Erreur lors de la récupération du branding:', error);
      return {
        favicon_url: '/favicon.png',
        site_logo_url: '/logo_jobguinee.png',
        favicon_16x16_url: '/favicon.png',
        favicon_32x32_url: '/favicon.png',
        apple_touch_icon_url: '/favicon.png'
      };
    }
  }
};
