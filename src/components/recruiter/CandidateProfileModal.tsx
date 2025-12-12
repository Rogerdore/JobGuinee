import { useState, useEffect } from 'react';
import { X, Mail, Phone, Calendar, Briefcase, GraduationCap, MapPin, Download, TrendingUp } from 'lucide-react';
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
    desired_salary?: number;
    availability?: string;
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

    const { data, error } = await supabase
      .from('applications')
      .select(`
        id,
        ai_score,
        ai_category,
        applied_at,
        cover_letter,
        cv_url,
        candidate:candidate_profiles!applications_candidate_id_fkey(
          id,
          title,
          experience_years,
          education_level,
          skills,
          professional_summary,
          location,
          desired_salary,
          availability,
          profile:profiles!candidate_profiles_profile_id_fkey(
            full_name,
            email,
            phone,
            avatar_url
          )
        ),
        job:jobs!applications_job_id_fkey(
          title
        )
      `)
      .eq('id', applicationId)
      .single();

    if (error) {
      console.error('Error loading candidate:', error);
    } else if (data) {
      setCandidate({
        id: data.id,
        candidate: {
          id: data.candidate.id,
          full_name: data.candidate.profile.full_name,
          email: data.candidate.profile.email,
          phone: data.candidate.profile.phone,
          avatar_url: data.candidate.profile.avatar_url,
        },
        candidate_profile: {
          title: data.candidate.title,
          experience_years: data.candidate.experience_years,
          education_level: data.candidate.education_level,
          skills: data.candidate.skills,
          professional_summary: data.candidate.professional_summary,
          location: data.candidate.location,
          desired_salary: data.candidate.desired_salary,
          availability: data.candidate.availability,
        },
        job: data.job,
        ai_score: data.ai_score || 0,
        ai_category: data.ai_category || 'medium',
        applied_at: data.applied_at,
        cover_letter: data.cover_letter,
        cv_url: data.cv_url,
      });
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
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <p className="text-gray-600">Profil introuvable</p>
          <button
            onClick={onClose}
            className="mt-4 px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  const badge = getCategoryBadge(candidate.ai_category);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-8">
        <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-blue-700 text-white p-6 rounded-t-2xl flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold">Profil Candidat</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-6 mb-6">
            <div className="flex-shrink-0">
              {candidate.candidate.avatar_url ? (
                <img
                  src={candidate.candidate.avatar_url}
                  alt={candidate.candidate.full_name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-blue-200">
                  <span className="text-3xl font-bold text-blue-900">
                    {candidate.candidate.full_name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {candidate.candidate.full_name}
              </h3>
              {candidate.candidate_profile.title && (
                <p className="text-lg text-gray-600 mb-3">{candidate.candidate_profile.title}</p>
              )}

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{candidate.candidate.email}</span>
                </div>
                {candidate.candidate.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{candidate.candidate.phone}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-900">{candidate.ai_score}%</span>
                </div>
                <span className={`px-4 py-2 rounded-lg font-semibold ${badge.bg} ${badge.text}`}>
                  {badge.label}
                </span>
              </div>
            </div>

            {candidate.cv_url && (
              <a
                href={candidate.cv_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition"
              >
                <Download className="w-5 h-5" />
                Télécharger CV
              </a>
            )}
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Candidature pour:</strong> {candidate.job.title}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              Postulé le {new Date(candidate.applied_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                Expérience
              </h4>
              <p className="text-gray-700">
                {candidate.candidate_profile.experience_years !== undefined
                  ? `${candidate.candidate_profile.experience_years} an${candidate.candidate_profile.experience_years > 1 ? 's' : ''}`
                  : 'Non spécifié'}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                Formation
              </h4>
              <p className="text-gray-700">
                {candidate.candidate_profile.education_level || 'Non spécifié'}
              </p>
            </div>

            {candidate.candidate_profile.location && (
              <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Localisation
                </h4>
                <p className="text-gray-700">{candidate.candidate_profile.location}</p>
              </div>
            )}

            {candidate.candidate_profile.availability && (
              <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Disponibilité
                </h4>
                <p className="text-gray-700">{candidate.candidate_profile.availability}</p>
              </div>
            )}
          </div>

          {candidate.candidate_profile.professional_summary && (
            <div className="mb-6">
              <h4 className="font-bold text-gray-900 mb-3">Résumé Professionnel</h4>
              <p className="text-gray-700 leading-relaxed">
                {candidate.candidate_profile.professional_summary}
              </p>
            </div>
          )}

          {candidate.candidate_profile.skills && candidate.candidate_profile.skills.length > 0 && (
            <div className="mb-6">
              <h4 className="font-bold text-gray-900 mb-3">Compétences</h4>
              <div className="flex flex-wrap gap-2">
                {candidate.candidate_profile.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {candidate.cover_letter && (
            <div className="mb-6">
              <h4 className="font-bold text-gray-900 mb-3">Lettre de Motivation</h4>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {candidate.cover_letter}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition"
            >
              Fermer
            </button>
            <button
              onClick={() => {
                window.location.href = `mailto:${candidate.candidate.email}`;
              }}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              <Mail className="w-5 h-5" />
              Contacter par email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
