import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Auth Required Modal
    'auth.title': 'Créez votre compte pour postuler',
    'auth.subtitle': 'Rejoignez des milliers de professionnels guinéens',
    'auth.benefit1': 'Accès à toutes les offres d\'emploi',
    'auth.benefit2': 'CV et lettres de motivation générés par IA',
    'auth.benefit3': 'Candidatures en un clic',
    'auth.benefit4': 'Suivi de vos candidatures en temps réel',
    'auth.signup': 'Créer mon compte',
    'auth.login': 'Se connecter',
    'auth.hasAccount': 'Vous avez déjà un compte ?',

    // Application Success Modal
    'app_success.title': 'Candidature envoyée !',
    'app_success.reference': 'Référence de candidature',
    'app_success.keep_reference': 'Conservez ce numéro pour suivre votre candidature',
    'app_success.next_steps': 'Prochaines étapes',
    'app_success.email_sent': 'Un email de confirmation vous a été envoyé',
    'app_success.complete_profile': 'Compléter mon profil',
    'app_success.view_applications': 'Voir mes candidatures',
    'app_success.view_more_jobs': 'Voir d\'autres offres',
    'app_success.profile_incomplete': 'Votre profil est complété à {percentage}%',
    'app_success.boost_visibility': 'Complétez votre profil pour augmenter vos chances de 200%',

    // Diffusion Proposal Modal
    'diffusion.title': 'Boostez votre offre avec la Diffusion Ciblée',
    'diffusion.subtitle': 'Atteignez les meilleurs candidats en 24h',
    'diffusion.benefit1': '+200% de candidatures qualifiées',
    'diffusion.benefit2': 'Filtrage automatique par IA',
    'diffusion.benefit3': 'Notifications aux profils compatibles',
    'diffusion.benefit4': 'Rapport détaillé des performances',
    'diffusion.how_it_works': 'Comment ça marche ?',
    'diffusion.step1': 'Notre IA analyse votre offre',
    'diffusion.step2': 'Identification des candidats compatibles',
    'diffusion.step3': 'Envoi de notifications personnalisées',
    'diffusion.step4': 'Réception de candidatures pré-qualifiées',
    'diffusion.start': 'Lancer la diffusion ciblée',
    'diffusion.later': 'Plus tard',

    // Profile Completion
    'profile.complete': 'Complétion du profil',
    'profile.complete_now': 'Compléter maintenant',
    'profile.unlocked': 'Profil complet débloqué',
    'profile.all_services': 'Vous avez accès à tous les services',
    'profile.more_visible': 'Un profil à 80% est 3x plus visible',
    'profile.unlock_services': 'Complétez pour débloquer les services avancés',

    // Common
    'common.close': 'Fermer',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.continue': 'Continuer',
    'common.loading': 'Chargement...',

    // Celebration
    'celebrate.title': 'Félicitations !',
    'celebrate.subtitle': 'Votre profil est complet à 100%',
    'celebrate.visibility': 'Votre profil est maintenant 3x plus visible !',
    'celebrate.unlocked': 'Vous avez débloqué toutes les fonctionnalités',
  },
  en: {
    // Auth Required Modal
    'auth.title': 'Create your account to apply',
    'auth.subtitle': 'Join thousands of Guinean professionals',
    'auth.benefit1': 'Access to all job offers',
    'auth.benefit2': 'AI-generated resumes and cover letters',
    'auth.benefit3': 'One-click applications',
    'auth.benefit4': 'Real-time application tracking',
    'auth.signup': 'Create account',
    'auth.login': 'Log in',
    'auth.hasAccount': 'Already have an account?',

    // Application Success Modal
    'app_success.title': 'Application sent!',
    'app_success.reference': 'Application reference',
    'app_success.keep_reference': 'Keep this number to track your application',
    'app_success.next_steps': 'Next steps',
    'app_success.email_sent': 'A confirmation email has been sent to you',
    'app_success.complete_profile': 'Complete my profile',
    'app_success.view_applications': 'View my applications',
    'app_success.view_more_jobs': 'View more jobs',
    'app_success.profile_incomplete': 'Your profile is {percentage}% complete',
    'app_success.boost_visibility': 'Complete your profile to increase your chances by 200%',

    // Diffusion Proposal Modal
    'diffusion.title': 'Boost your offer with Targeted Distribution',
    'diffusion.subtitle': 'Reach the best candidates in 24h',
    'diffusion.benefit1': '+200% qualified applications',
    'diffusion.benefit2': 'Automatic AI filtering',
    'diffusion.benefit3': 'Notifications to compatible profiles',
    'diffusion.benefit4': 'Detailed performance report',
    'diffusion.how_it_works': 'How it works?',
    'diffusion.step1': 'Our AI analyzes your offer',
    'diffusion.step2': 'Identification of compatible candidates',
    'diffusion.step3': 'Sending personalized notifications',
    'diffusion.step4': 'Reception of pre-qualified applications',
    'diffusion.start': 'Start targeted distribution',
    'diffusion.later': 'Later',

    // Profile Completion
    'profile.complete': 'Profile completion',
    'profile.complete_now': 'Complete now',
    'profile.unlocked': 'Complete profile unlocked',
    'profile.all_services': 'You have access to all services',
    'profile.more_visible': 'An 80% profile is 3x more visible',
    'profile.unlock_services': 'Complete to unlock advanced services',

    // Common
    'common.close': 'Close',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.continue': 'Continue',
    'common.loading': 'Loading...',

    // Celebration
    'celebrate.title': 'Congratulations!',
    'celebrate.subtitle': 'Your profile is 100% complete',
    'celebrate.visibility': 'Your profile is now 3x more visible!',
    'celebrate.unlocked': 'You unlocked all features',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && ['fr', 'en'].includes(savedLang)) {
      setLanguageState(savedLang);
    } else {
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('fr')) {
        setLanguageState('fr');
      } else {
        setLanguageState('en');
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string, fallback?: string): string => {
    const translation = translations[language][key];
    if (translation) {
      return translation;
    }
    if (fallback) {
      return fallback;
    }
    console.warn(`Translation missing for key: ${key} in language: ${language}`);
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function interpolate(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return values[key] !== undefined ? String(values[key]) : match;
  });
}
