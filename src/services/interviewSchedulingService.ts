import { supabase } from '../lib/supabase';
import { applicationActionsService } from './applicationActionsService';

export interface Interview {
  id: string;
  application_id: string;
  job_id: string;
  recruiter_id: string;
  candidate_id: string;
  company_id: string;
  interview_type: 'visio' | 'presentiel' | 'telephone';
  scheduled_at: string;
  duration_minutes: number;
  location_or_link: string;
  notes?: string;
  status: 'planned' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  completed_at?: string;
  outcome?: 'positive' | 'neutral' | 'negative';
  feedback?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInterviewParams {
  applicationId: string;
  jobId: string;
  candidateId: string;
  companyId: string;
  interviewType: 'visio' | 'presentiel' | 'telephone';
  scheduledAt: string;
  durationMinutes?: number;
  locationOrLink: string;
  notes?: string;
}

export interface UpdateInterviewParams {
  status?: 'planned' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  scheduledAt?: string;
  locationOrLink?: string;
  notes?: string;
  outcome?: 'positive' | 'neutral' | 'negative';
  feedback?: string;
}

export const interviewSchedulingService = {
  async createInterview(params: CreateInterviewParams): Promise<{ success: boolean; interview?: Interview; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Non authentifié' };
      }

      const { data: interview, error } = await supabase
        .from('interviews')
        .insert({
          application_id: params.applicationId,
          job_id: params.jobId,
          recruiter_id: user.id,
          candidate_id: params.candidateId,
          company_id: params.companyId,
          interview_type: params.interviewType,
          scheduled_at: params.scheduledAt,
          duration_minutes: params.durationMinutes || 60,
          location_or_link: params.locationOrLink,
          notes: params.notes
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating interview:', error);
        return { success: false, error: error.message };
      }

      await supabase
        .from('applications')
        .update({
          workflow_stage: 'À interviewer',
          updated_at: new Date().toISOString()
        })
        .eq('id', params.applicationId);

      await supabase
        .from('application_activity_log')
        .insert({
          application_id: params.applicationId,
          actor_id: user.id,
          action_type: 'interview_scheduled',
          metadata: {
            interview_id: interview.id,
            interview_type: params.interviewType,
            scheduled_at: params.scheduledAt,
            location_or_link: params.locationOrLink
          }
        });

      await supabase
        .from('notifications')
        .insert({
          user_id: params.candidateId,
          type: 'application',
          title: 'Entretien planifié',
          message: `Un entretien a été planifié pour votre candidature. Date: ${new Date(params.scheduledAt).toLocaleString('fr-FR')}`,
          link: `/candidate-dashboard`
        });

      return { success: true, interview };
    } catch (error: any) {
      console.error('Error in createInterview:', error);
      return { success: false, error: error.message };
    }
  },

  async updateInterview(interviewId: string, params: UpdateInterviewParams): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Non authentifié' };
      }

      const updateData: any = { ...params };

      if (params.status === 'completed' && !updateData.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('interviews')
        .update(updateData)
        .eq('id', interviewId);

      if (error) {
        console.error('Error updating interview:', error);
        return { success: false, error: error.message };
      }

      const { data: interview } = await supabase
        .from('interviews')
        .select('application_id, candidate_id')
        .eq('id', interviewId)
        .single();

      if (interview) {
        await supabase
          .from('application_activity_log')
          .insert({
            application_id: interview.application_id,
            actor_id: user.id,
            action_type: 'interview_updated',
            metadata: {
              interview_id: interviewId,
              changes: params
            }
          });

        if (params.status === 'cancelled') {
          await supabase
            .from('notifications')
            .insert({
              user_id: interview.candidate_id,
              type: 'warning',
              title: 'Entretien annulé',
              message: 'Votre entretien a été annulé. Le recruteur vous contactera pour reprogrammer.',
              link: `/candidate-dashboard`
            });
        }

        if (params.status === 'completed') {
          if (params.outcome === 'positive') {
            await supabase
              .from('applications')
              .update({ workflow_stage: 'Acceptées' })
              .eq('id', interview.application_id);
          } else if (params.outcome === 'negative') {
            await supabase
              .from('applications')
              .update({ workflow_stage: 'Rejetées' })
              .eq('id', interview.application_id);
          }
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in updateInterview:', error);
      return { success: false, error: error.message };
    }
  },

  async getInterviewsByJob(jobId: string): Promise<Interview[]> {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('job_id', jobId)
        .order('scheduled_at', { ascending: true });

      if (error) {
        console.error('Error fetching interviews:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getInterviewsByJob:', error);
      return [];
    }
  },

  async getInterviewsByApplication(applicationId: string): Promise<Interview[]> {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('application_id', applicationId)
        .order('scheduled_at', { ascending: false });

      if (error) {
        console.error('Error fetching interviews:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getInterviewsByApplication:', error);
      return [];
    }
  },

  async getUpcomingInterviews(companyId: string): Promise<Interview[]> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('company_id', companyId)
        .in('status', ['planned', 'confirmed'])
        .gte('scheduled_at', now)
        .order('scheduled_at', { ascending: true })
        .limit(20);

      if (error) {
        console.error('Error fetching upcoming interviews:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUpcomingInterviews:', error);
      return [];
    }
  },

  async deleteInterview(interviewId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('interviews')
        .delete()
        .eq('id', interviewId);

      if (error) {
        console.error('Error deleting interview:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in deleteInterview:', error);
      return { success: false, error: error.message };
    }
  },

  getInterviewTypeLabel(type: 'visio' | 'presentiel' | 'telephone'): string {
    const labels = {
      visio: 'Visioconférence',
      presentiel: 'En présentiel',
      telephone: 'Téléphone'
    };
    return labels[type];
  },

  getStatusLabel(status: 'planned' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'): string {
    const labels = {
      planned: 'Planifié',
      confirmed: 'Confirmé',
      completed: 'Terminé',
      cancelled: 'Annulé',
      no_show: 'Absent'
    };
    return labels[status];
  },

  getOutcomeLabel(outcome: 'positive' | 'neutral' | 'negative'): string {
    const labels = {
      positive: 'Positif',
      neutral: 'Neutre',
      negative: 'Négatif'
    };
    return labels[outcome];
  }
};
