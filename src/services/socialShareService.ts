import { Job } from '../lib/supabase';

export interface SocialShareMetadata {
  title: string;
  description: string;
  image: string;
  url: string;
  siteName: string;
  type: string;
}

export interface SocialShareLinks {
  facebook: string;
  linkedin: string;
  twitter: string;
  whatsapp: string;
}

const BASE_URL = import.meta.env.VITE_APP_URL || 'https://jobguinee-pro.com';
const SUPABASE_FUNCTIONS_URL = 'https://hhhjzgeidjqctuveopso.supabase.co/functions/v1';
const JOBGUINEE_LOGO = `${BASE_URL}/logo_jobguinee.png`;
const DEFAULT_JOB_IMAGE = JOBGUINEE_LOGO;

export const socialShareService = {
  generateJobMetadata(job: Partial<Job> & { companies?: any }): SocialShareMetadata {
    // Use canonical jobguinee-pro.com URL for social sharing
    // Cloudflare Worker intercepts crawlers and proxies to Supabase Edge Function
    const slug = (job as any).slug || job.id;
    const jobUrl = `${BASE_URL}/offres/${slug}`;
    const jobTitle = job.title || 'Offre d\'emploi';
    const company = job.company_name || job.company || 'Entreprise';
    const location = job.location || 'Guinée';

    const title = `${jobTitle} – ${location} | JobGuinée`;

    const description = this.generateDescription(job);

    const image = this.getJobShareImage(job);

    return {
      title,
      description,
      image,
      url: jobUrl,
      siteName: 'JobGuinée',
      type: 'article'
    };
  },

  generateDescription(job: Partial<Job>): string {
    const parts: string[] = [];

    if (job.company_name || job.company) {
      parts.push(`Recrutement chez ${job.company_name || job.company}`);
    }

    if (job.contract_type) {
      const contractTypes: Record<string, string> = {
        'CDI': 'Contrat CDI',
        'CDD': 'Contrat CDD',
        'Stage': 'Stage',
        'Alternance': 'Alternance',
        'Freelance': 'Freelance',
        'Interim': 'Intérim'
      };
      parts.push(contractTypes[job.contract_type] || job.contract_type);
    }

    if (job.location) {
      parts.push(`à ${job.location}`);
    }

    if (job.salary_min && job.salary_max) {
      parts.push(`Salaire: ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} GNF`);
    } else if (job.salary_range) {
      parts.push(`Salaire: ${job.salary_range}`);
    }

    let description = parts.join(' • ');

    if (job.description) {
      const cleanDesc = job.description
        .replace(/<[^>]*>/g, '')
        .trim()
        .substring(0, 150);

      if (description) {
        description += ` | ${cleanDesc}`;
      } else {
        description = cleanDesc;
      }
    }

    if (!description) {
      description = 'Découvrez cette opportunité d\'emploi en Guinée sur JobGuinée, la première plateforme de recrutement professionnelle du pays.';
    }

    if (description.length > 200) {
      description = description.substring(0, 197) + '...';
    }

    return description;
  },

  getJobShareImage(job: Partial<Job> & { companies?: any }): string {
    if (!job || !job.id) return DEFAULT_JOB_IMAGE;

    // Cascade intelligente d'images
    // 1. Image de mise en avant uploadée par le recruteur
    if (job.featured_image_url) {
      return job.featured_image_url;
    }

    // 2. Logo de l'entreprise (prioritaire si disponible)
    if (job.company_logo_url) {
      return job.company_logo_url;
    }

    if (job.companies?.logo_url) {
      return job.companies.logo_url;
    }

    // 3. Logo JobGuinée par défaut
    return JOBGUINEE_LOGO;
  },

  generateMarketingText(job: Partial<Job>): string {
    const title = job.title || 'Offre d\'emploi';
    const company = job.company_name || job.company || '';
    const slug = (job as any).slug || job.id;
    const url = `${BASE_URL}/offres/${slug}`;

    const lines: string[] = [];

    lines.push(`🔔📢 AVIS DE RECRUTEMENT`);
    lines.push('');
    if (company) {
      lines.push(`🏢 ${company} recrute !`);
      lines.push('');
    }
    lines.push(`💼 Poste : ${title}`);

    if ((job as any).location) lines.push(`📍 Lieu : ${(job as any).location}`);
    if ((job as any).contract_type) lines.push(`📄 Contrat : ${(job as any).contract_type}`);
    if ((job as any).experience_level) lines.push(`⭐ Expérience : ${(job as any).experience_level}`);
    if ((job as any).education_level) lines.push(`🎓 Formation : ${(job as any).education_level}`);
    if ((job as any).sector) lines.push(`🏭 Secteur : ${(job as any).sector}`);
    if ((job as any).salary_range) {
      lines.push(`💰 Salaire : ${(job as any).salary_range}`);
    } else if (job.salary_min && job.salary_max) {
      lines.push(`💰 Salaire : ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} GNF`);
    }
    if ((job as any).position_count && (job as any).position_count > 1) {
      lines.push(`👥 Nombre de postes : ${(job as any).position_count}`);
    }
    if ((job as any).announcement_language) lines.push(`🌐 Langue : ${(job as any).announcement_language}`);

    if ((job as any).deadline) {
      try {
        const d = new Date((job as any).deadline);
        const formatted = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
        lines.push(`⏰ Date limite : ${formatted}`);
      } catch { /* skip */ }
    }

    lines.push('');
    lines.push(`✅ Postulez maintenant sur JobGuinée 👇`);
    lines.push(`🔗 ${url}`);
    lines.push('');
    lines.push(`📲 Partagez autour de vous, quelqu'un en a peut-être besoin ! 🙏`);
    lines.push(`#Emploi #Recrutement #JobGuinée #Guinée`);

    return lines.join('\n');
  },

  generateShareLinks(job: Partial<Job>): SocialShareLinks {
    // Use jobguinee-pro.com/offres/ URL for sharing
    // Cloudflare Worker intercepts crawler requests and proxies to Supabase Edge Function
    // This ensures the canonical URL matches the shared URL
    const slug = (job as any).slug || job.id;
    const baseShareUrl = `${BASE_URL}/offres/${slug}`;
    const jobTitle = job.title || 'Offre d\'emploi';
    const encodedTitle = encodeURIComponent(jobTitle);
    const company = job.company_name || job.company || '';

    // Do NOT append ?src= tracking params to share URLs
    // Facebook/LinkedIn cache URLs including query params separately from og:url
    // This causes the debugger to show correct data but shares to use stale cache
    // Tracking is already handled client-side via trackShare()
    const encodedShareUrl = encodeURIComponent(baseShareUrl);

    // Use the full marketing text for WhatsApp and Facebook quote
    const marketingText = this.generateMarketingText(job);
    const encodedWhatsappText = encodeURIComponent(marketingText);

    const twitterText = company
      ? `${jobTitle} chez ${company} sur @JobGuinee`
      : `${jobTitle} sur @JobGuinee`;
    const encodedTwitterText = encodeURIComponent(twitterText);

    const facebookQuote = encodeURIComponent(marketingText);

    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedShareUrl}&quote=${facebookQuote}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedShareUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedTwitterText}&url=${encodedShareUrl}`,
      whatsapp: `https://wa.me/?text=${encodedWhatsappText}`
    };
  },

  openShareLink(platform: keyof SocialShareLinks, links: SocialShareLinks): boolean {
    const url = links[platform];

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (platform === 'whatsapp' && isMobile) {
      window.location.href = url;
      return true;
    }

    // Ouvrir dans un nouvel onglet (pas popup) pour éviter les bloqueurs
    const newWindow = window.open(url, '_blank');

    if (newWindow) {
      newWindow.focus();
      return true;
    }

    // Fallback si le popup blocker bloque window.open
    // Utiliser un lien temporaire pour forcer l'ouverture
    try {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } catch {
      return false;
    }
  },

  async trackShare(jobId: string, platform: keyof SocialShareLinks): Promise<void> {
    try {
      const { realtimeCountersService } = await import('./realtimeCountersService');

      const result = await realtimeCountersService.trackShare(
        jobId,
        platform as 'facebook' | 'linkedin' | 'twitter' | 'whatsapp',
        'manual'
      );

      if (!result.success && result.status !== 'blocked_spam') {
        console.warn('Share tracking failed:', result.message);
      }
    } catch (error) {
      console.error('Error tracking share:', error);
    }
  },

  copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise((resolve, reject) => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();

      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        resolve();
      } catch (error) {
        document.body.removeChild(textArea);
        reject(error);
      }
    });
  },

  checkImageExists(imageUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = imageUrl;
    });
  },

  async getJobImageWithFallback(job: Partial<Job> & { companies?: any }): Promise<string> {
    if (!job || !job.id) return JOBGUINEE_LOGO;

    // 1. Vérifier l'image de mise en avant
    if (job.featured_image_url) {
      const featuredExists = await this.checkImageExists(job.featured_image_url);
      if (featuredExists) {
        return job.featured_image_url;
      }
    }

    // 2. Vérifier le logo de l'entreprise (prioritaire)
    if (job.company_logo_url) {
      const companyLogoExists = await this.checkImageExists(job.company_logo_url);
      if (companyLogoExists) {
        return job.company_logo_url;
      }
    }

    if (job.companies?.logo_url) {
      const companiesLogoExists = await this.checkImageExists(job.companies.logo_url);
      if (companiesLogoExists) {
        return job.companies.logo_url;
      }
    }

    // 3. Fallback universel : logo JobGuinée
    return JOBGUINEE_LOGO;
  }
};
