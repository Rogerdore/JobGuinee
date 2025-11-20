import { supabase } from '../lib/supabase';

export interface ServiceAccessInfo {
  hasAccess: boolean;
  isGrantedByAdmin: boolean;
  isExpired: boolean;
  expiresAt: string | null;
  needsCredits: boolean;
}

export async function checkServiceAccess(
  userId: string,
  serviceCode: string
): Promise<ServiceAccessInfo> {
  try {
    const { data, error } = await supabase.rpc('user_has_service_access', {
      p_user_id: userId,
      p_service_code: serviceCode
    });

    if (error) {
      console.error('Error checking service access:', error);
      return {
        hasAccess: false,
        isGrantedByAdmin: false,
        isExpired: false,
        expiresAt: null,
        needsCredits: true
      };
    }

    const hasAdminAccess = data === true;

    if (hasAdminAccess) {
      const { data: accessData } = await supabase
        .from('user_service_access')
        .select('expires_at, is_active')
        .eq('user_id', userId)
        .eq('service_code', serviceCode)
        .single();

      const isExpired = accessData?.expires_at
        ? new Date(accessData.expires_at) < new Date()
        : false;

      return {
        hasAccess: true,
        isGrantedByAdmin: true,
        isExpired,
        expiresAt: accessData?.expires_at || null,
        needsCredits: false
      };
    }

    return {
      hasAccess: false,
      isGrantedByAdmin: false,
      isExpired: false,
      expiresAt: null,
      needsCredits: true
    };
  } catch (error) {
    console.error('Error in checkServiceAccess:', error);
    return {
      hasAccess: false,
      isGrantedByAdmin: false,
      isExpired: false,
      expiresAt: null,
      needsCredits: true
    };
  }
}

export async function getUserServiceAccessList(userId: string): Promise<Record<string, ServiceAccessInfo>> {
  try {
    const { data: accessList } = await supabase
      .from('user_service_access')
      .select('service_code, is_active, expires_at')
      .eq('user_id', userId)
      .eq('is_active', true);

    const serviceAccessMap: Record<string, ServiceAccessInfo> = {};

    if (accessList) {
      for (const access of accessList) {
        const isExpired = access.expires_at
          ? new Date(access.expires_at) < new Date()
          : false;

        serviceAccessMap[access.service_code] = {
          hasAccess: !isExpired,
          isGrantedByAdmin: true,
          isExpired,
          expiresAt: access.expires_at,
          needsCredits: isExpired
        };
      }
    }

    return serviceAccessMap;
  } catch (error) {
    console.error('Error getting user service access list:', error);
    return {};
  }
}
