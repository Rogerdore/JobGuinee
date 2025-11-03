import { Download, MessageCircle, Heart, MapPin, Briefcase, GraduationCap, CheckCircle, Circle, Hexagon, Star } from 'lucide-react';
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
  availability?: string;
  languages?: string[];
  is_verified?: boolean;
  cv_url?: string;
  profile?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface CandidateCardProps {
  candidate: Candidate;
  score?: number;
  onContact: (candidateId: string) => void;
  onDownload: (candidateId: string) => void;
  onToggleFavorite: (candidateId: string) => void;
  onViewDetails: (candidateId: string) => void;
  isFavorite?: boolean;
}

export default function CandidateCard({
  candidate,
  score = 0,
  onContact,
  onDownload,
  onToggleFavorite,
  onViewDetails,
  isFavorite = false,
}: CandidateCardProps) {
  const [downloading, setDownloading] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return {
      bg: 'soft-gradient-green',
      text: 'text-green-700',
      icon: <Circle className="w-3 h-3 fill-green-600 text-green-600" />
    };
    if (score >= 60) return {
      bg: 'bg-pastel-yellow',
      text: 'text-yellow-700',
      icon: <Hexagon className="w-3 h-3 fill-yellow-600 text-yellow-600" />
    };
    return {
      bg: 'bg-red-50',
      text: 'text-red-700',
      icon: <Star className="w-3 h-3 fill-red-600 text-red-600" />
    };
  };

  const scoreColor = getScoreColor(score);

  const handleDownload = async () => {
    setDownloading(true);
    await onDownload(candidate.id);
    setDownloading(false);
  };

  return (
    <div className="neo-clay-card rounded-2xl p-5 transition-all duration-300">
      <div className="flex gap-3 mb-4">
        <div className="flex flex-col items-start gap-2 w-24 flex-shrink-0">
          <div className="relative mx-auto">
            {candidate.profile?.avatar_url ? (
              <img
                src={candidate.profile.avatar_url}
                alt={candidate.profile?.full_name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-900 flex items-center justify-center">
                <span className="text-xl font-bold text-white">
                  {candidate.profile?.full_name.charAt(0) || 'C'}
                </span>
              </div>
            )}
            {candidate.is_verified && (
              <div className="absolute -bottom-1 -right-1 bg-blue-900 rounded-full p-0.5">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5 w-full pl-1">
            {candidate.location && (
              <div className="flex items-start gap-1 text-xs text-gray-600">
                <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span className="leading-tight break-words">{candidate.location}</span>
              </div>
            )}
            {candidate.experience_years !== undefined && (
              <div className="flex items-start gap-1 text-xs text-gray-600">
                <Briefcase className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span className="leading-tight break-words">{candidate.experience_years} ans d'expérience</span>
              </div>
            )}
            {candidate.education_level && (
              <div className="flex items-start gap-1 text-xs text-gray-600">
                <GraduationCap className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span className="leading-tight break-words">{candidate.education_level}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base text-gray-900 mb-0.5 truncate">
                {candidate.profile?.full_name || 'Candidat'}
              </h3>
              {candidate.title && (
                <p className="text-sm font-medium text-gray-600 line-clamp-1">{candidate.title}</p>
              )}
            </div>
            <button
              onClick={() => onToggleFavorite(candidate.id)}
              className={`p-1.5 rounded-full transition flex-shrink-0 neo-clay-button ${
                isFavorite
                  ? 'text-red-600'
                  : 'text-gray-400 hover:text-red-600'
              }`}
              title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>

          {candidate.bio && (
            <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">{candidate.bio}</p>
          )}

          {candidate.skills && candidate.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {candidate.skills.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 soft-gradient-blue text-primary-700 text-xs font-medium rounded-lg"
                >
                  {skill}
                </span>
              ))}
              {candidate.skills.length > 3 && (
                <span className="px-2 py-0.5 neo-clay-pressed text-gray-600 text-xs rounded-lg font-medium">
                  +{candidate.skills.length - 3} compétences
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100 mb-3">
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${scoreColor.bg} ${scoreColor.text}`}>
          {scoreColor.icon} {score}% Compatible
        </span>
        {candidate.is_verified && (
          <span className="px-2.5 py-1 soft-gradient-blue text-primary-700 text-xs font-medium rounded-full">
            ✓ Vérifié
          </span>
        )}
      </div>

      <div className="soft-gradient-blue border border-blue-200/50 rounded-xl p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-600 font-medium">Prix d'accès</span>
        </div>
        <div className="text-xl font-bold text-blue-900">4 000 GNF</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="px-3 py-2 neo-clay-button text-gray-700 text-xs font-medium rounded-xl transition flex items-center justify-center gap-1.5"
          title="Aperçu"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Chargement...' : 'Aperçu'}
        </button>
        <button
          onClick={() => onViewDetails(candidate.id)}
          className="px-3 py-2 bg-gradient-to-r from-primary-700 to-primary-600 hover:from-primary-800 hover:to-primary-700 text-white text-xs font-semibold rounded-xl transition shadow-md flex items-center justify-center gap-1.5"
        >
          <MessageCircle className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
          🔒 Informations complètes débloquées après achat : coordonnées, CV, certifications
        </p>
      </div>
    </div>
  );
}
