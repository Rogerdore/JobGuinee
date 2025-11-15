export interface ParsedJobData {
  title?: string;
  description?: string;
  location?: string;
  contract_type?: string;
  salary_min?: number;
  salary_max?: number;
  sector?: string;
  experience_level?: string;
  education_level?: string;
  responsibilities?: string;
  requirements?: string;
  benefits?: string;
  company_name?: string;
  company_description?: string;
  company_email?: string;
  deadline?: string;
  skills?: string[];
  languages?: string[];
}

interface SectionPattern {
  field: keyof ParsedJobData;
  patterns: RegExp[];
  endPatterns?: RegExp[];
}

const SECTION_PATTERNS: SectionPattern[] = [
  {
    field: 'title',
    patterns: [
      /(?:titre\s+du\s+poste|poste|intitul[ée]\s+du\s+poste)\s*[:：]\s*(.+)/i,
      /^(.+?)\s*[-–—]\s*(?:CDI|CDD|Stage|Alternance|Freelance)/i,
    ],
  },
  {
    field: 'location',
    patterns: [
      /(?:lieu|localisation|location|ville|r[ée]gion)\s*[:：]\s*(.+)/i,
      /(?:bas[ée]\s+[àa]|situ[ée]\s+[àa])\s+(.+?)(?:\.|,|\n|$)/i,
    ],
  },
  {
    field: 'contract_type',
    patterns: [
      /(?:type\s+de\s+contrat|contrat)\s*[:：]\s*(.+)/i,
      /\b(CDI|CDD|Stage|Alternance|Freelance|Intérim|Temps\s+(?:plein|partiel))\b/i,
    ],
  },
  {
    field: 'salary_min',
    patterns: [
      /(?:salaire|r[ée]mun[ée]ration)\s*[:：]?\s*(?:de\s+)?(\d+[\s\u00A0]?\d*)\s*(?:€|euros?|k€)/i,
    ],
  },
  {
    field: 'experience_level',
    patterns: [
      /(?:exp[ée]rience|niveau\s+d'exp[ée]rience)\s*[:：]\s*(.+)/i,
      /(\d+\s+(?:an|année)s?\s+d'exp[ée]rience)/i,
      /\b(D[ée]butant|Junior|Confirm[ée]|Senior|Expert)\b/i,
    ],
  },
  {
    field: 'education_level',
    patterns: [
      /(?:niveau\s+d'[ée]tudes?|formation|dipl[ôo]me)\s*[:：]\s*(.+)/i,
      /\b(Bac|Bac\+\d|Licence|Master|Doctorat|Ing[ée]nieur)\b/i,
    ],
  },
  {
    field: 'deadline',
    patterns: [
      /(?:date\s+limite|candidature\s+avant|postuler\s+avant)\s*[:：]\s*(.+)/i,
      /(?:limite|deadline)\s*[:：]\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    ],
  },
  {
    field: 'company_email',
    patterns: [
      /(?:email|e-mail|contact|candidature)\s*[:：]\s*([\w\.-]+@[\w\.-]+\.\w+)/i,
      /([\w\.-]+@[\w\.-]+\.\w+)/i,
    ],
  },
];

const MULTI_LINE_SECTIONS: SectionPattern[] = [
  {
    field: 'description',
    patterns: [
      /(?:description\s+du\s+poste|pr[ée]sentation\s+du\s+poste|contexte|[àa]\s+propos\s+du\s+poste)\s*[:：]?\s*$/i,
    ],
    endPatterns: [
      /^(?:missions?|responsabilit[ée]s?|profil|comp[ée]tences?|qualifications?|avantages?|entreprise)\s*[:：]?\s*$/i,
    ],
  },
  {
    field: 'responsibilities',
    patterns: [
      /^(?:missions?|responsabilit[ée]s?|t[âa]ches?|activit[ée]s?)\s*[:：]?\s*$/i,
      /^(?:vos?\s+)?missions?\s+principales?\s*[:：]?\s*$/i,
    ],
    endPatterns: [
      /^(?:profil|comp[ée]tences?|qualifications?|avantages?|entreprise|description)\s*[:：]?\s*$/i,
    ],
  },
  {
    field: 'requirements',
    patterns: [
      /^(?:profil\s+recherch[ée]|profil|comp[ée]tences?|qualifications?|pr[ée]requis|exigences?)\s*[:：]?\s*$/i,
      /^(?:vous\s+[êe]tes|nous\s+recherchons)\s*[:：]?\s*$/i,
    ],
    endPatterns: [
      /^(?:missions?|avantages?|entreprise|description|salaire)\s*[:：]?\s*$/i,
    ],
  },
  {
    field: 'benefits',
    patterns: [
      /^(?:avantages?|b[ée]n[ée]fices?|nous\s+offrons|nous\s+proposons)\s*[:：]?\s*$/i,
    ],
    endPatterns: [
      /^(?:entreprise|description|profil|missions?|modalit[ée]s?)\s*[:：]?\s*$/i,
    ],
  },
  {
    field: 'company_description',
    patterns: [
      /^(?:[àa]\s+propos\s+de\s+(?:l')?entreprise|(?:l')?entreprise|qui\s+sommes-nous|pr[ée]sentation\s+de\s+l'entreprise)\s*[:：]?\s*$/i,
    ],
    endPatterns: [
      /^(?:description|profil|missions?|avantages?|modalit[ée]s?)\s*[:：]?\s*$/i,
    ],
  },
];

export function parseJobDocument(rawText: string): ParsedJobData {
  const result: ParsedJobData = {};
  const lines = rawText.split(/\r?\n/).map(line => line.trim()).filter(line => line);

  console.log('📝 Parsing job document, lines:', lines.length);

  // Extract single-line fields
  for (const line of lines) {
    for (const pattern of SECTION_PATTERNS) {
      for (const regex of pattern.patterns) {
        const match = line.match(regex);
        if (match && match[1]) {
          const value = match[1].trim();

          if (pattern.field === 'salary_min' || pattern.field === 'salary_max') {
            const numValue = parseInt(value.replace(/[\s\u00A0]/g, ''));
            if (!isNaN(numValue)) {
              result[pattern.field] = numValue;
            }
          } else {
            if (!result[pattern.field]) {
              result[pattern.field] = value;
              console.log(`✓ Found ${pattern.field}:`, value);
            }
          }
          break;
        }
      }
    }
  }

  // Extract multi-line sections
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const section of MULTI_LINE_SECTIONS) {
      const matchesPattern = section.patterns.some(regex => regex.test(line));

      if (matchesPattern && !result[section.field]) {
        console.log(`📖 Found section start: ${section.field}`);
        const sectionLines: string[] = [];

        // Collect lines until we hit an end pattern or run out of lines
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];

          // Check if this is the start of another section
          const isEndSection = section.endPatterns?.some(regex => regex.test(nextLine));
          if (isEndSection) {
            console.log(`📖 Found section end: ${section.field} at line ${j}`);
            break;
          }

          // Check if this line matches any other section start
          const isOtherSectionStart = MULTI_LINE_SECTIONS.some(otherSection =>
            otherSection !== section && otherSection.patterns.some(regex => regex.test(nextLine))
          );
          if (isOtherSectionStart) {
            break;
          }

          sectionLines.push(nextLine);
        }

        if (sectionLines.length > 0) {
          result[section.field] = sectionLines.join('\n').trim();
          console.log(`✓ Extracted ${section.field}, length:`, result[section.field]?.length);
        }
      }
    }
  }

  // Extract company name (usually at the top)
  if (!result.company_name && lines.length > 0) {
    const firstLine = lines[0];
    if (firstLine.length < 100 && !firstLine.toLowerCase().includes('offre')) {
      result.company_name = firstLine;
      console.log('✓ Found company_name:', firstLine);
    }
  }

  // Extract skills (look for bullet points or comma-separated lists)
  const skillsPatterns = [
    /(?:comp[ée]tences?\s+(?:requises?|souhait[ée]es?)?)\s*[:：]\s*(.+)/i,
    /(?:technologies?|outils?)\s*[:：]\s*(.+)/i,
  ];

  for (const line of lines) {
    for (const regex of skillsPatterns) {
      const match = line.match(regex);
      if (match && match[1]) {
        const skillsText = match[1];
        const skills = skillsText.split(/[,;]/).map(s => s.trim()).filter(s => s);
        if (skills.length > 0) {
          result.skills = skills;
          console.log('✓ Found skills:', skills);
          break;
        }
      }
    }
  }

  // Extract languages
  const languagePatterns = [
    /(?:langues?|language)\s*[:：]\s*(.+)/i,
  ];

  for (const line of lines) {
    for (const regex of languagePatterns) {
      const match = line.match(regex);
      if (match && match[1]) {
        const langsText = match[1];
        const langs = langsText.split(/[,;]/).map(s => s.trim()).filter(s => s);
        if (langs.length > 0) {
          result.languages = langs;
          console.log('✓ Found languages:', langs);
          break;
        }
      }
    }
  }

  // If no description found, use the first large paragraph
  if (!result.description) {
    const paragraphs = rawText.split(/\n\s*\n/).filter(p => p.trim().length > 100);
    if (paragraphs.length > 0) {
      result.description = paragraphs[0].trim();
      console.log('✓ Using first paragraph as description, length:', result.description.length);
    }
  }

  console.log('✅ Parsing complete. Fields found:', Object.keys(result));
  return result;
}

export function formatSalary(text: string): { min?: number; max?: number } {
  const salaryPattern = /(\d+[\s\u00A0]?\d*)\s*(?:€|k€|euros?)(?:\s*[-–—à]\s*(\d+[\s\u00A0]?\d*)\s*(?:€|k€|euros?))?/i;
  const match = text.match(salaryPattern);

  if (match) {
    const min = parseInt(match[1].replace(/[\s\u00A0]/g, ''));
    const max = match[2] ? parseInt(match[2].replace(/[\s\u00A0]/g, '')) : undefined;

    return {
      min: !isNaN(min) ? min : undefined,
      max: max && !isNaN(max) ? max : undefined,
    };
  }

  return {};
}
