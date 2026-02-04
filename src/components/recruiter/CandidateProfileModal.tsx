import { useState, useEffect } from 'react';
import {
  X, Mail, Phone, Calendar, Briefcase, GraduationCap, MapPin, Download,
  TrendingUp, FileText, Award, Link as LinkIcon, Globe, Github, Linkedin,
  DollarSign, Car, Languages, Target, Building, Clock
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CandidateProfileModalProps {
  applicationId: string;
  onClose: () => void;
}

interface CandidateData {
  id: string;
  candidate: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
  };
  candidate_profile: {
    title?: string;
    experience_years?: number;
    education_level?: string;
    skills?: string[];
    professional_summary?: string;
    location?: string;
    desired_salary_min?: number;
    desired_salary_max?: number;
    desired_position?: string;
    desired_sectors?: string[];
    mobility?: string[];
    availability?: string;
    languages?: any;
    driving_license?: string[];
    linkedin_url?: string;
    portfolio_url?: string;
    github_url?: string;
    other_urls?: any;
    nationality?: string;
    cv_parsed_at?: string;
    cover_letter_url?: string;
    certificates_url?: string;
    profile_completion_percentage?: number;
  };
  job: {
    title: string;
  };
  ai_score: number;
  ai_category: string;
  applied_at: string;
  cover_letter?: string;
  cv_url?: string;
}

