import { supabase } from '../lib/supabase';

export type NotificationChannel = 'notification' | 'email' | 'sms' | 'whatsapp';
export type NotificationType =
  | 'interview_scheduled'
  | 'interview_reminder_24h'
  | 'interview_reminder_2h'
  | 'interview_cancelled'
  | 'interview_rescheduled'
  | 'application_status_update'
  | 'message_received'
  | 'job_closed'
  | 'credits_validated'
  | 'credits_rejected';

export interface NotificationPayload {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  channels: NotificationChannel[];
  metadata?: Record<string, any>;
  applicationId?: string;
  interviewId?: string;
}

export interface NotificationTemplate {
  type: NotificationType;
  subject: string;
  body: string;
  channels: NotificationChannel[];
}

const DEFAULT_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  interview_scheduled: {
    type: 'interview_scheduled',
    subject: 'Entretien planifié pour {{job_title}}',
    body: `Bonjour {{candidate_name}},

Nous avons le plaisir de vous inviter à un entretien pour le poste de {{job_title}}.

📅 Date : {{interview_date}}
⏰ Heure : {{interview_time}}
{{#if_visio}}
🎥 Type : Visioconférence
🔗 Lien : {{interview_link}}
{{/if_visio}}
{{#if_presentiel}}
📍 Type : Présentiel
📍 Lieu : {{interview_location}}
{{/if_presentiel}}
{{#if_telephone}}
📞 Type : Entretien téléphonique
📞 Nous vous appellerons au : {{candidate_phone}}
{{/if_telephone}}

{{#if_notes}}
ℹ️ Informations complémentaires :
{{interview_notes}}
{{/if_notes}}

Nous vous prions de confirmer votre présence.

Cordialement,
{{company_name}}`,
    channels: ['notification', 'email']
  },

  interview_reminder_24h: {
    type: 'interview_reminder_24h',
    subject: 'Rappel : Entretien demain pour {{job_title}}',
    body: `Bonjour {{candidate_name}},

Nous vous rappelons que votre entretien pour le poste de {{job_title}} est prévu demain.

📅 Date : {{interview_date}}
⏰ Heure : {{interview_time}}
{{#if_visio}}
🎥 Lien de visioconférence : {{interview_link}}
{{/if_visio}}
{{#if_presentiel}}
📍 Lieu : {{interview_location}}
{{/if_presentiel}}

À bientôt !
{{company_name}}`,
    channels: ['notification', 'email', 'sms']
  },

  interview_reminder_2h: {
    type: 'interview_reminder_2h',
    subject: 'Rappel : Entretien dans 2 heures',
    body: `Bonjour {{candidate_name}},

Votre entretien pour {{job_title}} commence dans 2 heures ({{interview_time}}).

{{#if_visio}}
🎥 Lien de connexion : {{interview_link}}
{{/if_visio}}

À tout de suite !
{{company_name}}`,
    channels: ['notification', 'sms']
  },

  interview_cancelled: {
    type: 'interview_cancelled',
    subject: 'Annulation d\'entretien - {{job_title}}',
    body: `Bonjour {{candidate_name}},

Nous sommes au regret de vous informer que l'entretien prévu le {{interview_date}} à {{interview_time}} pour le poste de {{job_title}} a été annulé.

{{#if_reason}}
Raison : {{cancellation_reason}}
{{/if_reason}}

Nous vous contacterons prochainement pour reprogrammer.

Cordialement,
{{company_name}}`,
    channels: ['notification', 'email']
  },

  interview_rescheduled: {
    type: 'interview_rescheduled',
    subject: 'Entretien reprogrammé - {{job_title}}',
    body: `Bonjour {{candidate_name}},

Votre entretien pour le poste de {{job_title}} a été reprogrammé.

📅 Nouvelle date : {{interview_date}}
⏰ Nouvelle heure : {{interview_time}}

Merci de confirmer votre disponibilité.

Cordialement,
{{company_name}}`,
    channels: ['notification', 'email', 'sms']
  },

  application_status_update: {
    type: 'application_status_update',
    subject: 'Mise à jour de votre candidature - {{job_title}}',
    body: `Bonjour {{candidate_name}},

Votre candidature pour le poste de {{job_title}} a été mise à jour.

Statut : {{new_status}}

Vous pouvez consulter les détails sur votre espace candidat.

Cordialement,
{{company_name}}`,
    channels: ['notification', 'email']
  },

  message_received: {
    type: 'message_received',
    subject: 'Nouveau message de {{company_name}}',
    body: `Bonjour {{candidate_name}},

Vous avez reçu un nouveau message concernant votre candidature pour {{job_title}}.

Connectez-vous à votre espace pour le consulter.

Cordialement,
{{company_name}}`,
    channels: ['notification', 'email']
  },

  job_closed: {
    type: 'job_closed',
    subject: 'Clôture de l\'offre - {{job_title}}',
    body: `Bonjour {{candidate_name}},

Nous vous informons que l'offre pour le poste de {{job_title}} est désormais clôturée.

Nous vous remercions de l'intérêt porté à notre entreprise et vous souhaitons bonne chance dans vos recherches.

Cordialement,
{{company_name}}`,
    channels: ['notification', 'email']
  },

  credits_validated: {
    type: 'credits_validated',
    subject: 'Paiement validé - {{credits_amount}} crédits IA ajoutés',
    body: `Bonjour,

Excellente nouvelle! Votre paiement a été validé avec succès.

💳 Référence : {{payment_reference}}
💰 Montant : {{price_amount}}
✨ Crédits ajoutés : {{credits_amount}} crédits IA
📊 Nouveau solde : {{new_balance}} crédits

Vos crédits sont maintenant disponibles et vous pouvez les utiliser pour accéder aux services IA premium de JobGuinée.

{{#if_notes}}
📝 Note de l'administrateur :
{{admin_notes}}
{{/if_notes}}

Merci pour votre confiance!

L'équipe JobGuinée`,
    channels: ['notification', 'email']
  },

  credits_rejected: {
    type: 'credits_rejected',
    subject: 'Paiement non validé - {{payment_reference}}',
    body: `Bonjour,

Nous avons examiné votre demande d'achat de crédits mais nous ne pouvons malheureusement pas la valider.

💳 Référence : {{payment_reference}}
💰 Montant : {{price_amount}}
❌ Crédits : {{credits_amount}} crédits IA

{{#if_reason}}
📝 Raison :
{{rejection_reason}}
{{/if_reason}}

Si vous pensez qu'il s'agit d'une erreur, veuillez nous contacter via WhatsApp avec votre preuve de paiement.

L'équipe JobGuinée`,
    channels: ['notification', 'email']
  }
};

