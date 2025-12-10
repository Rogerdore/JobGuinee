import { supabase } from '../lib/supabase';

export interface InterviewSimulation {
  id: string;
  user_id: string;
  title: string;
  job_description: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  question_count: number;
  status: 'in_progress' | 'completed';
  started_at: string;
  completed_at: string | null;
  score: number | null;
  feedback: Array<{
    question_index: number;
    feedback: string;
    score: number;
  }>;
  questions_responses: Array<{
    question: string;
    user_answer: string;
    ai_evaluation: string;
    score: number;
  }>;
  created_at: string;
  updated_at: string;
}

export interface InterviewQuestion {
  id: number;
  question: string;
  category: string;
}

export const interviewSimulatorService = {
  async createSimulation(
    title: string,
    jobDescription: string,
    difficultyLevel: 'easy' | 'medium' | 'hard',
    questionCount: number
  ): Promise<InterviewSimulation> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('interview_simulations')
      .insert({
        user_id: user.id,
        title,
        job_description: jobDescription,
        difficulty_level: difficultyLevel,
        question_count: questionCount,
        status: 'in_progress',
        questions_responses: [],
        feedback: [],
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getSimulations(): Promise<InterviewSimulation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('interview_simulations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getSimulation(id: string): Promise<InterviewSimulation> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('interview_simulations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  },

  async updateSimulation(
    id: string,
    updates: {
      questions_responses?: Array<{
        question: string;
        user_answer: string;
        ai_evaluation: string;
        score: number;
      }>;
      status?: 'in_progress' | 'completed';
      score?: number;
      feedback?: Array<{
        question_index: number;
        feedback: string;
        score: number;
      }>;
    }
  ): Promise<InterviewSimulation> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (updates.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('interview_simulations')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSimulation(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('interview_simulations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  generateInterviewQuestions(jobDescription: string, count: number): InterviewQuestion[] {
    const questionTemplates = [
      {
        category: 'experience',
        templates: [
          `Tell me about your experience in ${jobDescription}`,
          `What relevant experience do you have for this ${jobDescription} role?`,
          `Describe a project where you applied skills relevant to ${jobDescription}`,
        ],
      },
      {
        category: 'skills',
        templates: [
          'What are your key strengths for this position?',
          'Which skills from the job description do you possess?',
          'How would you rate your proficiency in the required skills?',
        ],
      },
      {
        category: 'motivation',
        templates: [
          'Why are you interested in this position?',
          'What attracts you to our company and this role?',
          'How do your career goals align with this position?',
        ],
      },
      {
        category: 'problem_solving',
        templates: [
          'Describe a challenging problem you solved related to this field',
          'How do you approach learning new technologies?',
          'Give an example of how you handle difficult situations at work',
        ],
      },
      {
        category: 'teamwork',
        templates: [
          'Tell me about your experience working in teams',
          'How do you handle conflicts with colleagues?',
          'Describe a time you collaborated to achieve a goal',
        ],
      },
    ];

    const questions: InterviewQuestion[] = [];
    const categoryCount = Math.ceil(count / 5);

    questionTemplates.forEach((category, categoryIndex) => {
      const questionsToAdd = Math.min(categoryCount, category.templates.length);
      for (let i = 0; i < questionsToAdd && questions.length < count; i++) {
        questions.push({
          id: questions.length + 1,
          question: category.templates[i],
          category: category.category,
        });
      }
    });

    return questions.slice(0, count);
  },
};
