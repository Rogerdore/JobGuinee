import { supabase } from '../lib/supabase';

export interface Domain {
  id: string;
  domain: string;
  domain_url: string;
  domain_authority: number;
  page_authority: number;
  spam_score: number;
  trust_flow: number;
  citation_flow: number;
  total_backlinks: number;
  referring_domains: number;
  category: 'excellent' | 'good' | 'average' | 'poor' | 'toxic';
  is_whitelisted: boolean;
  is_blacklisted: boolean;
}

export interface ExternalLink {
  id: string;
  source_url: string;
  source_domain: string;
  target_url: string;
  target_page: string;
  anchor_text: string;
  anchor_type: 'exact_match' | 'partial_match' | 'branded' | 'generic' | 'naked_url' | 'image';
  is_dofollow: boolean;
  is_nofollow: boolean;
  link_position: 'content' | 'sidebar' | 'footer' | 'header' | 'comment' | 'unknown';
  status: 'active' | 'lost' | 'broken' | 'redirected' | 'noindex';
  quality_score: number;
  is_toxic: boolean;
  first_seen_at: string;
  last_seen_at: string;
}

export interface OutboundLink {
  id: string;
  source_page: string;
  target_url: string;
  target_domain: string;
  anchor_text: string;
  is_dofollow: boolean;
  is_sponsored: boolean;
  is_ugc: boolean;
  is_broken: boolean;
  http_status: number;
}

export interface LinkOpportunity {
  id: string;
  opportunity_type: string;
  target_site: string;
  target_url: string;
  suggested_anchor: string;
  suggested_page: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  opportunity_score: number;
  difficulty: number;
  status: 'identified' | 'contacted' | 'negotiating' | 'accepted' | 'rejected' | 'acquired' | 'abandoned';
}

export interface BacklinkProfile {
  total_backlinks: number;
  active_backlinks: number;
  lost_backlinks: number;
  dofollow_backlinks: number;
  unique_domains: number;
  avg_domain_authority: number;
  toxic_links_count: number;
  quality_score: number;
}

