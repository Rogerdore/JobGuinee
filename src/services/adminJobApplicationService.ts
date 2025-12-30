import { supabase } from '../lib/supabase';

type ApplicationMode =
  | 'company_account'
  | 'internal_admin'
  | 'external_email'
  | 'invited_partner'
  | 'external_link';

interface ApplicationData {
  job_id: string;
  candidate_id: string;
  full_name: string;
  email: string;
  phone?: string;
  cv_url?: string;
  cover_letter?: string;
  answers?: Record<string, any>;
}

interface JobDetails {
  id: string;
  title: string;
  company_name: string;
  application_mode: ApplicationMode;
  partner_email?: string;
  external_apply_url?: string;
  admin_publisher_id?: string;
}

class AdminJobApplicationService {
  async handleApplication(applicationData: ApplicationData): Promise<{
    success: boolean;
    message: string;
    redirect_url?: string;
  }> {
    try {
      const { data: job } = await supabase
        .from('jobs')
        .select('id, title, company_name, application_mode, partner_email, external_apply_url, admin_publisher_id')
        .eq('id', applicationData.job_id)
        .single();

      if (!job) {
        return { success: false, message: 'Offre non trouvée' };
      }

      switch (job.application_mode) {
        case 'company_account':
          return await this.handleCompanyAccountMode(applicationData, job);

        case 'internal_admin':
          return await this.handleInternalAdminMode(applicationData, job);

        case 'external_email':
          return await this.handleExternalEmailMode(applicationData, job);

        case 'invited_partner':
          return await this.handleInvitedPartnerMode(applicationData, job);

        case 'external_link':
          return await this.handleExternalLinkMode(applicationData, job);

        default:
          return { success: false, message: 'Mode de candidature invalide' };
      }
    } catch (error) {
      console.error('Error handling application:', error);
      return { success: false, message: 'Erreur lors du traitement de la candidature' };
    }
  }

  private async handleCompanyAccountMode(
    applicationData: ApplicationData,
    job: JobDetails
  ): Promise<{ success: boolean; message: string }> {
    const { error } = await supabase.from('applications').insert({
      job_id: applicationData.job_id,
      candidate_id: applicationData.candidate_id,
      full_name: applicationData.full_name,
      email: applicationData.email,
      phone: applicationData.phone,
      cv_url: applicationData.cv_url,
      cover_letter: applicationData.cover_letter,
      answers: applicationData.answers,
      status: 'pending',
      applied_at: new Date().toISOString()
    });

    if (error) {
      return { success: false, message: 'Erreur lors de l\'enregistrement' };
    }

    await this.notifyRecruiter(job.id, applicationData);

    return {
      success: true,
      message: 'Candidature envoyée avec succès'
    };
  }

  private async handleInternalAdminMode(
    applicationData: ApplicationData,
    job: JobDetails
  ): Promise<{ success: boolean; message: string }> {
    const { error } = await supabase.from('applications').insert({
      job_id: applicationData.job_id,
      candidate_id: applicationData.candidate_id,
      full_name: applicationData.full_name,
      email: applicationData.email,
      phone: applicationData.phone,
      cv_url: applicationData.cv_url,
      cover_letter: applicationData.cover_letter,
      answers: applicationData.answers,
      status: 'pending',
      applied_at: new Date().toISOString(),
      visible_to_admin_only: true
    });

    if (error) {
      return { success: false, message: 'Erreur lors de l\'enregistrement' };
    }

    if (job.admin_publisher_id) {
      await this.notifyAdmin(job.admin_publisher_id, job, applicationData);
    }

    return {
      success: true,
      message: 'Candidature enregistrée. L\'administration vous contactera.'
    };
  }

  private async handleExternalEmailMode(
    applicationData: ApplicationData,
    job: JobDetails
  ): Promise<{ success: boolean; message: string }> {
    await supabase.from('applications').insert({
      job_id: applicationData.job_id,
      candidate_id: applicationData.candidate_id,
      full_name: applicationData.full_name,
      email: applicationData.email,
      phone: applicationData.phone,
      cv_url: applicationData.cv_url,
      cover_letter: applicationData.cover_letter,
      answers: applicationData.answers,
      status: 'forwarded',
      applied_at: new Date().toISOString()
    });

    if (job.partner_email) {
      await this.sendExternalEmail(job.partner_email, job, applicationData);
    }

    return {
      success: true,
      message: 'Candidature envoyée par email'
    };
  }

