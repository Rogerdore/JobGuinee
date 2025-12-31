export class AlphaMessages {
  static getWelcomeMessage(isPremium: boolean): string {
    if (isPremium) {
      return "Bonjour! Je suis Alpha, l'assistant virtuel JobGuinee.\n\nVous êtes Premium PRO+. Profitez de tous vos services IA illimités !\n\nQue souhaitez-vous faire aujourd'hui ?";
    }
    return "Bonjour! Je suis Alpha, l'assistant virtuel JobGuinee. Besoin d'aide? Je suis là pour vous.\n\nQue souhaitez-vous faire aujourd'hui ?";
  }

  static getSubtitle(): string {
    return "Assistant intelligent pour l'emploi et la carrière en Guinée";
  }

  static getProactiveMessage(): string {
    const messages = [
      "Besoin d'aide pour démarrer ? 🚀",
      "Je peux vous guider ! Posez-moi une question 😊",
      "Prêt à créer votre CV ou chercher un emploi ? 💼"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  static getSuccessMessage(): string {
    const messages = [
      "Bravo 🎉 On avance très bien !",
      "Parfait ! Continuons 💪",
      "Super ! Que puis-je faire d'autre pour vous ?"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  static getBlockedMessage(reason: string): string {
    return `Un petit accès est requis. ${reason} 🙂`;
  }

  static getNavigationConfirmation(destination: string): string {
    return `Je vous amène vers ${destination} ?`;
  }

  static getNavigationSuccess(destination: string): string {
    return `✓ Direction ${destination} !`;
  }

  static getClarificationMessage(): string {
    return "Je ne suis pas sûr de comprendre. Pouvez-vous reformuler ?";
  }

  static getIdleMessage(): string {
    const messages = [
      "Toujours là si besoin 🙂",
      "Je reste à votre disposition !",
      "N'hésitez pas à demander 💬"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  static getRole(): string {
    return "Bonjour! Je suis Alpha, l'assistant virtuel JobGuinee. Besoin d'aide? Je suis là pour vous.\n\nQue souhaitez-vous faire aujourd'hui ?";
  }

  static getTone(): string {
    return "professionnel, bienveillant, court, motivant";
  }

  static limitResponse(response: string, maxParagraphs: number = 2): string {
    const paragraphs = response.split('\n\n').filter(p => p.trim().length > 0);

    if (paragraphs.length <= maxParagraphs) {
      return response;
    }

    const limited = paragraphs.slice(0, maxParagraphs).join('\n\n');

    if (limited.length > 300) {
      return limited.substring(0, 297) + '...';
    }

    return limited;
  }

  static addActionAndAlternative(
    baseMessage: string,
    primaryAction?: { label: string; route: string },
    alternativeAction?: { label: string; route: string }
  ): {
    message: string;
    suggested_links?: Array<{ label: string; page: string }>;
  } {
    let message = baseMessage;
    const links: Array<{ label: string; page: string }> = [];

    if (primaryAction) {
      links.push({ label: primaryAction.label, page: primaryAction.route });
    }

    if (alternativeAction) {
      links.push({ label: alternativeAction.label, page: alternativeAction.route });
    }

    return {
      message,
      suggested_links: links.length > 0 ? links : undefined
    };
  }
}
