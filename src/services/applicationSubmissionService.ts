import { supabase } from '../lib/supabase';
import { notificationService } from './notificationService';

export interface ApplicationSubmissionData {
  jobId: string;
  candidateId: string;
  coverLetter?: string;
  cvUrl?: string;
  additionalDocuments?: Array<{
    type: string;
    url: string;
    title: string;
  }>;
}

export interface ApplicationSubmissionResult {
  success: boolean;
  applicationId?: string;
  applicationReference?: string;
  error?: string;
  nextSteps?: string[];
}

export interface RecruiterNotificationPrefs {
  instant_email_enabled: boolean;
  instant_sms_enabled: boolean;
  instant_whatsapp_enabled: boolean;
}

const EMAIL_TEMPLATES = {
  candidateConfirmation: {
    subject: (jobTitle: string, ref: string) =>
      `Candidature reçue – ${jobTitle} – Réf ${ref}`,

    body: (data: {
      candidateName: string;
      jobTitle: string;
      companyName: string;
      applicationReference: string;
      jobLocation: string;
      appliedDate: string;
    }) => `Bonjour ${data.candidateName},

Nous avons bien reçu votre candidature pour le poste de ${data.jobTitle} chez ${data.companyName}.

📋 DÉTAILS DE VOTRE CANDIDATURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 Poste : ${data.jobTitle}
🏢 Entreprise : ${data.companyName}
📍 Localisation : ${data.jobLocation}
📅 Date de candidature : ${data.appliedDate}
🔖 Référence : ${data.applicationReference}

✅ PROCHAINES ÉTAPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Votre profil sera étudié par notre équipe de recrutement
2. Si votre profil correspond, nous vous contacterons pour un entretien
3. Vous pouvez suivre l'évolution de votre candidature sur votre espace candidat

💡 CONSEILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Assurez-vous que votre profil est à jour et complet
• Consultez régulièrement votre espace candidat
• Gardez votre référence de candidature : ${data.applicationReference}

Nous vous remercions de votre intérêt et vous souhaitons bonne chance !

Cordialement,
L'équipe ${data.companyName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JobGuinée - La plateforme emploi de référence en Guinée
`
  },

  recruiterAlert: {
    subject: (jobTitle: string, candidateName: string) =>
      `Nouvelle candidature – ${jobTitle} – ${candidateName}`,

    body: (data: {
      recruiterName: string;
      candidateName: string;
      jobTitle: string;
      applicationReference: string;
      aiScore: number;
      appliedDate: string;
      pipelineLink: string;
      candidateEmail: string;
      candidatePhone?: string;
    }) => `Bonjour ${data.recruiterName},

Vous avez reçu une nouvelle candidature !

👤 CANDIDAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nom : ${data.candidateName}
Email : ${data.candidateEmail}
${data.candidatePhone ? `Téléphone : ${data.candidatePhone}` : ''}

💼 POSTE CONCERNÉ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${data.jobTitle}

📊 INFORMATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Date : ${data.appliedDate}
🔖 Référence : ${data.applicationReference}

🔗 ACTION REQUISE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Consultez cette candidature dans votre pipeline :
👉 ${data.pipelineLink}

N'oubliez pas de répondre rapidement pour ne pas perdre les meilleurs talents !

Cordialement,
JobGuinée

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cette candidature nécessite votre attention
`
  }
};

