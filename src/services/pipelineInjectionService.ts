import { supabase } from '../lib/supabase';
import { applicationActionsService } from './applicationActionsService';

export interface MatchingResultForInjection {
  applicationId: string;
  candidateName: string;
  score: number;
  category: 'strong' | 'medium' | 'weak';
  summary?: string;
}

export interface InjectionConfig {
  strongMatchStage: string;
  mediumMatchStage: string;
  weakMatchAction: 'keep' | 'reject';
}

export interface InjectionResult {
  success: boolean;
  moved: number;
  kept: number;
  rejected: number;
  error?: string;
  details: Array<{
    applicationId: string;
    candidateName: string;
    action: string;
    stage: string;
  }>;
}

export const pipelineInjectionService = {
  async injectMatchingResults(
    results: MatchingResultForInjection[],
    config: InjectionConfig = {
      strongMatchStage: 'Présélection IA',
      mediumMatchStage: 'Reçues',
      weakMatchAction: 'keep'
    }
  ): Promise<InjectionResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          moved: 0,
          kept: 0,
          rejected: 0,
          error: 'Non authentifié',
          details: []
        };
      }

      let moved = 0;
      let kept = 0;
      let rejected = 0;
      const details: Array<{ applicationId: string; candidateName: string; action: string; stage: string }> = [];

      for (const result of results) {
        const { applicationId, candidateName, score, category, summary } = result;

        let targetStage = '';
        let action = '';

        if (category === 'strong') {
          targetStage = config.strongMatchStage;
          action = 'Déplacé vers Présélection IA';
          moved++;
        } else if (category === 'medium') {
          targetStage = config.mediumMatchStage;
          action = 'Conservé en Reçues';
          kept++;
        } else {
          if (config.weakMatchAction === 'reject') {
            targetStage = 'Rejetées';
            action = 'Déplacé vers Rejetées';
            rejected++;
          } else {
            targetStage = config.mediumMatchStage;
            action = 'Conservé en Reçues';
            kept++;
          }
        }

        const updateData: any = {
          workflow_stage: targetStage,
          ai_score: score,
          ai_category: category,
          updated_at: new Date().toISOString()
        };

        if (targetStage === 'Rejetées') {
          updateData.rejected_reason = `Score IA insuffisant (${score}%). ${summary || 'Profil ne correspondant pas aux critères principaux.'}`;
          updateData.rejected_at = new Date().toISOString();
        }

        const { error: updateError } = await supabase
          .from('applications')
          .update(updateData)
          .eq('id', applicationId);

        if (updateError) {
          console.error('Error updating application:', updateError);
          continue;
        }

        await supabase
          .from('application_activity_log')
          .insert({
            application_id: applicationId,
            actor_id: user.id,
            action_type: 'ai_matching_injection',
            metadata: {
              score,
              category,
              previous_stage: 'Reçues',
              new_stage: targetStage,
              summary: summary || `Score IA: ${score}%`,
              action
            }
          });

        details.push({
          applicationId,
          candidateName,
          action,
          stage: targetStage
        });
      }

      return {
        success: true,
        moved,
        kept,
        rejected,
        details
      };
    } catch (error: any) {
      console.error('Error in injectMatchingResults:', error);
      return {
        success: false,
        moved: 0,
        kept: 0,
        rejected: 0,
        error: error.message,
        details: []
      };
    }
  },

  async verifyAndCreateStage(companyId: string, stageName: string): Promise<boolean> {
    try {
      const { data: existingStage } = await supabase
        .from('workflow_stages')
        .select('id')
        .eq('company_id', companyId)
        .eq('stage_name', stageName)
        .maybeSingle();

      if (existingStage) {
        return true;
      }

      const { data: maxOrder } = await supabase
        .from('workflow_stages')
        .select('stage_order')
        .eq('company_id', companyId)
        .order('stage_order', { ascending: false })
        .limit(1)
        .maybeSingle();

      const newOrder = maxOrder ? maxOrder.stage_order + 1 : 1;

      const { error } = await supabase
        .from('workflow_stages')
        .insert({
          company_id: companyId,
          stage_name: stageName,
          stage_order: newOrder,
          stage_color: '#10b981'
        });

      if (error) {
        console.error('Error creating stage:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in verifyAndCreateStage:', error);
      return false;
    }
  },

  getCategoryLabel(category: 'strong' | 'medium' | 'weak'): string {
    const labels = {
      strong: 'Forte correspondance',
      medium: 'Correspondance moyenne',
      weak: 'Faible correspondance'
    };
    return labels[category];
  },

  getCategoryIcon(category: 'strong' | 'medium' | 'weak'): string {
    const icons = {
      strong: '🟢',
      medium: '🟡',
      weak: '🔴'
    };
    return icons[category];
  },

  getCategoryColor(category: 'strong' | 'medium' | 'weak'): string {
    const colors = {
      strong: 'green',
      medium: 'yellow',
      weak: 'red'
    };
    return colors[category];
  },

  groupResultsByCategory(results: MatchingResultForInjection[]): {
    strong: MatchingResultForInjection[];
    medium: MatchingResultForInjection[];
    weak: MatchingResultForInjection[];
  } {
    return {
      strong: results.filter(r => r.category === 'strong'),
      medium: results.filter(r => r.category === 'medium'),
      weak: results.filter(r => r.category === 'weak')
    };
  },

  calculateAverageScore(results: MatchingResultForInjection[]): number {
    if (results.length === 0) return 0;
    const sum = results.reduce((acc, r) => acc + r.score, 0);
    return Math.round(sum / results.length);
  }
};
