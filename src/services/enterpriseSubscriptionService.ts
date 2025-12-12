import { supabase } from '../lib/supabase';

export interface EnterprisePackDetails {
  code: string;
  name: string;
  price: number;
  maxActiveJobs: number;
  monthlyCVQuota: number | null;
  maxMonthlyMatching: number | null;
  features: string[];
  requiresValidation: boolean;
  dailyMatchingLimit?: number;
}

export const ENTERPRISE_PACKS: Record<string, EnterprisePackDetails> = {
  enterprise_basic: {
    code: 'enterprise_basic',
    name: 'PACK ENTERPRISE BASIC',
    price: 3500000,
    maxActiveJobs: 5,
    monthlyCVQuota: 200,
    maxMonthlyMatching: 150,
    features: [
      'ATS complet (pipeline par offre)',
      'Gestion multi-offres (jusqu\'à 5)',
      'Accès CVthèque limité',
      'Matching IA en batch',
      'Exports PDF / Excel / CSV',
      'Support Email'
    ],
    requiresValidation: false
  },
  enterprise_pro: {
    code: 'enterprise_pro',
    name: 'PACK ENTERPRISE PRO',
    price: 7500000,
    maxActiveJobs: 10,
    monthlyCVQuota: 500,
    maxMonthlyMatching: 300,
    features: [
      'Tout BASIC',
      'ATS multi-projets',
      'Pipeline personnalisable',
      'Planification d\'entretiens',
      'Communication recruteur ↔ candidat',
      'Accès CVthèque étendu',
      'Analytics recruteur & ROI IA',
      'Support WhatsApp'
    ],
    requiresValidation: false
  },
  enterprise_gold: {
    code: 'enterprise_gold',
    name: 'PACK ENTERPRISE GOLD',
    price: 10000000,
    maxActiveJobs: 999,
    monthlyCVQuota: null,
    maxMonthlyMatching: null,
    features: [
      'ATS + CVthèque illimités',
      'Matching IA illimité sous conditions',
      'Priorité diffusion offres',
      'Gestion multi-filiales',
      'Reporting institutionnel',
      'Support dédié + SLA',
      'Validation admin obligatoire',
      'Limites journalières configurables'
    ],
    requiresValidation: true,
    dailyMatchingLimit: 100
  },
  cabinet_rh: {
    code: 'cabinet_rh',
    name: 'PACK CABINET RH',
    price: 12000000,
    maxActiveJobs: 20,
    monthlyCVQuota: 500,
    maxMonthlyMatching: 400,
    features: [
      'ATS multi-offres',
      'Accès CVthèque étendu',
      'Matching IA avancé',
      'Gestion multi-clients',
      'Exports complets',
      'Analytics avancées'
    ],
    requiresValidation: false
  }
};

export const PREMIUM_SERVICES = {
  featured_job_7d: {
    code: 'featured_job_7d',
    name: 'Offre à la une - 7 jours',
    price: 300000,
    duration_days: 7
  },
  featured_job_30d: {
    code: 'featured_job_30d',
    name: 'Offre à la une - 30 jours',
    price: 1000000,
    duration_days: 30
  },
  featured_job_60d: {
    code: 'featured_job_60d',
    name: 'Offre à la une - 60 jours',
    price: 1800000,
    duration_days: 60
  },
  featured_profile_30d: {
    code: 'featured_profile_30d',
    name: 'Profil recruteur mis en avant - 30 jours',
    price: 600000,
    duration_days: 30
  },
  targeted_campaign_7d: {
    code: 'targeted_campaign_7d',
    name: 'Campagne diffusion ciblée - 7 jours',
    price: 400000,
    duration_days: 7
  }
};

export class EnterpriseSubscriptionService {
  static async createSubscription(
    companyId: string,
    packCode: string,
    paymentReference: string,
    paymentProofUrl?: string
  ) {
    const pack = ENTERPRISE_PACKS[packCode];
    if (!pack) {
      throw new Error('Pack invalide');
    }

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      throw new Error('Non authentifié');
    }

