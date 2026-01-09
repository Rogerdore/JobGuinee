import { supabase } from '../lib/supabase';

export interface PlatformConfig {
  id: string;
  platform: 'facebook' | 'linkedin' | 'twitter' | 'whatsapp';
  is_enabled: boolean;
  auto_share_enabled: boolean;
  post_template: string;
  credentials: {
    [key: string]: string;
  };
  settings: {
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface PlatformCredentials {
  facebook?: {
    page_id: string;
    app_id: string;
    app_secret: string;
    access_token: string;
    token_expires_at?: string;
  };
  linkedin?: {
    client_id: string;
    client_secret: string;
    access_token: string;
    token_expires_at?: string;
    organization_id?: string;
  };
  twitter?: {
    api_key: string;
    api_secret: string;
    bearer_token: string;
    access_token?: string;
    access_token_secret?: string;
  };
  whatsapp?: {
    business_account_id: string;
    phone_number_id: string;
    access_token: string;
  };
}

export const socialShareConfigService = {
  async getAllPlatforms(): Promise<PlatformConfig[]> {
    const { data, error } = await supabase
      .from('social_platforms_config')
      .select('*')
      .order('platform');

    if (error) throw error;
    return data || [];
  },

  async getPlatform(platform: string): Promise<PlatformConfig | null> {
    const { data, error } = await supabase
      .from('social_platforms_config')
      .select('*')
      .eq('platform', platform)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getEnabledPlatforms(): Promise<PlatformConfig[]> {
    const { data, error } = await supabase
      .from('social_platforms_config')
      .select('*')
      .eq('is_enabled', true)
      .order('platform');

    if (error) throw error;
    return data || [];
  },

  async updatePlatform(
    platform: string,
    updates: Partial<Omit<PlatformConfig, 'id' | 'platform' | 'created_at' | 'updated_at'>>
  ): Promise<void> {
    const { error } = await supabase
      .from('social_platforms_config')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('platform', platform);

    if (error) throw error;
  },

  async togglePlatform(platform: string, isEnabled: boolean): Promise<void> {
    await this.updatePlatform(platform, { is_enabled: isEnabled });
  },

  async toggleAutoShare(platform: string, autoShareEnabled: boolean): Promise<void> {
    await this.updatePlatform(platform, { auto_share_enabled: autoShareEnabled });
  },

  async updateCredentials(platform: string, credentials: any): Promise<void> {
    await this.updatePlatform(platform, { credentials });
  },

  async updateTemplate(platform: string, template: string): Promise<void> {
    await this.updatePlatform(platform, { post_template: template });
  },

  async testConnection(platform: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('test-social-connection', {
        body: { platform },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return data || { success: false, error: 'Unknown error' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async getTemplate(platform: string): Promise<string> {
    const config = await this.getPlatform(platform);
    return config?.post_template || '';
  },

  async getAutoShareStatus(): Promise<{
    [key: string]: {
      is_enabled: boolean;
      auto_share_enabled: boolean;
    };
  }> {
    const platforms = await this.getAllPlatforms();
    const status: any = {};

    platforms.forEach(platform => {
      status[platform.platform] = {
        is_enabled: platform.is_enabled,
        auto_share_enabled: platform.auto_share_enabled,
      };
    });

    return status;
  },

  hasValidCredentials(config: PlatformConfig): boolean {
    if (!config.credentials || typeof config.credentials !== 'object') {
      return false;
    }

    const creds = config.credentials;

    switch (config.platform) {
      case 'facebook':
        return !!(creds.page_id && creds.access_token);
      case 'linkedin':
        return !!creds.access_token;
      case 'twitter':
        return !!creds.bearer_token;
      case 'whatsapp':
        return !!(creds.business_account_id && creds.access_token);
      default:
        return false;
    }
  },
};
