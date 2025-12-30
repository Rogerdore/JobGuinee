import { supabase } from '../lib/supabase';

export interface B2BPage {
  id?: string;
  page_type: 'hub' | 'externalisation' | 'ats' | 'cvtheque_premium' | 'cabinets_rh' | 'formations_coaching';
  slug: string;
  title: string;
  description: string;
  keywords?: string[];
  h1: string;
  intro_text?: string;
  features?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  benefits?: Array<{
    title: string;
    description: string;
  }>;
  pricing_info?: {
    starting_price?: string;
    pricing_model?: string;
    custom_quote?: boolean;
  };
  testimonials?: Array<{
    company: string;
    author: string;
    role: string;
    quote: string;
    rating?: number;
  }>;
  faq?: Array<{
    question: string;
    answer: string;
  }>;
  primary_cta_text?: string;
  primary_cta_url?: string;
  canonical_url?: string;
  schema_json?: any;
  is_active?: boolean;
}

class SeoB2BPagesService {
  async generateB2BPages(): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;

    try {
      const pages: B2BPage[] = [
        this.generateHubPage(),
        this.generateExternalisationPage(),
        this.generateATSPage(),
        this.generateCvthequePremiumPage(),
        this.generateCabinetsRHPage(),
        this.generateFormationsCoachingPage()
      ];

      for (const page of pages) {
        const exists = await this.pageExists(page.slug);

        if (exists) {
          await this.updatePage(page);
          updated++;
        } else {
          await this.createPage(page);
          created++;
        }
      }

      return { created, updated };
    } catch (error) {
      console.error('Error generating B2B pages:', error);
      return { created, updated };
    }
  }

  private generateHubPage(): B2BPage {
    return {
      page_type: 'hub',
      slug: 'solutions-entreprises',
      title: 'Solutions RH pour Entreprises en Guinée | JobGuinée B2B',
      description: 'Découvrez nos solutions RH complètes pour entreprises en Guinée : externalisation de recrutement, ATS, CVthèque premium, accompagnement cabinets RH et formations.',
      keywords: [
        'solutions rh guinée',
        'recrutement entreprise',
        'gestion talents',
        'b2b guinée',
        'ressources humaines'
      ],
      h1: 'Solutions RH Complètes pour Entreprises',
      intro_text: 'Optimisez votre gestion des talents avec nos solutions RH sur mesure adaptées au marché guinéen.',
      features: [
        {
          icon: 'Users',
          title: 'Externalisation de Recrutement',
          description: 'Confiez vos recrutements à nos experts RH'
        },
        {
          icon: 'BarChart',
          title: 'ATS Nouvelle Génération',
          description: 'Pilotez vos recrutements avec notre logiciel ATS intuitif'
        },
        {
          icon: 'Database',
          title: 'CVthèque Premium',
          description: 'Accédez à des milliers de CV qualifiés'
        },
        {
          icon: 'Briefcase',
          title: 'Accompagnement Cabinets RH',
          description: 'Solutions dédiées aux cabinets de recrutement'
        },
        {
          icon: 'Award',
          title: 'Formations & Coaching',
          description: 'Développez les compétences de vos équipes'
        }
      ],
      benefits: [
        {
          title: 'Gain de temps considérable',
          description: 'Réduisez de 70% le temps consacré au recrutement'
        },
        {
          title: 'Qualité des recrutements',
          description: 'Accédez aux meilleurs talents du marché guinéen'
        },
        {
          title: 'Accompagnement personnalisé',
          description: 'Une équipe dédiée à votre succès RH'
        }
      ],
      testimonials: [
        {
          company: 'Orange Guinée',
          author: 'Mamadou Diallo',
          role: 'Directeur RH',
          quote: 'JobGuinée a transformé notre processus de recrutement. Nous avons réduit nos délais de 60% tout en améliorant la qualité de nos recrutements.',
          rating: 5
        },
        {
          company: 'MTN Guinea',
          author: 'Aissatou Bah',
          role: 'Responsable Talents',
          quote: 'Un partenaire RH de confiance. Leur CVthèque et leur ATS sont des outils indispensables pour nous.',
          rating: 5
        }
      ],
      faq: [
        {
          question: 'Quels sont les tarifs de vos solutions B2B ?',
          answer: 'Nos tarifs sont personnalisés selon vos besoins. Contactez-nous pour un devis gratuit adapté à votre entreprise.'
        },
        {
          question: 'Proposez-vous un accompagnement à la mise en place ?',
          answer: 'Oui, nos équipes vous accompagnent tout au long de la mise en place et de l\'utilisation de nos solutions.'
        },
        {
          question: 'Puis-je essayer vos solutions avant de m\'engager ?',
          answer: 'Absolument ! Nous proposons des démos gratuites et des périodes d\'essai pour toutes nos solutions.'
        }
      ],
      primary_cta_text: 'Demander une démo',
      primary_cta_url: '/b2b-solutions',
      canonical_url: '/b2b/solutions-entreprises',
      is_active: true
    };
  }

  private generateExternalisationPage(): B2BPage {
    return {
      page_type: 'externalisation',
      slug: 'externalisation-recrutement',
      title: 'Externalisation de Recrutement en Guinée | JobGuinée',
      description: 'Confiez vos recrutements à nos experts RH. De la définition du besoin à l\'intégration du candidat, nous gérons tout le processus.',
      keywords: [
        'externalisation recrutement guinée',
        'rpo guinée',
        'recrutement externalisé',
        'sourcing candidats'
      ],
      h1: 'Externalisez Vos Recrutements avec Confiance',
      intro_text: 'De l\'analyse du besoin à l\'intégration, nos experts RH gèrent l\'intégralité de votre processus de recrutement.',
      features: [
        {
          icon: 'Target',
          title: 'Sourcing ciblé',
          description: 'Identification des meilleurs profils sur le marché'
        },
        {
          icon: 'Filter',
          title: 'Présélection qualitative',
          description: 'Évaluation approfondie des compétences et du potentiel'
        },
        {
          icon: 'Users',
          title: 'Gestion des entretiens',
          description: 'Organisation et accompagnement des entretiens'
        },
        {
          icon: 'CheckCircle',
          title: 'Garantie de recrutement',
          description: 'Remplacement gratuit si besoin pendant la période d\'essai'
        }
      ],
      benefits: [
        {
          title: 'Expertise métier',
          description: '10+ ans d\'expérience sur le marché guinéen'
        },
        {
          title: 'Réseau étendu',
          description: 'Accès à un vivier de 50 000+ candidats qualifiés'
        },
        {
          title: 'Process agile',
          description: 'Délais de recrutement réduits de 40% en moyenne'
        }
      ],
      pricing_info: {
        starting_price: 'Sur devis',
        pricing_model: 'Forfait par poste ou success fee',
        custom_quote: true
      },
      faq: [
        {
          question: 'Quels types de postes pouvez-vous recruter ?',
          answer: 'Nous recrutons tous profils, du junior à l\'executive, dans tous secteurs d\'activité.'
        },
        {
          question: 'Quel est votre taux de réussite ?',
          answer: 'Notre taux de validation de période d\'essai est de 92%, bien au-dessus de la moyenne du marché.'
        }
      ],
      primary_cta_text: 'Démarrer un recrutement',
      primary_cta_url: '/b2b-solutions',
      canonical_url: '/b2b/externalisation-recrutement',
      is_active: true
    };
  }

  private generateATSPage(): B2BPage {
    return {
      page_type: 'ats',
      slug: 'logiciel-ats',
      title: 'Logiciel ATS pour Gérer vos Recrutements | JobGuinée',
      description: 'Logiciel ATS (Applicant Tracking System) nouvelle génération pour optimiser votre processus de recrutement en Guinée.',
      keywords: [
        'ats guinée',
        'logiciel recrutement',
        'applicant tracking system',
        'gestion candidatures'
      ],
      h1: 'ATS Nouvelle Génération',
      intro_text: 'Pilotez tous vos recrutements depuis une plateforme unique et intuitive.',
      features: [
        {
          icon: 'Layout',
          title: 'Interface intuitive',
          description: 'Prise en main immédiate, aucune formation nécessaire'
        },
        {
          icon: 'Zap',
          title: 'Automatisations intelligentes',
          description: 'IA pour trier et présélectionner les candidatures'
        },
        {
          icon: 'BarChart',
          title: 'Analytics avancés',
          description: 'Tableaux de bord et KPIs en temps réel'
        },
        {
          icon: 'Users',
          title: 'Collaboration équipe',
          description: 'Travaillez efficacement avec vos hiring managers'
        }
      ],
      pricing_info: {
        starting_price: '250 000 GNF/mois',
        pricing_model: 'Abonnement mensuel ou annuel',
        custom_quote: false
      },
      primary_cta_text: 'Essayer gratuitement',
      primary_cta_url: '/b2b-solutions',
      canonical_url: '/b2b/logiciel-ats',
      is_active: true
    };
  }

  private generateCvthequePremiumPage(): B2BPage {
    return {
      page_type: 'cvtheque_premium',
      slug: 'cvtheque-premium',
      title: 'CVthèque Premium Guinée - Accès Illimité | JobGuinée',
      description: 'Accédez à notre base de données de 50 000+ CV qualifiés en Guinée. Recherche avancée, alertes profils, contacts illimités.',
      keywords: [
        'cvtheque guinée',
        'base cv guinée',
        'recherche candidats',
        'profils qualifiés'
      ],
      h1: 'CVthèque Premium - 50 000+ Profils Qualifiés',
      intro_text: 'La plus grande base de CV de professionnels qualifiés en Guinée.',
      features: [
        {
          icon: 'Database',
          title: 'Base étendue',
          description: '50 000+ CV mis à jour régulièrement'
        },
        {
          icon: 'Search',
          title: 'Recherche multicritères',
          description: 'Filtres avancés pour cibler précisément vos besoins'
        },
        {
          icon: 'Bell',
          title: 'Alertes profils',
          description: 'Soyez notifié des nouveaux profils correspondants'
        },
        {
          icon: 'Download',
          title: 'Export illimité',
          description: 'Téléchargez les CV et coordonnées sans limite'
        }
      ],
      pricing_info: {
        starting_price: '500 000 GNF/mois',
        pricing_model: 'Packs de profils ou accès illimité',
        custom_quote: false
      },
      primary_cta_text: 'Accéder à la CVthèque',
      primary_cta_url: '/cvtheque',
      canonical_url: '/b2b/cvtheque-premium',
      is_active: true
    };
  }

  private generateCabinetsRHPage(): B2BPage {
    return {
      page_type: 'cabinets_rh',
      slug: 'solutions-cabinets-rh',
      title: 'Solutions pour Cabinets de Recrutement | JobGuinée',
      description: 'Outils professionnels dédiés aux cabinets RH et chasseurs de têtes en Guinée. ATS, CVthèque, multidiffusion.',
      keywords: [
        'cabinet recrutement guinée',
        'chasseur têtes',
        'solutions rh',
        'outils recrutement'
      ],
      h1: 'Solutions Dédiées aux Cabinets RH',
      intro_text: 'Des outils professionnels pensés pour les métiers du recrutement.',
      features: [
        {
          icon: 'Users',
          title: 'Gestion multi-clients',
          description: 'Gérez tous vos clients depuis une interface unique'
        },
        {
          icon: 'Database',
          title: 'CVthèque illimitée',
          description: 'Accès premium à toute notre base de données'
        },
        {
          icon: 'Share2',
          title: 'Multidiffusion d\'offres',
          description: 'Publiez sur plusieurs canaux simultanément'
        },
        {
          icon: 'TrendingUp',
          title: 'Reporting clients',
          description: 'Tableaux de bord personnalisables pour vos clients'
        }
      ],
      pricing_info: {
        starting_price: '1 500 000 GNF/mois',
        pricing_model: 'Pack cabinet avec support dédié',
        custom_quote: true
      },
      primary_cta_text: 'Demander une démo',
      primary_cta_url: '/b2b-solutions',
      canonical_url: '/b2b/solutions-cabinets-rh',
      is_active: true
    };
  }

  private generateFormationsCoachingPage(): B2BPage {
    return {
      page_type: 'formations_coaching',
      slug: 'formations-coaching-rh',
      title: 'Formations RH et Coaching en Entreprise | JobGuinée',
      description: 'Programmes de formation RH sur mesure : recrutement, gestion talents, entretiens, évaluations. Coaching individuel et collectif.',
      keywords: [
        'formation rh guinée',
        'coaching entreprise',
        'développement compétences',
        'formation recrutement'
      ],
      h1: 'Formations & Coaching RH Sur Mesure',
      intro_text: 'Développez les compétences RH de vos équipes avec nos programmes certifiants.',
      features: [
        {
          icon: 'BookOpen',
          title: 'Formations certifiantes',
          description: 'Programmes reconnus en techniques de recrutement'
        },
        {
          icon: 'Users',
          title: 'Coaching collectif',
          description: 'Accompagnement d\'équipes RH et managers'
        },
        {
          icon: 'Target',
          title: 'Coaching individuel',
          description: 'Développement des compétences en 1-to-1'
        },
        {
          icon: 'Award',
          title: 'Sur mesure',
          description: 'Programmes adaptés à vos enjeux spécifiques'
        }
      ],
      pricing_info: {
        starting_price: '500 000 GNF/jour',
        pricing_model: 'Tarifs dégressifs selon volume',
        custom_quote: true
      },
      primary_cta_text: 'Découvrir nos formations',
      primary_cta_url: '/formations',
      canonical_url: '/b2b/formations-coaching-rh',
      is_active: true
    };
  }

  private async pageExists(slug: string): Promise<boolean> {
    const { data } = await supabase
      .from('seo_b2b_pages')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    return !!data;
  }

  private async createPage(page: B2BPage): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('seo_b2b_pages')
        .insert([page]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating B2B page:', error);
      return false;
    }
  }

  private async updatePage(page: B2BPage): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('seo_b2b_pages')
        .update({
          ...page,
          updated_at: new Date().toISOString()
        })
        .eq('slug', page.slug);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating B2B page:', error);
      return false;
    }
  }

  async getPage(slug: string): Promise<B2BPage | null> {
    try {
      const { data, error } = await supabase
        .from('seo_b2b_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching B2B page:', error);
      return null;
    }
  }

  async trackCTAClick(slug: string): Promise<void> {
    try {
      const { data: page } = await supabase
        .from('seo_b2b_pages')
        .select('cta_click_count')
        .eq('slug', slug)
        .maybeSingle();

      if (page) {
        await supabase
          .from('seo_b2b_pages')
          .update({ cta_click_count: (page.cta_click_count || 0) + 1 })
          .eq('slug', slug);
      }
    } catch (error) {
      console.error('Error tracking CTA click:', error);
    }
  }

  async trackLeadConversion(slug: string): Promise<void> {
    try {
      const { data: page } = await supabase
        .from('seo_b2b_pages')
        .select('lead_count')
        .eq('slug', slug)
        .maybeSingle();

      if (page) {
        await supabase
          .from('seo_b2b_pages')
          .update({ lead_count: (page.lead_count || 0) + 1 })
          .eq('slug', slug);
      }
    } catch (error) {
      console.error('Error tracking lead conversion:', error);
    }
  }
}

export const seoB2BPagesService = new SeoB2BPagesService();
