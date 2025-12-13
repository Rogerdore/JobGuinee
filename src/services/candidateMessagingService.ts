import { supabase } from '../lib/supabase';

export interface MessageData {
  applicationId?: string;
  recipientId: string;
  subject?: string;
  message: string;
  channel?: 'notification' | 'email' | 'sms' | 'whatsapp';
}

export const candidateMessagingService = {
  /**
   * Envoyer un message à un recruteur
   */
  async sendMessage(data: MessageData): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Non authentifié' };
      }

      const { error } = await supabase
        .from('communications_log')
        .insert({
          application_id: data.applicationId,
          sender_id: user.id,
          recipient_id: data.recipientId,
          communication_type: 'candidate_reply',
          channel: data.channel || 'notification',
          subject: data.subject,
          message: data.message,
          status: 'sent'
        });

      if (error) {
        console.error('Error sending message:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in sendMessage:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtenir le nombre de messages non lus
   */
  async getUnreadCount(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const [notificationsCount, communicationsCount] = await Promise.all([
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false),

        supabase
          .from('communications_log')
          .select('id', { count: 'exact', head: true })
          .eq('recipient_id', user.id)
          .is('delivered_at', null)
      ]);

      const notifCount = notificationsCount.count || 0;
      const commCount = communicationsCount.count || 0;

      return notifCount + commCount;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  },

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(): Promise<{ success: boolean }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false };

      await Promise.all([
        supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', user.id)
          .eq('read', false),

        supabase
          .from('communications_log')
          .update({ delivered_at: new Date().toISOString() })
          .eq('recipient_id', user.id)
          .is('delivered_at', null)
      ]);

      return { success: true };
    } catch (error) {
      console.error('Error marking all as read:', error);
      return { success: false };
    }
  },

  /**
   * Obtenir les conversations groupées par candidature
   */
  async getConversations() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const [notificationsData, communicationsData, applicationsData] = await Promise.all([
        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),

        supabase
          .from('communications_log')
          .select(`
            *,
            sender:sender_id(id, full_name),
            application:application_id(
              id,
              application_reference,
              jobs(title, companies(name, logo_url))
            )
          `)
          .eq('recipient_id', user.id)
          .order('sent_at', { ascending: false }),

        supabase
          .from('applications')
          .select(`
            id,
            application_reference,
            jobs(
              id,
              title,
              companies(id, name, logo_url)
            )
          `)
          .eq('candidate_id', user.id)
      ]);

      return {
        notifications: notificationsData.data || [],
        communications: communicationsData.data || [],
        applications: applicationsData.data || []
      };
    } catch (error) {
      console.error('Error getting conversations:', error);
      return { notifications: [], communications: [], applications: [] };
    }
  },

  /**
   * Supprimer une notification
   */
  async deleteNotification(notificationId: string): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
        return { success: false };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      return { success: false };
    }
  },

  /**
   * Archiver une conversation
   */
  async archiveConversation(applicationId: string): Promise<{ success: boolean }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false };

      // Marquer toutes les notifications liées comme lues
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .like('link', `%application=${applicationId}%`);

      // Marquer toutes les communications liées comme lues
      await supabase
        .from('communications_log')
        .update({ delivered_at: new Date().toISOString() })
        .eq('application_id', applicationId)
        .eq('recipient_id', user.id);

      return { success: true };
    } catch (error) {
      console.error('Error archiving conversation:', error);
      return { success: false };
    }
  }
};
