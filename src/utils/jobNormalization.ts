import { Job } from '../lib/supabase';

export interface NormalizedJob extends Omit<Job, 'application_deadline' | 'required_skills' | 'view_count'> {
  deadline?: string;
  views_count: number;
  keywords?: string[];
}

export interface JobCompatibilityFields {
  application_deadline?: string;
  required_skills?: string[];
  view_count?: number;
}

export function normalizeJob(job: Job): NormalizedJob {
  const normalized: NormalizedJob = {
    ...job,
    deadline: job.deadline || job.application_deadline,
    views_count: job.views_count || 0,
    keywords: job.keywords || []
  };

  return normalized;
}

export function normalizeJobs(jobs: Job[]): NormalizedJob[] {
  return jobs.map(normalizeJob);
}

export function addCompatibilityFields(job: NormalizedJob): NormalizedJob & JobCompatibilityFields {
  return {
    ...job,
    application_deadline: job.deadline,
    required_skills: job.keywords,
    view_count: job.views_count
  };
}

export function getJobDeadline(job: Job | NormalizedJob): string | undefined {
  return (job as any).deadline || (job as any).application_deadline;
}

export function getJobViewsCount(job: Job | NormalizedJob): number {
  return (job as any).views_count || (job as any).view_count || 0;
}

export function getJobKeywords(job: Job | NormalizedJob): string[] {
  return (job as any).keywords || (job as any).required_skills || [];
}

export function formatJobDeadline(job: Job | NormalizedJob, locale: string = 'fr-FR'): string | null {
  const deadline = getJobDeadline(job);
  if (!deadline) return null;

  try {
    return new Date(deadline).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting deadline:', error);
    return null;
  }
}

export function isJobExpired(job: Job | NormalizedJob): boolean {
  const deadline = getJobDeadline(job);
  if (!deadline) return false;

  try {
    return new Date(deadline) < new Date();
  } catch (error) {
    console.error('Error checking if job is expired:', error);
    return false;
  }
}

export function getJobDisplayData(job: Job | NormalizedJob) {
  return {
    deadline: getJobDeadline(job),
    deadlineFormatted: formatJobDeadline(job),
    isExpired: isJobExpired(job),
    viewsCount: getJobViewsCount(job),
    keywords: getJobKeywords(job),
    applicationsCount: job.applications_count || 0
  };
}

export function createJobPayload(formData: any): Partial<Job> {
  const payload: Partial<Job> = {
    ...formData,
    deadline: formData.deadline || formData.application_deadline,
    keywords: formData.keywords || formData.required_skills || [],
    views_count: formData.views_count || formData.view_count || 0
  };

  delete (payload as any).application_deadline;
  delete (payload as any).required_skills;
  delete (payload as any).view_count;

  return payload;
}

export const JobFieldAliases = {
  deadline: ['deadline', 'application_deadline'],
  views_count: ['views_count', 'view_count', 'viewsCount', 'viewCount'],
  keywords: ['keywords', 'required_skills', 'requiredSkills'],
  applications_count: ['applications_count', 'applicationsCount']
} as const;

export function resolveField<T = any>(
  obj: any,
  aliases: string[]
): T | undefined {
  for (const alias of aliases) {
    if (obj[alias] !== undefined) {
      return obj[alias];
    }
  }
  return undefined;
}

export function normalizeJobQuery(query: any): any {
  if (!query) return query;

  const normalized = { ...query };

  if ('application_deadline' in normalized) {
    normalized.deadline = normalized.application_deadline;
    delete normalized.application_deadline;
  }

  if ('required_skills' in normalized) {
    normalized.keywords = normalized.required_skills;
    delete normalized.required_skills;
  }

  if ('view_count' in normalized) {
    normalized.views_count = normalized.view_count;
    delete normalized.view_count;
  }

  return normalized;
}
