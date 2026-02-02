import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { iaConfigService } from './iaConfigService';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ParsedCVData {
  full_name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  nationality?: string;
  summary: string;
  experiences: Array<{
    position: string;
    company: string;
    period: string;
    start_date?: string;
    end_date?: string;
    missions: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    field?: string;
  }>;
  skills: string[];
  languages: Array<{
    language: string;
    level: string;
  }>;
  certifications: string[];
  driving_license: string[];
  linkedin_url?: string;
  portfolio_url?: string;
  github_url?: string;
  other_urls: string[];
}

export interface CVParseResult {
  success: boolean;
  data?: ParsedCVData;
  error?: string;
  rawText?: string;
  extractionMethod?: 'pdf' | 'docx' | 'ocr';
}

class CVUploadParserService {
  /**
   * Point d'entrée principal: parse un fichier CV
   */
  async parseCV(file: File): Promise<CVParseResult> {
    try {
      // Étape 1: Extraire le texte selon le type de fichier
      const extractionResult = await this.extractText(file);

      if (!extractionResult.success || !extractionResult.text) {
        return {
          success: false,
          error: extractionResult.error || 'Impossible d\'extraire le texte du fichier'
        };
      }

      // Étape 2: Parser le texte avec l'IA
      const parsedData = await this.parseTextWithAI(extractionResult.text);

      if (!parsedData) {
        return {
          success: false,
          error: 'Erreur lors du parsing du CV avec l\'IA',
          rawText: extractionResult.text
        };
      }

      return {
        success: true,
        data: parsedData,
        rawText: extractionResult.text,
        extractionMethod: extractionResult.method
      };
    } catch (error) {
      console.error('Error parsing CV:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Extraction de texte selon le type de fichier
   */
  private async extractText(file: File): Promise<{
    success: boolean;
    text?: string;
    error?: string;
    method?: 'pdf' | 'docx' | 'ocr';
  }> {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    // PDF
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      const pdfResult = await this.extractFromPDF(file);

      // Si le PDF contient peu de texte, essayer l'OCR
      if (pdfResult.text && pdfResult.text.trim().length < 100) {
        console.log('PDF appears to be scanned, trying OCR...');
        return this.extractWithOCR(file);
      }

      return pdfResult;
    }

    // DOCX
    if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      return this.extractFromDOCX(file);
    }

    // Images
    if (fileType.startsWith('image/')) {
      return this.extractWithOCR(file);
    }

    return {
      success: false,
      error: 'Format de fichier non supporté. Utilisez PDF, DOCX ou une image (JPG, PNG).'
    };
  }

  /**
   * Extraction depuis PDF avec détection avancée de colonnes et layout
   */
  private async extractFromPDF(file: File): Promise<{
    success: boolean;
    text?: string;
    error?: string;
    method: 'pdf';
  }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Amélioration: détecter la structure à colonnes
        const items = textContent.items as any[];
        const structuredText = this.extractStructuredText(items);
        fullText += structuredText + '\n';
      }

