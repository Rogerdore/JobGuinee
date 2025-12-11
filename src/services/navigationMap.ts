export interface NavigationIntent {
  key: string;
  route: string;
  displayName: string;
  description: string;
  labels: string[];
  category: 'main' | 'dashboard' | 'ai-services' | 'premium' | 'admin' | 'profile';
  requiresAuth?: boolean;
  requiresPremium?: boolean;
  requiresAdmin?: boolean;
  userTypes?: ('candidate' | 'recruiter' | 'trainer' | 'admin')[];
}

export const NAVIGATION_MAP: Record<string, NavigationIntent> = {
  home: {
    key: 'home',
    route: 'home',
    displayName: 'Accueil',
    description: 'Page d\'accueil de JobGuinée',
    labels: ['accueil', 'home', 'page d\'accueil', 'retour accueil', 'retourner à l\'accueil'],
    category: 'main'
  },

  jobs: {
    key: 'jobs',
    route: 'jobs',
    displayName: 'Offres d\'emploi',
    description: 'Consulter toutes les offres d\'emploi disponibles',
    labels: [
      'offres', 'offres d\'emploi', 'emplois', 'jobs', 'postes',
      'rechercher un emploi', 'trouver un emploi', 'voir les offres',
      'opportunités', 'vacances', 'recrutement'
    ],
    category: 'main'
  },

  cvtheque: {
    key: 'cvtheque',
    route: 'cvtheque',
    displayName: 'CVthèque',
    description: 'Base de données de CV de candidats',
    labels: [
      'cvthèque', 'cvtheque', 'base de cv', 'talents',
      'chercher des candidats', 'trouver des profils'
    ],
    category: 'main',
    requiresAuth: true,
    userTypes: ['recruiter', 'admin']
  },

  formations: {
    key: 'formations',
    route: 'formations',
    displayName: 'Formations',
    description: 'Découvrir les formations disponibles',
    labels: [
      'formations', 'formation', 'cours', 'apprentissage',
      'se former', 'apprendre', 'développer mes compétences'
    ],
    category: 'main'
  },

  blog: {
    key: 'blog',
    route: 'blog',
    displayName: 'Blog',
    description: 'Articles et conseils carrière',
    labels: ['blog', 'articles', 'conseils', 'actualités', 'news'],
    category: 'main'
  },

  candidateDashboard: {
    key: 'candidateDashboard',
    route: 'candidate-dashboard',
    displayName: 'Tableau de bord candidat',
    description: 'Votre espace personnel candidat',
    labels: [
      'dashboard', 'tableau de bord', 'mon espace', 'mon compte',
      'espace candidat', 'mon dashboard', 'mes candidatures',
      'mes offres sauvegardées', 'mes alertes'
    ],
    category: 'dashboard',
    requiresAuth: true,
    userTypes: ['candidate']
  },

  recruiterDashboard: {
    key: 'recruiterDashboard',
    route: 'recruiter-dashboard',
    displayName: 'Tableau de bord recruteur',
    description: 'Votre espace recruteur',
    labels: [
      'dashboard recruteur', 'espace recruteur', 'mes offres',
      'gérer mes offres', 'mes candidatures reçues', 'analytics'
    ],
    category: 'dashboard',
    requiresAuth: true,
    userTypes: ['recruiter']
  },

  trainerDashboard: {
    key: 'trainerDashboard',
    route: 'trainer-dashboard',
    displayName: 'Tableau de bord formateur',
    description: 'Votre espace formateur',
    labels: [
      'dashboard formateur', 'espace formateur', 'mes formations',
      'gérer mes formations', 'mes apprenants'
    ],
    category: 'dashboard',
    requiresAuth: true,
    userTypes: ['trainer']
  },

  profile: {
    key: 'profile',
    route: 'candidate-profile-form',
    displayName: 'Mon profil',
    description: 'Modifier et compléter votre profil professionnel',
    labels: [
      'profil', 'mon profil', 'modifier mon profil', 'éditer profil',
      'compléter profil', 'mettre à jour profil', 'informations personnelles'
    ],
    category: 'profile',
    requiresAuth: true,
    userTypes: ['candidate']
  },

  premiumSubscribe: {
    key: 'premiumSubscribe',
    route: 'premium-subscribe',
    displayName: 'Abonnement Premium',
    description: 'Passer à Premium PRO+ pour un accès illimité',
    labels: [
      'premium', 'abonnement', 'passer premium', 'devenir premium',
      'pro+', 'premium pro+', 's\'abonner', 'forfait premium',
      'accès illimité', 'upgrade'
    ],
    category: 'premium'
  },

  premiumAI: {
    key: 'premiumAI',
    route: 'premium-ai',
    displayName: 'Services IA Premium',
    description: 'Tous les services d\'intelligence artificielle',
    labels: [
      'services ia', 'services premium', 'services d\'ia',
      'intelligence artificielle', 'outils ia', 'hub ia'
    ],
    category: 'ai-services',
    requiresAuth: true
  },

  aiCVGenerator: {
    key: 'aiCVGenerator',
    route: 'ai-cv-generator',
    displayName: 'Générateur de CV IA',
    description: 'Créer un CV professionnel avec l\'IA',
    labels: [
      'cv ia', 'générer cv', 'créer cv', 'cv intelligent',
      'générateur cv', 'créer mon cv', 'faire un cv',
      'cv automatique', 'cv avec ia'
    ],
    category: 'ai-services',
    requiresAuth: true
  },

  aiCoverLetter: {
    key: 'aiCoverLetter',
    route: 'ai-cover-letter',
    displayName: 'Générateur de lettre de motivation IA',
    description: 'Créer une lettre de motivation percutante',
    labels: [
      'lettre motivation', 'lettre ia', 'générer lettre',
      'créer lettre motivation', 'lettre de motivation intelligente',
      'cover letter', 'motivation ia'
    ],
    category: 'ai-services',
    requiresAuth: true
  },

  aiMatching: {
    key: 'aiMatching',
    route: 'ai-matching',
    displayName: 'Matching IA',
    description: 'Analyser votre compatibilité avec une offre',
    labels: [
      'matching', 'compatibilité', 'analyser offre',
      'matching ia', 'voir ma compatibilité', 'analyse offre',
      'score de compatibilité'
    ],
    category: 'ai-services',
    requiresAuth: true
  },

  aiCareerPlan: {
    key: 'aiCareerPlan',
    route: 'ai-career-plan',
    displayName: 'Plan de carrière IA',
    description: 'Obtenir un plan de carrière personnalisé',
    labels: [
      'plan carrière', 'carrière ia', 'évolution carrière',
      'plan de développement', 'conseils carrière', 'trajectoire professionnelle'
    ],
    category: 'ai-services',
    requiresAuth: true
  },

  aiCoach: {
    key: 'aiCoach',
    route: 'ai-coach',
    displayName: 'Coach IA',
    description: 'Coaching professionnel personnalisé par IA',
    labels: [
      'coach', 'coach ia', 'coaching', 'mentor ia',
      'conseils personnalisés', 'accompagnement carrière'
    ],
    category: 'ai-services',
    requiresAuth: true
  },

  aiInterviewSimulator: {
    key: 'aiInterviewSimulator',
    route: 'ai-interview-simulator',
    displayName: 'Simulateur d\'entretien IA',
    description: 'Préparer vos entretiens avec des simulations',
    labels: [
      'simulateur entretien', 'simulation entretien', 'entretien ia',
      'préparer entretien', 'entrainement entretien', 'mock interview'
    ],
    category: 'ai-services',
    requiresAuth: true
  },

  aiAlerts: {
    key: 'aiAlerts',
    route: 'ai-alerts',
    displayName: 'Alertes IA',
    description: 'Gérer vos alertes emploi intelligentes',
    labels: [
      'alertes', 'alertes ia', 'notifications emploi',
      'mes alertes', 'configurer alertes', 'alertes intelligentes'
    ],
    category: 'ai-services',
    requiresAuth: true
  },

  aiChat: {
    key: 'aiChat',
    route: 'ai-chat',
    displayName: 'Chat IA',
    description: 'Discuter avec l\'assistant IA',
    labels: [
      'chat ia', 'discuter ia', 'assistant ia',
      'conversation ia', 'parler avec ia'
    ],
    category: 'ai-services',
    requiresAuth: true
  },

  goldProfile: {
    key: 'goldProfile',
    route: 'gold-profile',
    displayName: 'Profil Gold',
    description: 'Service de création de profil premium optimisé',
    labels: [
      'profil gold', 'gold profile', 'profil premium',
      'optimiser profil', 'profil optimisé'
    ],
    category: 'ai-services',
    requiresAuth: true
  },

  creditStore: {
    key: 'creditStore',
    route: 'credit-store',
    displayName: 'Boutique de crédits',
    description: 'Acheter des crédits IA',
    labels: [
      'crédits', 'acheter crédits', 'boutique crédits',
      'acheter des crédits', 'recharger crédits', 'packs de crédits',
      'crédits ia', 'store'
    ],
    category: 'premium',
    requiresAuth: true
  },

  cmsAdmin: {
    key: 'cmsAdmin',
    route: 'cms-admin',
    displayName: 'Administration CMS',
    description: 'Gérer le contenu du site',
    labels: [
      'cms', 'admin cms', 'administration', 'gestion contenu',
      'panneau admin'
    ],
    category: 'admin',
    requiresAuth: true,
    requiresAdmin: true,
    userTypes: ['admin']
  },

  userManagement: {
    key: 'userManagement',
    route: 'user-management',
    displayName: 'Gestion des utilisateurs',
    description: 'Administrer les comptes utilisateurs',
    labels: [
      'utilisateurs', 'gestion utilisateurs', 'admin users',
      'gérer utilisateurs', 'comptes'
    ],
    category: 'admin',
    requiresAuth: true,
    requiresAdmin: true,
    userTypes: ['admin']
  },

  adminCreditsIA: {
    key: 'adminCreditsIA',
    route: 'admin-credits-ia',
    displayName: 'Gestion des crédits IA',
    description: 'Administrer les crédits et transactions',
    labels: [
      'admin crédits', 'gestion crédits', 'crédits ia admin'
    ],
    category: 'admin',
    requiresAuth: true,
    requiresAdmin: true,
    userTypes: ['admin']
  },

  adminChatbot: {
    key: 'adminChatbot',
    route: 'admin-chatbot',
    displayName: 'Configuration Chatbot',
    description: 'Configurer le chatbot et ses réponses',
    labels: [
      'admin chatbot', 'configurer chatbot', 'paramètres chatbot'
    ],
    category: 'admin',
    requiresAuth: true,
    requiresAdmin: true,
    userTypes: ['admin']
  }
};

export const NAVIGATION_CATEGORIES = {
  main: 'Navigation principale',
  dashboard: 'Tableaux de bord',
  'ai-services': 'Services IA',
  premium: 'Premium',
  profile: 'Profil',
  admin: 'Administration'
};

export function getAllNavigationIntents(): NavigationIntent[] {
  return Object.values(NAVIGATION_MAP);
}

export function getNavigationIntentsByCategory(category: string): NavigationIntent[] {
  return Object.values(NAVIGATION_MAP).filter(intent => intent.category === category);
}

export function getNavigationIntentForUserType(userType: string): NavigationIntent[] {
  return Object.values(NAVIGATION_MAP).filter(intent => {
    if (!intent.userTypes) return true;
    return intent.userTypes.includes(userType as any);
  });
}
