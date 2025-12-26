import { supabase } from '../lib/supabase';
import { seoService, SEOPageMeta } from './seoService';

export interface SEOAuditResult {
  overall_score: number;
  technical_score: number;
  content_score: number;
  semantic_score: number;
  performance_score: number;
  issues: SEOIssue[];
  opportunities: SEOOpportunity[];
  recommendations: SEORecommendation[];
  pages_analyzed: number;
  audit_date: string;
}

export interface SEOIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'technical' | 'content' | 'semantic' | 'performance';
  title: string;
  description: string;
  affected_pages: string[];
  fix_priority: number;
}

export interface SEOOpportunity {
  id: string;
  type: 'quick_win' | 'strategic' | 'long_term';
  category: string;
  title: string;
  description: string;
  estimated_impact: 'high' | 'medium' | 'low';
  effort_required: 'low' | 'medium' | 'high';
}

export interface SEORecommendation {
  id: string;
  title: string;
  description: string;
  implementation_steps: string[];
  expected_results: string;
  timeline: string;
}

class SEOAuditService {
  async runFullAudit(): Promise<SEOAuditResult> {
    const [
      technicalAudit,
      contentAudit,
      semanticAudit,
      performanceAudit
    ] = await Promise.all([
      this.auditTechnicalSEO(),
      this.auditContentSEO(),
      this.auditSemanticSEO(),
      this.auditPerformanceSEO()
    ]);

    const issues = [
      ...technicalAudit.issues,
      ...contentAudit.issues,
      ...semanticAudit.issues,
      ...performanceAudit.issues
    ];

    const opportunities = [
      ...technicalAudit.opportunities,
      ...contentAudit.opportunities,
      ...semanticAudit.opportunities,
      ...performanceAudit.opportunities
    ];

    const recommendations = this.generateRecommendations(issues, opportunities);

    const overall_score = Math.round(
      (technicalAudit.score + contentAudit.score + semanticAudit.score + performanceAudit.score) / 4
    );

    const result: SEOAuditResult = {
      overall_score,
      technical_score: technicalAudit.score,
      content_score: contentAudit.score,
      semantic_score: semanticAudit.score,
      performance_score: performanceAudit.score,
      issues: issues.sort((a, b) => b.fix_priority - a.fix_priority),
      opportunities: opportunities.sort((a, b) => {
        const impactWeight = { high: 3, medium: 2, low: 1 };
        const effortWeight = { low: 3, medium: 2, high: 1 };
        const scoreA = impactWeight[a.estimated_impact] * effortWeight[a.effort_required];
        const scoreB = impactWeight[b.estimated_impact] * effortWeight[b.effort_required];
        return scoreB - scoreA;
      }),
      recommendations,
      pages_analyzed: await this.countPages(),
      audit_date: new Date().toISOString()
    };

    await this.saveAuditReport(result);

    return result;
  }

  private async auditTechnicalSEO() {
    const issues: SEOIssue[] = [];
    const opportunities: SEOOpportunity[] = [];
    let score = 100;

    const pages = await seoService.getAllPageMeta();
    const config = await seoService.getConfig();

    if (!config) {
      issues.push({
        id: 'no-seo-config',
        severity: 'critical',
        category: 'technical',
        title: 'Configuration SEO manquante',
        description: 'Aucune configuration SEO globale n\'est définie',
        affected_pages: ['global'],
        fix_priority: 100
      });
      score -= 30;
    }

    const pagesWithoutTitle = pages.filter(p => !p.title || p.title.length === 0);
    if (pagesWithoutTitle.length > 0) {
      issues.push({
        id: 'missing-titles',
        severity: 'critical',
        category: 'technical',
        title: `${pagesWithoutTitle.length} pages sans titre`,
        description: 'Les titres sont essentiels pour le SEO',
        affected_pages: pagesWithoutTitle.map(p => p.page_path),
        fix_priority: 95
      });
      score -= 20;
    }

    const pagesWithoutDescription = pages.filter(p => !p.description || p.description.length === 0);
    if (pagesWithoutDescription.length > 0) {
      issues.push({
        id: 'missing-descriptions',
        severity: 'high',
        category: 'technical',
        title: `${pagesWithoutDescription.length} pages sans meta description`,
        description: 'Les meta descriptions améliorent le CTR',
        affected_pages: pagesWithoutDescription.map(p => p.page_path),
        fix_priority: 85
      });
      score -= 15;
    }

    const pagesWithoutCanonical = pages.filter(p => !p.canonical_url);
    if (pagesWithoutCanonical.length > 0) {
      opportunities.push({
        id: 'add-canonical-urls',
        type: 'quick_win',
        category: 'technical',
        title: 'Ajouter des URLs canoniques',
        description: `${pagesWithoutCanonical.length} pages sans URL canonique`,
        estimated_impact: 'medium',
        effort_required: 'low'
      });
    }

    if (config && !config.google_site_verification) {
      opportunities.push({
        id: 'google-verification',
        type: 'quick_win',
        category: 'technical',
        title: 'Vérifier le site avec Google Search Console',
        description: 'Activer le suivi des performances dans Google Search Console',
        estimated_impact: 'high',
        effort_required: 'low'
      });
    }

    return { score: Math.max(0, score), issues, opportunities };
  }

