import { useEffect, useState } from 'react';
import { Briefcase, FileText, Bell, Settings, Upload, MapPin, Award, TrendingUp, Target, Calendar, Clock, MessageCircle, Eye, Heart, Star, CheckCircle, AlertCircle, Sparkles, Brain, Crown, Lock, Unlock, Download, Share2, CreditCard as Edit, Trash2, Filter, Search, BarChart3, BookOpen, Users, Zap, Shield, Cloud, DollarSign, ChevronRight, X, Plus, GraduationCap, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Application, Job, Company, CandidateProfile } from '../lib/supabase';

interface CandidateDashboardProps {
  onNavigate: (page: string, jobId?: string) => void;
}

interface Formation {
  id: string;
  title: string;
  status: string;
  progress?: number;
}

export default function CandidateDashboard({ onNavigate }: CandidateDashboardProps) {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'profile' | 'formations' | 'alerts' | 'messages' | 'documents' | 'premium'>('dashboard');
  const [applications, setApplications] = useState<(Application & { jobs: Job & { companies: Company } })[]>([]);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  const [formData, setFormData] = useState({
    skills: [] as string[],
    experience_years: 0,
    education_level: '',
    location: '',
    availability: 'immediate',
    desired_position: '',
    desired_salary_min: '',
    desired_salary_max: '',
  });
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    loadData();
  }, [profile?.id]);

  const loadData = async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const [appsData, profileData] = await Promise.all([
        supabase
          .from('applications')
          .select('*, jobs(*, companies(*))')
          .eq('candidate_id', profile.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('candidate_profiles')
          .select('*')
          .eq('profile_id', profile.id)
          .maybeSingle(),
      ]);

      if (appsData.data) setApplications(appsData.data as any);
      if (profileData.data) {
        setCandidateProfile(profileData.data);
        setFormData({
          skills: profileData.data.skills || [],
          experience_years: profileData.data.experience_years || 0,
          education_level: profileData.data.education_level || '',
          location: profileData.data.location || '',
          availability: profileData.data.availability || 'immediate',
          desired_position: profileData.data.desired_position || '',
          desired_salary_min: profileData.data.desired_salary_min?.toString() || '',
          desired_salary_max: profileData.data.desired_salary_max?.toString() || '',
        });
      }
    } catch (error) {
      console.error('Error loading candidate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile?.id) return;

    const dataToSave = {
      profile_id: profile.id,
      title: formData.desired_position,
      skills: formData.skills,
      experience_years: Number(formData.experience_years),
      education_level: formData.education_level,
      location: formData.location,
      availability: formData.availability,
      desired_salary_min: formData.desired_salary_min ? Number(formData.desired_salary_min) : null,
      desired_salary_max: formData.desired_salary_max ? Number(formData.desired_salary_max) : null,
    };

    if (candidateProfile) {
      await supabase
        .from('candidate_profiles')
        .update(dataToSave)
        .eq('profile_id', profile.id);
    } else {
      await supabase.from('candidate_profiles').insert(dataToSave);
    }

    alert('Profil mis à jour avec succès!');
    loadData();
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter((s) => s !== skill) });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      shortlisted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      accepted: 'bg-emerald-100 text-emerald-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      reviewed: 'Examinée',
      shortlisted: 'Présélectionné',
      rejected: 'Refusée',
      accepted: 'Acceptée',
    };
    return labels[status] || status;
  };

  const calculateProfileCompletion = () => {
    let completion = 0;
    const fields = [
      formData.desired_position,
      formData.education_level,
      formData.location,
      formData.skills.length > 0,
      formData.experience_years > 0,
      formData.desired_salary_min,
    ];
    completion = (fields.filter(Boolean).length / fields.length) * 100;
    return Math.round(completion);
  };

  const getAIScore = () => {
    return applications.length > 0
      ? Math.round(applications.reduce((sum, app) => sum + (app.ai_match_score || 0), 0) / applications.length)
      : 0;
  };

  const premiumServices = [
    {
      icon: Brain,
      title: 'Analyse IA de profil',
      description: 'Score CV vs offre + suggestions formations',
      price: 'Inclus',
      color: 'bg-purple-100 text-purple-700',
      details: {
        fullDescription: 'Analyse automatique complète de votre profil avec intelligence artificielle pour maximiser vos chances de succès.',
        features: [
          'Score de compatibilité (0-100) entre votre profil et les offres',
          'Analyse détaillée des compétences requises vs vos compétences',
          'Suggestions de formations pour combler les lacunes',
          'Recommandations personnalisées d\'amélioration',
          'Mise à jour en temps réel du matching',
          'Top 10 des meilleures offres correspondantes'
        ],
        benefits: 'Gagnez du temps et ciblez les offres qui correspondent vraiment à votre profil.',
      }
    },
    {
      icon: FileText,
      title: 'Création CV / Lettre IA',
      description: 'Génération automatique design professionnel',
      price: '100 000 GNF',
      color: 'bg-blue-100 text-blue-700',
      details: {
        fullDescription: 'Création automatique de CV et lettres de motivation professionnels optimisés pour les systèmes de recrutement.',
        features: [
          'Génération de CV au format HTML téléchargeable',
          'Design moderne et professionnel',
          'Optimisé pour les systèmes ATS (Applicant Tracking System)',
          'Lettres de motivation personnalisées par offre',
          'Choix entre 3 tons : formel, créatif, simple',
          'Import automatique depuis votre profil',
          'Modifications et ajustements illimités'
        ],
        benefits: 'Présentez-vous de manière professionnelle et augmentez vos chances de décrocher des entretiens.',
      }
    },
    {
      icon: Bell,
      title: 'Alertes IA ciblées',
      description: 'Détection auto d\'offres correspondantes',
      price: 'Inclus',
      color: 'bg-orange-100 text-orange-700',
      details: {
        fullDescription: 'Système intelligent de notification qui détecte automatiquement les offres correspondant à votre profil.',
        features: [
          'Notifications instantanées par email et SMS',
          'Analyse automatique de toutes les nouvelles offres',
          'Filtrage intelligent basé sur vos critères',
          'Alertes personnalisées par secteur et compétences',
          'Résumé hebdomadaire des opportunités',
          'Désactivation/réactivation flexible'
        ],
        benefits: 'Ne ratez plus jamais une opportunité qui vous correspond.',
      }
    },
    {
      icon: MessageCircle,
      title: 'Chatbot Travail & Emploi',
      description: 'Réponses Code du Travail guinéen',
      price: 'Inclus',
      color: 'bg-green-100 text-green-700',
      details: {
        fullDescription: 'Assistant virtuel disponible 24/7 pour répondre à toutes vos questions sur l\'emploi et le Code du Travail guinéen.',
        features: [
          'Réponses instantanées et personnalisées',
          'Base de connaissances sur le Code du Travail guinéen',
          'Conseils sur la préparation d\'entretiens',
          'Stratégies de recherche d\'emploi',
          'Aide à la négociation salariale',
          'Conseils de développement de carrière',
          'Historique des conversations sauvegardé'
        ],
        benefits: 'Obtenez des réponses immédiates à vos questions professionnelles, 24h/24.',
      }
    },
    {
      icon: BarChart3,
      title: 'Rapport mensuel IA',
      description: 'Stats candidatures, matching, formations',
      price: '150 000 GNF/mois',
      color: 'bg-indigo-100 text-indigo-700',
      details: {
        fullDescription: 'Rapport détaillé mensuel avec analyses et statistiques de votre activité sur la plateforme.',
        features: [
          'Statistiques de candidatures (envoyées, vues, réponses)',
          'Évolution de votre score de matching',
          'Analyse des formations suivies',
          'Comparaison avec d\'autres candidats de votre secteur',
          'Recommandations d\'amélioration personnalisées',
          'Graphiques et visualisations claires',
          'Export PDF pour vos archives'
        ],
        benefits: 'Suivez votre progression et optimisez votre stratégie de recherche d\'emploi.',
      }
    },
    {
      icon: Users,
      title: 'Coaching carrière IA',
      description: 'Simulations entretien + feedbacks',
      price: '250 000 GNF',
      color: 'bg-pink-100 text-pink-700',
      details: {
        fullDescription: 'Programme de coaching complet avec simulations d\'entretiens et feedback détaillé pour réussir vos recrutements.',
        features: [
          'Simulations d\'entretiens réalistes',
          'Questions personnalisées selon le poste visé',
          'Feedback détaillé sur vos réponses',
          'Analyse de votre communication et présentation',
          'Conseils d\'amélioration ciblés',
          'Entraînement illimité',
          'Suivi de progression'
        ],
        benefits: 'Préparez-vous efficacement et arrivez confiant à vos entretiens.',
      }
    },
    {
      icon: Shield,
      title: 'Badge Profil vérifié',
      description: 'Vérification + scoring IA + visibilité',
      price: '50 000 GNF',
      color: 'bg-yellow-100 text-yellow-700',
      details: {
        fullDescription: 'Certification de votre profil avec badge visible pour augmenter votre crédibilité auprès des recruteurs.',
        features: [
          'Vérification d\'identité complète',
          'Badge visible sur votre profil',
          'Score de crédibilité IA',
          'Augmentation de visibilité +30%',
          'Priorité dans les recherches',
          'Confiance accrue des recruteurs',
          'Valable 1 an'
        ],
        benefits: 'Démarquez-vous avec un profil vérifié et gagnez la confiance des recruteurs.',
      }
    },
    {
      icon: Cloud,
      title: 'Espace cloud personnel',
      description: 'Sauvegarde sécurisée documents RH',
      price: 'Inclus Premium',
      color: 'bg-teal-100 text-teal-700',
      details: {
        fullDescription: 'Espace de stockage sécurisé pour tous vos documents professionnels et RH.',
        features: [
          '10 Go de stockage cloud',
          'Sauvegarde automatique de vos documents',
          'Accès depuis n\'importe quel appareil',
          'Partage sécurisé avec les recruteurs',
          'Organisation par dossiers',
          'Historique des versions',
          'Chiffrement de bout en bout'
        ],
        benefits: 'Gardez tous vos documents professionnels organisés et accessibles en tout temps.',
      }
    },
  ];

  useEffect(() => {
    if (!user) {
      onNavigate('login');
    } else if (profile && profile.user_type !== 'candidate') {
      alert('Cet espace est réservé aux candidats');
      onNavigate('home');
    }
  }, [user, profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[#0E2F56]"></div>
          <p className="mt-4 text-gray-600">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const profileCompletion = calculateProfileCompletion();
  const aiScore = getAIScore();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#0E2F56] to-blue-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Bonjour, {profile?.full_name} 👋</h1>
              <p className="text-blue-100">Bienvenue dans votre espace candidat intelligent</p>
            </div>
            {isPremium && (
              <div className="flex items-center gap-2 px-4 py-2 bg-[#FF8C00] rounded-full">
                <Crown className="w-5 h-5" />
                <span className="font-bold">Premium</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 text-sm">Offres consultées</span>
                <Eye className="w-5 h-5 text-blue-200" />
              </div>
              <div className="text-3xl font-bold">12</div>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 text-sm">Candidatures</span>
                <Briefcase className="w-5 h-5 text-blue-200" />
              </div>
              <div className="text-3xl font-bold">{applications.length}</div>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 text-sm">Formations</span>
                <BookOpen className="w-5 h-5 text-blue-200" />
              </div>
              <div className="text-3xl font-bold">{formations.length}</div>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 text-sm">Score IA</span>
                <Sparkles className="w-5 h-5 text-blue-200" />
              </div>
              <div className="text-3xl font-bold">{aiScore}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Tableau de bord', icon: BarChart3 },
              { id: 'applications', label: `Candidatures (${applications.length})`, icon: Briefcase },
              { id: 'profile', label: 'Mon profil', icon: Settings },
              { id: 'formations', label: 'Formations', icon: BookOpen },
              { id: 'alerts', label: 'Alertes emploi', icon: Bell },
              { id: 'messages', label: 'Messages', icon: MessageCircle },
              { id: 'documents', label: 'Documents', icon: FileText },
              { id: 'premium', label: 'Services Premium', icon: Crown },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-4 font-medium whitespace-nowrap flex items-center space-x-2 transition ${
                    activeTab === tab.id
                      ? 'border-b-2 border-[#0E2F56] text-[#0E2F56] bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Complétez votre profil</h3>
                      <p className="text-sm text-gray-600">Votre profil est complété à {profileCompletion}%</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="px-4 py-2 bg-[#0E2F56] text-white rounded-lg hover:bg-blue-800 transition text-sm font-medium"
                    >
                      Compléter
                    </button>
                  </div>
                  <div className="w-full bg-white rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#0E2F56] to-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${profileCompletion}%` }}
                    ></div>
                  </div>
                </div>

                {aiScore > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#0E2F56] rounded-full flex items-center justify-center flex-shrink-0">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Recommandation IA</h3>
                        <p className="text-gray-700 mb-4">
                          Votre score moyen de compatibilité est de <span className="font-bold text-[#0E2F56]">{aiScore}%</span> avec les offres consultées.
                          {aiScore < 80 && ' Suivez une formation pour améliorer vos chances!'}
                        </p>
                        <button
                          onClick={() => setActiveTab('formations')}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0E2F56] text-white rounded-lg hover:bg-[#1a4275] transition text-sm font-medium"
                        >
                          <BookOpen className="w-4 h-4" />
                          Découvrir les formations
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <button
                    onClick={() => onNavigate('jobs')}
                    className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-[#0E2F56] hover:shadow-lg transition text-left group"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition">
                      <Search className="w-6 h-6 text-[#0E2F56]" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Rechercher une offre</h3>
                    <p className="text-sm text-gray-600">Explorez des milliers d'opportunités</p>
                  </button>

                  <button
                    onClick={() => onNavigate('candidate-profile-form')}
                    className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-[#0E2F56] hover:shadow-lg transition text-left group"
                  >
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition">
                      <User className="w-6 h-6 text-green-700" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Créer mon profil</h3>
                    <p className="text-sm text-gray-600">Formulaire complet de profil</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('premium')}
                    className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-xl hover:border-amber-400 hover:shadow-lg transition text-left group"
                  >
                    <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Services Premium IA</h3>
                    <p className="text-sm text-gray-600">Boostez votre recherche d'emploi</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('formations')}
                    className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-[#0E2F56] hover:shadow-lg transition text-left group"
                  >
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition">
                      <GraduationCap className="w-6 h-6 text-green-700" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Mes formations</h3>
                    <p className="text-sm text-gray-600">Développez vos compétences</p>
                  </button>
                </div>

                {applications.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Dernières candidatures</h3>
                    <div className="space-y-3">
                      {applications.slice(0, 3).map((app) => (
                        <div
                          key={app.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                          onClick={() => onNavigate('job-detail', app.job_id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 mb-1">{app.jobs?.title}</h4>
                              <p className="text-sm text-gray-600 mb-2">{app.jobs?.companies?.company_name}</p>
                              {app.ai_match_score && (
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1 text-xs text-gray-600">
                                    <Sparkles className="w-3 h-3 text-purple-600" />
                                    <span>Score IA: {app.ai_match_score}%</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                              {getStatusLabel(app.status)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {applications.length > 3 && (
                      <button
                        onClick={() => setActiveTab('applications')}
                        className="mt-4 w-full py-2 text-[#0E2F56] font-medium hover:bg-blue-50 rounded-lg transition"
                      >
                        Voir toutes les candidatures
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'applications' && (
              <div>
                {applications.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Vous n'avez pas encore postulé à des offres</p>
                    <button
                      onClick={() => onNavigate('jobs')}
                      className="px-6 py-3 bg-[#0E2F56] hover:bg-blue-800 text-white font-medium rounded-lg transition"
                    >
                      Découvrir les offres
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Mes Candidatures</h2>
                      <span className="text-sm text-gray-600">{applications.length} candidature{applications.length > 1 ? 's' : ''}</span>
                    </div>
                    {applications.map((app) => (
                      <div
                        key={app.id}
                        className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3
                              className="font-bold text-xl text-gray-900 mb-2 hover:text-[#0E2F56] cursor-pointer"
                              onClick={() => onNavigate('job-detail', app.job_id)}
                            >
                              {app.jobs?.title}
                            </h3>
                            <p className="text-gray-600 mb-2 font-medium">{app.jobs?.companies?.company_name}</p>
                            {app.jobs?.location && (
                              <div className="flex items-center space-x-2 text-gray-500 text-sm">
                                <MapPin className="w-4 h-4" />
                                <span>{app.jobs.location}</span>
                              </div>
                            )}
                          </div>
                          <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                            {getStatusLabel(app.status)}
                          </span>
                        </div>

                        {app.ai_match_score && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-purple-600" />
                                <span className="text-gray-600 font-medium">Score de compatibilité IA</span>
                              </div>
                              <span className="font-bold text-[#0E2F56]">{app.ai_match_score}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-gradient-to-r from-[#0E2F56] to-purple-600 h-2.5 rounded-full transition-all"
                                style={{ width: `${app.ai_match_score}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>Postulé le {new Date(app.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <button
                            onClick={() => onNavigate('job-detail', app.job_id)}
                            className="text-[#0E2F56] font-medium text-sm hover:underline flex items-center gap-1"
                          >
                            Voir l'offre
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Mon Profil Professionnel</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Poste recherché *
                    </label>
                    <input
                      type="text"
                      value={formData.desired_position}
                      onChange={(e) => setFormData({ ...formData, desired_position: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent"
                      placeholder="Ex: Superviseur RH"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Années d'expérience *
                    </label>
                    <input
                      type="number"
                      value={formData.experience_years}
                      onChange={(e) => setFormData({ ...formData, experience_years: Number(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Niveau d'études *
                    </label>
                    <select
                      value={formData.education_level}
                      onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent"
                    >
                      <option value="">Sélectionner</option>
                      <option value="Sans diplôme">Sans diplôme</option>
                      <option value="Bac">Bac</option>
                      <option value="Bac+2">Bac+2</option>
                      <option value="Licence">Licence (Bac+3)</option>
                      <option value="Master">Master (Bac+5)</option>
                      <option value="Doctorat">Doctorat</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Localisation *
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent"
                      placeholder="Ex: Conakry, Boké, Kamsar..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Disponibilité
                    </label>
                    <select
                      value={formData.availability}
                      onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent"
                    >
                      <option value="immediate">Immédiate</option>
                      <option value="1_month">Dans 1 mois</option>
                      <option value="3_months">Dans 3 mois</option>
                      <option value="negotiable">À négocier</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salaire minimum souhaité (GNF)
                    </label>
                    <input
                      type="number"
                      value={formData.desired_salary_min}
                      onChange={(e) => setFormData({ ...formData, desired_salary_min: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent"
                      placeholder="Ex: 5000000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salaire maximum souhaité (GNF)
                    </label>
                    <input
                      type="number"
                      value={formData.desired_salary_max}
                      onChange={(e) => setFormData({ ...formData, desired_salary_max: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent"
                      placeholder="Ex: 8000000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compétences *
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent"
                      placeholder="Ajouter une compétence (Ex: Microsoft Excel)"
                    />
                    <button
                      onClick={addSkill}
                      className="px-6 py-3 bg-[#0E2F56] hover:bg-blue-800 text-white font-medium rounded-lg transition flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Ajouter
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-4 py-2 bg-blue-100 text-[#0E2F56] rounded-full text-sm font-medium flex items-center space-x-2"
                      >
                        <span>{skill}</span>
                        <button
                          onClick={() => removeSkill(skill)}
                          className="hover:text-blue-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSaveProfile}
                    className="px-8 py-3 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-semibold rounded-lg transition shadow-md"
                  >
                    Enregistrer les modifications
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'formations' && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Mes Formations</h3>
                <p className="text-gray-600 mb-6">Suivez vos formations inscrites et leur progression</p>
                <button
                  onClick={() => onNavigate('formations')}
                  className="px-6 py-3 bg-[#0E2F56] hover:bg-blue-800 text-white font-medium rounded-lg transition"
                >
                  Découvrir les formations disponibles
                </button>
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Alertes Emploi</h3>
                <p className="text-gray-600 mb-6">
                  Configurez des alertes pour recevoir les nouvelles offres par email, SMS ou WhatsApp
                </p>
                <p className="text-sm text-gray-500">Fonctionnalité bientôt disponible</p>
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Messagerie</h3>
                <p className="text-gray-600 mb-6">Communiquez directement avec les recruteurs</p>
                <p className="text-sm text-gray-500">Fonctionnalité bientôt disponible</p>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Mes Documents</h3>
                <p className="text-gray-600 mb-6">Gérez vos CV, lettres de motivation et autres documents</p>
                <button
                  onClick={() => alert('Fonctionnalité de téléchargement de documents disponible prochainement')}
                  className="px-6 py-3 bg-[#0E2F56] hover:bg-blue-800 text-white font-medium rounded-lg transition flex items-center gap-2 mx-auto"
                >
                  <Upload className="w-5 h-5" />
                  Télécharger un document
                </button>
              </div>
            )}

            {activeTab === 'premium' && (
              <div className="space-y-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#FF8C00] to-orange-600 rounded-full mb-4">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Services Premium IA</h2>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
                    Boostez votre recherche d'emploi avec nos services intelligents propulsés par l'IA
                  </p>
                  <button
                    onClick={() => onNavigate('premium-ai')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
                  >
                    <Sparkles className="w-5 h-5" />
                    Découvrir tous les services IA
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {premiumServices.map((service) => {
                    const Icon = service.icon;
                    return (
                      <div
                        key={service.title}
                        className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-[#0E2F56] hover:shadow-xl transition"
                      >
                        <div className={`w-14 h-14 rounded-lg ${service.color} flex items-center justify-center mb-4`}>
                          <Icon className="w-7 h-7" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">{service.title}</h3>
                        <p className="text-sm text-gray-600 mb-4">{service.description}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <span className="font-bold text-[#0E2F56]">{service.price}</span>
                          <button
                            onClick={() => setSelectedService(service)}
                            className="text-[#0E2F56] font-medium text-sm hover:underline"
                          >
                            En savoir plus
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-gradient-to-br from-[#0E2F56] to-blue-800 rounded-2xl p-8 text-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                      <h3 className="text-2xl font-bold mb-4">Abonnement Premium PRO+</h3>
                      <p className="text-blue-100 mb-6">
                        Accédez à tous les services Premium IA + Cloud sécurisé + Support prioritaire
                      </p>
                      <ul className="space-y-3 mb-6">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-[#FF8C00]" />
                          <span>Tous les services IA inclus</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-[#FF8C00]" />
                          <span>Cloud 10 Go pour documents</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-[#FF8C00]" />
                          <span>Support prioritaire 24/7</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-[#FF8C00]" />
                          <span>Badge Profil vérifié</span>
                        </li>
                      </ul>
                    </div>
                    <div className="text-center">
                      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 mb-6">
                        <div className="text-5xl font-bold mb-2">350 000</div>
                        <div className="text-xl">GNF / mois</div>
                      </div>
                      <button
                        onClick={() => alert('Paiement: Orange Money • LengoPay • DigitalPay SA')}
                        className="w-full px-8 py-4 bg-white hover:bg-gray-50 text-[#0E2F56] font-semibold text-lg rounded-lg transition shadow-md border-2 border-white"
                      >
                        S'abonner maintenant
                      </button>
                      <p className="text-sm text-blue-200 mt-4">
                        Orange Money • LengoPay • DigitalPay SA
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service Details Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg ${selectedService.color} flex items-center justify-center`}>
                  <selectedService.icon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedService.title}</h2>
                  <p className="text-[#FF8C00] font-bold text-lg">{selectedService.price}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed">{selectedService.details.fullDescription}</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Fonctionnalités incluses</h3>
                <ul className="space-y-2">
                  {selectedService.details.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-blue-900 mb-1">Avantage clé</h4>
                    <p className="text-blue-800 text-sm">{selectedService.details.benefits}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Modalités de paiement</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="font-bold text-orange-600">Orange Money</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="font-bold text-blue-600">LengoPay</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="font-bold text-green-600">DigitalPay SA</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    alert(`Service: ${selectedService.title}\nPrix: ${selectedService.price}\n\nPour activer ce service, veuillez nous contacter:\n\n📧 Email: premium@jobguinee.com\n📱 WhatsApp: +224 XXX XX XX XX\n\nPaiement accepté via:\n• Orange Money\n• LengoPay\n• DigitalPay SA`);
                    setSelectedService(null);
                  }}
                  className="w-full px-6 py-4 bg-gradient-to-r from-[#0E2F56] to-blue-800 text-white rounded-xl font-bold text-lg hover:from-blue-900 hover:to-blue-900 transition-all shadow-lg"
                >
                  Souscrire maintenant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
