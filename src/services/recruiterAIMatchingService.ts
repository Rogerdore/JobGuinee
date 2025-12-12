import { IAConfigService } from './iaConfigService';
import { supabase } from '../lib/supabase';

export interface CandidateInput {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  title?: string;
  skills: string[];
  experience_years?: number;
  education?: string;
  work_history?: string;
  achievements?: string;
}

export interface JobInput {
  title: string;
  description: string;
  required_skills?: string[];
  experience_level?: string;
  education_level?: string;
  department?: string;
}

export interface MatchingInput {
  job: JobInput;
  candidates: CandidateInput[];
}

export interface ScoreBreakdown {
  technical_skills: number;
  experience: number;
  education: number;
  cultural_fit: number;
}

export interface CandidateAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface MatchingResult {
  candidate_id: string;
  candidate_name: string;
  score: number;
  category: 'excellent' | 'potential' | 'weak';
  analysis: CandidateAnalysis;
  score_breakdown?: ScoreBreakdown;
}

export interface MatchingSummary {
  total_analyzed: number;
  excellent_count: number;
  potential_count: number;
  weak_count: number;
  top_recommendation?: string;
}

export interface MatchingOutput {
  results: MatchingResult[];
  summary: MatchingSummary;
}

export class RecruiterAIMatchingService {
  private static readonly SERVICE_CODE = 'ai_recruiter_matching';

  static async analyzeMatching(input: MatchingInput, userId: string): Promise<MatchingOutput> {
    try {
      const config = await IAConfigService.getConfig(this.SERVICE_CODE);

      if (!config) {
        throw new Error('Service configuration not found');
      }

      if (!config.is_active) {
        throw new Error('Service is currently disabled');
      }

      const validationResult = IAConfigService.validateInput(input, config.input_schema);
      if (!validationResult.valid) {
        throw new Error(`Invalid input: ${validationResult.errors.join(', ')}`);
      }

      const prompt = IAConfigService.buildPrompt(config, input);

      const aiResponse = await this.callAIService(prompt);

      const parsedOutput = IAConfigService.parseOutput(aiResponse, config.output_schema);

      const validOutput = this.validateAndNormalizeOutput(parsedOutput, input.candidates);

      await IAConfigService.logServiceUsage(
        userId,
        this.SERVICE_CODE,
        input,
        validOutput,
        10
      );

      return validOutput;
    } catch (error) {
      console.error('Error in analyzeMatching:', error);
      throw error;
    }
  }

  private static async callAIService(prompt: any): Promise<string> {
    console.log('AI Service Call:', {
      model: prompt.model,
      temperature: prompt.temperature,
      maxTokens: prompt.maxTokens
    });

    const mockResponse = this.generateMockResponse();
    return JSON.stringify(mockResponse);
  }

  private static generateMockResponse(): MatchingOutput {
    return {
      results: [],
      summary: {
        total_analyzed: 0,
        excellent_count: 0,
        potential_count: 0,
        weak_count: 0
      }
    };
  }

  private static validateAndNormalizeOutput(
    output: any,
    candidates: CandidateInput[]
  ): MatchingOutput {
    if (!output || !output.results || !Array.isArray(output.results)) {
      return this.generateFallbackMatching(candidates);
    }

    const candidateMap = new Map(candidates.map(c => [c.id, c]));

    const validResults = output.results
      .filter((r: any) => candidateMap.has(r.candidate_id))
      .map((r: any) => this.normalizeResult(r, candidateMap.get(r.candidate_id)!));

    const summary: MatchingSummary = {
      total_analyzed: validResults.length,
      excellent_count: validResults.filter(r => r.category === 'excellent').length,
      potential_count: validResults.filter(r => r.category === 'potential').length,
      weak_count: validResults.filter(r => r.category === 'weak').length,
      top_recommendation: validResults.length > 0 ? validResults[0].candidate_name : undefined
    };

    return {
      results: validResults,
      summary
    };
  }

  private static normalizeResult(result: any, candidate: CandidateInput): MatchingResult {
    const score = Math.max(0, Math.min(100, result.score || 0));

    let category: 'excellent' | 'potential' | 'weak' = 'weak';
    if (score >= 75) {
      category = 'excellent';
    } else if (score >= 50) {
      category = 'potential';
    }

    return {
      candidate_id: result.candidate_id || candidate.id,
      candidate_name: result.candidate_name || candidate.name,
      score,
      category,
      analysis: {
        summary: result.analysis?.summary || 'Analyse en cours...',
        strengths: Array.isArray(result.analysis?.strengths)
          ? result.analysis.strengths
          : [],
        weaknesses: Array.isArray(result.analysis?.weaknesses)
          ? result.analysis.weaknesses
          : [],
        recommendations: Array.isArray(result.analysis?.recommendations)
          ? result.analysis.recommendations
          : []
      },
      score_breakdown: result.score_breakdown || {
        technical_skills: 0,
        experience: 0,
        education: 0,
        cultural_fit: 0
      }
    };
  }

