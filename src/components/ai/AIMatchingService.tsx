import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Target, TrendingUp, Briefcase, MapPin, Loader, ArrowRight, ArrowLeft } from 'lucide-react';
import { useConsumeCredits } from '../../hooks/useCreditService';
import { SERVICES } from '../../services/creditService';
import { useServiceCost } from '../../hooks/usePricing';
import CreditConfirmModal from '../credits/CreditConfirmModal';
import CreditBalance from '../credits/CreditBalance';

interface JobMatch {
  id: string;
  title: string;
  company: string;
  location: string;
  matchScore: number;
  reasons: string[];
  skills_match: number;
  experience_match: number;
  education_match: number;
}

interface AIMatchingServiceProps {
  onNavigate?: (page: string) => void;
}

export default function AIMatchingService({ onNavigate }: AIMatchingServiceProps = {}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [profileScore, setProfileScore] = useState<number | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const { consumeCredits } = useConsumeCredits();
  const serviceCost = useServiceCost(SERVICES.AI_PROFILE_ANALYSIS) || 20;

  const handleAnalyzeClick = () => {
    setShowCreditModal(true);
  };

  const handleCreditConfirm = async (success: boolean, result?: any) => {
    if (!success) {
      alert(result?.message || 'Erreur lors de la consommation des crédits');
      return;
    }

    await analyzeProfile();
  };

  const analyzeProfile = async () => {
    setAnalyzing(true);
    try {
      const { data: profile } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (!profile) {
        alert('Veuillez compléter votre profil avant l\'analyse');
        return;
      }

      const { data: jobs } = await supabase
        .from('jobs')
        .select('*, companies(name)')
        .eq('status', 'published')
        .limit(20);

      if (!jobs) return;

      const analyzedMatches: JobMatch[] = jobs.map(job => {
        const skillsMatch = calculateSkillsMatch(profile.skills || [], job.required_skills || []);
        const experienceMatch = calculateExperienceMatch(
          profile.years_of_experience || 0,
          job.min_experience || 0
        );
        const educationMatch = calculateEducationMatch(
          profile.education_level,
          job.education_level
        );

        const matchScore = Math.round(
          (skillsMatch * 0.5 + experienceMatch * 0.3 + educationMatch * 0.2)
        );

        const reasons = generateMatchReasons(skillsMatch, experienceMatch, educationMatch);

        return {
          id: job.id,
          title: job.title,
          company: job.companies?.name || 'N/A',
          location: job.location,
          matchScore,
          reasons,
          skills_match: skillsMatch,
          experience_match: experienceMatch,
          education_match: educationMatch,
        };
      });

      const sortedMatches = analyzedMatches
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10);

      setMatches(sortedMatches);

      const avgScore = sortedMatches.length > 0
        ? Math.round(sortedMatches.reduce((sum, m) => sum + m.matchScore, 0) / sortedMatches.length)
        : 0;
      setProfileScore(avgScore);

    } catch (error) {
      console.error('Error analyzing profile:', error);
      alert('Erreur lors de l\'analyse');
    } finally {
      setAnalyzing(false);
    }
  };

  const calculateSkillsMatch = (userSkills: string[], jobSkills: string[]): number => {
    if (!jobSkills.length) return 100;
    const matchingSkills = userSkills.filter(skill =>
      jobSkills.some(js => js.toLowerCase().includes(skill.toLowerCase()))
    );
    return Math.round((matchingSkills.length / jobSkills.length) * 100);
  };

  const calculateExperienceMatch = (userExp: number, requiredExp: number): number => {
    if (userExp >= requiredExp) return 100;
    return Math.round((userExp / requiredExp) * 100);
  };

  const calculateEducationMatch = (userEdu: string, jobEdu: string): number => {
    const levels: Record<string, number> = {
      'Aucun diplôme': 1,
      'BEPC': 2,
      'BAC': 3,
      'BTS/DUT': 4,
      'Licence': 5,
      'Master': 6,
      'Doctorat': 7,
    };
    const userLevel = levels[userEdu] || 0;
    const jobLevel = levels[jobEdu] || 0;
    return userLevel >= jobLevel ? 100 : Math.round((userLevel / jobLevel) * 100);
  };

  const generateMatchReasons = (skills: number, exp: number, edu: number): string[] => {
    const reasons: string[] = [];
    if (skills >= 80) reasons.push('Excellente correspondance des compétences');
    else if (skills >= 60) reasons.push('Bonne correspondance des compétences');
    else reasons.push('Compétences à développer');

    if (exp >= 80) reasons.push('Expérience adéquate');
    else reasons.push('Expérience à acquérir');

    if (edu >= 100) reasons.push('Niveau d\'études requis atteint');

    return reasons;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {onNavigate && (
        <button
          onClick={() => onNavigate('premium-ai')}
          className="mb-6 flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Retour aux Services IA</span>
        </button>
      )}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analyse & Matching IA</h1>
            <p className="text-gray-600">Découvrez les offres qui correspondent le mieux à votre profil</p>
          </div>
        </div>

        {profileScore !== null && (
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Score global de votre profil</p>
                <p className="text-4xl font-bold text-blue-600">{profileScore}/100</p>
              </div>
              <div className="text-right">
                <TrendingUp className="w-12 h-12 text-blue-600 mb-2" />
                <p className="text-sm text-gray-600">{matches.length} offres analysées</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            Coût: <span className="font-bold text-blue-600">20 crédits</span>
          </div>
          <CreditBalance />
        </div>

        <button
          onClick={handleAnalyzeClick}
          disabled={analyzing}
          className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {analyzing ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Analyse en cours...
            </>
          ) : (
            <>
              <Target className="w-5 h-5" />
              {matches.length > 0 ? 'Relancer l\'analyse' : 'Lancer l\'analyse'}
            </>
          )}
        </button>
      </div>

      {matches.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Meilleures correspondances</h2>
          {matches.map((match) => (
            <div
              key={match.id}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{match.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {match.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {match.location}
                    </span>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-full font-bold ${getScoreColor(match.matchScore)}`}>
                  {match.matchScore}%
                </div>
              </div>

              <div className="mb-4">
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Compétences</p>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${match.skills_match}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Expérience</p>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${match.experience_match}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Formation</p>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${match.education_match}%` }}
                      />
                    </div>
                  </div>
                </div>

                <ul className="space-y-1">
                  {match.reasons.map((reason, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => window.location.href = `/jobs/${match.id}`}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                Voir l'offre
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <CreditConfirmModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        onConfirm={handleCreditConfirm}
        serviceCode={SERVICES.AI_JOB_MATCHING}
        serviceName="Matching Emplois IA"
        serviceCost={serviceCost}
        description="Analysez votre profil et trouvez les emplois qui correspondent le mieux"
      />
    </div>
  );
}