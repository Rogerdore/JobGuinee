export const APPLY_FLOW_MESSAGES = {
  auth: {
    title: 'Connectez-vous pour postuler',
    description: 'Créez un compte ou connectez-vous pour envoyer votre candidature en 1 minute.',
    createAccountButton: 'Créer un compte et continuer',
    loginButton: 'Se connecter',
    cancelButton: 'Annuler',
    benefits: [
      'Candidatures en un clic',
      'Suivi de vos candidatures en temps réel',
      'Alertes emploi personnalisées',
      'Profil visible dans la CVthèque',
      'Accès aux services IA Premium'
    ]
  },

  application: {
    title: 'Postuler à l\'offre',
    subtitle: 'Vos informations sont pré-remplies. Vérifiez et complétez si nécessaire.',
    cvSection: {
      title: 'Curriculum Vitae',
      useExisting: 'Utiliser mon CV actuel',
      uploadNew: 'Uploader un nouveau CV',
      selectFromDocuments: 'Choisir depuis mes documents',
      noCV: 'Aucun CV enregistré',
      required: 'Le CV est obligatoire'
    },
    coverLetterSection: {
      title: 'Lettre de motivation',
      required: 'Lettre de motivation requise pour cette offre',
      optional: 'Lettre de motivation (optionnelle)',
      uploadFile: 'Uploader une lettre',
      selectFromDocuments: 'Choisir depuis mes documents',
      writeNew: 'Rédiger maintenant',
      useAI: 'Générer avec l\'IA',
      placeholder: 'Écrivez votre lettre de motivation ici...'
    },
    personalInfo: {
      title: 'Informations personnelles',
      firstName: 'Prénom',
      lastName: 'Nom',
      email: 'Email',
      phone: 'Téléphone',
      address: 'Adresse',
      location: 'Localisation'
    },
    buttons: {
      submit: 'Envoyer ma candidature',
      submitting: 'Envoi en cours...',
      cancel: 'Annuler',
      back: 'Retour',
      next: 'Suivant'
    }
  },

  success: {
    title: 'Votre candidature a bien été envoyée 🎉',
    subtitle: 'Un email de confirmation vous a été envoyé.',
    reference: 'Référence',
    nextSteps: {
      title: 'Prochaines étapes',
      track: 'Suivez l\'évolution de votre candidature dans votre tableau de bord',
      notifications: 'Vous serez notifié(e) par email à chaque étape',
      response: 'Le recruteur vous contactera sous 5 à 10 jours'
    },
    profileCTA: {
      title: 'Augmentez vos chances de recrutement',
      subtitle: 'Complétez votre profil à 80% pour maximiser vos chances d\'être recruté.',
      benefits: [
        {
          icon: 'eye',
          title: 'Visibilité maximale',
          description: 'Votre profil apparaît en priorité dans la CVthèque'
        },
        {
          icon: 'target',
          title: 'Matching précis',
          description: 'Nos algorithmes vous proposeront les meilleures offres'
        },
        {
          icon: 'star',
          title: 'Badge Premium',
          description: 'Obtenez un badge "Profil vérifié" qui rassure les recruteurs'
        },
        {
          icon: 'zap',
          title: 'Réponse rapide',
          description: 'Les profils complets reçoivent 50% de réponses en plus'
        }
      ],
      currentCompletion: 'Votre profil est complété à',
      missingElements: 'Éléments manquants',
      suggestions: [
        'Ajoutez votre expérience professionnelle complète',
        'Listez vos compétences clés et certifications',
        'Précisez votre localisation et disponibilité',
        'Ajoutez vos diplômes et formations',
        'Uploadez des documents supplémentaires'
      ],
      buttons: {
        completeProfile: 'Compléter mon profil maintenant',
        viewDashboard: 'Voir mon tableau de bord',
        discoverPremium: 'Découvrir les options Premium',
        later: 'Plus tard'
      }
    },
    buttons: {
      close: 'Fermer',
      viewApplications: 'Voir mes candidatures',
      backToJobs: 'Retour aux offres'
    }
  },

  errors: {
    notCandidate: {
      title: 'Accès réservé aux candidats',
      message: 'Seuls les candidats peuvent postuler aux offres d\'emploi. Votre compte est configuré en tant que recruteur ou formateur.',
      action: 'Si vous souhaitez changer de profil, contactez le support.'
    },
    missingInfo: {
      title: 'Informations incomplètes',
      message: 'Certaines informations obligatoires sont manquantes pour soumettre votre candidature.',
      fields: {
        firstName: 'Prénom requis',
        lastName: 'Nom requis',
        email: 'Email requis',
        phone: 'Téléphone requis',
        cv: 'CV requis',
        coverLetter: 'Lettre de motivation requise pour cette offre'
      }
    },
    uploadFailed: {
      title: 'Échec de l\'upload',
      message: 'Une erreur est survenue lors de l\'upload de vos documents. Veuillez réessayer.',
      retry: 'Réessayer'
    },
    submissionFailed: {
      title: 'Échec de l\'envoi',
      message: 'Votre candidature n\'a pas pu être envoyée. Veuillez vérifier votre connexion et réessayer.',
      retry: 'Réessayer'
    },
    alreadyApplied: {
      title: 'Candidature déjà envoyée',
      message: 'Vous avez déjà postulé à cette offre.',
      viewStatus: 'Voir le statut'
    }
  },

  validation: {
    emailInvalid: 'Format d\'email invalide',
    phoneInvalid: 'Format de téléphone invalide',
    fileTooLarge: 'Le fichier est trop volumineux (max 5 MB)',
    fileTypeInvalid: 'Type de fichier non supporté',
    requiredField: 'Ce champ est obligatoire'
  },

  tips: {
    cv: [
      'Format PDF recommandé pour une meilleure compatibilité',
      'Incluez vos expériences les plus récentes',
      'Mentionnez vos compétences techniques et soft skills'
    ],
    coverLetter: [
      'Personnalisez votre lettre pour chaque offre',
      'Expliquez pourquoi vous êtes le candidat idéal',
      'Restez concis : 250-300 mots suffisent'
    ],
    profile: [
      'Un profil photo professionnel augmente vos chances de 40%',
      'Actualisez régulièrement votre statut de disponibilité',
      'Activez les alertes pour ne manquer aucune opportunité'
    ]
  }
} as const;

