import { ShoppingCart, MapPin, Briefcase, GraduationCap, CheckCircle, Eye, Circle, Hexagon, Star, User, Languages, Shield, Crown } from 'lucide-react';
import { useState } from 'react';

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
  is_verified?: boolean;
  is_gold?: boolean;
  gold_expiration?: string;
  experience_level?: string;
  profile_price: number;
}

interface AnonymizedCandidateCardProps {
  candidate: Candidate;
  score?: number;
  onAddToCart: (candidateId: string) => void;
  onViewDetails: (candidateId: string) => void;
  isInCart?: boolean;
  isPurchased?: boolean;
  viewerUserType?: string;
}

export default function AnonymizedCandidateCard({
  candidate,
  score = 0,
  onAddToCart,
  onViewDetails,
  isInCart = false,
  isPurchased = false,
  viewerUserType,
}: AnonymizedCandidateCardProps) {
  const getExperienceLevel = (years: number) => {
    if (years >= 6) return {
      label: 'Senior',
      color: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-900 border border-blue-300',
      icon: <Star className="w-3.5 h-3.5 fill-blue-600 text-blue-600" />
    };
    if (years >= 3) return {
      label: 'Intermédiaire',
      color: 'bg-gradient-to-r from-green-100 to-green-200 text-green-900 border border-green-300',
      icon: <Hexagon className="w-3.5 h-3.5 fill-green-600 text-green-600" />
    };
    return {
      label: 'Junior',
      color: 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-900 border border-orange-300',
      icon: <Circle className="w-3.5 h-3.5 fill-orange-600 text-orange-600" />
    };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return {
      bg: 'bg-green-100',
      text: 'text-green-800',
      icon: <Circle className="w-3 h-3 fill-green-600 text-green-600" />
    };
    if (score >= 60) return {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      icon: <Hexagon className="w-3 h-3 fill-yellow-600 text-yellow-600" />
    };
    return {
      bg: 'bg-red-100',
      text: 'text-red-800',
      icon: <Star className="w-3 h-3 fill-red-600 text-red-600" />
    };
  };

  const level = getExperienceLevel(candidate.experience_years || 0);
  const scoreColor = getScoreColor(score);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-GN').format(price);
  };

  const anonymizeLocation = (location?: string) => {
    if (!location) return 'Région confidentielle';
    const parts = location.split(',');
    return parts[0];
  };

  const isGoldActive = () => {
    if (!candidate.is_gold || !candidate.gold_expiration) return false;
    return new Date(candidate.gold_expiration) > new Date();
  };

  const shouldShowPrice = viewerUserType === 'recruiter' && !isPurchased;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Photo en haut */}
      <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 py-4 flex items-center justify-center">
        {/* Badges en haut à gauche */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {candidate.is_verified && (
            <div className="bg-blue-600 text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs font-bold shadow-lg">
              <Shield className="w-3 h-3" />
              <span>Vérifié</span>
            </div>
          )}
          {isGoldActive() && (
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs font-bold shadow-lg">
              <Crown className="w-3 h-3" />
              <span>GOLD</span>
            </div>
          )}
        </div>

        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shadow-lg">
            <User className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-4">
        <div className="text-center mb-3">
          <h3 className="font-bold text-lg text-gray-900 mb-1.5">
            {candidate.title || 'Professionnel qualifié'}
          </h3>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${level.color}`}>
            {level.icon} {level.label}
          </span>
        </div>

        <div className="space-y-1.5 mb-3">
          <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
            <MapPin className="w-3.5 h-3.5" />
            <span>{anonymizeLocation(candidate.location)}</span>
          </div>
          <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
            <Briefcase className="w-3.5 h-3.5" />
            <span>{candidate.experience_years || 0} ans</span>
          </div>
          {candidate.education_level && (
            <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{candidate.education_level}</span>
            </div>
          )}
          {candidate.languages && candidate.languages.length > 0 && (
            <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
              <Languages className="w-3.5 h-3.5" />
              <span>{candidate.languages.slice(0, 2).join(', ')}{candidate.languages.length > 2 ? '...' : ''}</span>
            </div>
          )}
        </div>

        {candidate.bio && (
          <p className="text-xs text-gray-600 text-center line-clamp-2 mb-3">
            {candidate.bio.substring(0, 80)}...
          </p>
        )}

        {candidate.skills && candidate.skills.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mb-3">
            {candidate.skills.slice(0, 3).map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-blue-50 text-blue-900 text-xs font-medium rounded-full"
              >
                {skill}
              </span>
            ))}
            {candidate.skills.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{candidate.skills.length - 3}
              </span>
            )}
          </div>
        )}

        {shouldShowPrice && (
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-2 mb-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Prix d'accès</p>
                <p className="text-base font-bold text-blue-900">
                  {formatPrice(candidate.profile_price)} GNF
                </p>
              </div>
            </div>
          </div>
        )}

        {isPurchased && (
          <div className="bg-green-50 rounded-lg p-2 mb-2">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-sm font-bold text-green-900">Profil acheté</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-2">
          <button
            onClick={() => onViewDetails(candidate.id)}
            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded-lg transition flex items-center justify-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            Aperçu
          </button>
          {!isPurchased && (
            <button
              onClick={() => onAddToCart(candidate.id)}
              disabled={isInCart}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1 ${
                isInCart
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-900 hover:bg-blue-800 text-white'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {isInCart ? 'Panier' : 'Ajouter'}
            </button>
          )}
          {isPurchased && (
            <button
              onClick={() => onViewDetails(candidate.id)}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1"
            >
              Voir profil
            </button>
          )}
        </div>

        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center leading-tight">
            🔒 Coordonnées, CV et certifications après achat
          </p>
        </div>
      </div>
    </div>
  );
}
