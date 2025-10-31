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

  const scoreColor = getScoreColor(score);

  const handleDownload = async () => {
    setDownloading(true);
    await onDownload(candidate.id);
    setDownloading(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start gap-4 mb-4">
        <div className="relative flex-shrink-0">
          {candidate.profile?.avatar_url ? (
            <img
              src={candidate.profile.avatar_url}
              alt={candidate.profile?.full_name}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-900 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {candidate.profile?.full_name.charAt(0) || 'C'}
              </span>
            </div>
          )}
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
                {candidate.profile?.full_name || 'Candidat'}
              </h3>
              {candidate.title && (
                <p className="text-sm font-medium text-gray-600">{candidate.title}</p>
              )}
            </div>
            <button
              onClick={() => onToggleFavorite(candidate.id)}
              className={`p-2 rounded-full transition ${
                isFavorite
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-red-600'
              }`}
              title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
            {candidate.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{candidate.location}</span>
              </div>
            )}
            {candidate.experience_years !== undefined && (
              <div className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                <span>{candidate.experience_years} ans</span>
              </div>
            )}
            {candidate.education_level && (
              <div className="flex items-center gap-1">
                <GraduationCap className="w-4 h-4" />
                <span>{candidate.education_level}</span>
              </div>
            )}
          </div>

          {candidate.bio && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{candidate.bio}</p>
          )}

          {candidate.skills && candidate.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {candidate.skills.slice(0, 4).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-50 text-blue-900 text-xs font-medium rounded-full"
                >
                  {skill}
                </span>
              ))}
              {candidate.skills.length > 4 && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{candidate.skills.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${scoreColor.bg} ${scoreColor.text}`}>
            {scoreColor.icon} {score}% Compatible
          </span>
          {candidate.is_verified && (
            <span className="px-3 py-1 bg-blue-50 text-blue-900 text-xs font-medium rounded-full">
              ✓ Vérifié
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        {candidate.cv_url && (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg transition flex items-center justify-center gap-1"
            title="Télécharger CV"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'En cours...' : 'CV'}
          </button>
        )}
        <button
          onClick={() => onContact(candidate.id)}
          className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 text-sm font-medium rounded-lg transition flex items-center justify-center gap-1"
          title="Contacter"
        >
          <MessageCircle className="w-4 h-4" />
          Contact
        </button>
        <button
          onClick={() => onViewDetails(candidate.id)}
          className="px-3 py-2 bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg transition col-span-1"
        >
          Voir profil
        </button>
      </div>
    </div>
  );
}
