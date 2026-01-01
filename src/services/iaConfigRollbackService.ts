import { supabase } from '../lib/supabase';
import { IAConfigCacheService } from './iaConfigCacheService';

export interface RollbackResult {
  success: boolean;
  message: string;
  new_version?: number;
  previous_version?: number;
  target_version?: number;
}

export interface VersionDiff {
  success: boolean;
  diff?: {
    base_prompt_changed: boolean;
    instructions_changed: boolean;
    model_changed: boolean;
    temperature_changed: boolean;
    max_tokens_changed: boolean;
    version_1: any;
    version_2: any;
  };
  message?: string;
}

export class IAConfigRollbackService {
  static async rollbackConfig(
    serviceCode: string,
    targetVersion: number,
    reason?: string
  ): Promise<RollbackResult> {
    try {
      const { data, error } = await supabase.rpc('rollback_ia_service_config', {
        p_service_code: serviceCode,
        p_target_version: targetVersion,
        p_rollback_reason: reason || 'Rollback vers version précédente'
      });

      if (error) {
        console.error('Rollback error:', error);
        return {
          success: false,
          message: `Erreur: ${error.message}`
        };
      }

      if (data.success) {
        IAConfigCacheService.clearCache(serviceCode);
      }

      return data as RollbackResult;
    } catch (error) {
      console.error('Rollback exception:', error);
      return {
        success: false,
        message: `Exception: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }

  static async compareVersions(
    serviceCode: string,
    version1: number,
    version2: number
  ): Promise<VersionDiff> {
    try {
      const { data, error } = await supabase.rpc('get_config_version_diff', {
        p_service_code: serviceCode,
        p_version_1: version1,
        p_version_2: version2
      });

      if (error) {
        console.error('Compare versions error:', error);
        return {
          success: false,
          message: `Erreur: ${error.message}`
        };
      }

      return data as VersionDiff;
    } catch (error) {
      console.error('Compare versions exception:', error);
      return {
        success: false,
        message: `Exception: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }

  static async getVersionHistory(serviceCode: string, limit: number = 20) {
    const { data, error } = await supabase
      .from('ia_service_config_history')
      .select(`
        *,
        changed_by_profile:profiles!ia_service_config_history_changed_by_fkey(
          full_name,
          email
        )
      `)
      .eq('service_code', serviceCode)
      .order('new_version', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching history:', error);
      return [];
    }

    return data || [];
  }

  static formatChanges(fieldChanges: any): string[] {
    if (!fieldChanges) return [];

    const changes: string[] = [];

    if (fieldChanges.rollback_to) {
      changes.push(`Rollback vers version ${fieldChanges.rollback_to}`);
      return changes;
    }

    Object.keys(fieldChanges).forEach(key => {
      const change = fieldChanges[key];
      if (change.old !== change.new) {
        changes.push(`${key}: "${change.old}" → "${change.new}"`);
      }
    });

    return changes;
  }
}
