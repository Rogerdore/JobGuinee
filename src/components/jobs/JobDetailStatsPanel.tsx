import { Eye, Users, Heart, MessageCircle, Share2 } from 'lucide-react';
import { useJobCounters } from '../../hooks/useJobCounters';

interface JobDetailStatsPanelProps {
  jobId: string;
  initialViews?: number;
  initialApplications?: number;
  initialSaves?: number;
  initialComments?: number;
  initialShares?: number;
}

interface StatBlockProps {
  icon: React.ElementType;
  value: number;
  label: string;
  bgColor: string;
  textColor: string;
  animating: boolean;
}

function StatBlock({ icon: Icon, value, label, bgColor, textColor, animating }: StatBlockProps) {
  return (
    <div className="text-center group">
      <div
        className={`
          flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-2
          transition-all duration-300
          ${bgColor}
          ${animating ? 'scale-110 shadow-lg' : 'scale-100'}
        `}
      >
        <Icon className={`w-6 h-6 text-white transition-transform duration-300 ${animating ? 'scale-110' : ''}`} />
      </div>
      <div
        className={`
          text-2xl font-bold tabular-nums transition-all duration-300
          ${animating ? `${textColor} counter-pop scale-110` : 'text-gray-900'}
        `}
      >
        {value.toLocaleString('fr-FR')}
      </div>
      <div className={`text-xs font-medium mt-0.5 transition-colors duration-300 ${animating ? textColor : 'text-gray-500'}`}>
        {label}
      </div>
    </div>
  );
}

export default function JobDetailStatsPanel({
  jobId,
  initialViews = 0,
  initialApplications = 0,
  initialSaves = 0,
  initialComments = 0,
  initialShares = 0,
}: JobDetailStatsPanelProps) {
  const { animated } = useJobCounters(jobId, {
    views_count: initialViews,
    applications_count: initialApplications,
    saves_count: initialSaves,
    comments_count: initialComments,
    shares_count: initialShares,
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
      <StatBlock
        icon={Eye}
        value={animated.views.value}
        label="Vues"
        bgColor="bg-[#0E2F56]"
        textColor="text-blue-700"
        animating={animated.views.animating}
      />
      <StatBlock
        icon={Users}
        value={animated.applications.value}
        label="Candidatures"
        bgColor="bg-emerald-600"
        textColor="text-emerald-700"
        animating={animated.applications.animating}
      />
      <StatBlock
        icon={Heart}
        value={animated.saves.value}
        label="Favoris"
        bgColor="bg-rose-500"
        textColor="text-rose-700"
        animating={animated.saves.animating}
      />
      <StatBlock
        icon={MessageCircle}
        value={animated.comments.value}
        label="Commentaires"
        bgColor="bg-amber-500"
        textColor="text-amber-700"
        animating={animated.comments.animating}
      />
      <StatBlock
        icon={Share2}
        value={animated.shares.value}
        label="Partages"
        bgColor="bg-sky-500"
        textColor="text-sky-700"
        animating={animated.shares.animating}
      />
    </div>
  );
}
