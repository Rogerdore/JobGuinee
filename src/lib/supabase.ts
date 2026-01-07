import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  // Ne pas crasher l'application, créer un client avec des valeurs par défaut
  // L'utilisateur verra l'erreur dans la console et l'overlay du validateur
  if (import.meta.env.MODE === 'development') {
    throw new Error('Missing Supabase environment variables');
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export type UserRole = 'candidate' | 'recruiter' | 'admin' | 'trainer';

export type Profile = {
  id: string;
  user_type: UserRole;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  professional_email?: string;
  phone?: string;
  avatar_url?: string;
  birth_date?: string;
  gender?: string;
  address?: string;
  region?: string;
  credits_balance?: number;
  company_id?: string;
  company_name?: string;
  profile_visibility?: string;
  job_title?: string;
  bio?: string;
  linkedin_url?: string;
  profile_completed?: boolean;
  profile_completion_percentage?: number;
  created_at: string;
  updated_at: string;
};

export type CandidateProfile = {
  id: string;
  profile_id: string;
  title?: string;
  bio?: string;
  cv_url?: string;
  skills: string[];
  experience_years: number;
  education_level?: string;
  education?: any;
  work_experience?: any;
  location?: string;
  availability: string;
  desired_position?: string;
  desired_salary_min?: number;
  desired_salary_max?: number;
  languages?: string[];
  certifications?: any;
  preferred_contract_type?: string;
  mobility?: string;
  is_verified?: boolean;
  visibility?: string;
  last_active_at?: string;
  nationality?: string;
};

export type Company = {
  id: string;
  profile_id: string;
  name: string;
  logo_url?: string;
  description?: string;
  industry?: string;
  website?: string;
  location?: string;
  address?: string;
  size?: string;
  company_type?: string;
  origin_country?: string;
  phone?: string;
  email?: string;
  employee_count?: string;
  founded_year?: number;
  culture_description?: string;
  benefits?: string[];
  social_media?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  created_at?: string;
  updated_at?: string;
};

export type Job = {
  id: string;
  user_id: string;
  company_id?: string;
  title: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  location?: string;
  contract_type?: string;
  sector?: string;
  category?: string;
  experience_level?: string;
  education_level?: string;
  diploma_required?: string;
  salary_min?: number;
  salary_max?: number;
  salary_range?: string;
  salary_type?: string;
  status: 'draft' | 'pending' | 'published' | 'expired' | 'closed' | 'rejected';
  deadline?: string;
  application_deadline?: string;
  is_featured: boolean;
  is_urgent: boolean;
  views_count: number;
  applications_count: number;
  saves_count?: number;
  nationality_required?: string;
  languages?: string[];
  keywords?: string[];
  department?: string;
  position_count?: number;
  position_level?: string;
  profile_sought?: string;
  cover_letter_required?: boolean;
  application_email?: string;
  receive_in_platform?: boolean;
  required_documents?: string[];
  application_instructions?: string;
  visibility?: string;
  is_premium?: boolean;
  announcement_language?: string;
  auto_share?: boolean;
  publication_duration?: string;
  auto_renewal?: boolean;
  legal_compliance?: boolean;
  ai_generated?: boolean;
  hiring_manager_id?: string;
  company_logo_url?: string;
  featured_image_url?: string;
  company_description?: string;
  company_website?: string;
  submitted_at?: string;
  moderated_at?: string;
  moderated_by?: string;
  rejection_reason?: string;
  moderation_notes?: string;
  published_by_admin?: boolean;
  admin_publisher_id?: string;
  publication_source?: string;
  partner_id?: string;
  partner_type?: string;
  partner_name?: string;
  partner_email?: string;
  partner_logo_url?: string;
  application_mode?: string;
  external_apply_url?: string;
  admin_notes?: string;
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
  trainer_id?: string;
  trainer_phone?: string;
  trainer_contact_name?: string;
  trainer_email?: string;
  created_at: string;
  updated_at: string;
};

export type JobView = {
  id: string;
  user_id: string;
  job_id: string;
  viewed_at: string;
};

export type FormationEnrollment = {
  id: string;
  user_id: string;
  formation_id: string;
  status: 'enrolled' | 'in_progress' | 'completed' | 'cancelled';
  progress: number;
  enrolled_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
};

export type TrainerProfile = {
  id: string;
  profile_id: string;
  user_id: string;
  organization_name?: string;
  organization_type: 'individual' | 'company' | 'institute';
  bio?: string;
  specializations: string[];
  certifications?: any;
  experience_years: number;
  website?: string;
  linkedin_url?: string;
  hourly_rate?: number;
  is_verified: boolean;
  rating: number;
  total_students: number;
  individual_phone?: string;
  individual_address?: string;
  individual_skills?: string[];
  company_name?: string;
  company_registration_number?: string;
  company_contact_person?: string;
  company_contact_position?: string;
  company_email?: string;
  company_phone?: string;
  company_address?: string;
  company_city?: string;
  company_country?: string;
  company_sector?: string;
  company_size?: string;
  company_description?: string;
  institute_name?: string;
  institute_registration_number?: string;
  institute_contact_person?: string;
  institute_contact_position?: string;
  institute_email?: string;
  institute_phone?: string;
  institute_address?: string;
  institute_city?: string;
  institute_country?: string;
  institute_type?: string;
  institute_accreditation?: any;
  institute_description?: string;
  created_at: string;
  updated_at: string;
};

export type RecruiterProfile = {
  id: string;
  profile_id: string;
  user_id: string;
  job_title?: string;
  bio?: string;
  linkedin_url?: string;
  company_id?: string;
  recruitment_role?: string;
  created_at: string;
  updated_at: string;
};
