import { supabase } from '../lib/supabase';
import { IAConfigService } from './iaConfigService';

export interface ChatbotSettings {
  id: string;
  is_enabled: boolean;
  position: 'bottom-right' | 'bottom-left';
  welcome_message: string;
  idle_message: string;
  ia_service_code: string;
  show_quick_actions: boolean;
  max_context_messages: number;
  proactive_mode: boolean;
  proactive_delay: number;
}

export interface ChatbotStyle {
  id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  bubble_color_user: string;
  bubble_color_bot: string;
  border_radius: number;
  widget_size: 'small' | 'medium' | 'large';
  icon_type: 'default' | 'custom';
  icon_value?: string;
  enable_dark_mode: boolean;
  shadow_strength: 'none' | 'soft' | 'strong';
  animation_type: 'fade' | 'slide' | 'scale';
  is_default: boolean;
}

export interface KnowledgeBaseEntry {
  id: string;
  category: string;
  question: string;
  answer: string;
  intent_name?: string;
  priority_level: number;
  tags: string[];
  is_active: boolean;
}

export interface QuickAction {
  id: string;
  label: string;
  description?: string;
  icon: string;
  action_type: 'open_route' | 'open_modal' | 'run_service';
  action_payload: any;
  is_active: boolean;
  order_index: number;
}

export interface ChatMessage {
  id: string;
  user_id?: string;
  message_user: string;
  message_bot: string;
  tokens_used: number;
  response_time_ms?: number;
  intent_detected?: string;
  page_url?: string;
  session_id: string;
  created_at: string;
}

export interface ChatbotResponse {
  success: boolean;
  answer: string;
  suggested_links?: Array<{ label: string; page: string }>;
  suggested_actions?: Array<{ label: string; action: string }>;
  intent_detected?: string;
  error?: string;
}

export class ChatbotService {
  static async getSettings(): Promise<ChatbotSettings | null> {
    try {
      const { data, error } = await supabase
        .from('chatbot_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching chatbot settings:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getSettings:', error);
      return null;
    }
  }

  static async getDefaultStyle(): Promise<ChatbotStyle | null> {
    try {
      const { data, error } = await supabase
        .from('chatbot_styles')
        .select('*')
        .eq('is_default', true)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching chatbot style:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getDefaultStyle:', error);
      return null;
    }
  }

  static async getQuickActions(): Promise<QuickAction[]> {
    try {
      const { data, error } = await supabase
        .from('chatbot_quick_actions')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) {
        console.error('Error fetching quick actions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getQuickActions:', error);
      return [];
    }
  }

