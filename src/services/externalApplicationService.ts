import { supabase } from '../lib/supabase';

export interface ExternalApplication {
  id: string;
  candidate_id: string;
  job_title: string;
  company_name: string;
  job_url?: string;
  job_description?: string;
  recruiter_email: string;
  recruiter_name?: string;
  cv_document_id?: string;
  cover_letter_document_id?: string;
  additional_document_ids: string[];
  cv_source?: 'profile' | 'document_center' | 'uploaded';
  custom_message?: string;
  public_profile_token?: string;
  status: 'sent' | 'in_progress' | 'relance_sent' | 'rejected' | 'accepted' | 'no_response' | 'cancelled';
  sent_at: string;
  email_sent_successfully: boolean;
  email_error_message?: string;
  last_relance_at?: string;
  relance_count: number;
  candidate_notes?: string;
  imported_from_url: boolean;
  import_method?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExternalApplicationParams {
  job_title: string;
  company_name: string;
  job_url?: string;
  job_description?: string;
  recruiter_email: string;
  recruiter_name?: string;
  cv_document_id?: string;
  cover_letter_document_id?: string;
  additional_document_ids?: string[];
  cv_source?: 'profile' | 'document_center' | 'uploaded';
  custom_message?: string;
  imported_from_url?: boolean;
  import_method?: string;
}

export interface ExternalApplicationConfig {
  module_enabled: boolean;
  min_profile_completion: number;
  max_file_size_mb: number;
  allowed_file_types: string[];
  max_applications_per_day: number;
  max_relances_per_application: number;
  min_days_between_relances: number;
  token_validity_days: number;
  application_email_template?: string;
  relance_email_template?: string;
}

class ExternalApplicationService {
  /**
   * Vérifie l'accès au module candidatures externes
   */
  async checkAccess(candidateId: string): Promise<{ hasAccess: boolean; reason?: string; profileCompletion?: number }> {
    try {
      const { data: config } = await supabase
        .from('external_applications_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!config || !config.module_enabled) {
        return {
          hasAccess: false,
          reason: 'Le module de candidatures externes est actuellement désactivé.'
        };
      }

      const { data: profile } = await supabase
        .from('candidate_profiles')
        .select('profile_completion_percentage')
        .eq('profile_id', candidateId)
        .maybeSingle();

      const completion = profile?.profile_completion_percentage || 0;

      if (completion < config.min_profile_completion) {
        return {
          hasAccess: false,
          reason: `Votre profil doit être complété à ${config.min_profile_completion}% minimum pour accéder aux candidatures externes.`,
          profileCompletion: completion
        };
      }

      return { hasAccess: true, profileCompletion: completion };
    } catch (error) {
      console.error('Error checking external application access:', error);
      return {
        hasAccess: false,
        reason: 'Erreur lors de la vérification d\'accès.'
      };
    }
  }