      return {
        success: true,
        text: fullText.trim(),
        method: 'pdf'
      };
    } catch (error) {
      console.error('Error extracting from PDF:', error);
      return {
        success: false,
        error: 'Erreur lors de l\'extraction du PDF',
        method: 'pdf'
      };
    }
  }

  /**
   * Extraction intelligente de texte avec détection de colonnes
   * Améliore l'extraction pour CV Canva et designs à colonnes
   */
  private extractStructuredText(items: any[]): string {
    if (!items || items.length === 0) return '';

    // Trier les items par position verticale puis horizontale
    const sortedItems = [...items].sort((a, b) => {
      const yDiff = Math.abs(a.transform[5] - b.transform[5]);
      // Si sur la même ligne (marge de 5 pixels)
      if (yDiff < 5) {
        return a.transform[4] - b.transform[4]; // Trier par X
      }
      return b.transform[5] - a.transform[5]; // Trier par Y (haut en bas)
    });

    // Détecter les colonnes
    const columns = this.detectColumns(sortedItems);

    if (columns.length > 1) {
      // CV à colonnes - traiter chaque colonne séparément
      return columns.map(col =>
        col.map(item => item.str).join(' ')
      ).join('\n\n');
    }

    // CV simple - extraction linéaire
    let currentY = sortedItems[0]?.transform[5] || 0;
    let currentLine: string[] = [];
    const lines: string[] = [];

    sortedItems.forEach(item => {
      const y = item.transform[5];
      const text = item.str.trim();

      if (!text) return;

      // Nouvelle ligne si changement significatif de Y
      if (Math.abs(y - currentY) > 5) {
        if (currentLine.length > 0) {
          lines.push(currentLine.join(' '));
          currentLine = [];
        }
        currentY = y;
      }

      currentLine.push(text);
    });

    if (currentLine.length > 0) {
      lines.push(currentLine.join(' '));
    }

    return lines.join('\n');
  }

  /**
   * Détecter les colonnes dans un PDF
   * Utile pour CV Canva et designs modernes
   */
  private detectColumns(items: any[]): any[][] {
    if (items.length === 0) return [[]];

    // Analyser les positions X pour détecter les colonnes
    const xPositions = items.map(item => item.transform[4]);
    const minX = Math.min(...xPositions);
    const maxX = Math.max(...xPositions);
    const width = maxX - minX;

    // Si la largeur est trop petite, pas de colonnes
    if (width < 200) return [items];

    // Détecter les clusters de positions X
    const threshold = width / 3; // Seuil pour détecter une nouvelle colonne
    const columns: any[][] = [];
    let currentColumn: any[] = [];
    let currentColumnX = items[0].transform[4];

    items.forEach(item => {
      const x = item.transform[4];

      // Nouvelle colonne si écart significatif
      if (Math.abs(x - currentColumnX) > threshold && currentColumn.length > 0) {
        columns.push(currentColumn);
        currentColumn = [];
        currentColumnX = x;
      }

      currentColumn.push(item);
    });

    if (currentColumn.length > 0) {
      columns.push(currentColumn);
    }

    return columns.length > 1 ? columns : [items];
  }

  /**
   * Extraction depuis DOCX
   */
  private async extractFromDOCX(file: File): Promise<{
    success: boolean;
    text?: string;
    error?: string;
    method: 'docx';
  }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });

      return {
        success: true,
        text: result.value.trim(),
        method: 'docx'
      };
    } catch (error) {
      console.error('Error extracting from DOCX:', error);
      return {
        success: false,
        error: 'Erreur lors de l\'extraction du DOCX',
        method: 'docx'
      };
    }
  }

  /**
   * Extraction avec OCR (Tesseract)
   */
  private async extractWithOCR(file: File): Promise<{
    success: boolean;
    text?: string;
    error?: string;
    method: 'ocr';
  }> {
    try {
      // Créer le worker Tesseract
      const worker = await createWorker('fra'); // Français par défaut

      // Si c'est un PDF, convertir en image d'abord
      let imageSource: string | File = file;

      if (file.type === 'application/pdf') {
        imageSource = await this.convertPDFToImage(file);
      }

      // Effectuer l'OCR
      const { data: { text } } = await worker.recognize(imageSource);
      await worker.terminate();

      return {
        success: true,
        text: text.trim(),
        method: 'ocr'
      };
    } catch (error) {
      console.error('Error with OCR:', error);
      return {
        success: false,
        error: 'Erreur lors de l\'OCR',
        method: 'ocr'
      };
    }
  }

  /**
   * Convertir la première page d'un PDF en image pour OCR
   */
  private async convertPDFToImage(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1); // Première page seulement

    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    return canvas.toDataURL('image/png');
  }

  /**
   * Parser le texte extrait avec l'IA
   * COÛT: 10 crédits IA
   */
  private async parseTextWithAI(text: string): Promise<ParsedCVData | null> {
    try {
      const result = await iaConfigService.executeService('ai_cv_parser', {
        cv_text: text
      }, { skipCreditConsumption: false });

      if (!result.success || !result.data) {
        console.error('AI parsing failed:', result.error);
        return this.parseTextFallback(text);
      }

      // Valider et nettoyer les données
      return this.validateAndCleanParsedData(result.data);
    } catch (error) {
      console.error('Error parsing with AI:', error);
      return this.parseTextFallback(text);
    }
  }

  /**
   * Parsing fallback avec règles heuristiques (sans IA)
   * Utilisé si l'IA échoue
   */
  private parseTextFallback(text: string): ParsedCVData {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const phoneRegex = /(\+?[0-9]{2,4}[\s.-]?[0-9]{2,3}[\s.-]?[0-9]{2,3}[\s.-]?[0-9]{2,4})/g;
    const urlRegex = /(https?:\/\/[^\s]+)/gi;

    const emails = text.match(emailRegex) || [];
    const phones = text.match(phoneRegex) || [];
    const urls = text.match(urlRegex) || [];

    return {
      full_name: lines[0] || '',
      title: lines[1] || '',
      email: emails[0] || '',
      phone: phones[0] || '',
      location: '',
      nationality: '',
      summary: lines.slice(0, 5).join(' ').substring(0, 200),
      experiences: [],
      education: [],
      skills: [],
      languages: [],
      certifications: [],
      driving_license: [],
      linkedin_url: urls.find(u => u.includes('linkedin')) || '',
      portfolio_url: '',
      github_url: urls.find(u => u.includes('github')) || '',
      other_urls: urls.filter(u => !u.includes('linkedin') && !u.includes('github'))
    };
  }

  /**
   * Valider et nettoyer les données parsées
   */
  private validateAndCleanParsedData(data: any): ParsedCVData {
    return {
      full_name: data.full_name || '',
      title: data.title || '',
      email: data.email || '',
      phone: data.phone || '',
      location: data.location || '',
      nationality: data.nationality || '',
      summary: data.summary || '',
      experiences: Array.isArray(data.experiences) ? data.experiences : [],
      education: Array.isArray(data.education) ? data.education : [],
      skills: Array.isArray(data.skills) ? data.skills : [],
      languages: Array.isArray(data.languages) ? data.languages : [],
      certifications: Array.isArray(data.certifications) ? data.certifications : [],
      driving_license: Array.isArray(data.driving_license) ? data.driving_license : [],
      linkedin_url: data.linkedin_url || '',
      portfolio_url: data.portfolio_url || '',
      github_url: data.github_url || '',
      other_urls: Array.isArray(data.other_urls) ? data.other_urls : []
    };
  }

  /**
   * Générer un résumé professionnel avec l'IA si manquant
   */
  async generateSummary(profileData: Partial<ParsedCVData>): Promise<string> {
    try {
      const prompt = `Génère un résumé professionnel concis (2-3 phrases) basé sur ces informations:
Titre: ${profileData.title}
Compétences: ${profileData.skills?.join(', ')}
Expériences: ${profileData.experiences?.length || 0} expériences
Formation: ${profileData.education?.[0]?.degree || 'Non spécifié'}`;

      // Utiliser le service de coaching IA pour générer le résumé
      const result = await iaConfigService.executeService('ai_coach', {
        question: prompt,
        contexte: 'Génération de résumé professionnel'
      });

      if (result.success && result.data?.reponse) {
        return result.data.reponse;
      }

      return '';
    } catch (error) {
      console.error('Error generating summary:', error);
      return '';
    }
  }

  /**
   * Suggérer des compétences basées sur le titre et l'expérience
   */
  async suggestSkills(title: string, experiences: any[]): Promise<string[]> {
    // Liste de compétences courantes par domaine
    const skillsByDomain: Record<string, string[]> = {
      'développeur|developer|programmeur': ['JavaScript', 'Python', 'React', 'Node.js', 'Git', 'SQL'],
      'rh|ressources humaines|recrutement': ['Recrutement', 'Gestion RH', 'Paie', 'Formation', 'SIRH'],
      'comptable|comptabilité|finance': ['Comptabilité', 'Excel', 'Sage', 'Fiscalité', 'Analyse financière'],
      'marketing|communication': ['Marketing digital', 'Réseaux sociaux', 'SEO', 'Content marketing', 'Google Analytics'],
      'commercial|vente': ['Prospection', 'Négociation', 'CRM', 'Relation client', 'Closing']
    };

    const titleLower = title.toLowerCase();
    const suggestions: string[] = [];

    for (const [pattern, skills] of Object.entries(skillsByDomain)) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(titleLower)) {
        suggestions.push(...skills);
      }
    }

    return [...new Set(suggestions)]; // Supprimer les doublons
  }
}

export const cvUploadParserService = new CVUploadParserService();
