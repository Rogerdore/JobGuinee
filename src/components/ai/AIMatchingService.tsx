import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Target, TrendingUp, Briefcase, MapPin, Loader, ArrowRight, ArrowLeft, User, Edit3, Check, AlertCircle, Sparkles } from 'lucide-react';
import { useConsumeCredits } from '../../hooks/useCreditService';
import { SERVICES } from '../../services/creditService';
import { useServiceCost } from '../../hooks/usePricing';
import CreditConfirmModal from '../credits/CreditConfirmModal';
import CreditBalance from '../credits/CreditBalance';
import TemplateSelector from './TemplateSelector';
import { IAConfigService } from '../../services/iaConfigService';
import UserProfileService from '../../services/userProfileService';

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

type InputMode = 'profile' | 'manual';

export default function AIMatchingService({ onNavigate }: AIMatchingServiceProps = {}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [profileScore, setProfileScore] = useState<number | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const { consumeCredits } = useConsumeCredits();
  const serviceCost = useServiceCost(SERVICES.AI_JOB_MATCHING) || 20;

  const [inputMode, setInputMode] = useState<InputMode>('profile');
  const [matchingData, setMatchingData] = useState<any>({
    competences: [],
    experience: 0,
    niveau_etude: '',
    localisation_preferee: '',
    type_contrat_prefere: 'CDI',
    secteur_prefere: ''
  });
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileSummary, setProfileSummary] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    if (inputMode === 'profile') {
      loadProfileData();
    } else {
      setProfileLoaded(false);
      setProfileSummary('');
    }
  }, [inputMode, user]);

  const loadProfileData = async () => {
    if (!user) return;

    setLoading(true);
    setValidationErrors([]);

    try {
      const result = await UserProfileService.loadUserData(user.id);

      if (result.success && result.profile) {
        const input = UserProfileService.buildMatchingInputFromProfile(
          result.profile,
          result.cv
        );
        setMatchingData(input);
        setProfileLoaded(true);

        const summary = `
          ✓ ${input.competences.length} compétences
          ✓ ${input.experience} années d'expérience
          ✓ Niveau: ${input.niveau_etude}
          ✓ Localisation: ${input.localisation_preferee || 'Non spécifiée'}
        `;
        setProfileSummary(summary);

        if (input.competences.length === 0) {
          setValidationErrors(['Veuillez ajouter des compétences à votre profil']);
        }
      } else {
        setProfileLoaded(false);
        setValidationErrors(['Aucun profil trouvé']);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setValidationErrors(['Erreur lors du chargement du profil']);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeClick = () => {
    if (!user) {
      alert('Vous devez être connecté');
      return;
    }

    if (matchingData.competences.length === 0) {
      setValidationErrors(['Veuillez ajouter au moins une compétence']);
      return;
    }

    setValidationErrors([]);
    setShowCreditModal(true);
  };

  const handleCreditConfirm = async () => {
    setShowCreditModal(false);
    await analyzeProfile();
  };

  const analyzeProfile = async () => {
    setAnalyzing(true);
    try {
      const creditResult = await consumeCredits(SERVICES.AI_JOB_MATCHING);
      if (!creditResult.success) {
        alert(creditResult.message);
        setAnalyzing(false);
        return;
      }

      const config = await IAConfigService.getConfig('ai_matching');
      if (!config) {
        throw new Error('Configuration IA non trouvée');
      }

      const validationResult = IAConfigService.validateInput(matchingData, config.input_schema);
      if (!validationResult.valid) {
        throw new Error('Données invalides: ' + validationResult.errors.join(', '));
      }

      const { data: profile } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (!profile && inputMode === 'profile') {
        alert('Veuillez compléter votre profil avant l\'analyse');
        setAnalyzing(false);
        return;
      }

      const { data: jobs } = await supabase
        .from('jobs')
        .select('*, companies(name)')
        .eq('status', 'published')
        .limit(20);

      if (!jobs) {
        setAnalyzing(false);
        return;
      }

      const analyzedMatches: JobMatch[] = jobs.map(job => {
        const skillsMatch = calculateSkillsMatch(matchingData.competences || [], job.required_skills || []);
        const experienceMatch = calculateExperienceMatch(
          matchingData.experience || 0,
          job.min_experience || 0
        );
        const educationMatch = calculateEducationMatch(
          matchingData.niveau_etude,
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

      const outputData = {
        matches: sortedMatches.map(m => ({
          job_id: m.id,
          title: m.title,
          score: m.matchScore,
          reasons: m.reasons
        })),
        profile_score: avgScore,
        total_analyzed: jobs.length
      };

      await IAConfigService.logServiceUsage(
        user!.id,
        'ai_matching',
        matchingData,
        outputData,
        creditResult.cost || serviceCost
      );

      alert('Analyse terminée!');

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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-center mb-4">Connexion requise</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        {onNavigate && (
          <button
            onClick={() => onNavigate('premium-ai')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>
        )}
        <CreditBalance />
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Target className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Matching IA</h1>
            <p className="text-gray-600">Trouvez les emplois correspondant à votre profil</p>
          </div>
        </div>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-800">
              <strong>Coût:</strong> {serviceCost} crédits
            </p>
          </div>
        </div>

        <div className="mb-8 bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4">Source des données</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              onClick={() => setInputMode('profile')}
              className={`p-4 rounded-lg border-2 ${
                inputMode === 'profile' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <User className={`w-6 h-6 ${inputMode === 'profile' ? 'text-blue-600' : 'text-gray-500'}`} />
                <div className="text-left">
                  <p className="font-semibold">Utiliser mon profil</p>
                  <p className="text-xs text-gray-600">Auto</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setInputMode('manual')}
              className={`p-4 rounded-lg border-2 ${
                inputMode === 'manual' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Edit3 className={`w-6 h-6 ${inputMode === 'manual' ? 'text-blue-600' : 'text-gray-500'}`} />
                <div className="text-left">
                  <p className="font-semibold">Saisie manuelle</p>
                  <p className="text-xs text-gray-600">Formulaire</p>
                </div>
              </div>
            </button>
          </div>

          {inputMode === 'profile' && profileLoaded && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <Check className="w-5 h-5 text-green-600 mb-2" />
              <p className="font-medium text-green-800 mb-2">Profil chargé</p>
              <pre className="text-xs text-green-700 whitespace-pre-line">{profileSummary}</pre>
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 mb-2" />
              <ul className="text-sm text-red-700 list-disc list-inside">
                {validationErrors.map((error, idx) => <li key={idx}>{error}</li>)}
              </ul>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Chargement...</p>
          </div>
        ) : (
          <>
            <TemplateSelector
              serviceCode="ai_matching"
              selectedTemplateId={selectedTemplateId}
              onSelect={setSelectedTemplateId}
              className="mb-6"
            />

            {inputMode === 'manual' && (
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Années d'expérience"
                    value={matchingData.experience}
                    onChange={(e) => setMatchingData({ ...matchingData, experience: parseInt(e.target.value) || 0 })}
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Niveau d'études"
                    value={matchingData.niveau_etude}
                    onChange={(e) => setMatchingData({ ...matchingData, niveau_etude: e.target.value })}
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Localisation préférée"
                    value={matchingData.localisation_preferee}
                    onChange={(e) => setMatchingData({ ...matchingData, localisation_preferee: e.target.value })}
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Secteur préféré"
                    value={matchingData.secteur_prefere}
                    onChange={(e) => setMatchingData({ ...matchingData, secteur_prefere: e.target.value })}
                    className="px-4 py-2 border rounded-lg"
                  />
                </div>
                <textarea
                  placeholder="Compétences (séparées par des virgules)"
                  value={matchingData.competences.join(', ')}
                  onChange={(e) => setMatchingData({
                    ...matchingData,
                    competences: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
            )}
          </>
        )}

        <div className="flex justify-center">
          <button
            onClick={handleAnalyzeClick}
            disabled={analyzing || validationErrors.length > 0 || loading}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {analyzing ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Analyser ({serviceCost} crédits)
              </>
            )}
          </button>
        </div>
      </div>

      {matches.length > 0 && (
        <>
          {profileScore !== null && (
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
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
        </>
      )}
      </div>

      {showCreditModal && (
        <CreditConfirmModal
          serviceName="Matching Emplois IA"
          cost={serviceCost}
          onConfirm={handleCreditConfirm}
          onCancel={() => setShowCreditModal(false)}
        />
      )}
    </div>
  );
}
