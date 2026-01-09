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
const DEFAULT_SHARE_IMAGE = `${BASE_URL}/assets/share/default-job.png`;

export const socialShareService = {
  generateJobMetadata(job: Partial<Job>): SocialShareMetadata {
    const jobUrl = `${BASE_URL}/offres/${job.id}`;
    const jobTitle = job.title || 'Offre d\'emploi';
    const company = job.company_name || job.company || 'Entreprise';
    const location = job.location || 'Guinée';

    const title = `${jobTitle} – ${location} | JobGuinée`;

    const description = this.generateDescription(job);

    const image = this.getJobShareImage(job.id);

    return {
      title,
      description,
      image,
      url: jobUrl,
      siteName: 'JobGuinée',
      type: 'website'
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

  getJobShareImage(jobId?: string): string {
    if (!jobId) return DEFAULT_SHARE_IMAGE;

    const specificImage = `${BASE_URL}/assets/share/jobs/${jobId}.png`;

    return specificImage;
  },

  generateShareLinks(job: Partial<Job>): SocialShareLinks {
    const jobUrl = `${BASE_URL}/offres/${job.id}`;
    const encodedUrl = encodeURIComponent(jobUrl);
    const jobTitle = job.title || 'Offre d\'emploi';
    const encodedTitle = encodeURIComponent(jobTitle);
    const company = job.company_name || job.company || '';

    const whatsappText = company
      ? `${jobTitle} chez ${company}\n${jobUrl}`
      : `${jobTitle}\n${jobUrl}`;
    const encodedWhatsappText = encodeURIComponent(whatsappText);

    const twitterText = company
      ? `${jobTitle} chez ${company} sur @JobGuinee`
      : `${jobTitle} sur @JobGuinee`;
    const encodedTwitterText = encodeURIComponent(twitterText);

    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedTwitterText}&url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedWhatsappText}`
    };
  },

  openShareLink(platform: keyof SocialShareLinks, links: SocialShareLinks): void {
    const url = links[platform];

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (platform === 'whatsapp' && isMobile) {
      window.location.href = url;
    } else {
      const width = 600;
      const height = 600;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;

      window.open(
        url,
        '_blank',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );
    }
  },

  async trackShare(jobId: string, platform: keyof SocialShareLinks): Promise<void> {
    try {
      const { supabase } = await import('../lib/supabase');

      await supabase
        .from('social_share_analytics')
        .insert({
          job_id: jobId,
          platform,
          shared_at: new Date().toISOString()
        });
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

  async getJobImageWithFallback(jobId?: string): Promise<string> {
    if (!jobId) return DEFAULT_SHARE_IMAGE;

    const specificImage = this.getJobShareImage(jobId);
    const exists = await this.checkImageExists(specificImage);

    return exists ? specificImage : DEFAULT_SHARE_IMAGE;
  }
};
