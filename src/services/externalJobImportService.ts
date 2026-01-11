interface ImportedJobData {
  job_title?: string;
  company_name?: string;
  job_description?: string;
  recruiter_email?: string;
  recruiter_name?: string;
  job_url: string;
  external_application_url?: string;
}

interface ImportResult {
  success: boolean;
  data?: ImportedJobData;
  error?: string;
}

class ExternalJobImportService {
  /**
   * Importe les données d'une offre externe via URL
   * Note: En production, utiliser une edge function avec Web Scraping
   */
  async importJobFromURL(url: string): Promise<ImportResult> {
    try {
      if (!this.isValidURL(url)) {
        return {
          success: false,
          error: 'URL invalide. Veuillez saisir une URL complète (ex: https://exemple.com/offre)'
        };
      }

      const result = await this.extractJobData(url);

      if (!result.job_title && !result.company_name) {
        return {
          success: false,
          error: 'Impossible d\'extraire les informations. Veuillez saisir manuellement les détails de l\'offre.',
          data: { job_url: url }
        };
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error importing job from URL:', error);
      return {
        success: false,
        error: 'Erreur lors de l\'import. Veuillez saisir manuellement les détails de l\'offre.',
        data: { job_url: url }
      };
    }
  }

  /**
   * Extrait les données d'une offre depuis l'URL
   * Méthodes:
   * 1. Métadonnées Open Graph (og:title, og:description)
   * 2. Métadonnées standard (title, meta description)
   * 3. Parsing heuristique du HTML
   */
  private async extractJobData(url: string): Promise<ImportedJobData> {
    const result: ImportedJobData = {
      job_url: url
    };

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JobGuinee/1.0)'
        }
      });

      if (!response.ok) {
        return result;
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      result.job_title = this.extractTitle(doc);
      result.company_name = this.extractCompanyName(doc);
      result.job_description = this.extractDescription(doc);
      result.recruiter_email = this.extractEmail(doc);

    } catch (error) {
      console.error('Error extracting job data:', error);
    }

    return result;
  }

  /**
   * Extrait le titre du poste
   */
  private extractTitle(doc: Document): string | undefined {
    const selectors = [
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      'h1.job-title',
      'h1[itemprop="title"]',
      '.job-title',
      'h1'
    ];

    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element) {
        const content = element.getAttribute('content') || element.textContent;
        if (content && content.trim()) {
          return this.cleanText(content);
        }
      }
    }

    const titleElement = doc.querySelector('title');
    if (titleElement?.textContent) {
      const title = titleElement.textContent.split('|')[0].split('-')[0];
      return this.cleanText(title);
    }

    return undefined;
  }

  /**
   * Extrait le nom de l'entreprise
   */
  private extractCompanyName(doc: Document): string | undefined {
    const selectors = [
      'meta[property="og:site_name"]',
      '.company-name',
      '[itemprop="hiringOrganization"]',
      '.employer-name',
      '.company'
    ];

    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element) {
        const content = element.getAttribute('content') || element.textContent;
        if (content && content.trim()) {
          return this.cleanText(content);
        }
      }
    }

    const urlMatch = doc.location?.hostname?.match(/^(?:www\.)?([^.]+)/);
    if (urlMatch) {
      return this.capitalizeFirstLetter(urlMatch[1]);
    }

    return undefined;
  }

  /**
   * Extrait la description du poste
   */
  private extractDescription(doc: Document): string | undefined {
    const selectors = [
      'meta[property="og:description"]',
      'meta[name="description"]',
      '.job-description',
      '[itemprop="description"]',
      '.description'
    ];

    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element) {
        const content = element.getAttribute('content') || element.textContent;
        if (content && content.trim().length > 50) {
          return this.cleanText(content).substring(0, 1000);
        }
      }
    }

    return undefined;
  }

  /**
   * Extrait l'email du recruteur
   */
  private extractEmail(doc: Document): string | undefined {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

    const selectors = [
      'a[href^="mailto:"]',
      '.contact-email',
      '.recruiter-email',
      '[itemprop="email"]'
    ];

    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element) {
        const href = element.getAttribute('href');
        if (href?.startsWith('mailto:')) {
          return href.replace('mailto:', '').split('?')[0];
        }

        const text = element.textContent;
        const match = text?.match(emailRegex);
        if (match) {
          return match[0];
        }
      }
    }

    const bodyText = doc.body.textContent || '';
    const matches = bodyText.match(emailRegex);
    if (matches && matches.length > 0) {
      const validEmails = matches.filter(email =>
        !email.includes('example.com') &&
        !email.includes('placeholder') &&
        !email.includes('noreply')
      );
      if (validEmails.length > 0) {
        return validEmails[0];
      }
    }

    return undefined;
  }

  /**
   * Valide une URL
   */
  private isValidURL(urlString: string): boolean {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Nettoie le texte extrait
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();
  }

  /**
   * Capitalise la première lettre
   */
  private capitalizeFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /**
   * Détecte le site source pour optimiser l'extraction
   */
  detectJobBoardSource(url: string): string | null {
    const hostname = new URL(url).hostname.toLowerCase();

    const sources: Record<string, string[]> = {
      'linkedin': ['linkedin.com'],
      'indeed': ['indeed.com'],
      'glassdoor': ['glassdoor.com'],
      'jobguinee': ['jobguinee.com'],
      'monster': ['monster.com'],
      'careerjet': ['careerjet.com']
    };

    for (const [source, domains] of Object.entries(sources)) {
      if (domains.some(domain => hostname.includes(domain))) {
        return source;
      }
    }

    return null;
  }
}

export const externalJobImportService = new ExternalJobImportService();
export default ExternalJobImportService;
