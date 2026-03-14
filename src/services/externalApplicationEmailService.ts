import { supabase } from '../lib/supabase';
import { publicProfileTokenService } from './publicProfileTokenService';

// Escape HTML special characters to prevent XSS in email content
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Strip template injection patterns from user-controlled content
function sanitizeTemplateContent(str: string): string {
  return str.replace(/\{\{[^}]*\}\}/g, '');
}

interface EmailParams {
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  jobTitle: string;
  companyName: string;
  recruiterEmail: string;
  recruiterName?: string;
  customMessage?: string;
  hasCV: boolean;
  hasCoverLetter: boolean;
  hasOtherDocuments: boolean;
  publicProfileToken: string;
}

class ExternalApplicationEmailService {
  /**
   * Récupère le template actif depuis la base de données
   */
  private async getActiveTemplate() {
    try {
      const { data, error } = await supabase
        .from('external_application_email_templates')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const { data: defaultTemplate } = await supabase
          .from('external_application_email_templates')
          .select('*')
          .eq('template_type', 'standard')
          .maybeSingle();

        return defaultTemplate;
      }

      return data;
    } catch (error) {
      console.error('Error fetching template:', error);
      return null;
    }
  }

  /**
   * Remplace les variables dans un template
   */
  private replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    });

    result = result.replace(/{{#if\s+(\w+)}}(.*?){{\/if}}/gs, (match, varName, content) => {
      return variables[varName] ? content : '';
    });

    return result;
  }

  /**
   * Génère le contenu de l'email de candidature
   */
  async generateApplicationEmail(params: EmailParams): Promise<{ subject: string; body: string }> {
    const template = await this.getActiveTemplate();

    if (!template) {
      return this.generateFallbackEmail(params);
    }

    const profileURL = publicProfileTokenService.getPublicProfileURL(params.publicProfileToken);

    const variables = {
      candidate_name: escapeHtml(params.candidateName),
      candidate_email: escapeHtml(params.candidateEmail),
      candidate_phone: escapeHtml(params.candidatePhone || ''),
      job_title: escapeHtml(params.jobTitle),
      company_name: escapeHtml(params.companyName),
      recruiter_name: escapeHtml(params.recruiterName || ''),
      profile_url: profileURL,
      platform_url: window.location.origin,
      custom_message: sanitizeTemplateContent(escapeHtml(params.customMessage || '')),
      has_cv: params.hasCV,
      has_cover_letter: params.hasCoverLetter,
      has_other_documents: params.hasOtherDocuments
    };

    const subject = this.replaceVariables(template.subject_template, variables);
    const body = this.replaceVariables(template.body_template, variables);

    return { subject, body };
  }

  /**
   * Email de secours si pas de template
   */
  private generateFallbackEmail(params: EmailParams): { subject: string; body: string } {
    const profileURL = publicProfileTokenService.getPublicProfileURL(params.publicProfileToken);

    const safeJobTitle = escapeHtml(params.jobTitle);
    const safeCandidateName = escapeHtml(params.candidateName);
    const safeCompanyName = escapeHtml(params.companyName);
    const safeRecruiterName = params.recruiterName ? escapeHtml(params.recruiterName) : '';
    const safeCandidateEmail = escapeHtml(params.candidateEmail);
    const safeCandidatePhone = params.candidatePhone ? escapeHtml(params.candidatePhone) : '';
    const safeCustomMessage = params.customMessage ? sanitizeTemplateContent(escapeHtml(params.customMessage)) : '';

    const subject = `Candidature – ${safeJobTitle} | ${safeCandidateName}`;

    const greeting = safeRecruiterName ? `Bonjour ${safeRecruiterName},` : 'Bonjour,';

    const attachmentsList = this.generateAttachmentsList(
      params.hasCV,
      params.hasCoverLetter,
      params.hasOtherDocuments
    );

    const body = `
${greeting}

Je vous adresse ma candidature pour le poste de ${safeJobTitle} au sein de ${safeCompanyName}.

Cette candidature vous est transmise via la plateforme JobGuinée.

${safeCustomMessage ? `\n${safeCustomMessage}\n` : ''}
Vous trouverez en pièces jointes :
${attachmentsList}

👉 Vous pouvez consulter mon profil professionnel complet, sans création de compte, via le lien sécurisé ci-dessous :
${profileURL}

Cordialement,

${safeCandidateName}
${safeCandidateEmail}${safeCandidatePhone ? `\n${safeCandidatePhone}` : ''}

---
Envoyé via JobGuinée – Plateforme emploi & RH en Guinée
${window.location.origin}
    `.trim();

    return { subject, body };
  }

  /**
   * Génère la liste des pièces jointes
   */
  private generateAttachmentsList(hasCV: boolean, hasCoverLetter: boolean, hasOtherDocuments: boolean): string {
    const items: string[] = [];

    if (hasCV) {
      items.push('- Mon CV');
    }
    if (hasCoverLetter) {
      items.push('- Ma lettre de motivation');
    }
    if (hasOtherDocuments) {
      items.push('- D\'autres documents pertinents');
    }

    return items.join('\n');
  }

  /**
   * Génère l'email de relance
   */
  generateRelanceEmail(params: {
    candidateName: string;
    candidateEmail: string;
    jobTitle: string;
    companyName: string;
    recruiterEmail: string;
    recruiterName?: string;
    customMessage: string;
    originalSentDate: string;
    publicProfileToken: string;
  }): { subject: string; body: string } {
    const profileURL = publicProfileTokenService.getPublicProfileURL(params.publicProfileToken);

    const subject = `Relance – Candidature ${params.jobTitle} | ${params.candidateName}`;

    const greeting = params.recruiterName ? `Bonjour ${params.recruiterName},` : 'Bonjour,';

    const sentDate = new Date(params.originalSentDate).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const body = `
${greeting}

Je me permets de revenir vers vous concernant ma candidature pour le poste de ${params.jobTitle} au sein de ${params.companyName}, transmise le ${sentDate}.

${params.customMessage}

Je reste à votre disposition pour toute information complémentaire et pour un éventuel entretien.

👉 Mon profil professionnel complet est toujours accessible via ce lien :
${profileURL}

Cordialement,

${params.candidateName}
${params.candidateEmail}

---
Envoyé via JobGuinée – Plateforme emploi & RH en Guinée
${window.location.origin}
    `.trim();

    return { subject, body };
  }

  async sendEmail(params: {
    to: string;
    subject: string;
    body: string;
    attachments?: { name: string; url: string }[];
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return { success: false, error: 'Session expirée, veuillez vous reconnecter' };
      }

      const htmlBody = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937">
          <div style="white-space:pre-line;line-height:1.6">${params.body.replace(/\n/g, '<br/>')}</div>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="font-size:12px;color:#9ca3af">JobGuinée – Plateforme emploi &amp; RH en Guinée</p>
        </div>
      `;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            to: params.to,
            subject: params.subject,
            htmlBody,
            textBody: params.body,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        return { success: false, error: result.error || "Échec de l'envoi" };
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending external application email:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Envoie l'email de candidature externe
   */
  async sendApplicationEmail(applicationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: application, error: appError } = await supabase
        .from('external_applications')
        .select(`
          *,
          profiles!external_applications_candidate_id_fkey(full_name, email),
          candidate_profiles!inner(telephone)
        `)
        .eq('id', applicationId)
        .maybeSingle();

      if (appError || !application) {
        return { success: false, error: 'Candidature non trouvée' };
      }

      const profile = application.profiles as any;
      const candidateProfile = application.candidate_profiles as any;

      const emailContent = await this.generateApplicationEmail({
        applicationId,
        candidateName: profile.full_name,
        candidateEmail: profile.email,
        candidatePhone: candidateProfile?.telephone,
        jobTitle: application.job_title,
        companyName: application.company_name,
        recruiterEmail: application.recruiter_email,
        recruiterName: application.recruiter_name,
        customMessage: application.custom_message,
        hasCV: !!application.cv_document_id,
        hasCoverLetter: !!application.cover_letter_document_id,
        hasOtherDocuments: application.additional_document_ids?.length > 0,
        publicProfileToken: application.public_profile_token
      });

      const documents = await this.fetchDocuments(
        application.cv_document_id,
        application.cover_letter_document_id,
        application.additional_document_ids
      );

      const emailResult = await this.sendEmail({
        to: application.recruiter_email,
        subject: emailContent.subject,
        body: emailContent.body,
        attachments: documents
      });

      await supabase
        .from('external_applications')
        .update({
          email_sent_successfully: emailResult.success,
          email_error_message: emailResult.error,
          sent_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      return emailResult;
    } catch (error) {
      console.error('Error sending application email:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Récupère les documents à joindre
   */
  private async fetchDocuments(
    cvId?: string,
    coverLetterId?: string,
    additionalIds?: string[]
  ): Promise<{ name: string; url: string }[]> {
    try {
      const documentIds = [cvId, coverLetterId, ...(additionalIds || [])].filter(Boolean) as string[];

      if (documentIds.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from('candidate_documents')
        .select('document_name, file_url')
        .in('id', documentIds);

      if (error) {
        console.error('Error fetching documents:', error);
        return [];
      }

      return data.map(doc => ({
        name: doc.document_name,
        url: doc.file_url
      }));
    } catch (error) {
      console.error('Error in fetchDocuments:', error);
      return [];
    }
  }

  /**
   * Envoie un email de relance
   */
  async sendRelanceEmail(
    applicationId: string,
    relanceMessage: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: application, error: appError } = await supabase
        .from('external_applications')
        .select(`
          *,
          profiles!external_applications_candidate_id_fkey(full_name, email)
        `)
        .eq('id', applicationId)
        .maybeSingle();

      if (appError || !application) {
        return { success: false, error: 'Candidature non trouvée' };
      }

      const profile = application.profiles as any;

      const emailContent = this.generateRelanceEmail({
        candidateName: profile.full_name,
        candidateEmail: profile.email,
        jobTitle: application.job_title,
        companyName: application.company_name,
        recruiterEmail: application.recruiter_email,
        recruiterName: application.recruiter_name,
        customMessage: relanceMessage,
        originalSentDate: application.sent_at,
        publicProfileToken: application.public_profile_token
      });

      const emailResult = await this.sendEmail({
        to: application.recruiter_email,
        subject: emailContent.subject,
        body: emailContent.body
      });

      const { error: relanceError } = await supabase
        .from('external_application_relances')
        .insert({
          external_application_id: applicationId,
          message: relanceMessage,
          email_sent_successfully: emailResult.success,
          email_error_message: emailResult.error
        });

      if (relanceError) {
        console.error('Error logging relance:', relanceError);
      }

      return emailResult;
    } catch (error) {
      console.error('Error sending relance email:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}

export const externalApplicationEmailService = new ExternalApplicationEmailService();
export default ExternalApplicationEmailService;
