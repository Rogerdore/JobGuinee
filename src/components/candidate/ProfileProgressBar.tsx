import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  FileText,
  Briefcase,
  GraduationCap,
  Award,
  User,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { calculateCandidateCompletion } from '../../utils/profileCompletion';

interface ProfileStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  action: () => void;
  weight: number;
}

interface ProfileProgressBarProps {
  candidateProfileId?: string;
  onNavigate?: (section: string) => void;
  compact?: boolean;
}

export default function ProfileProgressBar({
  candidateProfileId,
  onNavigate,
  compact = false
}: ProfileProgressBarProps) {
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<ProfileStep[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (user) {
      calculateProgress();
    }
  }, [user, candidateProfileId]);

  const calculateProgress = async () => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user?.id)
        .maybeSingle();

      const { data: profile } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('profile_id', user?.id)
        .maybeSingle();

      if (!profile) {
        setProgress(0);
        return;
      }

      const profileSteps: ProfileStep[] = [
        {
          id: 'cv',
          title: 'Ajouter mon CV',
          description: 'Téléchargez votre CV pour une candidature rapide',
          icon: FileText,
          completed: !!profile.cv_url,
          action: () => onNavigate?.('documents'),
          weight: 25
        },
        {
          id: 'experience',
          title: 'Ajouter mes expériences',
          description: 'Détaillez votre parcours professionnel',
          icon: Briefcase,
          completed: profile.work_experience && JSON.stringify(profile.work_experience) !== '[]',
          action: () => onNavigate?.('experience'),
          weight: 20
        },
        {
          id: 'education',
          title: 'Ajouter mes diplômes',
          description: 'Indiquez votre formation académique',
          icon: GraduationCap,
          completed: profile.education && JSON.stringify(profile.education) !== '[]',
          action: () => onNavigate?.('education'),
          weight: 15
        },
        {
          id: 'skills',
          title: 'Ajouter mes compétences',
          description: 'Listez vos compétences techniques et soft skills',
          icon: Award,
          completed: profile.skills && profile.skills.length > 0,
          action: () => onNavigate?.('skills'),
          weight: 15
        },
        {
          id: 'profile',
          title: 'Compléter mes informations',
          description: 'Renseignez vos coordonnées et préférences',
          icon: User,
          completed: !!(profileData?.full_name && profile.location && profileData?.phone),
          action: () => onNavigate?.('info'),
          weight: 25
        }
      ];

      setSteps(profileSteps);

      const calculatedProgress = calculateCandidateCompletion({
        full_name: profileData?.full_name,
        desired_position: profile.desired_position,
        bio: profile.bio,
        phone: profileData?.phone,
        location: profile.location,
        experience_years: profile.experience_years,
        education_level: profile.education_level,
        skills: profile.skills,
        languages: profile.languages,
        cv_url: profile.cv_url,
        linkedin_url: profile.linkedin_url,
        portfolio_url: profile.portfolio_url,
        desired_salary_min: profile.desired_salary_min?.toString(),
        desired_salary_max: profile.desired_salary_max?.toString(),
      });

      setProgress(calculatedProgress);

      await supabase
        .from('candidate_profiles')
        .update({ profile_completion_percentage: calculatedProgress })
        .eq('profile_id', user?.id);
    } catch (error) {
      console.error('Error calculating progress:', error);
    }
  };

  const nextStep = steps.find(step => !step.completed);
  const completedSteps = steps.filter(step => step.completed).length;

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-gray-900">
              Profil complété à {progress}%
            </span>
          </div>
          {progress >= 80 ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-orange-500" />
          )}
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              progress >= 80 ? 'bg-green-500' : 'bg-orange-500'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {progress < 80 && nextStep && (
          <button
            onClick={nextStep.action}
            className="w-full mt-2 text-sm text-green-700 hover:text-green-800 font-medium flex items-center justify-between group"
          >
            <span>Prochaine étape : {nextStep.title}</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-green-50 via-green-100 to-blue-50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Complétez votre profil
              </h3>
              <p className="text-sm text-gray-600">
                {completedSteps} sur {steps.length} étapes terminées
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600">
              {progress}%
            </div>
          </div>
        </div>

        <div className="w-full bg-white rounded-full h-4 shadow-inner">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${
              progress >= 80
                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : 'bg-gradient-to-r from-orange-400 to-orange-500'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {progress < 80 && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-900 font-medium">
              📊 Un profil complété à 80% est <strong>3x plus visible</strong> par les recruteurs
            </p>
          </div>
        )}
      </div>

      <div className="p-6">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between text-left mb-4"
        >
          <span className="font-semibold text-gray-900">
            {showDetails ? 'Masquer les détails' : 'Voir les étapes à compléter'}
          </span>
          <ChevronRight
            className={`w-5 h-5 text-gray-400 transition-transform ${
              showDetails ? 'rotate-90' : ''
            }`}
          />
        </button>

        {showDetails && (
          <div className="space-y-3">
            {steps.map((step) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    step.completed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200 hover:border-green-300 hover:bg-green-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 ${
                        step.completed
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      <StepIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4
                        className={`font-semibold mb-1 ${
                          step.completed ? 'text-green-900' : 'text-gray-900'
                        }`}
                      >
                        {step.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {step.description}
                      </p>
                      {!step.completed && (
                        <button
                          onClick={step.action}
                          className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1 group"
                        >
                          <span>Compléter maintenant</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      )}
                    </div>
                    {step.completed && (
                      <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
