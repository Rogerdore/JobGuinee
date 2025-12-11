import { X, Download, MapPin, Briefcase, GraduationCap, Mail, Phone, Globe, Linkedin, Github, FileText, Award, Languages, Car, DollarSign, Calendar, TrendingUp } from 'lucide-react';

interface CandidateProfile {
  id: string;
  profile_id: string;
  title?: string;
  bio?: string;
  skills?: string[];
  experience_years?: number;
  education_level?: string;
  education?: any[];
  work_experience?: any[];
  location?: string;
  languages?: any[];
  is_verified?: boolean;
  cv_url?: string;
  cover_letter_url?: string;
  certificates_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  github_url?: string;
  other_urls?: any[];
  desired_position?: string;
  desired_salary_min?: number;
  desired_salary_max?: number;
  desired_sectors?: string[];
  mobility?: string[];
  availability?: string;
  driving_license?: string[];
  nationality?: string;
  ai_generated_summary?: string;
  profile?: {
    full_name?: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
  };
}

interface CandidateProfileModalProps {
  candidate: CandidateProfile;
  isOpen: boolean;
  onClose: () => void;
}

export default function CandidateProfileModal({ candidate, isOpen, onClose }: CandidateProfileModalProps) {
  if (!isOpen) return null;

  const handleDownload = (url: string | undefined, filename: string) => {
    if (!url) {
      alert('Document non disponible');
      return;
    }
    window.open(url, '_blank');
  };

  const formatSalary = (amount?: number) => {
    if (!amount) return 'Non spécifié';
    return new Intl.NumberFormat('fr-GN').format(amount) + ' GNF';
  };

  const getAvailabilityLabel = (availability?: string) => {
    const labels: Record<string, string> = {
      'immediate': 'Immédiate',
      '1_month': 'Dans 1 mois',
      '3_months': 'Dans 3 mois',
      'negotiable': 'Négociable'
    };
    return labels[availability || ''] || 'Non spécifié';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-8">
        <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-blue-700 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">{candidate.profile?.full_name || 'Profil Complet'}</h2>
            <p className="text-blue-100">{candidate.title || 'Professionnel'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
              <div className="flex items-center gap-2 text-blue-900 mb-2">
                <Mail className="w-5 h-5" />
                <span className="font-semibold">Email</span>
              </div>
              <p className="text-gray-900">{candidate.profile?.email || 'Non disponible'}</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
              <div className="flex items-center gap-2 text-green-900 mb-2">
                <Phone className="w-5 h-5" />
                <span className="font-semibold">Téléphone</span>
              </div>
              <p className="text-gray-900">{candidate.profile?.phone || 'Non disponible'}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
              <div className="flex items-center gap-2 text-orange-900 mb-2">
                <MapPin className="w-5 h-5" />
                <span className="font-semibold">Localisation</span>
              </div>
              <p className="text-gray-900">{candidate.location || 'Non spécifiée'}</p>
            </div>
          </div>

          {candidate.ai_generated_summary && (
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-900 mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="font-bold">Résumé IA</span>
              </div>
              <p className="text-gray-700">{candidate.ai_generated_summary}</p>
            </div>
          )}

          {candidate.bio && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-2">Bio</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{candidate.bio}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-900 mb-3">
                <Briefcase className="w-5 h-5" />
                <h3 className="font-bold">Expérience Professionnelle</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Années d'expérience: <span className="font-semibold text-gray-900">{candidate.experience_years || 0} ans</span></p>
                {candidate.work_experience && candidate.work_experience.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {candidate.work_experience.map((exp: any, idx: number) => (
                      <div key={idx} className="border-l-2 border-blue-300 pl-3">
                        <p className="font-semibold text-gray-900">{exp.position || exp.title}</p>
                        <p className="text-sm text-gray-600">{exp.company}</p>
                        <p className="text-xs text-gray-500">{exp.period || `${exp.start_date} - ${exp.end_date}`}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-900 mb-3">
                <GraduationCap className="w-5 h-5" />
                <h3 className="font-bold">Formation</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Niveau: <span className="font-semibold text-gray-900">{candidate.education_level || 'Non spécifié'}</span></p>
                {candidate.education && candidate.education.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {candidate.education.map((edu: any, idx: number) => (
                      <div key={idx} className="border-l-2 border-green-300 pl-3">
                        <p className="font-semibold text-gray-900">{edu.degree || edu.diploma}</p>
                        <p className="text-sm text-gray-600">{edu.school || edu.institution}</p>
                        <p className="text-xs text-gray-500">{edu.year || edu.period}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {candidate.skills && candidate.skills.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-3">Compétences</h3>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-blue-100 text-blue-900 text-sm font-medium rounded-lg"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {candidate.languages && candidate.languages.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-900 mb-3">
                  <Languages className="w-5 h-5" />
                  <h3 className="font-bold">Langues</h3>
                </div>
                <div className="space-y-2">
                  {candidate.languages.map((lang: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-gray-700">{typeof lang === 'string' ? lang : lang.language || lang.name}</span>
                      {typeof lang === 'object' && lang.level && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">{lang.level}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {candidate.driving_license && candidate.driving_license.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-900 mb-3">
                  <Car className="w-5 h-5" />
                  <h3 className="font-bold">Permis de conduire</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {candidate.driving_license.map((license, idx) => (
                    <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg">
                      {license}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {candidate.desired_position && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
              <h3 className="font-bold text-blue-900 mb-3">Recherche</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-blue-700 mb-1">Poste recherché</p>
                  <p className="font-semibold text-gray-900">{candidate.desired_position}</p>
                </div>
                {(candidate.desired_salary_min || candidate.desired_salary_max) && (
                  <div>
                    <div className="flex items-center gap-2 text-blue-700 mb-1">
                      <DollarSign className="w-4 h-4" />
                      <p className="text-sm">Salaire souhaité</p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {formatSalary(candidate.desired_salary_min)} - {formatSalary(candidate.desired_salary_max)}
                    </p>
                  </div>
                )}
                {candidate.availability && (
                  <div>
                    <div className="flex items-center gap-2 text-blue-700 mb-1">
                      <Calendar className="w-4 h-4" />
                      <p className="text-sm">Disponibilité</p>
                    </div>
                    <p className="font-semibold text-gray-900">{getAvailabilityLabel(candidate.availability)}</p>
                  </div>
                )}
                {candidate.desired_sectors && candidate.desired_sectors.length > 0 && (
                  <div>
                    <p className="text-sm text-blue-700 mb-1">Secteurs souhaités</p>
                    <div className="flex flex-wrap gap-1">
                      {candidate.desired_sectors.map((sector, idx) => (
                        <span key={idx} className="text-sm text-gray-700">{sector}{idx < candidate.desired_sectors!.length - 1 ? ',' : ''}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {candidate.mobility && candidate.mobility.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-blue-700 mb-1">Mobilité géographique</p>
                  <div className="flex flex-wrap gap-2">
                    {candidate.mobility.map((zone, idx) => (
                      <span key={idx} className="px-2 py-1 bg-white text-gray-700 text-sm rounded">
                        {zone}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Liens & Réseaux
            </h3>
            <div className="space-y-2">
              {candidate.linkedin_url && (
                <a
                  href={candidate.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition"
                >
                  <Linkedin className="w-4 h-4" />
                  <span className="text-sm">LinkedIn</span>
                </a>
              )}
              {candidate.github_url && (
                <a
                  href={candidate.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition"
                >
                  <Github className="w-4 h-4" />
                  <span className="text-sm">GitHub</span>
                </a>
              )}
              {candidate.portfolio_url && (
                <a
                  href={candidate.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-purple-600 hover:text-purple-800 transition"
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">Portfolio</span>
                </a>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
            <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
              <Download className="w-5 h-5" />
              Documents disponibles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => handleDownload(candidate.cv_url, 'CV.pdf')}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-green-50 border-2 border-green-200 text-green-900 font-semibold rounded-lg transition"
              >
                <FileText className="w-5 h-5" />
                <span>Télécharger CV</span>
              </button>

              {candidate.cover_letter_url && (
                <button
                  onClick={() => handleDownload(candidate.cover_letter_url, 'Lettre-de-motivation.pdf')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-green-50 border-2 border-green-200 text-green-900 font-semibold rounded-lg transition"
                >
                  <FileText className="w-5 h-5" />
                  <span>Lettre de motivation</span>
                </button>
              )}

              {candidate.certificates_url && (
                <button
                  onClick={() => handleDownload(candidate.certificates_url, 'Certificats.pdf')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-green-50 border-2 border-green-200 text-green-900 font-semibold rounded-lg transition"
                >
                  <Award className="w-5 h-5" />
                  <span>Certificats</span>
                </button>
              )}
            </div>
          </div>

          {candidate.nationality && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">Nationalité: <span className="font-semibold text-gray-900">{candidate.nationality}</span></p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-lg transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