    const { data, error } = await supabase
      .from('enterprise_subscriptions')
      .insert({
        company_id: companyId,
        profile_id: session.session.user.id,
        subscription_type: pack.code,
        price_gnf: pack.price,
        max_active_jobs: pack.maxActiveJobs,
        monthly_cv_quota: pack.monthlyCVQuota,
        max_monthly_matching: pack.maxMonthlyMatching,
        daily_matching_limit: pack.dailyMatchingLimit,
        features: pack.features,
        requires_validation: pack.requiresValidation,
        status: pack.requiresValidation ? 'pending' : 'pending',
        payment_method: 'orange_money',
        payment_reference: paymentReference,
        payment_status: paymentProofUrl ? 'waiting_proof' : 'pending',
        payment_proof_url: paymentProofUrl
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getActiveSubscription(companyId: string) {
    const { data, error } = await supabase.rpc('get_active_enterprise_subscription', {
      company_id_param: companyId
    });

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  }

  static async checkFeatureAccess(
    companyId: string,
    featureType: 'cv_view' | 'matching_ai' | 'job_post',
    count: number = 1
  ) {
    const { data, error } = await supabase.rpc('can_use_enterprise_feature', {
      company_id_param: companyId,
      feature_type: featureType,
      count_requested: count
    });

    if (error) throw error;
    return data;
  }

  static async trackUsage(
    companyId: string,
    usageType: 'cv_view' | 'matching_ai' | 'export' | 'communication' | 'job_post' | 'interview_schedule',
    metadata: Record<string, any> = {}
  ) {
    const { data, error } = await supabase.rpc('track_enterprise_usage', {
      company_id_param: companyId,
      usage_type_param: usageType,
      metadata_param: metadata
    });

    if (error) throw error;
    return data;
  }

  static async getUsageStats(companyId: string, startDate?: Date, endDate?: Date) {
    let query = supabase
      .from('enterprise_usage_tracking')
      .select('usage_type, metadata, used_at')
      .eq('company_id', companyId)
      .order('used_at', { ascending: false });

    if (startDate) {
      query = query.gte('used_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('used_at', endDate.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;

    const stats = {
      cv_views: 0,
      matching_ai: 0,
      exports: 0,
      communications: 0,
      job_posts: 0,
      interview_schedules: 0,
      total: data?.length || 0
    };

    data?.forEach(record => {
      if (record.usage_type === 'cv_view') stats.cv_views++;
      else if (record.usage_type === 'matching_ai') stats.matching_ai++;
      else if (record.usage_type === 'export') stats.exports++;
      else if (record.usage_type === 'communication') stats.communications++;
      else if (record.usage_type === 'job_post') stats.job_posts++;
      else if (record.usage_type === 'interview_schedule') stats.interview_schedules++;
    });

    return stats;
  }

  static async activatePremiumService(
    companyId: string,
    serviceCode: string,
    jobId: string,
    paymentReference: string,
    paymentProofUrl?: string
  ) {
    const service = PREMIUM_SERVICES[serviceCode as keyof typeof PREMIUM_SERVICES];
    if (!service) {
      throw new Error('Service invalide');
    }

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      throw new Error('Non authentifié');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + service.duration_days);

    const { data, error } = await supabase
      .from('premium_services_activations')
      .insert({
        company_id: companyId,
        profile_id: session.session.user.id,
        service_type: service.code,
        service_name: service.name,
        price_gnf: service.price,
        job_id: jobId,
        payment_method: 'orange_money',
        payment_reference: paymentReference,
        payment_status: paymentProofUrl ? 'waiting_proof' : 'pending',
        payment_proof_url: paymentProofUrl,
        status: 'pending',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getActivePremiumServices(companyId: string) {
    const { data, error } = await supabase
      .from('premium_services_activations')
      .select('*, jobs(title)')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getAllSubscriptions(companyId: string) {
    const { data, error } = await supabase
      .from('enterprise_subscriptions')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async calculateROI(companyId: string, subscriptionId: string) {
    const { data: usage, error: usageError } = await supabase
      .from('enterprise_usage_tracking')
      .select('usage_type, metadata')
      .eq('company_id', companyId)
      .eq('subscription_id', subscriptionId);

    if (usageError) throw usageError;

    const matchingCount = usage?.filter(u => u.usage_type === 'matching_ai').length || 0;
    const cvViewsCount = usage?.filter(u => u.usage_type === 'cv_view').length || 0;

    const timePerManualReview = 10;
    const timeSavedMinutes = (matchingCount * 30) + (cvViewsCount * timePerManualReview);
    const timeSavedHours = Math.round(timeSavedMinutes / 60);

    const avgHourlyCost = 50000;
    const moneySaved = timeSavedHours * avgHourlyCost;

    return {
      matchingAIUsed: matchingCount,
      cvViewsUsed: cvViewsCount,
      timeSavedHours,
      estimatedSavingsGNF: moneySaved,
      totalActions: usage?.length || 0
    };
  }
}
