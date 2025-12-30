import { CheckCircle2, Circle, Clock, FileText, Send, Users, TrendingUp, Award } from 'lucide-react';

interface TimelineStep {
  id: string;
  label: string;
  description: string;
  icon: any;
  status: 'completed' | 'in_progress' | 'pending';
  date?: string;
}

interface B2BClientJourneyTimelineProps {
  currentStep: number;
  steps?: TimelineStep[];
}

export default function B2BClientJourneyTimeline({ currentStep, steps }: B2BClientJourneyTimelineProps) {
  const defaultSteps: TimelineStep[] = [
    {
      id: 'discovery',
      label: 'Découverte',
      description: 'Consultation de nos solutions B2B',
      icon: Users,
      status: currentStep >= 1 ? 'completed' : currentStep === 0 ? 'in_progress' : 'pending'
    },
    {
      id: 'lead',
      label: 'Demande',
      description: 'Formulaire confier un recrutement',
      icon: Send,
      status: currentStep >= 2 ? 'completed' : currentStep === 1 ? 'in_progress' : 'pending'
    },
    {
      id: 'quote',
      label: 'Devis',
      description: 'Réception et validation devis',
      icon: FileText,
      status: currentStep >= 3 ? 'completed' : currentStep === 2 ? 'in_progress' : 'pending'
    },
    {
      id: 'mission',
      label: 'Mission RH',
      description: 'Exécution de la mission',
      icon: Clock,
      status: currentStep >= 4 ? 'completed' : currentStep === 3 ? 'in_progress' : 'pending'
    },
    {
      id: 'report',
      label: 'Rapport',
      description: 'Rapport final et recommandations',
      icon: TrendingUp,
      status: currentStep >= 5 ? 'completed' : currentStep === 4 ? 'in_progress' : 'pending'
    },
    {
      id: 'feedback',
      label: 'Satisfaction',
      description: 'Évaluation de la mission',
      icon: Award,
      status: currentStep >= 6 ? 'completed' : currentStep === 5 ? 'in_progress' : 'pending'
    }
  ];

  const timelineSteps = steps || defaultSteps;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-green-100',
          border: 'border-green-500',
          text: 'text-green-700',
          icon: 'text-green-600',
          line: 'bg-green-500'
        };
      case 'in_progress':
        return {
          bg: 'bg-blue-100',
          border: 'border-blue-500',
          text: 'text-blue-700',
          icon: 'text-blue-600',
          line: 'bg-blue-300'
        };
      default:
        return {
          bg: 'bg-gray-100',
          border: 'border-gray-300',
          text: 'text-gray-500',
          icon: 'text-gray-400',
          line: 'bg-gray-300'
        };
    }
  };

  return (
    <div className="w-full py-8">
      <div className="hidden md:block">
        <div className="relative">
          <div className="absolute top-12 left-0 right-0 h-1 bg-gray-200">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-1000 ease-out"
              style={{ width: `${(currentStep / (timelineSteps.length - 1)) * 100}%` }}
            />
          </div>

          <div className="relative flex justify-between">
            {timelineSteps.map((step, index) => {
              const colors = getStatusColor(step.status);
              const Icon = step.icon;

              return (
                <div
                  key={step.id}
                  className="flex flex-col items-center group"
                  style={{
                    animation: step.status === 'in_progress' ? 'pulse 2s infinite' : 'none'
                  }}
                >
                  <div
                    className={`
                      relative z-10 w-24 h-24 rounded-full flex items-center justify-center
                      border-4 ${colors.border} ${colors.bg}
                      transition-all duration-300 transform
                      ${step.status === 'in_progress' ? 'scale-110 shadow-xl' : 'group-hover:scale-105'}
                    `}
                  >
                    {step.status === 'completed' ? (
                      <CheckCircle2 className={`w-10 h-10 ${colors.icon}`} />
                    ) : step.status === 'in_progress' ? (
                      <Icon className={`w-10 h-10 ${colors.icon} animate-bounce`} />
                    ) : (
                      <Circle className={`w-10 h-10 ${colors.icon}`} />
                    )}

                    {step.status === 'in_progress' && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
                      </span>
                    )}
                  </div>

                  <div className="mt-4 text-center max-w-[120px]">
                    <p className={`font-bold text-sm ${colors.text} mb-1`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-gray-600">
                      {step.description}
                    </p>
                    {step.date && (
                      <p className="text-xs text-gray-500 mt-1 font-medium">
                        {step.date}
                      </p>
                    )}
                  </div>

                  {step.status === 'completed' && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Terminé
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="md:hidden space-y-4">
        {timelineSteps.map((step, index) => {
          const colors = getStatusColor(step.status);
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative pl-8">
              {index < timelineSteps.length - 1 && (
                <div className={`absolute left-[15px] top-12 w-0.5 h-full ${colors.line}`} />
              )}

              <div className="flex items-start gap-4">
                <div
                  className={`
                    flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                    border-2 ${colors.border} ${colors.bg}
                    ${step.status === 'in_progress' ? 'animate-pulse' : ''}
                  `}
                >
                  {step.status === 'completed' ? (
                    <CheckCircle2 className={`w-5 h-5 ${colors.icon}`} />
                  ) : (
                    <Icon className={`w-5 h-5 ${colors.icon}`} />
                  )}
                </div>

                <div className="flex-1 pb-8">
                  <p className={`font-bold text-sm ${colors.text} mb-1`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-600 mb-2">
                    {step.description}
                  </p>
                  {step.date && (
                    <p className="text-xs text-gray-500 font-medium">
                      {step.date}
                    </p>
                  )}
                  {step.status === 'completed' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                      Terminé
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
