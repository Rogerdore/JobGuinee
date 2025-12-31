import { CheckCircle2, X, TrendingUp, Eye, Target, Star, Zap, ArrowRight, Home } from 'lucide-react';
import { APPLY_FLOW_MESSAGES, getProfileCompletionMessage } from '../../constants/applyFlowMessages';

interface ApplicationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationReference: string;
  nextSteps: string[];
  profileCompletionPercentage: number;
  jobTitle?: string;
  onNavigate?: (page: string, param?: string) => void;
}

export default function ApplicationSuccessModal({
  isOpen,
  onClose,
  applicationReference,
  nextSteps,
  profileCompletionPercentage,
  jobTitle,
  onNavigate
}: ApplicationSuccessModalProps) {
  if (!isOpen) return null;

  const completionMessage = getProfileCompletionMessage(profileCompletionPercentage);
  const shouldShowProfileCTA = profileCompletionPercentage < 80;

  const benefitIcons = {
    eye: Eye,
    target: Target,
    star: Star,
    zap: Zap
  };

  const handleCompleteProfile = () => {
    onClose();
    if (onNavigate) {
      onNavigate('candidate-dashboard');
    }
  };

  const handleViewDashboard = () => {
    onClose();
    if (onNavigate) {
      onNavigate('candidate-dashboard');
    }
  };

  const handleDiscoverPremium = () => {
    onClose();
    if (onNavigate) {
      onNavigate('premium-ai');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="relative bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-8 sm:p-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-green-500 p-5 rounded-full shadow-lg animate-bounce">
              <CheckCircle2 className="w-16 h-16 text-white" />
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">
            {APPLY_FLOW_MESSAGES.success.title}
          </h2>

          <p className="text-center text-gray-600 text-lg mb-6">
            {APPLY_FLOW_MESSAGES.success.subtitle}
          </p>

          {jobTitle && (
            <div className="bg-white bg-opacity-70 rounded-xl p-4 mb-6 text-center">
              <p className="text-sm text-gray-500 mb-1">Offre postulée</p>
              <p className="font-semibold text-gray-900">{jobTitle}</p>
            </div>
          )}

          <div className="bg-white bg-opacity-70 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">
                {APPLY_FLOW_MESSAGES.success.reference}
              </span>
              <span className="text-lg font-bold text-green-600 font-mono">
                #{applicationReference}
              </span>
            </div>

            {nextSteps && nextSteps.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  {APPLY_FLOW_MESSAGES.success.nextSteps.title}
                </p>
                {nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-green-600">{index + 1}</span>
                    </div>
                    <p className="text-sm text-gray-600">{step}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {shouldShowProfileCTA && (
          <div className="p-8 sm:p-10 bg-gradient-to-br from-blue-50 to-indigo-50 border-t-4 border-blue-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {APPLY_FLOW_MESSAGES.success.profileCTA.title}
                </h3>
                <p className="text-blue-700 text-sm font-medium">
                  {APPLY_FLOW_MESSAGES.success.profileCTA.subtitle}
                </p>
              </div>
            </div>

            <div className="mb-6 p-5 bg-white rounded-xl shadow-sm border-2 border-blue-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">
                  {APPLY_FLOW_MESSAGES.success.profileCTA.currentCompletion}
                </span>
                <span className="text-2xl font-bold" style={{ color: completionMessage.color === 'green' ? '#10b981' : completionMessage.color === 'yellow' ? '#f59e0b' : completionMessage.color === 'orange' ? '#f97316' : '#ef4444' }}>
                  {profileCompletionPercentage}%
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${profileCompletionPercentage}%`,
                    backgroundColor: completionMessage.color === 'green' ? '#10b981' : completionMessage.color === 'yellow' ? '#f59e0b' : completionMessage.color === 'orange' ? '#f97316' : '#ef4444'
                  }}
                />
              </div>

              <p className="text-sm text-gray-600 italic">
                {completionMessage.message}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {APPLY_FLOW_MESSAGES.success.profileCTA.benefits.map((benefit, index) => {
                const IconComponent = benefitIcons[benefit.icon as keyof typeof benefitIcons];
                return (
                  <div
                    key={index}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">
                          {benefit.title}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {profileCompletionPercentage < 80 && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  {APPLY_FLOW_MESSAGES.success.profileCTA.missingElements}
                </p>
                <ul className="space-y-1.5">
                  {APPLY_FLOW_MESSAGES.success.profileCTA.suggestions.slice(0, 3).map((suggestion, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-blue-700">
                      <ArrowRight className="w-4 h-4 flex-shrink-0" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCompleteProfile}
                className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
              >
                <TrendingUp className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {APPLY_FLOW_MESSAGES.success.profileCTA.buttons.completeProfile}
              </button>

              <button
                onClick={handleDiscoverPremium}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-4 rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                {APPLY_FLOW_MESSAGES.success.profileCTA.buttons.discoverPremium}
              </button>
            </div>
          </div>
        )}

        <div className="p-8 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleViewDashboard}
              className="px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              {APPLY_FLOW_MESSAGES.success.buttons.viewApplications}
            </button>

            <button
              onClick={onClose}
              className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              {APPLY_FLOW_MESSAGES.success.buttons.backToJobs}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
