export class ChatbotSanitizer {
  private static readonly MAX_MESSAGE_LENGTH = 5000;
  private static readonly DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<\s*\/?\s*[a-z][^>]*>/gi,
    /\x00/g,
    /[\u200B-\u200D\uFEFF]/g,
    /[\x00-\x1F\x7F-\x9F]/g
  ];

  static sanitize(message: string): { sanitized: string; isValid: boolean; error?: string } {
    if (!message || typeof message !== 'string') {
      return {
        sanitized: '',
        isValid: false,
        error: 'Message invalide'
      };
    }

    if (message.length > this.MAX_MESSAGE_LENGTH) {
      return {
        sanitized: message.substring(0, this.MAX_MESSAGE_LENGTH),
        isValid: false,
        error: `Message trop long (max ${this.MAX_MESSAGE_LENGTH} caractères)`
      };
    }

    let sanitized = message;

    for (const pattern of this.DANGEROUS_PATTERNS) {
      sanitized = sanitized.replace(pattern, '');
    }

    sanitized = sanitized.trim();

    sanitized = sanitized.replace(/\s+/g, ' ');

    if (sanitized.length < 2) {
      return {
        sanitized: '',
        isValid: false,
        error: 'Message trop court'
      };
    }

    const hasDangerousContent = this.DANGEROUS_PATTERNS.some(pattern =>
      message.match(pattern)
    );

    if (hasDangerousContent && sanitized !== message) {
      console.warn('[Chatbot] Dangerous content detected and removed from message');
    }

    return {
      sanitized,
      isValid: true
    };
  }

  static validateEmojis(message: string): string {
    return message.replace(/[\uD800-\uDFFF]/g, (char, index, str) => {
      const prev = str.charCodeAt(index - 1);
      if (prev >= 0xD800 && prev <= 0xDBFF) {
        return char;
      }
      return '';
    });
  }

  static removeInvisibleCharacters(message: string): string {
    return message
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      .replace(/\u202E/g, '')
      .replace(/\uFEFF/g, '');
  }

  static normalizeWhitespace(message: string): string {
    return message
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  static fullSanitization(message: string): { sanitized: string; isValid: boolean; error?: string } {
    const step1 = this.removeInvisibleCharacters(message);
    const step2 = this.validateEmojis(step1);
    const step3 = this.normalizeWhitespace(step2);
    return this.sanitize(step3);
  }
}

export class ChatbotRateLimit {
  private static messageTimestamps: Map<string, number[]> = new Map();
  private static readonly MAX_MESSAGES_PER_MINUTE = 10;
  private static readonly MAX_MESSAGES_PER_HOUR = 50;
  private static readonly CLEANUP_INTERVAL = 60000;

  static {
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.cleanup();
      }, this.CLEANUP_INTERVAL);
    }
  }

  static checkRateLimit(userId: string): { allowed: boolean; reason?: string; waitTime?: number } {
    const now = Date.now();
    const timestamps = this.messageTimestamps.get(userId) || [];

    const oneMinuteAgo = now - 60 * 1000;
    const recentMessages = timestamps.filter(t => t > oneMinuteAgo);

    if (recentMessages.length >= this.MAX_MESSAGES_PER_MINUTE) {
      const oldestMessage = recentMessages[0];
      const waitTime = Math.ceil((oldestMessage + 60 * 1000 - now) / 1000);
      return {
        allowed: false,
        reason: `Trop de messages envoyés. Veuillez patienter ${waitTime} secondes.`,
        waitTime
      };
    }

    const oneHourAgo = now - 60 * 60 * 1000;
    const hourlyMessages = timestamps.filter(t => t > oneHourAgo);

    if (hourlyMessages.length >= this.MAX_MESSAGES_PER_HOUR) {
      return {
        allowed: false,
        reason: 'Limite horaire atteinte. Veuillez réessayer dans une heure.'
      };
    }

    const updatedTimestamps = [...timestamps.filter(t => t > oneHourAgo), now];
    this.messageTimestamps.set(userId, updatedTimestamps);

    return { allowed: true };
  }

  private static cleanup() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [userId, timestamps] of this.messageTimestamps.entries()) {
      const filtered = timestamps.filter(t => t > oneHourAgo);
      if (filtered.length === 0) {
        this.messageTimestamps.delete(userId);
      } else {
        this.messageTimestamps.set(userId, filtered);
      }
    }
  }
}