  private async auditContentSEO() {
    const issues: SEOIssue[] = [];
    const opportunities: SEOOpportunity[] = [];
    let score = 100;

    const pages = await seoService.getAllPageMeta();

    const pagesWithShortTitles = pages.filter(p => p.title && p.title.length < 30);
    if (pagesWithShortTitles.length > 0) {
      issues.push({
        id: 'short-titles',
        severity: 'medium',
        category: 'content',
        title: `${pagesWithShortTitles.length} titres trop courts`,
        description: 'Les titres doivent contenir entre 50-60 caractères',
        affected_pages: pagesWithShortTitles.map(p => p.page_path),
        fix_priority: 70
      });
      score -= 10;
    }

    const pagesWithLongTitles = pages.filter(p => p.title && p.title.length > 70);
    if (pagesWithLongTitles.length > 0) {
      issues.push({
        id: 'long-titles',
        severity: 'medium',
        category: 'content',
        title: `${pagesWithLongTitles.length} titres trop longs`,
        description: 'Les titres de plus de 70 caractères sont tronqués dans Google',
        affected_pages: pagesWithLongTitles.map(p => p.page_path),
        fix_priority: 65
      });
      score -= 10;
    }

    const pagesWithShortDescriptions = pages.filter(p => p.description && p.description.length < 120);
    if (pagesWithShortDescriptions.length > 0) {
      issues.push({
        id: 'short-descriptions',
        severity: 'low',
        category: 'content',
        title: `${pagesWithShortDescriptions.length} descriptions trop courtes`,
        description: 'Les descriptions doivent contenir 155-165 caractères',
        affected_pages: pagesWithShortDescriptions.map(p => p.page_path),
        fix_priority: 50
      });
      score -= 5;
    }

    const pagesWithFewKeywords = pages.filter(p => !p.keywords || p.keywords.length < 3);
    if (pagesWithFewKeywords.length > 0) {
      opportunities.push({
        id: 'add-keywords',
        type: 'strategic',
        category: 'content',
        title: 'Enrichir les mots-clés',
        description: `${pagesWithFewKeywords.length} pages avec moins de 3 mots-clés`,
        estimated_impact: 'medium',
        effort_required: 'medium'
      });
    }

    const { data: jobs } = await supabase.from('jobs').select('id, title').eq('status', 'active').limit(10);
    if (jobs && jobs.length > 0) {
      opportunities.push({
        id: 'optimize-job-pages',
        type: 'strategic',
        category: 'content',
        title: 'Optimiser les offres d\'emploi pour le SEO',
        description: 'Créer des meta descriptions uniques pour chaque offre',
        estimated_impact: 'high',
        effort_required: 'medium'
      });
    }

    return { score: Math.max(0, score), issues, opportunities };
  }

