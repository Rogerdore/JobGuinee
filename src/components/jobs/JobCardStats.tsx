import { Eye, Users, Heart, MessageCircle, Clock, Share2 } from 'lucide-react';
import { Job, Company } from '../../lib/supabase';
import { useJobCounters } from '../../hooks/useJobCounters';

interface JobCardStatsProps {
  job: Job & { companies?: Company };
  variant?: 'compact' | 'full';
  showDate?: boolean;
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return "Aujourd'hui";
  if (diffInDays === 1) return 'Hier';
  if (diffInDays < 7) return `Il y a ${diffInDays}j`;
  if (diffInDays < 30) return `Il y a ${Math.floor(diffInDays / 7)}sem`;
  if (diffInDays < 365) return `Il y a ${Math.floor(diffInDays / 30)}mois`;
  return `Il y a ${Math.floor(diffInDays / 365)}ans`;
}

interface StatPillProps {
  icon: React.ElementType;
  value: number;
  label: string;
  iconColor: string;
  animating: boolean;
}

function StatPill({ icon: Icon, value, label, iconColor, animating }: StatPillProps) {
  if (value === 0) return null;

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
        bg-white border border-slate-200 text-slate-700 shadow-sm select-none
        transition-all duration-300
        ${animating ? 'ring-2 ring-blue-400 ring-offset-1 border-blue-300 bg-blue-50' : ''}
      `}
      aria-label={`${value} ${label}`}
    >
      <Icon
        className={`w-3.5 h-3.5 flex-shrink-0 transition-colors duration-300 ${animating ? 'text-blue-500' : iconColor}`}
      />
      <span
        className={`tabular-nums leading-none transition-all duration-300 ${animating ? 'font-bold text-blue-700 counter-pop' : ''}`}
      >
        {value.toLocaleString('fr-FR')}
      </span>
      <span className="text-slate-500 hidden sm:inline leading-none">{label}</span>
    </div>
  );
}

export default function JobCardStats({ job, variant = 'compact', showDate = true }: JobCardStatsProps) {
  const { animated } = useJobCounters(job.id, {
    views_count: job.views_count,
    applications_count: job.applications_count,
    saves_count: job.saves_count,
    comments_count: job.comments_count,
    shares_count: job.shares_count,
  });

  const hasStats =
    animated.views.value > 0 ||
    animated.applications.value > 0 ||
    (variant === 'full' && (
      animated.saves.value > 0 ||
      animated.comments.value > 0 ||
      animated.shares.value > 0
    ));

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {showDate && job.created_at && (
        <div className="inline-flex items-center gap-1 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span>{getTimeAgo(job.created_at)}</span>
        </div>
      )}

      {showDate && job.created_at && hasStats && (
        <span className="text-slate-300 text-xs select-none">·</span>
      )}

      <StatPill
        icon={Eye}
        value={animated.views.value}
        label="vues"
        iconColor="text-blue-500"
        animating={animated.views.animating}
      />

      <StatPill
        icon={Users}
        value={animated.applications.value}
        label="candidatures"
        iconColor="text-emerald-500"
        animating={animated.applications.animating}
      />

      {variant === 'full' && (
        <>
          <StatPill
            icon={Heart}
            value={animated.saves.value}
            label="favoris"
            iconColor="text-rose-500"
            animating={animated.saves.animating}
          />

          <StatPill
            icon={MessageCircle}
            value={animated.comments.value}
            label="commentaires"
            iconColor="text-amber-500"
            animating={animated.comments.animating}
          />

          <StatPill
            icon={Share2}
            value={animated.shares.value}
            label="partages"
            iconColor="text-sky-500"
            animating={animated.shares.animating}
          />
        </>
      )}

      {!showDate && !hasStats && (
        <span className="text-xs text-slate-400 italic">Nouvelle offre</span>
      )}
    </div>
  );
}
