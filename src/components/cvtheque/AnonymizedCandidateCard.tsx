import { ShoppingCart, MapPin, Briefcase, GraduationCap, CheckCircle, Eye } from 'lucide-react';
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
  profile_price: number;
}

interface AnonymizedCandidateCardProps {
  candidate: Candidate;
  score?: number;
  onAddToCart: (candidateId: string) => void;
  onViewDetails: (candidateId: string) => void;
  isInCart?: boolean;
  isPurchased?: boolean;
}

export default function AnonymizedCandidateCard({
  candidate,
  score = 0,
  onAddToCart,
  onViewDetails,
  isInCart = false,
  isPurchased = false,
}: AnonymizedCandidateCardProps) {
  const getExperienceLevel = (years: number) => {
    if (years >= 6) return { label: 'Senior', color: 'bg-blue-100 text-blue-900', badge: '🔷' };
    if (years >= 3) return { label: 'Intermédiaire', color: 'bg-green-100 text-green-900', badge: '🟢' };
    return { label: 'Junior', color: 'bg-orange-100 text-orange-900', badge: '🟠' };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-green-100', text: 'text-green-800', badge: '🟢' };
    if (score >= 60) return { bg: 'bg-yellow-100', text: 'text-yellow-800', badge: '🟡' };
    return { bg: 'bg-red-100', text: 'text-red-800', badge: '🔴' };
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

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start gap-4 mb-4">
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
            <span className="text-3xl">👤</span>
          </div>
          {candidate.is_verified && (
            <div className="absolute -bottom-1 -right-1 bg-blue-900 rounded-full p-1">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">
                {candidate.title || 'Professionnel qualifié'}
              </h3>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${level.color}`}>
                {level.badge} {level.label}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{anonymizeLocation(candidate.location)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              <span>{candidate.experience_years || 0} ans d'expérience</span>
            </div>
            {candidate.education_level && (
              <div className="flex items-center gap-1">
                <GraduationCap className="w-4 h-4" />
                <span>{candidate.education_level}</span>
              </div>
            )}
          </div>

          {candidate.bio && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {candidate.bio.substring(0, 100)}...
              <span className="text-gray-400 ml-1">(Aperçu limité)</span>
            </p>
          )}

          {candidate.skills && candidate.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {candidate.skills.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-50 text-blue-900 text-xs font-medium rounded-full"
                >
                  {skill}
                </span>
              ))}
              {candidate.skills.length > 3 && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{candidate.skills.length - 3} compétences
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mb-4">
        <div className="flex items-center gap-2">
          {score > 0 && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${scoreColor.bg} ${scoreColor.text}`}>
              {scoreColor.badge} {score}% Compatible
            </span>
          )}
          {candidate.is_verified && (
            <span className="px-3 py-1 bg-blue-50 text-blue-900 text-xs font-medium rounded-full">
              ✓ Vérifié
            </span>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 mb-1">Prix d'accès au profil complet</p>
            <p className="text-2xl font-bold text-blue-900">
              {formatPrice(candidate.profile_price)} GNF
            </p>
          </div>
          {isPurchased && (
            <div className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
              ✓ Acheté
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onViewDetails(candidate.id)}
          className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg transition flex items-center justify-center gap-1"
        >
          <Eye className="w-4 h-4" />
          Aperçu
        </button>
        {!isPurchased && (
          <button
            onClick={() => onAddToCart(candidate.id)}
            disabled={isInCart}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition flex items-center justify-center gap-1 ${
              isInCart
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-900 hover:bg-blue-800 text-white'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            {isInCart ? 'Dans le panier' : 'Ajouter'}
          </button>
        )}
        {isPurchased && (
          <button
            onClick={() => onViewDetails(candidate.id)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition flex items-center justify-center gap-1"
          >
            Voir profil complet
          </button>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          🔒 Informations complètes débloquées après achat : coordonnées, CV, certifications
        </p>
      </div>
    </div>
  );
}
