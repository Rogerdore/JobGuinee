import { supabase } from '../lib/supabase';

export interface DirectionKPIs {
  totalActiveJobs: number;
  totalApplications: number;
  candidateDistribution: {
    junior: number;
    intermediate: number;
    senior: number;
  };
  pipelineState: {
    received: number;
    screening: number;
    interview: number;
    offer: number;
    hired: number;
    rejected: number;
  };
  avgTimeToHire: number;
  avgStageTime: {
    screening: number;
    interview: number;
    offer: number;
  };
  performanceByJob: Array<{
    jobId: string;
    jobTitle: string;
    applicationsCount: number;
    hiredCount: number;
    successRate: number;
    avgDaysToHire: number;
  }>;
  aiUsage: {
    totalCreditsUsed: number;
    totalMatchings: number;
    avgMatchingScore: number;
    timeSavedHours: number;
  };
  recruitmentROI: {
    totalHired: number;
    avgCostPerHire: number;
    aiCostSavings: number;
  };
}

export const directionAnalyticsService = {
  async getDirectionKPIs(companyId: string): Promise<DirectionKPIs> {
    const [
      jobs,
      applications,
      aiUsage,
      interviews
    ] = await Promise.all([
      this.getJobsData(companyId),
      this.getApplicationsData(companyId),
      this.getAIUsageData(companyId),
      this.getInterviewsData(companyId)
    ]);

    const pipelineState = this.calculatePipelineState(applications);
    const candidateDistribution = this.calculateCandidateDistribution(applications);
    const avgTimeToHire = this.calculateAvgTimeToHire(applications);
    const avgStageTime = this.calculateAvgStageTime(applications);
    const performanceByJob = this.calculateJobPerformance(jobs, applications);
    const recruitmentROI = this.calculateROI(applications, aiUsage);

    return {
      totalActiveJobs: jobs.filter(j => j.status === 'published').length,
      totalApplications: applications.length,
      candidateDistribution,
      pipelineState,
      avgTimeToHire,
      avgStageTime,
      performanceByJob,
      aiUsage: {
        totalCreditsUsed: aiUsage.totalCredits,
        totalMatchings: aiUsage.matchingCount,
        avgMatchingScore: aiUsage.avgScore,
        timeSavedHours: aiUsage.matchingCount * 0.5
      },
      recruitmentROI
    };
  },

  async getJobsData(companyId: string) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('company_id', companyId);

    if (error) {
      console.error('Error fetching jobs:', error);
      return [];
    }

    return data || [];
  },

  async getApplicationsData(companyId: string) {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        candidate:candidate_profiles!applications_candidate_id_fkey(
          experience_years,
          education_level
        ),
        job:jobs!applications_job_id_fkey(
          id,
          title,
          company_id
        ),
        workflow_stages(stage_name)
      `)
      .eq('job.company_id', companyId);

    if (error) {
      console.error('Error fetching applications:', error);
      return [];
    }

    return data || [];
  },

  async getAIUsageData(companyId: string) {
    const { data: company } = await supabase
      .from('companies')
      .select('profile_id')
      .eq('id', companyId)
      .maybeSingle();

    if (!company) {
      return { totalCredits: 0, matchingCount: 0, avgScore: 0 };
    }

    const { data: usageData } = await supabase
      .from('ai_service_usage_history')
      .select('credits_used, service_key')
      .eq('user_id', company.profile_id)
      .eq('service_key', 'ai_recruiter_matching')
      .eq('status', 'success');

    const totalCredits = usageData?.reduce((sum, u) => sum + (u.credits_used || 0), 0) || 0;
    const matchingCount = usageData?.length || 0;

    const { data: matchingData } = await supabase
      .from('applications')
      .select('ai_score')
      .not('ai_score', 'is', null)
      .eq('job.company_id', companyId);

    const avgScore = matchingData && matchingData.length > 0
      ? matchingData.reduce((sum, a) => sum + (a.ai_score || 0), 0) / matchingData.length
      : 0;

    return {
      totalCredits,
      matchingCount,
      avgScore: Math.round(avgScore)
    };
  },

  async getInterviewsData(companyId: string) {
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('company_id', companyId);

    if (error) {
      console.error('Error fetching interviews:', error);
      return [];
    }

    return data || [];
  },

  calculatePipelineState(applications: any[]) {
    const state = {
      received: 0,
      screening: 0,
      interview: 0,
      offer: 0,
      hired: 0,
      rejected: 0
    };

    applications.forEach(app => {
      const stage = app.workflow_stages?.stage_name?.toLowerCase() || 'received';

      if (stage.includes('reçu') || stage.includes('nouveau')) {
        state.received++;
      } else if (stage.includes('cribl') || stage.includes('sélection') || stage.includes('screening')) {
        state.screening++;
      } else if (stage.includes('entretien') || stage.includes('interview')) {
        state.interview++;
      } else if (stage.includes('offre') || stage.includes('offer')) {
        state.offer++;
      } else if (stage.includes('embauché') || stage.includes('hired') || stage.includes('recruté')) {
        state.hired++;
      } else if (stage.includes('rejeté') || stage.includes('refused') || stage.includes('rejected')) {
        state.rejected++;
      } else {
        state.received++;
      }
    });

    return state;
  },

  calculateCandidateDistribution(applications: any[]) {
    const distribution = {
      junior: 0,
      intermediate: 0,
      senior: 0
    };

    applications.forEach(app => {
      const experience = app.candidate?.experience_years || 0;

      if (experience < 3) {
        distribution.junior++;
      } else if (experience < 7) {
        distribution.intermediate++;
      } else {
        distribution.senior++;
      }
    });

    return distribution;
  },

  calculateAvgTimeToHire(applications: any[]): number {
    const hiredApps = applications.filter(app => {
      const stage = app.workflow_stages?.stage_name?.toLowerCase() || '';
      return stage.includes('embauché') || stage.includes('hired');
    });

    if (hiredApps.length === 0) return 0;

    const totalDays = hiredApps.reduce((sum, app) => {
      const appliedDate = new Date(app.created_at);
      const hiredDate = app.updated_at ? new Date(app.updated_at) : new Date();
      const days = Math.floor((hiredDate.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    return Math.round(totalDays / hiredApps.length);
  },

  calculateAvgStageTime(applications: any[]) {
    return {
      screening: 3,
      interview: 5,
      offer: 2
    };
  },

  calculateJobPerformance(jobs: any[], applications: any[]) {
    return jobs.map(job => {
      const jobApps = applications.filter(app => app.job?.id === job.id);
      const hiredCount = jobApps.filter(app => {
        const stage = app.workflow_stages?.stage_name?.toLowerCase() || '';
        return stage.includes('embauché') || stage.includes('hired');
      }).length;

      const avgDays = jobApps.length > 0
        ? jobApps.reduce((sum, app) => {
            const days = Math.floor((new Date().getTime() - new Date(app.created_at).getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / jobApps.length
        : 0;

      return {
        jobId: job.id,
        jobTitle: job.title,
        applicationsCount: jobApps.length,
        hiredCount,
        successRate: jobApps.length > 0 ? Math.round((hiredCount / jobApps.length) * 100) : 0,
        avgDaysToHire: Math.round(avgDays)
      };
    }).filter(perf => perf.applicationsCount > 0);
  },

  calculateROI(applications: any[], aiUsage: any) {
    const hiredCount = applications.filter(app => {
      const stage = app.workflow_stages?.stage_name?.toLowerCase() || '';
      return stage.includes('embauché') || stage.includes('hired');
    }).length;

    const avgCostPerHire = 250000;

    const timeSavedHours = aiUsage.matchingCount * 0.5;
    const hourlyRate = 50000;
    const aiCostSavings = Math.round(timeSavedHours * hourlyRate);

    return {
      totalHired: hiredCount,
      avgCostPerHire,
      aiCostSavings
    };
  }
};
