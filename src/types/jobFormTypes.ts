export interface LanguageRequirement {
  language: string;
  level: string;
}

export interface JobFormData {
  title: string;
  category: string;
  contract_type: string;
  position_count: number;
  position_level: string;
  deadline: string;
  description: string;
  responsibilities: string;
  profile: string;
  skills: string[];
  education_level: string;
  experience_required: string;
  languages: string[];
  language_requirements: LanguageRequirement[];
  company_name: string;
  company_logo?: File;
  company_logo_url?: string;
  use_profile_logo: boolean;
  sector: string;
  location: string;
  company_description: string;
  website?: string;
  salary_range: string;
  salary_type: string;
  benefits: string[];
  application_email: string;
  receive_in_platform: boolean;
  required_documents: string[];
  application_instructions: string;
  visibility: string;
  is_premium: boolean;
  announcement_language: string;
  auto_share: boolean;
  publication_duration: string;
  auto_renewal: boolean;
  auto_renewal_pending_admin: boolean;
  legal_compliance: boolean;
}