export const applicationSubmissionService = {
  async checkExistingApplication(
    candidateId: string,
    jobId: string
  ): Promise<{ exists: boolean; applicationId?: string }> {
    const { data, error } = await supabase
      .from('applications')
      .select('id')
      .eq('candidate_id', candidateId)
      .eq('job_id', jobId)
      .maybeSingle();

    if (error) {
      console.error('Error checking existing application:', error);
      return { exists: false };
    }

    return { exists: !!data, applicationId: data?.id };
  },

  async getJobDetails(jobId: string) {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        companies (
          id,
          name,
          profile_id
        )
      `)
      .eq('id', jobId)
      .single();

    if (error) throw new Error('Offre non trouvée');
    return data;
  },

  async getCandidateProfile(candidateId: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone')
      .eq('id', candidateId)
      .single();

    return profile;
  },

  async getRecruiterNotificationPrefs(recruiterId: string): Promise<RecruiterNotificationPrefs> {
    const { data } = await supabase
      .from('recruiter_notification_settings')
      .select('instant_email_enabled, instant_sms_enabled, instant_whatsapp_enabled')
      .eq('recruiter_id', recruiterId)
      .maybeSingle();

    return data || {
      instant_email_enabled: true,
      instant_sms_enabled: false,
      instant_whatsapp_enabled: false
    };
  },

  async calculateAIScore(
    candidateSkills: string[],
    candidateExperienceYears: number,
    jobKeywords: string[],
    jobExperienceLevel: string
  ): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('calculate_simple_ai_score', {
        candidate_skills: candidateSkills,
        candidate_experience_years: candidateExperienceYears,
        job_keywords: jobKeywords,
        job_experience_level: jobExperienceLevel
      });

      if (error) {
        console.error('Error calculating AI score:', error);
        return 50;
      }

      return data || 50;
    } catch (error) {
      console.error('Exception calculating AI score:', error);
      return 50;
    }
  },

  async submitApplication(
    submissionData: ApplicationSubmissionData
  ): Promise<ApplicationSubmissionResult> {
    try {
      const { jobId, candidateId, coverLetter, cvUrl } = submissionData;

      const existing = await this.checkExistingApplication(candidateId, jobId);
      if (existing.exists) {
        return {
          success: false,
          error: 'Vous avez déjà postulé à cette offre'
        };
      }

      const job = await this.getJobDetails(jobId);
      const candidate = await this.getCandidateProfile(candidateId);

      if (!candidate) {
        return {
          success: false,
          error: 'Profil candidat non trouvé'
        };
      }

      const companyName = job.companies?.name || 'Entreprise confidentielle';
      const companyProfileId = job.companies?.profile_id;

      const { data: candidateProfile } = await supabase
        .from('candidate_profiles')
        .select('skills, experience_years')
        .eq('profile_id', candidateId)
        .maybeSingle();

      const aiScore = await this.calculateAIScore(
        candidateProfile?.skills || [],
        candidateProfile?.experience_years || 0,
        job.keywords || [],
        job.experience_level || ''
      );

      const { data: application, error: insertError } = await supabase
        .from('applications')
        .insert({
          job_id: jobId,
          candidate_id: candidateId,
          cover_letter: coverLetter,
          cv_url: cvUrl,
          status: 'pending',
          workflow_stage: 'Candidature reçue',
          ai_matching_score: aiScore
        })
        .select('id, application_reference, ai_matching_score')
        .single();

      if (insertError) {
        console.error('Insert error details:', insertError);
        throw new Error(`Erreur lors de la création de la candidature: ${insertError.message || insertError.code}`);
      }

      if (!application) {
        throw new Error('Aucune candidature créée');
      }

      const appliedDate = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      await this.sendCandidateConfirmation({
        candidateId: candidate.id,
        candidateEmail: candidate.email,
        candidateName: candidate.full_name || 'Candidat',
        jobTitle: job.title,
        companyName: companyName,
        jobLocation: job.location || 'Non spécifié',
        applicationReference: application.application_reference,
        applicationId: application.id,
        appliedDate
      });

      if (companyProfileId) {
        await this.sendRecruiterAlert({
          recruiterId: companyProfileId,
          recruiterEmail: '',
          candidateName: candidate.full_name || 'Candidat',
          candidateEmail: candidate.email,
          candidatePhone: candidate.phone,
          jobTitle: job.title,
          jobId: job.id,
          applicationId: application.id,
          applicationReference: application.application_reference,
          aiScore: application.ai_matching_score || 0,
          appliedDate
        });
      }

      const nextSteps = [
        'Votre candidature est en cours d\'examen',
        'Vous recevrez une notification dès qu\'il y aura du nouveau',
        'Consultez régulièrement votre espace candidat',
        'Gardez précieusement votre référence : ' + application.application_reference
      ];

      return {
        success: true,
        applicationId: application.id,
        applicationReference: application.application_reference,
        nextSteps
      };

    } catch (error: any) {
      console.error('Error submitting application:', error);
      return {
        success: false,
        error: error.message || 'Une erreur est survenue'
      };
    }
  },

  async sendCandidateConfirmation(data: {
    candidateId: string;
    candidateEmail: string;
    candidateName: string;
    jobTitle: string;
    companyName: string;
    jobLocation: string;
    applicationReference: string;
    applicationId: string;
    appliedDate: string;
  }): Promise<void> {
    const subject = EMAIL_TEMPLATES.candidateConfirmation.subject(
      data.jobTitle,
      data.applicationReference
    );

    const body = EMAIL_TEMPLATES.candidateConfirmation.body(data);

    await notificationService.sendNotification({
      recipientId: data.candidateId,
      type: 'application_status_update',
      title: 'Candidature envoyée avec succès',
      message: `Votre candidature pour ${data.jobTitle} a été envoyée. Référence : ${data.applicationReference}`,
      channels: ['notification'],
      metadata: {
        application_id: data.applicationId,
        application_reference: data.applicationReference
      },
      applicationId: data.applicationId
    });

    await supabase.from('email_logs').insert({
      recipient_id: data.candidateId,
      recipient_email: data.candidateEmail,
      email_type: 'application_confirmation',
      template_code: 'candidate_confirmation',
      subject,
      body_text: body,
      application_id: data.applicationId,
      status: 'sent',
      sent_at: new Date().toISOString()
    });

    console.log('[EMAIL] Confirmation candidat envoyé à:', data.candidateEmail);
    console.log('[EMAIL] Sujet:', subject);
  },

  async sendRecruiterAlert(data: {
    recruiterId: string;
    recruiterEmail: string;
    candidateName: string;
    candidateEmail: string;
    candidatePhone?: string;
    jobTitle: string;
    jobId: string;
    applicationId: string;
    applicationReference: string;
    aiScore: number;
    appliedDate: string;
  }): Promise<void> {
    const { data: recruiter } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', data.recruiterId)
      .single();

    if (!recruiter) return;

    const prefs = await this.getRecruiterNotificationPrefs(data.recruiterId);

    const pipelineLink = `${window.location.origin}/recruiter-dashboard?tab=pipeline&application=${data.applicationId}`;

    const subject = EMAIL_TEMPLATES.recruiterAlert.subject(
      data.jobTitle,
      data.candidateName
    );

    const body = EMAIL_TEMPLATES.recruiterAlert.body({
      recruiterName: recruiter.full_name || 'Recruteur',
      candidateName: data.candidateName,
      candidateEmail: data.candidateEmail,
      candidatePhone: data.candidatePhone,
      jobTitle: data.jobTitle,
      applicationReference: data.applicationReference,
      aiScore: data.aiScore,
      appliedDate: data.appliedDate,
      pipelineLink
    });

    await notificationService.sendNotification({
      recipientId: data.recruiterId,
      type: 'application_status_update',
      title: `Nouvelle candidature : ${data.jobTitle}`,
      message: `${data.candidateName} a postulé pour ${data.jobTitle}`,
      channels: ['notification'],
      metadata: {
        application_id: data.applicationId,
        job_id: data.jobId,
        candidate_name: data.candidateName
      },
      applicationId: data.applicationId
    });

    if (prefs.instant_email_enabled) {
      await supabase.from('email_logs').insert({
        recipient_id: data.recruiterId,
        recipient_email: recruiter.email,
        email_type: 'recruiter_new_application',
        template_code: 'recruiter_alert',
        subject,
        body_text: body,
        application_id: data.applicationId,
        job_id: data.jobId,
        status: 'sent',
        sent_at: new Date().toISOString()
      });

      console.log('[EMAIL] Alerte recruteur envoyée à:', recruiter.email);
      console.log('[EMAIL] Sujet:', subject);
    }

    if (prefs.instant_sms_enabled) {
      console.log('[SMS] Alerte recruteur envoyée');
    }

    if (prefs.instant_whatsapp_enabled) {
      console.log('[WhatsApp] Alerte recruteur envoyée');
    }
  }
};
