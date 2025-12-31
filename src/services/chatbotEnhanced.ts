import { supabase } from '../lib/supabase';
import { ChatbotService, ChatbotResponse, KnowledgeBaseEntry, ChatMessage, UserContext } from './chatbotService';
import { ChatbotSanitizer, ChatbotRateLimit } from './chatbotSanitizer';
import { AlphaMessages } from './chatbotMessagesAlpha';

interface EnhancedChatContext {
  sessionId: string;
  lastIntent?: string;
  messageCount: number;
  lastMessages: Array<{ user: string; bot: string }>;
  repeatedQuestions: Map<string, number>;
}

export class ChatbotEnhancedService {
  private static contextCache: Map<string, EnhancedChatContext> = new Map();

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
    const answer = AlphaMessages.getClarificationMessage();

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
    let answer = AlphaMessages.limitResponse(kbEntry.answer, 2);

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
    const answer = AlphaMessages.getClarificationMessage();

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

  static clearContext(sessionId: string): void {
    this.contextCache.delete(sessionId);
  }

  static getContextInfo(sessionId: string): EnhancedChatContext | null {
    return this.contextCache.get(sessionId) || null;
  }
}
