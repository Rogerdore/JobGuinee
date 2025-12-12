import { supabase } from '../lib/supabase';

export interface InterviewEvaluation {
  id: string;
  interview_id: string;
  application_id: string;
  recruiter_id: string;
  technical_score?: number;
  soft_skills_score?: number;
  motivation_score?: number;
  cultural_fit_score?: number;
  overall_score?: number;
  recommendation?: 'recommended' | 'to_confirm' | 'not_retained';
  strengths?: string;
  weaknesses?: string;
  detailed_feedback?: string;
  hiring_recommendation_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEvaluationParams {
  interviewId: string;
  applicationId: string;
  technicalScore?: number;
  softSkillsScore?: number;
  motivationScore?: number;
  culturalFitScore?: number;
  recommendation?: 'recommended' | 'to_confirm' | 'not_retained';
  strengths?: string;
  weaknesses?: string;
  detailedFeedback?: string;
  hiringRecommendationNotes?: string;
}

export interface CandidateComparison {
  job_id: string;
  job_title: string;
  application_id: string;
  candidate_id: string;
  candidate_name: string;
  ai_match_score?: number;
  interview_score?: number;
  recommendation?: 'recommended' | 'to_confirm' | 'not_retained';
  technical_score?: number;
  soft_skills_score?: number;
  motivation_score?: number;
  cultural_fit_score?: number;
  is_shortlisted: boolean;
  workflow_stage: string;
  evaluated_at?: string;
}

export const interviewEvaluationService = {
  async createEvaluation(params: CreateEvaluationParams): Promise<{ success: boolean; evaluation?: InterviewEvaluation; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Non authentifié' };
      }

      const { data: evaluation, error } = await supabase
        .from('interview_evaluations')
        .insert({
          interview_id: params.interviewId,
          application_id: params.applicationId,
          recruiter_id: user.id,
          technical_score: params.technicalScore,
          soft_skills_score: params.softSkillsScore,
          motivation_score: params.motivationScore,
          cultural_fit_score: params.culturalFitScore,
          recommendation: params.recommendation,
          strengths: params.strengths,
          weaknesses: params.weaknesses,
          detailed_feedback: params.detailedFeedback,
          hiring_recommendation_notes: params.hiringRecommendationNotes
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating evaluation:', error);
        return { success: false, error: error.message };
      }

      await supabase
        .from('application_activity_log')
        .insert({
          application_id: params.applicationId,
          actor_id: user.id,
          action_type: 'interview_evaluated',
          metadata: {
            evaluation_id: evaluation.id,
            overall_score: evaluation.overall_score,
            recommendation: evaluation.recommendation
          }
        });

      return { success: true, evaluation };
    } catch (error: any) {
      console.error('Error in createEvaluation:', error);
      return { success: false, error: error.message };
    }
  },

  async updateEvaluation(evaluationId: string, params: Partial<CreateEvaluationParams>): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {};

      if (params.technicalScore !== undefined) updateData.technical_score = params.technicalScore;
      if (params.softSkillsScore !== undefined) updateData.soft_skills_score = params.softSkillsScore;
      if (params.motivationScore !== undefined) updateData.motivation_score = params.motivationScore;
      if (params.culturalFitScore !== undefined) updateData.cultural_fit_score = params.culturalFitScore;
      if (params.recommendation !== undefined) updateData.recommendation = params.recommendation;
      if (params.strengths !== undefined) updateData.strengths = params.strengths;
      if (params.weaknesses !== undefined) updateData.weaknesses = params.weaknesses;
      if (params.detailedFeedback !== undefined) updateData.detailed_feedback = params.detailedFeedback;
      if (params.hiringRecommendationNotes !== undefined) updateData.hiring_recommendation_notes = params.hiringRecommendationNotes;

      const { error } = await supabase
        .from('interview_evaluations')
        .update(updateData)
        .eq('id', evaluationId);

      if (error) {
        console.error('Error updating evaluation:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in updateEvaluation:', error);
      return { success: false, error: error.message };
    }
  },

  async getEvaluationByInterview(interviewId: string): Promise<InterviewEvaluation | null> {
    try {
      const { data, error } = await supabase
        .from('interview_evaluations')
        .select('*')
        .eq('interview_id', interviewId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching evaluation:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getEvaluationByInterview:', error);
      return null;
    }
  },

  async getEvaluationsByJob(jobId: string): Promise<InterviewEvaluation[]> {
    try {
      const { data, error } = await supabase
        .from('interview_evaluations')
        .select(`
          *,
          interview:interviews!inner(job_id)
        `)
        .eq('interview.job_id', jobId)
        .order('overall_score', { ascending: false });

      if (error) {
        console.error('Error fetching evaluations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getEvaluationsByJob:', error);
      return [];
    }
  },

  async getCandidateComparison(jobId: string): Promise<CandidateComparison[]> {
    try {
      const { data, error } = await supabase
        .from('job_candidate_comparison')
        .select('*')
        .eq('job_id', jobId);

      if (error) {
        console.error('Error fetching candidate comparison:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCandidateComparison:', error);
      return [];
    }
  },

  async deleteEvaluation(evaluationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('interview_evaluations')
        .delete()
        .eq('id', evaluationId);

      if (error) {
        console.error('Error deleting evaluation:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in deleteEvaluation:', error);
      return { success: false, error: error.message };
    }
  },

  getRecommendationLabel(recommendation: 'recommended' | 'to_confirm' | 'not_retained'): string {
    const labels = {
      recommended: 'Recommandé',
      to_confirm: 'À confirmer',
      not_retained: 'Non retenu'
    };
    return labels[recommendation];
  },

  getRecommendationColor(recommendation: 'recommended' | 'to_confirm' | 'not_retained'): string {
    const colors = {
      recommended: 'green',
      to_confirm: 'yellow',
      not_retained: 'red'
    };
    return colors[recommendation];
  },

  getScoreColor(score: number): string {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    if (score >= 40) return 'orange';
    return 'red';
  },

  getScoreLabel(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Bon';
    if (score >= 40) return 'Moyen';
    return 'Faible';
  }
};
