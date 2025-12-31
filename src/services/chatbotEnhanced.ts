import { supabase } from '../lib/supabase';
import { ChatbotService, ChatbotResponse, KnowledgeBaseEntry, ChatMessage, UserContext } from './chatbotService';
import { ChatbotSanitizer, ChatbotRateLimit } from './chatbotSanitizer';

interface EnhancedChatContext {
  sessionId: string;
  lastIntent?: string;
  messageCount: number;
  lastMessages: Array<{ user: string; bot: string }>;
  repeatedQuestions: Map<string, number>;
}

export class ChatbotEnhancedService {
  private static contextCache: Map<string, EnhancedChatContext> = new Map();
  private static transitionMessages = [
    "Je réfléchis à la meilleure réponse pour vous...",
    "Laissez-moi un instant, je cherche l'information parfaite...",
    "Un moment s'il vous plaît, je prépare une réponse complète...",
    "Je consulte mes ressources pour vous aider au mieux..."
  ];

  static getTransitionMessage(): string {
    return this.transitionMessages[Math.floor(Math.random() * this.transitionMessages.length)];
  }

  static async askChatbotEnhanced(
    message: string,
    userId: string | null,
    pageUrl: string,
    sessionId: string
  ): Promise<ChatbotResponse> {
    const sanitized = ChatbotSanitizer.fullSanitization(message);
    if (!sanitized.isValid) {
      return {
        success: false,
        answer: sanitized.error || 'Message invalide. Veuillez reformuler votre question.',
        error: 'invalid_input'
      };
    }

    if (userId) {
      const rateLimit = ChatbotRateLimit.checkRateLimit(userId);
      if (!rateLimit.allowed) {
        return {
          success: false,
          answer: rateLimit.reason || 'Trop de messages envoyés. Veuillez patienter.',
          error: 'rate_limit'
        };
      }
    }

    const context = this.getOrCreateContext(sessionId);
    context.messageCount++;

    const cleanMessage = sanitized.sanitized;

    const isRepeated = this.checkRepeatedQuestion(context, cleanMessage);
    if (isRepeated) {
      return this.handleRepeatedQuestion(cleanMessage, context);
    }

    const settings = await ChatbotService.getSettings();
    if (!settings || !settings.is_enabled) {
      return {
        success: false,
        answer: 'Le chatbot est actuellement désactivé.',
        error: 'disabled'
      };
    }

    let userContext: UserContext | null = null;
    if (userId && settings.enable_premium_detection) {
      userContext = await ChatbotService.getUserContext(userId);
    }

    const kbResults = await ChatbotService.searchKnowledgeBase(cleanMessage);

    if (kbResults.length > 0 && kbResults[0].score >= 15) {
      return await this.handleDirectKBResponse(
        kbResults[0],
        cleanMessage,
        userId,
        pageUrl,
        sessionId,
        context,
        userContext
      );
    }

    if (kbResults.length > 0 && kbResults[0].score >= 8 && kbResults[0].score < 15) {
      return await this.handleLowConfidenceKBResponse(
        kbResults,
        cleanMessage,
        userId,
        pageUrl,
        sessionId,
        context,
        userContext
      );
    }

    const conversationHistory = await ChatbotService.getConversationContext(
      sessionId,
      settings.max_context_messages || 10
    );

    return await ChatbotService.askChatbot(cleanMessage, userId, pageUrl, sessionId);
  }

  private static getOrCreateContext(sessionId: string): EnhancedChatContext {
    if (!this.contextCache.has(sessionId)) {
      this.contextCache.set(sessionId, {
        sessionId,
        messageCount: 0,
        lastMessages: [],
        repeatedQuestions: new Map()
      });
    }
    return this.contextCache.get(sessionId)!;
  }

  private static checkRepeatedQuestion(context: EnhancedChatContext, message: string): boolean {
    const normalized = message.toLowerCase().trim();
    const count = context.repeatedQuestions.get(normalized) || 0;
    context.repeatedQuestions.set(normalized, count + 1);

    if (count >= 2) {
      return true;
    }
    return false;
  }

