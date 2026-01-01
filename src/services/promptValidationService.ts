export interface PromptValidationResult {
  valid: boolean;
  score: number;
  warnings: string[];
  suggestions: string[];
  details: {
    length: number;
    hasRoleDefinition: boolean;
    hasInstructions: boolean;
    hasOutputFormat: boolean;
    hasExamples: boolean;
    hasVariables: boolean;
  };
}

export class PromptValidationService {
  static validate(prompt: string): PromptValidationResult {
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const length = prompt.length;
    const hasRoleDefinition = this.checkRoleDefinition(prompt);
    const hasInstructions = this.checkInstructions(prompt);
    const hasOutputFormat = this.checkOutputFormat(prompt);
    const hasExamples = this.checkExamples(prompt);
    const hasVariables = this.checkVariables(prompt);

    if (length < 50) {
      warnings.push('Prompt trop court (< 50 caractères)');
      score -= 25;
    } else if (length < 100) {
      suggestions.push('Le prompt pourrait être plus détaillé (< 100 caractères)');
      score -= 10;
    }

    if (length > 4000) {
      warnings.push('Prompt très long (> 4000 caractères) - Risque de coûts élevés');
      score -= 10;
    } else if (length > 3000) {
      suggestions.push('Prompt long (> 3000 caractères) - Considérez la concision');
      score -= 5;
    }

    if (!hasRoleDefinition) {
      suggestions.push('Ajouter une définition de rôle claire (ex: "Tu es un expert en..."');
      score -= 15;
    }

    if (!hasInstructions) {
      warnings.push('Aucune instruction explicite détectée');
      suggestions.push('Ajouter des instructions claires avec des étapes numérotées');
      score -= 20;
    }

    if (!hasOutputFormat) {
      suggestions.push('Spécifier le format de sortie attendu (JSON, texte, liste, etc.)');
      score -= 15;
    }

    if (!hasExamples && length > 200) {
      suggestions.push('Ajouter des exemples pour améliorer la qualité des réponses');
      score -= 10;
    }

    if (!hasVariables) {
      suggestions.push('Utiliser des variables dynamiques pour personnaliser les réponses');
      score -= 5;
    }

    const complexityScore = this.checkComplexity(prompt);
    if (complexityScore < 3) {
      suggestions.push('Le prompt manque de structure - Ajouter des sections claires');
      score -= 10;
    }

    const clarityScore = this.checkClarity(prompt);
    if (clarityScore < 70) {
      warnings.push('Certaines phrases sont ambiguës ou peu claires');
      score -= 10;
    }

    score = Math.max(0, Math.min(100, score));

    return {
      valid: score >= 50,
      score,
      warnings,
      suggestions,
      details: {
        length,
        hasRoleDefinition,
        hasInstructions,
        hasOutputFormat,
        hasExamples,
        hasVariables
      }
    };
  }

  private static checkRoleDefinition(prompt: string): boolean {
    const rolePatterns = [
      /tu es/i,
      /you are/i,
      /en tant que/i,
      /as a/i,
      /agis comme/i,
      /act as/i,
      /ton rôle/i,
      /your role/i
    ];

    return rolePatterns.some(pattern => pattern.test(prompt));
  }

  private static checkInstructions(prompt: string): boolean {
    const instructionPatterns = [
      /instructions?:/i,
      /étapes?:/i,
      /directives?:/i,
      /tu dois/i,
      /you must/i,
      /veuillez/i,
      /please/i,
      /\d+\./,
      /•/,
      /-\s+[A-Z]/
    ];

    return instructionPatterns.some(pattern => pattern.test(prompt));
  }

  private static checkOutputFormat(prompt: string): boolean {
    const formatPatterns = [
      /format/i,
      /structure/i,
      /retourne/i,
      /renvoie/i,
      /return/i,
      /output/i,
      /réponse doit/i,
      /response must/i,
      /json/i,
      /markdown/i,
      /liste/i,
      /list/i
    ];

    return formatPatterns.some(pattern => pattern.test(prompt));
  }

  private static checkExamples(prompt: string): boolean {
    const examplePatterns = [
      /exemple/i,
      /example/i,
      /par exemple/i,
      /for instance/i,
      /comme/i,
      /such as/i,
      /illustration/i
    ];

    return examplePatterns.some(pattern => pattern.test(prompt));
  }

  private static checkVariables(prompt: string): boolean {
    const variablePatterns = [
      /\{\{.*?\}\}/,
      /\{.*?\}/,
      /\[.*?\]/,
      /\$\{.*?\}/
    ];

    return variablePatterns.some(pattern => pattern.test(prompt));
  }

  private static checkComplexity(prompt: string): number {
    let complexity = 0;

    if (prompt.includes('\n')) complexity++;

    const sections = prompt.split(/\n\n+/);
    if (sections.length > 1) complexity++;

    if (/#{1,6}\s/.test(prompt)) complexity++;

    if (/\d+\./.test(prompt) || /•/.test(prompt) || /-\s+[A-Z]/.test(prompt)) {
      complexity++;
    }

    if (prompt.split('\n').length > 5) complexity++;

    return complexity;
  }

  private static checkClarity(prompt: string): number {
    let clarityScore = 100;

    const sentences = prompt.split(/[.!?]+/);
    const avgSentenceLength = prompt.length / sentences.length;

    if (avgSentenceLength > 150) {
      clarityScore -= 15;
    } else if (avgSentenceLength > 100) {
      clarityScore -= 10;
    }

    const vaguePhrases = [
      'peut-être',
      'probablement',
      'essaie de',
      'tente de',
      'si possible',
      'idéalement'
    ];

    vaguePhrases.forEach(phrase => {
      if (prompt.toLowerCase().includes(phrase)) {
        clarityScore -= 5;
      }
    });

    const wordCount = prompt.split(/\s+/).length;
    const uniqueWords = new Set(prompt.toLowerCase().split(/\s+/)).size;
    const repetitionRate = uniqueWords / wordCount;

    if (repetitionRate < 0.3) {
      clarityScore -= 20;
    } else if (repetitionRate < 0.5) {
      clarityScore -= 10;
    }

    return Math.max(0, clarityScore);
  }

  static getScoreColor(score: number): string {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    if (score >= 40) return 'orange';
    return 'red';
  }

  static getScoreLabel(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Bon';
    if (score >= 40) return 'Acceptable';
    return 'À améliorer';
  }
}