  private async handleInvitedPartnerMode(
    applicationData: ApplicationData,
    job: JobDetails
  ): Promise<{ success: boolean; message: string }> {
    const { error } = await supabase.from('applications').insert({
      job_id: applicationData.job_id,
      candidate_id: applicationData.candidate_id,
      full_name: applicationData.full_name,
      email: applicationData.email,
      phone: applicationData.phone,
      cv_url: applicationData.cv_url,
      cover_letter: applicationData.cover_letter,
      answers: applicationData.answers,
      status: 'pending',
      applied_at: new Date().toISOString()
    });

    if (error) {
      return { success: false, message: 'Erreur lors de l\'enregistrement' };
    }

    await this.notifyPartner(job, applicationData);

    return {
      success: true,
      message: 'Candidature envoyée au partenaire'
    };
  }

  private async handleExternalLinkMode(
    applicationData: ApplicationData,
    job: JobDetails
  ): Promise<{ success: boolean; message: string; redirect_url?: string }> {
    await supabase.from('external_application_tracking').insert({
      job_id: applicationData.job_id,
      candidate_id: applicationData.candidate_id,
      external_url: job.external_apply_url,
      redirected_at: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Redirection vers le site externe',
      redirect_url: job.external_apply_url
    };
  }

  private async notifyRecruiter(jobId: string, applicationData: ApplicationData): Promise<void> {
    try {
      const { data: job } = await supabase
        .from('jobs')
        .select('recruiter_id, title')
        .eq('id', jobId)
        .single();

      if (!job || !job.recruiter_id) return;

      await supabase.from('notifications').insert({
        user_id: job.recruiter_id,
        type: 'new_application',
        title: 'Nouvelle candidature',
        message: `${applicationData.full_name} a postulé pour ${job.title}`,
        link: `/recruiter/applications?job_id=${jobId}`,
        is_read: false
      });
    } catch (error) {
      console.error('Error notifying recruiter:', error);
    }
  }

  private async notifyAdmin(adminId: string, job: JobDetails, applicationData: ApplicationData): Promise<void> {
    try {
      await supabase.from('notifications').insert({
        user_id: adminId,
        type: 'new_application',
        title: 'Nouvelle candidature (Admin)',
        message: `${applicationData.full_name} a postulé pour ${job.title}`,
        link: `/admin/applications?job_id=${job.id}`,
        is_read: false
      });
    } catch (error) {
      console.error('Error notifying admin:', error);
    }
  }

  private async sendExternalEmail(
    email: string,
    job: JobDetails,
    applicationData: ApplicationData
  ): Promise<void> {
    console.log('Sending email to:', email);
    console.log('Application data:', applicationData);
  }

  private async notifyPartner(job: JobDetails, applicationData: ApplicationData): Promise<void> {
    console.log('Notifying partner for job:', job.id);
    console.log('Application data:', applicationData);
  }

  async getApplicationModeInfo(jobId: string): Promise<{
    mode: ApplicationMode;
    description: string;
    requiresRedirect: boolean;
  } | null> {
    try {
      const { data: job } = await supabase
        .from('jobs')
        .select('application_mode')
        .eq('id', jobId)
        .single();

      if (!job) return null;

      const modeDescriptions: Record<ApplicationMode, { description: string; requiresRedirect: boolean }> = {
        company_account: {
          description: 'Candidature via compte entreprise',
          requiresRedirect: false
        },
        internal_admin: {
          description: 'Candidature gérée par l\'administration',
          requiresRedirect: false
        },
        external_email: {
          description: 'Candidature envoyée par email',
          requiresRedirect: false
        },
        invited_partner: {
          description: 'Candidature gérée par le partenaire',
          requiresRedirect: false
        },
        external_link: {
          description: 'Candidature sur site externe',
          requiresRedirect: true
        }
      };

      const info = modeDescriptions[job.application_mode];

      return {
        mode: job.application_mode,
        description: info.description,
        requiresRedirect: info.requiresRedirect
      };
    } catch (error) {
      console.error('Error getting application mode info:', error);
      return null;
    }
  }
}

export const adminJobApplicationService = new AdminJobApplicationService();
