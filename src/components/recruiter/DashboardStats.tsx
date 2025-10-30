import { Briefcase, Users, Clock, TrendingUp } from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    avgTimeToHire: number;
  };
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      icon: Briefcase,
      label: 'Offres actives',
      value: stats.activeJobs,
      total: stats.totalJobs,
      color: 'bg-blue-50 text-blue-900',
    },
    {
      icon: Users,
      label: 'Candidatures',
      value: stats.totalApplications,
      color: 'bg-green-50 text-green-900',
    },
    {
      icon: Clock,
      label: 'Délai moyen',
      value: `${stats.avgTimeToHire}j`,
      color: 'bg-orange-50 text-orange-900',
    },
    {
      icon: TrendingUp,
      label: 'Taux de matching',
      value: '78%',
      color: 'bg-teal-50 text-teal-900',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">
                {stat.value}
                {stat.total && <span className="text-lg text-gray-500">/{stat.total}</span>}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