  /**
   * Récupère la configuration du module
   */
  async getConfig(): Promise<{ success: boolean; data?: ExternalApplicationConfig; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('external_applications_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || undefined };
    } catch (error) {
      console.error('Error fetching config:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Crée une candidature externe
   */
  async createApplication(
    candidateId: string,
    params: CreateExternalApplicationParams
  ): Promise<{ success: boolean; data?: ExternalApplication; error?: string }> {
    try {
      const accessCheck = await this.checkAccess(candidateId);
      if (!accessCheck.hasAccess) {
        return { success: false, error: accessCheck.reason };
      }

      const limitsCheck = await this.checkDailyLimits(candidateId);
      if (!limitsCheck.allowed) {
        return { success: false, error: limitsCheck.reason };
      }

      const token = await this.generatePublicProfileToken(candidateId);

      const applicationData = {
        candidate_id: candidateId,
        ...params,
        public_profile_token: token,
        status: 'sent' as const,
        email_sent_successfully: false,
        relance_count: 0,
        imported_from_url: params.imported_from_url || false
      };

      const { data, error } = await supabase
        .from('external_applications')
        .insert(applicationData)
        .select()
        .single();

      if (error) {
        console.error('Error creating external application:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in createApplication:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Génère un token d'accès public au profil
   */
  private async generatePublicProfileToken(candidateId: string): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('generate_public_profile_token', {
        p_candidate_id: candidateId
      });

      if (error || !data) {
        throw new Error('Failed to generate token');
      }

      return data;
    } catch (error) {
      console.error('Error generating token:', error);
      throw error;
    }
  }

  /**
   * Vérifie les limites quotidiennes
   */
  private async checkDailyLimits(candidateId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const { data: config } = await supabase
        .from('external_applications_config')
        .select('max_applications_per_day')
        .limit(1)
        .maybeSingle();

      if (!config) {
        return { allowed: true };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from('external_applications')
        .select('*', { count: 'exact', head: true })
        .eq('candidate_id', candidateId)
        .gte('created_at', today.toISOString());

      if (count && count >= config.max_applications_per_day) {
        return {
          allowed: false,
          reason: `Vous avez atteint la limite de ${config.max_applications_per_day} candidatures par jour. Réessayez demain.`
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking daily limits:', error);
      return { allowed: true };
    }
  }

  /**
   * Récupère toutes les candidatures d'un candidat
   */
  async getCandidateApplications(candidateId: string): Promise<{ success: boolean; data?: ExternalApplication[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('external_applications')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching applications:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Récupère une candidature spécifique
   */
  async getApplication(applicationId: string): Promise<{ success: boolean; data?: ExternalApplication; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('external_applications')
        .select('*')
        .eq('id', applicationId)
        .maybeSingle();

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: 'Candidature non trouvée' };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching application:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Met à jour le statut d'une candidature
   */
  async updateApplicationStatus(
    applicationId: string,
    status: ExternalApplication['status'],
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updates: any = { status };
      if (notes !== undefined) {
        updates.candidate_notes = notes;
      }

      const { error } = await supabase
        .from('external_applications')
        .update(updates)
        .eq('id', applicationId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating application status:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Envoie une relance pour une candidature
   */
  async sendRelance(
    applicationId: string,
    message: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: application } = await this.getApplication(applicationId);
      if (!application) {
        return { success: false, error: 'Candidature non trouvée' };
      }

      const canRelance = await this.canSendRelance(application);
      if (!canRelance.allowed) {
        return { success: false, error: canRelance.reason };
      }

      const { error: relanceError } = await supabase
        .from('external_application_relances')
        .insert({
          external_application_id: applicationId,
          message,
          email_sent_successfully: false
        });

      if (relanceError) {
        return { success: false, error: relanceError.message };
      }

      const { error: updateError } = await supabase
        .from('external_applications')
        .update({
          last_relance_at: new Date().toISOString(),
          relance_count: application.relance_count + 1,
          status: 'relance_sent'
        })
        .eq('id', applicationId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending relance:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Vérifie si une relance peut être envoyée
   */
  private async canSendRelance(application: ExternalApplication): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const { data: config } = await supabase
        .from('external_applications_config')
        .select('max_relances_per_application, min_days_between_relances')
        .limit(1)
        .maybeSingle();

      if (!config) {
        return { allowed: true };
      }

      if (application.relance_count >= config.max_relances_per_application) {
        return {
          allowed: false,
          reason: `Nombre maximum de relances atteint (${config.max_relances_per_application})`
        };
      }

      if (application.last_relance_at) {
        const lastRelance = new Date(application.last_relance_at);
        const daysSince = Math.floor((Date.now() - lastRelance.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSince < config.min_days_between_relances) {
          return {
            allowed: false,
            reason: `Vous devez attendre ${config.min_days_between_relances} jours entre chaque relance (${daysSince} jours écoulés)`
          };
        }
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking relance permissions:', error);
      return { allowed: false, reason: 'Erreur lors de la vérification' };
    }
  }

  /**
   * Marque un email comme envoyé
   */
  async markEmailSent(
    applicationId: string,
    success: boolean,
    errorMessage?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('external_applications')
        .update({
          email_sent_successfully: success,
          email_error_message: errorMessage,
          sent_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error marking email sent:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Statistiques candidatures externes
   */
  async getStatistics(candidateId: string): Promise<{
    total: number;
    sent: number;
    in_progress: number;
    accepted: number;
    rejected: number;
    no_response: number;
  }> {
    try {
      const { data } = await supabase
        .from('external_applications')
        .select('status')
        .eq('candidate_id', candidateId);

      const stats = {
        total: data?.length || 0,
        sent: 0,
        in_progress: 0,
        accepted: 0,
        rejected: 0,
        no_response: 0
      };

      data?.forEach(app => {
        if (app.status === 'sent' || app.status === 'relance_sent') stats.sent++;
        else if (app.status === 'in_progress') stats.in_progress++;
        else if (app.status === 'accepted') stats.accepted++;
        else if (app.status === 'rejected') stats.rejected++;
        else if (app.status === 'no_response') stats.no_response++;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return { total: 0, sent: 0, in_progress: 0, accepted: 0, rejected: 0, no_response: 0 };
    }
  }
}

export const externalApplicationService = new ExternalApplicationService();
export default ExternalApplicationService;
