import { supabase } from '../lib/supabase';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatbotConversation {
  id: string;
  user_id: string | null;
  session_id: string;
  title: string;
  messages: ChatMessage[];
  topic: string | null;
  is_archived: boolean;
  total_messages: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export const chatbotConversationService = {
  generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  async createConversation(userId?: string): Promise<ChatbotConversation> {
    const { data: { user } } = await supabase.auth.getUser();
    const sessionId = this.generateSessionId();

    const { data, error } = await supabase
      .from('chatbot_conversations')
      .insert({
        user_id: userId || user?.id || null,
        session_id: sessionId,
        title: 'Nouvelle conversation',
        messages: [],
        total_messages: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getConversations(): Promise<ChatbotConversation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) throw error;
    return data || [];
  },

  async getConversation(id: string): Promise<ChatbotConversation> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Conversation not found');

    if (user && data.user_id !== user.id && data.user_id !== null) {
      throw new Error('Unauthorized');
    }

    return data;
  },

  async addMessage(
    conversationId: string,
    message: ChatMessage
  ): Promise<ChatbotConversation> {
    const { data: { user } } = await supabase.auth.getUser();

    const conversation = await this.getConversation(conversationId);

    const updatedMessages = [...(conversation.messages || []), message];
    const messageCount = updatedMessages.length;

    const titlePrefix = conversation.title === 'Nouvelle conversation' ? '' : null;
    const updates: any = {
      messages: updatedMessages,
      total_messages: messageCount,
      last_message_at: new Date().toISOString(),
    };

    if (titlePrefix === '' && messageCount === 1 && message.role === 'user') {
      const firstUserMessage = message.content.substring(0, 50);
      updates.title = firstUserMessage.length === 50 ? `${firstUserMessage}...` : firstUserMessage;
    }

    const { data, error } = await supabase
      .from('chatbot_conversations')
      .update(updates)
      .eq('id', conversationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateConversationTitle(id: string, title: string): Promise<ChatbotConversation> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('chatbot_conversations')
      .update({
        title,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async archiveConversation(id: string): Promise<ChatbotConversation> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('chatbot_conversations')
      .update({
        is_archived: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteConversation(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('chatbot_conversations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getArchivedConversations(): Promise<ChatbotConversation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', true)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) throw error;
    return data || [];
  },
};