export default function CandidateProfileModal({ applicationId, onClose }: CandidateProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState<CandidateData | null>(null);

  useEffect(() => {
    loadCandidateData();
  }, [applicationId]);

  const loadCandidateData = async () => {
    setLoading(true);

    try {
      const { data: applicationData, error: appError } = await supabase
        .from('applications')
        .select(`
          id,
          ai_score,
          ai_category,
          applied_at,
          cover_letter,
          cv_url,
          candidate_id,
          job:jobs(title)
        `)
        .eq('id', applicationId)
        .single();

      if (appError) {
        console.error('Error loading application:', appError);
        setLoading(false);
        return;
      }

      if (!applicationData) {
        console.error('Application not found');
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          phone,
          avatar_url
        `)
        .eq('id', applicationData.candidate_id)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        setLoading(false);
        return;
      }

      const { data: candidateProfile } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('profile_id', applicationData.candidate_id)
        .maybeSingle();

      setCandidate({
        id: applicationData.id,
        candidate: {
          id: profileData.id,
          full_name: profileData.full_name || 'Candidat',
          email: profileData.email,
          phone: profileData.phone,
          avatar_url: profileData.avatar_url,
        },
        candidate_profile: {
          title: candidateProfile?.title,
          experience_years: candidateProfile?.experience_years,
          education_level: candidateProfile?.education_level,
          skills: candidateProfile?.skills,
          professional_summary: candidateProfile?.professional_summary,
          location: candidateProfile?.location,
          desired_salary_min: candidateProfile?.desired_salary_min,
          desired_salary_max: candidateProfile?.desired_salary_max,
          desired_position: candidateProfile?.desired_position,
          desired_sectors: candidateProfile?.desired_sectors,
          mobility: candidateProfile?.mobility,
          availability: candidateProfile?.availability,
          languages: candidateProfile?.languages,
          driving_license: candidateProfile?.driving_license,
          linkedin_url: candidateProfile?.linkedin_url,
          portfolio_url: candidateProfile?.portfolio_url,
          github_url: candidateProfile?.github_url,
          other_urls: candidateProfile?.other_urls,
          nationality: candidateProfile?.nationality,
          cv_parsed_at: candidateProfile?.cv_parsed_at,
          cover_letter_url: candidateProfile?.cover_letter_url,
          certificates_url: candidateProfile?.certificates_url,
          profile_completion_percentage: candidateProfile?.profile_completion_percentage,
        },
        job: applicationData.job,
        ai_score: applicationData.ai_score || 0,
        ai_category: applicationData.ai_category || 'medium',
        applied_at: applicationData.applied_at,
        cover_letter: applicationData.cover_letter,
        cv_url: applicationData.cv_url,
      });
    } catch (error) {
      console.error('Unexpected error:', error);
    }

    setLoading(false);
  };

  const getCategoryBadge = (category: string) => {
    const badges = {
      strong: { bg: 'bg-green-100', text: 'text-green-800', label: 'Profil Fort' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Profil Moyen' },
      weak: { bg: 'bg-red-100', text: 'text-red-800', label: 'Profil Faible' },
    };
    return badges[category as keyof typeof badges] || badges.medium;
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Non spécifié';
    if (min && max) {
      return `${new Intl.NumberFormat('fr-GN').format(min)} - ${new Intl.NumberFormat('fr-GN').format(max)} GNF`;
    }
    if (min) return `À partir de ${new Intl.NumberFormat('fr-GN').format(min)} GNF`;
    if (max) return `Jusqu'à ${new Intl.NumberFormat('fr-GN').format(max)} GNF`;
    return 'Non spécifié';
  };

  const getAvailabilityLabel = (availability?: string) => {
    const labels: Record<string, string> = {
      immediate: 'Immédiate',
      '1_month': 'Sous 1 mois',
      '3_months': 'Sous 3 mois',
      negotiable: 'Négociable',
    };
    return labels[availability || ''] || availability || 'Non spécifié';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Profil introuvable</h3>
            <p className="text-gray-600">Impossible de charger les informations du candidat.</p>
          </div>
          <button
            onClick={onClose}
            className="mt-4 px-6 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-lg font-semibold transition-colors w-full"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  const badge = getCategoryBadge(candidate.ai_category);

  const documents = [
    { label: 'CV', url: candidate.cv_url, icon: FileText },
    { label: 'Lettre de motivation', url: candidate.candidate_profile.cover_letter_url, icon: FileText },
    { label: 'Certificats / Attestations', url: candidate.candidate_profile.certificates_url, icon: Award },
  ].filter(doc => doc.url);

  const links = [
    { label: 'LinkedIn', url: candidate.candidate_profile.linkedin_url, icon: Linkedin },
    { label: 'Portfolio', url: candidate.candidate_profile.portfolio_url, icon: Globe },
    { label: 'GitHub', url: candidate.candidate_profile.github_url, icon: Github },
  ].filter(link => link.url);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full my-8 shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-blue-700 to-blue-600 text-white p-6 rounded-t-2xl flex items-center justify-between z-10 shadow-md">
          <h2 className="text-2xl font-bold">Profil Complet du Candidat</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 bg-gradient-to-br from-white to-gray-50">
          {/* En-tête du profil */}
          <div className="flex items-start gap-6 mb-8 pb-6 border-b-2 border-gray-200">
            <div className="flex-shrink-0">
              {candidate.candidate.avatar_url ? (
                <img
                  src={candidate.candidate.avatar_url}
                  alt={candidate.candidate.full_name}
                  className="w-28 h-28 rounded-full object-cover border-4 border-blue-100 shadow-lg"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center border-4 border-blue-200 shadow-lg">
                  <span className="text-4xl font-bold text-white">
                    {candidate.candidate.full_name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-3xl font-bold text-gray-900 mb-1">
                {candidate.candidate.full_name}
              </h3>
              {candidate.candidate_profile.title && (
                <p className="text-lg text-gray-600 mb-3">{candidate.candidate_profile.title}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">{candidate.candidate.email}</span>
                </div>
                {candidate.candidate.phone && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">{candidate.candidate.phone}</span>
                  </div>
                )}
                {candidate.candidate_profile.location && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">{candidate.candidate_profile.location}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-blue-300 rounded-lg shadow-sm">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-900">
                    {candidate.candidate_profile.profile_completion_percentage ?? 0}%
                  </span>
                </div>
                <span className={`px-4 py-2 rounded-lg font-semibold ${badge.bg} ${badge.text}`}>
                  {badge.label}
                </span>
              </div>
            </div>
          </div>

          {/* Documents à télécharger */}
          <div className="mb-8 bg-gray-50 border border-gray-200 rounded-xl p-6">
            <h4 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
              <Download className="w-6 h-6 text-blue-600" />
              Documents disponibles
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {documents.map((doc, idx) => (
                <a
                  key={idx}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 border border-gray-300 hover:border-blue-500 rounded-lg font-medium text-gray-700 hover:text-blue-600 transition"
                >
                  <doc.icon className="w-5 h-5 text-blue-600" />
                  <span className="flex-1">{doc.label}</span>
                  <Download className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Candidature info */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Candidature pour:
                </p>
                <p className="text-lg font-bold text-blue-800">{candidate.job.title}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-700 font-medium">
                  Postulé le
                </p>
                <p className="text-base font-semibold text-blue-900">
                  {new Date(candidate.applied_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Informations principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                Expérience professionnelle
              </h4>
              <p className="text-gray-800 font-semibold text-lg">
                {candidate.candidate_profile.experience_years !== undefined
                  ? `${candidate.candidate_profile.experience_years} an${candidate.candidate_profile.experience_years > 1 ? 's' : ''}`
                  : 'Non spécifié'}
              </p>
            </div>

            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                Niveau d'études
              </h4>
              <p className="text-gray-800 font-semibold text-lg">
                {candidate.candidate_profile.education_level || 'Non spécifié'}
              </p>
            </div>

            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Disponibilité
              </h4>
              <p className="text-gray-800 font-semibold text-lg">
                {getAvailabilityLabel(candidate.candidate_profile.availability)}
              </p>
            </div>

            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                Prétentions salariales
              </h4>
              <p className="text-gray-800 font-semibold text-sm">
                {formatSalary(candidate.candidate_profile.desired_salary_min, candidate.candidate_profile.desired_salary_max)}
              </p>
            </div>

            {candidate.candidate_profile.nationality && (
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  Nationalité
                </h4>
                <p className="text-gray-800 font-semibold text-lg">
                  {candidate.candidate_profile.nationality}
                </p>
              </div>
            )}

            {candidate.candidate_profile.driving_license && candidate.candidate_profile.driving_license.length > 0 && (
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-600" />
                  Permis de conduire
                </h4>
                <div className="flex flex-wrap gap-2">
                  {candidate.candidate_profile.driving_license.map((license, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                      {license}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Poste recherché et secteurs */}
          {(candidate.candidate_profile.desired_position || candidate.candidate_profile.desired_sectors) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {candidate.candidate_profile.desired_position && (
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Poste recherché
                  </h4>
                  <p className="text-gray-800 font-semibold">
                    {candidate.candidate_profile.desired_position}
                  </p>
                </div>
              )}

              {candidate.candidate_profile.desired_sectors && candidate.candidate_profile.desired_sectors.length > 0 && (
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-600" />
                    Secteurs souhaités
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {candidate.candidate_profile.desired_sectors.map((sector, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                        {sector}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobilité géographique */}
          {candidate.candidate_profile.mobility && candidate.candidate_profile.mobility.length > 0 && (
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-8">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Mobilité géographique
              </h4>
              <div className="flex flex-wrap gap-2">
                {candidate.candidate_profile.mobility.map((zone, idx) => (
                  <span key={idx} className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
                    {zone}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Langues */}
          {candidate.candidate_profile.languages && Array.isArray(candidate.candidate_profile.languages) && candidate.candidate_profile.languages.length > 0 && (
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-8">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Languages className="w-5 h-5 text-blue-600" />
                Langues parlées
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {candidate.candidate_profile.languages.map((lang: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg">
                    <span className="font-semibold text-gray-800">{lang.language || lang.name || lang}</span>
                    {lang.level && <span className="text-sm text-gray-600">{lang.level}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Résumé professionnel */}
          {candidate.candidate_profile.professional_summary && (
            <div className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-4 text-lg">Résumé Professionnel</h4>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {candidate.candidate_profile.professional_summary}
              </p>
            </div>
          )}

          {/* Compétences */}
          {candidate.candidate_profile.skills && candidate.candidate_profile.skills.length > 0 && (
            <div className="mb-8">
              <h4 className="font-bold text-gray-900 mb-4 text-lg">Compétences clés</h4>
              <div className="flex flex-wrap gap-3">
                {candidate.candidate_profile.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold shadow-md"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Liens professionnels */}
          {links.length > 0 && (
            <div className="mb-8">
              <h4 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                <LinkIcon className="w-6 h-6 text-blue-600" />
                Profils en ligne
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-300 hover:border-blue-400 rounded-lg font-medium text-gray-700 hover:text-blue-700 transition"
                  >
                    <link.icon className="w-5 h-5" />
                    <span>{link.label}</span>
                    <LinkIcon className="w-4 h-4 ml-auto" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Lettre de motivation (texte) */}
          {candidate.cover_letter && (
            <div className="mb-8">
              <h4 className="font-bold text-gray-900 mb-4 text-lg">Lettre de Motivation</h4>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {candidate.cover_letter}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t-2 border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition text-lg"
            >
              Fermer
            </button>
            <button
              onClick={() => {
                window.location.href = `mailto:${candidate.candidate.email}`;
              }}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition flex items-center justify-center gap-3 shadow-lg text-lg"
            >
              <Mail className="w-6 h-6" />
              Contacter par email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
