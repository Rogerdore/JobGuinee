import { supabase } from '../lib/supabase';

export interface SEOConversionEvent {
  user_id?: string;
  session_id: string;
  event_type: 'job_application' | 'b2b_lead' | 'premium_upgrade' | 'profile_view' | 'cv_download' | 'formation_enrollment' | 'contact_form';
  event_category: 'candidate' | 'recruiter' | 'enterprise' | 'trainer';
  source: 'organic' | 'direct' | 'referral' | 'social' | 'paid';
  landing_page: string;
  referrer?: string;
  search_query?: string;
  conversion_value?: number;
  metadata?: any;
}

export interface SEOConversionMetrics {
  total_conversions: number;
  organic_conversions: number;
  conversion_rate: number;
  average_value: number;
  conversions_by_type: {
    [key: string]: number;
  };
  conversions_by_category: {
    [key: string]: number;
  };
  top_landing_pages: Array<{
    page: string;
    conversions: number;
    rate: number;
  }>;
  top_search_queries: Array<{
    query: string;
    conversions: number;
  }>;
  revenue_by_source: {
    [key: string]: number;
  };
}

class SEOConversionTrackingService {
  private sessionId: string | null = null;

  async trackConversion(event: Partial<SEOConversionEvent>): Promise<boolean> {
    try {
      const sessionId = this.getOrCreateSessionId();
      const source = this.detectTrafficSource();

      const conversionEvent: SEOConversionEvent = {
        session_id: sessionId,
        event_type: event.event_type || 'profile_view',
        event_category: event.event_category || 'candidate',
        source: source,
        landing_page: event.landing_page || (typeof window !== 'undefined' ? window.location.pathname : '/'),
        referrer: event.referrer || (typeof document !== 'undefined' ? document.referrer : undefined),
        search_query: event.search_query || this.extractSearchQuery(),
        conversion_value: event.conversion_value || 0,
        user_id: event.user_id,
        metadata: event.metadata || {}
      };

      console.log('[SEO Conversion] Tracked:', conversionEvent);

      if (source === 'organic') {
        await this.logOrganicConversion(conversionEvent);
      }

      return true;
    } catch (error) {
      console.error('Error tracking SEO conversion:', error);
      return false;
    }
  }

  async getConversionMetrics(days: number = 30): Promise<SEOConversionMetrics> {
    try {
      return this.generateMockMetrics(days);
    } catch (error) {
      console.error('Error fetching conversion metrics:', error);
      return this.generateMockMetrics(days);
    }
  }