export const notificationService = {
  processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, value || '');
    });

    const conditionalBlockRegex = /{{#if_(\w+)}}([\s\S]*?){{\/if_\1}}/g;
    processed = processed.replace(conditionalBlockRegex, (match, condition, content) => {
      return variables[condition] ? content : '';
    });

    processed = processed.replace(/\n{3,}/g, '\n\n');

    return processed.trim();
  },

  async sendNotification(payload: NotificationPayload): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Non authentifié' };
      }

      const results = await Promise.allSettled(
        payload.channels.map(channel => this.sendViaChannel(channel, payload))
      );

      const failedChannels = results.filter(r => r.status === 'rejected');

      if (failedChannels.length === results.length) {
        return { success: false, error: 'Échec d\'envoi sur tous les canaux' };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error sending notification:', error);
      return { success: false, error: error.message };
    }
  },

  async sendViaChannel(
    channel: NotificationChannel,
    payload: NotificationPayload
  ): Promise<void> {
    switch (channel) {
      case 'notification':
        await this.sendInAppNotification(payload);
        break;
      case 'email':
        await this.sendEmailNotification(payload);
        break;
      case 'sms':
        await this.sendSMSNotification(payload);
        break;
      case 'whatsapp':
        await this.sendWhatsAppNotification(payload);
        break;
    }
  },

  async sendInAppNotification(payload: NotificationPayload): Promise<void> {
    const { error } = await supabase.from('notifications').insert({
      profile_id: payload.recipientId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      metadata: payload.metadata,
      is_read: false
    });

    if (error) throw error;

    if (payload.applicationId) {
      await supabase.from('communications_log').insert({
        application_id: payload.applicationId,
        sender_id: (await supabase.auth.getUser()).data.user?.id,
        recipient_id: payload.recipientId,
        communication_type: payload.type,
        channel: 'notification',
        subject: payload.title,
        message: payload.message,
        status: 'sent'
      });
    }
  },

  async sendEmailNotification(payload: NotificationPayload): Promise<void> {
    console.log('[EMAIL] Sending to:', payload.recipientId);
    console.log('[EMAIL] Subject:', payload.title);
    console.log('[EMAIL] Body:', payload.message);

    if (payload.applicationId) {
      await supabase.from('communications_log').insert({
        application_id: payload.applicationId,
        sender_id: (await supabase.auth.getUser()).data.user?.id,
        recipient_id: payload.recipientId,
        communication_type: payload.type,
        channel: 'email',
        subject: payload.title,
        message: payload.message,
        status: 'sent'
      });
    }
  },

  async sendSMSNotification(payload: NotificationPayload): Promise<void> {
    console.log('[SMS] Sending to:', payload.recipientId);
    console.log('[SMS] Message:', payload.message);

    if (payload.applicationId) {
      await supabase.from('communications_log').insert({
        application_id: payload.applicationId,
        sender_id: (await supabase.auth.getUser()).data.user?.id,
        recipient_id: payload.recipientId,
        communication_type: payload.type,
        channel: 'sms',
        subject: payload.title,
        message: payload.message,
        status: 'sent'
      });
    }
  },

  async sendWhatsAppNotification(payload: NotificationPayload): Promise<void> {
    console.log('[WhatsApp] Sending to:', payload.recipientId);
    console.log('[WhatsApp] Message:', payload.message);

    if (payload.applicationId) {
      await supabase.from('communications_log').insert({
        application_id: payload.applicationId,
        sender_id: (await supabase.auth.getUser()).data.user?.id,
        recipient_id: payload.recipientId,
        communication_type: payload.type,
        channel: 'whatsapp',
        subject: payload.title,
        message: payload.message,
        status: 'sent'
      });
    }
  },

  async sendInterviewNotification(
    interviewId: string,
    type: NotificationType,
    additionalData?: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: interview, error: fetchError } = await supabase
        .from('interviews')
        .select(`
          *,
          candidate:profiles!interviews_candidate_id_fkey(*),
          job:jobs(*),
          company:companies(*)
        `)
        .eq('id', interviewId)
        .single();

      if (fetchError || !interview) {
        throw new Error('Entretien non trouvé');
      }

      const template = DEFAULT_TEMPLATES[type];
      const interviewDate = new Date(interview.scheduled_at);

      const variables = {
        candidate_name: interview.candidate.full_name,
        job_title: interview.job.title,
        company_name: interview.company.name,
        interview_date: interviewDate.toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        interview_time: interviewDate.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        interview_link: interview.location_or_link || '',
        interview_location: interview.location_or_link || '',
        interview_notes: interview.notes || '',
        candidate_phone: interview.candidate.phone || '',
        if_visio: interview.interview_type === 'visio',
        if_presentiel: interview.interview_type === 'presentiel',
        if_telephone: interview.interview_type === 'telephone',
        if_notes: !!interview.notes,
        ...additionalData
      };

      const subject = this.processTemplate(template.subject, variables);
      const body = this.processTemplate(template.body, variables);

      return await this.sendNotification({
        recipientId: interview.candidate_id,
        type,
        title: subject,
        message: body,
        channels: template.channels,
        metadata: {
          interview_id: interviewId,
          job_id: interview.job_id,
          company_id: interview.company_id
        },
        applicationId: interview.application_id,
        interviewId
      });
    } catch (error: any) {
      console.error('Error sending interview notification:', error);
      return { success: false, error: error.message };
    }
  },

  async scheduleInterviewReminders(interviewId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: interview, error: fetchError } = await supabase
        .from('interviews')
        .select('scheduled_at')
        .eq('id', interviewId)
        .single();

      if (fetchError || !interview) {
        throw new Error('Entretien non trouvé');
      }

      const scheduledAt = new Date(interview.scheduled_at);
      const reminder24h = new Date(scheduledAt.getTime() - 24 * 60 * 60 * 1000);
      const reminder2h = new Date(scheduledAt.getTime() - 2 * 60 * 60 * 1000);

      const reminders = [
        {
          interview_id: interviewId,
          reminder_type: 'j_moins_1',
          scheduled_for: reminder24h.toISOString(),
          status: 'pending'
        },
        {
          interview_id: interviewId,
          reminder_type: 'deux_heures_avant',
          scheduled_for: reminder2h.toISOString(),
          status: 'pending'
        }
      ];

      const { error: insertError } = await supabase
        .from('interview_reminders')
        .insert(reminders);

      if (insertError) throw insertError;

      return { success: true };
    } catch (error: any) {
      console.error('Error scheduling reminders:', error);
      return { success: false, error: error.message };
    }
  },

  async processPendingReminders(): Promise<void> {
    const now = new Date();

    const { data: reminders, error } = await supabase
      .from('interview_reminders')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString());

    if (error || !reminders || reminders.length === 0) return;

    for (const reminder of reminders) {
      const notificationType = reminder.reminder_type === 'j_moins_1'
        ? 'interview_reminder_24h'
        : 'interview_reminder_2h';

      const result = await this.sendInterviewNotification(
        reminder.interview_id,
        notificationType
      );

      await supabase
        .from('interview_reminders')
        .update({
          status: result.success ? 'sent' : 'failed',
          sent_at: result.success ? now.toISOString() : null,
          error_message: result.error || null
        })
        .eq('id', reminder.id);
    }
  },

  getTemplate(type: NotificationType): NotificationTemplate {
    return DEFAULT_TEMPLATES[type];
  },

  getChannelLabel(channel: NotificationChannel): string {
    const labels: Record<NotificationChannel, string> = {
      notification: 'Notification interne',
      email: 'Email',
      sms: 'SMS',
      whatsapp: 'WhatsApp'
    };
    return labels[channel];
  },

  async sendCreditNotification(
    userId: string,
    type: 'credits_validated' | 'credits_rejected',
    purchaseData: {
      payment_reference: string;
      price_amount: number;
      currency: string;
      credits_amount: number;
      new_balance?: number;
      admin_notes?: string;
      rejection_reason?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const template = DEFAULT_TEMPLATES[type];

      const variables = {
        payment_reference: purchaseData.payment_reference,
        price_amount: this.formatPrice(purchaseData.price_amount, purchaseData.currency),
        credits_amount: purchaseData.credits_amount.toLocaleString('fr-FR'),
        new_balance: purchaseData.new_balance ? purchaseData.new_balance.toLocaleString('fr-FR') : '',
        admin_notes: purchaseData.admin_notes || '',
        rejection_reason: purchaseData.rejection_reason || '',
        if_notes: !!purchaseData.admin_notes,
        if_reason: !!purchaseData.rejection_reason
      };

      const subject = this.processTemplate(template.subject, variables);
      const body = this.processTemplate(template.body, variables);

      return await this.sendNotification({
        recipientId: userId,
        type,
        title: subject,
        message: body,
        channels: template.channels,
        metadata: {
          payment_reference: purchaseData.payment_reference,
          credits_amount: purchaseData.credits_amount,
          new_balance: purchaseData.new_balance
        }
      });
    } catch (error: any) {
      console.error('Error sending credit notification:', error);
      return { success: false, error: error.message };
    }
  },

  formatPrice(amount: number, currency: string = 'GNF'): string {
    if (currency === 'GNF') {
      return new Intl.NumberFormat('fr-GN', {
        style: 'currency',
        currency: 'GNF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    }

    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }
};
