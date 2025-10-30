import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'candidate' | 'recruiter' | 'admin';

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
};

export type CandidateProfile = {
  id: string;
  user_id: string;
  cv_url?: string;
  skills: string[];
  experience_years: number;
  education_level?: string;
  location?: string;
  availability: string;
  desired_position?: string;
  desired_salary_min?: number;
  desired_salary_max?: number;
};

export type Company = {
  id: string;
  user_id: string;
  company_name: string;
  logo_url?: string;
  description?: string;
  sector?: string;
  website?: string;
  location?: string;
  size?: string;
};

export type Job = {
  id: string;
  company_id: string;
  title: string;
  description: string;
  requirements?: string;
  location?: string;
  contract_type?: string;
  sector?: string;
  salary_min?: number;
  salary_max?: number;
  status: 'draft' | 'pending' | 'published' | 'expired' | 'closed';
  expires_at?: string;
  is_featured: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
  companies?: Company;
};

export type Application = {
  id: string;
  job_id: string;
  candidate_id: string;
  cv_url?: string;
  cover_letter?: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'accepted';
  ai_match_score?: number;
  recruiter_notes?: string;
  created_at: string;
  updated_at: string;
  jobs?: Job;
  profiles?: Profile;
};

export type Formation = {
  id: string;
  title: string;
  description?: string;
  price: number;
  duration?: string;
  instructor?: string;
  category?: string;
  thumbnail_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
};
