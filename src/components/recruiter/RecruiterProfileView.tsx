import { useEffect, useState } from 'react';
import {
  Building2,
  MapPin,
  Users,
  Globe,
  Phone,
  Mail,
  Briefcase,
  User,
  Calendar,
  Award,
  Sparkles,
  Edit,
  Linkedin,
  Facebook,
  Twitter,
  Instagram
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import CompanyLogo from '../common/CompanyLogo';

interface RecruiterProfile {
  id: string;
  job_title: string | null;
  bio: string | null;
  linkedin_url: string | null;
  company_id: string | null;
}

interface Company {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  employee_count: string | null;
  founded_year: number | null;
  benefits: string[] | null;
  culture_description: string | null;
  social_media: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  } | null;
  subscription_tier: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
}

interface RecruiterProfileViewProps {
  onEdit: () => void;
}

export default function RecruiterProfileView({ onEdit }: RecruiterProfileViewProps) {
  const { profile } = useAuth();
  const [recruiterProfile, setRecruiterProfile] = useState<RecruiterProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, [profile]);

  async function loadProfileData() {
    if (!profile?.id) return;

    try {
      setLoading(true);

      const { data: recruiterData, error: recruiterError } = await supabase
        .from('recruiter_profiles')
        .select('id, job_title, bio, linkedin_url, company_id')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (recruiterError) throw recruiterError;

      setRecruiterProfile(recruiterData);

      const companyId = recruiterData?.company_id || profile.company_id;

      if (companyId) {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .maybeSingle();

        if (companyError) throw companyError;
        setCompany(companyData);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!recruiterProfile) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <User className="w-20 h-20 text-gray-300 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Aucun profil trouvé
          </h3>
          <p className="text-gray-600 mb-6">
            Commencez par créer votre profil recruteur pour accéder à toutes les fonctionnalités
          </p>
          <button
            onClick={onEdit}
            className="px-8 py-3 bg-gradient-to-r from-[#0E2F56] to-[#1a4275] text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300"
          >
            Créer mon profil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Mon Profil Recruteur</h2>
          <p className="text-gray-600">Consultez et gérez vos informations professionnelles</p>
        </div>
        <button
          onClick={onEdit}
          className="px-6 py-3 bg-gradient-to-r from-[#FF8C00] to-orange-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 flex items-center gap-2"
        >
          <Edit className="w-5 h-5" />
          Modifier le profil
        </button>
      </div>

      {company && (
        <div className="bg-gradient-to-br from-[#0E2F56] via-blue-800 to-[#1a4275] rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF8C00] opacity-10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400 opacity-10 rounded-full -ml-24 -mb-24"></div>

          <div className="relative z-10">
            <div className="flex items-start gap-6 mb-6">
              <CompanyLogo
                logoUrl={company.logo_url}
                companyName={company.name}
                size="xl"
                className="bg-white shadow-lg"
              />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-3xl font-bold">{company.name}</h3>
                  {(company.subscription_tier === 'premium' || company.subscription_tier === 'enterprise') && (
                    <span className="px-3 py-1 bg-gradient-to-r from-[#FF8C00] to-orange-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {company.subscription_tier === 'enterprise' ? 'ENTERPRISE' : 'PREMIUM'}
                    </span>
                  )}
                </div>
                {company.industry && (
                  <p className="text-blue-200 font-medium mb-2">{company.industry}</p>
                )}
                {company.description && (
                  <p className="text-blue-100 leading-relaxed">{company.description}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {company.website && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 text-blue-200 mb-1">
                    <Globe className="w-4 h-4" />
                    <span className="text-xs font-medium">Site web</span>
                  </div>
                  <a
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white font-semibold hover:text-[#FF8C00] transition-colors text-sm truncate block"
                  >
                    {company.website.replace(/^https?:\/\//i, '')}
                  </a>
                </div>
              )}

              {company.size && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 text-blue-200 mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-medium">Taille</span>
                  </div>
                  <p className="text-white font-semibold text-sm">{company.size}</p>
                </div>
              )}

              {company.location && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 text-blue-200 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs font-medium">Localisation</span>
                  </div>
                  <p className="text-white font-semibold text-sm">{company.location}</p>
                </div>
              )}

              {company.founded_year && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 text-blue-200 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-medium">Fondée en</span>
                  </div>
                  <p className="text-white font-semibold text-sm">{company.founded_year}</p>
                </div>
              )}

              {company.employee_count && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 text-blue-200 mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-medium">Employés</span>
                  </div>
                  <p className="text-white font-semibold text-sm">{company.employee_count}</p>
                </div>
              )}

              {company.phone && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 text-blue-200 mb-1">
                    <Phone className="w-4 h-4" />
                    <span className="text-xs font-medium">Téléphone</span>
                  </div>
                  <p className="text-white font-semibold text-sm">{company.phone}</p>
                </div>
              )}

              {company.email && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 text-blue-200 mb-1">
                    <Mail className="w-4 h-4" />
                    <span className="text-xs font-medium">Email</span>
                  </div>
                  <p className="text-white font-semibold text-sm truncate">{company.email}</p>
                </div>
              )}

              {company.address && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-2 text-blue-200 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs font-medium">Adresse</span>
                  </div>
                  <p className="text-white font-semibold text-sm">{company.address}</p>
                </div>
              )}
            </div>

            {company.culture_description && (
              <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 text-blue-200 mb-3">
                  <Building2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Culture d'entreprise</span>
                </div>
                <p className="text-white text-sm leading-relaxed whitespace-pre-line">{company.culture_description}</p>
              </div>
            )}

            {company.benefits && company.benefits.length > 0 && (
              <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 text-blue-200 mb-3">
                  <Award className="w-4 h-4" />
                  <span className="text-sm font-medium">Avantages proposés</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {company.benefits.map((benefit, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-white/20 text-white text-xs font-medium rounded-full"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {company.social_media && Object.values(company.social_media).some(val => val) && (
              <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 text-blue-200 mb-3">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium">Réseaux sociaux</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {company.social_media.facebook && (
                    <a
                      href={company.social_media.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all"
                    >
                      <Facebook className="w-4 h-4" />
                      <span className="text-sm font-medium">Facebook</span>
                    </a>
                  )}
                  {company.social_media.twitter && (
                    <a
                      href={company.social_media.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all"
                    >
                      <Twitter className="w-4 h-4" />
                      <span className="text-sm font-medium">Twitter</span>
                    </a>
                  )}
                  {company.social_media.linkedin && (
                    <a
                      href={company.social_media.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all"
                    >
                      <Linkedin className="w-4 h-4" />
                      <span className="text-sm font-medium">LinkedIn</span>
                    </a>
                  )}
                  {company.social_media.instagram && (
                    <a
                      href={company.social_media.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all"
                    >
                      <Instagram className="w-4 h-4" />
                      <span className="text-sm font-medium">Instagram</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-100">
              <div className="p-3 bg-blue-100 rounded-xl">
                <User className="w-6 h-6 text-[#0E2F56]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Informations Personnelles</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <User className="w-5 h-5 text-[#0E2F56] mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Nom complet</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {profile?.full_name || 'Non renseigné'}
                  </p>
                </div>
              </div>

              {recruiterProfile.job_title && (
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <Briefcase className="w-5 h-5 text-[#0E2F56] mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Poste / Fonction</p>
                    <p className="text-lg font-semibold text-gray-900">{recruiterProfile.job_title}</p>
                  </div>
                </div>
              )}

              {recruiterProfile.bio && (
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-800 font-medium mb-2">Biographie professionnelle</p>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{recruiterProfile.bio}</p>
                </div>
              )}
            </div>
          </div>

        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-100">
              <div className="p-3 bg-green-100 rounded-xl">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Contact</h3>
            </div>

            <div className="space-y-4">
              {profile?.phone && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Phone className="w-5 h-5 text-[#0E2F56]" />
                  <div>
                    <p className="text-xs text-gray-600 mb-0.5">Téléphone</p>
                    <p className="font-semibold text-gray-900">{profile.phone}</p>
                  </div>
                </div>
              )}

              {profile?.email && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Mail className="w-5 h-5 text-[#0E2F56]" />
                  <div>
                    <p className="text-xs text-gray-600 mb-0.5">Email</p>
                    <p className="font-semibold text-gray-900">{profile.email}</p>
                  </div>
                </div>
              )}

              {recruiterProfile.linkedin_url && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                  <Linkedin className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-xs text-blue-700 mb-0.5">LinkedIn</p>
                    <a
                      href={recruiterProfile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-600 hover:text-blue-800 transition-colors text-sm truncate block"
                    >
                      Voir le profil
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
