import { supabase } from '../lib/supabase';

// Escape HTML special characters to prevent XSS
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Default welcome candidate template HTML (auto-seeded if missing)
const WELCOME_CANDIDATE_HTML = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting"><title>Bienvenue sur JobGuin&eacute;e</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-text-size-adjust:100%">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f3f4f6">
<tr><td align="center" style="padding:32px 12px">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07)">
  <tr><td style="background:linear-gradient(135deg,#0E2F56 0%,#1a4a80 60%,#0d3d6e 100%);padding:32px 40px;text-align:center">
    <table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>
      <td><img src="https://jobguinee-pro.com/logo_jobguinee.png" alt="JobGuin&eacute;e" width="48" height="48" style="display:block;border-radius:12px;border:0" /></td>
      <td style="padding-left:12px"><span style="color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px">Job</span><span style="color:#F59E0B;font-size:24px;font-weight:800;letter-spacing:-0.5px">Guin&eacute;e</span></td>
    </tr></table>
    <p style="color:rgba(255,255,255,0.55);font-size:11px;margin:10px 0 0;letter-spacing:0.8px;text-transform:uppercase">Plateforme Emploi &amp; RH N&deg;1 en Guin&eacute;e</p>
  </td></tr>
  <tr><td style="padding:40px 40px 0 40px;text-align:center">
    <div style="font-size:48px;line-height:1;margin-bottom:16px">&#127881;</div>
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0E2F56;line-height:1.2">Bienvenue, {{prenom}} !</h1>
    <p style="margin:0 0 4px;font-size:15px;color:#64748b;line-height:1.6">Votre compte a &eacute;t&eacute; cr&eacute;&eacute; avec succ&egrave;s.</p>
    <p style="margin:0;font-size:13px;color:#94a3b8">Connect&eacute; en tant que <strong style="color:#374151">{{email}}</strong></p>
  </td></tr>
  <tr><td style="padding:24px 40px 0 40px"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0" /></td></tr>
  <tr><td style="padding:24px 40px 0 40px">
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7">Vous venez de rejoindre <strong>la communaut&eacute; de milliers de professionnels</strong> qui font confiance &agrave; JobGuin&eacute;e pour acc&eacute;l&eacute;rer leur carri&egrave;re.</p>
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7">Pour que les recruteurs vous trouvent et que notre <strong>Intelligence Artificielle</strong> vous propose les offres les plus pertinentes, une seule chose &agrave; faire&nbsp;:</p>
  </td></tr>
  <tr><td style="padding:0 40px" align="center">
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto"><tr><td style="background:linear-gradient(135deg,#F59E0B,#D97706);border-radius:12px;box-shadow:0 6px 20px rgba(245,158,11,0.4)">
      <a href="https://jobguinee-pro.com/candidate/profile" style="display:block;padding:16px 48px;color:#ffffff;font-size:16px;font-weight:800;text-decoration:none;text-align:center;letter-spacing:0.3px">Compl&eacute;ter mon profil maintenant &rarr;</a>
    </td></tr></table>
    <p style="margin:8px 0 0;font-size:11px;color:#94a3b8">&#9201; Cela prend moins de 5 minutes</p>
  </td></tr>
  <tr><td style="padding:28px 40px 0 40px">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border-radius:12px;overflow:hidden"><tr><td style="padding:20px 24px">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:0.5px">&#128161; Pourquoi compl&eacute;ter votre profil ?</p>
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr><td style="padding:6px 0;font-size:14px;color:#1e3a5f;line-height:1.5" valign="top" width="24">&#10004;</td><td style="padding:6px 0;font-size:14px;color:#1e3a5f;line-height:1.5"><strong>5x plus de visibilit&eacute;</strong> aupr&egrave;s des recruteurs</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#1e3a5f;line-height:1.5" valign="top" width="24">&#10004;</td><td style="padding:6px 0;font-size:14px;color:#1e3a5f;line-height:1.5">Recevez des <strong>offres personnalis&eacute;es</strong> par notre IA</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#1e3a5f;line-height:1.5" valign="top" width="24">&#10004;</td><td style="padding:6px 0;font-size:14px;color:#1e3a5f;line-height:1.5">Postulez en <strong>1 clic</strong> sans retaper vos infos</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#1e3a5f;line-height:1.5" valign="top" width="24">&#10004;</td><td style="padding:6px 0;font-size:14px;color:#1e3a5f;line-height:1.5">Apparaissez dans la <strong>CVth&egrave;que</strong> consult&eacute;e par +200 entreprises</td></tr>
      </table>
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:28px 40px 0 40px">
    <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#0E2F56;text-transform:uppercase;letter-spacing:0.5px">&#128640; Ce que JobGuin&eacute;e fait pour vous</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td width="33%" style="padding:0 6px 0 0;vertical-align:top"><table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden"><tr><td style="padding:20px 14px;text-align:center"><div style="font-size:32px;line-height:1;margin-bottom:10px">&#129302;</div><p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0E2F56">CV par IA</p><p style="margin:0;font-size:11px;color:#64748b;line-height:1.4">G&eacute;n&eacute;rez un CV pro en 2&nbsp;min</p></td></tr></table></td>
      <td width="33%" style="padding:0 3px;vertical-align:top"><table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden"><tr><td style="padding:20px 14px;text-align:center"><div style="font-size:32px;line-height:1;margin-bottom:10px">&#127919;</div><p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0E2F56">Matching IA</p><p style="margin:0;font-size:11px;color:#64748b;line-height:1.4">Offres calibr&eacute;es sur vos comp&eacute;tences</p></td></tr></table></td>
      <td width="33%" style="padding:0 0 0 6px;vertical-align:top"><table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden"><tr><td style="padding:20px 14px;text-align:center"><div style="font-size:32px;line-height:1;margin-bottom:10px">&#128202;</div><p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0E2F56">Suivi en direct</p><p style="margin:0;font-size:11px;color:#64748b;line-height:1.4">Tableau de bord candidatures</p></td></tr></table></td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:28px 40px 0 40px">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:linear-gradient(135deg,#FEF3C7,#FDE68A);border:2px solid #F59E0B;border-radius:12px;overflow:hidden"><tr><td style="padding:20px 24px;text-align:center">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:1px">&#127873; Cadeau de bienvenue</p>
      <p style="margin:0 0 2px;font-size:28px;font-weight:900;color:#0E2F56;line-height:1.2">100 Cr&eacute;dits IA offerts</p>
      <p style="margin:0;font-size:12px;color:#78350f;line-height:1.5">G&eacute;n&eacute;rez votre CV, simulez un entretien ou optimisez votre profil &mdash; c'est offert.</p>
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:28px 40px 0 40px"><table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="50%" style="padding-right:6px"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:10px;text-align:center"><a href="https://jobguinee-pro.com/jobs" style="display:block;padding:14px 12px;color:#1d4ed8;font-size:13px;font-weight:700;text-decoration:none">&#128188; Voir les offres</a></td></tr></table></td>
    <td width="50%" style="padding-left:6px"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;text-align:center"><a href="https://jobguinee-pro.com/candidate/dashboard" style="display:block;padding:14px 12px;color:#15803d;font-size:13px;font-weight:700;text-decoration:none">&#128200; Mon tableau de bord</a></td></tr></table></td>
  </tr></table></td></tr>
  <tr><td style="padding:28px 40px 0 40px">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden"><tr><td style="padding:20px 24px">
      <p style="margin:0 0 8px;font-size:22px;line-height:1">&#11088;&#11088;&#11088;&#11088;&#11088;</p>
      <p style="margin:0 0 8px;font-size:14px;color:#374151;line-height:1.6;font-style:italic">&laquo;&nbsp;J'ai trouv&eacute; mon emploi en 3 semaines gr&acirc;ce &agrave; JobGuin&eacute;e. Le matching IA m'a propos&eacute; exactement ce que je cherchais.&nbsp;&raquo;</p>
      <p style="margin:0;font-size:12px;color:#64748b;font-weight:600">&mdash; Mamadou S., D&eacute;veloppeur &agrave; Conakry</p>
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:28px 40px 0 40px">
    <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#0E2F56;text-transform:uppercase;letter-spacing:0.5px">&#9989; Vos prochaines &eacute;tapes</p>
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9" valign="top" width="28"><div style="width:22px;height:22px;border-radius:50%;background:#F59E0B;color:#fff;font-size:12px;font-weight:700;text-align:center;line-height:22px">1</div></td><td style="padding:8px 0 8px 10px;border-bottom:1px solid #f1f5f9"><span style="font-size:14px;color:#111827;font-weight:600">Compl&eacute;tez votre profil</span> <span style="font-size:12px;color:#6b7280">&mdash; Exp&eacute;riences, comp&eacute;tences et CV</span></td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9" valign="top" width="28"><div style="width:22px;height:22px;border-radius:50%;background:#2563eb;color:#fff;font-size:12px;font-weight:700;text-align:center;line-height:22px">2</div></td><td style="padding:8px 0 8px 10px;border-bottom:1px solid #f1f5f9"><span style="font-size:14px;color:#111827;font-weight:600">Parcourez les offres</span> <span style="font-size:12px;color:#6b7280">&mdash; Filtrez par secteur, ville ou contrat</span></td></tr>
      <tr><td style="padding:8px 0" valign="top" width="28"><div style="width:22px;height:22px;border-radius:50%;background:#16a34a;color:#fff;font-size:12px;font-weight:700;text-align:center;line-height:22px">3</div></td><td style="padding:8px 0 8px 10px"><span style="font-size:14px;color:#111827;font-weight:600">Postulez en 1 clic</span> <span style="font-size:12px;color:#6b7280">&mdash; Votre profil fait office de candidature</span></td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:32px 40px 0 40px" align="center">
    <p style="margin:0 0 14px;font-size:15px;color:#374151;font-weight:600;line-height:1.5">Ne laissez pas les recruteurs passer &agrave; c&ocirc;t&eacute; de votre talent&nbsp;!</p>
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto"><tr><td style="background:linear-gradient(135deg,#0E2F56,#1a4a80);border-radius:12px;box-shadow:0 6px 20px rgba(14,47,86,0.35)">
      <a href="https://jobguinee-pro.com/candidate/profile" style="display:block;padding:16px 44px;color:#ffffff;font-size:15px;font-weight:800;text-decoration:none;text-align:center">&#128640; Cr&eacute;er mon profil complet</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:16px 0"></td></tr>
  <tr><td style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center">
    <table cellpadding="0" cellspacing="0" style="margin:0 auto 10px auto"><tr>
      <td><img src="https://jobguinee-pro.com/logo_jobguinee.png" alt="JG" width="20" height="20" style="display:block;border-radius:4px;border:0" /></td>
      <td style="padding-left:8px"><span style="color:#0E2F56;font-size:13px;font-weight:800">Job</span><span style="color:#F59E0B;font-size:13px;font-weight:800">Guin&eacute;e</span></td>
    </tr></table>
    <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;line-height:1.5">Plateforme emploi &amp; RH en Guin&eacute;e &middot; Conakry</p>
    <p style="margin:0;font-size:11px;color:#cbd5e1"><a href="mailto:contact@jobguinee-pro.com" style="color:#94a3b8;text-decoration:none">contact@jobguinee-pro.com</a> &middot; <a href="https://jobguinee-pro.com" style="color:#94a3b8;text-decoration:none">jobguinee-pro.com</a></p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

export interface CommunicationFilters {
  user_types?: string[];
  account_status?: string[];
  min_completion?: number;
  max_completion?: number;
  country?: string;
  region?: string;
  city?: string;
  date_from?: string;
  date_to?: string;
  language?: string;
}

export interface ChannelContent {
  enabled: boolean;
  subject?: string;
  content: string;
  template_id?: string;
}

export interface ChannelsConfig {
  email?: ChannelContent;
  sms?: ChannelContent;
  whatsapp?: ChannelContent;
  notification?: ChannelContent;
}

export interface AdminCommunication {
  id: string;
  title: string;
  type: 'system_info' | 'important_notice' | 'promotion' | 'maintenance_alert' | 'institutional';
  description?: string;
  filters_json: CommunicationFilters;
  estimated_audience_count: number;
  channels_json: ChannelsConfig;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'canceled' | 'failed';
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  total_recipients: number;
  total_sent: number;
  total_failed: number;
  total_excluded: number;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  description?: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'notification';
  subject?: string;
  content: string;
  variables: string[];
  is_active: boolean;
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface CommunicationMessage {
  id: string;
  communication_id: string;
  user_id: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'notification';
  content_rendered: string;
  subject?: string;
  status: 'pending' | 'sent' | 'failed' | 'excluded';
  exclusion_reason?: string;
  retry_count: number;
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

export interface CommunicationLog {
  id: string;
  communication_id?: string;
  action: 'create' | 'update' | 'send' | 'cancel' | 'schedule' | 'complete' | 'fail';
  details: any;
  admin_id?: string;
  admin_email?: string;
  created_at: string;
}

export const adminCommunicationService = {
  async getCommunications(filters?: { status?: string; limit?: number }) {
    let query = supabase
      .from('admin_communications')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as AdminCommunication[];
  },

  async getCommunicationById(id: string) {
    const { data, error } = await supabase
      .from('admin_communications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as AdminCommunication;
  },

  async createCommunication(communication: Partial<AdminCommunication>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('admin_communications')
      .insert({
        ...communication,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as AdminCommunication;
  },

  async updateCommunication(id: string, updates: Partial<AdminCommunication>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('admin_communications')
      .update({
        ...updates,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AdminCommunication;
  },

  async deleteCommunication(id: string) {
    const { error } = await supabase
      .from('admin_communications')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async calculateAudienceCount(filters: CommunicationFilters): Promise<number> {
    const { data, error } = await supabase
      .rpc('calculate_communication_audience', {
        p_filters: filters
      });

    if (error) throw error;
    return data || 0;
  },

  async getTargetedUsers(filters: CommunicationFilters, limit?: number) {
    let query = supabase
      .from('profiles')
      .select('id, full_name, email, user_type, profile_completion_percentage, phone');

    if (filters.user_types && filters.user_types.length > 0) {
      query = query.in('user_type', filters.user_types);
    }

    if (filters.min_completion != null && filters.min_completion > 0) {
      query = query.gte('profile_completion_percentage', filters.min_completion);
    }

    if (filters.max_completion != null && filters.max_completion < 100) {
      query = query.lte('profile_completion_percentage', filters.max_completion);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async sendCommunication(id: string, filters: CommunicationFilters, channels: ChannelsConfig) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // 1. Set status to 'sending'
    const { data: comm, error } = await supabase
      .from('admin_communications')
      .update({
        status: 'sending',
        started_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // 2. Get targeted users
    const users = await this.getTargetedUsers(filters);
    if (!users || users.length === 0) {
      await supabase.from('admin_communications').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_recipients: 0,
        total_sent: 0,
      }).eq('id', id);
      return { ...comm, total_recipients: 0, total_sent: 0 } as AdminCommunication;
    }

    let totalSent = 0;
    let totalFailed = 0;
    let totalExcluded = 0;
    let lastRenderedSubject = '';

    // 3. Process email channel - batched in groups of 20 for throughput + error isolation
    const emailConfig = channels.email;
    if (emailConfig?.enabled) {
      const BATCH_SIZE = 20;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      // Fetch session once before the loop to avoid expiry during batch
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        throw new Error('Session expired, cannot send emails');
      }
      const token = session.access_token;

      for (let i = 0; i < users.length; i += BATCH_SIZE) {
        const batch = users.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.allSettled(
          batch.map(async (recipient) => {
            if (!recipient.email) {
              totalExcluded++;
              return;
            }
            const renderedContent = this._renderContent(emailConfig.content, recipient);
            const renderedSubject = this._renderContent(emailConfig.subject || comm.title, recipient);
            lastRenderedSubject = renderedSubject;
            // Detect full HTML templates (rich emails with logo, CTA, etc.) — send as-is
            const isFullHtml = renderedContent.trimStart().startsWith('<!DOCTYPE') || renderedContent.trimStart().startsWith('<html');
            const emailHtml = isFullHtml
              ? renderedContent
              : `<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
  <tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#334155;">${renderedContent.replace(/\n/g, '<br>')}</td></tr>
</table>`;

            const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                to: recipient.email,
                toName: recipient.full_name || undefined,
                subject: renderedSubject,
                htmlBody: emailHtml,
              }),
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
              throw new Error(result.error || `HTTP ${response.status}`);
            }

            // Record message
            await supabase.from('admin_communication_messages').insert({
              communication_id: id,
              user_id: recipient.id,
              channel: 'email',
              content_rendered: renderedContent,
              subject: renderedSubject,
              status: 'sent',
            }).select().maybeSingle();

            return recipient;
          })
        );

        // Tally results from this batch
        for (let j = 0; j < batchResults.length; j++) {
          const r = batchResults[j];
          const recipient = batch[j];
          if (r.status === 'fulfilled' && r.value !== undefined) {
            totalSent++;
          } else if (r.status === 'rejected') {
            const errMsg = r.reason?.message || 'Unknown error';
            console.error(`[sendCommunication] Email failed for ${recipient.email}:`, errMsg);
            totalFailed++;
            await supabase.from('admin_communication_messages').insert({
              communication_id: id,
              user_id: recipient.id,
              channel: 'email',
              content_rendered: emailConfig.content,
              subject: lastRenderedSubject || comm.title,
              status: 'failed',
              error_message: errMsg,
            }).select().maybeSingle();
          }
        }
      }
    }

    // 4. Process notification channel (batch insert instead of one-by-one)
    const notifConfig = channels.notification;
    if (notifConfig?.enabled) {
      const NOTIF_BATCH = 50;
      const notifRows = users.map((recipient) => {
        const renderedNotif = this._renderContent(notifConfig.content || '', recipient)
          .replace(/<[^>]*>/g, '')
          .replace(/\n{2,}/g, '\n')
          .trim()
          .slice(0, 500);
        const renderedTitle = this._renderContent(comm.title, recipient)
          .replace(/<[^>]*>/g, '');
        return {
          user_id: recipient.id,
          type: 'info',
          title: renderedTitle,
          message: renderedNotif,
        };
      });
      for (let i = 0; i < notifRows.length; i += NOTIF_BATCH) {
        const batch = notifRows.slice(i, i + NOTIF_BATCH);
        const { error } = await supabase.from('notifications').insert(batch);
        if (error) {
          console.warn(`[sendCommunication] Notification batch insert failed:`, error.message);
        }
      }
    }

    // 5. Update communication status
    const finalStatus = totalFailed > 0 && totalSent === 0 ? 'failed' : 'completed';
    await supabase.from('admin_communications').update({
      status: finalStatus,
      completed_at: new Date().toISOString(),
      total_recipients: users.length,
      total_sent: totalSent,
      total_failed: totalFailed,
      total_excluded: totalExcluded,
    }).eq('id', id);

    return {
      ...comm,
      status: finalStatus,
      total_recipients: users.length,
      total_sent: totalSent,
      total_failed: totalFailed,
      total_excluded: totalExcluded,
    } as AdminCommunication;
  },

  /** Replace template variables in content (with HTML escaping for safety) */
  _renderContent(content: string, user: { full_name?: string; email?: string; phone?: string; user_type?: string }) {
    const parts = (user.full_name || '').trim().split(/\s+/);
    const prenom = escapeHtml(parts[0] || '');
    const nom = escapeHtml(parts.length > 1 ? parts.slice(1).join(' ') : '');
    const safeName = escapeHtml(user.full_name || '');
    const safeEmail = escapeHtml(user.email || '');
    const safePhone = escapeHtml(user.phone || '');

    const roleLabels: Record<string, string> = {
      candidate: 'candidat',
      recruiter: 'recruteur',
      admin: 'admin',
      trainer: 'formateur',
    };

    return content
      .replace(/\{\{\s*prenom\s*\}\}/g, prenom)
      .replace(/\{\{\s*nom\s*\}\}/g, nom || prenom)
      .replace(/\{\{\s*nom_complet\s*\}\}/g, safeName)
      .replace(/\{\{\s*email\s*\}\}/g, safeEmail)
      .replace(/\{\{\s*telephone\s*\}\}/g, safePhone)
      .replace(/\{\{\s*role\s*\}\}/g, roleLabels[user.user_type || ''] || escapeHtml(user.user_type || ''))
      .replace(/\{\{\s*lien_profil\s*\}\}/g, '<a href="https://jobguinee-pro.com/profile" target="_blank" style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Mon profil</a>')
      .replace(/\{\{\s*lien_site\s*\}\}/g, '<a href="https://jobguinee-pro.com" target="_blank" style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Visiter JobGuinée</a>')
      .replace(/\{\{\s*lien\s*\}\}/g, '<a href="https://jobguinee-pro.com" target="_blank" style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Accéder à JobGuinée</a>');
  },

  async scheduleCommunication(id: string, scheduledAt: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('admin_communications')
      .update({
        status: 'scheduled',
        scheduled_at: scheduledAt,
        updated_by: user.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AdminCommunication;
  },

  async cancelCommunication(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('admin_communications')
      .update({
        status: 'canceled',
        updated_by: user.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AdminCommunication;
  },

  async getMessages(communicationId: string, filters?: { status?: string; channel?: string }) {
    let query = supabase
      .from('admin_communication_messages')
      .select('*')
      .eq('communication_id', communicationId);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.channel) {
      query = query.eq('channel', filters.channel);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as CommunicationMessage[];
  },

  async getMessageStats(communicationId: string) {
    const { data, error } = await supabase
      .from('admin_communication_messages')
      .select('channel, status')
      .eq('communication_id', communicationId);

    if (error) throw error;

    const stats = {
      total: data.length,
      by_channel: {} as Record<string, number>,
      by_status: {} as Record<string, number>,
    };

    data.forEach((msg) => {
      stats.by_channel[msg.channel] = (stats.by_channel[msg.channel] || 0) + 1;
      stats.by_status[msg.status] = (stats.by_status[msg.status] || 0) + 1;
    });

    return stats;
  },

  _seeded: false,

  async _seedDefaultTemplates() {
    if (this._seeded) return;
    this._seeded = true;
    try {
      const { data: existing } = await supabase
        .from('admin_communication_templates')
        .select('id')
        .eq('name', 'Bienvenue Candidat — Profil à compléter')
        .maybeSingle();
      if (existing) return;
      await supabase.from('admin_communication_templates').insert({
        name: 'Bienvenue Candidat — Profil à compléter',
        description: 'Email de bienvenue moderne pour candidat avec CTA vers création de profil, services IA et offres d\'emploi.',
        channel: 'email',
        subject: '🎉 Bienvenue {{prenom}} — Votre aventure professionnelle commence ici !',
        content: WELCOME_CANDIDATE_HTML,
        variables: ['prenom', 'nom_complet', 'email'],
        is_active: true,
        category: 'onboarding',
      });
      console.log('[adminComm] Welcome candidate template seeded');
    } catch (err) {
      console.warn('[adminComm] Could not seed templates:', err);
    }
  },

  async getTemplates(channel?: string) {
    await this._seedDefaultTemplates();
    let query = supabase
      .from('admin_communication_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (channel) {
      query = query.eq('channel', channel);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as CommunicationTemplate[];
  },

  async getAllTemplates() {
    const { data, error } = await supabase
      .from('admin_communication_templates')
      .select('*')
      .order('channel', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data as CommunicationTemplate[];
  },

  async getTemplateById(id: string) {
    const { data, error } = await supabase
      .from('admin_communication_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as CommunicationTemplate;
  },

  async createTemplate(template: Partial<CommunicationTemplate>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('admin_communication_templates')
      .insert({
        ...template,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as CommunicationTemplate;
  },

  async updateTemplate(id: string, updates: Partial<CommunicationTemplate>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('admin_communication_templates')
      .update({
        ...updates,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as CommunicationTemplate;
  },

  async deleteTemplate(id: string) {
    const { error } = await supabase
      .from('admin_communication_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getLogs(filters?: { communication_id?: string; admin_id?: string; limit?: number }) {
    let query = supabase
      .from('admin_communication_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.communication_id) {
      query = query.eq('communication_id', filters.communication_id);
    }

    if (filters?.admin_id) {
      query = query.eq('admin_id', filters.admin_id);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as CommunicationLog[];
  },

  async getStats() {
    const { data: communications, error } = await supabase
      .from('admin_communications')
      .select('status, type, created_at');

    if (error) throw error;

    const stats = {
      total: communications.length,
      by_status: {} as Record<string, number>,
      by_type: {} as Record<string, number>,
      last_30_days: 0,
    };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    communications.forEach((comm) => {
      stats.by_status[comm.status] = (stats.by_status[comm.status] || 0) + 1;
      stats.by_type[comm.type] = (stats.by_type[comm.type] || 0) + 1;

      if (new Date(comm.created_at) > thirtyDaysAgo) {
        stats.last_30_days++;
      }
    });

    return stats;
  },

  renderTemplate(content: string, variables: Record<string, string>): string {
    let rendered = content;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, value);
    });
    return rendered;
  },

  validateContent(content: string, channel: 'email' | 'sms' | 'whatsapp' | 'notification'): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!content || content.trim().length === 0) {
      errors.push('Le contenu ne peut pas être vide');
    }

    if (channel === 'sms') {
      if (content.length > 160) {
        errors.push('Le SMS ne peut pas dépasser 160 caractères');
      }
    }

    if (channel === 'email') {
      if (content.length < 10) {
        errors.push('L\'email doit contenir au moins 10 caractères');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};
