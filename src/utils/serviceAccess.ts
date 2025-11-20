import { supabase } from '../lib/supabase';

export interface ServiceAccessInfo {
  hasAccess: boolean;
  isGrantedByAdmin: boolean;
  isExpired: boolean;
  expiresAt: string | null;
  needsCredits: boolean;
  creditsBalance: number;
}

export async function checkServiceAccess(
  userId: string,
  serviceCode: string
): Promise<ServiceAccessInfo> {
  try {
    const { data: serviceData } = await supabase
      .from('premium_services')
      .select('id')
      .eq('code', serviceCode)
      .maybeSingle();

    if (!serviceData) {
      return {
        hasAccess: false,
        isGrantedByAdmin: false,
        isExpired: false,
        expiresAt: null,
        needsCredits: true,
        creditsBalance: 0
      };
    }

    const { data: creditsData } = await supabase
      .from('user_service_credits')
      .select('credits_balance')
      .eq('user_id', userId)
      .eq('service_id', serviceData.id)
      .maybeSingle();

    const creditsBalance = creditsData?.credits_balance || 0;

    const { data: adminAccess } = await supabase
      .from('user_service_access')
      .select('expires_at, is_active')
      .eq('user_id', userId)
      .eq('service_code', serviceCode)
      .maybeSingle();

    const hasAdminAccess = adminAccess?.is_active || false;
    const isExpired = adminAccess?.expires_at
      ? new Date(adminAccess.expires_at) < new Date()
      : false;

    const hasAccess = (hasAdminAccess && !isExpired) || creditsBalance > 0;

    return {
      hasAccess,
      isGrantedByAdmin: hasAdminAccess,
      isExpired,
      expiresAt: adminAccess?.expires_at || null,
      needsCredits: creditsBalance === 0,
      creditsBalance
    };
  } catch (error) {
    console.error('Error in checkServiceAccess:', error);
    return {
      hasAccess: false,
      isGrantedByAdmin: false,
      isExpired: false,
      expiresAt: null,
      needsCredits: true,
      creditsBalance: 0
    };
  }
}

export async function getUserServiceAccessList(userId: string): Promise<Record<string, ServiceAccessInfo>> {
  try {
    const { data: services } = await supabase
      .from('premium_services')
      .select('id, code');

    if (!services) return {};

    const { data: creditsData } = await supabase
      .from('user_service_credits')
      .select('service_id, credits_balance')
      .eq('user_id', userId);

    const creditsMap = new Map(
      (creditsData || []).map(c => [c.service_id, c.credits_balance])
    );

    const { data: accessList } = await supabase
      .from('user_service_access')
      .select('service_code, is_active, expires_at')
      .eq('user_id', userId)
      .eq('is_active', true);

    const serviceAccessMap: Record<string, ServiceAccessInfo> = {};

    for (const service of services) {
      const adminAccess = accessList?.find(a => a.service_code === service.code);
      const creditsBalance = creditsMap.get(service.id) || 0;
      const isExpired = adminAccess?.expires_at
        ? new Date(adminAccess.expires_at) < new Date()
        : false;

      const hasAdminAccess = adminAccess && !isExpired;
      const hasAccess = hasAdminAccess || creditsBalance > 0;

      serviceAccessMap[service.code] = {
        hasAccess: Boolean(hasAccess),
        isGrantedByAdmin: Boolean(hasAdminAccess),
        isExpired,
        expiresAt: adminAccess?.expires_at || null,
        needsCredits: creditsBalance === 0,
        creditsBalance
      };
    }

    return serviceAccessMap;
  } catch (error) {
    console.error('Error getting user service access list:', error);
    return {};
  }
}
