import { useEffect, useState } from 'react';
import { Briefcase, FileText, Bell, BellOff, Settings, Upload, MapPin, Award, TrendingUp, Target, Calendar, Clock, MessageCircle, Eye, Heart, Star, CheckCircle, CheckCircle2, AlertCircle, Sparkles, Brain, Crown, Lock, Unlock, Download, Share2, CreditCard as Edit, Trash2, Filter, Search, BarChart3, BookOpen, Users, Zap, Shield, Cloud, DollarSign, ChevronRight, X, Plus, GraduationCap, User, Activity, Send, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Application, Job, Company, CandidateProfile } from '../lib/supabase';
import { isPremiumActive } from '../utils/premiumHelpers';
import CandidateProfileForm from '../components/forms/CandidateProfileForm';
import CandidateMessaging from '../components/candidate/CandidateMessaging';
import DocumentsHub from '../components/candidate/DocumentsHub';
import JobAlertsManager from '../components/candidate/JobAlertsManager';
import ApplicationTrackingModal from '../components/candidate/ApplicationTrackingModal';
import ProfileQualityBadge from '../components/profile/ProfileQualityBadge';
import { candidateMessagingService } from '../services/candidateMessagingService';
import { candidateApplicationTrackingService } from '../services/candidateApplicationTrackingService';
import { candidateStatsService } from '../services/candidateStatsService';
import { usePendingApplication } from '../hooks/usePendingApplication';
import ExternalApplicationCTA from '../components/candidate/ExternalApplicationCTA';
import ProfileProgressBar from '../components/candidate/ProfileProgressBar';
import { ProtectedPageWrapper } from '../components/common/AccessControlExample';
import { useModalContext } from '../contexts/ModalContext';

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
  const { showSuccess, showError, showWarning, showConfirm } = useModalContext();
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'profile' | 'formations' | 'alerts' | 'messages' | 'documents' | 'premium'>('dashboard');
  const [applications, setApplications] = useState<(Application & { jobs: Job & { companies: Company } })[]>([]);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [creditsBalance, setCreditsBalance] = useState<number>(0);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [jobViewsCount, setJobViewsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [trackingApplicationId, setTrackingApplicationId] = useState<string | null>(null);
  const [aiScore, setAiScore] = useState(0);
  const [profileStats, setProfileStats] = useState({
    profile_views_count: 0,
    profile_purchases_count: 0,
    this_month_views: 0,
    this_month_purchases: 0
  });

  const { pendingApplication, shouldShowApplicationModal, clearPendingApplication } = usePendingApplication(profile?.id || null);

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
    if (profile?.id && user?.id) {
      console.log('🔍 Loading data for user:', {
        userId: user.id,
        profileId: profile.id,
        email: user.email,
        userType: profile.user_type
      });
      loadData();
    }
  }, [profile?.id, user?.id]);

  // Synchronisation en temps réel des messages non lus
  useEffect(() => {
    if (!user?.id) return;

    const updateUnreadCount = async () => {
      const count = await candidateMessagingService.getUnreadCount();
      setUnreadMessagesCount(count);
    };

    // Écouter les changements de notifications
    const notificationsChannel = supabase
      .channel('candidate_notifications_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        updateUnreadCount
      )
      .subscribe();

    // Écouter les changements de communications
    const communicationsChannel = supabase
      .channel('candidate_communications_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'communications_log',
          filter: `recipient_id=eq.${user.id}`
        },
        updateUnreadCount
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(communicationsChannel);
    };
  }, [user?.id]);

  const loadData = async () => {
    if (!profile?.id || !user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      // Load stats via centralized service
      const [appsData, profileData, formationsData, stats, unreadCount] = await Promise.all([
        supabase
          .from('applications')
          .select('*, jobs(*, companies(*))')
          .eq('candidate_id', user.id)
          .order('applied_at', { ascending: false }),
        supabase
          .from('candidate_profiles')
          .select('*')
          .eq('profile_id', profile.id)
          .maybeSingle(),
        supabase
          .from('formation_enrollments')
          .select('id, formation_id, status, progress, formations(title)')
          .eq('user_id', user.id)
          .in('status', ['enrolled', 'in_progress', 'completed']),
        candidateStatsService.getAllStats(user.id),
        candidateMessagingService.getUnreadCount()
      ]);

      console.log('📊 Data loaded:', {
        applications: appsData.data?.length || 0,
        stats: stats,
        formations: formationsData.data?.length || 0,
        errors: {
          apps: appsData.error
        }
      });

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

      // Update stats from centralized service
      if (stats) {
        setJobViewsCount(stats.jobViewsCount || 0);
        setAiScore(stats.aiScore || 0);
        setProfileStats({
          profile_views_count: stats.profileViewsCount || 0,
          profile_purchases_count: stats.profilePurchasesCount || 0,
          this_month_views: 0,
          this_month_purchases: 0
        });
        setCreditsBalance(stats.creditsBalance || 0);
        setIsPremium(stats.isPremium || false);
        console.log('📊 Centralized stats:', stats);
      } else {
        setJobViewsCount(0);
        setAiScore(0);
        setProfileStats({
          profile_views_count: 0,
          profile_purchases_count: 0,
          this_month_views: 0,
          this_month_purchases: 0
        });
        setCreditsBalance(0);
        setIsPremium(false);
        console.warn('⚠️ No stats available, using defaults');
      }

      // Load formations
      if (formationsData.data) {
        setFormations(formationsData.data.map((enrollment: any) => ({
          id: enrollment.formation_id,
          title: enrollment.formations?.title || 'Formation',
          status: enrollment.status,
          progress: enrollment.progress
        })));
      }

      // Load unread messages count
      setUnreadMessagesCount(unreadCount);
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

    showSuccess('Mis à jour', 'Profil mis à jour avec succès!');
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


  const premiumServices = [
    {
      icon: Brain,
      title: 'Analyse IA de profil',
      description: 'Score CV vs offre + suggestions formations',
      price: 'Inclus',
      color: 'bg-purple-100 text-purple-700',
      details: {
        fullDescription: 'Notre système d\'intelligence artificielle analyse en profondeur votre profil et le compare automatiquement avec toutes les offres d\'emploi disponibles. L\'IA évalue vos compétences, votre expérience, votre formation et vos aspirations professionnelles pour vous fournir un score de compatibilité précis avec chaque offre.',
        features: [
          'Algorithme de matching avancé calculant un score de compatibilité de 0 à 100%',
          'Analyse comparative détaillée entre vos compétences et celles requises par l\'offre',
          'Identification automatique des compétences manquantes ou à renforcer',
          'Suggestions personnalisées de formations certifiantes pour combler vos lacunes',
          'Recommandations d\'amélioration basées sur les tendances du marché',
          'Mise à jour dynamique du matching à chaque modification de votre profil',
          'Classement intelligent des offres par ordre de pertinence',
          'Analyse des mots-clés et termes techniques du secteur',
          'Visualisation graphique de votre adéquation avec chaque poste'
        ],
        benefits: 'Maximisez vos chances de succès en ciblant uniquement les offres où vous avez le plus de potentiel. L\'IA vous guide vers les opportunités qui correspondent vraiment à votre profil et vous indique comment vous améliorer.',
      }
    },
    {
      icon: FileText,
      title: 'Création CV / Lettre IA',
      description: 'Génération automatique design professionnel',
      price: 'Inclus',
      color: 'bg-blue-100 text-blue-700',
      details: {
        fullDescription: 'L\'intelligence artificielle crée pour vous des CV et lettres de motivation sur mesure, parfaitement adaptés à chaque offre d\'emploi. Le système analyse les exigences du poste et génère automatiquement un document professionnel qui met en valeur vos atouts les plus pertinents. Chaque CV est optimisé pour passer les filtres automatiques des logiciels de recrutement (ATS).',
        features: [
          'Génération instantanée de CV au format HTML, PDF et DOCX téléchargeables',
          'Design moderne et épuré adapté aux standards internationaux',
          'Optimisation ATS garantissant la lecture par les systèmes automatiques',
          'Lettres de motivation personnalisées analysant chaque offre spécifique',
          'Adaptation automatique du vocabulaire selon le secteur d\'activité',
          'Choix entre 5 styles de présentation : formel, créatif, minimaliste, moderne, classique',
          'Import automatique de toutes les données depuis votre profil',
          'Suggestions intelligentes de formulations pour chaque section',
          'Vérification orthographique et grammaticale intégrée',
          'Modifications illimitées et sauvegarde de versions multiples',
          'Mise en avant automatique des compétences clés recherchées'
        ],
        benefits: 'Créez en quelques clics des candidatures parfaitement ciblées qui captent l\'attention des recruteurs. L\'IA se charge de la mise en forme et de l\'optimisation, vous permettant de vous concentrer sur votre contenu.',
      }
    },
    {
      icon: Bell,
      title: 'Alertes IA ciblées',
      description: 'Détection auto d\'offres correspondantes',
      price: 'Inclus',
      color: 'bg-orange-100 text-orange-700',
      details: {
        fullDescription: 'Notre système d\'alerte intelligent surveille en permanence toutes les nouvelles offres d\'emploi publiées sur la plateforme. Dès qu\'une opportunité correspond à votre profil, compétences et aspirations professionnelles, vous recevez une notification instantanée. L\'IA analyse le score de compatibilité et ne vous envoie que les offres pertinentes, évitant ainsi la surcharge d\'informations.',
        features: [
          'Notifications push instantanées sur votre navigateur et mobile',
          'Alertes par email avec résumé détaillé de l\'offre',
          'SMS d\'alerte pour les opportunités à forte compatibilité (>85%)',
          'Analyse automatique en temps réel de toutes les nouvelles publications',
          'Filtrage multi-critères : secteur, localisation, salaire, type de contrat',
          'Alertes personnalisées selon votre niveau d\'expérience et vos compétences clés',
          'Fréquence d\'envoi configurable : instantanée, quotidienne ou hebdomadaire',
          'Résumé hebdomadaire intelligent des meilleures opportunités',
          'Désactivation temporaire sans perdre vos critères',
          'Historique complet de toutes les alertes reçues',
          'Suggestions d\'élargissement de critères si peu d\'offres correspondent'
        ],
        benefits: 'Soyez le premier informé des opportunités qui correspondent à votre profil. L\'IA travaille pour vous 24h/24 et vous permet de postuler rapidement aux meilleures offres avant vos concurrents.',
      }
    },
    {
      icon: MessageCircle,
      title: 'Chatbot Travail & Emploi',
      description: 'Réponses Code du Travail guinéen',
      price: 'Inclus',
      color: 'bg-green-100 text-green-700',
      details: {
        fullDescription: 'Votre conseiller emploi virtuel alimenté par l\'intelligence artificielle, disponible 24h/24 et 7j/7. Ce chatbot expert maîtrise parfaitement le Code du Travail guinéen et vous accompagne à chaque étape de votre parcours professionnel. Posez vos questions en langage naturel et recevez des réponses précises, contextualisées et adaptées à votre situation personnelle.',
        features: [
          'Réponses instantanées en moins de 3 secondes',
          'Expertise complète du Code du Travail de la République de Guinée',
          'Base de connaissances mise à jour avec les dernières réglementations',
          'Conseils personnalisés pour la préparation d\'entretiens d\'embauche',
          'Stratégies éprouvées de recherche d\'emploi adaptées au marché guinéen',
          'Techniques de négociation salariale selon votre secteur et expérience',
          'Plans de développement de carrière sur mesure',
          'Aide à la rédaction de réponses aux questions d\'entretien difficiles',
          'Simulation d\'entretiens avec feedback constructif',
          'Conseils sur les droits et devoirs des travailleurs',
          'Historique complet et recherche dans vos conversations passées',
          'Suggestions proactives basées sur votre profil et vos objectifs'
        ],
        benefits: 'Un expert RH dans votre poche, disponible à tout moment. Obtenez des réponses fiables et professionnelles sans attendre, que ce soit pour une question urgente avant un entretien ou pour planifier votre évolution de carrière.',
      }
    },
    {
      icon: BarChart3,
      title: 'Rapport mensuel IA',
      description: 'Stats candidatures, matching, formations',
      price: 'Inclus',
      color: 'bg-blue-100 text-blue-700',
      details: {
        fullDescription: 'Recevez chaque mois un rapport analytique complet généré par intelligence artificielle qui décortique votre activité professionnelle sur la plateforme. Le système analyse vos performances, identifie les tendances, compare votre progression avec le marché et vous fournit des insights actionnables pour améliorer votre stratégie de recherche d\'emploi. Chaque rapport est personnalisé selon votre secteur d\'activité et vos objectifs de carrière.',
        features: [
          'Tableau de bord détaillé de vos candidatures : envoyées, consultées, en attente, acceptées, refusées',
          'Taux de réponse et délais moyens de traitement par type d\'entreprise',
          'Évolution mensuelle de votre score de compatibilité IA',
          'Analyse comparative de vos compétences face aux offres du marché',
          'Bilan des formations suivies avec impact mesuré sur votre profil',
          'Benchmarking anonymisé avec d\'autres candidats de votre secteur',
          'Identification des points forts et axes d\'amélioration prioritaires',
          'Recommandations personnalisées basées sur l\'analyse de vos données',
          'Prévisions de tendances du marché dans votre domaine',
          'Graphiques interactifs et visualisations de données professionnelles',
          'Suggestions de compétences à développer pour augmenter vos chances',
          'Export PDF haute qualité pour vos archives personnelles',
          'Historique complet accessible pour suivre votre progression dans le temps'
        ],
        benefits: 'Prenez des décisions éclairées basées sur des données concrètes. Comprenez ce qui fonctionne dans votre recherche d\'emploi, identifiez les opportunités manquées et ajustez votre stratégie pour maximiser vos résultats.',
      }
    },
    {
      icon: Users,
      title: 'Coaching carrière IA',
      description: 'Simulations entretien + feedbacks',
      price: 'Inclus',
      color: 'bg-rose-100 text-rose-700',
      details: {
        fullDescription: 'Programme de coaching intensif propulsé par l\'intelligence artificielle pour vous préparer aux entretiens d\'embauche et développer votre carrière. Notre coach virtuel analyse votre profil, le poste visé et simule des entretiens ultra-réalistes avec des questions adaptées au secteur et à l\'entreprise. Chaque simulation est suivie d\'un feedback approfondi analysant votre langage, votre argumentation, votre posture et vos réponses.',
        features: [
          'Simulations d\'entretiens vidéo avec IA conversationnelle avancée',
          'Bibliothèque de 500+ questions d\'entretien par secteur d\'activité',
          'Personnalisation selon le poste, l\'entreprise et le niveau hiérarchique',
          'Analyse vocale et détection des émotions dans vos réponses',
          'Feedback instantané et détaillé après chaque simulation',
          'Évaluation de votre langage corporel et expressions faciales',
          'Suggestions de reformulations pour améliorer vos réponses',
          'Conseils sur la gestion du stress et la confiance en soi',
          'Entraînement illimité avec difficultés progressives',
          'Bibliothèque de réponses modèles pour questions difficiles',
          'Suivi de progression avec graphiques d\'évolution',
          'Préparation aux questions pièges et cas pratiques',
          'Conseils de négociation salariale adaptés à votre profil',
          'Simulations d\'entretiens techniques pour postes spécialisés'
        ],
        benefits: 'Transformez chaque entretien en opportunité de succès. Arrivez préparé, confiant et capable de convaincre n\'importe quel recruteur grâce à un entraînement intensif et des feedbacks constructifs qui vous font progresser rapidement.',
      }
    },
    {
      icon: Shield,
      title: 'Badge Profil vérifié',
      description: 'Vérification + scoring IA + visibilité',
      price: 'Inclus',
      color: 'bg-amber-100 text-amber-700',
      details: {
        fullDescription: 'Obtenez la certification officielle de votre profil avec un badge de vérification visible qui atteste de l\'authenticité de vos informations. Notre système d\'intelligence artificielle évalue la cohérence et la qualité de votre profil pour générer un score de crédibilité. Les profils vérifiés bénéficient d\'une visibilité prioritaire dans les résultats de recherche des recruteurs et inspirent confiance immédiate.',
        features: [
          'Processus de vérification d\'identité sécurisé et confidentiel',
          'Validation des diplômes, certifications et expériences professionnelles',
          'Badge de vérification doré affiché en évidence sur votre profil',
          'Score de crédibilité IA calculé sur 100 points',
          'Analyse de cohérence entre vos différentes expériences',
          'Augmentation mesurée de +40% de visibilité dans les recherches',
          'Positionnement prioritaire dans les suggestions de candidats',
          'Alerte automatique aux recruteurs de votre secteur',
          'Rapport de vérification téléchargeable',
          'Certification renouvelable annuellement',
          'Assistance en cas de litige ou question sur vos qualifications',
          'Accès au réseau exclusif des profils vérifiés',
          'Statistiques de consultation de votre profil par les recruteurs'
        ],
        benefits: 'Distinguez-vous de la masse des candidats avec une certification qui prouve votre sérieux et votre authenticité. Les recruteurs privilégient systématiquement les profils vérifiés, multipliant vos chances d\'être contacté.',
      }
    },
    {
      icon: Cloud,
      title: 'Espace cloud personnel',
      description: 'Sauvegarde sécurisée documents RH',
      price: 'Inclus Premium',
      color: 'bg-cyan-100 text-cyan-700',
      details: {
        fullDescription: 'Votre coffre-fort numérique professionnel dans le cloud. Cet espace de stockage ultra-sécurisé centralise tous vos documents de carrière : CV, diplômes, certifications, lettres de recommandation, contrats, fiches de paie et portfolios. Accessible depuis n\'importe quel appareil, il vous permet de partager instantanément vos documents avec les recruteurs tout en gardant le contrôle total sur vos données.',
        features: [
          'Espace de stockage généreux de 15 Go extensible',
          'Sauvegarde automatique et synchronisation multi-appareils',
          'Accès depuis ordinateur, smartphone et tablette',
          'Upload par glisser-déposer avec prévisualisation instantanée',
          'Partage sécurisé avec liens temporaires à durée limitée',
          'Gestion fine des permissions de partage par document',
          'Organisation intelligente par dossiers et tags personnalisables',
          'Recherche avancée dans le contenu des documents (OCR intégré)',
          'Historique complet des versions avec restauration possible',
          'Chiffrement AES 256 bits de bout en bout',
          'Conformité RGPD et normes internationales de sécurité',
          'Scanner de documents intégré via mobile',
          'Conversion automatique entre formats (PDF, DOCX, images)',
          'Notification de consultation par les recruteurs',
          'Corbeille avec récupération sous 30 jours'
        ],
        benefits: 'Ne perdez plus jamais un document important. Ayez toujours sous la main l\'ensemble de votre dossier professionnel, parfaitement organisé et sécurisé. Répondez instantanément aux demandes des recruteurs en partageant vos documents en un clic.',
      }
    },
  ];

  useEffect(() => {
    if (!user) {
      onNavigate('login');
    }
  }, [user]);

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

  const profileCompletion = candidateProfile?.profile_completion_percentage || 0;

  return (
    <ProtectedPageWrapper
      area="candidate-dashboard"
      onNavigate={onNavigate}
    >
      <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#0E2F56] to-blue-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {candidateProfile?.photo_url ? (
                <img
                  src={candidateProfile.photo_url}
                  alt={profile?.full_name || 'Photo de profil'}
                  className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center border-4 border-white shadow-lg">
                  <User className="w-8 h-8 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold mb-2">Bonjour, {profile?.full_name} 👋</h1>
                <p className="text-blue-100">Bienvenue dans votre espace candidat intelligent</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isPremium && (
                <div className="flex items-center gap-2 px-4 py-2 bg-[#FF8C00] rounded-full">
                  <Crown className="w-5 h-5" />
                  <span className="font-bold">Premium</span>
                </div>
              )}
              <button
                onClick={() => {
                  console.log('🔄 Manual stats refresh requested');
                  loadData();
                }}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all"
                title="Actualiser les statistiques"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 text-sm">Offres consultées</span>
                <Eye className="w-5 h-5 text-blue-200" />
              </div>
              <div className="text-3xl font-bold">
                {loading ? '...' : jobViewsCount}
              </div>
              {!loading && jobViewsCount === 0 && (
                <p className="text-xs text-blue-200 mt-1">Consultez des offres</p>
              )}
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 text-sm">Candidatures</span>
                <Briefcase className="w-5 h-5 text-blue-200" />
              </div>
              <div className="text-3xl font-bold">
                {loading ? '...' : applications.length}
              </div>
              {!loading && applications.length === 0 && (
                <p className="text-xs text-blue-200 mt-1">Postulez maintenant</p>
              )}
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 text-sm">Vues profil</span>
                <Users className="w-5 h-5 text-blue-200" />
              </div>
              <div className="text-3xl font-bold">
                {loading ? '...' : profileStats.profile_views_count}
              </div>
              {!loading && profileStats.this_month_views > 0 && (
                <p className="text-xs text-blue-200 mt-1">+{profileStats.this_month_views} ce mois</p>
              )}
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-100 text-sm">Profil acheté</span>
                <DollarSign className="w-5 h-5 text-blue-200" />
              </div>
              <div className="text-3xl font-bold">
                {loading ? '...' : profileStats.profile_purchases_count}
              </div>
              {!loading && profileStats.this_month_purchases > 0 && (
                <p className="text-xs text-blue-200 mt-1">+{profileStats.this_month_purchases} ce mois</p>
              )}
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
              { id: 'profile', label: 'Mon Profil', icon: User },
              { id: 'applications', label: `Candidatures (${applications.length})`, icon: Briefcase },
              { id: 'formations', label: 'Formations', icon: BookOpen },
              { id: 'alerts', label: 'Alertes emploi', icon: Bell },
              { id: 'messages', label: `Messages${unreadMessagesCount > 0 ? ` (${unreadMessagesCount})` : ''}`, icon: MessageCircle, badge: unreadMessagesCount },
              { id: 'documents', label: 'Documents', icon: FileText },
              { id: 'premium', label: 'Services Premium', icon: Crown },
            ].map((tab) => {
              const Icon = tab.icon;
              const hasBadge = (tab as any).badge && (tab as any).badge > 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-4 font-medium whitespace-nowrap flex items-center space-x-2 transition relative ${
                    activeTab === tab.id
                      ? 'border-b-2 border-[#0E2F56] text-[#0E2F56] bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  {hasBadge && (
                    <span className="absolute -top-1 -right-1 px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full">
                      {(tab as any).badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {activeTab === 'dashboard' && (
              <div className="space-y-4">
                <ProfileProgressBar
                  compact={true}
                  onNavigate={(section) => setActiveTab('profile')}
                />

                <ExternalApplicationCTA
                  profileCompletion={profileCompletion}
                  onNavigate={onNavigate}
                />

                {(isPremium || creditsBalance > 0) && aiScore > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-[#0E2F56] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 mb-1">Recommandation IA</h3>
                        <p className="text-sm text-gray-600 mb-3">
                          Votre score moyen de compatibilité est de <span className="font-semibold text-gray-900">{aiScore}%</span> avec les offres consultées.
                          {aiScore < 80 && ' Suivez une formation pour améliorer vos chances!'}
                        </p>
                        <button
                          onClick={() => setActiveTab('formations')}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0E2F56] text-white rounded-md hover:bg-[#1a4275] transition text-sm font-medium"
                        >
                          <BookOpen className="w-4 h-4" />
                          Découvrir les formations
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!(isPremium || creditsBalance > 0) && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-[#0E2F56] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
                          <Lock className="w-4 h-4 text-gray-500" />
                          Score de compatibilité IA
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          Connaissez votre <span className="font-medium text-gray-900">score de compatibilité</span> avec les offres auxquelles vous avez candidaté.
                          Cette fonctionnalité nécessite un <span className="font-medium text-gray-900">abonnement Premium</span> ou des <span className="font-medium text-gray-900">crédits IA</span>.
                        </p>
                        <div className="bg-white rounded-md p-3 mb-3 border border-gray-200">
                          <div className="text-sm text-gray-600">
                            <p className="font-medium text-gray-900 mb-1.5 text-xs">Avec l'analyse IA :</p>
                            <ul className="space-y-1 text-xs">
                              <li>✓ Score de compatibilité précis</li>
                              <li>✓ Suggestions d'amélioration</li>
                              <li>✓ Recommandations de formations</li>
                            </ul>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => onNavigate('credit-store')}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0E2F56] text-white rounded-md hover:bg-[#1a4275] transition text-sm font-medium"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            Crédits IA
                          </button>
                          <button
                            onClick={() => onNavigate('premium-ai', 'premium-pro-section')}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition text-sm font-medium"
                          >
                            <Crown className="w-3.5 h-3.5" />
                            Premium PRO+
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <button
                    onClick={() => onNavigate('jobs')}
                    className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg hover:from-blue-100 hover:to-blue-200 hover:border-blue-400 hover:shadow-lg transition-all text-left group"
                  >
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-600 transition shadow-sm">
                      <Search className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-base mb-1 text-gray-900">Rechercher une offre</h3>
                    <p className="text-xs text-gray-700">Explorez des milliers d'opportunités</p>
                  </button>

                  <button
                    onClick={() => onNavigate('candidate-profile-form')}
                    className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-lg hover:from-emerald-100 hover:to-emerald-200 hover:border-emerald-400 hover:shadow-lg transition-all text-left group"
                  >
                    <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center mb-3 group-hover:bg-emerald-600 transition shadow-sm">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-base mb-1 text-gray-900">Créer mon profil</h3>
                    <p className="text-xs text-gray-700">Formulaire complet de profil</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('premium')}
                    className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-lg hover:from-amber-100 hover:to-amber-200 hover:border-amber-400 hover:shadow-lg transition-all text-left group"
                  >
                    <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center mb-3 group-hover:bg-amber-600 transition shadow-sm">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-base mb-1 text-gray-900">Services Premium IA</h3>
                    <p className="text-xs text-gray-700">Boostez votre recherche d'emploi</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('formations')}
                    className="p-4 bg-gradient-to-br from-violet-50 to-violet-100 border-2 border-violet-200 rounded-lg hover:from-violet-100 hover:to-violet-200 hover:border-violet-400 hover:shadow-lg transition-all text-left group"
                  >
                    <div className="w-10 h-10 bg-violet-500 rounded-lg flex items-center justify-center mb-3 group-hover:bg-violet-600 transition shadow-sm">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-base mb-1 text-gray-900">Mes formations</h3>
                    <p className="text-xs text-gray-700">Développez vos compétences</p>
                  </button>
                </div>

                {applications.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Dernières candidatures</h3>
                    <div className="space-y-2">
                      {applications.slice(0, 3).map((app) => (
                        <div
                          key={app.id}
                          className="bg-white border-2 border-gray-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-lg hover:bg-blue-50 transition-all cursor-pointer"
                          onClick={() => onNavigate('job-detail', app.job_id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-0.5 text-sm">{app.jobs?.title}</h4>
                              <p className="text-xs text-gray-600 mb-1.5">{app.jobs?.companies?.company_name}</p>
                              {!isPremium && creditsBalance === 0 ? (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Lock className="w-3 h-3" />
                                  <span>Score IA: Premium requis</span>
                                </div>
                              ) : app.ai_match_score ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1 text-xs text-gray-600">
                                    <Sparkles className="w-3 h-3 text-gray-600" />
                                    <span>Score IA: {app.ai_match_score}%</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <Sparkles className="w-3 h-3" />
                                  <span>Score disponible</span>
                                </div>
                              )}
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
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
                          <div className="flex flex-col items-end gap-2">
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(app.status)} shadow-sm`}>
                              {getStatusLabel(app.status)}
                            </span>
                            <button
                              onClick={() => setTrackingApplicationId(app.id)}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 hover:underline"
                            >
                              <Activity size={14} />
                              Voir le suivi
                            </button>
                          </div>
                        </div>

                        <div className="mb-4 relative">
                          {!isPremium && creditsBalance === 0 ? (
                            <div className="relative">
                              <div className="filter blur-sm pointer-events-none select-none">
                                <div className="flex items-center justify-between text-sm mb-2">
                                  <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-600" />
                                    <span className="text-gray-600 font-medium">Score de compatibilité IA</span>
                                  </div>
                                  <span className="font-bold text-[#0E2F56]">81%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div
                                    className="bg-gradient-to-r from-[#0E2F56] to-purple-600 h-2.5 rounded-full"
                                    style={{ width: '81%' }}
                                  ></div>
                                </div>
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-lg">
                                <div className="text-center px-4">
                                  <Lock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                                  <p className="text-xs font-medium text-gray-700 mb-1">Score réservé Premium</p>
                                  <div className="flex gap-2 justify-center">
                                    <button
                                      onClick={() => setActiveTab('premium')}
                                      className="text-xs px-2 py-1 bg-gradient-to-r from-[#FF8C00] to-yellow-600 text-white rounded hover:from-[#e67e00] hover:to-yellow-700 transition"
                                    >
                                      Premium
                                    </button>
                                    <button
                                      onClick={() => onNavigate('credit-store')}
                                      className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                    >
                                      Crédits
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : app.ai_match_score ? (
                            <div>
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
                          ) : (
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200">
                              <div className="flex items-start gap-2">
                                <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-gray-700 mb-1">Score de compatibilité disponible</p>
                                  <p className="text-xs text-gray-600 mb-2">Utilisez le service de matching IA pour connaître votre compatibilité avec cette offre</p>
                                  <button
                                    onClick={() => setSelectedService({ name: 'matching', requiresPremium: false, creditCost: 5 })}
                                    className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                  >
                                    Analyser (5 crédits)
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>Postulé le {new Date(app.applied_at).toLocaleDateString('fr-FR')}</span>
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
              <div className="-m-6">
                {isEditingProfile ? (
                  <CandidateProfileForm
                    onSaveSuccess={() => {
                      setIsEditingProfile(false);
                      loadData();
                    }}
                    onNavigateDashboard={() => setIsEditingProfile(false)}
                  />
                ) : (
                  <div className="p-6">
                    {/* Header avec boutons d'action */}
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Mon Profil</h2>
                          <p className="text-gray-600 text-sm mt-1">
                            Complété à <span className="font-semibold">{profileCompletion}%</span>
                          </p>
                        </div>
                        <button
                          onClick={() => setIsEditingProfile(true)}
                          className="px-6 py-3 bg-[#0E2F56] hover:bg-blue-800 text-white rounded-lg font-medium transition flex items-center gap-2 shadow-sm"
                        >
                          <Edit className="w-5 h-5" />
                          Compléter mon profil
                        </button>
                      </div>

                      {/* Barre de progression intelligente */}
                      <div className="relative">
                        {/* Barre de fond avec marqueurs */}
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden relative">
                          {/* Barre de progression avec dégradé orange uniforme */}
                          <div
                            className="h-full transition-all duration-1000 ease-out bg-gradient-to-r from-amber-500 to-orange-500"
                            style={{ width: `${profileCompletion}%` }}
                          >
                            {/* Animation de brillance */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
                          </div>

                          {/* Marqueurs d'étapes clés */}
                          <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white opacity-30"></div>
                          <div className="absolute top-0 left-[80%] w-0.5 h-full bg-white opacity-40"></div>
                        </div>

                        {/* Labels des étapes positionnés exactement */}
                        <div className="relative mt-2 h-5">
                          {/* 0% */}
                          <span className="absolute left-0 text-xs text-gray-600 font-medium">
                            0%
                          </span>

                          {/* 50% */}
                          <span className="absolute left-1/2 -translate-x-1/2 text-xs text-gray-600 font-medium">
                            50%
                          </span>

                          {/* 80% CVthèque */}
                          <span className={`absolute left-[80%] -translate-x-1/2 text-xs ${
                            profileCompletion >= 80 ? 'text-orange-600 font-semibold' : 'text-gray-500 font-medium'
                          } flex items-center gap-1 whitespace-nowrap`}>
                            {profileCompletion >= 80 && <CheckCircle2 className="w-3 h-3" />}
                            80% CVthèque
                          </span>

                          {/* 100% */}
                          <span className={`absolute right-0 text-xs ${
                            profileCompletion >= 100 ? 'text-orange-600 font-semibold' : 'text-gray-500 font-medium'
                          } flex items-center gap-1`}>
                            {profileCompletion >= 100 && <CheckCircle2 className="w-3 h-3" />}
                            100%
                          </span>
                        </div>
                      </div>

                      {/* Alerte de complétion */}
                      {profileCompletion < 80 && (
                        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-amber-900">
                              Profil incomplet pour la CVthèque
                            </p>
                            <p className="text-sm text-amber-700 mt-1">
                              Votre profil doit être complété à au moins <strong>80%</strong> pour être visible dans la CVthèque et accessible aux recruteurs.
                              Complétez encore <strong>{80 - profileCompletion}%</strong> pour devenir visible.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {!candidateProfile ? (
                      <div className="text-center py-12 bg-gray-50 rounded-xl">
                        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun profil enregistré</h3>
                        <p className="text-gray-600 mb-6">Créez votre profil pour commencer à postuler</p>
                        <button
                          onClick={() => setIsEditingProfile(true)}
                          className="px-6 py-3 bg-[#0E2F56] hover:bg-blue-800 text-white rounded-lg font-medium transition flex items-center gap-2 mx-auto"
                        >
                          <Edit className="w-5 h-5" />
                          Créer mon profil
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Informations personnelles */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <User className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Informations personnelles</h3>
                          </div>

                          {/* Photo de profil */}
                          {candidateProfile.photo_url && (
                            <div className="mb-6 flex justify-start">
                              <div className="relative">
                                <img
                                  src={candidateProfile.photo_url}
                                  alt={profile?.full_name || 'Photo de profil'}
                                  className="w-20 h-20 rounded-full object-cover border-2 border-blue-100 shadow-lg"
                                />
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Colonne 1 */}
                            <div className="space-y-6">
                              <div>
                                <label className="text-sm font-medium text-gray-500">Nom complet</label>
                                <p className="text-gray-900 font-medium mt-1">{profile?.full_name || '-'}</p>
                              </div>

                              <div>
                                <label className="text-sm font-medium text-gray-500">Téléphone</label>
                                <p className="text-gray-900 font-medium mt-1">{candidateProfile.phone || profile?.phone || '-'}</p>
                              </div>

                              {candidateProfile.birth_date && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Date de naissance</label>
                                  <p className="text-gray-900 font-medium mt-1">{new Date(candidateProfile.birth_date).toLocaleDateString('fr-FR')}</p>
                                </div>
                              )}

                              {candidateProfile.nationality && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Nationalité</label>
                                  <p className="text-gray-900 font-medium mt-1">{candidateProfile.nationality}</p>
                                </div>
                              )}
                            </div>

                            {/* Colonne 2 */}
                            <div className="space-y-6">
                              <div>
                                <label className="text-sm font-medium text-gray-500">Email</label>
                                <p className="text-gray-900 font-medium mt-1">{user?.email || '-'}</p>
                              </div>

                              <div>
                                <label className="text-sm font-medium text-gray-500">Localisation</label>
                                <p className="text-gray-900 font-medium mt-1 flex items-center gap-1">
                                  <MapPin className="w-4 h-4 text-gray-400" />
                                  {candidateProfile.location || candidateProfile.city || '-'}
                                </p>
                              </div>

                              {candidateProfile.gender && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Genre</label>
                                  <p className="text-gray-900 font-medium mt-1 capitalize">{candidateProfile.gender}</p>
                                </div>
                              )}
                            </div>

                            {/* Adresse complète sur toute la largeur */}
                            {candidateProfile.address && (
                              <div className="md:col-span-2">
                                <label className="text-sm font-medium text-gray-500">Adresse complète</label>
                                <p className="text-gray-900 font-medium mt-1">{candidateProfile.address}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Résumé professionnel */}
                        {candidateProfile.bio && (
                          <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-purple-600" />
                              </div>
                              <h3 className="text-lg font-bold text-gray-900">Résumé professionnel</h3>
                            </div>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{candidateProfile.bio}</p>
                          </div>
                        )}

                        {/* Situation professionnelle actuelle */}
                        {(candidateProfile.professional_status || candidateProfile.current_position || candidateProfile.current_company) && (
                          <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Briefcase className="w-6 h-6 text-blue-600" />
                              </div>
                              <h3 className="text-lg font-bold text-gray-900">Situation professionnelle actuelle</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {candidateProfile.professional_status && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Statut professionnel</label>
                                  <p className="text-gray-900 font-medium mt-1">{candidateProfile.professional_status}</p>
                                </div>
                              )}
                              {candidateProfile.current_position && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Poste actuel</label>
                                  <p className="text-gray-900 font-medium mt-1">{candidateProfile.current_position}</p>
                                </div>
                              )}
                              {candidateProfile.current_company && (
                                <div className="md:col-span-2">
                                  <label className="text-sm font-medium text-gray-500">Entreprise actuelle</label>
                                  <p className="text-gray-900 font-medium mt-1">{candidateProfile.current_company}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Poste recherché et disponibilité */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <Target className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Objectif professionnel</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Colonne 1 */}
                            <div className="space-y-6">
                              <div>
                                <label className="text-sm font-medium text-gray-500">Poste recherché</label>
                                <p className="text-gray-900 font-medium mt-1">{candidateProfile.desired_position || candidateProfile.title || '-'}</p>
                              </div>

                              {candidateProfile.desired_sectors && candidateProfile.desired_sectors.length > 0 && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Secteurs recherchés</label>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {candidateProfile.desired_sectors.map((sector: string, index: number) => (
                                      <span key={index} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm border border-green-200">
                                        {sector}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {candidateProfile.desired_contract_types && candidateProfile.desired_contract_types.length > 0 && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Types de contrat recherchés</label>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {candidateProfile.desired_contract_types.map((type: string, index: number) => (
                                      <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm border border-gray-300">
                                        {type}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {(candidateProfile.desired_salary_min || candidateProfile.desired_salary_max) && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Prétentions salariales</label>
                                  <p className="text-gray-900 font-medium mt-1 flex items-center gap-1">
                                    <DollarSign className="w-4 h-4 text-gray-400" />
                                    {candidateProfile.desired_salary_min && `${candidateProfile.desired_salary_min.toLocaleString()} GNF`}
                                    {candidateProfile.desired_salary_min && candidateProfile.desired_salary_max && ' - '}
                                    {candidateProfile.desired_salary_max && `${candidateProfile.desired_salary_max.toLocaleString()} GNF`}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Colonne 2 */}
                            <div className="space-y-6">
                              <div>
                                <label className="text-sm font-medium text-gray-500">Disponibilité</label>
                                <p className="text-gray-900 font-medium mt-1 capitalize">{candidateProfile.availability || '-'}</p>
                              </div>

                              {candidateProfile.mobility && candidateProfile.mobility.length > 0 && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Mobilité géographique</label>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {candidateProfile.mobility.map((city: string, index: number) => (
                                      <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {city}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {candidateProfile.willing_to_relocate !== undefined && candidateProfile.willing_to_relocate !== null && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Accepte la délocalisation</label>
                                  <p className="text-gray-900 font-medium mt-1">
                                    {candidateProfile.willing_to_relocate ? (
                                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm border border-green-200">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Oui, ouvert à la délocalisation
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-sm border border-gray-200">
                                        <X className="w-4 h-4" />
                                        Non, préfère rester dans sa région
                                      </span>
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Compétences */}
                        {candidateProfile.skills && candidateProfile.skills.length > 0 && (
                          <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Award className="w-6 h-6 text-blue-600" />
                              </div>
                              <h3 className="text-lg font-bold text-gray-900">Compétences</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {candidateProfile.skills.map((skill: string, index: number) => (
                                <span
                                  key={index}
                                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Expérience professionnelle */}
                        {/* Expérience professionnelle et Formation côte à côte */}
                        {((candidateProfile.work_experience && Array.isArray(candidateProfile.work_experience) && candidateProfile.work_experience.length > 0) ||
                          (candidateProfile.education && Array.isArray(candidateProfile.education) && candidateProfile.education.length > 0)) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Expérience professionnelle */}
                            {candidateProfile.work_experience && Array.isArray(candidateProfile.work_experience) && candidateProfile.work_experience.length > 0 && (
                              <div className="bg-white border border-gray-200 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <Briefcase className="w-6 h-6 text-orange-600" />
                                  </div>
                                  <h3 className="text-lg font-bold text-gray-900">Expérience professionnelle</h3>
                                </div>
                                <div className="space-y-4">
                                  {candidateProfile.work_experience.map((exp: any, index: number) => {
                                    // Debug: Log la structure des données
                                    if (index === 0) {
                                      console.log('Work Experience Object Keys:', Object.keys(exp));
                                      console.log('Work Experience Full Object:', exp);
                                    }

                                    let duration = exp.duration || '';
                                    let displayDate = '';

                                    // Vérifier si on a les champs du formulaire (startMonth, startYear, etc.)
                                    if (exp.startMonth && exp.startYear) {
                                      const isCurrent = exp.current || false;
                                      displayDate = `${exp.startMonth} ${exp.startYear} - ${isCurrent ? 'Présent' : (exp.endMonth && exp.endYear ? `${exp.endMonth} ${exp.endYear}` : '')}`;
                                    } else {
                                      // Fallback pour les anciens formats de données
                                      const startDate = exp['Date de début'] || exp['date_debut'] || exp.start_date || exp.startDate || exp.debut || exp.from;
                                      const endDate = exp['Date de fin'] || exp['date_fin'] || exp.end_date || exp.endDate || exp.fin || exp.to;
                                      const period = exp['Période'] || exp['periode'] || exp.period;

                                      if (period) {
                                        displayDate = period;
                                      } else if (startDate) {
                                        displayDate = `${startDate} - ${endDate || 'Présent'}`;
                                      }

                                      // Calculer la durée si on a des dates et pas de durée pré-calculée
                                      if (!duration && startDate) {
                                        try {
                                          const start = new Date(startDate);
                                          const end = endDate ? new Date(endDate) : new Date();

                                          if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                                            const months = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
                                            const years = Math.floor(months / 12);
                                            const remainingMonths = months % 12;

                                            if (years > 0 && remainingMonths > 0) {
                                              duration = `${years} an${years > 1 ? 's' : ''} et ${remainingMonths} mois`;
                                            } else if (years > 0) {
                                              duration = `${years} an${years > 1 ? 's' : ''}`;
                                            } else if (months > 0) {
                                              duration = `${months} mois`;
                                            }
                                          }
                                        } catch (e) {
                                          console.error('Error parsing dates:', e);
                                        }
                                      }
                                    }

                                    return (
                                      <div key={index} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1">
                                            <h4 className="font-bold text-gray-900">{exp['Poste occupé'] || exp.title || exp.position || exp.poste || '-'}</h4>
                                            <p className="text-gray-600 text-sm mt-1">{exp['Entreprise'] || exp['Nom de l\'entreprise'] || exp.company || exp.entreprise || '-'}</p>
                                          </div>
                                          {duration && (
                                            <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full whitespace-nowrap">
                                              {duration}
                                            </span>
                                          )}
                                        </div>
                                        {displayDate && (
                                          <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {displayDate}
                                          </p>
                                        )}
                                        {(exp['Missions principales'] || exp['Description des responsabilités'] || exp.description || exp.missions) && (
                                          <p className="text-gray-700 text-sm mt-2 whitespace-pre-wrap">{exp['Missions principales'] || exp['Description des responsabilités'] || exp.description || exp.missions}</p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                {/* Durée totale d'expérience */}
                                {(() => {
                                  let totalMonths = 0;
                                  candidateProfile.work_experience.forEach((exp: any) => {
                                    const startDate = exp['Date de début'] || exp['date_debut'] || exp.start_date || exp.startDate || exp.debut || exp.from;
                                    const endDate = exp['Date de fin'] || exp['date_fin'] || exp.end_date || exp.endDate || exp.fin || exp.to;

                                    if (startDate) {
                                      try {
                                        const start = new Date(startDate);
                                        const end = endDate ? new Date(endDate) : new Date();

                                        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                                          const months = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
                                          totalMonths += months;
                                        }
                                      } catch (e) {
                                        // Ignore les erreurs de parsing
                                      }
                                    }
                                  });

                                  if (totalMonths > 0) {
                                    const totalYears = Math.floor(totalMonths / 12);
                                    const remainingMonths = totalMonths % 12;
                                    let totalDuration = '';

                                    if (totalYears > 0 && remainingMonths > 0) {
                                      totalDuration = `${totalYears} an${totalYears > 1 ? 's' : ''} ${remainingMonths} mois`;
                                    } else if (totalYears > 0) {
                                      totalDuration = `${totalYears} an${totalYears > 1 ? 's' : ''}`;
                                    } else if (totalMonths > 0) {
                                      totalDuration = `${totalMonths} mois`;
                                    }

                                    return (
                                      <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="flex items-center justify-between bg-orange-50 rounded-lg px-4 py-3">
                                          <span className="text-sm font-medium text-gray-700">Expérience totale</span>
                                          <span className="text-sm font-bold text-orange-600">{totalDuration}</span>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            )}

                            {/* Formation */}
                            {candidateProfile.education && Array.isArray(candidateProfile.education) && candidateProfile.education.length > 0 && (
                              <div className="bg-white border border-gray-200 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <GraduationCap className="w-6 h-6 text-green-600" />
                                  </div>
                                  <h3 className="text-lg font-bold text-gray-900">Formation</h3>
                                </div>
                                <div className="space-y-4">
                                  {candidateProfile.education.map((edu: any, index: number) => (
                                    <div key={index} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                      <h4 className="font-bold text-gray-900">{edu['Diplôme obtenu'] || edu.degree || edu.title || '-'}</h4>
                                      {(edu.field || edu['Spécialisation/Domaine'] || edu['Spécialisation']) && (
                                        <p className="text-gray-700 text-sm mt-1">{edu.field || edu['Spécialisation/Domaine'] || edu['Spécialisation']}</p>
                                      )}
                                      <p className="text-gray-600 text-sm mt-1">{edu['Établissement'] || edu['Nom de l\'établissement'] || edu.school || edu.institution || '-'}</p>
                                      <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {edu['Année d\'obtention'] || edu.start_date || edu.year || '-'} {(edu['Année de fin'] || edu.end_date) && `- ${edu['Année de fin'] || edu.end_date}`}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Langues et Permis de conduire côte à côte */}
                        {((candidateProfile.languages && Array.isArray(candidateProfile.languages) && candidateProfile.languages.length > 0) ||
                          (candidateProfile.driving_license && candidateProfile.driving_license.length > 0)) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Langues */}
                            {candidateProfile.languages && Array.isArray(candidateProfile.languages) && candidateProfile.languages.length > 0 && (
                              <div className="bg-white border border-gray-200 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                                    <MessageCircle className="w-6 h-6 text-pink-600" />
                                  </div>
                                  <h3 className="text-lg font-bold text-gray-900">Langues</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  {candidateProfile.languages.map((lang: any, index: number) => (
                                    <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                      <p className="font-medium text-gray-900">{lang.language}</p>
                                      <p className="text-sm text-gray-600">{lang.level}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Permis de conduire */}
                            {candidateProfile.driving_license && candidateProfile.driving_license.length > 0 && (
                              <div className="bg-white border border-gray-200 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <Award className="w-6 h-6 text-yellow-600" />
                                  </div>
                                  <h3 className="text-lg font-bold text-gray-900">Permis de conduire</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {candidateProfile.driving_license.map((license: string, index: number) => (
                                    <span key={index} className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium border border-yellow-200">
                                      Permis {license}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Liens */}
                        {(candidateProfile.linkedin_url || candidateProfile.portfolio_url || candidateProfile.github_url || (candidateProfile.other_urls && candidateProfile.other_urls.length > 0)) && (
                          <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <Share2 className="w-6 h-6 text-indigo-600" />
                              </div>
                              <h3 className="text-lg font-bold text-gray-900">Liens et réseaux</h3>
                            </div>
                            <div className="space-y-2">
                              {candidateProfile.linkedin_url && (
                                <a
                                  href={candidateProfile.linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  <Share2 className="w-4 h-4" />
                                  LinkedIn
                                </a>
                              )}
                              {candidateProfile.portfolio_url && (
                                <a
                                  href={candidateProfile.portfolio_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  <Share2 className="w-4 h-4" />
                                  Portfolio
                                </a>
                              )}
                              {candidateProfile.github_url && (
                                <a
                                  href={candidateProfile.github_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  <Share2 className="w-4 h-4" />
                                  GitHub
                                </a>
                              )}
                              {candidateProfile.other_urls && candidateProfile.other_urls.length > 0 && candidateProfile.other_urls.map((url: string, index: number) => (
                                <a
                                  key={index}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  <Share2 className="w-4 h-4" />
                                  Autre lien {index + 1}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Documents */}
                        {(candidateProfile.cv_url || candidateProfile.cover_letter_url || candidateProfile.certificates_url) && (
                          <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-gray-600" />
                              </div>
                              <h3 className="text-lg font-bold text-gray-900">Documents</h3>
                            </div>
                            <div className="space-y-2">
                              {candidateProfile.cv_url && (
                                <a
                                  href={candidateProfile.cv_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  <FileText className="w-4 h-4" />
                                  Curriculum Vitae (CV)
                                </a>
                              )}
                              {candidateProfile.cover_letter_url && (
                                <a
                                  href={candidateProfile.cover_letter_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  <FileText className="w-4 h-4" />
                                  Lettre de motivation
                                </a>
                              )}
                              {candidateProfile.certificates_url && (
                                <a
                                  href={candidateProfile.certificates_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  <FileText className="w-4 h-4" />
                                  Certificats
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Préférences de profil */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                              <Settings className="w-6 h-6 text-indigo-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Préférences du profil</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-500">Visible dans la CVThèque</label>
                              <p className="text-gray-900 font-medium mt-1">
                                {candidateProfile.visible_in_cvtheque ? (
                                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm border border-green-200">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Profil public - Visible par les recruteurs
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-sm border border-gray-200">
                                    <X className="w-4 h-4" />
                                    Profil privé
                                  </span>
                                )}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Alertes emploi</label>
                              <p className="text-gray-900 font-medium mt-1">
                                {candidateProfile.receive_alerts ? (
                                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200">
                                    <Bell className="w-4 h-4" />
                                    Notifications activées
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-sm border border-gray-200">
                                    <BellOff className="w-4 h-4" />
                                    Notifications désactivées
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
              <JobAlertsManager />
            )}

            {activeTab === 'messages' && (
              <CandidateMessaging />
            )}

            {activeTab === 'documents' && (
              <DocumentsHub />
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

                <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 rounded-2xl p-8 border border-orange-200">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#FF8C00] to-yellow-600 rounded-2xl mb-4 shadow-lg">
                      <Crown className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">Premium PRO+</h3>
                    <p className="text-gray-600">
                      Accès illimité à tous les services IA sans consommer de crédits
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Services IA</div>
                          <div className="text-sm text-gray-600">Illimités</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-green-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Shield className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Cloud 10 Go</div>
                          <div className="text-sm text-gray-600">Sécurisé</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-purple-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Support 24/7</div>
                          <div className="text-sm text-gray-600">Prioritaire</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-yellow-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Award className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Badge vérifié</div>
                          <div className="text-sm text-gray-600">Profil premium</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 mb-6 text-center border-2 border-orange-200">
                    <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF8C00] to-red-600 mb-2">
                      350 000 GNF
                    </div>
                    <p className="text-gray-600">par mois • Sans engagement</p>
                  </div>

                  <button
                    onClick={() => onNavigate('premium-subscribe')}
                    className="w-full px-8 py-4 bg-gradient-to-r from-[#FF8C00] via-orange-500 to-red-500 hover:from-[#e67e00] hover:via-orange-600 hover:to-red-600 text-white font-semibold text-lg rounded-xl transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <Crown className="w-5 h-5" />
                    S'abonner maintenant
                  </button>
                  <p className="text-sm text-gray-600 text-center mt-4">
                    Paiement par Orange Money • Validation rapide par WhatsApp
                  </p>
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

      {/* Notification de reprise de candidature */}
      {shouldShowApplicationModal && pendingApplication && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-slide-up">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-green-500 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-500 p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-bold text-lg">Profil Complété !</h4>
                  <p className="text-green-100 text-sm">Vous pouvez maintenant postuler</p>
                </div>
                <button
                  onClick={clearPendingApplication}
                  className="p-1 hover:bg-white/20 rounded transition"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-5">
              <div className="mb-4">
                <p className="text-gray-700 font-semibold mb-1">
                  {pendingApplication.jobTitle}
                </p>
                <p className="text-sm text-gray-600">
                  {pendingApplication.companyName}
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800">
                    Votre profil contient maintenant toutes les informations requises pour cette offre.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={clearPendingApplication}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition"
                >
                  Plus tard
                </button>
                <button
                  onClick={() => {
                    clearPendingApplication();
                    onNavigate('job-detail', pendingApplication.jobId);
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Postuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Tracking Modal */}
      {trackingApplicationId && (
        <ApplicationTrackingModal
          applicationId={trackingApplicationId}
          onClose={() => setTrackingApplicationId(null)}
        />
      )}
    </div>
    </ProtectedPageWrapper>
  );
}
