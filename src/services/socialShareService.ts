import { Job } from '../lib/supabase';
import { generateJobCardDescription } from '../utils/jobNormalization';

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

const BASE_URL = (import.meta.env.VITE_APP_URL || 'https://jobguinee.com').replace(/\/$/, '');
const JOBGUINEE_LOGO = `${BASE_URL}/logo_jobguinee.png`;
const DEFAULT_JOB_IMAGE = `${BASE_URL}/logo_jobguinee.png`;

export const socialShareService = {
  generateJobMetadata(job: Partial<Job> & { companies?: any }): SocialShareMetadata {
    const jobUrl = `${BASE_URL}/share/${job.id}`;
    const jobTitle = job.title || 'Offre d\'emploi';
    const company = job.company_name || (job.companies?.name) || '';

    const title = company ? `${jobTitle} – ${company}` : jobTitle;
    const description = this.generateDescription(job);
    const image = this.getJobShareImage(job);

    return {
      title,
      description,
      image,
      url: jobUrl,
      siteName: 'JobGuinée',
      type: 'website'
    };
  },

  generateDescription(job: Partial<Job> & { companies?: any }): string {
    return generateJobCardDescription({
      title: job.title || 'Offre d\'emploi',
      location: job.location,
      experience_level: job.experience_level,
      sector: job.sector,
      keywords: job.keywords,
      company_name: (job as any).company_name || job.companies?.name,
      companies: job.companies,
    });
  },

  getJobShareImage(job: Partial<Job> & { companies?: any }): string {
    if (!job || !job.id) return DEFAULT_JOB_IMAGE;

    // Same cascade as the social-gateway edge function
    // 1. Pre-generated OG image (best quality, exact 1200x630)
    if ((job as any).og_image_url) {
      return (job as any).og_image_url;
    }

    // 2. Featured image uploaded by the recruiter
    if (job.featured_image_url) {
      return job.featured_image_url;
    }

    // 3. Company logo URL on the job record
    if (job.company_logo_url) {
      return job.company_logo_url;
    }

    // 4. Logo from linked company
    if (job.companies?.logo_url) {
      return job.companies.logo_url;
    }

    // 5. JobGuinée default logo
    return JOBGUINEE_LOGO;
  },

  generateShareLinks(job: Partial<Job>): SocialShareLinks {
    // Use /share/{job_id} route with server-side OG tag serving
    // Crawlers will receive HTML with proper OG tags from Edge Function
    const baseShareUrl = `${BASE_URL}/share/${job.id}`;
    const jobTitle = job.title || 'Offre d\'emploi';
    const encodedTitle = encodeURIComponent(jobTitle);
    const company = job.company_name || job.company || '';

    // Add src={network} parameter for tracking which platform shared the job
    const facebookUrl = `${baseShareUrl}?src=facebook`;
    const linkedinUrl = `${baseShareUrl}?src=linkedin`;
    const twitterUrl = `${baseShareUrl}?src=twitter`;
    const whatsappUrl = `${baseShareUrl}?src=whatsapp`;

    const encodedFacebookUrl = encodeURIComponent(facebookUrl);
    const encodedLinkedinUrl = encodeURIComponent(linkedinUrl);
    const encodedTwitterUrl = encodeURIComponent(twitterUrl);

    const whatsappText = company
      ? `${jobTitle} chez ${company}\n${whatsappUrl}`
      : `${jobTitle}\n${whatsappUrl}`;
    const encodedWhatsappText = encodeURIComponent(whatsappText);

    const twitterText = company
      ? `${jobTitle} chez ${company} sur @JobGuinee`
      : `${jobTitle} sur @JobGuinee`;
    const encodedTwitterText = encodeURIComponent(twitterText);

    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedFacebookUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLinkedinUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedTwitterText}&url=${encodedTwitterUrl}`,
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

    // 1. Pre-generated OG image
    if ((job as any).og_image_url) {
      const exists = await this.checkImageExists((job as any).og_image_url);
      if (exists) return (job as any).og_image_url;
    }

    // 2. Featured image
    if (job.featured_image_url) {
      const exists = await this.checkImageExists(job.featured_image_url);
      if (exists) return job.featured_image_url;
    }

    // 3. Company logo on job record
    if (job.company_logo_url) {
      const exists = await this.checkImageExists(job.company_logo_url);
      if (exists) return job.company_logo_url;
    }

    // 4. Logo from linked company
    if (job.companies?.logo_url) {
      const exists = await this.checkImageExists(job.companies.logo_url);
      if (exists) return job.companies.logo_url;
    }

    return JOBGUINEE_LOGO;
  }
};
