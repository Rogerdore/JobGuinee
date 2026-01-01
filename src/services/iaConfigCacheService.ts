import { supabase } from '../lib/supabase';

interface CachedConfig {
  config: any;
  timestamp: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

export class IAConfigCacheService {
  private static configCache = new Map<string, CachedConfig>();
  private static templateCache = new Map<string, CachedConfig>();
  private static CACHE_TTL = 5 * 60 * 1000;
  private static stats: CacheStats = { hits: 0, misses: 0, size: 0 };

  static async getConfig(serviceCode: string): Promise<any | null> {
    const cached = this.configCache.get(serviceCode);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.stats.hits++;
      return cached.config;
    }

    this.stats.misses++;
    const config = await this.fetchConfigFromDB(serviceCode);

    if (config) {
      this.configCache.set(serviceCode, {
        config,
        timestamp: Date.now()
      });
      this.stats.size = this.configCache.size;
    }

    return config;
  }

  static async getTemplates(serviceCode: string, premiumOnly: boolean = false): Promise<any[]> {
    const cacheKey = `${serviceCode}_${premiumOnly}`;
    const cached = this.templateCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.stats.hits++;
      return cached.config;
    }

    this.stats.misses++;
    const templates = await this.fetchTemplatesFromDB(serviceCode, premiumOnly);

    if (templates) {
      this.templateCache.set(cacheKey, {
        config: templates,
        timestamp: Date.now()
      });
      this.stats.size = this.configCache.size + this.templateCache.size;
    }

    return templates;
  }

  private static async fetchConfigFromDB(serviceCode: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('ia_service_config')
      .select('*')
      .eq('service_code', serviceCode)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching config:', error);
      return null;
    }

    return data;
  }

  private static async fetchTemplatesFromDB(serviceCode: string, premiumOnly: boolean): Promise<any[]> {
    let query = supabase
      .from('ia_service_templates')
      .select('*')
      .eq('service_code', serviceCode)
      .eq('is_active', true);

    if (premiumOnly) {
      query = query.eq('is_premium', true);
    }

    const { data, error } = await query.order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching templates:', error);
      return [];
    }

    return data || [];
  }

  static clearCache(serviceCode?: string) {
    if (serviceCode) {
      this.configCache.delete(serviceCode);

      const templateKeys = Array.from(this.templateCache.keys())
        .filter(key => key.startsWith(serviceCode));
      templateKeys.forEach(key => this.templateCache.delete(key));
    } else {
      this.configCache.clear();
      this.templateCache.clear();
    }

    this.stats.size = this.configCache.size + this.templateCache.size;
  }

  static getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  static resetStats() {
    this.stats = { hits: 0, misses: 0, size: this.configCache.size + this.templateCache.size };
  }

  static preloadConfigs(serviceCodes: string[]) {
    serviceCodes.forEach(code => {
      this.getConfig(code).catch(err =>
        console.error(`Failed to preload config for ${code}:`, err)
      );
    });
  }
}
