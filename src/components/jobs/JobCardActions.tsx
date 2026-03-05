import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { Job, Company } from '../../lib/supabase';
import { useJobCounters } from '../../hooks/useJobCounters';

interface JobCardActionsProps {
  job: Job & { companies?: Company };
  isSaved: boolean;
  onToggleSave: (e: React.MouseEvent) => void;
  onOpenComments: (e: React.MouseEvent) => void;
  onShare: (e: React.MouseEvent) => void;
}

export default function JobCardActions({
  job,
  isSaved,
  onToggleSave,
  onOpenComments,
  onShare,
}: JobCardActionsProps) {
  const { animated } = useJobCounters(job.id, {
    saves_count: job.saves_count,
    comments_count: job.comments_count,
    shares_count: job.shares_count,
  });

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onToggleSave}
        className={`relative p-2.5 rounded-lg border-2 transition-all duration-200 ${
          isSaved
            ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'
            : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
        }`}
        title={isSaved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      >
        <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
        {animated.saves.value > 0 && (
          <span
            className={`
              absolute -top-1 -right-1 text-white text-xs font-bold rounded-full
              w-5 h-5 flex items-center justify-center
              transition-all duration-300
              ${animated.saves.animating
                ? 'bg-rose-500 scale-125 ring-2 ring-rose-300'
                : 'bg-red-600 scale-100'}
            `}
          >
            {animated.saves.value > 99 ? '99+' : animated.saves.value}
          </span>
        )}
      </button>

      <button
        onClick={onOpenComments}
        className="relative p-2.5 rounded-lg border-2 border-gray-300 text-gray-600 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600 transition-all duration-200"
        title="Voir les commentaires"
      >
        <MessageCircle className="w-5 h-5" />
        {animated.comments.value > 0 && (
          <span
            className={`
              absolute -top-1 -right-1 text-white text-xs font-bold rounded-full
              w-5 h-5 flex items-center justify-center
              transition-all duration-300
              ${animated.comments.animating
                ? 'bg-blue-400 scale-125 ring-2 ring-blue-200'
                : 'bg-blue-600 scale-100'}
            `}
          >
            {animated.comments.value > 99 ? '99+' : animated.comments.value}
          </span>
        )}
      </button>

      <button
        onClick={onShare}
        className="relative p-2.5 rounded-lg border-2 border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
        title="Partager"
      >
        <Share2 className="w-5 h-5" />
        {animated.shares.value > 0 && (
          <span
            className={`
              absolute -top-1 -right-1 text-white text-xs font-bold rounded-full
              w-5 h-5 flex items-center justify-center
              transition-all duration-300
              ${animated.shares.animating
                ? 'bg-sky-400 scale-125 ring-2 ring-sky-200'
                : 'bg-sky-600 scale-100'}
            `}
          >
            {animated.shares.value > 99 ? '99+' : animated.shares.value}
          </span>
        )}
      </button>
    </div>
  );
}