export const PROFILE_COMPLETION_THRESHOLDS = {
  low: 30,
  medium: 50,
  good: 70,
  excellent: 80,
  perfect: 100
} as const;

export const PROFILE_COMPLETION_MESSAGES = {
  low: {
    level: 'Débutant',
    color: 'red',
    message: 'Votre profil manque d\'informations essentielles',
    urgency: 'high'
  },
  medium: {
    level: 'En cours',
    color: 'orange',
    message: 'Bon début ! Continuez pour augmenter votre visibilité',
    urgency: 'medium'
  },
  good: {
    level: 'Bien',
    color: 'yellow',
    message: 'Profil solide. Quelques détails en plus le rendront excellent',
    urgency: 'low'
  },
  excellent: {
    level: 'Excellent',
    color: 'green',
    message: 'Profil très complet ! Vous êtes hautement visible',
    urgency: 'none'
  },
  perfect: {
    level: 'Parfait',
    color: 'green',
    message: 'Profil exemplaire ! Vous maximisez vos chances',
    urgency: 'none'
  }
} as const;

export function getProfileCompletionLevel(percentage: number) {
  if (percentage >= PROFILE_COMPLETION_THRESHOLDS.perfect) return 'perfect';
  if (percentage >= PROFILE_COMPLETION_THRESHOLDS.excellent) return 'excellent';
  if (percentage >= PROFILE_COMPLETION_THRESHOLDS.good) return 'good';
  if (percentage >= PROFILE_COMPLETION_THRESHOLDS.medium) return 'medium';
  return 'low';
}

export function getProfileCompletionMessage(percentage: number) {
  const level = getProfileCompletionLevel(percentage);
  return PROFILE_COMPLETION_MESSAGES[level];
}
