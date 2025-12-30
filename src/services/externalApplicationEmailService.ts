import { supabase } from '../lib/supabase';
import { publicProfileTokenService } from './publicProfileTokenService';

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
   * Génère le contenu de l'email de candidature
   */
  generateApplicationEmail(params: EmailParams): { subject: string; body: string } {
    const profileURL = publicProfileTokenService.getPublicProfileURL(params.publicProfileToken);

    const subject = `Candidature – ${params.jobTitle} | ${params.candidateName}`;

    const greeting = params.recruiterName ? `Bonjour ${params.recruiterName},` : 'Bonjour,';

    const attachmentsList = this.generateAttachmentsList(
      params.hasCV,
      params.hasCoverLetter,
      params.hasOtherDocuments
    );

    const body = `
${greeting}

Je vous adresse ma candidature pour le poste de ${params.jobTitle} au sein de ${params.companyName}.

Cette candidature vous est transmise via la plateforme JobGuinée.

${params.customMessage ? `\n${params.customMessage}\n` : ''}
Vous trouverez en pièces jointes :
${attachmentsList}

👉 Vous pouvez consulter mon profil professionnel complet, sans création de compte, via le lien sécurisé ci-dessous :
${profileURL}

Cordialement,

${params.candidateName}
${params.candidateEmail}${params.candidatePhone ? `\n${params.candidatePhone}` : ''}

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

  /**
   * Simule l'envoi d'un email (dans un environnement réel, utiliser un service SMTP ou API d'email)
   */
  async sendEmail(params: {
    to: string;
    subject: string;
    body: string;
    attachments?: { name: string; url: string }[];
  }): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📧 Email simulation');
      console.log('To:', params.to);
      console.log('Subject:', params.subject);
      console.log('Body:', params.body);
      console.log('Attachments:', params.attachments?.length || 0);

      const emailPayload = {
        to: params.to,
        subject: params.subject,
        body: params.body,
        attachments: params.attachments || [],
        sent_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('email_log')
        .insert(emailPayload);

      if (error) {
        console.error('Email log error:', error);
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('Error sending email:', error);
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

      const emailContent = this.generateApplicationEmail({
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
