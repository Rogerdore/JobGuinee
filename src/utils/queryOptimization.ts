export const QUERY_LIMITS = {
  DEFAULT_PAGE_SIZE: 20,
  SMALL_LIST: 10,
  MEDIUM_LIST: 30,
  LARGE_LIST: 50,
  MAX_FETCH: 100,
};

export const COMMON_SELECTS = {
  JOB_LIST: `
    id,
    title,
    company_name,
    location,
    employment_type,
    salary_range,
    created_at,
    deadline,
    is_urgent,
    is_featured,
    badge_type,
    company_logo_url
  `,

  JOB_DETAIL: `
    *,
    recruiter_profiles(
      id,
      company_name,
      company_logo_url
    )
  `,

  CANDIDATE_PROFILE_MINI: `
    id,
    full_name,
    job_title,
    location,
    profile_photo_url,
    years_of_experience,
    is_premium
  `,

  CANDIDATE_PROFILE_FULL: `
    *
  `,

  APPLICATION_LIST: `
    id,
    status,
    created_at,
    job_id,
    jobs(
      id,
      title,
      company_name,
      company_logo_url
    )
  `,

  NOTIFICATION_LIST: `
    id,
    title,
    message,
    type,
    is_read,
    created_at,
    metadata
  `,
};

export const queryWithPagination = (
  page: number = 1,
  pageSize: number = QUERY_LIMITS.DEFAULT_PAGE_SIZE
) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
};

export const enableCacheHeaders = () => ({
  headers: {
    'cache-control': 'max-age=300, stale-while-revalidate=600',
  },
});

export const optimizeQuery = {
  withoutRelations: (query: any) => query,

  withMinimalJoins: (query: any, select: string) =>
    query.select(select),

  withPagination: (query: any, page: number, pageSize: number) => {
    const { from, to } = queryWithPagination(page, pageSize);
    return query.range(from, to);
  },

  withSorting: (query: any, column: string, ascending: boolean = false) =>
    query.order(column, { ascending }),

  withFilters: (query: any, filters: Record<string, any>) => {
    let filtered = query;
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        filtered = filtered.eq(key, value);
      }
    });
    return filtered;
  },
};

export const batchRequests = async <T>(
  requests: Array<() => Promise<T>>,
  batchSize: number = 3
): Promise<T[]> => {
  const results: T[] = [];

  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(req => req()));
    results.push(...batchResults);
  }

  return results;
};

export const debounceQuery = (func: Function, delay: number = 300) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    return new Promise((resolve) => {
      timeoutId = setTimeout(async () => {
        resolve(await func(...args));
      }, delay);
    });
  };
};