  private static async handleRepeatedQuestion(
    message: string,
    context: EnhancedChatContext
  ): Promise<ChatbotResponse> {
    const reformulations = [
      "Je remarque que vous posez cette question à nouveau. Puis-je reformuler ma réponse différemment ou avez-vous besoin de précisions sur un point spécifique ?",
      "Il semble que ma réponse précédente n'était pas tout à fait claire. Pourriez-vous me préciser ce qui vous manque ?",
      "Je vois que vous revenez sur ce sujet. Y a-t-il un aspect particulier que je n'ai pas bien expliqué ?",
      "Cette question vous préoccupe. Dites-moi exactement ce que vous cherchez à savoir et je vais adapter ma réponse."
    ];

    const answer = reformulations[Math.floor(Math.random() * reformulations.length)];

    return {
      success: true,
      answer,
      intent_detected: 'clarification_needed'
    };
  }

  private static async handleDirectKBResponse(
    kbEntry: KnowledgeBaseEntry,
    message: string,
    userId: string | null,
    pageUrl: string,
    sessionId: string,
    context: EnhancedChatContext,
    userContext: UserContext | null
  ): Promise<ChatbotResponse> {
    let answer = kbEntry.answer;

    answer = this.limitResponseLength(answer);
    answer = this.makeResponseFriendly(answer, userContext);

    context.lastIntent = kbEntry.intent_name;
    context.lastMessages.push({ user: message, bot: answer });
    if (context.lastMessages.length > 10) {
      context.lastMessages.shift();
    }

    if (userId) {
      await ChatbotService.logConversation({
        user_id: userId,
        message_user: message,
        message_bot: answer,
        tokens_used: 0,
        response_time_ms: 0,
        intent_detected: kbEntry.intent_name || 'kb_direct',
        page_url: pageUrl,
        session_id: sessionId
      });
    }

    return {
      success: true,
      answer,
      intent_detected: kbEntry.intent_name
    };
  }

  private static async handleLowConfidenceKBResponse(
    kbResults: KnowledgeBaseEntry[],
    message: string,
    userId: string | null,
    pageUrl: string,
    sessionId: string,
    context: EnhancedChatContext,
    userContext: UserContext | null
  ): Promise<ChatbotResponse> {
    const suggestions = kbResults.slice(0, 3).map((kb, idx) =>
      `${idx + 1}. ${kb.question}`
    ).join('\n');

    const answer = `Je ne suis pas sûr d'avoir bien compris votre question. Vouliez-vous peut-être demander :\n\n${suggestions}\n\nOu pouvez-vous reformuler votre question ?`;

    if (userId) {
      await ChatbotService.logConversation({
        user_id: userId,
        message_user: message,
        message_bot: answer,
        tokens_used: 0,
        response_time_ms: 0,
        intent_detected: 'clarification_needed',
        page_url: pageUrl,
        session_id: sessionId
      });
    }

    return {
      success: true,
      answer,
      intent_detected: 'clarification_needed'
    };
  }

  private static limitResponseLength(answer: string): string {
    const sentences = answer.match(/[^.!?]+[.!?]+/g) || [answer];

    if (sentences.length <= 3) {
      return answer;
    }

    const firstThree = sentences.slice(0, 3).join(' ');

    if (firstThree.length > 500) {
      return firstThree.substring(0, 497) + '...';
    }

    return firstThree;
  }

  private static makeResponseFriendly(answer: string, userContext: UserContext | null): string {
    if (!answer.endsWith('.') && !answer.endsWith('!') && !answer.endsWith('?')) {
      answer += '.';
    }

    if (userContext?.is_premium) {
      const premiumSuffixes = [
        " En tant que membre Premium PRO+, n'hésitez pas à utiliser nos services IA illimités !",
        " Profitez de votre accès Premium pour aller plus loin !",
        " Votre statut Premium vous donne accès à toutes nos fonctionnalités avancées."
      ];

      if (Math.random() > 0.7) {
        answer += premiumSuffixes[Math.floor(Math.random() * premiumSuffixes.length)];
      }
    } else {
      const generalSuffixes = [
        " N'hésitez pas si vous avez d'autres questions !",
        " Je reste à votre disposition pour plus d'informations.",
        " Que puis-je faire d'autre pour vous ?"
      ];

      if (Math.random() > 0.7) {
        answer += generalSuffixes[Math.floor(Math.random() * generalSuffixes.length)];
      }
    }

    return answer;
  }

  static clearContext(sessionId: string): void {
    this.contextCache.delete(sessionId);
  }

  static getContextInfo(sessionId: string): EnhancedChatContext | null {
    return this.contextCache.get(sessionId) || null;
  }
}