class SEOExternalLinkingService {
  async getDomains(filters?: {
    category?: string;
    minAuthority?: number;
    isWhitelisted?: boolean;
  }): Promise<Domain[]> {
    try {
      let query = supabase
        .from('seo_domains')
        .select('*')
        .order('domain_authority', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.minAuthority) {
        query = query.gte('domain_authority', filters.minAuthority);
      }

      if (filters?.isWhitelisted !== undefined) {
        query = query.eq('is_whitelisted', filters.isWhitelisted);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching domains:', error);
      return [];
    }
  }

  async addOrUpdateDomain(domain: Partial<Domain>): Promise<boolean> {
    try {
      const { data: existing } = await supabase
        .from('seo_domains')
        .select('id')
        .eq('domain', domain.domain)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('seo_domains')
          .update({
            ...domain,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('seo_domains')
          .insert([domain]);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error adding/updating domain:', error);
      return false;
    }
  }

  async getBacklinks(filters?: {
    status?: string;
    minQuality?: number;
    targetPage?: string;
  }): Promise<ExternalLink[]> {
    try {
      let query = supabase
        .from('seo_external_links')
        .select(`
          *,
          domains:source_domain (
            domain,
            domain_authority
          )
        `)
        .order('first_seen_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.minQuality) {
        query = query.gte('quality_score', filters.minQuality);
      }

      if (filters?.targetPage) {
        query = query.eq('target_page', filters.targetPage);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching backlinks:', error);
      return [];
    }
  }

  async addBacklink(backlink: Partial<ExternalLink>): Promise<boolean> {
    try {
      let domainId = backlink.source_domain;

      if (!domainId) {
        const domain = this.extractDomain(backlink.source_url || '');
        const { data: existingDomain } = await supabase
          .from('seo_domains')
          .select('id')
          .eq('domain', domain)
          .maybeSingle();

        if (existingDomain) {
          domainId = existingDomain.id;
        } else {
          const { data: newDomain } = await supabase
            .from('seo_domains')
            .insert([{
              domain,
              domain_url: `https://${domain}`,
              category: 'average'
            }])
            .select('id')
            .single();

          if (newDomain) {
            domainId = newDomain.id;
          }
        }
      }

      const { error } = await supabase
        .from('seo_external_links')
        .insert([{
          ...backlink,
          source_domain: domainId
        }]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding backlink:', error);
      return false;
    }
  }

  async updateBacklinkStatus(backlinkId: string, status: string): Promise<boolean> {
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'lost') {
        updates.lost_at = new Date().toISOString();
      } else if (status === 'active') {
        updates.last_seen_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('seo_external_links')
        .update(updates)
        .eq('id', backlinkId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating backlink status:', error);
      return false;
    }
  }

  async getBacklinkProfile(): Promise<BacklinkProfile | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_backlink_profile');

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('Error fetching backlink profile:', error);
      return null;
    }
  }

  async getTopReferringDomains(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_top_referring_domains', { limit_param: limit });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching top referring domains:', error);
      return [];
    }
  }

  async getRecentBacklinks(days: number = 7): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_recent_backlinks', { days_param: days });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent backlinks:', error);
      return [];
    }
  }

  async getLostBacklinks(days: number = 30): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_lost_backlinks', { days_param: days });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching lost backlinks:', error);
      return [];
    }
  }

  async getAnchorDistribution(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_anchor_distribution');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching anchor distribution:', error);
      return [];
    }
  }

  async getOutboundLinks(sourcePage?: string): Promise<OutboundLink[]> {
    try {
      let query = supabase
        .from('seo_outbound_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (sourcePage) {
        query = query.eq('source_page', sourcePage);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching outbound links:', error);
      return [];
    }
  }

  async addOutboundLink(link: Partial<OutboundLink>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('seo_outbound_links')
        .insert([link]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding outbound link:', error);
      return false;
    }
  }

  async checkBrokenLinks(): Promise<{ checked: number; broken: number }> {
    const result = { checked: 0, broken: 0 };

    try {
      const { data: links } = await supabase
        .from('seo_outbound_links')
        .select('id, target_url')
        .limit(50);

      if (!links) return result;

      for (const link of links) {
        result.checked++;

        try {
          const response = await fetch(link.target_url, { method: 'HEAD' });
          const isBroken = response.status >= 400;

          if (isBroken) {
            result.broken++;
          }

          await supabase
            .from('seo_outbound_links')
            .update({
              is_broken: isBroken,
              http_status: response.status,
              last_checked_at: new Date().toISOString()
            })
            .eq('id', link.id);
        } catch (error) {
          result.broken++;
          await supabase
            .from('seo_outbound_links')
            .update({
              is_broken: true,
              http_status: 0,
              last_checked_at: new Date().toISOString()
            })
            .eq('id', link.id);
        }
      }
    } catch (error) {
      console.error('Error checking broken links:', error);
    }

    return result;
  }

  async getLinkOpportunities(filters?: {
    type?: string;
    status?: string;
    priority?: string;
  }): Promise<LinkOpportunity[]> {
    try {
      let query = supabase
        .from('seo_link_opportunities')
        .select('*')
        .order('opportunity_score', { ascending: false });

      if (filters?.type) {
        query = query.eq('opportunity_type', filters.type);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching link opportunities:', error);
      return [];
    }
  }

  async addLinkOpportunity(opportunity: Partial<LinkOpportunity>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('seo_link_opportunities')
        .insert([opportunity]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding link opportunity:', error);
      return false;
    }
  }

  async updateOpportunityStatus(
    opportunityId: string,
    status: string,
    acquiredUrl?: string
  ): Promise<boolean> {
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'acquired' && acquiredUrl) {
        updates.acquired_at = new Date().toISOString();
        updates.acquired_url = acquiredUrl;
      }

      const { error } = await supabase
        .from('seo_link_opportunities')
        .update(updates)
        .eq('id', opportunityId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating opportunity status:', error);
      return false;
    }
  }

  async getToxicLinks(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('seo_toxic_links')
        .select(`
          *,
          external_links:external_link_id (
            source_url,
            target_url,
            anchor_text
          )
        `)
        .order('toxicity_score', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching toxic links:', error);
      return [];
    }
  }

  async markAsToxic(
    externalLinkId: string,
    reasons: string[],
    toxicityScore: number
  ): Promise<boolean> {
    try {
      const { data: link } = await supabase
        .from('seo_external_links')
        .select('source_url, source_domain')
        .eq('id', externalLinkId)
        .single();

      if (!link) return false;

      const { data: domain } = await supabase
        .from('seo_domains')
        .select('domain')
        .eq('id', link.source_domain)
        .single();

      await supabase
        .from('seo_external_links')
        .update({ is_toxic: true })
        .eq('id', externalLinkId);

      const { error } = await supabase
        .from('seo_toxic_links')
        .insert([{
          external_link_id: externalLinkId,
          source_url: link.source_url,
          source_domain: domain?.domain || '',
          toxicity_reasons: reasons,
          toxicity_score: toxicityScore
        }]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking link as toxic:', error);
      return false;
    }
  }

  async generateDisavowFile(): Promise<string> {
    try {
      const { data: toxicLinks } = await supabase
        .from('seo_toxic_links')
        .select('source_url, source_domain')
        .eq('action', 'disavow')
        .eq('disavow_file_included', false);

      if (!toxicLinks || toxicLinks.length === 0) {
        return '';
      }

      const domains = new Set<string>();
      const urls: string[] = [];

      toxicLinks.forEach(link => {
        if (link.source_domain) {
          domains.add(link.source_domain);
        } else {
          urls.push(link.source_url);
        }
      });

      let disavowContent = `# Disavow file generated on ${new Date().toISOString()}\n`;
      disavowContent += `# Total toxic links: ${toxicLinks.length}\n\n`;

      domains.forEach(domain => {
        disavowContent += `domain:${domain}\n`;
      });

      urls.forEach(url => {
        disavowContent += `${url}\n`;
      });

      return disavowContent;
    } catch (error) {
      console.error('Error generating disavow file:', error);
      return '';
    }
  }

  async downloadDisavowFile(): Promise<void> {
    const content = await this.generateDisavowFile();

    if (!content) {
      alert('Aucun lien à désavouer pour le moment.');
      return;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `disavow-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async getBacklinkChanges(days: number = 30): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('seo_backlink_changes')
        .select(`
          *,
          external_links:external_link_id (
            source_url,
            target_url
          )
        `)
        .gte('detected_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('detected_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching backlink changes:', error);
      return [];
    }
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  async analyzeCompetitorBacklinks(competitorUrl: string): Promise<{
    opportunities: number;
    message: string;
  }> {
    return {
      opportunities: 0,
      message: 'Analyse de backlinks concurrents à venir. Nécessite intégration API externe (Ahrefs, SEMrush, Moz).'
    };
  }

  async findBrokenLinkOpportunities(): Promise<{
    found: number;
    message: string;
  }> {
    return {
      found: 0,
      message: 'Recherche d\'opportunités de broken link building à venir.'
    };
  }
}

export const seoExternalLinkingService = new SEOExternalLinkingService();
