import { supabase } from '../lib/supabase';

export interface SEOMetrics {
  period: 'today' | '7days' | '30days' | '90days';
  organicSessions: number;
  organicSessionsChange: number;
  impressions: number;
  impressionsChange: number;
  clicks: number;
  clicksChange: number;
  averageCTR: number;
  ctrChange: number;
  averagePosition: number;
  positionChange: number;
  pagesIndexed: number;
  pagesIndexedChange: number;
}

export interface ConversionMetrics {
  period: 'today' | '7days' | '30days' | '90days';
  candidateApplications: number;
  candidateApplicationsChange: number;
  candidateApplicationsFromSEO: number;
  b2bLeads: number;
  b2bLeadsChange: number;
  b2bLeadsFromSEO: number;
  premiumUpgrades: number;
  premiumUpgradesFromSEO: number;
  conversionRate: number;
  conversionRateChange: number;
}

export interface KeywordPerformance {
  keyword: string;
  currentPosition: number;
  previousPosition: number;
  positionChange: number;
  impressions: number;
  clicks: number;
  ctr: number;
  url: string;
  trend: 'up' | 'down' | 'stable';
}

export interface PagePerformance {
  pageUrl: string;
  pageType: string;
  sessions: number;
  sessionsChange: number;
  avgTimeOnPage: number;
  bounceRate: number;
  conversions: number;
  conversionRate: number;
  seoScore: number;
}

export interface ROIMetrics {
  period: 'month' | 'quarter' | 'year';
  seoInvestment: number;
  revenueFromSEO: number;
  roi: number;
  b2bRevenue: number;
  premiumRevenue: number;
  totalLeads: number;
  costPerLead: number;
  customerAcquisitionCost: number;
}

class SEOAnalyticsService {
  async getOverviewMetrics(period: 'today' | '7days' | '30days' | '90days' = '30days'): Promise<SEOMetrics> {
    try {
      const days = period === 'today' ? 1 : period === '7days' ? 7 : period === '30days' ? 30 : 90;
      const compareStartDate = new Date();
      compareStartDate.setDate(compareStartDate.getDate() - days * 2);
      const periodStartDate = new Date();
      periodStartDate.setDate(periodStartDate.getDate() - days);

      const { data: pagesData } = await supabase
        .from('seo_page_meta')
        .select('id')
        .eq('is_active', true);

      const pagesIndexed = pagesData?.length || 0;

      const { data: previousPagesData } = await supabase
        .from('seo_page_meta')
        .select('id')
        .eq('is_active', true)
        .lt('created_at', periodStartDate.toISOString());

      const previousPagesIndexed = previousPagesData?.length || 0;

      return {
        period,
        organicSessions: this.generateMockMetric(1000, 5000),
        organicSessionsChange: this.generateMockChange(),
        impressions: this.generateMockMetric(10000, 50000),
        impressionsChange: this.generateMockChange(),
        clicks: this.generateMockMetric(500, 2500),
        clicksChange: this.generateMockChange(),
        averageCTR: parseFloat((Math.random() * (8 - 3) + 3).toFixed(2)),
        ctrChange: this.generateMockChange(),
        averagePosition: parseFloat((Math.random() * (20 - 5) + 5).toFixed(1)),
        positionChange: parseFloat((Math.random() * 6 - 3).toFixed(1)),
        pagesIndexed,
        pagesIndexedChange: pagesIndexed - previousPagesIndexed
      };
    } catch (error) {
      console.error('Error fetching overview metrics:', error);
      throw error;
    }
  }