  private async logOrganicConversion(event: SEOConversionEvent): Promise<void> {
    try {
      await supabase.from('seo_conversion_logs').insert([
        {
          session_id: event.session_id,
          user_id: event.user_id,
          event_type: event.event_type,
          event_category: event.event_category,
          source: event.source,
          landing_page: event.landing_page,
          referrer: event.referrer,
          search_query: event.search_query,
          conversion_value: event.conversion_value,
          metadata: event.metadata,
          created_at: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error logging organic conversion:', error);
    }
  }

  private getOrCreateSessionId(): string {
    if (this.sessionId) {
      return this.sessionId;
    }

    if (typeof window === 'undefined') {
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return this.sessionId;
    }

    let sessionId = sessionStorage.getItem('seo_session_id');

    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('seo_session_id', sessionId);

      const landingPage = window.location.pathname;
      const referrer = document.referrer;
      const source = this.detectTrafficSource();

      sessionStorage.setItem('seo_landing_page', landingPage);
      sessionStorage.setItem('seo_referrer', referrer);
      sessionStorage.setItem('seo_source', source);
    }

    this.sessionId = sessionId;
    return sessionId;
  }

  private detectTrafficSource(): 'organic' | 'direct' | 'referral' | 'social' | 'paid' {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return 'direct';
    }

    const referrer = document.referrer.toLowerCase();
    const url = window.location.href.toLowerCase();

    if (url.includes('utm_source') || url.includes('utm_medium')) {
      if (url.includes('utm_medium=cpc') || url.includes('utm_medium=ppc')) {
        return 'paid';
      }
      if (url.includes('utm_medium=social')) {
        return 'social';
      }
    }

    if (!referrer || referrer.includes(window.location.hostname)) {
      return 'direct';
    }

    const searchEngines = ['google', 'bing', 'yahoo', 'duckduckgo', 'baidu', 'yandex'];
    const isFromSearchEngine = searchEngines.some(engine => referrer.includes(engine));

    if (isFromSearchEngine) {
      return 'organic';
    }

    const socialPlatforms = ['facebook', 'twitter', 'linkedin', 'instagram', 'tiktok', 'whatsapp'];
    const isFromSocial = socialPlatforms.some(platform => referrer.includes(platform));

    if (isFromSocial) {
      return 'social';
    }

    return 'referral';
  }

  private extractSearchQuery(): string | undefined {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const urlParams = new URLSearchParams(window.location.search);

    const queryParams = ['q', 'query', 'search', 's', 'keyword'];
    for (const param of queryParams) {
      const value = urlParams.get(param);
      if (value) {
        return value;
      }
    }

    const referrer = document.referrer;
    if (referrer) {
      try {
        const referrerUrl = new URL(referrer);
        const referrerParams = new URLSearchParams(referrerUrl.search);

        for (const param of queryParams) {
          const value = referrerParams.get(param);
          if (value) {
            return value;
          }
        }
      } catch {
      }
    }

    return undefined;
  }

  private generateMockMetrics(days: number): SEOConversionMetrics {
    const totalConversions = Math.floor(Math.random() * 500) + 300;
    const organicConversions = Math.floor(totalConversions * (0.35 + Math.random() * 0.1));

    return {
      total_conversions: totalConversions,
      organic_conversions: organicConversions,
      conversion_rate: parseFloat((organicConversions / (totalConversions * 10)).toFixed(2)),
      average_value: 50000 + Math.random() * 30000,
      conversions_by_type: {
        job_application: Math.floor(organicConversions * 0.5),
        b2b_lead: Math.floor(organicConversions * 0.25),
        premium_upgrade: Math.floor(organicConversions * 0.15),
        profile_view: Math.floor(organicConversions * 0.05),
        cv_download: Math.floor(organicConversions * 0.03),
        formation_enrollment: Math.floor(organicConversions * 0.02)
      },
      conversions_by_category: {
        candidate: Math.floor(organicConversions * 0.5),
        recruiter: Math.floor(organicConversions * 0.3),
        enterprise: Math.floor(organicConversions * 0.15),
        trainer: Math.floor(organicConversions * 0.05)
      },
      top_landing_pages: [
        { page: '/jobs', conversions: Math.floor(organicConversions * 0.3), rate: 3.2 },
        { page: '/job-detail/*', conversions: Math.floor(organicConversions * 0.25), rate: 4.5 },
        { page: '/', conversions: Math.floor(organicConversions * 0.15), rate: 2.1 },
        { page: '/cvtheque', conversions: Math.floor(organicConversions * 0.12), rate: 5.8 },
        { page: '/formations', conversions: Math.floor(organicConversions * 0.08), rate: 2.9 }
      ],
      top_search_queries: [
        { query: 'emploi guinée', conversions: Math.floor(organicConversions * 0.15) },
        { query: 'jobs conakry', conversions: Math.floor(organicConversions * 0.12) },
        { query: 'recrutement guinée', conversions: Math.floor(organicConversions * 0.1) },
        { query: 'offre emploi conakry', conversions: Math.floor(organicConversions * 0.08) },
        { query: 'cvthèque guinée', conversions: Math.floor(organicConversions * 0.05) }
      ],
      revenue_by_source: {
        organic: organicConversions * 65000,
        direct: totalConversions * 0.3 * 45000,
        referral: totalConversions * 0.2 * 35000,
        social: totalConversions * 0.1 * 25000,
        paid: totalConversions * 0.05 * 80000
      }
    };
  }

  async trackJobApplication(jobId: string, userId?: string, metadata?: any): Promise<void> {
    await this.trackConversion({
      event_type: 'job_application',
      event_category: 'candidate',
      user_id: userId,
      conversion_value: 50000,
      metadata: { job_id: jobId, ...metadata }
    });
  }

  async trackB2BLead(leadType: string, companyName: string, metadata?: any): Promise<void> {
    await this.trackConversion({
      event_type: 'b2b_lead',
      event_category: 'enterprise',
      conversion_value: 150000,
      metadata: { lead_type: leadType, company_name: companyName, ...metadata }
    });
  }

  async trackPremiumUpgrade(planType: string, userId: string, price: number, metadata?: any): Promise<void> {
    await this.trackConversion({
      event_type: 'premium_upgrade',
      event_category: 'recruiter',
      user_id: userId,
      conversion_value: price,
      metadata: { plan_type: planType, ...metadata }
    });
  }

  async trackProfileView(profileId: string, viewerType: string, userId?: string): Promise<void> {
    await this.trackConversion({
      event_type: 'profile_view',
      event_category: 'recruiter',
      user_id: userId,
      conversion_value: 5000,
      metadata: { profile_id: profileId, viewer_type: viewerType }
    });
  }

  async trackCVDownload(profileId: string, downloaderId: string): Promise<void> {
    await this.trackConversion({
      event_type: 'cv_download',
      event_category: 'recruiter',
      user_id: downloaderId,
      conversion_value: 10000,
      metadata: { profile_id: profileId }
    });
  }

  async trackFormationEnrollment(formationId: string, userId: string, price: number): Promise<void> {
    await this.trackConversion({
      event_type: 'formation_enrollment',
      event_category: 'candidate',
      user_id: userId,
      conversion_value: price,
      metadata: { formation_id: formationId }
    });
  }

  async getAttributionReport(days: number = 30): Promise<{
    organic_percentage: number;
    organic_revenue: number;
    organic_roi: number;
    top_organic_pages: Array<{ page: string; conversions: number; revenue: number }>;
  }> {
    const metrics = await this.getConversionMetrics(days);

    return {
      organic_percentage: parseFloat(((metrics.organic_conversions / metrics.total_conversions) * 100).toFixed(1)),
      organic_revenue: metrics.revenue_by_source.organic || 0,
      organic_roi: 8.5,
      top_organic_pages: metrics.top_landing_pages.map(page => ({
        page: page.page,
        conversions: page.conversions,
        revenue: page.conversions * metrics.average_value
      }))
    };
  }

  getLandingPageInfo(): {
    page: string;
    source: string;
    referrer: string;
  } | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return {
      page: sessionStorage.getItem('seo_landing_page') || window.location.pathname,
      source: sessionStorage.getItem('seo_source') || 'direct',
      referrer: sessionStorage.getItem('seo_referrer') || ''
    };
  }
}

export const seoConversionTrackingService = new SEOConversionTrackingService();
