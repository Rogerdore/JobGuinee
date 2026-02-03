/**
 * Service d'agrégation des données d'offre d'emploi
 *
 * Ce service collecte et structure TOUTES les données d'une offre d'emploi
 * pour l'exploitation par les systèmes d'IA (matching, résumé, génération d'emails)
 *
 * IMPORTANT : Ce service agrège l'intégralité des données du formulaire,
 * pas seulement le champ description.
 */

import { JobFormData } from '../types/jobFormTypes';

export interface JobContentBlock {
  type: 'text' | 'pdf' | 'image' | 'docx';
  content: string;
  metadata: {
    blockId?: string;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    position?: number;
  };
}

export interface AggregatedJobData {
  // Données structurées du formulaire
  formData: JobFormData;

  // Contenu enrichi de la description
  descriptionBlocks: JobContentBlock[];

  // Texte brut consolidé pour l'IA
  fullTextContent: string;

  // Métadonnées des fichiers attachés
  attachedFiles: {
    pdfs: Array<{ name: string; size: number; blockId: string }>;
    images: Array<{ name: string; size: number; blockId: string }>;
  };

  // Données complètes pour l'IA
  aiReadyData: {
    jobTitle: string;
    category: string;
    location: string;
    contractType: string;
    experienceLevel: string;
    educationLevel: string;
    skills: string[];
    languages: string[];
    salary: {
      range: string;
      type: string;
    };
    description: string;
    responsibilities: string;
    profile: string;
    company: {
      name: string;
      sector: string;
      description: string;
      website?: string;
    };
    benefits: string[];
    fullContent: string;
    hasAttachments: boolean;
    attachmentCount: number;
  };
}

/**
 * Extrait les blocs de contenu du HTML de description
 */
export function extractContentBlocks(htmlContent: string): JobContentBlock[] {
  const blocks: JobContentBlock[] = [];

  if (!htmlContent) return blocks;

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Extraire les blocs PDF
  const pdfBlocks = doc.querySelectorAll('[data-block-type="pdf"]');
  pdfBlocks.forEach((block, index) => {
    const fileName = block.getAttribute('data-file-name') || 'document.pdf';
    const fileSize = parseInt(block.getAttribute('data-file-size') || '0');
    const blockId = block.getAttribute('data-block-id') || `pdf-${index}`;

    blocks.push({
      type: 'pdf',
      content: `[PDF: ${fileName}]`,
      metadata: {
        blockId,
        fileName,
        fileSize,
        fileType: 'application/pdf',
        position: index,
      },
    });
  });

  // Extraire les blocs images
  const imageBlocks = doc.querySelectorAll('img');
  imageBlocks.forEach((img, index) => {
    const fileName = img.getAttribute('alt') || img.getAttribute('title') || 'image.jpg';
    const src = img.getAttribute('src') || '';

    blocks.push({
      type: 'image',
      content: `[Image: ${fileName}]`,
      metadata: {
        blockId: `img-${index}`,
        fileName,
        fileType: 'image',
        position: index,
      },
    });
  });

  // Extraire le texte
  const textContent = doc.body.textContent || '';
  if (textContent.trim()) {
    blocks.push({
      type: 'text',
      content: textContent.trim(),
      metadata: {
        position: blocks.length,
      },
    });
  }

  return blocks;
}

/**
 * Convertit le HTML en texte brut pour l'IA
 */