  async getConversionMetrics(period: 'today' | '7days' | '30days' | '90days' = '30days'): Promise<ConversionMetrics> {
    try {
      const days = period === 'today' ? 1 : period === '7days' ? 7 : period === '30days' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: applications } = await supabase
        .from('applications')
        .select('id, created_at')
        .gte('created_at', startDate.toISOString());

      const totalApplications = applications?.length || 0;
      const applicationsFromSEO = Math.floor(totalApplications * 0.35);

      const { data: b2bLeads } = await supabase
        .from('b2b_leads')
        .select('id, created_at')
        .gte('created_at', startDate.toISOString());

      const totalB2BLeads = b2bLeads?.length || 0;
      const b2bLeadsFromSEO = Math.floor(totalB2BLeads * 0.4);

      const { data: premiumSubs } = await supabase
        .from('premium_subscriptions')
        .select('id, created_at')
        .gte('created_at', startDate.toISOString())
        .eq('status', 'active');

      const totalPremium = premiumSubs?.length || 0;
      const premiumFromSEO = Math.floor(totalPremium * 0.3);

      const compareStartDate = new Date();
      compareStartDate.setDate(compareStartDate.getDate() - days * 2);
      const periodStartDate = new Date();
      periodStartDate.setDate(periodStartDate.getDate() - days);

      const { data: previousApplications } = await supabase
        .from('applications')
        .select('id')
        .gte('created_at', compareStartDate.toISOString())
        .lt('created_at', periodStartDate.toISOString());

      const previousTotal = previousApplications?.length || 1;
      const applicationsChange = previousTotal > 0
        ? ((totalApplications - previousTotal) / previousTotal) * 100
        : 0;

      const { data: previousB2BLeads } = await supabase
        .from('b2b_leads')
        .select('id')
        .gte('created_at', compareStartDate.toISOString())
        .lt('created_at', periodStartDate.toISOString());

      const previousB2BTotal = previousB2BLeads?.length || 1;
      const b2bLeadsChange = previousB2BTotal > 0
        ? ((totalB2BLeads - previousB2BTotal) / previousB2BTotal) * 100
        : 0;

      return {
        period,
        candidateApplications: totalApplications,
        candidateApplicationsChange: parseFloat(applicationsChange.toFixed(1)),
        candidateApplicationsFromSEO: applicationsFromSEO,
        b2bLeads: totalB2BLeads,
        b2bLeadsChange: parseFloat(b2bLeadsChange.toFixed(1)),
        b2bLeadsFromSEO: b2bLeadsFromSEO,
        premiumUpgrades: totalPremium,
        premiumUpgradesFromSEO: premiumFromSEO,
        conversionRate: totalApplications > 0 ? parseFloat((applicationsFromSEO / totalApplications * 100).toFixed(2)) : 0,
        conversionRateChange: this.generateMockChange()
      };
    } catch (error) {
      console.error('Error fetching conversion metrics:', error);
      throw error;
    }
  }

  async getTopKeywords(limit: number = 10): Promise<KeywordPerformance[]> {
    try {
      const { data: keywords } = await supabase
        .from('seo_keywords')
        .select('*')
        .eq('is_tracked', true)
        .order('current_rank', { ascending: true })
        .limit(limit);

      if (!keywords) return [];

      return keywords.map(kw => {
        const currentPos = kw.current_rank || 100;
        const previousPos = kw.previous_rank || currentPos;
        const change = previousPos - currentPos;

        return {
          keyword: kw.keyword,
          currentPosition: currentPos,
          previousPosition: previousPos,
          positionChange: change,
          impressions: kw.impressions || this.generateMockMetric(100, 1000),
          clicks: kw.clicks || this.generateMockMetric(10, 100),
          ctr: kw.ctr || parseFloat((Math.random() * (8 - 2) + 2).toFixed(2)),
          url: kw.target_url || '/',
          trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
        };
      });
    } catch (error) {
      console.error('Error fetching top keywords:', error);
      return [];
    }
  }

  async getTopPages(limit: number = 10): Promise<PagePerformance[]> {
    try {
      const { data: pages } = await supabase
        .from('seo_page_meta')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .limit(limit);

      if (!pages) return [];

      return pages.map(page => ({
        pageUrl: page.page_path,
        pageType: page.page_type,
        sessions: this.generateMockMetric(100, 1000),
        sessionsChange: this.generateMockChange(),
        avgTimeOnPage: parseFloat((Math.random() * (300 - 60) + 60).toFixed(0)),
        bounceRate: parseFloat((Math.random() * (70 - 30) + 30).toFixed(1)),
        conversions: this.generateMockMetric(5, 50),
        conversionRate: parseFloat((Math.random() * (10 - 2) + 2).toFixed(2)),
        seoScore: Math.floor(Math.random() * (100 - 60) + 60)
      }));
    } catch (error) {
      console.error('Error fetching top pages:', error);
      return [];
    }
  }

  async getROIMetrics(period: 'month' | 'quarter' | 'year' = 'month'): Promise<ROIMetrics> {
    try {
      const days = period === 'month' ? 30 : period === 'quarter' ? 90 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: b2bLeads } = await supabase
        .from('b2b_leads')
        .select('id')
        .gte('created_at', startDate.toISOString());

      const totalLeads = b2bLeads?.length || 0;
      const leadsFromSEO = Math.floor(totalLeads * 0.4);

      const { data: premiumSubs } = await supabase
        .from('premium_subscriptions')
        .select('plan_type, price')
        .eq('status', 'active')
        .gte('created_at', startDate.toISOString());

      let premiumRevenue = 0;
      if (premiumSubs) {
        premiumRevenue = premiumSubs.reduce((sum, sub) => sum + (sub.price || 50000), 0);
      }

      const estimatedB2BRevenue = leadsFromSEO * 1500000 * 0.15;
      const premiumRevenueFromSEO = premiumRevenue * 0.3;
      const totalRevenue = estimatedB2BRevenue + premiumRevenueFromSEO;

      const seoInvestment = period === 'month' ? 2000000 : period === 'quarter' ? 6000000 : 24000000;

      const roi = seoInvestment > 0 ? (totalRevenue / seoInvestment) : 0;

      return {
        period,
        seoInvestment,
        revenueFromSEO: Math.floor(totalRevenue),
        roi: parseFloat(roi.toFixed(2)),
        b2bRevenue: Math.floor(estimatedB2BRevenue),
        premiumRevenue: Math.floor(premiumRevenueFromSEO),
        totalLeads: leadsFromSEO,
        costPerLead: leadsFromSEO > 0 ? Math.floor(seoInvestment / leadsFromSEO) : 0,
        customerAcquisitionCost: leadsFromSEO > 0 ? Math.floor(seoInvestment / (leadsFromSEO * 0.15)) : 0
      };
    } catch (error) {
      console.error('Error fetching ROI metrics:', error);
      throw error;
    }
  }

  async getTrafficBySource(days: number = 30): Promise<Array<{ source: string; sessions: number; percentage: number }>> {
    const totalSessions = this.generateMockMetric(5000, 15000);

    const sources = [
      { source: 'Organic Search', sessions: Math.floor(totalSessions * 0.35) },
      { source: 'Direct', sessions: Math.floor(totalSessions * 0.25) },
      { source: 'Social', sessions: Math.floor(totalSessions * 0.15) },
      { source: 'Referral', sessions: Math.floor(totalSessions * 0.15) },
      { source: 'Email', sessions: Math.floor(totalSessions * 0.10) }
    ];

    return sources.map(s => ({
      ...s,
      percentage: parseFloat((s.sessions / totalSessions * 100).toFixed(1))
    }));
  }

  async getPageTypePerformance(): Promise<Array<{ pageType: string; pages: number; avgScore: number; totalSessions: number }>> {
    try {
      const { data: pages } = await supabase
        .from('seo_page_meta')
        .select('page_type')
        .eq('is_active', true);

      const typeCount: Record<string, number> = {};
      pages?.forEach(p => {
        typeCount[p.page_type] = (typeCount[p.page_type] || 0) + 1;
      });

      const pageTypes = ['job_detail', 'job_sector', 'job_city', 'b2b_page', 'blog_post', 'formation'];

      return pageTypes.map(type => ({
        pageType: type,
        pages: typeCount[type] || 0,
        avgScore: Math.floor(Math.random() * (90 - 60) + 60),
        totalSessions: this.generateMockMetric(500, 3000)
      }));
    } catch (error) {
      console.error('Error fetching page type performance:', error);
      return [];
    }
  }

  async getTrendData(metric: 'sessions' | 'impressions' | 'clicks' | 'conversions', days: number = 30): Promise<Array<{ date: string; value: number }>> {
    const data: Array<{ date: string; value: number }> = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      let baseValue = 100;
      if (metric === 'sessions') baseValue = 200;
      else if (metric === 'impressions') baseValue = 1000;
      else if (metric === 'clicks') baseValue = 50;
      else if (metric === 'conversions') baseValue = 10;

      const variance = baseValue * 0.3;
      const trend = (days - i) / days;
      const trendValue = baseValue * (0.8 + trend * 0.4);
      const randomVariance = (Math.random() - 0.5) * variance;
      const value = Math.max(0, Math.floor(trendValue + randomVariance));

      data.push({
        date: date.toISOString().split('T')[0],
        value
      });
    }

    return data;
  }

  private generateMockMetric(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private generateMockChange(): number {
    return parseFloat((Math.random() * 60 - 20).toFixed(1));
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  formatCurrency(amount: number): string {
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + 'M GNF';
    } else if (amount >= 1000) {
      return (amount / 1000).toFixed(0) + 'K GNF';
    }
    return amount.toLocaleString('fr-FR') + ' GNF';
  }

  formatPercentage(value: number, decimals: number = 1): string {
    return value.toFixed(decimals) + '%';
  }
}

export const seoAnalyticsService = new SEOAnalyticsService();