  private async auditSemanticSEO() {
    const issues: SEOIssue[] = [];
    const opportunities: SEOOpportunity[] = [];
    let score = 100;

    const { data: schemas } = await supabase.from('seo_schemas').select('*').eq('is_active', true);

    if (!schemas || schemas.length === 0) {
      issues.push({
        id: 'no-schemas',
        severity: 'high',
        category: 'semantic',
        title: 'Aucun schema structured data',
        description: 'Les données structurées améliorent l\'affichage dans Google',
        affected_pages: ['global'],
        fix_priority: 80
      });
      score -= 25;
    } else {
      const hasOrganizationSchema = schemas.some(s => s.schema_type === 'Organization');
      if (!hasOrganizationSchema) {
        opportunities.push({
          id: 'add-organization-schema',
          type: 'quick_win',
          category: 'semantic',
          title: 'Ajouter un schema Organization',
          description: 'Définir votre entreprise pour Google Knowledge Graph',
          estimated_impact: 'medium',
          effort_required: 'low'
        });
      }

      const hasFAQSchema = schemas.some(s => s.schema_type === 'FAQPage');
      if (!hasFAQSchema) {
        opportunities.push({
          id: 'add-faq-schema',
          type: 'quick_win',
          category: 'semantic',
          title: 'Ajouter des schemas FAQ',
          description: 'Apparaître dans les rich snippets FAQ',
          estimated_impact: 'high',
          effort_required: 'low'
        });
      }
    }

    const { data: jobs } = await supabase.from('jobs').select('id').eq('status', 'active');
    if (jobs && jobs.length > 0) {
      const jobSchemas = schemas?.filter(s => s.schema_type === 'JobPosting') || [];
      if (jobSchemas.length < jobs.length) {
        opportunities.push({
          id: 'add-job-schemas',
          type: 'strategic',
          category: 'semantic',
          title: 'Ajouter JobPosting schemas',
          description: `${jobs.length - jobSchemas.length} offres sans schema`,
          estimated_impact: 'high',
          effort_required: 'medium'
        });
      }
    }

    return { score: Math.max(0, score), issues, opportunities };
  }

  private async auditPerformanceSEO() {
    const issues: SEOIssue[] = [];
    const opportunities: SEOOpportunity[] = [];
    let score = 100;

    const pages = await seoService.getAllPageMeta();

    const priorityPages = pages.filter(p => (p.priority || 0) >= 0.8);
    if (priorityPages.length < 5) {
      opportunities.push({
        id: 'define-priority-pages',
        type: 'strategic',
        category: 'performance',
        title: 'Définir des pages prioritaires',
        description: 'Identifier et optimiser les pages à fort impact business',
        estimated_impact: 'high',
        effort_required: 'low'
      });
    }

    const orphanPages = pages.filter(p => !p.canonical_url && !p.og_image);
    if (orphanPages.length > 0) {
      issues.push({
        id: 'orphan-pages',
        severity: 'medium',
        category: 'performance',
        title: `${orphanPages.length} pages orphelines détectées`,
        description: 'Pages sans liens internes ou images sociales',
        affected_pages: orphanPages.map(p => p.page_path),
        fix_priority: 60
      });
      score -= 15;
    }

    opportunities.push({
      id: 'internal-linking',
      type: 'strategic',
      category: 'performance',
      title: 'Optimiser le maillage interne',
      description: 'Créer des liens contextuels entre pages connexes',
      estimated_impact: 'high',
      effort_required: 'medium'
    });

    opportunities.push({
      id: 'seo-local-guinea',
      type: 'strategic',
      category: 'performance',
      title: 'Développer le SEO local (Guinée)',
      description: 'Créer des pages dédiées par ville (Conakry, Boké, Kindia, etc.)',
      estimated_impact: 'high',
      effort_required: 'high'
    });

    return { score: Math.max(0, score), issues, opportunities };
  }

