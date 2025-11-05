import { X, MapPin, Briefcase, GraduationCap, Languages, Award, Calendar, User, Lock, CheckCircle, Circle, Hexagon, Star, Mail, Phone, MapPinned } from 'lucide-react';

interface Candidate {
  id: string;
  profile_id: string;
  title?: string;
  bio?: string;
  skills?: string[];
  experience_years?: number;
  education_level?: string;
  location?: string;
  languages?: string[];
  certifications?: string[];
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
    description?: string;
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  is_verified?: boolean;
  profile_price: number;
  profile?: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
}

interface CandidatePreviewModalProps {
  candidate: Candidate;
  isOpen: boolean;
  onClose: () => void;
  isPurchased: boolean;
  onAddToCart: (candidateId: string) => void;
  isInCart: boolean;
}

export default function CandidatePreviewModal({
  candidate,
  isOpen,
  onClose,
  isPurchased,
  onAddToCart,
  isInCart,
}: CandidatePreviewModalProps) {
  if (!isOpen) return null;

  const getExperienceLevel = (years: number) => {
    if (years >= 6) return {
      label: 'Senior',
      color: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-900 border border-blue-300',
      icon: <Star className="w-4 h-4 fill-blue-600 text-blue-600" />
    };
    if (years >= 3) return {
      label: 'Intermédiaire',
      color: 'bg-gradient-to-r from-green-100 to-green-200 text-green-900 border border-green-300',
      icon: <Hexagon className="w-4 h-4 fill-green-600 text-green-600" />
    };
    return {
      label: 'Junior',
      color: 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-900 border border-orange-300',
      icon: <Circle className="w-4 h-4 fill-orange-600 text-orange-600" />
    };
  };

  const level = getExperienceLevel(candidate.experience_years || 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-GN').format(price);
  };

  const anonymizeLocation = (location?: string) => {
    if (!location) return 'Région confidentielle';
    const parts = location.split(',');
    return parts[0];
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-[#0E2F56] to-[#1a4275] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Aperçu du profil</h2>
              <p className="text-sm text-blue-100">
                {isPurchased ? 'Profil complet disponible' : 'Informations limitées'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 text-center border border-gray-200">
                <div className="relative inline-block mb-4">
                  {isPurchased && candidate.profile?.avatar_url ? (
                    <img
                      src={candidate.profile.avatar_url}
                      alt="Photo de profil"
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shadow-lg border-4 border-white">
                      <User className="w-12 h-12 text-white" strokeWidth={2} />
                    </div>
                  )}
                  {candidate.is_verified && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-900 rounded-full p-1">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                <h3 className="font-bold text-xl text-gray-900 mb-2">
                  {isPurchased && candidate.profile?.full_name
                    ? candidate.profile.full_name
                    : candidate.title || 'Professionnel qualifié'}
                </h3>

                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${level.color} mb-4`}>
                  {level.icon} {level.label}
                </span>

                <div className="space-y-3 mt-4 text-left">
                  {isPurchased ? (
                    <>
                      <div className="flex items-start gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-900">{candidate.profile?.email}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-900">+224 XXX XX XX XX</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <MapPinned className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-900">{candidate.location}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-2 text-sm bg-gray-100 p-3 rounded-lg">
                        <Lock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-500">Email masqué</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm bg-gray-100 p-3 rounded-lg">
                        <Lock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-500">Téléphone masqué</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{anonymizeLocation(candidate.location)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Prix d'accès</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatPrice(candidate.profile_price)} GNF
                  </p>
                </div>

                {!isPurchased && (
                  <button
                    onClick={() => onAddToCart(candidate.id)}
                    disabled={isInCart}
                    className={`w-full mt-4 px-4 py-3 rounded-lg font-semibold transition ${
                      isInCart
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-900 hover:bg-blue-800 text-white'
                    }`}
                  >
                    {isInCart ? 'Déjà dans le panier' : 'Ajouter au panier'}
                  </button>
                )}
              </div>
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#FF8C00]" />
                  À propos
                </h4>
                <p className="text-gray-700 leading-relaxed">
                  {candidate.bio || 'Informations biographiques non disponibles.'}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#FF8C00]" />
                  Compétences
                </h4>
                {candidate.skills && candidate.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-blue-50 text-blue-900 text-sm font-medium rounded-lg border border-blue-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Aucune compétence renseignée</p>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[#FF8C00]" />
                  Expérience professionnelle
                </h4>
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <Calendar className="w-4 h-4" />
                  <span className="font-semibold">{candidate.experience_years || 0} années d'expérience</span>
                </div>
                {isPurchased ? (
                  candidate.experience && candidate.experience.length > 0 ? (
                    <div className="space-y-4">
                      {candidate.experience.map((exp, idx) => (
                        <div key={idx} className="border-l-2 border-[#FF8C00] pl-4">
                          <h5 className="font-semibold text-gray-900">{exp.title}</h5>
                          <p className="text-sm text-gray-600">{exp.company} • {exp.duration}</p>
                          {exp.description && (
                            <p className="text-sm text-gray-700 mt-1">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Détails de l'expérience non renseignés</p>
                  )
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Détails complets disponibles après achat</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#FF8C00]" />
                  Formation
                </h4>
                {candidate.education_level && (
                  <div className="flex items-center gap-2 text-gray-600 mb-4">
                    <Award className="w-4 h-4" />
                    <span className="font-semibold">{candidate.education_level}</span>
                  </div>
                )}
                {isPurchased ? (
                  candidate.education && candidate.education.length > 0 ? (
                    <div className="space-y-3">
                      {candidate.education.map((edu, idx) => (
                        <div key={idx} className="border-l-2 border-blue-500 pl-4">
                          <h5 className="font-semibold text-gray-900">{edu.degree}</h5>
                          <p className="text-sm text-gray-600">{edu.institution} • {edu.year}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Détails de formation non renseignés</p>
                  )
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Détails complets disponibles après achat</p>
                  </div>
                )}
              </div>

              {candidate.languages && candidate.languages.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Languages className="w-5 h-5 text-[#FF8C00]" />
                    Langues
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {candidate.languages.map((lang, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-green-50 text-green-900 text-sm font-medium rounded-lg border border-green-200"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {isPurchased && candidate.certifications && candidate.certifications.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#FF8C00]" />
                    Certifications
                  </h4>
                  <ul className="space-y-2">
                    {candidate.certifications.map((cert, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{cert}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {isPurchased ? (
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <CheckCircle className="w-5 h-5" />
                  Vous avez accès au profil complet
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Coordonnées et CV complets disponibles après achat
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