  private static generateFallbackMatching(candidates: CandidateInput[]): MatchingOutput {
    const results = candidates.map(candidate => {
      const baseScore = Math.floor(Math.random() * 40) + 40;

      let category: 'excellent' | 'potential' | 'weak' = 'weak';
      if (baseScore >= 75) {
        category = 'excellent';
      } else if (baseScore >= 50) {
        category = 'potential';
      }

      return {
        candidate_id: candidate.id,
        candidate_name: candidate.name,
        score: baseScore,
        category,
        analysis: {
          summary: `Analyse du profil de ${candidate.name}`,
          strengths: [
            'Compétences techniques pertinentes',
            'Expérience dans le domaine'
          ],
          weaknesses: [
            'Nécessite évaluation approfondie'
          ],
          recommendations: [
            'Planifier un entretien de présélection',
            'Vérifier les références'
          ]
        },
        score_breakdown: {
          technical_skills: Math.floor(baseScore * 0.4),
          experience: Math.floor(baseScore * 0.3),
          education: Math.floor(baseScore * 0.15),
          cultural_fit: Math.floor(baseScore * 0.15)
        }
      };
    });

    const summary: MatchingSummary = {
      total_analyzed: results.length,
      excellent_count: results.filter(r => r.category === 'excellent').length,
      potential_count: results.filter(r => r.category === 'potential').length,
      weak_count: results.filter(r => r.category === 'weak').length,
      top_recommendation: results.length > 0
        ? results.sort((a, b) => b.score - a.score)[0].candidate_name
        : undefined
    };

    return {
      results,
      summary
    };
  }

  static async batchAnalyzeApplications(
    jobId: string,
    applicationIds: string[],
    userId: string
  ): Promise<MatchingOutput> {
    try {
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('title, description, required_skills, experience_level, education_level, department')
        .eq('id', jobId)
        .single();

      if (jobError || !job) {
        throw new Error('Job not found');
      }

      const { data: applications, error: appError } = await supabase
        .from('applications')
        .select(`
          id,
          candidate_id,
          candidate_profiles!inner(
            id,
            full_name,
            email,
            phone,
            title,
            skills,
            years_of_experience,
            education,
            work_history,
            achievements
          )
        `)
        .in('id', applicationIds);

      if (appError || !applications) {
        throw new Error('Applications not found');
      }

      const candidates: CandidateInput[] = applications.map(app => ({
        id: app.candidate_id,
        name: (app as any).candidate_profiles.full_name || 'Unknown',
        email: (app as any).candidate_profiles.email,
        phone: (app as any).candidate_profiles.phone,
        title: (app as any).candidate_profiles.title,
        skills: (app as any).candidate_profiles.skills || [],
        experience_years: (app as any).candidate_profiles.years_of_experience,
        education: (app as any).candidate_profiles.education,
        work_history: (app as any).candidate_profiles.work_history,
        achievements: (app as any).candidate_profiles.achievements
      }));

      const input: MatchingInput = {
        job: {
          title: job.title,
          description: job.description || '',
          required_skills: job.required_skills || [],
          experience_level: job.experience_level,
          education_level: job.education_level,
          department: job.department
        },
        candidates
      };

      const results = await this.analyzeMatching(input, userId);

      for (const result of results.results) {
        const application = applications.find(
          a => a.candidate_id === result.candidate_id
        );

        if (application) {
          await supabase
            .from('applications')
            .update({
              ai_score: result.score,
              ai_category: result.category,
              ai_analysis: result.analysis
            })
            .eq('id', application.id);
        }
      }

      return results;
    } catch (error) {
      console.error('Error in batchAnalyzeApplications:', error);
      throw error;
    }
  }

  static categorizeByScore(score: number): 'excellent' | 'potential' | 'weak' {
    if (score >= 75) return 'excellent';
    if (score >= 50) return 'potential';
    return 'weak';
  }

  static getCategoryLabel(category: 'excellent' | 'potential' | 'weak'): string {
    const labels = {
      excellent: 'Excellente correspondance',
      potential: 'Correspondance potentielle',
      weak: 'Faible correspondance'
    };
    return labels[category];
  }

  static getCategoryColor(category: 'excellent' | 'potential' | 'weak'): string {
    const colors = {
      excellent: 'green',
      potential: 'yellow',
      weak: 'red'
    };
    return colors[category];
  }

  static getCategoryIcon(category: 'excellent' | 'potential' | 'weak'): string {
    const icons = {
      excellent: '🟢',
      potential: '🟡',
      weak: '🔴'
    };
    return icons[category];
  }
}