export function htmlToPlainText(html: string): string {
  if (!html) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Supprimer les blocs PDF et images (déjà référencés séparément)
  doc.querySelectorAll('[data-block-type="pdf"], .pdf-visual-block').forEach(el => el.remove());
  doc.querySelectorAll('img').forEach(el => {
    const alt = el.getAttribute('alt') || el.getAttribute('title');
    if (alt) {
      el.replaceWith(document.createTextNode(`[Image: ${alt}]`));
    } else {
      el.remove();
    }
  });

  // Convertir en texte brut
  const text = doc.body.textContent || '';

  // Nettoyer les espaces multiples et les sauts de ligne
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

/**
 * Agrège toutes les données du formulaire pour l'IA
 */
export function aggregateJobData(formData: JobFormData): AggregatedJobData {
  const descriptionBlocks = extractContentBlocks(formData.description);
  const responsibilitiesText = htmlToPlainText(formData.responsibilities);
  const profileText = htmlToPlainText(formData.profile);
  const descriptionText = htmlToPlainText(formData.description);

  // Identifier les fichiers attachés
  const pdfs = descriptionBlocks
    .filter(b => b.type === 'pdf')
    .map(b => ({
      name: b.metadata.fileName || 'document.pdf',
      size: b.metadata.fileSize || 0,
      blockId: b.metadata.blockId || '',
    }));

  const images = descriptionBlocks
    .filter(b => b.type === 'image')
    .map(b => ({
      name: b.metadata.fileName || 'image',
      size: b.metadata.fileSize || 0,
      blockId: b.metadata.blockId || '',
    }));

  // Construire le contenu complet pour l'IA
  const fullTextContent = [
    `Titre : ${formData.title}`,
    `Catégorie : ${formData.category}`,
    `Localisation : ${formData.location}`,
    `Type de contrat : ${formData.contract_type}`,
    `Niveau de poste : ${formData.position_level}`,
    `Expérience requise : ${formData.experience_required}`,
    `Niveau d'études : ${formData.education_level}`,
    formData.primary_qualification ? `Qualification principale : ${formData.primary_qualification}` : '',
    formData.skills.length > 0 ? `Compétences : ${formData.skills.join(', ')}` : '',
    formData.language_requirements?.length > 0
      ? `Langues : ${formData.language_requirements.map(l => `${l.language} (${l.level})`).join(', ')}`
      : '',
    descriptionText ? `Description : ${descriptionText}` : '',
    responsibilitiesText ? `Missions : ${responsibilitiesText}` : '',
    profileText ? `Profil recherché : ${profileText}` : '',
    formData.company_name ? `Entreprise : ${formData.company_name}` : '',
    formData.sector ? `Secteur : ${formData.sector}` : '',
    formData.company_description ? `À propos de l'entreprise : ${htmlToPlainText(formData.company_description)}` : '',
    formData.salary_range ? `Salaire : ${formData.salary_range} (${formData.salary_type})` : '',
    formData.benefits.length > 0 ? `Avantages : ${formData.benefits.join(', ')}` : '',
    pdfs.length > 0 ? `Documents PDF joints : ${pdfs.map(p => p.name).join(', ')}` : '',
    images.length > 0 ? `Images jointes : ${images.length} image(s)` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    formData,
    descriptionBlocks,
    fullTextContent,
    attachedFiles: { pdfs, images },
    aiReadyData: {
      jobTitle: formData.title,
      category: formData.category,
      location: formData.location,
      contractType: formData.contract_type,
      experienceLevel: formData.experience_required,
      educationLevel: formData.education_level,
      skills: formData.skills,
      languages: formData.language_requirements?.map(l => `${l.language} (${l.level})`) || [],
      salary: {
        range: formData.salary_range,
        type: formData.salary_type,
      },
      description: descriptionText,
      responsibilities: responsibilitiesText,
      profile: profileText,
      company: {
        name: formData.company_name,
        sector: formData.sector,
        description: htmlToPlainText(formData.company_description),
        website: formData.website,
      },
      benefits: formData.benefits,
      fullContent: fullTextContent,
      hasAttachments: pdfs.length > 0 || images.length > 0,
      attachmentCount: pdfs.length + images.length,
    },
  };
}

/**
 * Génère un résumé court pour l'IA (max 500 caractères)
 */
export function generateJobSummary(aggregatedData: AggregatedJobData): string {
  const { aiReadyData } = aggregatedData;

  const parts = [
    `${aiReadyData.jobTitle} (${aiReadyData.contractType})`,
    `à ${aiReadyData.location}`,
    aiReadyData.company.name ? `chez ${aiReadyData.company.name}` : '',
    aiReadyData.experienceLevel ? `- ${aiReadyData.experienceLevel} d'expérience` : '',
    aiReadyData.skills.length > 0 ? `- Compétences: ${aiReadyData.skills.slice(0, 3).join(', ')}` : '',
  ].filter(Boolean).join(' ');

  return parts.length > 500 ? parts.substring(0, 497) + '...' : parts;
}

/**
 * Vérifie si le contenu est suffisant pour l'exploitation IA
 */
export function validateJobDataForAI(aggregatedData: AggregatedJobData): {
  isValid: boolean;
  missingFields: string[];
  score: number;
} {
  const missing: string[] = [];
  let score = 0;

  // Champs obligatoires
  if (!aggregatedData.aiReadyData.jobTitle) missing.push('Titre du poste');
  else score += 20;

  if (!aggregatedData.aiReadyData.location) missing.push('Localisation');
  else score += 15;

  if (!aggregatedData.aiReadyData.category) missing.push('Catégorie');
  else score += 10;

  // Champs importants
  if (!aggregatedData.aiReadyData.description) missing.push('Description');
  else score += 20;

  if (aggregatedData.aiReadyData.skills.length === 0) missing.push('Compétences');
  else score += 15;

  if (!aggregatedData.aiReadyData.experienceLevel) missing.push('Niveau d\'expérience');
  else score += 10;

  if (!aggregatedData.aiReadyData.company.name) missing.push('Nom de l\'entreprise');
  else score += 10;

  return {
    isValid: missing.length === 0 || score >= 50,
    missingFields: missing,
    score,
  };
}
