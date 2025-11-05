import { MapPin, Briefcase, TrendingUp, Eye, ArrowRight } from 'lucide-react';

interface SuccessStoryCardProps {
  story: {
    id: string;
    author_name: string;
    profile_photo_url?: string;
    job_title: string;
    company?: string;
    industry: string;
    location?: string;
    summary: string;
    story_title: string;
    story_excerpt: string;
    years_experience: number;
    view_count: number;
    achievements?: string[];
  };
  onClick: () => void;
}

export default function SuccessStoryCard({ story, onClick }: SuccessStoryCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer group"
    >
      <div className="relative bg-gradient-to-br from-blue-500 to-blue-700 p-6 pb-20">
        <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-gray-700">
          <Eye className="w-3 h-3" />
          {story.view_count}
        </div>

        <div className="flex items-start gap-4">
          {story.profile_photo_url ? (
            <img
              src={story.profile_photo_url}
              alt={story.author_name}
              className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {getInitials(story.author_name)}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-white mb-1 truncate">
              {story.author_name}
            </h3>
            <p className="text-blue-100 text-sm font-medium mb-2">
              {story.job_title}
            </p>
            {story.company && (
              <p className="text-blue-200 text-xs flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                {story.company}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 -mt-12 relative">
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4 border border-gray-100">
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
              <TrendingUp className="w-3 h-3" />
              {story.years_experience} ans d'expérience
            </div>
            <div className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium">
              {story.industry}
            </div>
            {story.location && (
              <div className="flex items-center gap-1 px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-xs font-medium">
                <MapPin className="w-3 h-3" />
                {story.location}
              </div>
            )}
          </div>
        </div>

        <h4 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-[#0E2F56] transition">
          {story.story_title}
        </h4>

        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {story.story_excerpt}
        </p>

        {story.achievements && story.achievements.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-700 mb-2">Réalisations clés:</p>
            <ul className="space-y-1">
              {story.achievements.slice(0, 2).map((achievement, idx) => (
                <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                  <span className="text-[#FF8C00] mt-0.5">•</span>
                  <span className="line-clamp-1">{achievement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#0E2F56] to-blue-700 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg transition font-medium text-sm group-hover:shadow-lg"
        >
          Lire l'histoire complète
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