  private generateRecommendations(issues: SEOIssue[], opportunities: SEOOpportunity[]): SEORecommendation[] {
    const recommendations: SEORecommendation[] = [];

    if (issues.some(i => i.severity === 'critical')) {
      recommendations.push({
        id: 'fix-critical-issues',
        title: 'Correction urgente des problèmes critiques',
        description: 'Résoudre immédiatement les problèmes bloquants pour l\'indexation',
        implementation_steps: [
          'Auditer toutes les pages signalées comme critiques',
          'Ajouter les titres et meta descriptions manquants',
          'Configurer le SEO global si inexistant',
          'Vérifier l\'indexabilité des pages importantes'
        ],
        expected_results: 'Amélioration immédiate de l\'indexation et du crawl',
        timeline: 'Semaine 1'
      });
    }

    if (opportunities.some(o => o.type === 'quick_win')) {
      recommendations.push({
        id: 'implement-quick-wins',
        title: 'Déployer les quick wins SEO',
        description: 'Actions à faible effort mais à impact élevé',
        implementation_steps: [
          'Ajouter Google Search Console',
          'Configurer les URLs canoniques',
          'Ajouter les schemas Organization et FAQPage',
          'Optimiser les images alt text'
        ],
        expected_results: 'Gains rapides de visibilité et CTR',
        timeline: 'Semaines 1-2'
      });
    }

    recommendations.push({
      id: 'content-optimization',
      title: 'Programme d\'optimisation de contenu',
      description: 'Enrichir systématiquement le contenu SEO',
      implementation_steps: [
        'Créer des meta descriptions uniques pour toutes les pages',
        'Optimiser les titres (50-60 caractères)',
        'Ajouter des mots-clés pertinents',
        'Créer du contenu long-form (guides, blog)',
        'Développer le maillage interne'
      ],
      expected_results: 'Amélioration du ranking et du trafic organique',
      timeline: 'Mois 1-2'
    });

    recommendations.push({
      id: 'structured-data-strategy',
      title: 'Stratégie de données structurées',
      description: 'Déployer des schemas pour rich snippets',
      implementation_steps: [
        'Ajouter JobPosting pour toutes les offres',
        'Créer des FAQPage pour pages solutions',
        'Implémenter BreadcrumbList',
        'Ajouter Person schema pour profils candidats',
        'Configurer Course schema pour formations'
      ],
      expected_results: 'Apparition dans rich snippets et amélioration CTR',
      timeline: 'Mois 2'
    });

    recommendations.push({
      id: 'local-seo-guinea',
      title: 'Développement SEO local Guinée',
      description: 'Positionner JobGuinée comme leader RH local',
      implementation_steps: [
        'Créer des pages ville (Conakry, Boké, Kindia, Labé, Kankan)',
        'Optimiser pour "emploi [ville]", "recrutement [ville]"',
        'Ajouter LocalBusiness schema',
        'Créer du contenu local (salaires par ville, secteurs)',
        'Développer backlinks locaux'
      ],
      expected_results: 'Domination SEO locale en Guinée',
      timeline: 'Mois 2-3'
    });

    recommendations.push({
      id: 'b2b-conversion-seo',
      title: 'SEO orienté conversion B2B',
      description: 'Transformer le trafic SEO en clients B2B',
      implementation_steps: [
        'Optimiser les landing pages Solutions B2B',
        'Créer des pages par service (RPO, ATS, CVthèque)',
        'Développer des case studies SEO-friendly',
        'Implémenter des CTA contextuels',
        'Tracker conversion SEO → abonnement'
      ],
      expected_results: 'Augmentation du taux de conversion B2B',
      timeline: 'Mois 3-4'
    });

    return recommendations;
  }

  private async countPages(): Promise<number> {
    const { count } = await supabase
      .from('seo_page_meta')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    return count || 0;
  }

  private async saveAuditReport(result: SEOAuditResult): Promise<void> {
    try {
      await supabase.from('seo_audit_reports').insert({
        overall_score: result.overall_score,
        technical_score: result.technical_score,
        content_score: result.content_score,
        semantic_score: result.semantic_score,
        performance_score: result.performance_score,
        issues_count: result.issues.length,
        opportunities_count: result.opportunities.length,
        pages_analyzed: result.pages_analyzed,
        audit_data: result,
        created_at: result.audit_date
      });
    } catch (error) {
      console.error('Error saving audit report:', error);
    }
  }

  async getLatestAudit(): Promise<SEOAuditResult | null> {
    try {
      const { data, error } = await supabase
        .from('seo_audit_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      return data?.audit_data || null;
    } catch (error) {
      console.error('Error fetching latest audit:', error);
      return null;
    }
  }

  async getAuditHistory(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('seo_audit_reports')
        .select('overall_score, technical_score, content_score, semantic_score, performance_score, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching audit history:', error);
      return [];
    }
  }
}

export const seoAuditService = new SEOAuditService();