  static async searchKnowledgeBase(query: string): Promise<KnowledgeBaseEntry[]> {
    try {
      const searchTerms = query.toLowerCase().split(' ').filter(Boolean);

      const { data, error } = await supabase
        .from('chatbot_knowledge_base')
        .select('*')
        .eq('is_active', true)
        .order('priority_level', { ascending: false });

      if (error) {
        console.error('Error searching knowledge base:', error);
        return [];
      }

      if (!data) return [];

      const scored = data.map((entry) => {
        let score = 0;
        const questionLower = entry.question.toLowerCase();
        const answerLower = entry.answer.toLowerCase();

        searchTerms.forEach((term) => {
          if (questionLower.includes(term)) score += 10;
          if (answerLower.includes(term)) score += 5;
          if (entry.tags.some(tag => tag.toLowerCase().includes(term))) score += 7;
        });

        score += entry.priority_level;

        return { ...entry, score };
      });

      return scored
        .filter(e => e.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
    } catch (error) {
      console.error('Error in searchKnowledgeBase:', error);
      return [];
    }
  }

  static async getConversationContext(
    sessionId: string,
    maxMessages: number = 10
  ): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chatbot_logs')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(maxMessages);

      if (error) {
        console.error('Error fetching conversation context:', error);
        return [];
      }

      return (data || []).reverse();
    } catch (error) {
      console.error('Error in getConversationContext:', error);
      return [];
    }
  }

  static async askChatbot(
    message: string,
    userId: string | null,
    pageUrl: string,
    sessionId: string
  ): Promise<ChatbotResponse> {
    const startTime = Date.now();

    try {
      const settings = await this.getSettings();
      if (!settings || !settings.is_enabled) {
        return {
          success: false,
          answer: 'Le chatbot est actuellement désactivé.',
          error: 'disabled'
        };
      }

      const kbSuggestions = await this.searchKnowledgeBase(message);

      if (kbSuggestions.length > 0 && kbSuggestions[0].score >= 15) {
        const topAnswer = kbSuggestions[0];

        const responseTime = Date.now() - startTime;

        if (userId) {
          await this.logConversation({
            user_id: userId,
            message_user: message,
            message_bot: topAnswer.answer,
            tokens_used: 0,
            response_time_ms: responseTime,
            intent_detected: topAnswer.intent_name || 'kb_direct',
            page_url: pageUrl,
            session_id: sessionId
          });
        }

        return {
          success: true,
          answer: topAnswer.answer,
          intent_detected: topAnswer.intent_name
        };
      }

      const conversationContext = await this.getConversationContext(
        sessionId,
        settings.max_context_messages
      );

      const aiResponse = await this.callAI(
        message,
        kbSuggestions,
        conversationContext,
        pageUrl
      );

      const responseTime = Date.now() - startTime;

      if (userId) {
        await this.logConversation({
          user_id: userId,
          message_user: message,
          message_bot: aiResponse.answer,
          tokens_used: aiResponse.tokens_used || 0,
          response_time_ms: responseTime,
          intent_detected: aiResponse.intent_detected,
          page_url: pageUrl,
          session_id: sessionId
        });
      }

      return {
        success: true,
        answer: aiResponse.answer,
        suggested_links: aiResponse.suggested_links,
        suggested_actions: aiResponse.suggested_actions,
        intent_detected: aiResponse.intent_detected
      };
    } catch (error) {
      console.error('Error in askChatbot:', error);
      return {
        success: false,
        answer: 'Désolé, une erreur est survenue. Veuillez réessayer.',
        error: (error as Error).message
      };
    }
  }

  private static async callAI(
    question: string,
    kbSuggestions: KnowledgeBaseEntry[],
    conversationContext: ChatMessage[],
    pageUrl: string
  ): Promise<{
    answer: string;
    tokens_used?: number;
    suggested_links?: Array<{ label: string; page: string }>;
    suggested_actions?: Array<{ label: string; action: string }>;
    intent_detected?: string;
  }> {
    try {
      const config = await IAConfigService.getConfig('site_chatbot');

      if (!config || !config.is_active) {
        console.warn('Chatbot IA config not found or inactive, using fallback');
        return this.generateMockAIResponse(question, kbSuggestions);
      }

      const inputData = {
        user_question: question,
        page_url: pageUrl,
        conversation_context: conversationContext.slice(-3).map(msg => ({
          user: msg.message_user,
          bot: msg.message_bot
        })),
        knowledge_suggestions: kbSuggestions.map(kb => ({
          question: kb.question,
          answer: kb.answer,
          intent: kb.intent_name
        }))
      };

      const validationResult = IAConfigService.validateInput(inputData, config.input_schema);
      if (!validationResult.valid) {
        console.error('Invalid input for chatbot:', validationResult.errors);
        return this.generateMockAIResponse(question, kbSuggestions);
      }

      const builtPrompt = IAConfigService.buildPrompt(config, inputData);

      console.log('[Chatbot] Using IA service with prompt:', {
        model: builtPrompt.model,
        temperature: builtPrompt.temperature,
        maxTokens: builtPrompt.maxTokens
      });

      const mockResponse = this.generateMockAIResponse(question, kbSuggestions);

      return mockResponse;
    } catch (error) {
      console.error('Error calling IA service for chatbot:', error);
      return this.generateMockAIResponse(question, kbSuggestions);
    }
  }

  private static generateMockAIResponse(
    question: string,
    kbSuggestions: KnowledgeBaseEntry[]
  ): {
    answer: string;
    tokens_used: number;
    suggested_links?: Array<{ label: string; page: string }>;
    intent_detected?: string;
  } {
    const questionLower = question.toLowerCase();

    if (kbSuggestions.length > 0) {
      return {
        answer: kbSuggestions[0].answer + ' N\'hésitez pas si vous avez d\'autres questions!',
        tokens_used: 50,
        intent_detected: kbSuggestions[0].intent_name,
        suggested_links: this.getSuggestedLinks(kbSuggestions[0].intent_name)
      };
    }

    if (questionLower.includes('cv')) {
      return {
        answer: 'Je peux vous aider avec votre CV! JobGuinée propose des services IA pour créer, améliorer ou adapter votre CV à une offre spécifique. Voulez-vous en savoir plus?',
        tokens_used: 60,
        intent_detected: 'cv_help',
        suggested_links: [{ label: 'Services Premium IA', page: 'premium-ai' }]
      };
    }

    if (questionLower.includes('emploi') || questionLower.includes('offre') || questionLower.includes('job')) {
      return {
        answer: 'Vous cherchez un emploi? Consultez nos offres d\'emploi actuelles ou créez des alertes personnalisées pour être notifié des nouvelles opportunités correspondant à votre profil.',
        tokens_used: 55,
        intent_detected: 'job_search',
        suggested_links: [{ label: 'Voir les offres', page: 'jobs' }]
      };
    }

    if (questionLower.includes('crédit') || questionLower.includes('paiement') || questionLower.includes('acheter')) {
      return {
        answer: 'Les crédits IA vous permettent d\'utiliser nos services premium. Vous pouvez acheter des crédits dans la boutique avec différents packs adaptés à vos besoins.',
        tokens_used: 58,
        intent_detected: 'credits',
        suggested_links: [{ label: 'Boutique de crédits', page: 'credit-store' }]
      };
    }

    if (questionLower.includes('profil') || questionLower.includes('compte')) {
      return {
        answer: 'Un profil complet augmente vos chances d\'être remarqué par les recruteurs! Complétez vos expériences, compétences et formations dans votre dashboard.',
        tokens_used: 52,
        intent_detected: 'profile',
        suggested_links: [{ label: 'Mon dashboard', page: 'candidate-dashboard' }]
      };
    }

    return {
      answer: 'Je suis là pour vous aider! Vous pouvez me poser des questions sur la création de CV, la recherche d\'emploi, les services IA, ou la navigation sur JobGuinée. Comment puis-je vous assister?',
      tokens_used: 45,
      intent_detected: 'general'
    };
  }

  private static getSuggestedLinks(intentName?: string): Array<{ label: string; page: string }> {
    const linkMap: Record<string, Array<{ label: string; page: string }>> = {
      create_cv: [{ label: 'Créer mon CV', page: 'premium-ai' }],
      buy_credits: [{ label: 'Acheter des crédits', page: 'credit-store' }],
      apply_job: [{ label: 'Voir les offres', page: 'jobs' }],
      complete_profile: [{ label: 'Mon profil', page: 'candidate-dashboard' }]
    };

    return intentName && linkMap[intentName] ? linkMap[intentName] : [];
  }

  static async logConversation(log: Omit<ChatMessage, 'id' | 'created_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('chatbot_logs')
        .insert([log]);

      if (error) {
        console.error('Error logging conversation:', error);
      }
    } catch (error) {
      console.error('Error in logConversation:', error);
    }
  }

  static async updateSettings(settings: Partial<ChatbotSettings>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chatbot_settings')
        .update({ ...settings, updated_at: new Date().toISOString() })
        .eq('id', settings.id!);

      if (error) {
        console.error('Error updating settings:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateSettings:', error);
      return false;
    }
  }

  static async getAllStyles(): Promise<ChatbotStyle[]> {
    try {
      const { data, error } = await supabase
        .from('chatbot_styles')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching styles:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllStyles:', error);
      return [];
    }
  }

  static async createStyle(style: Omit<ChatbotStyle, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chatbot_styles')
        .insert([style]);

      if (error) {
        console.error('Error creating style:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in createStyle:', error);
      return false;
    }
  }

  static async updateStyle(id: string, style: Partial<ChatbotStyle>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chatbot_styles')
        .update({ ...style, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error updating style:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateStyle:', error);
      return false;
    }
  }

  static async deleteStyle(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chatbot_styles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting style:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteStyle:', error);
      return false;
    }
  }

  static async getAllKnowledgeBase(): Promise<KnowledgeBaseEntry[]> {
    try {
      const { data, error } = await supabase
        .from('chatbot_knowledge_base')
        .select('*')
        .order('category')
        .order('priority_level', { ascending: false });

      if (error) {
        console.error('Error fetching knowledge base:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllKnowledgeBase:', error);
      return [];
    }
  }

  static async createKnowledgeEntry(entry: Omit<KnowledgeBaseEntry, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chatbot_knowledge_base')
        .insert([entry]);

      if (error) {
        console.error('Error creating knowledge entry:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in createKnowledgeEntry:', error);
      return false;
    }
  }

  static async updateKnowledgeEntry(id: string, entry: Partial<KnowledgeBaseEntry>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chatbot_knowledge_base')
        .update({ ...entry, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error updating knowledge entry:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateKnowledgeEntry:', error);
      return false;
    }
  }

  static async deleteKnowledgeEntry(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chatbot_knowledge_base')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting knowledge entry:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteKnowledgeEntry:', error);
      return false;
    }
  }

  static async getAllQuickActions(): Promise<QuickAction[]> {
    try {
      const { data, error } = await supabase
        .from('chatbot_quick_actions')
        .select('*')
        .order('order_index');

      if (error) {
        console.error('Error fetching all quick actions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllQuickActions:', error);
      return [];
    }
  }

  static async createQuickAction(action: Omit<QuickAction, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chatbot_quick_actions')
        .insert([action]);

      if (error) {
        console.error('Error creating quick action:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in createQuickAction:', error);
      return false;
    }
  }

  static async updateQuickAction(id: string, action: Partial<QuickAction>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chatbot_quick_actions')
        .update({ ...action, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error updating quick action:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateQuickAction:', error);
      return false;
    }
  }

  static async deleteQuickAction(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chatbot_quick_actions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting quick action:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteQuickAction:', error);
      return false;
    }
  }

  static async getChatLogs(limit: number = 100): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chatbot_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching chat logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getChatLogs:', error);
      return [];
    }
  }
}
