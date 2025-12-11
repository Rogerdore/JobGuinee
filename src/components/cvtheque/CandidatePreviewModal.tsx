import { X, Briefcase, MapPin, GraduationCap, Award, Lock, ShoppingCart, Eye, User, Crown, Shield } from 'lucide-react';

interface Candidate {
  id: string;
  title?: string;
  bio?: string;
  skills?: string[];
  experience_years?: number;
  education_level?: string;
  location?: string;
  languages?: string[];
  is_verified?: boolean;
  is_gold?: boolean;
  gold_expiration?: string;
  profile_price: number;
}

interface CandidatePreviewModalProps {
  candidate: Candidate;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: () => void;
  isInCart?: boolean;
  viewerUserType?: string;
}

export default function CandidatePreviewModal({
  candidate,
  isOpen,
  onClose,
  onAddToCart,
  isInCart = false,
  viewerUserType
}: CandidatePreviewModalProps) {
  if (!isOpen) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-GN').format(price);
  };

  const getRegion = (location?: string) => {
    if (!location) return 'Région confidentielle';
    return location.split(',')[0];
  };

  const isGoldActive = () => {
    if (!candidate.is_gold || !candidate.gold_expiration) return false;
    return new Date(candidate.gold_expiration) > new Date();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-blue-800 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Aperçu du Profil</h2>
                <p className="text-blue-100 text-sm">
                  {viewerUserType === 'recruiter'
                    ? 'Informations limitées - Achetez pour tout voir'
                    : 'Informations limitées - Réservé aux recruteurs'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-xl">
                <User className="w-12 h-12 text-white" strokeWidth={2} />
              </div>

              {candidate.is_verified && (
                <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full shadow-lg">
                  <Shield className="w-4 h-4" />
                </div>
              )}

              {isGoldActive() && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-2 rounded-full shadow-lg">
                  <Crown className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {candidate.title || 'Professionnel qualifié'}
            </h3>
            {candidate.bio && (
              <p className="text-gray-600 text-sm max-w-lg mx-auto">
                {candidate.bio.substring(0, 120)}...
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-blue-700 font-medium">Expérience</p>
                  <p className="text-lg font-bold text-blue-900">
                    {candidate.experience_years || 0} ans
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-green-700 font-medium">Niveau d'études</p>
                  <p className="text-lg font-bold text-green-900">
                    {candidate.education_level || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-orange-700 font-medium">Région</p>
                  <p className="text-lg font-bold text-orange-900">
                    {getRegion(candidate.location)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-purple-700 font-medium">Compétences</p>
                  <p className="text-lg font-bold text-purple-900">
                    {candidate.skills?.length || 0} compétences
                  </p>
                </div>
              </div>
            </div>
          </div>

          {candidate.skills && candidate.skills.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Compétences principales (aperçu limité)
              </h4>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.slice(0, 5).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-blue-100 text-blue-900 text-sm font-medium rounded-lg border border-blue-200"
                  >
                    {skill}
                  </span>
                ))}
                {candidate.skills.length > 5 && (
                  <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg border border-gray-200">
                    +{candidate.skills.length - 5} autres
                  </span>
                )}
              </div>
            </div>
          )}

          {candidate.languages && candidate.languages.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-bold text-gray-700 mb-3">Langues parlées</h4>
              <div className="flex flex-wrap gap-2">
                {candidate.languages.map((lang, idx) => {
                  const langText = typeof lang === 'string' ? lang : lang?.language || 'N/A';
                  return (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg border border-gray-200"
                    >
                      {langText}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-red-900 text-lg mb-2">
                  {viewerUserType === 'recruiter'
                    ? 'Informations complètes disponibles après achat'
                    : 'Informations complètes réservées aux recruteurs'}
                </h4>
                <p className="text-red-800 text-sm mb-3">
                  {viewerUserType === 'recruiter'
                    ? 'Débloquez l\'accès complet au profil pour voir:'
                    : 'Les recruteurs peuvent accéder à:'}
                </p>
              </div>
            </div>
            <ul className="space-y-2 ml-13">
              <li className="flex items-center gap-2 text-sm text-red-900">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                Nom complet et coordonnées (téléphone, email)
              </li>
              <li className="flex items-center gap-2 text-sm text-red-900">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                CV complet téléchargeable (PDF)
              </li>
              <li className="flex items-center gap-2 text-sm text-red-900">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                Certifications et diplômes
              </li>
              <li className="flex items-center gap-2 text-sm text-red-900">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                Portfolio et références professionnelles
              </li>
              <li className="flex items-center gap-2 text-sm text-red-900">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                Historique professionnel détaillé
              </li>
            </ul>
          </div>

          {viewerUserType === 'recruiter' && (
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-xl p-6 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-blue-200 text-sm mb-1">Prix d'accès au profil complet</p>
                  <p className="text-3xl font-bold">
                    {formatPrice(candidate.profile_price)} GNF
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <ShoppingCart className="w-8 h-8" />
                </div>
              </div>
              <p className="text-blue-100 text-xs">
                Accès immédiat après validation du paiement par l'administrateur
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
            >
              Fermer
            </button>
            {viewerUserType === 'recruiter' && (
              <button
                onClick={onAddToCart}
                disabled={isInCart}
                className={`flex-1 px-6 py-3 font-bold rounded-xl transition flex items-center justify-center gap-2 ${
                  isInCart
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white shadow-lg'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {isInCart ? 'Déjà dans le panier' : 'Ajouter au panier'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
